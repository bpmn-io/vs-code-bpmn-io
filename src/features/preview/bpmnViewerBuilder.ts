'use strict';
import * as vscode from 'vscode';

export class BpmnViewerBuilder {
  contents: string;
  resources: any;

  public constructor(contents: string, resources: any) {
    this.contents = contents;
    this.resources = resources;
  }

  private removeNewLines(contents: string): string {
    return contents.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  public buildViewerView(): string {
    this.contents = this.removeNewLines(this.contents);

    const head = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>BPMN Preview</title>

          <!-- viewer distro (with pan and zoom) -->
          <script src="${this.resources.viewerDistro}"></script>

          <style>
            html, body, #canvas {
              height: 100%;
              padding: 0;
              margin: 0;
              background-color: white;
            }
          </style>
        </head>`;

    const body = `<body>
            <div id="canvas"></div>

            <script>

              var vscode = acquireVsCodeApi();

              // persisting
              vscode.setState({ resourcePath: '${this.resources.resourceUri}'});

              // modeler instance
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

                    // access viewer components
                    var canvas = bpmnViewer.get('canvas');

                    // zoom to fit full viewport
                    canvas.zoom('fit-viewport');
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
          * https://raw.githubusercontent.com/bpmn-io/bpmn-js-examples/starter/viewer.html
          -->
        </body>`;

    const tail = ['</html>'].join('\n');

    return head + body + tail;
  }
}
