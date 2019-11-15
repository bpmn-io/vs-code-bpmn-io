# vs-code-bpmn-io

![GitHub package.json version](https://img.shields.io/github/package-json/v/pinussilvestrus/vs-code-bpmn-io?style=flat-square) ![vs-code-support](https://img.shields.io/badge/Visual%20Studio%20Code-1.38.0+-blue.svg?style=flat-square)

VS Code Extension for Displaying BPMN 2.0 Files based on [bpmn.io](https://bpmn.io/).

## Features

* [x] Preview BPMN 2.0 files in VS Code
* [x] Open BPMN 2.0 in a Modeler to make changes to your diagrams
* [x] Save changes to your local file

![alt](./resources/screencast_preview.gif)

## How to get it

Type `vs-code-bpmn-io` in the Extensions section and directly install it. You can also download it in the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=salaboy.vs-code-bpmn-io) or [setup it locally](#development-setup).


## Development Setup

First step, clone this project to your local machine.

```sh
$ git clone https://github.com/pinussilvestrus/vs-code-bpmn-io.git
$ cd ./vs-code-bpmn-io
$ npm install
$ code .
```

Press `F5` to load and debug the extension in a new VS Code instance.

## License

MIT

Contains parts ([bpmn-js](https://github.com/bpmn-io/bpmn-js)) released under the [bpmn.io license](http://bpmn.io/license).
