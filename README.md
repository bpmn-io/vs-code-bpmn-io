# BPMN Editor

[![CI](https://github.com/bpmn-io/vs-code-bpmn-io/actions/workflows/CI.yml/badge.svg)](https://github.com/bpmn-io/vs-code-bpmn-io/actions/workflows/CI.yml)

View and edit BPMN diagrams in [VSCode](https://code.visualstudio.com/). Powered by [bpmn.io tools](https://bpmn.io/).

![VSCode BPMN Editor in use](https://raw.githubusercontent.com/bpmn-io/vs-code-bpmn-io/main/docs/screenshot.png)


## Features

* View and edit [BPMN files](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)
* Save changes to your local file
* Undo/redo and other keyboard shortcuts
* Create from empty `.bpmn` files


## Installation

Download it from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=bpmn-io.vs-code-bpmn-io) or search for `vs-code-bpmn-io` directly inside VSCode.


## Build and Run

First step, clone this project to your local machine and open it with [VSCode](https://code.visualstudio.com/):

```sh
git clone https://github.com/bpmn-io/vs-code-bpmn-io.git
cd ./vs-code-bpmn-io
npm install
code .
```

Press `F5` to load and debug the extension in a new VSCode instance. To exectute the tests choose the *Extension Tests* in the Debug mode.

You can build the extension from the command line, too:

```sh
# execute the test suite
npm run test

# execute all scripts
npm run all
```


## License

MIT

Contains parts ([bpmn-js](https://github.com/bpmn-io/bpmn-js)) released under the [bpmn.io license](http://bpmn.io/license).
