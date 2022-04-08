import * as chai from 'chai';
import { before, it } from 'mocha';
import * as sinonChai from 'sinon-chai';

import { spy, stub } from 'sinon';

import * as path from 'path';

import * as vscode from 'vscode';

chai.use(sinonChai);

const expect = chai.expect;

const COMMAND = 'extension.bpmn-io.edit';

const TEST_FILE = path.join(__dirname, '..', 'fixtures', 'simple.bpmn');
const TEST_FILE_COLLAPSED_SUBPROCESS = path.join(__dirname, '..', 'fixtures', 'collapsedSubprocess.bpmn');
const TEST_FILE_COMPLEX = path.join(__dirname, '..', 'fixtures', 'complex.bpmn');


suite('Extension Test Suite', () => {
  before(() => {
    vscode.window.showInformationMessage('Start all tests.');
  });

  it('should start without error', async () => {

    // when
    const editor = await openFile(TEST_FILE);

    // given
    expect(editor).not.to.be.empty;
  });


  it('should start without error - collapsed sub process', async () => {

    // when
    const editor = await openFile(TEST_FILE_COLLAPSED_SUBPROCESS);

    // given
    expect(editor).not.to.be.empty;
  });


  it('should start without error - complex', async () => {

    // when
    const editor = await openFile(TEST_FILE_COMPLEX);

    // given
    expect(editor).not.to.be.empty;
  });


  /**
   * Note @pinussilvestrus
   *
   * It's currently not possible to run tests with a pre-configured user setting
   * Cf. https://github.com/microsoft/vscode/issues/97995
   */
  it.skip('should save file if autosave configured', async () => {

    // given
    const editor = await openFile(TEST_FILE);
    const { document } = editor;
    const { uri } = document;

    const saveSpy = spy();

    const bpmnEditorPanel: any = await vscode.commands.executeCommand(COMMAND, uri);

    const {
      panel
    } = bpmnEditorPanel;

    panel.webview.postMessage = saveSpy;

    // when
    await panel._updateViewState({
      active: false
    });

    // then
    expect(saveSpy).to.have.been.called;
  });


  /**
   * Note @pinussilvestrus
   *
   * It's currently not possible to run tests with a pre-configured user setting
   * Cf. https://github.com/microsoft/vscode/issues/97995
   */
  it.skip('should NOT save file if autosave NOT configured', async () => {

    // given
    const editor = await openFile(TEST_FILE);
    const { document } = editor;
    const { uri } = document;

    const saveSpy = spy();

    const bpmnEditorPanel: any = await vscode.commands.executeCommand(COMMAND, uri);

    const {
      panel
    } = bpmnEditorPanel;

    panel.webview.postMessage = saveSpy;

    // when
    await panel._updateViewState({
      active: false
    });

    // then
    expect(saveSpy).to.not.have.been.called;
  });

});


// helpers //////

async function openFile(path: string): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.file(path);
  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document);

  // wait for editor to open
  await sleep(500);

  return editor;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}