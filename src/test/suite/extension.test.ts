import { expect } from 'chai';
import { before } from 'mocha';
import * as path from 'path';

import * as vscode from 'vscode';

const COMMANDS = {
	PREVIEW_CMD: "extension.bpmn-io.preview",
	EDIT_CMD: "extension.bpmn-io.edit"
};

const TEST_FILE = path.join(__dirname, '..', 'fixtures', 'simple.bpmn');

suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

	test('should start without error', async () => {

		// when
		const editor = await openFile(TEST_FILE);

		// given
		expect(editor).not.to.be.empty;
	});


	test('should open preview', async () => {

		// given
		const { document } = await openFile(TEST_FILE);

		const { uri } = document;

		// then
		await vscode.commands.executeCommand(COMMANDS.PREVIEW_CMD, uri);
		await sleep(500);
	});


	test('should open edit', async () => {

		// given
		const { document } = await openFile(TEST_FILE);

		const { uri } = document;

		// then
		await vscode.commands.executeCommand(COMMANDS.EDIT_CMD, uri);
		await sleep(500);
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
