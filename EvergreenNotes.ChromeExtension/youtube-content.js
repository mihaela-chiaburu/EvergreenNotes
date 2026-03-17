function extractHashtagsFromText(text) {
  if (!text) {
    return []
  }

  const matches = text.match(/#[\p{L}\p{N}_-]+/gu) || []
  const normalized = matches.map((tag) => tag.slice(1).trim()).filter(Boolean)
  return [...new Set(normalized)]
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
    sourceUrl: location.href,
    hashtags,
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "EXTRACT_YOUTUBE") {
    return false
  }

  sendResponse({ ok: true, payload: extractYouTubeData() })
  return false
})
