"use strict";

import { BpmnModelerProvider, BpmnViewerProvider } from "./provider";

import * as vscode from "vscode";

import { ExtensionContext, Uri, WebviewPanel } from "vscode";

import * as path from "path";

const fs = require("fs");

const viewTypeModeler = "bpmn.preview.modeler";
const viewTypeViewer = "bpmn.preview.viewer";

interface BpmnPreviewPanel {
  panel: WebviewPanel;
  resource: Uri;
  provider: BpmnViewerProvider | BpmnModelerProvider;
}

function createPreview(
  context: ExtensionContext,
  uri: Uri,
  provider: BpmnModelerProvider | BpmnViewerProvider
): BpmnPreviewPanel {
  
  const column =
    (vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn) ||
    vscode.ViewColumn.One;

  const previewColumn = column + 1;

  const panel = vscode.window.createWebviewPanel(
    viewTypeModeler,
    getPreviewTitle(uri, provider),
    previewColumn,
    getWebviewOptions(context, uri)
  );

  panel.webview.html = provider.provideTextDocumentContent(uri);

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
  const docPath = uri.with({ scheme: 'vscode-resource' });

  fs.writeFileSync(docPath.path, content, { encoding: 'utf8' });
}

function getPreviewTitle(
  uri: Uri, 
  provider: BpmnModelerProvider | BpmnViewerProvider
): string {

  const type = provider.constructor.name;

  const prefix = type === 'BpmnModelerProvider' ? 'Edit' : 'Preview';

  return `${prefix}: ${path.basename(uri.fsPath)}`;
}

function getWebviewOptions(context: ExtensionContext, uri: Uri) {
  return {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: getLocalResourceRoots(context, uri)
  };
}

function refresh(
  preview: BpmnPreviewPanel
) {
  const { resource, panel, provider } = preview;

  panel.webview.html = provider.provideTextDocumentContent(resource);
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

  if (!resource.scheme || resource.scheme === "file") {
    return baseRoots.concat(vscode.Uri.file(path.dirname(resource.fsPath)));
  }

  return baseRoots;
}

export function activate(context: ExtensionContext) {

  const openedPanels: BpmnPreviewPanel[] = [];
  const modelerProvider = new BpmnModelerProvider(context);
  const viewerProvider = new BpmnViewerProvider(context);

  const _revealIfAlreadyOpened = (
    uri: Uri, 
    provider: BpmnModelerProvider | BpmnViewerProvider
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
    preview: BpmnPreviewPanel
  ): void => {

    // on closed
    preview.panel.onDidDispose(() => {
      openedPanels.splice(openedPanels.indexOf(preview), 1);
    });

    // on changed
    preview.panel.onDidChangeViewState(() => {
      refresh(preview);
    });

    openedPanels.push(preview);
  };

  const _registerCommands = (): void => {
    vscode.commands.registerCommand("extension.bpmn-preview-viewer", (uri: Uri) => {
      if (!_revealIfAlreadyOpened(uri, viewerProvider)) {
        _registerPanel(createPreview(context, uri, viewerProvider));
      }
    });

    vscode.commands.registerCommand("extension.bpmn-preview-modeler", (uri: Uri) => {
      if (!_revealIfAlreadyOpened(uri, modelerProvider)) {
        _registerPanel(createPreview(context, uri, modelerProvider));
      }
    });
  };

  const _serializePanel = (
    provider: BpmnViewerProvider | BpmnModelerProvider,
    viewType: string
  ): void => {

    if (vscode.window.registerWebviewPanelSerializer) {
      vscode.window.registerWebviewPanelSerializer(viewType, {
        async deserializeWebviewPanel(panel: WebviewPanel, state: any) {

          const resource = Uri.parse(state.resource.fsPath);

          panel.title = panel.title || getPreviewTitle(resource, provider);
          panel.webview.options = getWebviewOptions(context, resource);
          panel.webview.html = provider.provideTextDocumentContent(resource);

          _registerPanel({ panel, resource, provider });
        }
      });
    }
  };

  _registerCommands();
  _serializePanel(modelerProvider, viewTypeModeler);
  _serializePanel(viewerProvider, viewTypeViewer);
}

export function deactivate() {}
