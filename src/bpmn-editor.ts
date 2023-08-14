import * as vscode from 'vscode';
import { Disposable, disposeAll } from './dispose';
import { getNonce } from './util';

/**
 * Define the type of edits used in paw draw files.
 */
interface BpmnEdit {
  readonly idx: number;
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
    const text = await BpmnDocument.readFile(dataFile);
    return new BpmnDocument(uri, text, delegate);
  }

  private static async readFile(uri: vscode.Uri): Promise<string> {
    if (uri.scheme === 'untitled') {
      return '';
    }
    return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
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

  private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
    readonly content?: string;
    readonly undo?: boolean;
    readonly redo?: boolean;
  }>());

  /**
   * Fired to notify webviews that the document has changed.
   */
  public readonly onDidChangeContent = this._onDidChangeDocument.event;

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

    // initial import
    if (edit.idx === -1) {
      return;
    }

    const [
      lastEdit = { idx: -1 }
    ] = this._edits.slice(-1);

    // un- or re-doing a known edit
    if (lastEdit.idx === edit.idx) {
      return;
    }

    this._edits.push(edit);

    this._onDidChange.fire({
      label: 'edit',
      undo: async () => {
        this._edits.pop();
        this._onDidChangeDocument.fire({
          undo: true
        });
      },
      redo: async () => {
        this._edits.push(edit);
        this._onDidChangeDocument.fire({
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

    await vscode.workspace.fs.writeFile(targetResource, Buffer.from(text, 'utf8'));
  }

  /**
   * Called by VS Code when the user calls `revert` on a document.
   */
  async revert(_cancellation: vscode.CancellationToken): Promise<void> {
    const text = await BpmnDocument.readFile(this.uri);

    return this.reset(text);
  }

  /**
   * Resets document to a particular state
   */
  async reset(content: string) {

    this._text = content;
    this._edits = [];

    this._onDidChangeDocument.fire({
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
 *
 * This provider demonstrates:
 *
 * - How to implement a custom editor for binary files.
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Communication between VS Code and the custom editor.
 * - Using CustomDocuments to store information that is shared between multiple custom editors.
 * - Implementing save, undo, redo, and revert.
 * - Backing up a custom editor.
 */
export class BpmnEditor implements vscode.CustomEditorProvider<BpmnDocument> {

  private static newFileId = 1;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    context.subscriptions.push(
      vscode.commands.registerCommand('bpmn-io.bpmnEditor.new', () => {

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

        vscode.commands.executeCommand('vscode.openWith', uri, BpmnEditor.viewType);
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

  private static readonly viewType = 'bpmn-io.bpmnEditor';

  /**
   * Tracks all known webviews
   */
  private readonly webviews = new WebviewCollection();

  private _activeEditor : vscode.WebviewPanel | null = null;

  constructor(
    private readonly _context: vscode.ExtensionContext
  ) {

    const actions = [
      'lassoTool',
      'handTool',
      'spaceTool',
      'globalConnectTool',
      'directEditing',
      'find',
      'replaceElement'
    ];

    for (const action of actions) {
      this._context.subscriptions.push(
        vscode.commands.registerCommand(`bpmn-io.bpmnEditor.${action}`, () => {

          console.log('trigger action', action);

          const activeEditor = this._activeEditor;

          if (!activeEditor) {
            console.log('no active editor!');
            return;
          }

          this.postMessage(activeEditor, 'triggerAction', {
            action
          });
        })
      );
    }
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

      // Tell VS Code that the document has been edited by the user.
      this._onDidChangeCustomDocument.fire({
        document,
        ...e,
      });
    }));

    listeners.push(vscode.workspace.onDidChangeTextDocument(e => {
      const {
        document: textDocument
      } = e;

      console.log('TEXT DOCUMENT CHANGED', e);

      if (textDocument.uri.toString() !== document.uri.toString()) {
        return;
      }

      const newText = textDocument.getText();

      if (newText !== document.getText()) {
        console.log('RESET', document.uri);

        return document.reset(newText);
      }
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

    webviewPanel.onDidChangeViewState(e => {

      const { webviewPanel } = e;

      if (webviewPanel.active) {
        this._activeEditor = webviewPanel;
      } else if (this._activeEditor === webviewPanel) {
        this._activeEditor = null;
      }
    });

    // set as active
    this._activeEditor = webviewPanel;
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
      this._context.extensionUri, 'media', 'bpmn-editor.js'));

    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'media', 'reset.css'));

    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'media', 'vscode.css'));

    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._context.extensionUri, 'media', 'bpmn-editor.css'));

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
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src 'self' data:; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

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
    case 'import':
      return document.makeEdit(message as BpmnEdit);

    case 'response':
      return (
        this._callbacks.get(message.requestId)
      )?.(message.body);
    }
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
