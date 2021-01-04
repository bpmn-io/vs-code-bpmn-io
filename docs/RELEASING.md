# Releasing

This docs are partly adapted by the official [**VS Code publishing instructions**](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## Setup

We use [`vsce`](https://github.com/microsoft/vscode-vsce) for publishing new version to the VS Code Marketplace. Install it globally

```bash
$ npm install -g vsce
$ vsce --version
```

or use it directly

```bash
$ npx vsce --version
```

As a second step before publishing new versions, you need to get a *personal access token* for our `bpmn-io` marketplace publisher. Refer the [official docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token) to eventually create a new token.

In case you want to do a *dry run* before publishing, simply do

```bash
$ vsce package
```

This will create a `.vsix` file for the extension. It can be used to share privately.

## Publish a new Version

Use the access token to create and publish a new version to the VS Code Marketplace. Make sure the access token is bound to a [publisher](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher).

```bash
$ vsce publish patch -p <ACCESS_TOKEN>
$ vsce publish minor -p <ACCESS_TOKEN>
$ vsce publish major -p <ACCESS_TOKEN>
```

The version will be auto-incremented by our [semantic versioning schema](https://semver.org/).
