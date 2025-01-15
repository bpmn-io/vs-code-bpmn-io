/**
 * It makes the text editing keyboard shortcuts (copy, cut, paste, select all, undo, redo) work on macOS.
 *
 * The default events for those actions are not triggered from keyboard on `contenteditable` elements on macOS.
 * There is an open issue in VS Code repo: https://github.com/microsoft/vscode/issues/203668.
 * The custom implementation might be unnecessary when the issue is resolved.
*/
export function handleMacOsKeyboard() {

  const IS_MAC_OS = window.navigator.userAgentData.platform === 'macOS';

  if (!IS_MAC_OS) return;

  document.addEventListener('focusin', ({ target }) => {

    if (target.contentEditable === 'true') {
      target.addEventListener('keydown', handleKeydown);
      target.addEventListener('blur', () => {
        target.removeEventListener('keydown', handleKeydown);
      });
    }

  });
}

function handleKeydown(event) {

  let action;

  if (event.metaKey /* CMD */) {

    if (event.key === 'a') action = 'selectAll';
    if (event.key === 'c') action = 'copy';
    if (event.key === 'v') return paste(event);
    if (event.key === 'x') action = 'cut';
    if (event.key === 'z') action = 'undo';
    if (event.shiftKey && event.key === 'z') action = 'redo';
  }

  if (action) {
    event.preventDefault();

    /*
    * It is unlikely for `document.execCommand` to be removed from any major browsers.
    * There is currently no alternative other than custom implementation of each action.
    */
    document.execCommand(action);
  }
};

// Running document.execCommand('paste') works, but causes console error.
function paste(event) {
  event.preventDefault();

  navigator.clipboard
    .readText()
    .then(
      (text) => document.execCommand('insertText', false, text),
    );
}
