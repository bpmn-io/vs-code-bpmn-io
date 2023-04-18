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

    const localDocumentPath = localResource.fsPath;

    let contents = fs.readFileSync(localDocumentPath, { encoding: 'utf8' });

    if(contents === "") contents = this.getDefaultBpmnDiagram(localDocumentPath);

    const builder = new BpmnModelerBuilder(contents, {
      modelerDistro: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'bpmn-modeler.development.js'),
      diagramStyles: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'diagram-js.css'),
      bpmnStyles: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'bpmn-js.css'),
      bpmnFont: this.getUri(webview, 'node_modules', 'bpmn-js', 'dist', 'assets', 'bpmn-font', 'css', 'bpmn.css'),
      modelerStyles: this.getUri(webview, 'out', 'assets', 'modeler.css'),
      codiconsFont: this.getUri(webview, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'),
      resourceUri: localResource
    });

    return builder.buildModelerView();
  }

  private getDefaultBpmnDiagram(fileName:string):string
  {
    const file:string = path.parse(fileName).name;

    return `<?xml version="1.0" encoding="UTF-8"?>\n`
    +`<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" `
    +`   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" `
    +`   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" `
    +`   id="${file}_Definitions" `
    +`   targetNamespace="http://bpmn.io/schema/bpmn">\n`
    +`  <bpmn:process id="${file}_Process" isExecutable="true">\n`
    +`  </bpmn:process>\n`
    +`  <bpmndi:BPMNDiagram id="${file}_BPMNDiagram">\n`
    +`    <bpmndi:BPMNPlane id="${file}_BPMNPlane" bpmnElement="${file}_Process">\n`
    +`    </bpmndi:BPMNPlane>\n`
    +`  </bpmndi:BPMNDiagram>\n`
    +`</bpmn:definitions>'`
  }
}