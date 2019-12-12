import { expect } from 'chai';
import { it, beforeEach } from 'mocha';

import * as path from 'path';

import * as vscode from 'vscode';

import { PreviewProvider } from '../../../../features/preview/previewProvider';

import { ExtensionContext } from '../../../mocks';

const TEST_FILE = path.join(__dirname, '../../..', 'fixtures', 'simple.bpmn');

suite('<preview.provider>', () => {

    let provider:PreviewProvider;

    beforeEach(function() {
        const context = new ExtensionContext();

         // @ts-ignore
        provider = new PreviewProvider(context);
    });

    it('should provide content', async () => {

      // when
      const content = provider.provideTextDocumentContent(vscode.Uri.file(TEST_FILE));

      // then
      expect(content).to.exist;
      expect(content).to.include('var bpmnViewer = new BpmnJS');
    });

});
