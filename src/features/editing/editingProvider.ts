'use strict';

import * as vscode from 'vscode';

import path from 'node:path';
import fs from 'node:fs';

import { BpmnModelerBuilder } from './bpmnModelerBuilder';

import Ids from 'ids';

const ids = new Ids([ 32, 36, 1 ]);



export class EditingProvider {

  public constructor(private _context: vscode.ExtensionContext) { }

  private getUri(webview: vscode.Webview, ...p: string[]): vscode.Uri {
    const fileUri = vscode.Uri.file(path.join(this._context.extensionPath, ...p));

    return webview.asWebviewUri(fileUri);
  }

  public provideTextDocumentContent(localResource: vscode.Uri, webview: vscode.Webview): string {

    const localDocumentPath = localResource.fsPath;

    let contents = fs.readFileSync(localDocumentPath, { encoding: 'utf8' });

    if (contents === '') {
      contents = this.getInitialDiagram();
    }

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

  private getInitialDiagram(): string {
    const definitionsId = ids.next(),
          processId = ids.next();

    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_${ definitionsId }"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_${ processId }" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${ processId }">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }
}
