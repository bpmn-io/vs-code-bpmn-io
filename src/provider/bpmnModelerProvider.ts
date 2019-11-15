"use strict";
import * as vscode from "vscode";
import * as path from "path";

import { BpmnModelerBuilder } from '../builder/bpmnModelerBuilder';

const fs = require("fs");

export class BpmnModelerProvider implements vscode.TextDocumentContentProvider {

  public constructor(private _context: vscode.ExtensionContext) { }

  private getUri(...p: string[]): vscode.Uri {
    return vscode.Uri.file(path.join(this._context.extensionPath, ...p))
      .with({ scheme: 'vscode-resource' });
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    const docPath = uri.with({ scheme: 'vscode-resource' });

    const contents = fs.readFileSync(docPath.path, { encoding: 'utf8' });

    const modelerDistroUri = this.getUri('node_modules', 'bpmn-js', 'dist', 'bpmn-modeler.development.js');

    const cssFilesUris = [
      this.getUri('node_modules', 'bpmn-js', 'dist', 'assets', 'diagram-js.css'),
      this.getUri('node_modules', 'bpmn-js', 'dist', 'assets', 'bpmn-font', 'css', 'bpmn.css')
    ];

    const builder = new BpmnModelerBuilder(contents, modelerDistroUri, cssFilesUris);
    
    return builder.buildModelerView();
  }
}