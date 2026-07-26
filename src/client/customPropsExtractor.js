// src/client/customPropsExtractor.js
// Custom properties extraction and update for BPMN elements.
// Uses direct moddle object traversal (simulated XPath-like paths).
// Note: 'xmldom' and 'xpath' packages are loaded for future fullXPath implementation.

'use strict';

/**
 * Extract custom property values from a BPMN element based on configuration.
 *
 * @param {Object} bpmnElement - The bpmn-js element (with .businessObject)
 * @param {Object} config - Configuration object with .common and .elementSpecific arrays
 * @returns {Array<{label: string, value: string, propDef: Object}>} Extracted properties
 */
function extractProperties(bpmnElement, config) {
  if (!bpmnElement || !config) {
    return [];
  }

  const businessObject = bpmnElement.businessObject;
  if (!businessObject) {
    return [];
  }

  const properties = [];

  // Determine applicable property configurations
  const configToApply = [];
  if (config.common) {
    configToApply.push(...config.common);
  }
  if (config.elementSpecific && config.elementSpecific[bpmnElement.type]) {
    configToApply.push(...config.elementSpecific[bpmnElement.type]);
  }

  if (configToApply.length === 0) {
    return [];
  }

  for (const propDef of configToApply) {
    let value = undefined;
    try {

      const pathParts = propDef.xpath.split('/');
      let currentObj = businessObject;

      // Traverse nested properties
      for (const part of pathParts) {
        if (!currentObj) break;

        const propName = part.replace('bpmn:', '');

        if (currentObj[propName] !== undefined) {
          currentObj = currentObj[propName];
        } else if (currentObj.$attrs && currentObj.$attrs[propName] !== undefined) {
          currentObj = currentObj.$attrs[propName];
        } else {
          currentObj = undefined;
        }

        // Arrays: take first element
        if (currentObj && Array.isArray(currentObj)) {
          currentObj = currentObj[0];
        }
      }

      if (currentObj === undefined || currentObj === null) {
        properties.push({ label: propDef.label, value: '', propDef });
        continue;
      }

      switch (propDef.type) {
      case 'attribute':
      case 'date':
      case 'number':
        value = currentObj;
        break;
      case 'boolean':
        // Normalize boolean value display
        if (currentObj === true || currentObj === 'true' || currentObj === '1') {
          value = 'true';
        } else if (currentObj === false || currentObj === 'false' || currentObj === '0') {
          value = 'false';
        } else {
          value = String(currentObj);
        }
        break;
      case 'elementText':
        value = (currentObj && typeof currentObj.text !== 'undefined') ? currentObj.text : '';
        break;
      case 'json': {
        const text = (currentObj && currentObj.text) || '{}';
        try {
          const json = JSON.parse(text);
          if (propDef.jsonPath) {
            value = getDeep(json, propDef.jsonPath);
          } else {
            value = text;
          }
        } catch (_e) {
          console.warn('Invalid JSON in element text for property "' + propDef.label + '"');
          value = '';
        }
        break;
      }
      case 'fullXPath':
        // TODO: Implement full XPath evaluation against serialized XML
        console.warn('Full XPath evaluation not yet implemented for property "' + propDef.label + '"');
        value = '';
        break;
      default:
        console.warn('Unknown property type "' + propDef.type + '" for property "' + propDef.label + '"');
        value = '';
      }

      if (value !== undefined && value !== null) {
        properties.push({ label: propDef.label, value: String(value), propDef });
      } else {
        properties.push({ label: propDef.label, value: '', propDef });
      }
    } catch (e) {
      console.warn('Error evaluating property "' + propDef.label + '" (xpath: ' + propDef.xpath + ') for element ' + (bpmnElement.id || 'unknown') + ':', e.message || e);
      properties.push({ label: propDef.label, value: '', propDef, _error: e.message || String(e) });
    }
  }

  return properties;
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

  const businessObject = element.businessObject;
  if (!businessObject) {
    console.warn('updateProperty: element has no businessObject');
    return;
  }

  const pathParts = propDef.xpath.split('/');

  // Helper to strip bpmn: prefix
  var getPropName = function(part) {
    return part.replace('bpmn:', '');
  };

  if (['attribute', 'date', 'number', 'boolean'].indexOf(propDef.type) !== -1) {

    var currentObj = businessObject;
    var propName = '';

    for (var i = 0; i < pathParts.length; i++) {
      var part = getPropName(pathParts[i]);

      if (i === pathParts.length - 1) {
        propName = part;
      } else {
        if (!currentObj || currentObj[part] === undefined) {
          console.warn('Cannot update property "' + propDef.label + '": intermediate path "' + part + '" missing.');
          return;
        }
        currentObj = currentObj[part];
        if (Array.isArray(currentObj)) {
          currentObj = currentObj[0];
        }
      }
    }

    if (currentObj && propName) {
      var updateValue = newValue;

      // Type coercion for non-string types
      if (propDef.type === 'number') {
        var num = Number(newValue);
        if (isNaN(num)) {
          console.warn('Invalid number value "' + newValue + '" for property "' + propDef.label + '"');
          return;
        }
        updateValue = num;
      } else if (propDef.type === 'boolean') {
        updateValue = (newValue === 'true' || newValue === '1' || newValue === true);
      }

      if (currentObj === businessObject) {
        var props = {};
        props[propName] = updateValue;
        modeling.updateProperties(element, props);
      } else {
        var moddleProps = {};
        moddleProps[propName] = updateValue;
        modeling.updateModdleProperties(element, currentObj, moddleProps);
      }
    }

  } else if (propDef.type === 'elementText') {

    // Special handling for bpmn:documentation creation
    if (propDef.xpath === 'bpmn:documentation' && (!businessObject.documentation || businessObject.documentation.length === 0)) {
      var newDoc = moddle.create('bpmn:Documentation', { text: newValue });
      modeling.updateProperties(element, { documentation: [newDoc] });
      return;
    }

    var textCurrentObj = businessObject;
    for (var j = 0; j < pathParts.length; j++) {
      var textPart = getPropName(pathParts[j]);

      if (!textCurrentObj || textCurrentObj[textPart] === undefined) {
        console.warn('Cannot update property "' + propDef.label + '": path "' + textPart + '" missing.');
        return;
      }

      textCurrentObj = textCurrentObj[textPart];
      if (Array.isArray(textCurrentObj)) {
        textCurrentObj = textCurrentObj[0];
      }
    }

    if (textCurrentObj) {
      modeling.updateModdleProperties(element, textCurrentObj, { text: newValue });
    }

  } else if (propDef.type === 'json') {

    var jsonCurrentObj = businessObject;
    for (var k = 0; k < pathParts.length; k++) {
      var jsonPart = getPropName(pathParts[k]);
      if (!jsonCurrentObj || jsonCurrentObj[jsonPart] === undefined) {
        console.warn('Cannot update property "' + propDef.label + '": path "' + jsonPart + '" missing.');
        return;
      }
      jsonCurrentObj = jsonCurrentObj[jsonPart];
      if (Array.isArray(jsonCurrentObj)) {
        jsonCurrentObj = jsonCurrentObj[0];
      }
    }

    if (jsonCurrentObj) {
      var json = {};
      try {
        json = JSON.parse(jsonCurrentObj.text || '{}');
      } catch (_e) {
        console.warn('Invalid JSON in property "' + propDef.label + '", resetting to empty object');
      }

      if (propDef.jsonPath) {
        var valueToStore = newValue;
        if (propDef.inputType === 'number') {
          var parsedNum = Number(newValue);
          if (isNaN(parsedNum)) {
            console.warn('Invalid number value "' + newValue + '" for JSON property "' + propDef.label + '"');
            return;
          }
          valueToStore = parsedNum;
        } else if (propDef.inputType === 'boolean') {
          valueToStore = (newValue === 'true' || newValue === '1' || newValue === true);
        } else if (propDef.inputType === 'date') {
          // Validate date format YYYY-MM-DD
          if (!/^\d{4}-\d{2}-\d{2}$/.test(newValue) && newValue !== '') {
            console.warn('Invalid date value "' + newValue + '" for JSON property "' + propDef.label + '"');
            return;
          }
        }
        setDeep(json, propDef.jsonPath, valueToStore);
      }

      modeling.updateModdleProperties(element, jsonCurrentObj, { text: JSON.stringify(json, null, 2) });
    }
  }
}

function getDeep(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce(function(acc, part) {
    return acc && acc[part];
  }, obj);
}

function setDeep(obj, path, value) {
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

module.exports = {
  extractProperties: extractProperties,
  updateProperty: updateProperty,
  getDeep: getDeep,
  setDeep: setDeep
};
