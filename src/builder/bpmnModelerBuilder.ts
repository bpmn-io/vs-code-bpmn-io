"use strict";
import * as vscode from "vscode";

export class BpmnModelerBuilder {
  contents: string;
  modelerDistro: vscode.Uri;
  cssFiles: vscode.Uri[];

  public constructor(contents: string, modelerDistro: vscode.Uri, cssFiles: vscode.Uri[]) {
    this.contents = contents;
    this.modelerDistro = modelerDistro;
    this.cssFiles = cssFiles;
  }

  private removeNewLines(contents: string): string {
    return contents.replace(/(\r\n|\n|\r)/gm, " ");
  }

  public buildModelerView(): string {
    this.contents = this.removeNewLines(this.contents);

    const head = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>BPMN Preview</title>
          
          <!-- viewer distro (with pan and zoom) -->
          <script src="${this.modelerDistro}"></script>
      
          <!-- required modeler styles -->
          <link rel="stylesheet" href="${this.cssFiles[0]}">
          <link rel="stylesheet" href="${this.cssFiles[1]}">

          <style>
            * {
              box-sizing: border-box;
            }
            
            body, html {
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            
              font-size: 12px;
            
              height: 100%;
              padding: 0;
              margin: 0;
            }

            .content,
            .content > #canvas {
              width: 100%;
              height: 100%;
              overflow: hidden;
              background-color: white;
            }

            .buttons {
              position: fixed;
              bottom: 20px;
              left: 20px;

              padding: 0;
              margin: 0;
              list-style: none;
            }

            .buttons > .button {
              display: inline-block;
              margin-right: 10px;
            }

            .buttons > .button {
              background: #DDD;
              color: #000;
              border: solid 1px #666;
              display: inline-block;
              padding: 5px;
            }

            .buttons > .button:hover {
              opacity: 0.3;
              cursor: pointer;
            }
          </style>
        </head>`;

    const body = `<body>
            <div class="content">
              <div id="canvas"></div>
            </div>

            <div class="buttons">
              <div class="button" title="Save BPMN changes" onclick="saveChanges()">
                  Save changes
              </div>
            </div>

            <script>

              var vscode = acquireVsCodeApi();

              // modeler instance
              var bpmnModeler = new BpmnJS({
                container: '#canvas'
              });

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

              function saveChanges() {
                bpmnModeler.saveXML({ format: true }, function(err, result) {
                  if (err) {
                    return console.error('could not save BPMN 2.0 diagram', err);
                  }

                  vscode.postMessage({
                    command: 'saveContent',
                    content: result
                  });
                });
              }

              // open diagram
              openDiagram('${this.contents}');
            </script>

          <!--
          Thanks for trying out our BPMN toolkit!

          If you'd like to learn more about what our library,
          continue with some more basic examples:
          * https://github.com/bpmn-io/bpmn-js-examples/overlays
          * https://github.com/bpmn-io/bpmn-js-examples/interaction
          * https://github.com/bpmn-io/bpmn-js-examples/colors
          * https://github.com/bpmn-io/bpmn-js-examples/commenting

          To get a bit broader overview over how bpmn-js works,
          follow our walkthrough:
          * https://bpmn.io/toolkit/bpmn-js/walkthrough/

          Related starters:
          * https://raw.githubusercontent.com/bpmn-io/bpmn-js-examples/starter/modeler.html
          -->
        </body>`;

    const tail = ["</html>"].join("\n");

    return head + body + tail;
  }
}
