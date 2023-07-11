const noop = () => {};

const noopDisposable = (): Disposable => {
  return new Disposable();
};

const noopThenable = (): Thenable<boolean> => {
  return new Promise(resolve => {
    resolve(true);
  });
};

const noopUri = (): Uri => {
  return new Uri();
};

export class ExtensionContext {
  extensionPath = 'foo/bar';
  subscriptions = [];
  workspaceState = null;
  globalState = null;
  asAbsolutePath = null;
  storagePath = null;
  globalStoragePath = null;
  logPath = null;
}

export class WebviewOptions {

}

export class Uri {
  authority = '';
  fragment = '';
  fsPath = '';
  path = '';
  query = '';
  scheme = '';
  toJSON = noop;
  with = noopUri;

  constructor(options?: any) {
    this.fsPath = options.fsPath;
  }
}

export class Disposable {
  dispose = noop;
}

export class Webview {
  asWebviewUri = noopUri;
  options = new WebviewOptions();
  html = '';
  onDidReceiveMessage = noopDisposable;
  postMessage = noopThenable;
  cspSource = '';

  constructor(options?: any) {

    if (options.resourcePath) {
      this.asWebviewUri = () => {
        return new Uri({
          fsPath: options.resourcePath
        });
      };
    }

  }
}
