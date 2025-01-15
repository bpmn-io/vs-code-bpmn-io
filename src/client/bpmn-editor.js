/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-editor.css';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import BpmnColorPickerModule from 'bpmn-js-color-picker';

import { handleMacOsKeyboard } from './utils/macos-keyboard';

/**
 * @type { import('vscode') }
 */
const vscode = acquireVsCodeApi();

handleMacOsKeyboard();

const modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    BpmnColorPickerModule
  ]
});

modeler.on('import.done', event => {
  return vscode.postMessage({
    type: 'import',
    error: event.error?.message,
    warnings: event.warnings.map(warning => warning.message),
    idx: -1
  });
});

modeler.on('commandStack.changed', () => {

  /**
   * @type { import('diagram-js/lib/command/CommandStack').default }
   */
  const commandStack = modeler.get('commandStack');

  return vscode.postMessage({
    type: 'change',
    idx: commandStack._stackIdx
  });
});

modeler.on('canvas.focus.changed', (event) => {
  return vscode.postMessage({
    type: 'canvas-focus-change',
    value: event.focused
  });
});


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
    return modeler.saveXML({ format: true }).then(({ xml }) => {
      return vscode.postMessage({
        type: 'response',
        requestId,
        body: xml
      });
    });

  case 'focusCanvas':
    modeler.get('canvas').focus();
    return;
  }
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
