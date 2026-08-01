import * as vscode from 'vscode';

import { BpmnEditor } from './bpmn-editor';

/**
 * Full property definition as defined in package.json configuration schema.
 * See README for detailed documentation of each field.
 */
export interface PropertyDefinition {
  label: string;
  path: string;
  engine?: 'moddle' | 'xpath';
  source: 'attribute' | 'text' | 'embedded';
  control: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select' | 'code';
  format?: 'json' | 'yaml';
  field?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  defaultValue?: string;
  placeholder?: string;
  description?: string;
  group?: string;
  order?: number;
  autoCreate?: boolean;
}

export interface CustomPropertiesConfig {
  common?: PropertyDefinition[];
  elementSpecific?: Record<string, PropertyDefinition[]>;
}
let customPropertiesConfig: CustomPropertiesConfig = {}; // To store the parsed config

async function loadCustomPropertiesConfig(_context: vscode.ExtensionContext) {
  try {
    const config = vscode.workspace.getConfiguration('bpmn-flex');
    const commonProps = config.get<PropertyDefinition[]>('commonProperties');
    const elementSpecificProps = config.get<Record<string, PropertyDefinition[]>>('elementSpecificProperties');

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
