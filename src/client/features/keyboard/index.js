import Keyboard from 'diagram-js/lib/features/keyboard/Keyboard';

import KeyboardBindings from './KeyboardBindings';

export default {
  __init__: [
    'keyboard',
    'keyboardBindings'
  ],
  keyboard: [ 'type', Keyboard ],
  keyboardBindings: [ 'type', KeyboardBindings ]
};
