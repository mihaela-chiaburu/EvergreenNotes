import { useEffect } from "react"

function isInsideAnyRef(eventTarget, refs) {
  return refs.some((ref) => ref?.current && ref.current.contains(eventTarget))
}

export function useDismiss({ refs, isOpen, onDismiss }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!isInsideAnyRef(event.target, refs)) {
        onDismiss()
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onDismiss()
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onDismiss, refs])
}
