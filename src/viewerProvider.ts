/* tslint:disable:quotemark */
"use strict";
import * as vscode from "vscode";

const fs = require("fs");

export class BpmnModelerProvider implements vscode.TextDocumentContentProvider {

  public constructor(private _context: vscode.ExtensionContext) { }

  private removeNewLines(contents: string): string {
    return contents.replace(/(\r\n|\n|\r)/gm," ");
  }

  public provideTextDocumentContent(uri: vscode.Uri, state: any): string {
    const docPath = uri.with({ scheme: 'vscode-resource' });

    let contents = fs.readFileSync(docPath.path, { encoding: 'utf8' });
    contents = this.removeNewLines(contents);
    
    const head =
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Hello World</title>
      
          <!-- viewer distro (without pan and zoom) -->
          <!--
          <script src="https://unpkg.com/bpmn-js@5.0.4/dist/bpmn-viewer.development.js"></script>
          -->
          
          <!-- viewer distro (with pan and zoom) -->
          <script src="https://unpkg.com/bpmn-js@5.0.4/dist/bpmn-navigated-viewer.development.js"></script>
      
          <!-- needed for this example only -->
          <script src="https://unpkg.com/jquery@3.3.1/dist/jquery.js"></script>
      
          <!-- example styles -->
          <style>
            html, body, #canvas {
              height: 100%;
              padding: 0;
              margin: 0;
            }
          </style>
        </head>`;

    const body = 
  `<body>
  <div id="canvas"></div>

  <script>

    // viewer instance
    var bpmnViewer = new BpmnJS({
      container: '#canvas'
    });


    /**
     * Open diagram in our viewer instance.
     *
     * @param {String} bpmnXML diagram to display
     */
    function openDiagram(bpmnXML) {

      // import diagram
      bpmnViewer.importXML(bpmnXML, function(err) {

        if (err) {
          return console.error('could not import BPMN 2.0 diagram', err);
        }
      });
    }


    // open diagram
    openDiagram('${contents}');
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

    const tail = [
      '</html>'
    ].join("\n");

    return head + body + tail;
  }
}