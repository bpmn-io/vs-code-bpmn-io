import { expect } from 'chai';
import { it, beforeEach } from 'mocha';

import * as path from 'path';

import * as vscode from 'vscode';

import { EditingProvider } from '../../../features/editing/editingProvider';

import { ExtensionContext, Webview } from '../../mocks';

const TEST_FILE = path.join(__dirname, '../../', 'fixtures', 'simple.bpmn');

suite('<editing.provider>', () => {

    let provider: EditingProvider;
    let webview: Webview;

    beforeEach(function() {
        const context = new ExtensionContext();

        webview = new Webview({
          resourcePath: TEST_FILE
        });

         // @ts-ignore
        provider = new EditingProvider(context);
    });

    it('should provide content', async () => {

      // when
      const content =
        provider.provideTextDocumentContent(vscode.Uri.file(TEST_FILE), webview);

      // then
      expect(content).to.exist;
      expect(content).to.include('const bpmnModeler = new BpmnJS');
    });

});
