import { apiRequest } from "./apiClient"
import avatarMain from "../assets/images/avatar.jpg"
import avatarTwo from "../assets/images/avatar-user2.jpg"
import avatarThree from "../assets/images/avatar-user3.jpg"
import avatarFour from "../assets/images/garden-card-avatar.jpg"

const SHARED_PHOTOS = [avatarMain, avatarTwo, avatarThree, avatarFour]

function shuffle(array) {
  const next = [...array]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temp = next[index]
    next[index] = next[randomIndex]
    next[randomIndex] = temp
  }

  return next
}

const RANDOMIZED_PHOTOS = shuffle(SHARED_PHOTOS)

function toSafeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function hashString(value) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function getPhotoForUser(userId, username) {
  const seed = toSafeText(userId, toSafeText(username, "seed"))
  const hashed = hashString(seed)
  return RANDOMIZED_PHOTOS[hashed % RANDOMIZED_PHOTOS.length]
}

function getGardenState(totalNotes) {
  if (totalNotes >= 20) {
    return "Blooming Garden"
  }

  if (totalNotes >= 10) {
    return "Growing Garden"
  }

  return "Fresh Garden"
}

function getRecentNotePreview(payload) {
  const fallbackTitle = "Recent note"
  const fallbackText = "New ideas are sprouting in this garden."

  const title = toSafeText(payload?.recentNoteTitle, fallbackTitle)
  const text = toSafeText(payload?.recentNoteText, fallbackText)

  return { title, text }
}

export async function fetchExploreGardens({ token, interest } = {}) {
  const query = interest ? `?interest=${encodeURIComponent(interest)}` : ""
  return apiRequest(`/api/gardens/explore${query}`, { token })
}

export async function fetchFollowingUsers(token) {
  if (!token) {
    return []
  }

  return apiRequest("/api/users/me/following", { token })
}

export function mapExploreGarden(payload, { followingUserIds = new Set() } = {}) {
  const userId = payload?.userId
  const userName = toSafeText(payload?.username, "Unknown user")
  const userBio = toSafeText(payload?.bio, "No bio yet.")
  const tags = Array.isArray(payload?.interests) ? payload.interests.slice(0, 5) : []
  const noteCount = Number.isFinite(payload?.publicNotes) ? payload.publicNotes : 0
  const ideasCount = Number.isFinite(payload?.totalNotes) ? payload.totalNotes : noteCount
  const growingCount = Math.max(1, Math.round(ideasCount * 0.35))
  const recent = getRecentNotePreview(payload)
  const avatar = getPhotoForUser(String(userId ?? ""), userName)
  const isFollowing = followingUserIds.has(String(userId ?? ""))

  return {
    id: String(userId),
    userId: String(userId),
    userName,
    userBio,
    avatar,
    tags,
    noteCount,
    gardenState: getGardenState(ideasCount),
    recentNoteTitle: recent.title,
    recentNoteText: recent.text,
    ideasCount,
    growingCount,
    isFollowing,
    lastActive: payload?.lastActive,
  }
}

export function mapPublicGardenToExploreUser(payload, userId) {
  const nextUserId = String(payload?.userId ?? userId ?? "")
  const userName = toSafeText(payload?.username, "Unknown user")
  const userBio = toSafeText(payload?.bio, "No bio yet.")
  const topTags = Array.isArray(payload?.topTags)
    ? payload.topTags
        .map((tag) => toSafeText(tag?.name))
        .filter(Boolean)
        .slice(0, 5)
    : []

  const recentNote = Array.isArray(payload?.recentNotes) ? payload.recentNotes[0] : null
  const recentNoteTitle = toSafeText(recentNote?.title, "Recent note")
  const recentNoteText = toSafeText(recentNote?.content, "New ideas are sprouting in this garden.")
  const ideasCount = Number.isFinite(payload?.totalNotes) ? payload.totalNotes : 0
  const noteCount = Number.isFinite(payload?.publicNotes) ? payload.publicNotes : ideasCount

  return {
    id: nextUserId,
    userId: nextUserId,
    userName,
    userBio,
    avatar: getPhotoForUser(nextUserId, userName),
    tags: topTags,
    noteCount,
    gardenState: getGardenState(ideasCount),
    recentNoteTitle,
    recentNoteText,
    ideasCount,
    growingCount: Math.max(1, Math.round(ideasCount * 0.35)),
    isFollowing: false,
    lastActive: payload?.updatedAt,
  }
}
