'use strict';

import * as vscode from 'vscode';

import { ExtensionContext, Uri, WebviewPanel } from 'vscode';

import * as path from 'path';

const fs = require('fs');

import { EditingProvider } from './features/editing';
import { PreviewProvider } from './features/preview';

const editingType = 'bpmn-io.editing';
const previewType = 'bpmn-io.preview';

const COMMANDS = {
  PREVIEW_CMD: 'extension.bpmn-io.preview',
  EDIT_CMD: 'extension.bpmn-io.edit'
};

interface BpmnPreviewPanel {
  panel: WebviewPanel;
  resource: Uri;
  provider: PreviewProvider | EditingProvider;
}

function createPanel(
  context: ExtensionContext,
  uri: Uri,
  provider: PreviewProvider | EditingProvider
): BpmnPreviewPanel {

  const column =
    (vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn) ||
    vscode.ViewColumn.One;

  const previewColumn = isEditingProvider (provider) ? column : column + 1;

  const panel = vscode.window.createWebviewPanel(
    getViewType(provider),
    getPanelTitle(uri, provider),
    previewColumn,
    getWebviewOptions(context, uri)
  );

  // set content
  panel.webview.html = provider.provideTextDocumentContent(uri);

  // set panel icons
  const {
    extensionPath
  } = context;

  panel.iconPath = {
    light: getUri(extensionPath, 'resources', 'logo_light_panel.png'),
    dark: getUri(extensionPath, 'resources', 'logo_dark_panel.png')
  };

  // handling messages from the webview content
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'saveContent':
          saveFile(uri, message.content);
          return;
      }
    },
    undefined,
    context.subscriptions
  );

  return { panel, resource: uri, provider };
}

function saveFile(uri: vscode.Uri, content: String) {
  const { fsPath: docPath } = uri.with({ scheme: 'vscode-resource' });

  fs.writeFileSync(docPath, content, { encoding: 'utf8' });
}

function refresh(
  preview: BpmnPreviewPanel
) {
  const { resource, panel, provider } = preview;

  panel.webview.html = provider.provideTextDocumentContent(resource);
}

export function activate(context: ExtensionContext) {

  const openedPanels: BpmnPreviewPanel[] = [];
  const editingProvider = new EditingProvider(context);
  const previewProvider = new PreviewProvider(context);

  const _revealIfAlreadyOpened = (
    uri: Uri,
    provider: EditingProvider | PreviewProvider
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
    previewPanel: BpmnPreviewPanel
  ): void => {

    // on closed
    previewPanel.panel.onDidDispose(() => {
      openedPanels.splice(openedPanels.indexOf(previewPanel), 1);
    });

    // on changed
    previewPanel.panel.onDidChangeViewState(() => {
      refresh(previewPanel);
    });

    openedPanels.push(previewPanel);
  };

  const _registerCommands = (): void => {
    const {
      PREVIEW_CMD,
      EDIT_CMD
    } = COMMANDS;

    vscode.commands.registerCommand(PREVIEW_CMD, (uri: Uri) => {
      if (!_revealIfAlreadyOpened(uri, previewProvider)) {
        _registerPanel(createPanel(context, uri, previewProvider));
      }
    });

    vscode.commands.registerCommand(EDIT_CMD, (uri: Uri) => {
      if (!_revealIfAlreadyOpened(uri, editingProvider)) {
        _registerPanel(createPanel(context, uri, editingProvider));
      }
    });
  };

  const _serializePanel = (
    provider: EditingProvider | PreviewProvider
  ): void => {

    const viewType = getViewType(provider);

    if (vscode.window.registerWebviewPanelSerializer) {
      vscode.window.registerWebviewPanelSerializer(viewType, {
        async deserializeWebviewPanel(panel: WebviewPanel, state: any) {

          if(!state || !state.resourcePath) {
            return;
          }

          const resource = Uri.parse(state.resourcePath);

          panel.title = panel.title || getPanelTitle(resource, provider);
          panel.webview.options = getWebviewOptions(context, resource);
          panel.webview.html = provider.provideTextDocumentContent(resource);

          _registerPanel({ panel, resource, provider });
        }
      });
    }
  };

  _registerCommands();
  _serializePanel(editingProvider);
  _serializePanel(previewProvider);
}

export function deactivate() {}


// helper ///////

function isEditingProvider(provider: any) {
  return provider.constructor.name === 'EditingProvider';
}

function getPanelTitle(
  uri: Uri,
  provider: EditingProvider | PreviewProvider
): string {

  const prefix = isEditingProvider(provider) ? 'Edit' : 'Preview';

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

  const baseRoots = [vscode.Uri.file(context.extensionPath)];
  const folder = vscode.workspace.getWorkspaceFolder(resource);

  if (folder) {
    return baseRoots.concat(folder.uri);
  }

  if (!resource.scheme || resource.scheme === 'file') {
    return baseRoots.concat(vscode.Uri.file(path.dirname(resource.fsPath)));
  }

  return baseRoots;
}

function getViewType(provider: any) {
  return isEditingProvider(provider) ? editingType : previewType;
}

function getUri(...p: string[]): vscode.Uri {
  return vscode.Uri.file(path.join(...p));
}
