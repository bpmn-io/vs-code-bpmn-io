import jaTranslations from 'bpmn-js-i18n/translations/ja';
import zhTranslations from 'bpmn-js-i18n/translations/zn';
import enTranslations from 'bpmn-js-i18n/translations/en';
import { customTranslations } from './customTranslations';

// 当前语言，默认与 sidebar 保持一致为英文
let currentLanguage = 'en';

// 语言映射(合并原生和自定义翻译)
const translations = {
  ja: {
    ...jaTranslations,
    ...customTranslations.ja
  },
  zh: {
    ...zhTranslations,
    ...customTranslations.zh
  },
  en: {
    ...enTranslations,
    ...customTranslations.en
  }
};

// 切换语言函数
export function setLanguage(lang) {
  currentLanguage = lang;
}

export default function customTranslate(template, replacements) {
  replacements = replacements || {};

  // 根据当前语言翻译
  template = translations[currentLanguage]?.[template] || template;

  // 替换占位符
  return template.replace(/{([^}]+)}/g, function(_, key) {
    return replacements[key] || '{' + key + '}';
  });
}