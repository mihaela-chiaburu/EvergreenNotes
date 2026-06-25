function extractHashtagsFromText(text) {
  if (!text) {
    return []
  }

  const matches = text.match(/#[\p{L}\p{N}_-]+/gu) || []
  const normalized = matches.map((tag) => tag.slice(1).trim()).filter(Boolean)
  return [...new Set(normalized)]
}

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim()
}

function limitSnippet(text, maxLength = 600) {
  const trimmed = normalizeWhitespace(text)
  if (trimmed.length <= maxLength) {
    return trimmed
  }

  const slice = trimmed.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(" ")
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxLength)}...`
}

function getMetaContent(selector) {
  return document.querySelector(selector)?.getAttribute("content")?.trim() || ""
}

function getCanonicalUrl() {
  return document.querySelector("link[rel='canonical']")?.getAttribute("href")?.trim() || ""
}

function extractKeywords() {
  const raw = getMetaContent("meta[name='keywords']")
  if (!raw) {
    return []
  }

  return raw
    .split(",")
    .map((value) => value.trim().replace(/^#/, ""))
    .filter(Boolean)
}

function extractArticleText() {
  const candidates = [
    document.querySelector("article"),
    document.querySelector("main"),
    document.querySelector("[role='main']"),
  ].filter(Boolean)

  if (!candidates.length) {
    return ""
  }

  const text = candidates.map((node) => node.textContent || "").join(" ")
  return limitSnippet(text)
}

function getSourceType() {
  const host = location.hostname.toLowerCase()

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return "youtube"
  }

  if (host.includes("tiktok.com")) {
    return "tiktok"
  }

  if (host.includes("instagram.com")) {
    return "instagram"
  }

  return "article"
}

function extractYouTubeData() {
  const title = document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim()
    || document.querySelector("meta[name='title']")?.getAttribute("content")
    || document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim()

  const descriptionMeta = document.querySelector("meta[name='description']")?.getAttribute("content") || ""
  const hashtags = [...new Set([
    ...extractHashtagsFromText(title || ""),
    ...extractHashtagsFromText(descriptionMeta),
  ])]

  return {
    title: title || "",
    contentSnippet: limitSnippet(descriptionMeta),
    hashtags,
  }
}

function extractSocialMetaData() {
  const title = getMetaContent("meta[property='og:title']")
    || getMetaContent("meta[name='twitter:title']")
    || getMetaContent("meta[name='title']")
    || document.querySelector("h1")?.textContent?.trim()
    || document.title

  const description = getMetaContent("meta[property='og:description']")
    || getMetaContent("meta[name='twitter:description']")
    || getMetaContent("meta[name='description']")

  return {
    title: normalizeWhitespace(title || ""),
    description: normalizeWhitespace(description || ""),
  }
}

function extractTikTokVideoUrl() {
  const ogUrl = getMetaContent("meta[property='og:url']")
  if (ogUrl) {
    return ogUrl
  }

  const canonical = getCanonicalUrl()
  if (canonical) {
    return canonical
  }

  if (location.href.includes("/video/")) {
    return location.href
  }

  const anchor = document.querySelector("a[href*='/video/'][href*='tiktok.com']")
  if (anchor?.href) {
    return anchor.href
  }

  return location.href
}

function extractTikTokData() {
  const { title, description } = extractSocialMetaData()
  const hashtags = [...new Set([
    ...extractHashtagsFromText(`${title} ${description}`),
  ])]

  return {
    title,
    contentSnippet: limitSnippet(description),
    hashtags,
    sourceUrl: extractTikTokVideoUrl(),
  }
}

function extractContext() {
  const sourceType = getSourceType()
  let sourceUrl = getCanonicalUrl() || location.href
  const sourceThumbnail = getMetaContent("meta[property='og:image']")
    || getMetaContent("meta[name='twitter:image']")

  let title = ""
  let contentSnippet = ""
  let hashtags = []

  if (sourceType === "youtube") {
    const youtube = extractYouTubeData()
    title = youtube.title
    contentSnippet = youtube.contentSnippet
    hashtags = youtube.hashtags
  } else if (sourceType === "tiktok") {
    const tiktok = extractTikTokData()
    title = tiktok.title
    contentSnippet = tiktok.contentSnippet
    hashtags = tiktok.hashtags
    sourceUrl = tiktok.sourceUrl
  } else {
    const { title: metaTitle, description } = extractSocialMetaData()
    title = metaTitle
    contentSnippet = sourceType === "article" ? extractArticleText() : limitSnippet(description)
    const keywords = extractKeywords()
    hashtags = [...new Set([
      ...extractHashtagsFromText(`${metaTitle} ${description}`),
      ...keywords,
    ])]
  }

  return {
    title: title || "",
    sourceUrl,
    sourceType,
    sourceThumbnail: sourceThumbnail || null,
    hashtags,
    contentSnippet: contentSnippet || "",
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "EXTRACT_CONTEXT") {
    return false
  }

  sendResponse({ ok: true, payload: extractContext() })
  return false
})
