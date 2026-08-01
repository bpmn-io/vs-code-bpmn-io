// src/client/customPropsExtractor.js
// Generic custom properties extraction and update for BPMN elements.
//
// Data model:
//   path   = segment ("/" segment)*
//   segment = "@" attrName   → XML attribute
//           | ns ":" name    → namespaced child element
//           | name           → child element (any namespace)
//
// Sources:
//   attribute → read/write an XML attribute value
//   text      → read/write a child element's text content
//   embedded  → parse child element text as JSON/YAML, read/write nested field
//
// Controls: text, textarea, number, boolean, date, select, code

'use strict';

// ─── Simple YAML parser (subset: key:value, lists, nesting) ──────────

/**
 * Parse a simple YAML string into a JS object.
 * Supports: scalars, nested mappings, sequences (arrays), comments.
 * Does NOT support: anchors, aliases, multi-document, tags, block scalars (|, >).
 *
 * @param {string} text
 * @returns {Object}
 */
function yamlParse(text) {
  if (!text || typeof text !== 'string') return {};

  var lines = text.replace(/\r\n/g, '\n').split('\n');
  var root = {};
  var stack = [ { obj: root, indent: -1, key: null } ];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];
    i++;

    // Skip blank lines and comment-only lines
    var trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    var indent = line.search(/\S/);
    if (indent < 0) continue;

    // Pop stack to find parent at lower indent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    var parent = stack[stack.length - 1];

    // Sequence item
    if (trimmed.startsWith('- ')) {
      var itemVal = trimmed.substring(2);
      var parsed = _yamlScalar(itemVal);
      var arr = _ensureArray(parent.obj, parent.key);
      arr.push(parsed);
      continue;
    }

    // Key: value
    var colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    var key = trimmed.substring(0, colonIdx).trim();
    var rest = trimmed.substring(colonIdx + 1);

    if (rest === '') {

      // Peek at next line to determine if it's a sequence or mapping
      var nextIndent2 = i < lines.length ? _lineIndent(lines[i]) : -1;
      if (nextIndent2 > indent) {
        var nextLine2 = lines[i].trim();
        if (nextLine2.startsWith('- ')) {

          // Sequence follows
          var seqArr2 = [];
          parent.obj[key] = seqArr2;
          stack.push({ obj: seqArr2, indent: indent, key: key, isArray: true });
          var seqIndent2 = nextIndent2;
          while (i < lines.length && _lineIndent(lines[i]) === seqIndent2 && lines[i].trim().startsWith('- ')) {
            seqArr2.push(_yamlScalar(lines[i].trim().substring(2)));
            i++;
          }
          stack.pop();
          continue;
        }

        // Mapping follows
        var newObj2 = {};
        parent.obj[key] = newObj2;
        stack.push({ obj: newObj2, indent: indent, key: key });
        continue;
      }

      // Empty value
      parent.obj[key] = null;
      continue;
    }

    // Check if next lines are more indented (for values with inline scalar + nested block)
    var nextIndent = i < lines.length ? _lineIndent(lines[i]) : -1;
    if (nextIndent > indent) {

      // Value is on next indented block
      var nextLine = i < lines.length ? lines[i].trim() : '';
      if (nextLine.startsWith('- ')) {
        var seqArr = [];
        parent.obj[key] = seqArr;
        stack.push({ obj: seqArr, indent: indent, key: key, isArray: true });
        var seqIndent = nextIndent;
        while (i < lines.length && _lineIndent(lines[i]) === seqIndent && lines[i].trim().startsWith('- ')) {
          seqArr.push(_yamlScalar(lines[i].trim().substring(2)));
          i++;
        }
        stack.pop();
        continue;
      }
      var nested = {};
      parent.obj[key] = nested;
      stack.push({ obj: nested, indent: indent, key: key });
      continue;
    }
    parent.obj[key] = _yamlScalar(rest.trim());
  }

  return root;
}

function _lineIndent(line) {
  if (!line || line.trim() === '') return -1;
  var m = line.match(/^(\s*)\S/);
  return m ? m[1].length : 0;
}

function _yamlScalar(val) {
  if (val === 'true' || val === 'True' || val === 'TRUE') return true;
  if (val === 'false' || val === 'False' || val === 'FALSE') return false;
  if (val === 'null' || val === '~') return null;

  // Quoted strings
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith('\'') && val.endsWith('\''))) {
    return val.slice(1, -1);
  }

  // Numbers
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  return val;
}

function _ensureArray(obj, key) {
  if (!Array.isArray(obj[key])) {
    obj[key] = [];
  }
  return obj[key];
}

/**
 * Serialize a JS object to simple YAML.
 *
 * @param {Object} obj
 * @param {number} [indent=0]
 * @returns {string}
 */
function yamlStringify(obj, indent) {
  if (indent === undefined) indent = 0;
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return _yamlScalarToString(obj);

  var prefix = '';
  for (var p = 0; p < indent; p++) prefix += '  ';

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    var arrLines = [];
    for (var ai = 0; ai < obj.length; ai++) {
      arrLines.push(prefix + '- ' + _yamlScalarToString(obj[ai]));
    }
    return arrLines.join('\n');
  }

  var keys = Object.keys(obj);
  if (keys.length === 0) return '{}';

  var lines = [];
  for (var ki = 0; ki < keys.length; ki++) {
    var k = keys[ki];
    var v = obj[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0) {
      lines.push(prefix + k + ':');
      lines.push(yamlStringify(v, indent + 1));
    } else if (Array.isArray(v)) {
      lines.push(prefix + k + ':');
      lines.push(yamlStringify(v, indent + 1));
    } else {
      lines.push(prefix + k + ': ' + _yamlScalarToString(v));
    }
  }
  return lines.join('\n');
}

function _yamlScalarToString(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  var str = String(val);

  // Quote strings that need quoting
  if (/[:{}[\],&*#?|\-<>=!%@`]/.test(str) || str.startsWith(' ') || str.endsWith(' ') || str === '') {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return str;
}


// ─── Path navigation ─────────────────────────────────────────────────

/**
 * Resolve a path string against a BPMN moddle object.
 *
 * Path syntax:
 *   "@attrName"     → access $attrs[attrName] on current object
 *   "ns:elemName"   → access obj.elemName or obj['ns:elemName'] (child element)
 *   "elemName"      → access obj.elemName (child element, namespace-agnostic)
 *
 * Returns { parent, key, value } where value is the resolved node,
 * or null if the path cannot be resolved.
 *
 * @param {Object} bo - The businessObject (moddle element)
 * @param {string} path - Dot-separated path
 * @returns {{ parent: Object, key: string, value: unknown } | null}
 */
function resolveModdlePath(bo, path) {
  if (!bo || !path) return null;

  var segments = path.split('/');
  var current = bo;
  var parent = null;
  var lastKey = '';

  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i];
    if (!seg) continue;

    if (seg.startsWith('@')) {

      // Attribute access: try $attrs first, then direct properties
      var attrName = seg.substring(1);
      var foundAttr = false;

      if (current.$attrs && attrName in current.$attrs) {
        parent = current;
        lastKey = attrName;
        current = current.$attrs[attrName];
        foundAttr = true;
      } else if (attrName in current) {
        parent = current;
        lastKey = attrName;
        current = current[attrName];
        foundAttr = true;
      } else {

        // Try stripping namespace prefix
        var colonIdx = attrName.indexOf(':');
        if (colonIdx !== -1) {
          var localName = attrName.substring(colonIdx + 1);
          if (current.$attrs && localName in current.$attrs) {
            parent = current;
            lastKey = localName;
            current = current.$attrs[localName];
            foundAttr = true;
          } else if (localName in current) {
            parent = current;
            lastKey = localName;
            current = current[localName];
            foundAttr = true;
          }
        }
      }
      if (!foundAttr) return null;
    } else {

      // Child element access
      var childKey = seg;

      // If it has a namespace prefix like 'bpmn:documentation', use as-is
      if (current[childKey] !== undefined) {

        // exact match
      } else {

        // Try to find by local name (with or without namespace)
        var found = false;
        var searchName = childKey;

        // Strip namespace prefix if present
        var nsIdx = childKey.indexOf(':');
        if (nsIdx !== -1) {
          searchName = childKey.substring(nsIdx + 1);
        }
        var keys = Object.keys(current);
        for (var k = 0; k < keys.length; k++) {
          var kk = keys[k];
          if (kk === searchName || kk.endsWith(':' + searchName)) {
            childKey = kk;
            found = true;
            break;
          }
        }
        if (!found && current.$attrs && current.$attrs[searchName] !== undefined) {

          // Fallback: treat as attribute
          parent = current;
          lastKey = searchName;
          current = current.$attrs[searchName];
          continue;
        }
        if (!found) return null;
      }

      parent = current;
      lastKey = childKey;
      current = current[childKey];

      // Arrays: take first element
      if (Array.isArray(current)) {
        current = current[0];
      }
    }
  }

  return { parent: parent, key: lastKey, value: current };
}


// ─── Deep get/set ────────────────────────────────────────────────────

function getDeep(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce(function(acc, part) {
    return (acc && typeof acc === 'object') ? acc[part] : undefined;
  }, obj);
}

function setDeep(obj, path, value) {
  if (!obj || !path) return;
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    var part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}


// ─── Embedded text parsing ───────────────────────────────────────────

/**
 * Parse embedded text content according to format.
 * @param {string} text
 * @param {'json'|'yaml'} format
 * @returns {Object}
 */
function parseEmbedded(text, format) {
  if (!text) return {};
  if (format === 'yaml') {
    try {
      return yamlParse(text);
    } catch (_e) {
      console.warn('Failed to parse YAML content');
      return {};
    }
  }

  // default: json
  try {
    return JSON.parse(text);
  } catch (_e) {
    console.warn('Failed to parse JSON content');
    return {};
  }
}

/**
 * Serialize an object to embedded text.
 * @param {Object} obj
 * @param {'json'|'yaml'} format
 * @returns {string}
 */
function stringifyEmbedded(obj, format) {
  if (format === 'yaml') {
    return yamlStringify(obj);
  }
  return JSON.stringify(obj, null, 2);
}


// ─── Full XPath (real XML XPath via native DOMParser) ─────────────

/**
 * Extract properties using real XPath engine on the full diagram XML.
 *
 * @param {Object} modeler - bpmn-js modeler instance (for saveXML)
 * @param {Object} bpmnElement - The bpmn-js element
 * @param {Object} config - Property configuration
 * @returns {Promise<Array<{label: string, value: string, propDef: Object}>>}
 */
async function extractPropertiesXPath(modeler, bpmnElement, config) {
  if (!bpmnElement || !config || !modeler) return [];

  var businessObject = bpmnElement.businessObject;
  if (!businessObject) return [];

  // Collect applicable property definitions
  var propDefs = [];
  if (config.common) {
    propDefs = propDefs.concat(config.common);
  }
  if (config.elementSpecific && config.elementSpecific[bpmnElement.type]) {
    propDefs = propDefs.concat(config.elementSpecific[bpmnElement.type]);
  }

  if (propDefs.length === 0) return [];

  // Filter to XPath-engine properties only
  var xpathDefs = propDefs.filter(function(pd) { return pd.engine === 'xpath'; });
  if (xpathDefs.length === 0) return [];

  var results = [];

  try {

    // Get full diagram XML
    var saveResult = await modeler.saveXML({ format: true });
    var xml = saveResult.xml;

    // Parse XML
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'application/xml');

    // Check for parse errors
    var parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.warn('Failed to parse XML for XPath extraction');
      return xpathDefs.map(function(pd) {
        return { label: pd.label, value: '', propDef: pd, _error: 'XML parse error' };
      });
    }

    // Locate the element by ID in the XML document
    var elementNode = doc.getElementById(bpmnElement.id);
    if (!elementNode) {

      // Try searching by name or other attributes
      elementNode = _findElementInXML(doc, bpmnElement);
    }

    for (var pi = 0; pi < xpathDefs.length; pi++) {
      var pd = xpathDefs[pi];
      var value = '';
      var error = null;

      try {
        var xpathResult = _evaluateXPath(doc, pd.path, elementNode);
        value = xpathResult !== null && xpathResult !== undefined ? String(xpathResult) : '';
      } catch (e) {
        error = e.message || String(e);
        console.warn('Error evaluating XPath "' + pd.path + '" for "' + pd.label + '":', error);
      }

      results.push({ label: pd.label, value: value, propDef: pd, _error: error || undefined });
    }
  } catch (e) {
    console.warn('Error in XPath extraction:', e);
    return xpathDefs.map(function(pd) {
      return { label: pd.label, value: '', propDef: pd, _error: 'XPath evaluation error: ' + (e.message || String(e)) };
    });
  }

  return results;
}

/**
 * Find a BPMN element node in the XML document when getElementById fails.
 * BPMN IDs are stored in the 'id' attribute, but DOMParser may not recognize
 * them as XML IDs without a DTD/schema.
 */
function _findElementInXML(doc, bpmnElement) {

  // Try to find by 'id' attribute using XPath
  var expr = '//*[@id="' + bpmnElement.id.replace(/"/g, '\\"') + '"]';
  try {
    var result = doc.evaluate(expr, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (result.singleNodeValue) return result.singleNodeValue;
  } catch (_e) { /* ignore */ }
  return null;
}

/**
 * Evaluate an XPath expression and return the result.
 * Handles attribute, text, and element queries.
 */
function _evaluateXPath(doc, xpathExpr, contextNode) {
  if (!xpathExpr) return null;

  var resolver = null;

  // If the expression contains namespace prefixes (e.g., bpmn:, camunda:),
  // set up a namespace resolver that maps prefixes to namespaces
  if (/[a-zA-Z]+:/.test(xpathExpr)) {
    resolver = _createNSResolver(doc);
  }

  var effectiveNode = contextNode || doc;

  // Try as string first (for @attr or text() queries)
  try {
    var strResult = doc.evaluate(xpathExpr, effectiveNode, resolver, XPathResult.STRING_TYPE, null);
    if (strResult.stringValue) {
      return strResult.stringValue;
    }
  } catch (_e) { /* fall through */ }

  // Try as node result
  try {
    var nodeResult = doc.evaluate(xpathExpr, effectiveNode, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (nodeResult.singleNodeValue) {
      var node = nodeResult.singleNodeValue;

      // For attribute nodes, return the value
      if (node.nodeType === 2 /* ATTRIBUTE_NODE */) {
        return node.value;
      }

      // For text nodes
      if (node.nodeType === 3 /* TEXT_NODE */ || node.nodeType === 4 /* CDATA_SECTION_NODE */) {
        return node.textContent;
      }

      // For element nodes, return textContent
      return node.textContent || '';
    }
  } catch (_e2) { /* fall through */ }

  // Try as number
  try {
    var numResult = doc.evaluate(xpathExpr, effectiveNode, resolver, XPathResult.NUMBER_TYPE, null);
    if (!isNaN(numResult.numberValue)) {
      return numResult.numberValue;
    }
  } catch (_e3) { /* fall through */ }

  return null;
}

/**
 * Create a namespace resolver from the document's root element namespaces.
 */
function _createNSResolver(doc) {
  var root = doc.documentElement;
  var nsMap = {};

  // Collect all namespace declarations from root and children
  _collectNamespaces(root, nsMap);

  return function(prefix) {
    return nsMap[prefix] || null;
  };
}

function _collectNamespaces(node, nsMap) {
  if (!node || !node.attributes) return;
  for (var i = 0; i < node.attributes.length; i++) {
    var attr = node.attributes[i];
    if (attr.name === 'xmlns') {
      nsMap[''] = attr.value; // default namespace
    } else if (attr.name.startsWith('xmlns:')) {
      nsMap[attr.name.substring(6)] = attr.value;
    }
  }

  // Recurse into children to find all namespace declarations
  if (node.childNodes) {
    for (var c = 0; c < node.childNodes.length; c++) {
      if (node.childNodes[c].nodeType === 1) {
        _collectNamespaces(node.childNodes[c], nsMap);
        break; // Only need first level typically
      }
    }
  }
}

/**
 * Update a property on a BPMN element using real XPath on the full diagram XML.
 *
 * @param {Object} modeler - bpmn-js modeler instance
 * @param {Object} element - The bpmn-js element
 * @param {Object} propDef - Property definition
 * @param {string} newValue - New value to set
 * @returns {Promise<void>}
 */
async function updatePropertyXPath(modeler, element, propDef, newValue) {
  if (!modeler || !element || !propDef) {
    console.warn('updatePropertyXPath: missing required parameters');
    return;
  }

  try {

    // Get full diagram XML
    var saveResult = await modeler.saveXML({ format: true });
    var parser = new DOMParser();
    var doc = parser.parseFromString(saveResult.xml, 'application/xml');

    var parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.warn('updatePropertyXPath: XML parse error');
      return;
    }

    // Locate the element in XML
    var elementNode = doc.getElementById(element.id);
    if (!elementNode) {
      elementNode = _findElementInXML(doc, element);
    }

    if (!elementNode) {
      console.warn('updatePropertyXPath: could not find element "' + element.id + '" in XML');
      return;
    }

    // Evaluate XPath to find the target attribute/element
    var resolver = null;
    if (/[a-zA-Z]+:/.test(propDef.path)) {
      resolver = _createNSResolver(doc);
    }

    var nodeResult = doc.evaluate(propDef.path, elementNode, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    var targetNode = nodeResult.singleNodeValue;

    if (!targetNode) {
      console.warn('updatePropertyXPath: XPath "' + propDef.path + '" returned no node');
      return;
    }

    // Coerce value
    var writeValue = _coerceValue(newValue, propDef);
    if (writeValue === null && newValue !== '' && newValue !== null) {
      return; // coercion failed
    }

    // Modify the DOM
    if (targetNode.nodeType === 2 /* ATTRIBUTE_NODE */) {
      targetNode.value = String(writeValue);
    } else if (targetNode.nodeType === 1 /* ELEMENT_NODE */) {
      var source = propDef.source || 'attribute';
      if (source === 'text') {
        targetNode.textContent = String(writeValue);
      } else {

        // For attribute source on element, try to set via setAttribute
        // The XPath might point to an element, so we need to know the attribute name
        targetNode.textContent = String(writeValue);
      }
    } else {
      targetNode.textContent = String(writeValue);
    }

    // Serialize back
    var serializer = new XMLSerializer();
    var newXml = serializer.serializeToString(doc);

    // Import back into modeler
    await modeler.importXML(newXml);
  } catch (e) {
    console.warn('updatePropertyXPath: error:', e);
  }
}


// ─── Public API ──────────────────────────────────────────────────────

/**
 * Extract custom property values from a BPMN element based on configuration.
 *
 * @param {Object} bpmnElement - The bpmn-js element (with .businessObject)
 * @param {Object} config - Configuration with .common and .elementSpecific arrays
 * @returns {Array<{label: string, value: string, propDef: Object}>}
 */
function extractProperties(bpmnElement, config) {
  if (!bpmnElement || !config) return [];

  var businessObject = bpmnElement.businessObject;
  if (!businessObject) return [];

  // Collect applicable property definitions
  var allDefs = [];
  if (config.common) {
    allDefs = allDefs.concat(config.common);
  }
  if (config.elementSpecific && config.elementSpecific[bpmnElement.type]) {
    allDefs = allDefs.concat(config.elementSpecific[bpmnElement.type]);
  }

  if (allDefs.length === 0) return [];

  // Filter out XPath-engine properties (handled by extractPropertiesXPath)
  var propDefs = allDefs.filter(function(pd) { return pd.engine !== 'xpath'; });
  if (propDefs.length === 0) return [];

  var results = [];

  for (var pi = 0; pi < propDefs.length; pi++) {
    var pd = propDefs[pi];
    var value = '';
    var error = null;

    try {
      if (pd.source === 'embedded') {

        // Resolve child element → parse text → extract field
        var embeddedResolved = resolveModdlePath(businessObject, pd.path);
        if (embeddedResolved && embeddedResolved.value) {
          var textContent = '';
          if (typeof embeddedResolved.value === 'string') {
            textContent = embeddedResolved.value;
          } else if (embeddedResolved.value.text !== undefined) {
            textContent = embeddedResolved.value.text;
          }
          var parsed = parseEmbedded(textContent, pd.format || 'yaml');
          var fieldVal = pd.field ? getDeep(parsed, pd.field) : parsed;
          value = fieldVal !== undefined && fieldVal !== null ? String(fieldVal) : '';
        }
      } else {

        // attribute or text source: resolve path
        var resolved = resolveModdlePath(businessObject, pd.path);
        if (!resolved || resolved.value === undefined || resolved.value === null) {
          value = '';
        } else if (pd.source === 'text') {

          // Text source: get .text property
          if (typeof resolved.value === 'string') {
            value = resolved.value;
          } else if (resolved.value.text !== undefined) {
            value = resolved.value.text;
          } else {
            value = String(resolved.value);
          }
        } else {

          // attribute source
          if (pd.control === 'boolean') {
            var v = resolved.value;
            if (v === true || v === 'true' || v === '1') {
              value = 'true';
            } else if (v === false || v === 'false' || v === '0') {
              value = 'false';
            } else {
              value = String(v);
            }
          } else {
            value = String(resolved.value);
          }
        }
      }
    } catch (e) {
      error = e.message || String(e);
      console.warn('Error extracting property "' + pd.label + '" (path: ' + pd.path + '):', error);
    }

    results.push({ label: pd.label, value: value, propDef: pd, _error: error || undefined });
  }

  return results;
}

/**
 * Update a custom property value on a BPMN element.
 *
 * @param {Object} element - The bpmn-js element
 * @param {Object} propDef - Property definition from config
 * @param {string} newValue - New value to set
 * @param {Object} modeling - bpmn-js modeling service
 * @param {Object} moddle - bpmn-js moddle service
 */
function updateProperty(element, propDef, newValue, modeling, moddle) {
  if (!element || !propDef || !modeling || !moddle) {
    console.warn('updateProperty: missing required parameters');
    return;
  }

  var businessObject = element.businessObject;
  if (!businessObject) {
    console.warn('updateProperty: element has no businessObject');
    return;
  }

  var segments = propDef.path.split('/');
  var source = propDef.source || 'attribute';

  if (source === 'embedded') {
    _updateEmbedded(element, businessObject, propDef, newValue, modeling, moddle, segments);
    return;
  }

  // source = attribute | text
  _updateAttributeOrText(element, businessObject, propDef, newValue, modeling, moddle, segments, source);
}

/**
 * Update an attribute or text-source property.
 */
function _updateAttributeOrText(element, bo, propDef, newValue, modeling, moddle, segments, source) {

  // Find the target parent and key
  var current = bo;
  var parent = null;
  var lastKey = '';

  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i];
    if (!seg) continue;

    if (seg.startsWith('@')) {
      var attrName = seg.substring(1);
      if (i === segments.length - 1) {
        parent = current;
        lastKey = attrName;
      }

      // Check if attr exists in $attrs
      if (current.$attrs && current.$attrs[attrName] !== undefined) {
        current = current.$attrs[attrName];
      } else if (current[attrName] !== undefined) {
        current = current[attrName];
      } else if (i < segments.length - 1) {

        // Intermediate attr not found
        console.warn('Cannot update "' + propDef.label + '": attribute "' + attrName + '" not found');
        return;
      }
    } else {
      var childKey = seg;
      if (current[childKey] === undefined) {

        // Try namespace-agnostic lookup (strip namespace prefix if present)
        var searchName2 = childKey;
        var nsIdx2 = childKey.indexOf(':');
        if (nsIdx2 !== -1) {
          searchName2 = childKey.substring(nsIdx2 + 1);
        }
        var found2 = false;
        var keys2 = Object.keys(current);
        for (var k2 = 0; k2 < keys2.length; k2++) {
          if (keys2[k2] === searchName2 || keys2[k2].endsWith(':' + searchName2)) {
            childKey = keys2[k2];
            found2 = true;
            break;
          }
        }
        if (!found2) {
          if (i === segments.length - 1 && source === 'text') {

            // For text source, we can create the child element
            parent = current;
            lastKey = seg; // original name with namespace
            current = null; // doesn't exist yet
            break;
          }
          console.warn('Cannot update "' + propDef.label + '": child "' + seg + '" not found');
          return;
        }
      }

      if (i === segments.length - 1) {
        parent = current;
        lastKey = childKey;
        current = current[childKey];
        if (Array.isArray(current)) current = current[0];
      } else {
        var next = current[childKey];
        if (Array.isArray(next)) next = next[0];
        if (!next) {

          // Auto-create intermediate object if autoCreate is not disabled
          if (propDef.autoCreate === false) {
            console.warn('Cannot update "' + propDef.label + '": intermediate path "' + childKey + '" missing (autoCreate disabled)');
            return;
          }

          // Resolve namespace prefix to find the moddle type to create
          var colonIdx3 = childKey.indexOf(':');
          var autoCreateType = childKey;
          if (colonIdx3 === -1) {

            // Try to infer namespace from the parent's type
            var parentType = current.$type || '';
            var parentNs = parentType.split(':')[0];
            if (parentNs) {
              autoCreateType = parentNs + ':' + childKey.charAt(0).toUpperCase() + childKey.slice(1);
            }
          }
          try {
            next = moddle.create(autoCreateType, {});
            var newChildProps = {};
            newChildProps[childKey] = [ next ];
            modeling.updateModdleProperties(element, current, newChildProps);
            console.log('Auto-created intermediate object "' + childKey + '" (type: ' + autoCreateType + ')');
          } catch (err) {
            console.warn('Cannot auto-create "' + childKey + '" (type: ' + autoCreateType + '):', err.message);
            return;
          }
        }
        current = next;
        if (!current) {
          console.warn('Cannot update "' + propDef.label + '": intermediate path "' + childKey + '" creation failed');
          return;
        }
      }
    }
  }

  // Determine the value to write
  var writeValue = _coerceValue(newValue, propDef);
  if (writeValue === null && newValue !== '' && newValue !== null) {

    // Coercion failed (invalid number, date, etc.) — abort
    return;
  }

  // Determine property name (strip namespace for writing to moddle only for text source)
  var propName = lastKey;
  if (propName.startsWith('@')) propName = propName.substring(1);

  if (source === 'text') {
    // Strip namespace prefix for child element creation (bpmn:documentation → documentation)
    var colonIdx = propName.indexOf(':');
    if (colonIdx !== -1) propName = propName.substring(colonIdx + 1);

    // Text source: update .text on the target child element
    if (current && current.text !== undefined) {

      // Existing element — update text
      modeling.updateModdleProperties(element, current, { text: writeValue });
    } else if (current === null || current === undefined) {

      // Child element doesn't exist — create it
      // Parse namespace and local name from the original segment
      var origSeg = lastKey.indexOf(':') !== -1 ? lastKey : (segments[segments.length - 1] || lastKey);
      var nsLocal = origSeg.split(':');
      var createType;
      if (nsLocal.length === 2) {
        createType = nsLocal[0] + ':' + nsLocal[1].charAt(0).toUpperCase() + nsLocal[1].slice(1);
      } else {
        createType = 'bpmn:' + nsLocal[0].charAt(0).toUpperCase() + nsLocal[0].slice(1);
      }
      try {
        var created = moddle.create(createType, { text: writeValue });
        var parentProps = {};
        parentProps[propName] = [ created ];
        modeling.updateModdleProperties(element, parent, parentProps);
      } catch (err) {

        // If moddle.create fails, try writing directly as text property
        console.warn('Could not create element of type "' + createType + '", falling back to set text directly:', err.message);
        if (parent && lastKey) {
          var directProps = {};
          directProps[propName] = writeValue;
          modeling.updateModdleProperties(element, parent, directProps);
        }
      }
    } else if (typeof current === 'string') {

      // Direct string value
      var strProps = {};
      strProps[propName] = writeValue;
      modeling.updateModdleProperties(element, parent, strProps);
    }
  } else {

    // Attribute source
    if (parent && lastKey) {
      var attrProps = {};
      attrProps[propName] = writeValue;

      // Determine whether to use updateProperties or updateModdleProperties
      if (parent === bo || (parent.$attrs && parent === bo)) {
        modeling.updateProperties(element, attrProps);
      } else {
        modeling.updateModdleProperties(element, parent, attrProps);
      }
    }
  }
}

/**
 * Update an embedded-source property (JSON/YAML field inside child element text).
 */
function _updateEmbedded(element, bo, propDef, newValue, modeling, _moddle, _segments) {

  // Resolve the child element that contains the embedded text
  var resolved = resolveModdlePath(bo, propDef.path);
  if (!resolved || !resolved.parent) {
    console.warn('Cannot update embedded property "' + propDef.label + '": path not found');
    return;
  }

  var childElement = resolved.value;
  var textContent = '';
  if (childElement && typeof childElement === 'string') {
    textContent = childElement;
  } else if (childElement && childElement.text !== undefined) {
    textContent = childElement.text;
  }

  var format = propDef.format || 'yaml';
  var parsed = parseEmbedded(textContent, format);

  // Coerce the value
  var writeValue = _coerceValue(newValue, propDef);
  if (writeValue === null && newValue !== '' && newValue !== null) {

    // Coercion failed (invalid number, date, etc.) — abort
    return;
  }

  if (propDef.field) {
    setDeep(parsed, propDef.field, writeValue);
  } else {

    // Replace entire content
    parsed = writeValue;
  }

  var newText = stringifyEmbedded(parsed, format);

  // Write back to the child element's text
  if (childElement && childElement.text !== undefined) {
    modeling.updateModdleProperties(element, childElement, { text: newText });
  } else if (typeof childElement === 'string' || !childElement) {

    // The child element is a string or doesn't exist as moddle object
    // Store as property on the parent
    var props = {};
    props[resolved.key] = newText;
    if (resolved.parent === bo) {
      modeling.updateProperties(element, props);
    } else {
      modeling.updateModdleProperties(element, resolved.parent, props);
    }
  }
}

/**
 * Coerce a string value according to property definition's control type.
 */
function _coerceValue(newValue, propDef) {
  var control = propDef.control || 'text';

  switch (control) {
  case 'number': {
    var num = Number(newValue);
    if (isNaN(num)) {
      console.warn('Invalid number value "' + newValue + '" for property "' + propDef.label + '"');
      return null; // caller should check for null
    }
    return num;
  }
  case 'boolean':
    return (newValue === 'true' || newValue === '1' || newValue === true);
  case 'date':
    if (newValue !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
      console.warn('Invalid date value "' + newValue + '" for property "' + propDef.label + '"');
      return null;
    }
    return newValue;
  default:
    return newValue;
  }
}


// ─── Exports ─────────────────────────────────────────────────────────

/* global module */
module.exports = {
  extractProperties: extractProperties,
  extractPropertiesXPath: extractPropertiesXPath,
  updateProperty: updateProperty,
  updatePropertyXPath: updatePropertyXPath,
  getDeep: getDeep,
  setDeep: setDeep,

  // Exported for testing
  _yamlParse: yamlParse,
  _yamlStringify: yamlStringify,
  _resolveModdlePath: resolveModdlePath,
  _parseEmbedded: parseEmbedded,
  _stringifyEmbedded: stringifyEmbedded,
  _evaluateXPath: _evaluateXPath
};
