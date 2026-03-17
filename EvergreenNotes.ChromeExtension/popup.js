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
  noteContent: document.getElementById("noteContent"),
  saveButton: document.getElementById("saveButton"),
  statusMessage: document.getElementById("statusMessage"),
}

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

function parseTags(rawText) {
  return [...new Set(
    (rawText || "")
      .split(",")
      .map((value) => value.trim().replace(/^#/, ""))
      .filter(Boolean),
  )]
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

async function hydrateFromYouTube() {
  const tab = await getActiveTab()
  if (!tab?.id) {
    return
  }

  const isYoutube = /^https:\/\/(www\.)?youtube\.com\//i.test(tab.url || "")
  if (!isYoutube) {
    setStatus("Open a YouTube video tab for auto-fill.")
    return
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_YOUTUBE" }).catch(() => null)
  if (!response?.ok || !response.payload) {
    setStatus("Could not read video details from this tab.", true)
    return
  }

  elements.noteTitle.value = response.payload.title || ""
  elements.noteSource.value = response.payload.sourceUrl || tab.url || ""
  elements.noteTags.value = (response.payload.hashtags || []).join(", ")
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
        sourceType: sourceUrl ? "youtube" : null,
        sourceThumbnail: null,
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
  await hydrateFromYouTube()

  elements.loginButton.addEventListener("click", login)
  elements.logoutButton.addEventListener("click", async () => {
    await clearToken()
    setStatus("Logged out.")
  })

  elements.saveButton.addEventListener("click", saveNote)

  elements.apiBaseUrl.addEventListener("blur", async () => {
    await saveStorage({ [storageKeys.apiBaseUrl]: normalizeBaseUrl(elements.apiBaseUrl.value) })
  })
}

bootstrap().catch((error) => {
  setStatus(error.message || "Extension failed to initialize.", true)
})
