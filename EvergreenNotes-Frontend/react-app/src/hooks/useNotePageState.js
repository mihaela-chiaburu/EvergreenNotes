import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getIsoDate, getRandomRecentDateIso } from "../utils/date"
import { useTagInput } from "./useTagInput"

export function useNotePageState() {
  const location = useLocation()
  const navigate = useNavigate()

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const statePayload = location.state ?? {}
  const initialNoteId = statePayload.noteId || queryParams.get("noteId") || null
  const isReadOnly = statePayload.readOnly === true || queryParams.get("readOnly") === "1"
  const gardenUserId = statePayload.gardenUserId || queryParams.get("gardenUserId") || null
  const isGardenReview = statePayload.isGardenReview === true || queryParams.get("review") === "1"
  const reviewQuestion = statePayload.reviewQuestion?.trim() || queryParams.get("reviewQuestion")?.trim() || ""

  const initialTitle = statePayload.noteTitle?.trim() || queryParams.get("title")?.trim() || "Untitled note"
  const initialTagName = statePayload.tagName?.trim() || queryParams.get("tag")?.trim() || "Garden"
  const initialSource = statePayload.source?.trim() || ""

  const fallbackDateIso = getRandomRecentDateIso()
  const initialCreatedOn = getIsoDate(statePayload.createdOn || queryParams.get("createdOn")) || fallbackDateIso
  const initialLastWatered = getIsoDate(statePayload.lastWatered || queryParams.get("lastWatered")) || initialCreatedOn
  const initialTags = Array.isArray(statePayload.tags) && statePayload.tags.length > 0 ? statePayload.tags : [initialTagName]
  const initialContextPathTags = Array.isArray(statePayload.contextPathTags)
    ? statePayload.contextPathTags.map((tag) => tag?.trim()).filter(Boolean)
    : []

  const [title, setTitle] = useState(initialTitle)
  const [source, setSource] = useState(initialSource)
  const [body, setBody] = useState(statePayload.body ?? "")
  const [createdOn, setCreatedOn] = useState(initialCreatedOn)
  const [lastWatered, setLastWatered] = useState(initialLastWatered)
  const [status, setStatus] = useState("Rough")
  const [visibility, setVisibility] = useState("Private")

  const tagState = useTagInput(initialTags)

  const handleTagNavigation = () => {
    const focusStack = Array.isArray(statePayload.focusStack) ? statePayload.focusStack : []
    const gardenPath = gardenUserId ? `/garden/${encodeURIComponent(gardenUserId)}` : "/garden"

    navigate(gardenPath, {
      state: {
        view: "graph",
        focusStack,
        focusTagId: statePayload.focusTagId || null,
      },
    })
  }

  return {
    isReadOnly,
    isGardenReview,
    reviewQuestion,
    noteId: initialNoteId,
    contextPathTags: initialContextPathTags,
    initialTagName,
    title,
    setTitle,
    source,
    setSource,
    body,
    setBody,
    createdOn,
    setCreatedOn,
    lastWatered,
    setLastWatered,
    status,
    setStatus,
    visibility,
    setVisibility,
    handleTagNavigation,
    ...tagState,
  }
}
