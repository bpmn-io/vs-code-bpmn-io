"use strict";
import * as vscode from "vscode";
import * as path from "path";

import { BpmnViewerBuilder } from '../builder/bpmnViewerBuilder';

const fs = require("fs");

export class BpmnViewerProvider implements vscode.TextDocumentContentProvider {

  public constructor(private _context: vscode.ExtensionContext) { }

  private getUri(...p: string[]): vscode.Uri {
    return vscode.Uri.file(path.join(this._context.extensionPath, ...p))
      .with({ scheme: 'vscode-resource' });
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    const docPath = uri.with({ scheme: 'vscode-resource' });

    const contents = fs.readFileSync(docPath.path, { encoding: 'utf8' });

    const viewerDistroUri = this.getUri('node_modules', 'bpmn-js', 'dist', 'bpmn-navigated-viewer.development.js');

    const builder = new BpmnViewerBuilder(contents, viewerDistroUri);
    
    return builder.buildViewerView();
  }
}