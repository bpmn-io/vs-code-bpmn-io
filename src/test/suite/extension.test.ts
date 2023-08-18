import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

import { describe, before, it } from 'mocha';

import * as path from 'node:path';

import * as vscode from 'vscode';

chai.use(sinonChai);


const TEST_FILE = vscode.Uri.file(
  path.join(__dirname, '..', 'fixtures', 'simple.bpmn')
);


describe('extension', function() {
  this.timeout(5000);

  before(() => {
    vscode.window.showInformationMessage('Start all tests.');
  });


  describe('basic', () => {

    it('should open file', async () => {
      await vscode.commands.executeCommand('vscode.open', TEST_FILE);
    });


    it('should open as BPMN', async () => {
      await vscode.commands.executeCommand('vscode.openWith', TEST_FILE, 'bpmn-io.bpmnEditor');
    });


    it('should create new BPMN file', async () => {
      await vscode.commands.executeCommand('bpmn-io.bpmnEditor.new');
    });

  });

});
