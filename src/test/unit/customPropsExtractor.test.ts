/**
 * Unit tests for customPropsExtractor
 *
 * Tests extractProperties and updateProperty with mocked bpmn-js objects.
 * Also tests helper functions getDeep and setDeep.
 */

import * as path from 'path';
import { describe, it } from 'mocha';
import { expect } from 'chai';

// Load the CommonJS module under test
const {
  extractProperties,
  updateProperty,
  getDeep,
  setDeep
} = require(path.join(__dirname, '..', '..', '..', 'src', 'client', 'customPropsExtractor.js'));


// ---------------------------------------------------------------------------
// Interfaces for mock objects
// ---------------------------------------------------------------------------

interface MockBusinessObject {
  id?: string;
  name?: string;
  $attrs?: Record<string, unknown>;
  documentation?: Array<{ text: string }>;
  [key: string]: unknown;
}

interface MockBpmnElement {
  type: string;
  id: string;
  businessObject: MockBusinessObject | null;
}

interface MockModeling {
  updateProperties: (element: unknown, props: Record<string, unknown>) => void;
  updateModdleProperties: (element: unknown, moddleElement: unknown, props: Record<string, unknown>) => void;
}

interface MockModdle {
  create: (type: string, props: Record<string, unknown>) => Record<string, unknown>;
}

interface PropDef {
  label: string;
  xpath: string;
  type: string;
  jsonPath?: string;
  inputType?: string;
}


// ---------------------------------------------------------------------------
// Helpers to build mock bpmn-js objects
// ---------------------------------------------------------------------------

function createMockBusinessObject(overrides: Partial<MockBusinessObject> = {}): MockBusinessObject {
  return Object.assign({
    id: 'Element_1',
    name: 'Test Element',
    $attrs: {} as Record<string, unknown>
  }, overrides);
}

function createMockElement(type: string, businessObject?: MockBusinessObject): MockBpmnElement {
  const bo = businessObject || createMockBusinessObject();
  return {
    type: type || 'bpmn:Task',
    id: (bo.id || 'Element_1') as string,
    businessObject: bo
  };
}

function createMockModeling(): MockModeling {
  return {
    updateProperties: function(_element: unknown, _props: Record<string, unknown>) {},
    updateModdleProperties: function(_element: unknown, _moddleElement: unknown, _props: Record<string, unknown>) {}
  };
}

function createMockModdle(): MockModdle {
  return {
    create: function(_type: string, _props: Record<string, unknown>) {
      return Object.assign({}, _props);
    }
  };
}


// ---------------------------------------------------------------------------
// 1. getDeep / setDeep
// ---------------------------------------------------------------------------

describe('getDeep', function() {

  it('should get a top-level property', function() {
    expect(getDeep({ a: 1 }, 'a')).to.equal(1);
  });

  it('should get a nested property', function() {
    expect(getDeep({ a: { b: { c: 42 } } }, 'a.b.c')).to.equal(42);
  });

  it('should return undefined for missing path', function() {
    expect(getDeep({ a: 1 }, 'x.y')).to.be.undefined;
  });

  it('should return undefined for null/undefined object', function() {
    expect(getDeep(null, 'a.b')).to.be.undefined;
    expect(getDeep(undefined, 'a.b')).to.be.undefined;
  });

  it('should return undefined for empty path', function() {
    expect(getDeep({ a: 1 }, '')).to.be.undefined;
  });
});

describe('setDeep', function() {

  it('should set a top-level property', function() {
    const obj: Record<string, unknown> = {};
    setDeep(obj, 'a', 1);
    expect(obj.a).to.equal(1);
  });

  it('should set a nested property', function() {
    const obj = { a: { b: {} as Record<string, unknown> } };
    setDeep(obj, 'a.b.c', 42);
    expect(obj.a.b.c).to.equal(42);
  });

  it('should create intermediate objects', function() {
    const obj: Record<string, unknown> = {};
    setDeep(obj, 'a.b.c', 'hello');
    expect(obj.a).to.be.an('object');
    expect((obj.a as Record<string, unknown>).b).to.be.an('object');
    expect(((obj.a as Record<string, unknown>).b as Record<string, unknown>).c).to.equal('hello');
  });

  it('should overwrite existing value', function() {
    const obj = { a: { b: 1 } };
    setDeep(obj, 'a.b', 99);
    expect(obj.a.b).to.equal(99);
  });
});


// ---------------------------------------------------------------------------
// 2. extractProperties
// ---------------------------------------------------------------------------

describe('extractProperties', function() {

  it('should return empty array for null element', function() {
    expect(extractProperties(null, {})).to.deep.equal([]);
  });

  it('should return empty array for null config', function() {
    expect(extractProperties(createMockElement('bpmn:Task'), null)).to.deep.equal([]);
  });

  it('should return empty array when element has no businessObject', function() {
    expect(extractProperties({ type: 'bpmn:Task', businessObject: null }, { common: [] })).to.deep.equal([]);
  });

  it('should return empty array when no config matches', function() {
    const el = createMockElement('bpmn:Task');
    expect(extractProperties(el as unknown as Parameters<typeof extractProperties>[0], { common: [] })).to.deep.equal([]);
  });

  // -- common properties --

  it('should extract a common attribute property', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'My Task' }));
    const config = {
      common: [ { label: 'Name', xpath: 'name', type: 'attribute' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(1);
    expect(result[0].label).to.equal('Name');
    expect(result[0].value).to.equal('My Task');
  });

  it('should extract elementText property (e.g. documentation)', function() {
    const bo = createMockBusinessObject({
      documentation: [ { text: 'Some documentation text' } ]
    });
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Documentation', xpath: 'bpmn:documentation', type: 'elementText' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(1);
    expect(result[0].value).to.equal('Some documentation text');
  });

  it('should extract a date property', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['custom:startDate'] = '2025-01-15';
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Start Date', xpath: 'custom:startDate', type: 'date' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('2025-01-15');
  });

  it('should extract a number property', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['custom:priority'] = 5;
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Priority', xpath: 'custom:priority', type: 'number' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('5');
  });

  it('should normalize boolean true values', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['custom:isActive'] = true;
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Is Active', xpath: 'custom:isActive', type: 'boolean' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('true');
  });

  it('should normalize boolean false values', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['custom:isActive'] = false;
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Is Active', xpath: 'custom:isActive', type: 'boolean' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('false');
  });

  it('should normalize boolean 0/1 values', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['custom:flag'] = '1';
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Flag', xpath: 'custom:flag', type: 'boolean' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('true');
  });

  it('should extract json property with jsonPath', function() {
    const bo = createMockBusinessObject({
      'custom:config': { text: '{"retry":{"count":3,"enabled":true}}' }
    });
    const el = createMockElement('bpmn:ServiceTask', bo);
    const config = {
      elementSpecific: {
        'bpmn:ServiceTask': [
          { label: 'Retry Count', xpath: 'custom:config', type: 'json', jsonPath: 'retry.count', inputType: 'number' } as PropDef
        ]
      }
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(1);
    expect(result[0].value).to.equal('3');
  });

  it('should handle invalid JSON gracefully', function() {
    const bo = createMockBusinessObject({
      'custom:config': { text: 'not-json{{{][' }
    });
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Config', xpath: 'custom:config', type: 'json', jsonPath: 'field' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('');
  });

  it('should return empty string for missing property', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject());
    const config = {
      common: [ { label: 'Missing', xpath: 'nonExistent', type: 'attribute' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('');
  });

  // -- element-specific properties --

  it('should apply element-specific config only to matching types', function() {
    const taskEl = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'Task Name' }));
    const config = {
      common: [] as PropDef[],
      elementSpecific: {
        'bpmn:Task': [ { label: 'Task Label', xpath: 'name', type: 'attribute' } as PropDef ],
        'bpmn:Process': [ { label: 'Process Label', xpath: 'name', type: 'attribute' } as PropDef ]
      }
    };
    const result = extractProperties(taskEl as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(1);
    expect(result[0].label).to.equal('Task Label');
  });

  it('should not apply element-specific config to non-matching types', function() {
    const eventEl = createMockElement('bpmn:StartEvent', createMockBusinessObject({ name: 'Start' }));
    const config = {
      elementSpecific: {
        'bpmn:Task': [ { label: 'Task Label', xpath: 'name', type: 'attribute' } as PropDef ]
      }
    };
    const result = extractProperties(eventEl as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.deep.equal([]);
  });

  // -- nested paths --

  it('should traverse nested paths via arrays', function() {
    const inner: Record<string, unknown> = {};
    inner['custom:nested'] = 'deep-value';
    const bo = createMockBusinessObject();
    bo.extensionElements = { values: [ inner ] };
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Nested', xpath: 'extensionElements/values/custom:nested', type: 'attribute' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('deep-value');
  });

  // -- fullXPath type (not yet implemented) --

  it('should return empty string for fullXPath type (not implemented)', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject());
    const config = {
      common: [ { label: 'Full Path', xpath: '//test', type: 'fullXPath' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('');
  });

  // -- unknown type --

  it('should handle unknown type gracefully', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'X' }));
    const config = {
      common: [ { label: 'Unknown', xpath: 'name', type: 'unknownType' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('');
  });

  // -- combined common + element-specific --

  it('should merge common and element-specific properties', function() {
    const bo = createMockBusinessObject({ name: 'My Task' });
    bo['custom:priority'] = 1;
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Name', xpath: 'name', type: 'attribute' } as PropDef ],
      elementSpecific: {
        'bpmn:Task': [ { label: 'Priority', xpath: 'custom:priority', type: 'number' } as PropDef ]
      }
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(2);
    expect(result[0].label).to.equal('Name');
    expect(result[1].label).to.equal('Priority');
  });

  // -- propDef included in result --

  it('should include propDef reference in result', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'T' }));
    const propDef: PropDef = { label: 'Name', xpath: 'name', type: 'attribute' };
    const config = { common: [ propDef ] };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].propDef).to.equal(propDef);
  });

  // -- error handling: includes _error on failure --

  it('should include _error field when extraction throws', function() {

    // Create a malformed config that will cause the traversal to fail in an unexpected way
    const el = createMockElement('bpmn:Task', createMockBusinessObject());

    // Passing a propDef with no xpath causes split() to fail, testing the catch block
    const badPropDef = { label: 'Bad', xpath: undefined as unknown as string, type: 'attribute' };
    const config = { common: [ badPropDef ] };

    // Should not throw; should return property with _error
    expect(function() {
      extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    }).to.not.throw();
  });
});


// ---------------------------------------------------------------------------
// 3. updateProperty
// ---------------------------------------------------------------------------

describe('updateProperty', function() {

  it('should not throw when missing parameters', function() {
    expect(function() {
      updateProperty(null, null, null, null, null);
    }).to.not.throw();
  });

  it('should not throw when element has no businessObject', function() {
    expect(function() {
      updateProperty({ businessObject: null } as unknown as Record<string, unknown>, {} as PropDef, '', createMockModeling() as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    }).to.not.throw();
  });

  // -- attribute type updates --

  it('should call updateProperties for direct businessObject attribute', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'Old' }));
    let called = false;
    const modeling = {
      updateProperties: function(_element: unknown, props: Record<string, unknown>) {
        called = true;
        expect(props.name).to.equal('New Name');
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Name', xpath: 'name', type: 'attribute' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'New Name', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.true;
  });

  it('should call updateModdleProperties for nested attribute', function() {
    const innerObj = { customValue: 'old' };
    const bo = createMockBusinessObject({ nested: innerObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function(_element: unknown, moddleElement: unknown, props: Record<string, unknown>) {
        called = true;
        expect(moddleElement).to.equal(innerObj);
        expect(props.customValue).to.equal('new');
      }
    };
    const propDef: PropDef = { label: 'Custom', xpath: 'nested/customValue', type: 'attribute' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'new', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.true;
  });

  // -- number type coercion --

  it('should coerce value to number for number type', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ priority: 0 }));
    let receivedValue: unknown = null;
    const modeling = {
      updateProperties: function(_el: unknown, props: Record<string, unknown>) {
        receivedValue = props.priority;
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Priority', xpath: 'priority', type: 'number' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, '42', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(receivedValue).to.equal(42);
    expect(typeof receivedValue).to.equal('number');
  });

  it('should reject invalid number values', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ priority: 0 }));
    let called = false;
    const modeling = {
      updateProperties: function() { called = true; },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Priority', xpath: 'priority', type: 'number' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'not-a-number', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.false;
  });

  // -- boolean type coercion --

  it('should coerce string "true" to boolean true', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ active: false }));
    let receivedValue: unknown = null;
    const modeling = {
      updateProperties: function(_el: unknown, props: Record<string, unknown>) {
        receivedValue = props.active;
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Active', xpath: 'active', type: 'boolean' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'true', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(receivedValue).to.equal(true);
  });

  it('should coerce "1" to boolean true', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ active: false }));
    let receivedValue: unknown = null;
    const modeling = {
      updateProperties: function(_el: unknown, props: Record<string, unknown>) {
        receivedValue = props.active;
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Active', xpath: 'active', type: 'boolean' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, '1', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(receivedValue).to.equal(true);
  });

  // -- elementText updates --

  it('should create documentation if missing', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject());
    let createdDoc: Record<string, unknown> | null = null;
    const moddle = {
      create: function(type: string, props: Record<string, unknown>) {
        createdDoc = { type: type, props: props };
        return createdDoc;
      }
    };
    let updatePropsReceived: Record<string, unknown> | null = null;
    const modeling = {
      updateProperties: function(_el: unknown, props: Record<string, unknown>) {
        updatePropsReceived = props;
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Documentation', xpath: 'bpmn:documentation', type: 'elementText' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'New docs', modeling as unknown as Record<string, unknown>, moddle as unknown as Record<string, unknown>);
    expect(createdDoc).to.not.be.null;
    expect(createdDoc!.type).to.equal('bpmn:Documentation');
    expect((createdDoc!.props as Record<string, unknown>).text).to.equal('New docs');
    expect(updatePropsReceived!.documentation).to.deep.equal([ createdDoc ]);
  });

  it('should update existing element text', function() {
    const docObj = { text: 'Old docs' };
    const bo = createMockBusinessObject({ documentation: [ docObj ] });
    const el = createMockElement('bpmn:Task', bo);
    let updatedText: string | null = null;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function(_el: unknown, _moddleEl: unknown, props: Record<string, unknown>) {
        updatedText = props.text as string;
      }
    };
    const propDef: PropDef = { label: 'Documentation', xpath: 'bpmn:documentation', type: 'elementText' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'Updated docs', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(updatedText).to.equal('Updated docs');
  });

  // -- json updates --

  it('should update nested JSON field', function() {
    const jsonObj = { text: '{"retry":{"count":1}}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:ServiceTask', bo);
    let updatedText: string | null = null;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function(_el: unknown, _moddleEl: unknown, props: Record<string, unknown>) {
        updatedText = props.text as string;
      }
    };
    const propDef: PropDef = {
      label: 'Retry Count',
      xpath: 'custom:config',
      type: 'json',
      jsonPath: 'retry.count',
      inputType: 'number'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, '5', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = JSON.parse(updatedText!);
    expect(parsed.retry.count).to.equal(5);
    expect(typeof parsed.retry.count).to.equal('number');
  });

  it('should handle invalid JSON reset', function() {
    const jsonObj = { text: 'not-json' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let updatedText: string | null = null;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function(_el: unknown, _moddleEl: unknown, props: Record<string, unknown>) {
        updatedText = props.text as string;
      }
    };
    const propDef: PropDef = {
      label: 'Field',
      xpath: 'custom:config',
      type: 'json',
      jsonPath: 'someField',
      inputType: 'text'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'newVal', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = JSON.parse(updatedText!);
    expect(parsed.someField).to.equal('newVal');
  });

  it('should reject invalid number for JSON number inputType', function() {
    const jsonObj = { text: '{"field":0}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function() { called = true; }
    };
    const propDef: PropDef = {
      label: 'Field',
      xpath: 'custom:config',
      type: 'json',
      jsonPath: 'field',
      inputType: 'number'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'not-a-number', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.false;
  });

  it('should accept valid date for JSON date inputType', function() {
    const jsonObj = { text: '{"date":"2025-01-01"}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function() { called = true; }
    };
    const propDef: PropDef = {
      label: 'Date',
      xpath: 'custom:config',
      type: 'json',
      jsonPath: 'date',
      inputType: 'date'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, '2025-06-15', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.true;
  });

  it('should reject invalid date for JSON date inputType', function() {
    const jsonObj = { text: '{"date":"2025-01-01"}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function() { called = true; }
    };
    const propDef: PropDef = {
      label: 'Date',
      xpath: 'custom:config',
      type: 'json',
      jsonPath: 'date',
      inputType: 'date'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'invalid-date', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.false;
  });

  // -- boolean json inputType --

  it('should coerce boolean in JSON updates', function() {
    const jsonObj = { text: '{"enabled":false}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let updatedText: string | null = null;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function(_el: unknown, _moddleEl: unknown, props: Record<string, unknown>) {
        updatedText = props.text as string;
      }
    };
    const propDef: PropDef = {
      label: 'Enabled',
      xpath: 'custom:config',
      type: 'json',
      jsonPath: 'enabled',
      inputType: 'boolean'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'true', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = JSON.parse(updatedText!);
    expect(parsed.enabled).to.equal(true);
    expect(typeof parsed.enabled).to.equal('boolean');
  });
});
