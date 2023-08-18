# BPMN Editor

[![CI](https://github.com/bpmn-io/vs-code-bpmn-io/workflows/CI/badge.svg)](https://github.com/bpmn-io/vs-code-bpmn-io/actions?query=workflow%3ACI)

View and edit BPMN diagrams in [VS Code](https://code.visualstudio.com/), powered by [bpmn.io tools](https://bpmn.io/).

![VSCode BPMN Editor in use](https://raw.githubusercontent.com/bpmn-io/vs-code-bpmn-io/main/docs/screenshot.png)


## Features

* View and edit [BPMN files](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)
* Save changes to your local file
* Undo/redo and other keyboard shortcuts
* Create from empty `.bpmn` files


## How to get it

Type `vs-code-bpmn-io` in the Extensions section and directly install it. You can also download it in the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=bpmn-io.vs-code-bpmn-io) or [setup it locally](#development-setup). 

Besides that, several release versions are available from the [releases page](https://github.com/bpmn-io/vs-code-bpmn-io/releases). To install such `.vsix` packages, simply use following command.

```sh
code --install-extension ./vs-code-bpmn-io-[VERSION].vsix
```


## Development Setup

First step, clone this project to your local machine.

```sh
git clone https://github.com/bpmn-io/vs-code-bpmn-io.git
cd ./vs-code-bpmn-io
npm install
code .
```

Press `F5` to load and debug the extension in a new VS Code instance.

To execute the test suite simply use

```sh
npm run test
```

The extension integration tests can also be executed from VS Code itself, simple choose the *Extension Tests* in the Debug mode.

## Go further

* Get a [Quickstart](./docs/DEVELOPMENT_QUICKSTART.md) on how to develop VS Code extensions
* Learn how to [release a new version](./docs/RELEASING.md)

## License

MIT

Contains parts ([bpmn-js](https://github.com/bpmn-io/bpmn-js)) released under the [bpmn.io license](http://bpmn.io/license).
