import { useEffect } from "react"

export function useModal({ isOpen, onClose, lockScroll = true }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow

    if (lockScroll) {
      document.body.style.overflow = "hidden"
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      if (lockScroll) {
        document.body.style.overflow = originalOverflow
      }
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, lockScroll])
}
