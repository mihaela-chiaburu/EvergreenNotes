const storageKeys = {
  apiBaseUrl: "apiBaseUrl",
  token: "token",
  email: "email",
}

const elements = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  loginButton: document.getElementById("loginButton"),
  logoutButton: document.getElementById("logoutButton"),
  noteTitle: document.getElementById("noteTitle"),
  noteSource: document.getElementById("noteSource"),
  noteTags: document.getElementById("noteTags"),
  tagSuggestions: document.getElementById("tagSuggestions"),
  noteContent: document.getElementById("noteContent"),
  saveButton: document.getElementById("saveButton"),
  statusMessage: document.getElementById("statusMessage"),
}

let capturedSourceThumbnail = null
let tagSuggestionTimer = null
let lastTagQuery = ""

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message || ""
  elements.statusMessage.classList.toggle("capture__status--error", Boolean(isError))
}

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || "").trim().replace(/\/+$/, "")
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
}

function getSourceTypeFromUrl(url) {
  if (!url) {
    return null
  }

  let hostname = ""
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch (error) {
    return "article"
  }

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return "youtube"
  }

  if (hostname.includes("tiktok.com")) {
    return "tiktok"
  }

  if (hostname.includes("instagram.com")) {
    return "instagram"
  }

  return "article"
}

function parseTags(rawText) {
  return [...new Set(
    (rawText || "")
      .split(",")
      .map((value) => value.trim().replace(/^#/, ""))
      .filter(Boolean),
  )]
}

function splitTagInput(rawText) {
  const segments = (rawText || "").split(",")
  const lastRaw = segments.pop() ?? ""
  const existing = segments
    .map((value) => value.trim())
    .filter(Boolean)
  return {
    existing,
    current: lastRaw.trim(),
  }
}

function clearTagSuggestions() {
  elements.tagSuggestions.innerHTML = ""
  elements.tagSuggestions.classList.remove("capture__suggestions--visible")
}

function renderTagSuggestions(items) {
  if (!items.length) {
    clearTagSuggestions()
    return
  }

  elements.tagSuggestions.innerHTML = ""
  items.forEach((item) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "capture__suggestion"
    button.textContent = item
    button.addEventListener("mousedown", (event) => {
      event.preventDefault()
      applyTagSuggestion(item)
    })
    elements.tagSuggestions.appendChild(button)
  })

  elements.tagSuggestions.classList.add("capture__suggestions--visible")
}

function applyTagSuggestion(tagName) {
  const { existing } = splitTagInput(elements.noteTags.value)
  const normalizedExisting = new Set(existing.map((tag) => tag.toLowerCase()))
  if (!normalizedExisting.has(tagName.toLowerCase())) {
    existing.push(tagName)
  }

  elements.noteTags.value = existing.length ? `${existing.join(", ")}, ` : ""
  clearTagSuggestions()
  elements.noteTags.focus()
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = body?.error || `Request failed (${response.status})`
    throw new Error(error)
  }

  return body
}

async function readStorage() {
  const data = await chrome.storage.local.get([storageKeys.apiBaseUrl, storageKeys.token, storageKeys.email])
  elements.apiBaseUrl.value = data[storageKeys.apiBaseUrl] || "https://localhost:7010"
  elements.email.value = data[storageKeys.email] || ""

  return {
    token: data[storageKeys.token] || "",
    apiBaseUrl: elements.apiBaseUrl.value,
  }
}

async function saveStorage(partial) {
  await chrome.storage.local.set(partial)
}

async function clearToken() {
  await chrome.storage.local.remove(storageKeys.token)
}

async function injectContentExtractor(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-extractor.js"],
    })
    return true
  } catch (error) {
    setStatus("Could not access this tab. Try refreshing the page.", true)
    return false
  }
}

async function hydrateFromActiveTab() {
  const tab = await getActiveTab()
  if (!tab?.id) {
    return
  }

  const canInject = await injectContentExtractor(tab.id)
  if (!canInject) {
    return
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_CONTEXT" }).catch(() => null)
  if (!response?.ok || !response.payload) {
    setStatus("Could not read details from this tab.", true)
    return
  }

  elements.noteTitle.value = response.payload.title || ""
  elements.noteSource.value = response.payload.sourceUrl || tab.url || ""
  capturedSourceThumbnail = response.payload.sourceThumbnail || null
}

async function fetchTagSuggestions(query) {
  if (!query) {
    return []
  }

  const apiBaseUrl = normalizeBaseUrl(elements.apiBaseUrl.value)
  if (!apiBaseUrl) {
    return []
  }

  const data = await chrome.storage.local.get([storageKeys.token])
  const token = data[storageKeys.token]
  if (!token) {
    return []
  }

  const url = `${apiBaseUrl}/api/taxonomy/tags/search?q=${encodeURIComponent(query)}&limit=8`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return []
  }

  const body = await response.json().catch(() => ({}))
  const items = body?.items || []
  return items.map((item) => item.name || item.Name).filter(Boolean)
}

function scheduleTagSuggestions() {
  if (tagSuggestionTimer) {
    clearTimeout(tagSuggestionTimer)
  }

  tagSuggestionTimer = setTimeout(async () => {
    const { current } = splitTagInput(elements.noteTags.value)
    if (!current || current.length < 1) {
      clearTagSuggestions()
      return
    }

    if (current === lastTagQuery) {
      return
    }

    lastTagQuery = current
    const items = await fetchTagSuggestions(current)
    renderTagSuggestions(items)
  }, 200)
}

async function login() {
  const apiBaseUrl = normalizeBaseUrl(elements.apiBaseUrl.value)
  const email = elements.email.value.trim()
  const password = elements.password.value

  if (!apiBaseUrl || !email || !password) {
    setStatus("API URL, email, and password are required.", true)
    return
  }

  try {
    const payload = await fetchJson(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    await saveStorage({
      [storageKeys.apiBaseUrl]: apiBaseUrl,
      [storageKeys.email]: email,
      [storageKeys.token]: payload.token,
    })

    elements.password.value = ""
    setStatus("Logged in successfully.")
  } catch (error) {
    setStatus(error.message || "Login failed.", true)
  }
}

async function saveNote() {
  const apiBaseUrl = normalizeBaseUrl(elements.apiBaseUrl.value)
  const title = elements.noteTitle.value.trim()
  const sourceUrl = elements.noteSource.value.trim()
  const content = elements.noteContent.value.trim()
  const tags = parseTags(elements.noteTags.value)

  if (!apiBaseUrl || !title || !content) {
    setStatus("API URL, title and content are required.", true)
    return
  }

  const data = await chrome.storage.local.get([storageKeys.token])
  const token = data[storageKeys.token]

  if (!token) {
    setStatus("Please login first.", true)
    return
  }

  try {
    const note = await fetchJson(`${apiBaseUrl}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        content,
        sourceUrl: sourceUrl || null,
        sourceType: sourceUrl ? getSourceTypeFromUrl(sourceUrl) : null,
        sourceThumbnail: capturedSourceThumbnail,
      }),
    })

    await fetchJson(`${apiBaseUrl}/api/notes/${note.id}/tags`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tagNames: tags }),
    })

    elements.noteContent.value = ""
    setStatus("Note saved to EvergreenNotes.")
  } catch (error) {
    setStatus(error.message || "Save failed.", true)
  }
}

async function bootstrap() {
  await readStorage()
  await hydrateFromActiveTab()

  elements.loginButton.addEventListener("click", login)
  elements.logoutButton.addEventListener("click", async () => {
    await clearToken()
    setStatus("Logged out.")
  })

  elements.saveButton.addEventListener("click", saveNote)

  elements.noteTags.addEventListener("input", scheduleTagSuggestions)
  elements.noteTags.addEventListener("focus", scheduleTagSuggestions)
  elements.noteTags.addEventListener("blur", () => {
    setTimeout(() => {
      clearTagSuggestions()
    }, 120)
  })

  elements.apiBaseUrl.addEventListener("blur", async () => {
    await saveStorage({ [storageKeys.apiBaseUrl]: normalizeBaseUrl(elements.apiBaseUrl.value) })
  })
}

bootstrap().catch((error) => {
  setStatus(error.message || "Extension failed to initialize.", true)
})
