import { apiRequest } from "./apiClient"
import { getIsoDate } from "./date"

function titleCase(value) {
  if (!value) {
    return ""
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toDeletedOn(value) {
  if (!value) {
    return ""
  }

  const deletedDate = new Date(value)
  if (Number.isNaN(deletedDate.getTime())) {
    return ""
  }

  const day = String(deletedDate.getDate()).padStart(2, "0")
  const month = String(deletedDate.getMonth() + 1).padStart(2, "0")
  const year = String(deletedDate.getFullYear())

  return `${day}.${month}.${year}`
}

export function mapNoteToViewModel(note) {
  const tags = Array.isArray(note.tags) ? note.tags : []

  return {
    id: note.id,
    title: note.title,
    text: note.content,
    body: note.content,
    tags,
    source: note.sourceUrl || note.sourceType || "",
    date: getIsoDate(note.createdAt),
    createdOn: getIsoDate(note.createdAt),
    deletedOn: toDeletedOn(note.deletedAt),
    deletedAt: note.deletedAt || null,
    lastWatered: getIsoDate(note.lastWateredAt),
    status: titleCase(note.status),
    visibility: titleCase(note.visibility),
    plantState: titleCase(note.plantState),
    daysSinceWatered: note.daysSinceWatered ?? 0,
  }
}

export async function fetchNotes(token) {
  const payload = await apiRequest("/api/notes?page=1&pageSize=100", {
    token,
  })

  return Array.isArray(payload) ? payload.map(mapNoteToViewModel) : []
}

export async function fetchPublicUserNotes(userId, token) {
  const payload = await apiRequest(`/api/notes/users/${encodeURIComponent(userId)}/public?page=1&pageSize=100`, {
    token,
  })

  return Array.isArray(payload) ? payload.map(mapNoteToViewModel) : []
}

export async function fetchNoteById(token, noteId) {
  const payload = await apiRequest(`/api/notes/${noteId}`, {
    token,
  })

  return mapNoteToViewModel(payload)
}

export async function createNote(token, { title, body, source }) {
  const payload = await apiRequest("/api/notes", {
    method: "POST",
    token,
    body: {
      title,
      content: body,
      sourceUrl: source || null,
      sourceType: source || null,
      sourceThumbnail: null,
    },
  })

  return mapNoteToViewModel(payload)
}

export async function updateNote(token, noteId, { title, body }) {
  const payload = await apiRequest(`/api/notes/${noteId}`, {
    method: "PUT",
    token,
    body: {
      title,
      content: body,
    },
  })

  return mapNoteToViewModel(payload)
}

export async function deleteNote(token, noteId) {
  await apiRequest(`/api/notes/${noteId}`, {
    method: "DELETE",
    token,
  })
}

export async function fetchDeletedNotes(token) {
  const payload = await apiRequest("/api/notes/trash?page=1&pageSize=100", {
    token,
  })

  return Array.isArray(payload) ? payload.map(mapNoteToViewModel) : []
}

export async function restoreDeletedNote(token, noteId) {
  const payload = await apiRequest(`/api/notes/${noteId}/restore`, {
    method: "POST",
    token,
  })

  return mapNoteToViewModel(payload)
}

export async function permanentlyDeleteNote(token, noteId) {
  await apiRequest(`/api/notes/${noteId}/permanent`, {
    method: "DELETE",
    token,
  })
}

export async function emptyTrash(token) {
  await apiRequest("/api/notes/trash", {
    method: "DELETE",
    token,
  })
}

export async function updateNoteStatus(token, noteId, status) {
  const normalizedStatus = status.toLowerCase() === "polished" ? 1 : 0

  const payload = await apiRequest(`/api/notes/${noteId}/status`, {
    method: "PUT",
    token,
    body: {
      status: normalizedStatus,
    },
  })

  return mapNoteToViewModel(payload)
}

export async function updateNoteVisibility(token, noteId, visibility) {
  const normalizedVisibility = visibility.toLowerCase() === "public" ? 1 : 0

  const payload = await apiRequest(`/api/notes/${noteId}/visibility`, {
    method: "PUT",
    token,
    body: {
      visibility: normalizedVisibility,
    },
  })

  return mapNoteToViewModel(payload)
}

export async function waterNote(token, noteId) {
  const payload = await apiRequest(`/api/notes/${noteId}/water`, {
    method: "POST",
    token,
  })

  return mapNoteToViewModel(payload)
}

export async function replaceNoteTags(token, noteId, tags) {
  await apiRequest(`/api/notes/${noteId}/tags`, {
    method: "PUT",
    token,
    body: {
      tagNames: tags,
    },
  })
}
