# BPMN.flex Editor

View and edit BPMN diagrams in [VS Code](https://code.visualstudio.com/).

![VSCode BPMN Editor in use](https://raw.githubusercontent.com/yougikou/vs-code-bpmn-flex/main/docs/screenshot.png)

## Features

* View and edit [BPMN 2.0 files](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)
* Save changes to your local file
* Undo/redo and other keyboard shortcuts
* Create from empty `.bpmn` files
* Internationalization support (English, 中文, 日本語)
* **Custom properties panel** — define your own editable fields in VS Code settings

## Custom Properties Configuration

You can define custom editable properties for any BPMN element type in your VS Code `settings.json`. Each property consists of a **data source** (`source`), a **path** to the data (`path`), a **UI control** (`control`), and **metadata** (label, group, description, etc.).

### Property Definition Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | ✅ | Display label shown in the sidebar |
| `path` | `string` | ✅ | Path to the data within the BPMN element (see [Path Syntax](#path-syntax)) |
| `source` | `string` | ✅ | Data source: `"attribute"`, `"text"`, or `"embedded"` |
| `control` | `string` | ✅ | UI control: `"text"`, `"textarea"`, `"number"`, `"boolean"`, `"date"`, `"select"`, or `"code"` |
| `format` | `string` | — | Format of embedded content: `"json"` or `"yaml"` (required when `source="embedded"`) |
| `field` | `string` | — | Dot-separated field path inside embedded JSON/YAML (used with `source="embedded"`) |
| `options` | `array` | — | Dropdown options for `control="select"`. Each item: `{ "label": "...", "value": "..." }` |
| `min` | `number` | — | Minimum value for `control="number"` |
| `max` | `number` | — | Maximum value for `control="number"` |
| `step` | `number` | — | Step increment for `control="number"` |
| `pattern` | `string` | — | Regular expression for input validation |
| `defaultValue` | `string` | — | Default value when the property is empty |
| `placeholder` | `string` | — | Placeholder text shown in empty inputs |
| `description` | `string` | — | Help text shown as a tooltip on hover (`?` icon) |
| `group` | `string` | — | Group name for collapsible sections in the sidebar |
| `order` | `number` | — | Sort order within the group (lower = first) |

### Path Syntax

The `path` field uses a simple notation to navigate the BPMN element's internal structure:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `@attrName` | XML attribute of the current element | `@name`, `@camunda:asyncBefore` |
| `ns:elemName` | Child element with namespace | `bpmn:documentation` |
| `elemName` | Child element (without namespace) | `extensionElements` |
| `/` | Path separator for nesting | `extensionElements/custom:config` |

### Source Types

#### `source: "attribute"` — XML Attribute Value

Reads/writes an attribute value directly on the BPMN element. Use `@` prefix in path.

```json
{
  "bpmn-flex.commonProperties": [
    {
      "label": "Name",
      "path": "@name",
      "source": "attribute",
      "control": "text",
      "group": "General",
      "order": 1
    },
    {
      "label": "Async Before",
      "path": "@camunda:asyncBefore",
      "source": "attribute",
      "control": "boolean",
      "group": "Engine"
    }
  ]
}
```

#### `source: "text"` — Child Element Text Content

Reads/writes the text content of a child element (e.g., `bpmn:documentation`). If the child element does not exist, it will be automatically created on first write.

```json
{
  "label": "Documentation",
  "path": "bpmn:documentation",
  "source": "text",
  "control": "textarea"
}
```

#### `source: "embedded"` — Nested Field Inside Child Element Text

Parses the child element's text content as JSON or YAML, then reads/writes a specific field within it. This is useful for editing structured configuration embedded in extension elements.

```json
{
  "label": "Service Name",
  "path": "extensionElements/custom:flowConfig",
  "source": "embedded",
  "format": "yaml",
  "field": "service.name",
  "control": "text",
  "group": "Workflow"
}
```

Given this YAML content in the extension element:

```yaml
service:
  name: my-processor
  timeout: 30
```

The property above would display `my-processor` and allow editing it.

Whole-document editing (omit `field` to show the entire embedded content):

```json
{
  "label": "Flow Config",
  "path": "extensionElements/custom:flowConfig",
  "source": "embedded",
  "format": "yaml",
  "control": "code"
}
```

### Control Types

| Control | UI Widget | Notes |
|---------|-----------|-------|
| `text` | `<input type="text">` | Single-line text |
| `textarea` | `<textarea>` | Multi-line text, 4 rows |
| `number` | `<input type="number">` | Numeric, supports `min`/`max`/`step` |
| `boolean` | `<select>` True/False | Coerces "true"/"1" → `true`, "false"/"0" → `false` |
| `date` | `<input type="date">` | Validates YYYY-MM-DD format |
| `select` | `<select>` dropdown | Requires `options` array |
| `code` | `<textarea>` monospace | Multi-line with monospace font, 8 rows. Use for YAML/JSON editing |

### Full Configuration Example

```jsonc
{
  // Properties shown for ALL BPMN elements
  "bpmn-flex.commonProperties": [
    {
      "label": "Element ID",
      "path": "@id",
      "source": "attribute",
      "control": "text",
      "group": "General",
      "order": 1,
      "description": "Unique identifier for this element"
    },
    {
      "label": "Name",
      "path": "@name",
      "source": "attribute",
      "control": "text",
      "group": "General",
      "order": 2
    },
    {
      "label": "Documentation",
      "path": "bpmn:documentation",
      "source": "text",
      "control": "textarea",
      "group": "General",
      "order": 3
    }
  ],

  // Properties for specific element types
  "bpmn-flex.elementSpecificProperties": {
    "bpmn:Process": [
      {
        "label": "Process Type",
        "path": "@processType",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "None", "value": "None" },
          { "label": "Public", "value": "Public" },
          { "label": "Private", "value": "Private" }
        ],
        "group": "Process"
      },
      {
        "label": "Executable",
        "path": "@isExecutable",
        "source": "attribute",
        "control": "boolean",
        "group": "Process"
      }
    ],

    "bpmn:ServiceTask": [
      {
        "label": "Implementation",
        "path": "@implementation",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "WebService", "value": "##WebService" },
          { "label": "External", "value": "##External" },
          { "label": "Expression", "value": "##Expression" }
        ],
        "group": "Service"
      },
      {
        "label": "Delegate Expression",
        "path": "@camunda:delegateExpression",
        "source": "attribute",
        "control": "text",
        "group": "Engine"
      }
    ],

    "bpmn:ScriptTask": [
      {
        "label": "Script Format",
        "path": "@scriptFormat",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "JavaScript", "value": "javascript" },
          { "label": "Groovy", "value": "groovy" },
          { "label": "Python", "value": "python" },
          { "label": "FEEL", "value": "feel" }
        ],
        "group": "Script"
      }
    ],

    "bpmn:CallActivity": [
      {
        "label": "Called Element",
        "path": "@calledElement",
        "source": "attribute",
        "control": "text",
        "group": "Call",
        "description": "Expression or ID of the called process"
      }
    ],

    "bpmn:ExclusiveGateway": [
      {
        "label": "Default Flow",
        "path": "@default",
        "source": "attribute",
        "control": "text",
        "group": "Gateway"
      }
    ],

    "bpmn:SequenceFlow": [
      {
        "label": "Source",
        "path": "@sourceRef",
        "source": "attribute",
        "control": "text",
        "group": "Flow",
        "order": 1
      },
      {
        "label": "Target",
        "path": "@targetRef",
        "source": "attribute",
        "control": "text",
        "group": "Flow",
        "order": 2
      }
    ],

    "bpmn:Error": [
      {
        "label": "Error Code",
        "path": "@errorCode",
        "source": "attribute",
        "control": "text",
        "group": "Error"
      },
      {
        "label": "Error Message",
        "path": "@camunda:errorMessage",
        "source": "attribute",
        "control": "text",
        "group": "Error"
      }
    ]
  }
}
```

### YAML Embedded Content

When `source` is `"embedded"` and `format` is `"yaml"`, the extension parses and serializes a practical subset of YAML:

- **Scalars**: strings, numbers (`42`, `3.14`), booleans (`true`/`false`), null
- **Mappings**: nested key-value pairs
- **Sequences**: arrays (e.g., `- item1`)
- **Comments**: lines starting with `#` are preserved

> **Note**: Anchors (`&`), aliases (`*`), tags (`!`), block scalars (`|`, `>`), and multi-document (`---`) YAML features are NOT supported. For complex YAML, use `control: "code"` to edit the raw text directly.

## Installation

Download it from the VS Code Marketplace, search for `vs-code-bpmn-flex` directly inside VS Code.

## Build and Run

First step, clone this project to your local machine and open it with [VS Code](https://code.visualstudio.com/):

```sh
git clone https://github.com/yougikou/vs-code-bpmn-flex.git
cd ./vs-code-bpmn-flex
npm install
code .
```

Press `F5` to load and debug the extension in a new VS Code instance. To execute the tests choose the *Extension Tests* in the Debug mode.

You can build the extension from the command line, too:

```sh
# execute the test suite
npm run test

# execute all scripts
npm run all
```

## License

MIT

Contains parts ([bpmn-js](https://github.com/bpmn-io/bpmn-js)) released under the [bpmn.io license](http://bpmn.io/license).
