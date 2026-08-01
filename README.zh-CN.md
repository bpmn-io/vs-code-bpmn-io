# BPMN.flex Editor

在 [VS Code](https://code.visualstudio.com/) 中查看和编辑 BPMN 流程图。

![VSCode BPMN Editor 截图](https://raw.githubusercontent.com/yougikou/vs-code-bpmn-flex/main/docs/screenshot.png)

## 功能特性

* 查看和编辑 [BPMN 2.0 文件](https://zh.wikipedia.org/wiki/%E4%B8%9A%E5%8A%A1%E6%B5%81%E7%A8%8B%E5%BB%BA%E6%A8%A1%E5%92%8C%E6%A0%87%E6%B3%A8)
* 保存更改到本地文件
* 撤销/重做及其他键盘快捷键
* 从空白 `.bpmn` 文件创建新图
* 国际化支持（English, 中文, 日本語）
* **自定义属性面板** — 在 VS Code 设置中定义自己的可编辑字段
* **暗色主题适配** — 全面适配 VS Code 暗色主题，绘图区、调色板、右键菜单均完美呈现
* **双引擎属性解析** — 支持 Moddle 对象树导航和原生 XPath 两种属性查询引擎
* **YAML/JSON 嵌入式内容编辑** — 在扩展元素中编辑结构化的 YAML 或 JSON 配置
* **分组折叠面板** — 属性按分组折叠显示，支持排序和提示说明

## 自定义属性配置

你可以在 VS Code 的 `settings.json` 中为任意 BPMN 元素类型定义自定义可编辑属性。每个属性由**数据源** (`source`)、**数据路径** (`path`)、**UI 控件** (`control`) 和**元数据**（标签、分组、描述等）组成。

### 属性定义字段

| 字段 | 类型 | 必填 | 说明 |
|-------|------|----------|-------------|
| `label` | `string` | ✅ | 侧边栏中显示的标签 |
| `path` | `string` | ✅ | BPMN 元素内的数据路径（详见 [路径语法](#路径语法)） |
| `source` | `string` | ✅ | 数据源：`"attribute"`、`"text"` 或 `"embedded"` |
| `control` | `string` | ✅ | UI 控件：`"text"`、`"textarea"`、`"number"`、`"boolean"`、`"date"`、`"select"` 或 `"code"` |
| `format` | `string` | — | 嵌入内容的格式：`"json"` 或 `"yaml"`（`source="embedded"` 时必填） |
| `field` | `string` | — | 嵌入 JSON/YAML 中的点分隔字段路径（配合 `source="embedded"` 使用） |
| `options` | `array` | — | `control="select"` 时的下拉选项，每项：`{ "label": "...", "value": "..." }` |
| `min` | `number` | — | `control="number"` 时的最小值 |
| `max` | `number` | — | `control="number"` 时的最大值 |
| `step` | `number` | — | `control="number"` 时的步进值 |
| `pattern` | `string` | — | 输入验证的正则表达式 |
| `defaultValue` | `string` | — | 属性为空时的默认值 |
| `placeholder` | `string` | — | 空输入框中显示的占位文本 |
| `description` | `string` | — | 悬停时以工具提示显示的帮助文本（`?` 图标） |
| `group` | `string` | — | 侧边栏中可折叠分组的组名 |
| `order` | `number` | — | 分组内的排序顺序（数值越小越靠前） |

### 路径语法

`path` 字段使用简洁的符号来导航 BPMN 元素的内部结构：

| 语法 | 含义 | 示例 |
|--------|---------|--------|
| `@attrName` | 当前元素的 XML 属性 | `@name`、`@camunda:asyncBefore` |
| `ns:elemName` | 带命名空间的子元素 | `bpmn:documentation` |
| `elemName` | 子元素（不带命名空间） | `extensionElements` |
| `/` | 嵌套路径分隔符 | `extensionElements/custom:config` |

### 数据源类型

#### `source: "attribute"` — XML 属性值

直接读取/写入 BPMN 元素上的属性值。路径使用 `@` 前缀。

```json
{
  "bpmn-flex.commonProperties": [
    {
      "label": "名称",
      "path": "@name",
      "source": "attribute",
      "control": "text",
      "group": "通用",
      "order": 1
    },
    {
      "label": "异步执行",
      "path": "@camunda:asyncBefore",
      "source": "attribute",
      "control": "boolean",
      "group": "引擎"
    }
  ]
}
```

#### `source: "text"` — 子元素文本内容

读取/写入子元素的文本内容（例如 `bpmn:documentation`）。若子元素不存在，首次写入时将自动创建。

```json
{
  "label": "文档说明",
  "path": "bpmn:documentation",
  "source": "text",
  "control": "textarea"
}
```

#### `source: "embedded"` — 子元素文本中的嵌套字段

将子元素的文本内容解析为 JSON 或 YAML，然后读写其中的特定字段。这对于编辑嵌入在扩展元素中的结构化配置非常有用。

```json
{
  "label": "服务名称",
  "path": "extensionElements/custom:flowConfig",
  "source": "embedded",
  "format": "yaml",
  "field": "service.name",
  "control": "text",
  "group": "工作流"
}
```

假设扩展元素中包含以下 YAML 内容：

```yaml
service:
  name: my-processor
  timeout: 30
```

上述属性将显示 `my-processor` 并允许编辑它。

编辑整个嵌入文档（省略 `field` 以显示全部内容）：

```json
{
  "label": "流程配置",
  "path": "extensionElements/custom:flowConfig",
  "source": "embedded",
  "format": "yaml",
  "control": "code"
}
```

### 控件类型

| 控件 | UI 组件 | 说明 |
|---------|-----------|-------|
| `text` | `<input type="text">` | 单行文本输入 |
| `textarea` | `<textarea>` | 多行文本，4 行 |
| `number` | `<input type="number">` | 数字输入，支持 `min`/`max`/`step` |
| `boolean` | `<select>` True/False | 将 "true"/"1" 视为 `true`，"false"/"0" 视为 `false` |
| `date` | `<input type="date">` | 验证 YYYY-MM-DD 格式 |
| `select` | `<select>` 下拉框 | 需要配置 `options` 数组 |
| `code` | `<textarea>` 等宽字体 | 等宽字体多行文本，8 行。适用于 YAML/JSON 编辑 |

### 完整配置示例

```jsonc
{
  // 适用于所有 BPMN 元素的属性
  "bpmn-flex.commonProperties": [
    {
      "label": "元素 ID",
      "path": "@id",
      "source": "attribute",
      "control": "text",
      "group": "通用",
      "order": 1,
      "description": "元素的唯一标识符"
    },
    {
      "label": "名称",
      "path": "@name",
      "source": "attribute",
      "control": "text",
      "group": "通用",
      "order": 2
    },
    {
      "label": "文档说明",
      "path": "bpmn:documentation",
      "source": "text",
      "control": "textarea",
      "group": "通用",
      "order": 3
    }
  ],

  // 特定元素类型的属性
  "bpmn-flex.elementSpecificProperties": {
    "bpmn:Process": [
      {
        "label": "流程类型",
        "path": "@processType",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "None", "value": "None" },
          { "label": "Public", "value": "Public" },
          { "label": "Private", "value": "Private" }
        ],
        "group": "流程"
      },
      {
        "label": "可执行",
        "path": "@isExecutable",
        "source": "attribute",
        "control": "boolean",
        "group": "流程"
      }
    ],

    "bpmn:ServiceTask": [
      {
        "label": "实现方式",
        "path": "@implementation",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "WebService", "value": "##WebService" },
          { "label": "External", "value": "##External" },
          { "label": "Expression", "value": "##Expression" }
        ],
        "group": "服务"
      },
      {
        "label": "代理表达式",
        "path": "@camunda:delegateExpression",
        "source": "attribute",
        "control": "text",
        "group": "引擎"
      }
    ],

    "bpmn:ScriptTask": [
      {
        "label": "脚本格式",
        "path": "@scriptFormat",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "JavaScript", "value": "javascript" },
          { "label": "Groovy", "value": "groovy" },
          { "label": "Python", "value": "python" },
          { "label": "FEEL", "value": "feel" }
        ],
        "group": "脚本"
      }
    ],

    "bpmn:CallActivity": [
      {
        "label": "调用元素",
        "path": "@calledElement",
        "source": "attribute",
        "control": "text",
        "group": "调用",
        "description": "被调用流程的表达式或 ID"
      }
    ],

    "bpmn:ExclusiveGateway": [
      {
        "label": "默认路径",
        "path": "@default",
        "source": "attribute",
        "control": "text",
        "group": "网关"
      }
    ],

    "bpmn:SequenceFlow": [
      {
        "label": "源节点",
        "path": "@sourceRef",
        "source": "attribute",
        "control": "text",
        "group": "连线",
        "order": 1
      },
      {
        "label": "目标节点",
        "path": "@targetRef",
        "source": "attribute",
        "control": "text",
        "group": "连线",
        "order": 2
      }
    ],

    "bpmn:Error": [
      {
        "label": "错误代码",
        "path": "@errorCode",
        "source": "attribute",
        "control": "text",
        "group": "错误"
      },
      {
        "label": "错误消息",
        "path": "@camunda:errorMessage",
        "source": "attribute",
        "control": "text",
        "group": "错误"
      }
    ]
  }
}
```

### YAML 嵌入内容

当 `source` 为 `"embedded"` 且 `format` 为 `"yaml"` 时，本扩展解析和序列化以下 YAML 子集：

- **标量**：字符串、数字（`42`、`3.14`）、布尔值（`true`/`false`）、null
- **映射**：嵌套的键值对
- **序列**：数组（如 `- item1`）
- **注释**：以 `#` 开头的行将被保留

> **注意**：锚点（`&`）、别名（`*`）、标签（`!`）、块标量（`|`、`>`）和多文档（`---`）等 YAML 特性**不被支持**。对于复杂的 YAML，请使用 `control: "code"` 直接编辑原始文本。

## 安装

从 VS Code 应用商店下载，在 VS Code 中直接搜索 `vs-code-bpmn-flex`。

## 构建与运行

首先，克隆本项目到本地，并用 [VS Code](https://code.visualstudio.com/) 打开：

```sh
git clone https://github.com/yougikou/vs-code-bpmn-flex.git
cd ./vs-code-bpmn-flex
npm install
code .
```

按 `F5` 在新的 VS Code 实例中加载和调试扩展。要运行测试，请在调试模式下选择 *Extension Tests*。

你也可以通过命令行构建扩展：

```sh
# 运行测试套件
npm run test

# 运行所有脚本（lint + test）
npm run all
```

## 许可证

MIT

包含 [bpmn-js](https://github.com/bpmn-io/bpmn-js) 的部分代码，基于 [bpmn.io 许可证](http://bpmn.io/license) 发布。
