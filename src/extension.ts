"use strict";

import { BpmnModelerProvider as BpmnViewerProvider } from './viewerProvider';

import * as vscode from 'vscode';

import {
  ExtensionContext,
  Uri,
  WebviewPanel,
  ViewColumn
} from 'vscode';

import * as path from "path";

const viewType = 'bpmn.preview';

interface BpmnPreviewPanel {
  panel: WebviewPanel;
  resource: Uri;
}

export function activate(context: ExtensionContext) {
  const openedPanels: BpmnPreviewPanel[] = [];
  const provider = new BpmnViewerProvider(context);

  const revealIfAlreadyOpened = (uri: Uri): boolean => {
    const opened = openedPanels.find(panel => panel.resource.fsPath === uri.fsPath);
    if (!opened) {
		return false;
	}
    opened.panel.reveal(opened.panel.viewColumn);
    return true;
  };

  const registerPanel = (preview: BpmnPreviewPanel): void => {

    // on closed
    preview.panel.onDidDispose(() => {
      openedPanels.splice(openedPanels.indexOf(preview), 1);
    });

    // on changed
    preview.panel.onDidChangeViewState(() => {
      refresh(preview, provider);
    });

    openedPanels.push(preview);
  };

  vscode.commands.registerCommand("extension.bpmn-preview", (uri: Uri) => {
    if(!revealIfAlreadyOpened(uri)) {
      registerPanel(createPreview(context, uri, provider));
    }
  });

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(viewType, {
      async deserializeWebviewPanel(panel: WebviewPanel, state: any) {
        const resource = Uri.parse(state.resource.fsPath);
        panel.title = panel.title || getPreviewTitle(resource);
        panel.webview.options = getWebviewOptions(context, resource);
        panel.webview.html = provider.provideTextDocumentContent(resource, state);
        registerPanel({ panel, resource });
      }
    });
  }

}

function createPreview(context: ExtensionContext, uri: Uri, provider: BpmnViewerProvider): BpmnPreviewPanel {
  const panel = vscode.window.createWebviewPanel(
    viewType,
    getPreviewTitle(uri),
    ViewColumn.Active,
    getWebviewOptions(context, uri)
  );
  panel.webview.html = provider.provideTextDocumentContent(uri, { resource: uri });
  return { panel, resource: uri };
}

function getPreviewTitle(uri: Uri): string {
  return `Preview: ${path.basename(uri.fsPath)}`;
}

function getWebviewOptions(context: ExtensionContext, uri: Uri) {
  return {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: getLocalResourceRoots(context, uri)
  };
}


function refresh(preview: BpmnPreviewPanel, provider: BpmnViewerProvider) {

  const {
    resource,
    panel
  } = preview;

  panel.webview.html = provider.provideTextDocumentContent(resource, { resource });
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

export function deactivate() {
}