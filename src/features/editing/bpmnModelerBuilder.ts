'use strict';
import * as vscode from 'vscode';

export class BpmnModelerBuilder {
  contents: string;
  resources: any;

  public constructor(contents: string, resources: any) {
    this.contents = contents;
    this.resources = resources;
  }

  private removeNewLines(contents: string): string {
    return contents.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  public buildModelerView(): string {
    this.contents = this.removeNewLines(this.contents);

    const head = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>BPMN Preview</title>

          <!-- viewer distro (with pan and zoom) -->
          <script src="${this.resources.modelerDistro}"></script>

          <!-- required modeler styles -->
          <link rel="stylesheet" href="${this.resources.diagramStyles}">
          <link rel="stylesheet" href="${this.resources.bpmnFont}">

          <link rel="stylesheet" href="${this.resources.modelerStyles}">
        </head>`;

    const body = `
      <body>
        <div class="content">
          <div id="canvas"></div>
        </div>

        <div class="buttons">
          <div class="spinner"></div>
        </div>

        <script>

          var vscode = acquireVsCodeApi();

          // persisting
          vscode.setState({ resourcePath: '${this.resources.resourceUri}'});

          // modeler instance
          var bpmnModeler = new BpmnJS({
            container: '#canvas',
            keyboard: { bindTo: document }
          });

          keyboardBindings();

          /**
           * Open diagram in our modeler instance.
           *
           * @param {String} bpmnXML diagram to display
           */
          function openDiagram(bpmnXML) {

            // import diagram
            bpmnModeler.importXML(bpmnXML, function(err) {

              if (err) {
                return console.error('could not import BPMN 2.0 diagram', err);
              }

            });
          }

          function saveDiagramChanges(cb) {
            bpmnModeler.saveXML({ format: true }, function(err, result) {
              if (err) {
                return console.error('could not save BPMN 2.0 diagram', err);
              }

              vscode.postMessage({
                command: 'saveContent',
                content: result
              });

              if (typeof cb === 'function') {
                cb();
              }
            });
          }

          function saveChanges() {
            var spinner = document.getElementsByClassName("spinner")[0];
            spinner.classList.add("active");

            saveDiagramChanges(function() {
              setTimeout(function() {
                spinner.classList.remove("active");
              }, 1000);
            });
          }

          function keyboardBindings() {
            var keyboard = bpmnModeler.get('keyboard');

            keyboard.addListener(function(context) {

              var event = context.keyEvent;

              if (keyboard.isKey(['s', 'S'], event) && keyboard.isCmd(event)) {
                saveChanges();
                return true;
              }
            });
          }

          // open diagram
          openDiagram('${this.contents}');
        </script>
      </body>
    `;

    const tail = ['</html>'].join('\n');

    return head + body + tail;
  }
}
