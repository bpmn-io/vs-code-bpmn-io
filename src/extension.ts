import * as vscode from 'vscode';

import { BpmnEditor } from './bpmn-editor';

// Define a basic interface for the custom properties configuration
export interface CustomPropertiesConfig {
  common?: Array<{ label: string; xpath: string }>;
  elementSpecific?: Record<string, Array<{ label: string; xpath: string }>>;

  // Allow other properties if necessary, or make it stricter
  [key: string]: unknown; // Changed 'any' to 'unknown'
}
let customPropertiesConfig: CustomPropertiesConfig = {}; // To store the parsed config

async function loadCustomPropertiesConfig(_context: vscode.ExtensionContext) {
  try {
    const config = vscode.workspace.getConfiguration('bpmn-flex');
    const commonProps = config.get<Array<{ label: string; xpath: string }>>('commonProperties');
    const elementSpecificProps = config.get<Record<string, Array<{ label: string; xpath: string }>>>('elementSpecificProperties');

    if (commonProps) {
      customPropertiesConfig.common = commonProps;
    } else {
      customPropertiesConfig.common = []; // Default to empty array if not found
    }

    if (elementSpecificProps) {
      customPropertiesConfig.elementSpecific = elementSpecificProps;
    } else {
      customPropertiesConfig.elementSpecific = {}; // Default to empty object if not found
    }

    vscode.window.showInformationMessage('BPMN.flex custom properties loaded from VS Code settings.');
    console.log('BPMN.flex Custom Properties Config:', customPropertiesConfig);

  } catch (error: unknown) {
    let message = 'An unknown error occurred while loading BPMN.flex custom properties from VS Code settings.';
    if (error instanceof Error) {
      message = `Error loading BPMN.flex custom properties from VS Code settings: ${error.message}`;
    }
    vscode.window.showErrorMessage(message);

    // Default to empty configuration in case of any error
    customPropertiesConfig = {
      common: [],
      elementSpecific: {}
    };
  }
}


export async function activate(context: vscode.ExtensionContext) {
  await loadCustomPropertiesConfig(context);

  // register our custom editor providers
  context.subscriptions.push(BpmnEditor.register(context, customPropertiesConfig)); // Pass config here

  // Watch for configuration changes and push updates to webviews
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('bpmn-flex.commonProperties') ||
          e.affectsConfiguration('bpmn-flex.elementSpecificProperties')) {
        await loadCustomPropertiesConfig(context);
        const instance = BpmnEditor.currentInstance;
        if (instance) {
          instance.broadcastConfigRefresh();
        }
      }
    })
  );
}
