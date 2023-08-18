import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

import { describe, before, it } from 'mocha';

import { expect } from 'chai';

import * as path from 'node:path';

import * as vscode from 'vscode';

chai.use(sinonChai);


const SIMPLE_TEST_FILE = vscode.Uri.file(
  path.join(__dirname, '..', 'fixtures', 'simple.bpmn')
);

const EMPTY_TEST_FILE = vscode.Uri.file(
  path.join(__dirname, '..', 'fixtures', 'empty.bpmn')
);

const BROKEN_TEST_FILE = vscode.Uri.file(
  path.join(__dirname, '..', 'fixtures', 'broken.bpmn')
);


describe('extension', function() {
  this.timeout(5000);

  before(() => {
    vscode.window.showInformationMessage('Start all tests.');
  });


  describe('basic', () => {

    it('should open file', async () => {

      // when
      await vscode.commands.executeCommand('vscode.open', SIMPLE_TEST_FILE);

      // then
      const extension = await getExtension(SIMPLE_TEST_FILE);

      expect(extension, 'editor open').to.exist;
    });


    it('should open as BPMN', async () => {

      // when
      await vscode.commands.executeCommand('vscode.open', SIMPLE_TEST_FILE);

      // then
      const extension = await getExtension(SIMPLE_TEST_FILE);

      expect(extension, 'editor open').to.exist;
    });


    it('should create new BPMN file', async () => {

      // when
      const uri = await vscode.commands.executeCommand('bpmn-io.bpmnEditor.new') as vscode.Uri;

      // then
      expect(uri, 'uri exists').to.exist;

      const extension = await getExtension(uri);

      expect(extension, 'editor open').to.exist;
    });


    it('should open empty BPMN file', async () => {

      // when
      await vscode.commands.executeCommand('vscode.open', EMPTY_TEST_FILE);

      // then
      const extension = await getExtension(EMPTY_TEST_FILE);

      expect(extension, 'editor open').to.exist;
    });


    it('should open broken BPMN file', async () => {

      // when
      await vscode.commands.executeCommand('vscode.open', BROKEN_TEST_FILE);

      // then
      const extension = await getExtension(BROKEN_TEST_FILE);

      expect(extension, 'editor open').to.exist;
    });


    it('should close opened editor', async () => {

      // given
      await vscode.commands.executeCommand('vscode.open', SIMPLE_TEST_FILE);

      // when
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

      // then
      const extension = await getExtension(SIMPLE_TEST_FILE);

      expect(extension, 'editor closed').not.to.exist;
    });

  });

});


function getExtension(uri: vscode.Uri) {
  return vscode.commands.executeCommand('bpmn-io.bpmnEditor.__state', uri);
}
