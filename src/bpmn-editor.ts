import * as vscode from 'vscode';
import { Disposable, disposeAll } from './dispose';
import { getNonce } from './util';

/**
 * Define the type of edits used in paw draw files.
 */
interface BpmnEdit {
  readonly idx: number;
  readonly type: string;
}

interface BpmnDocumentDelegate {
  getText(): Promise<string>;
}

/**
 * Define the document (the data model) used for paw draw files.
 */
class BpmnDocument extends Disposable implements vscode.CustomDocument {

  static async create(
      uri: vscode.Uri,
      backupId: string | undefined,
      delegate: BpmnDocumentDelegate,
  ): Promise<BpmnDocument | PromiseLike<BpmnDocument>> {

    // If we have a backup, read that. Otherwise read the resource from the workspace
    const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
    const text = await readFile(dataFile);
    return new BpmnDocument(uri, text, delegate);
  }

  private readonly _uri: vscode.Uri;

  private _text: string;
  private _edits: Array<BpmnEdit> = [];

  private readonly _delegate: BpmnDocumentDelegate;

  private constructor(
      uri: vscode.Uri,
      initialText: string,
      delegate: BpmnDocumentDelegate
  ) {
    super();
    this._uri = uri;
    this._text = initialText;
    this._delegate = delegate;
  }

  public get uri() { return this._uri; }

  /**
   * Returns the document text
   */
  public getText(): string { return this._text; }

  private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());

  /**
   * Fired when the document is disposed of.
   */
  public readonly onDidDispose = this._onDidDispose.event;

  private readonly _onDidChangeContent = this._register(new vscode.EventEmitter<{
    readonly content?: string;
    readonly undo?: boolean;
    readonly redo?: boolean;
  }>());

  /**
   * Fired to notify webviews that the document has changed.
   */
  public readonly onDidChangeContent = this._onDidChangeContent.event;

  private readonly _onDidChange = this._register(new vscode.EventEmitter<{
    readonly label: string;
    undo(): Thenable<void> | void;
    redo(): Thenable<void> | void
  }>());

  /**
   * Fired to tell VS Code that an edit has occurred in the document.
   *
   * This updates the document's dirty indicator.
   */
  public readonly onDidChange = this._onDidChange.event;

  private readonly _onDidRename = this._register(new vscode.EventEmitter<{
    oldUri: vscode.Uri,
    newUri: vscode.Uri
  }>());

  /**
   * Fired to tell others that the document got renamed.
   *
   * This updates the document's dirty indicator.
   */
  public readonly onDidRename = this._onDidRename.event;

  /**
   * Called by VS Code when there are no more references to the document.
   *
   * This happens when all editors for it have been closed.
   */
  dispose(): void {
    this._onDidDispose.fire();
    super.dispose();
  }

  /**
   * Called when the user edits the document in a webview.
   *
   * This fires an event to notify VS Code that the document has been edited.
   */
  makeEdit(edit: BpmnEdit) {

    if (edit.idx === -1) {
      console.log('document#makeEdit', 'SKIP (import)', edit);
      return;
    }

    const [
      lastEdit = { idx: -1 }
    ] = this._edits.slice(-1);

    // un- or re-doing a known edit
    if (lastEdit.idx === edit.idx) {
      console.log('document#makeEdit', 'SKIP (undo/redo)', edit);
      return;
    }

    console.log('document#makeEdit', edit);

    this._edits.push(edit);

    this._onDidChange.fire({
      label: 'edit',
      undo: async () => {
        console.log('makeEdit#undo', edit);

        this._edits.pop();
        this._onDidChangeContent.fire({
          undo: true
        });
      },
      redo: async () => {
        console.log('makeEdit#redo', edit);

        this._edits.push(edit);
        this._onDidChangeContent.fire({
          redo: true
        });
      }
    });
  }

  /**
   * Called by VS Code when the user saves the document.
   */
  async save(cancellation: vscode.CancellationToken): Promise<void> {
    await this.saveAs(this.uri, cancellation);
  }

  /**
   * Called by VS Code when the user saves the document to a new location.
   */
  async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
    const text = await this._delegate.getText();
    if (cancellation.isCancellationRequested) {
      return;
    }

    this._text = text;

    await writeFile(targetResource, text);

    this._onDidRename.fire({
      oldUri: this.uri,
      newUri: targetResource
    });
  }

  /**
   * Called by VS Code when the user calls `revert` on a document.
   */
  async revert(_cancellation: vscode.CancellationToken): Promise<void> {
    const text = await readFile(this.uri);

    return this.reset(text);
  }

  /**
   * Resets document to a particular state
   */
  async reset(content: string) {

    this._text = content;
    this._edits = [];

    this._onDidChangeContent.fire({
      content
    });
  }

  /**
   * Called by VS Code to backup the edited document.
   *
   * These backups are used to implement hot exit.
   */
  async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
    await this.saveAs(destination, cancellation);

    return {
      id: destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(destination);
        } catch {

          // noop
        }
      }
    };
  }
}

/**
 * Provider for visual BPMN editing.
 */
export class BpmnEditor implements vscode.CustomEditorProvider<BpmnDocument> {

  private static newFileId = 1;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    context.subscriptions.push(
      vscode.commands.registerCommand('bpmn-io.bpmnEditor.new', async () => {

        const currentDocumentUri =
          vscode.window.activeTextEditor?.document.uri ||
          vscode.window.activeNotebookEditor?.notebook.uri;

        const workspaceFolders = vscode.workspace.workspaceFolders;

        const workspaceUri = workspaceFolders && workspaceFolders[0].uri;
        const fileName = `new-${BpmnEditor.newFileId++}.bpmn`;

        let uri = vscode.Uri.parse(`untitled://${fileName}`);

        if (currentDocumentUri || workspaceUri) {
          uri = vscode.Uri.joinPath((currentDocumentUri || workspaceUri)!, fileName).with({ scheme: 'untitled' });
        }

        await vscode.commands.executeCommand('vscode.openWith', uri, BpmnEditor.viewType);

        return uri;
      })
    );

    return vscode.window.registerCustomEditorProvider(
      BpmnEditor.viewType,
      new BpmnEditor(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
  }

  private readonly log = vscode.window.createOutputChannel('BPMN Editor');

  private static readonly viewType = 'bpmn-io.bpmnEditor';

  /**
   * Tracks all known webviews
   */
  private readonly webviews = new WebviewCollection();

  /**
   * Tracks all known documents
   */
  private readonly documents = new DocumentCollection();

  constructor(
    private readonly _context: vscode.ExtensionContext
  ) {

    _context.subscriptions.push(
      vscode.commands.registerCommand('bpmn-io.bpmnEditor.__state', (uri: vscode.Uri) => {

        const document = this.documents.get(uri);

        if (!document) {
          return null;
        }

        const webviews = Array.from(this.webviews.get(document.uri));

        return {
          document,
          webviewPanel: webviews[0]
        };
      })
    );
  }

  // #region CustomEditorProvider

  async openCustomDocument(
      uri: vscode.Uri,
      openContext: { backupId?: string },
      _token: vscode.CancellationToken
  ): Promise<BpmnDocument> {
    const document: BpmnDocument = await BpmnDocument.create(uri, openContext.backupId, {
      getText: async () => {
        const webviewsForDocument = Array.from(this.webviews.get(document.uri));
        if (!webviewsForDocument.length) {
          throw new Error('Could not find webview to save for');
        }
        const panel = webviewsForDocument[0];
        const response = await this.postMessageWithResponse<number[]>(panel, 'getText', {});
        return String(response);
      }
    });

    const listeners: vscode.Disposable[] = [];

    listeners.push(document.onDidChange(e => {

      // indicate that the document has been changed
      this._onDidChangeCustomDocument.fire({
        document,
        ...e,
      });
    }));

    listeners.push(document.onDidChangeContent(e => {

      // Update all webviews when the document changes
      for (const webviewPanel of this.webviews.get(document.uri)) {
        this.postMessage(webviewPanel, 'update', {
          undo: e.undo,
          redo: e.redo,
          content: e.content
        });
      }
    }));

    document.onDidDispose(() => disposeAll(listeners));

    // track documents

    this.documents.add(uri, document);

    document.onDidDispose(() => this.documents.remove(document.uri));

    return document;
  }

  async resolveCustomEditor(
      document: BpmnDocument,
      webviewPanel: vscode.WebviewPanel,
      _token: vscode.CancellationToken
  ): Promise<void> {

    // add the webview to our internal set of active webviews
    this.webviews.add(document.uri, webviewPanel);

    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage(e => this.onMessage(document, e));

    webviewPanel.webview.onDidReceiveMessage(e => {
      if (e.type === 'ready') {
        if (document.uri.scheme === 'untitled') {
          this.postMessage(webviewPanel, 'init', {
            untitled: true,
            editable: true,
          });
        } else {
          const editable = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);

          this.postMessage(webviewPanel, 'init', {
            content: document.getText(),
            editable,
          });
        }
      }
    });

    webviewPanel.onDidChangeViewState(async e => {
      if (!e.webviewPanel.active) {
        return;
      }

      const content = await readFile(document.uri);

      if (content !== document.getText()) {
        const action = await vscode.window.showInformationMessage(
          'Diagram changed externally, do you want to reload it?',
          'Reload'
        );

        if (action === 'Reload') {
          await document.reset(content);
        }
      }
    });
  }

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<BpmnDocument>>();
  public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

  public saveCustomDocument(document: BpmnDocument, cancellation: vscode.CancellationToken): Thenable<void> {
    return document.save(cancellation);
  }

  public saveCustomDocumentAs(document: BpmnDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
    return document.saveAs(destination, cancellation);
  }

  public revertCustomDocument(document: BpmnDocument, cancellation: vscode.CancellationToken): Thenable<void> {
    return document.revert(cancellation);
  }

  public backupCustomDocument(document: BpmnDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
    return document.backup(context.destination, cancellation);
  }

  // #endregion

  /**
   * Get the static HTML used for in our editor's webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {

    // local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'out/client', 'bpmn-editor.js'));

    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'media', 'reset.css'));

    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'media', 'vscode.css'));

    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'out/client', 'bpmn-editor.css'));

    // use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">

        <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src 'self' data:; img-src 'self' data:; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleResetUri}" rel="stylesheet" />
        <link href="${styleVSCodeUri}" rel="stylesheet" />
        <link href="${styleMainUri}" rel="stylesheet" />

        <title>BPMN Editor</title>
      </head>
      <body>
        <div id="canvas"></div>

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _requestId = 1;
  private readonly _callbacks = new Map<number, (response: any) => void>();

  private postMessageWithResponse<R = unknown>(panel: vscode.WebviewPanel, type: string, body: any): Promise<R> {
    const requestId = this._requestId++;
    const p = new Promise<R>(resolve => this._callbacks.set(requestId, resolve));
    panel.webview.postMessage({ type, requestId, body });
    return p;
  }

  private postMessage(panel: vscode.WebviewPanel, type: string, body: any = {}): void {
    panel.webview.postMessage({ type, body });
  }

  private onMessage(document: BpmnDocument, message: any) {
    switch (message.type) {
    case 'change':
      return document.makeEdit(message as BpmnEdit);

    case 'import':

      if (message.error) {
        this.log.appendLine(`${document.uri.fsPath} - ${message.error}`);
      }

      for (const warning of message.warnings) {
        this.log.appendLine(`${document.uri.fsPath} - ${warning}`);
      }

      if (message.error || message.warnings.length) {
        this.log.show(true);
      }

      return document.makeEdit(message as BpmnEdit);

    case 'response':
      return (
        this._callbacks.get(message.requestId)
      )?.(message.body);
    }
  }
}

class DocumentCollection {
  private readonly _documents = new Map<string, BpmnDocument>();

  remove(uri: vscode.Uri) {
    const key = uri.toString();

    return this._documents.delete(key);
  }

  add(uri: vscode.Uri, document: BpmnDocument) {

    if (this.get(uri)) {
      throw new Error('document already exists');
    }

    this._documents.set(uri.toString(), document);
  }

  get(uri: vscode.Uri) {
    const key = uri.toString();

    return this._documents.get(key);
  }
}

/**
 * Tracks all webviews.
 */
class WebviewCollection {

  private readonly _webviews = new Set<{
    readonly resource: string;
    readonly webviewPanel: vscode.WebviewPanel;
  }>();

  /**
   * Get all known webviews for a given uri.
   */
  public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
    const key = uri.toString();
    for (const entry of this._webviews) {
      if (entry.resource === key) {
        yield entry.webviewPanel;
      }
    }
  }

  /**
   * Add a new webview to the collection.
   */
  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel };
    this._webviews.add(entry);

    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry);
    });
  }

  public find(cb: (e: vscode.WebviewPanel) => boolean) {
    for (const entry of this._webviews) {
      const { webviewPanel } = entry;

      if (cb(webviewPanel)) {
        return webviewPanel;
      }
    }

    return null;
  }
}


async function readFile(uri: vscode.Uri): Promise<string> {
  if (uri.scheme === 'untitled') {
    return '';
  }
  return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
}

async function writeFile(uri: vscode.Uri, text: string): Promise<void> {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
}
