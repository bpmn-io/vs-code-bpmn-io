# BPMN.flex Editor - VS Code Extension

A VS Code custom editor extension for BPMN 2.0 files, powered by bpmn.io tools.

## Project Overview

- **Name**: `vs-code-bpmn-flex` (display: "BPMN.flex Editor")
- **Publisher**: gikoyo
- **Type**: VS Code Extension (Custom Editor)
- **License**: MIT

## Tech Stack

- **Language**: TypeScript (strict mode, ES2020 target)
- **Build**: Rollup (4 separate bundles: extension, bpmn-editor provider, client webview, utilities)
- **Lint**: ESLint with `eslint-plugin-bpmn-io` and `typescript-eslint`
- **Test**: Mocha + Chai + Sinon + Puppeteer, run via `@vscode/test-electron`
- **VS Code API**: `^1.79.2`, Node >= 16

## Architecture

```
src/
├── extension.ts          # Entry point: activates, loads config, registers BpmnEditor
├── bpmn-editor.ts        # CustomEditorProvider + CustomDocument implementation
├── client/
│   └── bpmn-editor.js    # Webview client-side code (bpmn-js based)
├── dispose.ts            # Disposable utility base class
├── util.ts               # Helpers (e.g., getNonce)
└── test/                 # Mocha test suite
```

### How It Works

1. `extension.ts` is the activation entry point (registered in `package.json` as `main`)
2. On activation, it loads custom properties from VS Code config (`bpmn-flex.commonProperties` and `bpmn-flex.elementSpecificProperties`)
3. Registers `BpmnEditor` as a `CustomTextEditorProvider` for `.bpmn` files
4. The editor opens a webview that loads bpmn-js, with i18n support (Chinese, Japanese, English)

### Key Dependencies

- `bpmn-js` ^18.6.1 - BPMN diagram rendering and editing
- `bpmn-js-color-picker` ^0.7.1 - Color picker for BPMN elements
- `bpmn-js-i18n` ^2.3.0 - Internationalization
- `xmldom` ^0.6.0 - XML parsing
- `xpath` ^0.0.34 - XPath evaluation for custom properties

## Build Commands

```bash
npm run compile        # Clean + build everything (app + tests)
npm run compile:app    # Build extension only (rollup)
npm run compile:tests  # Build tests only (tsc)
npm run watch          # Watch all in parallel
npm run lint           # ESLint check
npm run test           # Run test suite
npm run all            # lint + test
npm run package        # Package VSIX via @vscode/vsce
```

## Development Workflow

1. `npm install`
2. `npm run compile`
3. Press `F5` in VS Code to launch extension development host
4. Open a `.bpmn` file to test the custom editor

## Conventions

- TypeScript strict mode
- Unused variables prefixed with `_` are exempt from linting
- `vscode` is always external (not bundled)
- Client code (webview) is a separate Rollup bundle in IIFE format
- Tests use Mocha with Sinon for mocking and Puppeteer for browser automation
- `out/` is the build output directory (gitignored)

## Custom Properties Feature (半开发状态)

> **详细状态 & Roadmap**: 见 [docs/CUSTOM_PROPS_ROADMAP.md](docs/CUSTOM_PROPS_ROADMAP.md)

Users can define custom properties in VS Code settings under `bpmn-flex.commonProperties` and `bpmn-flex.elementSpecificProperties`. Each property has:
- `label` - Display label
- `xpath` - XPath-like path (currently simulated on moddle objects, not real XML XPath)
- `type` - UI control type: `attribute`, `elementText`, `date`, `number`, `boolean`, `json`
- `jsonPath` (for json type) - Path inside JSON object
- `inputType` (for json type) - UI control override

**已实现**: 6 种属性类型的读写，侧边栏 UI (折叠/展开/弹窗)，bpmn:documentation 自动创建
**未完成**: fullXPath 真实 XPath 查询、输入验证、暗色主题、单元测试、多选支持
**关键文件**: `src/client/sidebar/sidebar.js`, `src/client/customPropsExtractor.js`, `src/extension.ts`
