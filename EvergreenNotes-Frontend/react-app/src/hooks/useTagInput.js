import { useState } from "react"

export function useTagInput(initialTags = []) {
  const [tags, setTags] = useState(initialTags)
  const [tagInput, setTagInput] = useState("")

  const removeTag = (tagToRemove) => {
    setTags((previousTags) => previousTags.filter((tag) => tag !== tagToRemove))
  }

  const addTag = (rawValue) => {
    const normalizedTag = rawValue.trim()

    if (!normalizedTag) {
      return
    }

    setTags((previousTags) => {
      if (previousTags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
        return previousTags
      }

      return [...previousTags, normalizedTag]
    })
    setTagInput("")
  }

  const handleTagKeyDown = (event) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    addTag(tagInput)
  }

  return {
    tags,
    setTags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagKeyDown,
  }
}
