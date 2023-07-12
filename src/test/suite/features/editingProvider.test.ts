import * as chai from 'chai';

import { it, beforeEach } from 'mocha';

import * as sinonChai from 'sinon-chai';

import { stub } from 'sinon';

import path = require('node:path');
import fs = require('node:fs');

import * as vscode from 'vscode';

import { EditingProvider } from '../../../features/editing/editingProvider';

import { ExtensionContext, Webview } from '../../mocks';

chai.use(sinonChai);

const expect = chai.expect;

const TEST_FILE = path.join(__dirname, '../../', 'fixtures', 'simple.bpmn');

suite('<editing.provider>', () => {

  let provider: EditingProvider;
  let webview: Webview;

  beforeEach(function() {
    const context = new ExtensionContext();

    webview = new Webview({
      resourcePath: TEST_FILE
    });

    provider = new EditingProvider(context as unknown as vscode.ExtensionContext);
  });

  it('should provide content', async () => {

    // when
    const content =
        provider.provideTextDocumentContent(vscode.Uri.file(TEST_FILE), webview);

    // then
    expect(content).to.exist;
    expect(content).to.include('const bpmnModeler = new BpmnJS');
  });


  it('should use local file path for fetching content', async () => {

    // given
    const fsSpy = stub(fs, 'readFileSync').returns('foo');

    // when
    provider.provideTextDocumentContent(vscode.Uri.file(TEST_FILE), webview);

    // then
    // assure no path modification has been made for webview optimization
    expect(fsSpy).to.have.been.calledWith(TEST_FILE);
  });

});
