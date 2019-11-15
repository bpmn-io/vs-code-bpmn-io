"use strict";

import { BpmnModelerProvider, BpmnViewerProvider } from "./provider";

import * as vscode from "vscode";

import { ExtensionContext, Uri, WebviewPanel } from "vscode";

import * as path from "path";

const viewTypeModeler = "bpmn.preview.modeler";
const viewTypeViewer = "bpmn.preview.viewer";

interface BpmnPreviewPanel {
  panel: WebviewPanel;
  resource: Uri;
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
    getPreviewTitle(uri),
    previewColumn,
    getWebviewOptions(context, uri)
  );

  panel.webview.html = provider.provideTextDocumentContent(uri);

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

function refresh(preview: BpmnPreviewPanel, provider: BpmnModelerProvider) {
  const { resource, panel } = preview;

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

  const _revealIfAlreadyOpened = (uri: Uri): boolean => {
    const opened = openedPanels.find(
      panel => panel.resource.fsPath === uri.fsPath
    );

    if (!opened) {
      return false;
    }

    opened.panel.reveal(opened.panel.viewColumn);

    return true;
  };

  const _registerPanel = (preview: BpmnPreviewPanel): void => {
    // on closed
    preview.panel.onDidDispose(() => {
      openedPanels.splice(openedPanels.indexOf(preview), 1);
    });

    // on changed
    preview.panel.onDidChangeViewState(() => {
      refresh(preview, modelerProvider);
    });

    openedPanels.push(preview);
  };

  const _registerCommands = (): void => {
    vscode.commands.registerCommand("extension.bpmn-preview-viewer", (uri: Uri) => {
      if (!_revealIfAlreadyOpened(uri)) {
        _registerPanel(createPreview(context, uri, viewerProvider));
      }
    });

    vscode.commands.registerCommand("extension.bpmn-preview-modeler", (uri: Uri) => {
      if (!_revealIfAlreadyOpened(uri)) {
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

          panel.title = panel.title || getPreviewTitle(resource);
          panel.webview.options = getWebviewOptions(context, resource);
          panel.webview.html = provider.provideTextDocumentContent(resource);

          _registerPanel({ panel, resource });
        }
      });
    }
  };

  _registerCommands();
  _serializePanel(modelerProvider, viewTypeModeler);
  _serializePanel(viewerProvider, viewTypeViewer);
}

export function deactivate() {}
