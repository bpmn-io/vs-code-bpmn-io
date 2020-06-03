'use strict';
import * as vscode from 'vscode';
import * as path from 'path';

import { BpmnModelerBuilder } from './bpmnModelerBuilder';

const fs = require('fs');

export class EditingProvider {

  public constructor(private _context: vscode.ExtensionContext) { }

  private getUri(webview: vscode.Webview, ...p: string[]): vscode.Uri {
    const fileUri = vscode.Uri.file(path.join(this._context.extensionPath, ...p));

    return webview.asWebviewUri(fileUri);
  }

  public provideTextDocumentContent(localResource: vscode.Uri, webview: vscode.Webview): string {

    const webViewUri = webview.asWebviewUri(localResource);

    const docPath = webViewUri.fsPath;

    const contents = fs.readFileSync(docPath, { encoding: 'utf8' });

    const builder = new BpmnModelerBuilder(contents, {
      modelerDistro: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'bpmn-modeler.development.js'),
      diagramStyles: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'diagram-js.css'),
      bpmnFont: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'bpmn-font', 'css', 'bpmn.css'),
      modelerStyles: this.getUri(webview, 'out', 'assets', 'modeler.css'),
      resourceUri: localResource
    });

    return builder.buildModelerView();
  }
}