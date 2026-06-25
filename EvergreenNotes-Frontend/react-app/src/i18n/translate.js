import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from "./translations"

const LANGUAGE_STORAGE_KEY = "evergreen.language"

export function getBrowserLanguage() {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE
  }

  const raw = navigator.language || DEFAULT_LANGUAGE
  return raw.toLowerCase().startsWith("fr") ? "fr" : DEFAULT_LANGUAGE
}

export function getStoredLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored
    }
  } catch {
    return DEFAULT_LANGUAGE
  }

  return DEFAULT_LANGUAGE
}

export function resolveInitialLanguage() {
  const stored = getStoredLanguage()
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored
  }

  return getBrowserLanguage()
}

export function setStoredLanguage(language) {
  if (typeof window === "undefined") {
    return
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore storage errors.
  }
}

export function getLocaleForLanguage(language) {
  return language === "fr" ? "fr-FR" : "en-GB"
}

export function translate(key, vars = {}, language = getStoredLanguage()) {
  const table = translations[language] || translations[DEFAULT_LANGUAGE] || {}
  const fallbackTable = translations[DEFAULT_LANGUAGE] || {}
  const template = table[key] ?? fallbackTable[key] ?? key

  return String(template).replace(/\{(\w+)\}/g, (_, token) => {
    if (Object.prototype.hasOwnProperty.call(vars, token)) {
      return String(vars[token])
    }

    return `{${token}}`
  })
}
