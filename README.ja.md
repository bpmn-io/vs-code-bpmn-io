# BPMN.flex Editor

[VS Code](https://code.visualstudio.com/) で BPMN ダイアグラムを表示・編集できます。

![VSCode BPMN Editor のスクリーンショット](https://raw.githubusercontent.com/yougikou/vs-code-bpmn-flex/main/docs/screenshot.png)

## 機能

* [BPMN 2.0 ファイル](https://ja.wikipedia.org/wiki/%E3%83%93%E3%82%B8%E3%83%8D%E3%82%B9%E3%83%97%E3%83%AD%E3%82%BB%E3%82%B9%E5%9B%B3%E8%A8%98%E6%B3%95)の表示と編集
* ローカルファイルへの保存
* 元に戻す/やり直しとその他のキーボードショートカット
* 空の `.bpmn` ファイルから新規作成
* 国際化対応（English, 中文, 日本語）
* **カスタムプロパティパネル** — VS Code 設定で独自の編集可能フィールドを定義
* **ダークテーマ対応** — VS Code ダークテーマに完全対応。図面領域、パレット、コンテキストメニューすべてが美しく表示
* **デュアルエンジンプロパティ解決** — Moddle オブジェクトツリーとネイティブ XPath の2つのクエリエンジンをサポート
* **YAML/JSON 埋め込みコンテンツ編集** — 拡張要素内の構造化された YAML/JSON 設定を編集
* **グループ折りたたみパネル** — プロパティをグループごとに折りたたみ表示、ソートやツールチップにも対応

## カスタムプロパティ設定

VS Code の `settings.json` で、任意の BPMN 要素タイプに対してカスタムの編集可能プロパティを定義できます。各プロパティは**データソース**（`source`）、**データパス**（`path`）、**UI コントロール**（`control`）、および**メタデータ**（ラベル、グループ、説明など）で構成されます。

### プロパティ定義フィールド

| フィールド | 型 | 必須 | 説明 |
|-------|------|----------|-------------|
| `label` | `string` | ✅ | サイドバーに表示されるラベル |
| `path` | `string` | ✅ | BPMN 要素内のデータパス（[パス構文](#パス構文)を参照） |
| `source` | `string` | ✅ | データソース: `"attribute"`, `"text"`, `"embedded"` |
| `control` | `string` | ✅ | UI コントロール: `"text"`, `"textarea"`, `"number"`, `"boolean"`, `"date"`, `"select"`, `"code"` |
| `format` | `string` | — | 埋め込みコンテンツの形式: `"json"` または `"yaml"`（`source="embedded"` 時に必須） |
| `field` | `string` | — | 埋め込み JSON/YAML 内のドット区切りフィールドパス（`source="embedded"` と併用） |
| `options` | `array` | — | `control="select"` 時のドロップダウン選択肢。各項目: `{ "label": "...", "value": "..." }` |
| `min` | `number` | — | `control="number"` 時の最小値 |
| `max` | `number` | — | `control="number"` 時の最大値 |
| `step` | `number` | — | `control="number"` 時のステップ値 |
| `pattern` | `string` | — | 入力検証の正規表現 |
| `defaultValue` | `string` | — | プロパティが空の場合のデフォルト値 |
| `placeholder` | `string` | — | 空の入力欄に表示されるプレースホルダーテキスト |
| `description` | `string` | — | ホバー時にツールチップとして表示されるヘルプテキスト（`?` アイコン） |
| `group` | `string` | — | サイドバーで折りたたみ可能なグループ名 |
| `order` | `number` | — | グループ内の並び順（小さいほど先に表示） |

### パス構文

`path` フィールドは、BPMN 要素の内部構造をナビゲートするためのシンプルな記法を使用します：

| 構文 | 意味 | 例 |
|--------|---------|--------|
| `@attrName` | 現在の要素の XML 属性 | `@name`, `@camunda:asyncBefore` |
| `ns:elemName` | 名前空間付きの子要素 | `bpmn:documentation` |
| `elemName` | 子要素（名前空間なし） | `extensionElements` |
| `/` | ネストのパス区切り | `extensionElements/custom:config` |

### ソースタイプ

#### `source: "attribute"` — XML 属性値

BPMN 要素の属性値を直接読み書きします。パスに `@` プレフィックスを使用します。

```json
{
  "bpmn-flex.commonProperties": [
    {
      "label": "名前",
      "path": "@name",
      "source": "attribute",
      "control": "text",
      "group": "一般",
      "order": 1
    },
    {
      "label": "非同期実行",
      "path": "@camunda:asyncBefore",
      "source": "attribute",
      "control": "boolean",
      "group": "エンジン"
    }
  ]
}
```

#### `source: "text"` — 子要素のテキストコンテンツ

子要素（例: `bpmn:documentation`）のテキストコンテンツを読み書きします。子要素が存在しない場合、最初の書き込み時に自動的に作成されます。

```json
{
  "label": "ドキュメント",
  "path": "bpmn:documentation",
  "source": "text",
  "control": "textarea"
}
```

#### `source: "embedded"` — 子要素テキスト内のネストフィールド

子要素のテキストコンテンツを JSON または YAML として解析し、その中の特定のフィールドを読み書きします。拡張要素に埋め込まれた構造化設定の編集に便利です。

```json
{
  "label": "サービス名",
  "path": "extensionElements/custom:flowConfig",
  "source": "embedded",
  "format": "yaml",
  "field": "service.name",
  "control": "text",
  "group": "ワークフロー"
}
```

拡張要素に以下の YAML コンテンツがある場合：

```yaml
service:
  name: my-processor
  timeout: 30
```

上記のプロパティは `my-processor` を表示し、編集可能にします。

ドキュメント全体の編集（`field` を省略すると埋め込みコンテンツ全体を表示）：

```json
{
  "label": "フロー設定",
  "path": "extensionElements/custom:flowConfig",
  "source": "embedded",
  "format": "yaml",
  "control": "code"
}
```

### コントロールタイプ

| コントロール | UI ウィジェット | 備考 |
|---------|-----------|-------|
| `text` | `<input type="text">` | 単一行テキスト |
| `textarea` | `<textarea>` | 複数行テキスト、4行 |
| `number` | `<input type="number">` | 数値入力、`min`/`max`/`step` 対応 |
| `boolean` | `<select>` True/False | "true"/"1" → `true`, "false"/"0" → `false` に変換 |
| `date` | `<input type="date">` | YYYY-MM-DD 形式を検証 |
| `select` | `<select>` ドロップダウン | `options` 配列が必要 |
| `code` | `<textarea>` 等幅フォント | 等幅フォントの複数行テキスト、8行。YAML/JSON 編集用 |

### 完全な設定例

```jsonc
{
  // すべての BPMN 要素に適用されるプロパティ
  "bpmn-flex.commonProperties": [
    {
      "label": "要素 ID",
      "path": "@id",
      "source": "attribute",
      "control": "text",
      "group": "一般",
      "order": 1,
      "description": "この要素の一意識別子"
    },
    {
      "label": "名前",
      "path": "@name",
      "source": "attribute",
      "control": "text",
      "group": "一般",
      "order": 2
    },
    {
      "label": "ドキュメント",
      "path": "bpmn:documentation",
      "source": "text",
      "control": "textarea",
      "group": "一般",
      "order": 3
    }
  ],

  // 特定の要素タイプ向けプロパティ
  "bpmn-flex.elementSpecificProperties": {
    "bpmn:Process": [
      {
        "label": "プロセスタイプ",
        "path": "@processType",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "None", "value": "None" },
          { "label": "Public", "value": "Public" },
          { "label": "Private", "value": "Private" }
        ],
        "group": "プロセス"
      },
      {
        "label": "実行可能",
        "path": "@isExecutable",
        "source": "attribute",
        "control": "boolean",
        "group": "プロセス"
      }
    ],

    "bpmn:ServiceTask": [
      {
        "label": "実装方式",
        "path": "@implementation",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "WebService", "value": "##WebService" },
          { "label": "External", "value": "##External" },
          { "label": "Expression", "value": "##Expression" }
        ],
        "group": "サービス"
      },
      {
        "label": "デリゲート式",
        "path": "@camunda:delegateExpression",
        "source": "attribute",
        "control": "text",
        "group": "エンジン"
      }
    ],

    "bpmn:ScriptTask": [
      {
        "label": "スクリプト形式",
        "path": "@scriptFormat",
        "source": "attribute",
        "control": "select",
        "options": [
          { "label": "JavaScript", "value": "javascript" },
          { "label": "Groovy", "value": "groovy" },
          { "label": "Python", "value": "python" },
          { "label": "FEEL", "value": "feel" }
        ],
        "group": "スクリプト"
      }
    ],

    "bpmn:CallActivity": [
      {
        "label": "呼び出し要素",
        "path": "@calledElement",
        "source": "attribute",
        "control": "text",
        "group": "呼び出し",
        "description": "呼び出し先プロセスの式または ID"
      }
    ],

    "bpmn:ExclusiveGateway": [
      {
        "label": "デフォルトフロー",
        "path": "@default",
        "source": "attribute",
        "control": "text",
        "group": "ゲートウェイ"
      }
    ],

    "bpmn:SequenceFlow": [
      {
        "label": "ソース",
        "path": "@sourceRef",
        "source": "attribute",
        "control": "text",
        "group": "フロー",
        "order": 1
      },
      {
        "label": "ターゲット",
        "path": "@targetRef",
        "source": "attribute",
        "control": "text",
        "group": "フロー",
        "order": 2
      }
    ],

    "bpmn:Error": [
      {
        "label": "エラーコード",
        "path": "@errorCode",
        "source": "attribute",
        "control": "text",
        "group": "エラー"
      },
      {
        "label": "エラーメッセージ",
        "path": "@camunda:errorMessage",
        "source": "attribute",
        "control": "text",
        "group": "エラー"
      }
    ]
  }
}
```

### YAML 埋め込みコンテンツ

`source` が `"embedded"` で `format` が `"yaml"` の場合、本拡張は以下の実用的な YAML サブセットを解析・シリアライズします：

- **スカラー**: 文字列、数値（`42`, `3.14`）、真偽値（`true`/`false`）、null
- **マッピング**: ネストされたキーと値のペア
- **シーケンス**: 配列（例: `- item1`）
- **コメント**: `#` で始まる行は保持されます

> **注意**: アンカー（`&`）、エイリアス（`*`）、タグ（`!`）、ブロックスカラー（`|`, `>`）、マルチドキュメント（`---`）などの YAML 機能は**サポートされていません**。複雑な YAML の場合は `control: "code"` を使用して生テキストを直接編集してください。

## インストール

VS Code マーケットプレイスからダウンロードするか、VS Code 内で直接 `vs-code-bpmn-flex` を検索してください。

## ビルドと実行

まず、このプロジェクトをローカルマシンにクローンし、[VS Code](https://code.visualstudio.com/) で開きます：

```sh
git clone https://github.com/yougikou/vs-code-bpmn-flex.git
cd ./vs-code-bpmn-flex
npm install
code .
```

`F5` キーを押して、新しい VS Code インスタンスで拡張機能を読み込みデバッグします。テストを実行するには、デバッグモードで *Extension Tests* を選択してください。

コマンドラインから拡張機能をビルドすることもできます：

```sh
# テストスイートを実行
npm run test

# すべてのスクリプトを実行（lint + test）
npm run all
```

## ライセンス

MIT

[bpmn-js](https://github.com/bpmn-io/bpmn-js) の一部を含み、[bpmn.io ライセンス](http://bpmn.io/license) に基づいて公開されています。
