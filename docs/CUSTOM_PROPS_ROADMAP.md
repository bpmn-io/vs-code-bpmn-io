# 自定义属性面板 - 开发状态 & Roadmap

> 更新日期: 2025-07-21

---

## 一、当前实现状态

### ✅ 已完成

| 模块 | 功能 | 涉及文件 |
|------|------|----------|
| **配置架构** | `package.json` 中定义 `bpmn-flex.commonProperties` 和 `bpmn-flex.elementSpecificProperties` 的 VS Code 配置 schema | `package.json` |
| **配置加载** | 扩展激活时从 VS Code 配置读取并解析自定义属性 | `src/extension.ts` |
| **配置传递** | 通过 `customConfig` 消息将配置发送到 webview | `src/bpmn-editor.ts` (L282) |
| **侧边栏 UI** | 可折叠/展开的侧边栏，支持 toggle(←/→)、expand([+])、minimize([-]) 三种状态 | `src/client/sidebar/sidebar.js` |
| **动态表单** | 根据属性类型动态生成对应的表单控件 | `src/client/sidebar/sidebar.js` |
| **属性读取** | 基于 bpmn-js moddle 对象模拟 XPath 遍历，提取元素属性值 | `src/client/customPropsExtractor.js` |
| **属性写回** | 通过 `modeling.updateProperties` 和 `modeling.updateModdleProperties` 将修改写回 | `src/client/customPropsExtractor.js` |

#### 支持的属性类型

| type | UI 控件 | 说明 |
|------|---------|------|
| `attribute` | `<input type="text">` | 通用属性值 |
| `elementText` | `<textarea>` | 元素文本内容（如 documentation） |
| `date` | `<input type="date">` | 日期 |
| `number` | `<input type="number">` | 数字 |
| `boolean` | `<select>` True/False | 布尔值（支持 0/1 兼容） |
| `json` + `jsonPath` | 根据 `inputType` 动态选择 | JSON 嵌套字段，支持 `text`/`number`/`boolean`/`date` |

#### 已处理的边界情况

- `bpmn:documentation` 不存在时自动创建
- JSON 解析失败时降级为空对象
- 数组类型取第一个元素
- 嵌套 `$attrs` 属性访问
- 无效 JSON 时安全降级

---

### ⚠️ 半完成 / 实现不完整

| 问题 | 严重程度 | 位置 | 说明 |
|------|----------|------|------|
| **`fullXPath` 类型** | 中 | `customPropsExtractor.js:103` | 已声明但标记为 TODO，从未实现 |
| **非真实 XPath** | 中 | `customPropsExtractor.js` | 用 `/` 分割路径手动遍历 moddle 对象，不是基于 XML 的真正 XPath 引擎。对简单路径有效，但对带条件的 XPath 表达式（如 `//bpmn:Task[@name='foo']`）无效 |
| **中间路径缺失** | 中 | `customPropsExtractor.js:138-142` | 更新属性时如果中间路径对象不存在，仅 `console.warn` 后 return，不自动创建 |
| **语言切换重建** | 低 | `bpmn-editor.js:48-65` | 切换语言时 `modeler.destroy()` + 重新 `new BpmnModeler` + `importXML`，性能开销大 |
| **单元素选择** | 低 | `bpmn-editor.js:111-130` | 仅处理 `newSelection.length === 1`，多选时显示占位符 |

---

### ❌ 缺失

| 缺失功能 | 优先级 | 说明 |
|----------|--------|------|
| **单元测试** | 🔴 高 | `extension.test.ts` 只测了配置是否存在，没有测 `extractProperties`/`updateProperty` 逻辑 |
| **输入验证** | 🔴 高 | number 类型不限制范围，date 不校验格式，boolean 不处理异常值 |
| **暗色主题** | 🟡 中 | 侧边栏硬编码 `#f5f5f5`、`#333` 等亮色值，VS Code 暗色主题下不协调 |
| **内联样式到 CSS** | 🟡 中 | `sidebar.js` 中大量 `input.style.xxx`，应迁移到 CSS 类 |
| **错误用户提示** | 🟡 中 | 错误仅 `console.warn`，用户看不到；侧边栏显示 "Error evaluating" 不友好 |
| **属性排序** | 🟢 低 | 按配置数组顺序，不支持拖拽重排 |
| **默认值** | 🟢 低 | 新建元素时属性为空，无默认值概念 |
| **i18n 标签** | 🟢 低 | 属性标签直接使用配置中的 label，不支持多语言 |
| **键盘快捷键** | 🟢 低 | 侧边栏无键盘操作支持 |
| **属性分组/分类** | 🟢 低 | 所有属性扁平列表，无折叠分组 |
| **撤销支持** | 🟢 低 | 属性修改是否可撤销取决于 modeling 层，未明确测试 |

---

## 二、建议 Roadmap

### Phase 1: 稳定性 & 测试（短期 - 1~2 周） ✅ 已完成

```
目标：让现有功能可靠、可测试
```

- [x] **1.1 编写 `extractProperties` 单元测试**
  - Mock bpmn-js element/businessObject
  - 覆盖所有 type：attribute, elementText, date, number, boolean, json
  - 覆盖边界：嵌套路径、数组、缺失属性、$attrs 访问
  - 覆盖 `json + jsonPath` + 各种 `inputType`

- [x] **1.2 编写 `updateProperty` 单元测试**
  - Mock modeling/modle API
  - 覆盖 `updateProperties` vs `updateModdleProperties` 分支
  - 覆盖 `bpmn:documentation` 自动创建
  - 覆盖 JSON 深层更新 & 类型转换

- [x] **1.3 添加输入验证**
  - `number`: 可选 min/max/step 配置
  - `date`: 格式校验
  - `boolean`: 统一 true/false vs 0/1 的处理逻辑
  - 验证失败时显示友好错误提示而非静默忽略

- [x] **1.4 改进错误处理**
  - 错误消息中文化（或跟随 VS Code locale）
  - 侧边栏显示具体错误原因而非 "Error evaluating"
  - 提取失败时保留上次成功结果，不清空面板

---

### Phase 2: 完善 & 补全（中期 - 2~4 周）

```
目标：补齐半完成功能，解决已知痛点
```

- [ ] **2.1 实现 `fullXPath` 类型**
  - 将 businessObject 序列化为 XML (DOM)
  - 使用 `xmldom` + `xpath` 库做真正的 XPath 查询
  - 性能考虑：缓存序列化结果，仅在 XML 变更时刷新

- [ ] **2.2 中间路径自动创建**
  - updateProperty 时若中间对象缺失，自动用 `moddle.create()` 创建
  - 提供 `autoCreate` 配置开关，默认开启

- [ ] **2.3 暗色主题适配**
  - 使用 VS Code CSS variables（`--vscode-editor-background` 等）
  - 或通过 webview postMessage 传递主题信息
  - 监听 `vscode.window.onDidChangeActiveColorTheme`

- [ ] **2.4 样式重构**
  - 将 `sidebar.js` 中内联样式提取到 `sidebar.css`
  - 使用 BEM 或类似命名规范
  - 清理注释掉的 collapse 动画代码

- [ ] **2.5 语言切换优化**
  - 探索不销毁 Modeler 的语言切换方式
  - 或至少保留状态（选中、视口位置、undo stack）

---

### Phase 3: 增强 & 扩展（长期 - 1~3 月）

```
目标：提升用户体验，增加差异化功能
```

- [ ] **3.1 多选支持**
  - 多选时显示公共属性（交集）
  - 批量修改：修改一个属性同步到所有选中元素

- [ ] **3.2 属性分组 & 折叠**
  - 配置中支持 `group` 字段
  - 侧边栏按分组折叠显示
  - 默认展开/折叠状态可配置

- [ ] **3.3 默认值**
  - 配置中支持 `default` 字段
  - 新建元素时自动填充默认值
  - 区分"从未设置"和"设为默认值"

- [ ] **3.4 属性标签 i18n**
  - label 支持多语言 key，如 `"label": "${i18n:process.name}"`
  - 根据当前语言选择对应翻译
  - 或直接复用 `bpmn-js-i18n` 的翻译资源

- [ ] **3.5 键盘操作**
  - Tab 在属性字段间切换
  - Enter 确认并移到下一字段
  - Escape 取消编辑

- [ ] **3.6 属性类型扩展**
  - `select` - 下拉选择（options 可配置）
  - `color` - 颜色选择器（复用 bpmn-js-color-picker）
  - `expression` - 表达式编辑器（FEEL/JUEL 语法高亮？）
  - `reference` - 引用其他 BPMN 元素（下拉搜索）

- [ ] **3.7 属性模板/预设**
  - 预定义常用属性集合（如 "Camunda Properties", "Flowable Properties"）
  - 一键应用到选中元素

---

## 三、代码质量总览

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐ | 清晰的分层：extension → webview → extractor/sidebar，消息传递简洁 |
| 代码可读性 | ⭐⭐⭐ | 中文注释混合英文，部分逻辑需要重构（如 boolean 的 0/1 处理） |
| 错误处理 | ⭐⭐ | 大量 console.warn，用户不可见；无统一错误边界 |
| 测试覆盖 | ⭐ | 仅有配置存在性测试，核心逻辑 0 覆盖 |
| 主题适配 | ⭐ | 完全硬编码亮色主题 |
| 类型安全 | ⭐⭐⭐⭐ | TypeScript strict 模式，接口定义清晰 |

---

## 四、建议的开发优先级

```
Phase 1 (已完成)   → 1.3 输入验证 ✅ → 1.4 错误处理 ✅ → 1.1/1.2 单元测试 ✅ (47 tests)
Phase 2 (下一步)  → 2.4 样式重构 → 2.3 暗色主题 → 2.2 自动创建 → 2.5 语言切换
Phase 3 (按需)    → 根据用户反馈选择 3.1~3.7
```

## 五、Phase 1 完成详情

### 新增 npm 脚本
```bash
npm run test:unit   # 运行单元测试（无需启动 VS Code，47 个测试，~6ms）
npm test            # 运行集成测试（需要 VS Code，原有不变）
```

### 输入验证改进
- `number` 类型：拒绝非数字值，支持 `min`/`max`/`step` 配置
- `date` 类型：格式校验 YYYY-MM-DD
- JSON 的 `number`/`date`/`boolean` inputType 均有验证
- 验证失败时恢复原值并显示红色错误提示
- 用户修正输入后自动清除错误提示

### 错误处理改进
- `extractProperties`：提取失败时附带 `_error` 字段，侧边栏显示 ⚠ 图标（hover 查看错误）
- `updateProperty`：所有分支拒绝无效输入并打 `console.warn`
- 布尔值规范化：统一处理 `true`/`false`/`1`/`0`
- JSON 解析失败降级为空对象并打 warn
- 未知类型和 fullXPath 类型友好降级（空值 + warn）

### 单元测试覆盖
- `getDeep`/`setDeep`：5+4 个测试
- `extractProperties`：22 个测试（覆盖所有类型、边界、错误路径）
- `updateProperty`：18 个测试（覆盖所有类型、类型转换、验证拒绝）
- 总计 **47 个测试**，全部通过

