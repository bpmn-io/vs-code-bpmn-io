/**
 * Unit tests for customPropsExtractor
 *
 * Tests extractProperties and updateProperty with mocked bpmn-js objects.
 * Also tests helper functions getDeep, setDeep, YAML parse/stringify, resolveModdlePath.
 */

import * as path from 'path';
import { describe, it } from 'mocha';
import { expect } from 'chai';

// Load the CommonJS module under test
const {
  extractProperties,
  updateProperty,
  getDeep,
  setDeep,
  _yamlParse,
  _yamlStringify,
  _resolveModdlePath,
  _parseEmbedded,
  _stringifyEmbedded
} = require(path.join(__dirname, '..', '..', '..', 'src', 'client', 'customPropsExtractor.js'));


// ---------------------------------------------------------------------------
// Interfaces for mock objects
// ---------------------------------------------------------------------------

interface MockBusinessObject {
  id?: string;
  name?: string;
  $attrs?: Record<string, unknown>;
  documentation?: Array<{ text: string }>;
  extensionElements?: { values?: Array<Record<string, unknown>> };
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
  path: string;
  source: string;
  control: string;
  format?: string;
  field?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  group?: string;
  order?: number;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  pattern?: string;
}


// ---------------------------------------------------------------------------
// Helpers
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

  it('should create intermediate objects', function() {
    const obj: Record<string, unknown> = {};
    setDeep(obj, 'a.b.c', 'hello');
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
// 2. YAML parse / stringify
// ---------------------------------------------------------------------------

describe('_yamlParse', function() {
  it('should parse simple key-value', function() {
    const result = _yamlParse('name: hello\nvalue: 42');
    expect(result.name).to.equal('hello');
    expect(result.value).to.equal(42);
  });

  it('should parse nested mappings', function() {
    const result = _yamlParse('service:\n  name: my-service\n  timeout: 30');
    expect(result.service.name).to.equal('my-service');
    expect(result.service.timeout).to.equal(30);
  });

  it('should parse sequences', function() {
    const result = _yamlParse('items:\n  - one\n  - two');
    expect(result.items).to.be.an('array');
    expect(result.items[0]).to.equal('one');
    expect(result.items[1]).to.equal('two');
  });

  it('should parse sequence items with inline values', function() {
    const result = _yamlParse('inputs:\n  - name: a\n  - name: b');
    expect(result.inputs).to.be.an('array');

    // Inline key:value in sequence items is kept as-is (simplified YAML parser)
    expect(result.inputs[0]).to.equal('name: a');
    expect(result.inputs[1]).to.equal('name: b');
  });

  it('should parse booleans', function() {
    const result = _yamlParse('flag: true\nother: false');
    expect(result.flag).to.equal(true);
    expect(result.other).to.equal(false);
  });

  it('should parse null', function() {
    const result = _yamlParse('value: null');
    expect(result.value).to.be.null;
  });

  it('should handle empty input', function() {
    expect(_yamlParse('')).to.deep.equal({});
    expect(_yamlParse(null)).to.deep.equal({});
  });
});

describe('_yamlStringify', function() {
  it('should stringify simple object', function() {
    const result = _yamlStringify({ name: 'test', count: 5 });
    expect(result).to.contain('name: test');
    expect(result).to.contain('count: 5');
  });

  it('should stringify nested object', function() {
    const result = _yamlStringify({ service: { name: 's1' } });
    expect(result).to.contain('service:');
    expect(result).to.contain('name: s1');
  });

  it('should stringify array', function() {
    const result = _yamlStringify({ items: [ 'a', 'b' ] });
    expect(result).to.contain('- a');
    expect(result).to.contain('- b');
  });

  it('should roundtrip', function() {
    const original = { a: 1, b: { c: 'hello' }, items: [ 'x', 'y' ] };
    const str = _yamlStringify(original);
    const parsed = _yamlParse(str);
    expect(parsed.a).to.equal(1);
    expect(parsed.b.c).to.equal('hello');
    expect(parsed.items).to.be.an('array');
    expect(parsed.items).to.deep.equal([ 'x', 'y' ]);
  });
});


// ---------------------------------------------------------------------------
// 3. resolveModdlePath
// ---------------------------------------------------------------------------

describe('_resolveModdlePath', function() {
  it('should resolve @attribute path', function() {
    const bo = createMockBusinessObject({ name: 'Test' });
    const result = _resolveModdlePath(bo, '@name');
    expect(result).to.not.be.null;
    expect(result!.value).to.equal('Test');
  });

  it('should resolve @attribute from $attrs', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['camunda:asyncBefore'] = 'true';
    const result = _resolveModdlePath(bo, '@camunda:asyncBefore');
    expect(result).to.not.be.null;
    expect(result!.value).to.equal('true');
  });

  it('should resolve child element path', function() {
    const doc = { text: 'hello' };
    const bo = createMockBusinessObject({ documentation: [ doc ] });
    const result = _resolveModdlePath(bo, 'bpmn:documentation');
    expect(result).to.not.be.null;
    expect(result!.value).to.equal(doc);
  });

  it('should resolve nested path', function() {
    const inner: Record<string, unknown> = {};
    inner['custom:nested'] = 'deep-val';
    const bo = createMockBusinessObject();
    bo.extensionElements = { values: [ inner ] };
    const result = _resolveModdlePath(bo, 'extensionElements/values/custom:nested');
    expect(result).to.not.be.null;
    expect(result!.value).to.equal('deep-val');
  });

  it('should return null for missing path', function() {
    const bo = createMockBusinessObject();
    expect(_resolveModdlePath(bo, '@nonexistent')).to.be.null;
    expect(_resolveModdlePath(bo, 'nonexistent')).to.be.null;
  });

  it('should return null for null inputs', function() {
    expect(_resolveModdlePath(null, 'path')).to.be.null;
    expect(_resolveModdlePath({}, '')).to.be.null;
  });
});


// ---------------------------------------------------------------------------
// 4. extractProperties — basic cases
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

  // -- attribute source --

  it('should extract an attribute via @path', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'My Task' }));
    const config = {
      common: [ { label: 'Name', path: '@name', source: 'attribute', control: 'text' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(1);
    expect(result[0].label).to.equal('Name');
    expect(result[0].value).to.equal('My Task');
  });

  it('should extract an attribute from $attrs', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['camunda:asyncBefore'] = 'true';
    const el = createMockElement('bpmn:ServiceTask', bo);
    const config = {
      common: [ { label: 'Async Before', path: '@camunda:asyncBefore', source: 'attribute', control: 'boolean' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('true');
  });

  // -- text source --

  it('should extract text from a child element', function() {
    const bo = createMockBusinessObject({
      documentation: [ { text: 'Some docs' } ]
    });
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Docs', path: 'bpmn:documentation', source: 'text', control: 'textarea' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('Some docs');
  });

  it('should return empty string for missing text element', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject());
    const config = {
      common: [ { label: 'Missing', path: 'custom:config', source: 'text', control: 'text' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('');
  });

  // -- embedded source (JSON) --

  it('should extract embedded JSON field', function() {
    const bo = createMockBusinessObject({
      'custom:config': { text: '{"retry":{"count":3}}' }
    });
    const el = createMockElement('bpmn:ServiceTask', bo);
    const config = {
      elementSpecific: {
        'bpmn:ServiceTask': [
          { label: 'Retry Count', path: 'custom:config', source: 'embedded', format: 'json', field: 'retry.count', control: 'number' } as PropDef
        ]
      }
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(1);
    expect(result[0].value).to.equal('3');
  });

  it('should extract embedded YAML field', function() {
    const bo = createMockBusinessObject({
      'custom:config': { text: 'service:\n  name: my-svc\n  timeout: 30' }
    });
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [
        { label: 'Service Name', path: 'custom:config', source: 'embedded', format: 'yaml', field: 'service.name', control: 'text' } as PropDef
      ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('my-svc');
  });

  it('should handle invalid JSON in embedded gracefully', function() {
    const bo = createMockBusinessObject({
      'custom:config': { text: 'not-json' }
    });
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Field', path: 'custom:config', source: 'embedded', format: 'json', field: 'x', control: 'text' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('');
  });

  // -- boolean normalization --

  it('should normalize boolean true', function() {
    const bo = createMockBusinessObject();
    bo.$attrs!['active'] = true;
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Active', path: '@active', source: 'attribute', control: 'boolean' } as PropDef ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('true');
  });

  // -- element-specific --

  it('should apply element-specific config only to matching types', function() {
    const taskEl = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'Task' }));
    const config = {
      common: [] as PropDef[],
      elementSpecific: {
        'bpmn:Task': [ { label: 'Task Label', path: '@name', source: 'attribute', control: 'text' } as PropDef ]
      }
    };
    const result = extractProperties(taskEl as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].label).to.equal('Task Label');
  });

  // -- nested path via extensionElements --

  it('should traverse extensionElements for embedded content', function() {
    const inner: Record<string, unknown> = {};
    inner['gw:flowConfig'] = { text: 'timeout: 30' };
    const bo = createMockBusinessObject();
    bo.extensionElements = { values: [ inner ] };
    const el = createMockElement('bpmn:Process', bo);
    const config = {
      common: [
        { label: 'Timeout', path: 'extensionElements/values/gw:flowConfig', source: 'embedded', format: 'yaml', field: 'timeout', control: 'number' } as PropDef
      ]
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].value).to.equal('30');
  });

  // -- error handling --

  it('should include _error field when extraction throws', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject());
    const badPropDef = { label: 'Bad', path: undefined as unknown as string, source: 'attribute', control: 'text' };
    const config = { common: [ badPropDef ] };
    expect(function() {
      extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    }).to.not.throw();
  });

  // -- merge common + element-specific --

  it('should merge common and element-specific properties', function() {
    const bo = createMockBusinessObject({ name: 'Task' });
    bo.$attrs!['priority'] = 1;
    const el = createMockElement('bpmn:Task', bo);
    const config = {
      common: [ { label: 'Name', path: '@name', source: 'attribute', control: 'text' } as PropDef ],
      elementSpecific: {
        'bpmn:Task': [ { label: 'Priority', path: '@priority', source: 'attribute', control: 'number' } as PropDef ]
      }
    };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result).to.have.lengthOf(2);
  });

  it('should include propDef reference in result', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'T' }));
    const propDef: PropDef = { label: 'Name', path: '@name', source: 'attribute', control: 'text' };
    const config = { common: [ propDef ] };
    const result = extractProperties(el as unknown as Parameters<typeof extractProperties>[0], config);
    expect(result[0].propDef).to.equal(propDef);
  });
});


// ---------------------------------------------------------------------------
// 5. updateProperty
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

  // -- attribute source --

  it('should call updateProperties for direct attribute', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ name: 'Old' }));
    let called = false;
    const modeling = {
      updateProperties: function(_element: unknown, props: Record<string, unknown>) {
        called = true;
        expect(props.name).to.equal('New Name');
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Name', path: '@name', source: 'attribute', control: 'text' };

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
    const propDef: PropDef = { label: 'Custom', path: 'nested/@customValue', source: 'attribute', control: 'text' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'new', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.true;
  });

  // -- number coercion --

  it('should coerce value to number for number control', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ priority: 0 }));
    let receivedValue: unknown = null;
    const modeling = {
      updateProperties: function(_el: unknown, props: Record<string, unknown>) {
        receivedValue = props.priority;
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Priority', path: '@priority', source: 'attribute', control: 'number' };

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
    const propDef: PropDef = { label: 'Priority', path: '@priority', source: 'attribute', control: 'number' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'not-a-number', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.false;
  });

  // -- boolean coercion --

  it('should coerce "true" to boolean true', function() {
    const el = createMockElement('bpmn:Task', createMockBusinessObject({ active: false }));
    let receivedValue: unknown = null;
    const modeling = {
      updateProperties: function(_el: unknown, props: Record<string, unknown>) {
        receivedValue = props.active;
      },
      updateModdleProperties: function() {}
    };
    const propDef: PropDef = { label: 'Active', path: '@active', source: 'attribute', control: 'boolean' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'true', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(receivedValue).to.equal(true);
  });

  // -- text source --

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
    const propDef: PropDef = { label: 'Docs', path: 'bpmn:documentation', source: 'text', control: 'textarea' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'Updated docs', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(updatedText).to.equal('Updated docs');
  });

  it('should create bpmn:Documentation if missing for text source', function() {
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
    const propDef: PropDef = { label: 'Docs', path: 'bpmn:documentation', source: 'text', control: 'textarea' };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'New docs', modeling as unknown as Record<string, unknown>, moddle as unknown as Record<string, unknown>);
    expect(createdDoc).to.not.be.null;
    expect(createdDoc!.type).to.equal('bpmn:Documentation');
  });

  // -- embedded source --

  it('should update embedded JSON field', function() {
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
      label: 'Retry Count', path: 'custom:config', source: 'embedded', format: 'json',
      field: 'retry.count', control: 'number'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, '5', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = JSON.parse(updatedText!);
    expect(parsed.retry.count).to.equal(5);
    expect(typeof parsed.retry.count).to.equal('number');
  });

  it('should update embedded YAML field', function() {
    const yamlObj = { text: 'service:\n  name: old-svc' };
    const bo = createMockBusinessObject({ 'custom:config': yamlObj });
    const el = createMockElement('bpmn:Task', bo);
    let updatedText: string | null = null;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function(_el: unknown, _moddleEl: unknown, props: Record<string, unknown>) {
        updatedText = props.text as string;
      }
    };
    const propDef: PropDef = {
      label: 'Service', path: 'custom:config', source: 'embedded', format: 'yaml',
      field: 'service.name', control: 'text'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'new-svc', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = _yamlParse(updatedText!);
    expect(parsed.service.name).to.equal('new-svc');
  });

  it('should reject invalid number for embedded JSON number field', function() {
    const jsonObj = { text: '{"field":0}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function() { called = true; }
    };
    const propDef: PropDef = {
      label: 'Field', path: 'custom:config', source: 'embedded', format: 'json',
      field: 'field', control: 'number'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'not-a-number', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.false;
  });

  it('should handle invalid JSON reset in embedded', function() {
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
      label: 'Field', path: 'custom:config', source: 'embedded', format: 'json',
      field: 'someField', control: 'text'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'newVal', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = JSON.parse(updatedText!);
    expect(parsed.someField).to.equal('newVal');
  });

  // -- date validation (embedded) --

  it('should accept valid date for embedded date field', function() {
    const jsonObj = { text: '{"date":"2025-01-01"}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function() { called = true; }
    };
    const propDef: PropDef = {
      label: 'Date', path: 'custom:config', source: 'embedded', format: 'json',
      field: 'date', control: 'date'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, '2025-06-15', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.true;
  });

  it('should reject invalid date for embedded date field', function() {
    const jsonObj = { text: '{"date":"2025-01-01"}' };
    const bo = createMockBusinessObject({ 'custom:config': jsonObj });
    const el = createMockElement('bpmn:Task', bo);
    let called = false;
    const modeling = {
      updateProperties: function() {},
      updateModdleProperties: function() { called = true; }
    };
    const propDef: PropDef = {
      label: 'Date', path: 'custom:config', source: 'embedded', format: 'json',
      field: 'date', control: 'date'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'invalid-date', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    expect(called).to.be.false;
  });

  // -- boolean in embedded --

  it('should coerce boolean in embedded JSON updates', function() {
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
      label: 'Enabled', path: 'custom:config', source: 'embedded', format: 'json',
      field: 'enabled', control: 'boolean'
    };

    updateProperty(el as unknown as Record<string, unknown>, propDef, 'true', modeling as unknown as Record<string, unknown>, createMockModdle() as unknown as Record<string, unknown>);
    const parsed = JSON.parse(updatedText!);
    expect(parsed.enabled).to.equal(true);
    expect(typeof parsed.enabled).to.equal('boolean');
  });
});


// ---------------------------------------------------------------------------
// 6. parseEmbedded / stringifyEmbedded
// ---------------------------------------------------------------------------

describe('_parseEmbedded', function() {
  it('should parse JSON', function() {
    const result = _parseEmbedded('{"a":1}', 'json');
    expect(result.a).to.equal(1);
  });

  it('should parse YAML', function() {
    const result = _parseEmbedded('a: 1\nb: hello', 'yaml');
    expect(result.a).to.equal(1);
    expect(result.b).to.equal('hello');
  });

  it('should return empty object for empty input', function() {
    expect(_parseEmbedded('', 'json')).to.deep.equal({});
  });
});

describe('_stringifyEmbedded', function() {
  it('should stringify JSON', function() {
    const result = _stringifyEmbedded({ a: 1 }, 'json');
    expect(JSON.parse(result).a).to.equal(1);
  });

  it('should stringify YAML', function() {
    const result = _stringifyEmbedded({ a: 1 }, 'yaml');
    expect(result).to.contain('a: 1');
  });
});
