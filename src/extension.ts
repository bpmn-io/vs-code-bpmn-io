'use strict';

import * as vscode from 'vscode';

import { ExtensionContext, Uri, WebviewPanel, Webview } from 'vscode';

import path from 'node:path';

import fs from 'node:fs';

import { EditingProvider } from './features/editing';

const editingType = 'bpmn-io.editing';

const COMMANDS = {
  EDIT_CMD: 'extension.bpmn-io.edit'
};

function createPanel(
    context: ExtensionContext,
    uri: Uri,
    provider: EditingProvider
): BpmnEditorPanel {

  const editorColumn =
    (vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn) ||
    vscode.ViewColumn.One;

  const panel = vscode.window.createWebviewPanel(
    editingType,
    getPanelTitle(uri, provider),
    editorColumn,
    getWebviewOptions(context, uri)
  );

  // set content
  panel.webview.html = provider.provideTextDocumentContent(uri, panel.webview);

  // set panel icons
  const {
    extensionPath
  } = context;

  panel.iconPath = {
    light: getUri(extensionPath, 'resources', 'icon_light.svg'),
    dark: getUri(extensionPath, 'resources', 'icon_dark.svg')
  };

  // handling messages from the webview content
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
      case 'saveContent':
        return saveFile(uri, message.content);
      }
    },
    undefined,
    context.subscriptions
  );

  return { panel, resource: uri, provider };
}

function saveFile(uri: vscode.Uri, content: string) {
  const { fsPath: docPath } = uri.with({ scheme: 'vscode-resource' });

  fs.writeFileSync(docPath, content, { encoding: 'utf8' });
}

function refresh(
    editor: BpmnEditorPanel
) {
  const {
    resource,
    panel,
    provider
  } = editor;

  panel.webview.html =
    provider.provideTextDocumentContent(resource, panel.webview);
}

function autoSaveIfConfigured(editorPanel: BpmnEditorPanel, expectedStates: string[]) {
  const config = vscode.workspace.getConfiguration();

  const autoSaveConfiguration: any = config.get('files.autoSave');

  // do not save changes if autosave option does not satisfy
  if (
    autoSaveConfiguration === 'off' ||
    expectedStates.indexOf(autoSaveConfiguration) < 0
  ) {
    return;
  }

  sendMessage('saveFile', editorPanel.panel.webview);
}


// Extension API //////////

export interface BpmnEditorPanel {
  panel: WebviewPanel;
  resource: Uri;
  provider: EditingProvider;
}

export function activate(context: ExtensionContext) {

  const openedPanels: BpmnEditorPanel[] = [];
  const editingProvider = new EditingProvider(context);

  const _revealIfAlreadyOpened = (
      uri: Uri,
      provider: EditingProvider
  ): boolean => {

    const opened = openedPanels.find(panel => {
      const {
        resource,
        provider: panelProvider
      } = panel;

      return resource.fsPath === uri.fsPath && panelProvider === provider;
    });

    if (!opened) {
      return false;
    }

    opened.panel.reveal(opened.panel.viewColumn);

    return true;
  };

  const _registerPanel = (
      editorPanel: BpmnEditorPanel
  ): void => {

    // on editor closed
    editorPanel.panel.onDidDispose(() => {
      openedPanels.splice(openedPanels.indexOf(editorPanel), 1);

      /**
       * Note @pinussilvestrus
       *
       * We currently can't retrieve when a webview panel will be closed to save changes
       * before, cf. https://github.com/bpmn-io/vs-code-bpmn-io/issues/71#issuecomment-637543431
       */
      // autosaveIfConfigured(editorPanel, ['onFocusChange', 'onWindowChange', 'afterDelay']);
    });

    // on editor visibility changed
    editorPanel.panel.onDidChangeViewState(() => {
      refresh(editorPanel);

      autoSaveIfConfigured(editorPanel, [ 'onFocusChange', 'onWindowChange' ]);
    });

    openedPanels.push(editorPanel);
  };

  const _registerCommands = (): void => {
    const {
      EDIT_CMD
    } = COMMANDS;

    vscode.commands.registerCommand(EDIT_CMD, (uri: Uri) => {
      const documentUri = getDocumentUri(uri);

      if (documentUri && !_revealIfAlreadyOpened(documentUri, editingProvider)) {
        const panel = createPanel(context, documentUri, editingProvider);

        _registerPanel(panel);

        return panel;
      }
    });
  };

  const _serializePanel = (
      provider: EditingProvider
  ): void => {

    const viewType = editingType;

    if (vscode.window.registerWebviewPanelSerializer) {
      vscode.window.registerWebviewPanelSerializer(viewType, {
        async deserializeWebviewPanel(panel: WebviewPanel, state: any) {

          if (!state || !state.resourcePath) {
            return;
          }

          const resource = Uri.parse(state.resourcePath);

          panel.title = panel.title || getPanelTitle(resource, provider);
          panel.webview.options = getWebviewOptions(context, resource);
          panel.webview.html =
            provider.provideTextDocumentContent(resource, panel.webview);

          _registerPanel({ panel, resource, provider });
        }
      });
    }
  };

  _registerCommands();
  _serializePanel(editingProvider);
}

export function deactivate() {}

// helper ///////

function getPanelTitle(
    uri: Uri,
    _provider: EditingProvider
): string {

  const prefix = 'Edit';

  return `${prefix}: ${path.basename(uri.fsPath)}`;
}

function getWebviewOptions(context: ExtensionContext, uri: Uri) {
  return {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: getLocalResourceRoots(context, uri)
  };
}

function getLocalResourceRoots(
    context: ExtensionContext,
    resource: vscode.Uri
): vscode.Uri[] {

  const baseRoots = [ vscode.Uri.file(context.extensionPath) ];
  const folder = vscode.workspace.getWorkspaceFolder(resource);

  if (folder) {
    return baseRoots.concat(folder.uri);
  }

  if (!resource.scheme || resource.scheme === 'file') {
    return baseRoots.concat(vscode.Uri.file(path.dirname(resource.fsPath)));
  }

  return baseRoots;
}

function getUri(...p: string[]): vscode.Uri {
  return vscode.Uri.file(path.join(...p));
}

function sendMessage(message: string, webview: Webview) {
  webview.postMessage(message);
}

function getDocumentUri(uri?: Uri) {
  const activeEditor = vscode.window.activeTextEditor;

  return uri || activeEditor?.document.uri;
}
