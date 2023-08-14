import * as vscode from 'vscode';

import { BpmnEditor } from './bpmn-editor';

export function activate(context: vscode.ExtensionContext) {

  // register our custom editor providers
  context.subscriptions.push(BpmnEditor.register(context));
}
