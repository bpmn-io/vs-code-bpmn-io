/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-editor.css';
import './sidebar/sidebar.css';

import Sidebar from './sidebar/sidebar.js';
import { extractProperties, updateProperty } from './customPropsExtractor.js';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import BpmnColorPickerModule from 'bpmn-js-color-picker';
import customTranslate, { setLanguage } from './i18n/customTranslate';
import { customTranslations } from './i18n/customTranslations.js';

import { handleMacOsKeyboard } from './utils/macos-keyboard';

/**
 * @type { import('vscode') }
 */
const vscode = acquireVsCodeApi();

handleMacOsKeyboard();

// Initialize sidebar
const sidebarInstance = new Sidebar({ container: document.body });
sidebarInstance.init();

// Flag: set to true while programmatically selecting a canvas element
// from a root element click, so selection.changed won't clear the sidebar.
var _selectingRootElement = false;

// Register callback for root element selection in sidebar
sidebarInstance.onRootElementSelected(function(rootEl) {
  _selectingRootElement = true;

  showRootElementProperties(rootEl, modeler);

  // If this is a Process that belongs to a Pool, select that pool
  // on the canvas for visual feedback (same as clicking Participant).
  if (rootEl.type === 'bpmn:Process' && rootEl.participantId) {
    try {
      var participant = modeler.get('elementRegistry').get(rootEl.participantId);
      if (participant) {
        modeler.get('selection').select(participant);
        modeler.get('canvas').scrollToElement(participant, {
          top: 40, bottom: 40, left: 40, right: 40
        });
      }
    } catch (_e) { /* ignore */ }
  }

  _selectingRootElement = false;
});

// Register callback for "locate on canvas" (clicking participant child item)
sidebarInstance.onSelectOnCanvas(function(elementId) {
  try {
    var elementRegistry = modeler.get('elementRegistry');
    var selection = modeler.get('selection');
    var canvas = modeler.get('canvas');
    var el = elementRegistry.get(elementId);
    if (el) {

      // Clear root element selection in sidebar
      sidebarInstance.clearRootElementSelection();

      // Clear root element highlight
      _clearCanvasHighlight(modeler);

      // Select and focus the element on canvas
      selection.select(el);
      canvas.scrollToElement(el, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  } catch (_e) {
    console.warn('Failed to select element on canvas:', elementId, _e);
  }
});

// Register refresh config callback
sidebarInstance.onRefreshConfig(function() {
  vscode.postMessage({ type: 'refreshCustomConfig' });
});

// Register language change callback
sidebarInstance.onLanguageChange(async function(lang) {
  _uiLang = lang;
  setLanguage(lang);

  // Save and rebuild modeler to fully refresh UI
  var xml;
  try {
    var result = await modeler.saveXML({ format: true });
    xml = result.xml;
  } catch (_e) {
    xml = '';
  }

  modeler.destroy();

  var newModeler = new BpmnModeler({
    container: '#canvas',
    additionalModules: [
      BpmnColorPickerModule,
      customTranslateModule
    ]
  });

  if (xml) {
    await newModeler.importXML(xml);
  }

  modeler = newModeler;
  setupModelerListeners(modeler);
});

// Track current UI language (kept in sync with sidebar)
var _uiLang = 'en';

// Simple translation helper for hardcoded strings in this file
function _t(key, replacements) {
  var dict = customTranslations[_uiLang] || customTranslations.en;
  var text = dict[key] || key;
  if (replacements) {
    Object.keys(replacements).forEach(function(k) {
      text = text.replace('{' + k + '}', replacements[k]);
    });
  }
  return text;
}

let customPropertiesConfig = {}; // Initialize with a default

const customTranslateModule = {
  translate: [ 'value', customTranslate ]
};

let modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    BpmnColorPickerModule,
    customTranslateModule
  ]
});

setupModelerListeners(modeler);

/**
 * Extract non-visual root elements from the BPMN definitions.
 * These include bpmn:Process, bpmn:Collaboration, etc. that have
 * no visual shape on the canvas but have configurable properties.
 *
 * Also enriches the data with relationship info:
 * - Collaboration shows its participants (Pools)
 * - Process shows which Pool (Participant) references it, if any
 *
 * @param {Object} bpmnModeler - The bpmn-js modeler instance
 * @returns {Array<{id: string, type: string, name: string, moddleElement: Object,
 *   participantCount: number, participantId: string, participantName: string,
 *   isStandalone: boolean}>}
 */
function extractRootElements(bpmnModeler) {
  try {
    const definitions = bpmnModeler.getDefinitions();
    if (!definitions) return [];

    const rootElements = definitions.get('rootElements') || [];
    const result = [];

    // First pass: identify collaboration and collect processes
    let collaboration = null;
    const processes = [];

    rootElements.forEach(function(re) {
      const type = re.$type;
      if (type === 'bpmn:Collaboration') {
        collaboration = re;
      } else if (type === 'bpmn:Process') {
        processes.push(re);
      }
    });

    // Build process-to-participant mapping from collaboration participants
    const processToParticipant = {};
    if (collaboration) {
      const participants = collaboration.get('participants') || [];
      participants.forEach(function(p) {
        if (p.processRef) {
          processToParticipant[p.processRef.id || p.processRef] = {
            participantId: p.id,
            participantName: p.name || ''
          };
        }
      });
    }

    // Add collaboration with relationship info
    if (collaboration) {
      const participantList = (collaboration.get('participants') || []).map(function(p) {
        return {
          id: p.id,
          name: p.name || '',
          processId: p.processRef ? (p.processRef.id || p.processRef) : null
        };
      });

      result.push({
        id: collaboration.id,
        type: 'bpmn:Collaboration',
        name: collaboration.name || '',
        moddleElement: collaboration,
        participantCount: participantList.length,
        participants: participantList,
        isClosed: collaboration.isClosed
      });
    }

    // Add processes with relationship info
    processes.forEach(function(p) {
      const participant = processToParticipant[p.id];
      result.push({
        id: p.id,
        type: 'bpmn:Process',
        name: p.name || '',
        moddleElement: p,
        isExecutable: p.isExecutable,
        participantId: participant ? participant.participantId : null,
        participantName: participant ? participant.participantName : null,
        isStandalone: !participant
      });
    });

    return result;
  } catch (e) {
    console.warn('Failed to extract root elements:', e);
    return [];
  }
}

/**
 * Show custom properties for a root element (non-visual BPMN element).
 * Creates a wrapper so extractProperties/updateProperty can work.
 *
 * @param {Object} rootEl - {id, type, name, moddleElement}
 * @param {Object} bpmnModeler - The bpmn-js modeler instance
 */
function showRootElementProperties(rootEl, bpmnModeler) {
  if (!rootEl || !rootEl.moddleElement) return;

  // For Collaboration: clear canvas selection and show dashed borders on all pools.
  // For Process: the visual feedback (pool selection) is handled by the caller
  // via selection.select() — don't duplicate with markers here.
  if (rootEl.type === 'bpmn:Collaboration') {
    const selection = bpmnModeler.get('selection');
    if (selection && selection.get().length > 0) {
      selection.select(null);
    }
    _showCanvasHighlight(rootEl, bpmnModeler);
  }

  // Create a wrapper that looks like a bpmn-js element
  var wrapper = {
    id: rootEl.id,
    type: rootEl.type,
    businessObject: rootEl.moddleElement,
    _isRootElement: true
  };

  var props = extractProperties(wrapper, customPropertiesConfig);

  if (props && props.length > 0) {
    sidebarInstance.updateCustomProperties(props, function(propDef, newValue) {
      var modeling = bpmnModeler.get('modeling');
      var moddle = bpmnModeler.get('moddle');

      // For root elements, we cannot use modeling.updateProperties directly
      // because there's no visual shape in the element registry.
      // Instead, use updateModdleProperties with any visual element as context.
      updateRootProperty(bpmnModeler, wrapper, propDef, newValue, modeling, moddle);
    });
  } else {
    var elementType = String(rootEl.type).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var elementId = String(rootEl.id).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var elementName = String(rootEl.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    sidebarInstance.updateCustomProperties(
      '<p><b>' + _t('sidebar.info.name') + ':</b> ' + elementName + '</p>' +
      '<p><b>' + _t('sidebar.info.id') + ':</b> ' + elementId + '</p>' +
      '<p><b>' + _t('sidebar.info.type') + ':</b> ' + elementType + '</p>' +
      '<p>' + _t('sidebar.info.noConfig') + '</p>'
    );
  }
}

/**
 * Update a property on a root element (non-visual BPMN element like Process).
 * Uses updateModdleProperties with a visual context element since
 * root elements have no shapes in the element registry.
 *
 * @param {Object} bpmnModeler
 * @param {Object} wrapper - The root element wrapper
 * @param {Object} propDef
 * @param {string} newValue
 * @param {Object} modeling
 * @param {Object} moddle
 */
function updateRootProperty(bpmnModeler, wrapper, propDef, newValue, modeling, _moddle) {
  var pathParts = propDef.xpath.split('/');
  var bo = wrapper.businessObject;

  function getPropName(part) {
    return part.replace('bpmn:', '');
  }

  // For simple properties directly on the root element (like 'name')
  // or nested properties, we need a visual context element.
  // We use the first available visual element, or the canvas root if no elements exist.
  var elementRegistry = bpmnModeler.get('elementRegistry');
  var allElements = elementRegistry.getAll();
  var contextElement = allElements.length > 0 ? allElements[0] : bpmnModeler.get('canvas').getRootElement();

  if (!contextElement) {
    console.warn('Cannot update root element property: no context element available');
    return;
  }

  // Traverse to find the target moddle element
  var currentBo = bo;
  var targetPropName = '';

  for (var i = 0; i < pathParts.length; i++) {
    var part = getPropName(pathParts[i]);

    if (i === pathParts.length - 1) {
      targetPropName = part;
    } else {
      if (!currentBo || currentBo[part] === undefined) {
        console.warn('Cannot update root property: path "' + part + '" missing');
        return;
      }
      currentBo = currentBo[part];
      if (Array.isArray(currentBo)) {
        currentBo = currentBo[0];
      }
    }
  }

  // Determine which moddle element to update
  var moddleElementToUpdate;
  var propertiesToSet;

  if ([ 'attribute', 'date', 'number', 'boolean' ].indexOf(propDef.type) !== -1) {
    if (pathParts.length === 1) {

      // Direct property on the root element itself
      moddleElementToUpdate = bo;
    } else {

      // Nested property - update the parent moddle element
      moddleElementToUpdate = currentBo;
    }

    var updateValue = newValue;
    if (propDef.type === 'number') {
      var num = Number(newValue);
      if (isNaN(num)) {
        console.warn('Invalid number: ' + newValue);
        return;
      }
      updateValue = num;
    } else if (propDef.type === 'boolean') {
      updateValue = (newValue === 'true' || newValue === '1' || newValue === true);
    }

    propertiesToSet = {};
    propertiesToSet[targetPropName] = updateValue;

  } else if (propDef.type === 'elementText') {
    moddleElementToUpdate = currentBo;
    propertiesToSet = { text: newValue };

  } else if (propDef.type === 'json') {
    moddleElementToUpdate = currentBo;
    var json = {};
    try {
      json = JSON.parse(currentBo.text || '{}');
    } catch (_e) {
      console.warn('Invalid JSON in root element, resetting');
    }

    if (propDef.jsonPath) {
      var valueToStore = newValue;
      if (propDef.inputType === 'number') {
        var parsedNum = Number(newValue);
        if (isNaN(parsedNum)) {
          console.warn('Invalid number for JSON: ' + newValue);
          return;
        }
        valueToStore = parsedNum;
      } else if (propDef.inputType === 'boolean') {
        valueToStore = (newValue === 'true' || newValue === '1' || newValue === true);
      } else if (propDef.inputType === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newValue) && newValue !== '') {
          console.warn('Invalid date: ' + newValue);
          return;
        }
      }
      setDeep(json, propDef.jsonPath, valueToStore);
    }
    propertiesToSet = { text: JSON.stringify(json, null, 2) };
  }

  if (moddleElementToUpdate && propertiesToSet) {
    modeling.updateModdleProperties(contextElement, moddleElementToUpdate, propertiesToSet);
  }
}

/**
 * Highlight related visual elements on the canvas when a root element
 * (Collaboration or Process) is selected in the sidebar.
 * Uses canvas markers to add CSS classes for visual feedback.
 *
 * @param {Object} rootEl - The root element info from extractRootElements
 * @param {Object} bpmnModeler - The bpmn-js modeler instance
 */
var _canvasHighlight = null;

function _showCanvasHighlight(rootEl, bpmnModeler) {
  _clearCanvasHighlight(bpmnModeler);

  var canvas = bpmnModeler.get('canvas');
  var elementRegistry = bpmnModeler.get('elementRegistry');
  var highlightedElements = [];

  if (rootEl.type === 'bpmn:Collaboration') {

    // Highlight all participant pool lanes
    var participants = elementRegistry.filter(function(el) {
      return el.type === 'bpmn:Participant';
    });
    participants.forEach(function(p) {
      canvas.addMarker(p, 'root-hl-collaboration');
      highlightedElements.push(p);
    });

  } else if (rootEl.type === 'bpmn:Process' && rootEl.participantId) {

    // Highlight the pool that references this process
    var participant = elementRegistry.get(rootEl.participantId);
    if (participant) {

      // Use a different marker for process → pool association
      canvas.addMarker(participant, 'root-hl-process-pool');
      highlightedElements.push(participant);

      // Also scroll to make it visible
      try {
        canvas.scrollToElement(participant, { top: 40, bottom: 40, left: 40, right: 40 });
      } catch (_e) { /* scroll may fail if element not rendered */ }
    }
  }

  // For standalone processes, we cannot highlight anything on canvas

  _canvasHighlight = { elements: highlightedElements };
}

/**
 * Remove all canvas highlights added by _showCanvasHighlight.
 *
 * @param {Object} bpmnModeler - The bpmn-js modeler instance
 */
function _clearCanvasHighlight(bpmnModeler) {
  if (!_canvasHighlight || !_canvasHighlight.elements) return;

  var canvas = bpmnModeler.get('canvas');
  _canvasHighlight.elements.forEach(function(el) {
    try {
      canvas.removeMarker(el, 'root-hl-collaboration');
      canvas.removeMarker(el, 'root-hl-process-pool');
    } catch (_e) { /* ignore errors on destroyed elements */ }
  });

  _canvasHighlight = null;
}

// Re-define setDeep locally for the root element update path
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

function setupModelerListeners(bpmnModeler) {
  bpmnModeler.on('import.done', function(event) {

    // Extract and display root elements after import
    var rootEls = extractRootElements(bpmnModeler);
    sidebarInstance.setRootElements(rootEls);

    return vscode.postMessage({
      type: 'import',
      error: event.error?.message,
      warnings: event.warnings.map(function(warning) { return warning.message; }),
      idx: -1
    });
  });

  bpmnModeler.on('commandStack.changed', function() {

    /**
     * @type { import('diagram-js/lib/command/CommandStack').default }
     */
    const commandStack = bpmnModeler.get('commandStack');

    // Remember currently selected root element ID before rebuilding tree
    var selectedRoot = sidebarInstance.getSelectedRootElement();
    var selectedRootId = selectedRoot ? selectedRoot.id : null;

    // Always refresh the root elements tree (participants may have been
    // added/deleted, which changes the Collaboration/Process hierarchy)
    var rootEls = extractRootElements(bpmnModeler);
    sidebarInstance.setRootElements(rootEls, selectedRootId);

    // If something is still selected, refresh its properties
    // (the moddle element may have been mutated by the command)
    selectedRoot = sidebarInstance.getSelectedRootElement();
    if (selectedRoot) {
      showRootElementProperties(selectedRoot, bpmnModeler);
    } else if (selectedRootId) {

      // Previously selected root element was deleted — clear highlight
      _clearCanvasHighlight(bpmnModeler);

      // Also clear selection if we were highlighting a pool for a process
      var selection = bpmnModeler.get('selection');
      if (selection && selection.get().length > 0) {
        selection.select(null);
      }
    }

    return vscode.postMessage({
      type: 'change',
      idx: commandStack._stackIdx
    });
  });

  bpmnModeler.on('canvas.focus.changed', (event) => {
    return vscode.postMessage({
      type: 'canvas-focus-change',
      value: event.focused
    });
  });

  bpmnModeler.on('selection.changed', function(event) {

    // Don't clear sidebar root selection when this change was triggered
    // by clicking a Process in the root elements tree (it selects the
    // associated pool for visual feedback while keeping process props).
    if (_selectingRootElement) return;

    const newSelection = event.newSelection;

    if (newSelection && newSelection.length === 1) {

      // Canvas element selected → clear root element pseudo-selection
      sidebarInstance.clearRootElementSelection();

      const selectedElement = newSelection[0];
      const props = extractProperties(selectedElement, customPropertiesConfig);

      if (props && props.length > 0) {
        sidebarInstance.updateCustomProperties(props, function(propDef, newValue) {

          // Handle update
          const modeling = bpmnModeler.get('modeling');
          const moddle = bpmnModeler.get('moddle');
          updateProperty(selectedElement, propDef, newValue, modeling, moddle);
        });
      } else {

        // Display basic info and a message if no custom props or error
        const elementId = String(selectedElement.id).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const elementType = String(selectedElement.type).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        sidebarInstance.updateCustomProperties(
          '<p><b>' + _t('sidebar.info.id') + ':</b> ' + elementId + '</p>' +
        '<p><b>' + _t('sidebar.info.type') + ':</b> ' + elementType + '</p>' +
        '<p>' + _t('sidebar.info.noConfig') + '</p>');
      }
    } else if (!newSelection || newSelection.length === 0) {

      // Deselection: only show placeholder if no root element is currently selected
      if (!sidebarInstance.getSelectedRootElement()) {
        sidebarInstance.updateCustomProperties(
          '<p>' + _t('sidebar.info.selectHint') + '</p>'
        );
      }
    }

    // Clear root element highlight when canvas selection changes
    // (only if a new element is actually selected on canvas,
    // and not during a root-driven selection for visual feedback)
    if (newSelection && newSelection.length > 0 && !_selectingRootElement) {
      _clearCanvasHighlight(bpmnModeler);
    }
  });
}


// handle messages from the extension
window.addEventListener('message', async (event) => {

  const {
    type,
    body,
    requestId
  } = event.data;

  switch (type) {
  case 'init':
    if (!body.content) {
      return modeler.createDiagram();
    } else {
      return modeler.importXML(body.content);
    }

  case 'update': {
    if (body.content) {
      return modeler.importXML(body.content);
    }

    if (body.undo) {
      return modeler.get('commandStack').undo();
    }

    if (body.redo) {
      return modeler.get('commandStack').redo();
    }

    break;
  }

  case 'getText':
    return modeler.saveXML({ format: true }).then((result) => {
      return vscode.postMessage({
        type: 'response',
        requestId,
        body: result.xml
      });
    });

  case 'focusCanvas':
    modeler.get('canvas').focus();
    return;
  case 'customConfig': // Handler for receiving custom properties configuration
    customPropertiesConfig = event.data.body || {};
    console.log('Custom properties configuration received:', customPropertiesConfig);

    // Refresh root elements with new config (if any root element is selected)
    var selectedRoot = sidebarInstance.getSelectedRootElement();
    if (selectedRoot) {
      showRootElementProperties(selectedRoot, modeler);
    }

    return;
  }
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
