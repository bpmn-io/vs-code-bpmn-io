import {
  isCmd,
  isKey,
  isCopy,
  isPaste
} from 'diagram-js/lib/features/keyboard/KeyboardUtil';

/**
 * @typedef {import('diagram-js/lib/features/editor-actions/EditorActions').default} EditorActions
 * @typedef {import('diagram-js/lib/core/EventBus').default} EventBus
 * @typedef {import('diagram-js/lib/features/keyboard/Keyboard').default} Keyboard
 */

var LOW_PRIORITY = 500;


/**
 * Adds default keyboard bindings.
 *
 * This does not pull in any features will bind only actions that
 * have previously been registered against the editorActions component.
 *
 * @param {EventBus} eventBus
 * @param {Keyboard} keyboard
 */
export default function KeyboardBindings(eventBus, keyboard) {

  eventBus.on('editorActions.init', LOW_PRIORITY, (event) => {

    var editorActions = event.editorActions;

    this.registerBindings(keyboard, editorActions);
  });
}

KeyboardBindings.$inject = [
  'eventBus',
  'keyboard'
];


/**
 * Register available keyboard bindings.
 *
 * @param {Keyboard} keyboard
 * @param {EditorActions} editorActions
 */
KeyboardBindings.prototype.registerBindings = function(keyboard, editorActions) {

  /**
   * Add keyboard binding if respective editor action
   * is registered.
   *
   * @param {string} action name
   * @param {Function} fn that implements the key binding
   */
  function addListener(action, fn) {

    if (editorActions.isRegistered(action)) {
      keyboard.addListener(fn);
    }
  }

  // undo
  //
  // managed by VSCode

  // redo
  //
  // managed by VSCode

  // copy
  // CTRL/CMD + C
  addListener('copy', function(context) {

    var event = context.keyEvent;

    if (isCopy(event)) {
      editorActions.trigger('copy');

      return true;
    }
  });

  // paste
  // CTRL/CMD + V
  addListener('paste', function(context) {

    var event = context.keyEvent;

    if (isPaste(event)) {
      editorActions.trigger('paste');

      return true;
    }
  });

  // zoom in one step
  // CTRL/CMD + +
  addListener('stepZoom', function(context) {

    var event = context.keyEvent;

    // quirk: it has to be triggered by `=` as well to work on international keyboard layout
    // cf: https://github.com/bpmn-io/bpmn-js/issues/1362#issuecomment-722989754
    if (isKey([ '+', 'Add', '=' ], event) && isCmd(event)) {
      editorActions.trigger('stepZoom', { value: 1 });

      return true;
    }
  });

  // zoom out one step
  // CTRL + -
  addListener('stepZoom', function(context) {

    var event = context.keyEvent;

    if (isKey([ '-', 'Subtract' ], event) && isCmd(event)) {
      editorActions.trigger('stepZoom', { value: -1 });

      return true;
    }
  });

  // zoom to the default level
  // CTRL + 0
  addListener('zoom', function(context) {

    var event = context.keyEvent;

    if (isKey('0', event) && isCmd(event)) {
      editorActions.trigger('zoom', { value: 1 });

      return true;
    }
  });

  // delete selected element
  // DEL
  addListener('removeSelection', function(context) {

    var event = context.keyEvent;

    if (isKey([ 'Backspace', 'Delete', 'Del' ], event)) {
      editorActions.trigger('removeSelection');

      return true;
    }
  });

  // select all elements
  // CTRL + A
  addListener('selectElements', function(context) {

    var event = context.keyEvent;

    if (keyboard.isKey([ 'a', 'A' ], event) && keyboard.isCmd(event)) {
      editorActions.trigger('selectElements');

      return true;
    }
  });

  // search labels
  // CTRL + F
  addListener('find', function(context) {

    var event = context.keyEvent;

    if (keyboard.isKey([ 'f', 'F' ], event) && keyboard.isCmd(event)) {
      editorActions.trigger('find');

      return true;
    }
  });

  // activate space tool
  // S
  addListener('spaceTool', function(context) {

    var event = context.keyEvent;

    if (keyboard.hasModifier(event)) {
      return;
    }

    if (keyboard.isKey([ 's', 'S' ], event)) {
      editorActions.trigger('spaceTool');

      return true;
    }
  });

  // activate lasso tool
  // L
  addListener('lassoTool', function(context) {

    var event = context.keyEvent;

    if (keyboard.hasModifier(event)) {
      return;
    }

    if (keyboard.isKey([ 'l', 'L' ], event)) {
      editorActions.trigger('lassoTool');

      return true;
    }
  });

  // activate hand tool
  // H
  addListener('handTool', function(context) {

    var event = context.keyEvent;

    if (keyboard.hasModifier(event)) {
      return;
    }

    if (keyboard.isKey([ 'h', 'H' ], event)) {
      editorActions.trigger('handTool');

      return true;
    }
  });

  // activate global connect tool
  // C
  addListener('globalConnectTool', function(context) {

    var event = context.keyEvent;

    if (keyboard.hasModifier(event)) {
      return;
    }

    if (keyboard.isKey([ 'c', 'C' ], event)) {
      editorActions.trigger('globalConnectTool');

      return true;
    }
  });

  // activate direct editing
  // E
  addListener('directEditing', function(context) {

    var event = context.keyEvent;

    if (keyboard.hasModifier(event)) {
      return;
    }

    if (keyboard.isKey([ 'e', 'E' ], event)) {
      editorActions.trigger('directEditing');

      return true;
    }
  });

  // activate replace element
  // R
  addListener('replaceElement', function(context) {

    var event = context.keyEvent;

    if (keyboard.hasModifier(event)) {
      return;
    }

    if (keyboard.isKey([ 'r', 'R' ], event)) {
      editorActions.trigger('replaceElement', event);

      return true;
    }
  });

};
