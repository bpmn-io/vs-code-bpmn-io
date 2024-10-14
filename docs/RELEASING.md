# Releasing

This docs are partly adapted by the official [**VS Code publishing instructions**](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## Setup

We use [`vsce`](https://github.com/microsoft/vscode-vsce) for publishing new version to the VS Code Marketplace. Install it globally

```bash
npm install -g @vscode/vsce
vsce --version
```

As a second step before publishing new versions, you need to get a *personal access token* for our `bpmn-io` marketplace publisher. Refer the [official docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token) to create a new token.

In case you want to do a *dry run* before publishing, simply do

```bash
vsce package
```

This will create a `.vsix` file for the extension. It can be used to share privately or install it via the command line:

```bash
code --install-extension some-extension.vsix
```

## Publish a new Version

Publishing is done by release-please in the [RELEASE.yml](../.github/workflows/RELEASE.yml) action. The action uses an Azure Personal Access Token with Manage permission in the Marketplace group.

## Troubleshooting 

This collects common release errors and possible solutions.

### I receive a 401 error on `vsce publish` although I created an access token

Make sure you registered the personal access token for *all accessible organizations*, not only the `bpmn-io` one.

Context: https://github.com/microsoft/vscode-vsce/issues/11
