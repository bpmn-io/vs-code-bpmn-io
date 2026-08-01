// 客制化组件多语言支持
export const customTranslations = {
  ja: {
    'Set color': '色を設定',
    'Default': 'デフォルト',
    'Blue': '青',
    'Orange': 'オレンジ',
    'Green': '緑',
    'Red': '赤',
    'Purple': '紫',
    'Properties': 'プロパティ',

    // ── Sidebar UI ──
    'sidebar.rootElements': 'ルート要素',
    'sidebar.noSelection': '未選択',
    'sidebar.noSelection.desc': 'BPMN要素を選択するか、上記のルート要素を選んでください。',
    'sidebar.noProperties': 'プロパティなし',
    'sidebar.noProperties.desc': 'この要素タイプにはカスタムプロパティが<br>設定されていません。<br><br>VS Code設定で <code>bpmn-flex.commonProperties</code> や<br><code>bpmn-flex.elementSpecificProperties</code> を<br>追加してください。',
    'sidebar.standalone': 'スタンドアロン',

    // Collaboration tooltip
    'sidebar.collaboration.tooltip': 'コラボレーション: {name}\n{count} 件の参加者を含む\nクリックでプロパティを表示',
    'sidebar.collaboration.tooltip.noName': 'コラボレーションコンテナ\n{count} 件の参加者を含む\nクリックでプロパティを表示',

    // Participant tooltip
    'sidebar.participant.tooltip': '参加者 (プール): {name}\nクリックでキャンバス上に表示',

    // Process tooltip
    'sidebar.process.tooltip.withPool': 'プロセス: {name}\n使用プール: {pool}\nクリックでプロパティを表示（プールがハイライトされます）',
    'sidebar.process.tooltip.standalone': 'プロセス: {name}\nスタンドアロンプロセス（関連プールなし）\nクリックでプロパティを表示',
    'sidebar.process.tooltip.generic': 'プロセス: {name}\nクリックでプロパティを表示',

    // Associated pool label
    'sidebar.associatedPool': '関連プール',

    // Validation
    'sidebar.validation.invalidNumber': '有効な数値を入力してください',
    'sidebar.validation.minValue': '最小値は {min}',
    'sidebar.validation.maxValue': '最大値は {max}',
    'sidebar.validation.invalidDate': '有効な日付を入力してください (YYYY-MM-DD)',
    'sidebar.validation.patternMismatch': '入力形式が一致しません',

    // Boolean select
    'sidebar.boolean.true': 'はい',
    'sidebar.boolean.false': 'いいえ',

    // Fallback info (shown when no custom props configured)
    'sidebar.info.name': '名前',
    'sidebar.info.id': 'ID',
    'sidebar.info.type': 'タイプ',
    'sidebar.info.noConfig': 'この要素タイプには設定されたカスタムプロパティがありません。',
    'sidebar.info.selectHint': 'BPMN要素を選択するか、上記のルート要素を選んでプロパティを表示してください。',

    // Misc
    'sidebar.dragToResize': 'ドラッグでリサイズ',
    'sidebar.hidePanel': 'パネルを隠す',
    'sidebar.language': '言語',
    'sidebar.refreshConfig': '設定を再読み込み',
    'sidebar.poolCount': '{count} プール',

    // Properties group default name
    'sidebar.properties.group.general': '一般',

    // Property details section title
    'sidebar.propertyDetails': 'プロパティ詳細',
  },
  zh: {
    'Set color': '设置颜色',
    'Default': '默认',
    'Blue': '蓝',
    'Orange': '橙',
    'Green': '绿',
    'Red': '红',
    'Purple': '紫',
    'Properties': '属性',

    // ── Sidebar UI ──
    'sidebar.rootElements': '根元素',
    'sidebar.noSelection': '未选择',
    'sidebar.noSelection.desc': '选择一个 BPMN 元素，或在上方根元素中选择。',
    'sidebar.noProperties': '无属性',
    'sidebar.noProperties.desc': '此元素类型没有配置自定义属性。<br><br>请在 VS Code 设置中添加<br><code>bpmn-flex.commonProperties</code> 或<br><code>bpmn-flex.elementSpecificProperties</code>。',
    'sidebar.standalone': '独立',

    // Collaboration tooltip
    'sidebar.collaboration.tooltip': '协作: {name}\n包含 {count} 个参与流程\n点击查看协作属性',
    'sidebar.collaboration.tooltip.noName': '协作容器\n包含 {count} 个参与流程\n点击查看协作属性',

    // Participant tooltip
    'sidebar.participant.tooltip': '参与流程 (流程池): {name}\n点击定位到画布',

    // Process tooltip
    'sidebar.process.tooltip.withPool': '流程: {name}\n所属流程池: {pool}\n点击查看流程属性（流程池将被高亮）',
    'sidebar.process.tooltip.standalone': '流程: {name}\n独立流程（无关联流程池）\n点击查看流程属性',
    'sidebar.process.tooltip.generic': '流程: {name}\n点击查看流程属性',

    // Associated pool label
    'sidebar.associatedPool': '关联流程池',

    // Validation
    'sidebar.validation.invalidNumber': '请输入有效数字',
    'sidebar.validation.minValue': '最小值为 {min}',
    'sidebar.validation.maxValue': '最大值为 {max}',
    'sidebar.validation.invalidDate': '请输入有效日期 (YYYY-MM-DD)',
    'sidebar.validation.patternMismatch': '输入格式不匹配',

    // Boolean select
    'sidebar.boolean.true': '是',
    'sidebar.boolean.false': '否',

    // Fallback info (shown when no custom props configured)
    'sidebar.info.name': '名称',
    'sidebar.info.id': 'ID',
    'sidebar.info.type': '类型',
    'sidebar.info.noConfig': '此元素类型没有配置的自定义属性。',
    'sidebar.info.selectHint': '选择一个 BPMN 元素或在上方根元素中选择以查看其属性。',

    // Misc
    'sidebar.dragToResize': '拖动调整大小',
    'sidebar.hidePanel': '隐藏面板',
    'sidebar.language': '语言',
    'sidebar.refreshConfig': '重新加载设置',
    'sidebar.poolCount': '{count} 个流程池',

    // Properties group default name
    'sidebar.properties.group.general': '通用',

    // Property details section title
    'sidebar.propertyDetails': '属性详细',
  },
  en: {
    'Set color': 'Set color',
    'Default': 'Default',
    'Blue': 'Blue',
    'Orange': 'Orange',
    'Green': 'Green',
    'Red': 'Red',
    'Purple': 'Purple',
    'Properties': 'Properties',

    // ── Sidebar UI ──
    'sidebar.rootElements': 'Root Elements',
    'sidebar.noSelection': 'No Selection',
    'sidebar.noSelection.desc': 'Select a BPMN element on the canvas\nor choose a Root Element above.',
    'sidebar.noProperties': 'No Properties',
    'sidebar.noProperties.desc': 'No custom properties configured for this element type.<br><br>Add <code>bpmn-flex.commonProperties</code> or<br><code>bpmn-flex.elementSpecificProperties</code><br>in your VS Code settings.',
    'sidebar.standalone': 'standalone',

    // Collaboration tooltip
    'sidebar.collaboration.tooltip': 'Collaboration: {name}\nContains {count} participant(s)\nClick to view collaboration properties',
    'sidebar.collaboration.tooltip.noName': 'Collaboration container\nContains {count} participant(s)\nClick to view collaboration properties',

    // Participant tooltip
    'sidebar.participant.tooltip': 'Participant (Pool): {name}\nClick to select on canvas',

    // Process tooltip
    'sidebar.process.tooltip.withPool': 'Process: {name}\nUsed by Pool: {pool}\nClick to view process properties (pool will be highlighted)',
    'sidebar.process.tooltip.standalone': 'Process: {name}\nStandalone process (no associated pool)\nClick to view process properties',
    'sidebar.process.tooltip.generic': 'Process: {name}\nClick to view process properties',

    // Associated pool label
    'sidebar.associatedPool': 'Associated Pool',

    // Validation
    'sidebar.validation.invalidNumber': 'Please enter a valid number',
    'sidebar.validation.minValue': 'Minimum value is {min}',
    'sidebar.validation.maxValue': 'Maximum value is {max}',
    'sidebar.validation.invalidDate': 'Please enter a valid date (YYYY-MM-DD)',
    'sidebar.validation.patternMismatch': 'Input does not match the required pattern',

    // Boolean select
    'sidebar.boolean.true': 'True',
    'sidebar.boolean.false': 'False',

    // Fallback info (shown when no custom props configured)
    'sidebar.info.name': 'Name',
    'sidebar.info.id': 'ID',
    'sidebar.info.type': 'Type',
    'sidebar.info.noConfig': 'No custom properties configured for this element type.<br><br>Add <code>bpmn-flex.commonProperties</code> or<br><code>bpmn-flex.elementSpecificProperties.&lt;elementType&gt;</code><br>in your VS Code settings.',
    'sidebar.info.selectHint': 'Select a BPMN element or choose a Root Element above to see its properties.',

    // Misc
    'sidebar.dragToResize': 'Drag to resize',
    'sidebar.hidePanel': 'Hide Properties Panel',
    'sidebar.language': 'Language',
    'sidebar.refreshConfig': 'Reload Settings',
    'sidebar.poolCount': '{count} pool(s)',

    // Properties group default name
    'sidebar.properties.group.general': 'General',

    // Property details section title
    'sidebar.propertyDetails': 'Property Details',
  }
};
