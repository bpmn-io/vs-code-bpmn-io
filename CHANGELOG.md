# Changelog

All notable changes to the [bpmn.flex vs-code extension](https://github.com/yougikou/vs-code-bpmn-flex) will be documented here. 

## 0.20.0

### 🎨 Custom Properties Panel Overhaul

The custom properties system has been completely redesigned with a new, more powerful configuration schema:

- **New property definition schema** — replaced `type`/`xpath`/`jsonPath`/`inputType` with `source`/`control`/`path`/`engine`/`field`/`format`
- **3 data source types**: `attribute` (XML attributes), `text` (child element text), `embedded` (parsed JSON/YAML fields)
- **7 UI control types**: `text`, `textarea`, `number`, `boolean`, `date`, `select`, `code`
- **Dual-engine resolution**: `moddle` (BPMN object tree, default) and `xpath` (native XML XPath queries)
- **Auto-create** — missing intermediate moddle objects are automatically created on write
- **Input validation** — `min`/`max`/`step` for numbers, `pattern` regex, date format validation
- **Default values & placeholders** — `defaultValue` and `placeholder` support
- **Grouped collapsible panels** — properties organized by `group` with `order` sorting and `description` tooltips
- **YAML embedded content** — custom YAML subset parser/serializer (scalars, mappings, sequences, comments)
- **Error handling** — validation errors shown in sidebar, graceful degradation on parse failures

### 🌓 Dark Theme Support

- Full dark theme adaptation using VS Code CSS custom properties
- 50+ diagram-js color tokens overridden for canvas, palette, context pad, popup menus, and resizer
- Default fill/stroke/label colors passed to BpmnModeler constructor
- CSS shape fill + label color safety net ensures readability after theme switch

### 🌐 Internationalization

- Expanded Chinese (zh-CN) and Japanese (ja) translations for UI labels
- Language switching optimized: saveXML → importXML instead of full modeler rebuild

### 📄 Documentation

- Added Chinese (`README.zh-CN.md`) and Japanese (`README.ja.md`) README translations
- Updated English README with new feature highlights
- Added `AGENTS.md` with project architecture and development guidelines

### 🔧 CI & Tooling

- Pinned VS Code test version to `1.100.2` (fixes macOS CI `ENOENT` on bleeding-edge VS Code)
- Upgraded `@vscode/test-electron` to `3.1.0`
- Added `mocha-junit-reporter` for CI test reporting
- ESLint config enhancements
- UI test scripts now capture screenshots for multiple languages (EN/ZH/JA) and sidebar states
- Fixed UI test config schema and selectors to match refactored property system

### ✅ Testing

- 63 unit tests for `customPropsExtractor` covering all source types, controls, edge cases, and error paths
- Tests for `getDeep`/`setDeep`, YAML parse/stringify, moddle path resolution, property extraction and update

## 0.19.0 (2026-01-20)

## What's Changed
* feat: consolidate release workflows to avoid duplication by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/10
* Add Date, Number, and Boolean components to BPMN Editor properties by @google-labs-jules[bot] in https://github.com/yougikou/vs-code-bpmn-flex/pull/11


**Full Changelog**: https://github.com/yougikou/vs-code-bpmn-flex/compare/v0.18.1...v0.19.0

## 0.18.1 (2026-01-19)

## What's Changed
* Feature/i18n by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/1
* Fix/eslint module issues by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/2
* Fix/ts lint warnings by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/3
* Refactor: Migrate extension settings from YAML to VS Code Settings API by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/4
* add fixing by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/6
* add implementation by @yougikou in https://github.com/yougikou/vs-code-bpmn-flex/pull/7
* feat: Add automated tests and screenshot reporting to CI by @google-labs-jules[bot] in https://github.com/yougikou/vs-code-bpmn-flex/pull/8

## New Contributors
* @google-labs-jules[bot] made their first contribution in https://github.com/yougikou/vs-code-bpmn-flex/pull/8

**Full Changelog**: https://github.com/yougikou/vs-code-bpmn-flex/commits/v0.18.1

## 0.0.1

* Initial release
* `FEAT`: Add i18n support
