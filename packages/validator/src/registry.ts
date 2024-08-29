import {
  FormPath,
  each,
  lowerCase,
  globalThisPolyfill,
  merge as deepmerge,
  isFn,
  isStr,
} from '@formily/shared'
import {
  ValidatorFunctionResponse,
  ValidatorFunction,
  IRegistryFormats,
  IRegistryLocaleMessages,
  IRegistryLocales,
  IRegistryRules,
} from './types'

const getIn = FormPath.getIn

const self: any = globalThisPolyfill

const defaultLanguage = 'en'

const getBrowserlanguage = () => {
  /* istanbul ignore next */
  if (!self.navigator) {
    return defaultLanguage
  }
  return (
    self.navigator.browserlanguage || self.navigator.language || defaultLanguage
  )
}

const registry = {
  locales: {
    messages: {},
    language: getBrowserlanguage(),
  },
  formats: {},
  rules: {
    // 全局校验规则
    global: {},
    // 简写校验规则
    easy: {},
    // 自定义校验规则
    merge: {},
  },
  template: null,
}

const getISOCode = (language: string) => {
  let isoCode = registry.locales.language
  if (registry.locales.messages[language]) {
    return language
  }
  const lang = lowerCase(language)
  each(
    registry.locales.messages,
    (messages: IRegistryLocaleMessages, key: string) => {
      const target = lowerCase(key)
      if (target.indexOf(lang) > -1 || lang.indexOf(target) > -1) {
        isoCode = key
        return false
      }
    }
  )
  return isoCode
}

export const getValidateLocaleIOSCode = getISOCode

export const setValidateLanguage = (lang: string) => {
  registry.locales.language = lang || defaultLanguage
}

export const getValidateLanguage = () => registry.locales.language

export const getLocaleByPath = (
  path: string,
  lang: string = registry.locales.language
) => getIn(registry.locales.messages, `${getISOCode(lang)}.${path}`)

export const getValidateLocale = (path: string) => {
  const message = getLocaleByPath(path)
  return (
    message ||
    getLocaleByPath('pattern') ||
    getLocaleByPath('pattern', defaultLanguage)
  )
}

export const getValidateMessageTemplateEngine = () => registry.template

export const getValidateFormats = (key?: string) =>
  key ? registry.formats[key] : registry.formats

/**
 * @description 覆盖规则
 * 全局规则 < 简写规则 < 用户自定义规则
 * @param key
 * @returns
 */
export const getValidateRules = <T>(
  key?: T
): T extends string
  ? ValidatorFunction
  : { [key: string]: ValidatorFunction } => {
  let rules = {
    ...registry.rules['global'],
    ...registry.rules['easy'],
    ...registry.rules['merge'],
  }
  return key ? rules[key as any] : rules
}

export const registerValidateLocale = (locale: IRegistryLocales) => {
  registry.locales.messages = deepmerge(registry.locales.messages, locale)
}

/**
 * @description 全局规则
 * @param rules
 */
export const registerValidateRules = (rules: IRegistryRules) => {
  each(rules, (rule, key) => {
    if (isFn(rule)) {
      registry.rules['global'][key] = rule
    }
  })
}
/**
 * @description 简写规则
 * @param rules
 */
export const registerEasyRules = (rules: IRegistryRules) => {
  each(rules, (rule, key) => {
    if (isFn(rule)) {
      registry.rules['easy'][key] = rule
    }
  })
}

/**
 * @description 自定义规则
 * @param rules
 */
export const registerMergeRules = (rules: IRegistryRules) => {
  each(rules, (rule, key) => {
    if (isFn(rule)) {
      registry.rules['merge'][key] = rule
    }
  })
}

export const registerValidateFormats = (formats: IRegistryFormats) => {
  each(formats, (pattern, key) => {
    if (isStr(pattern) || pattern instanceof RegExp) {
      registry.formats[key] = new RegExp(pattern)
    }
  })
}

export const registerValidateMessageTemplateEngine = (
  template: (message: ValidatorFunctionResponse, context: any) => any
) => {
  registry.template = template
}
