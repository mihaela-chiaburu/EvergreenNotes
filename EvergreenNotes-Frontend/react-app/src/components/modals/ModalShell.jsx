import { useModal } from "../../hooks/useModal"

function ModalShell({
  isOpen,
  onClose,
  overlayClassName,
  className,
  labelledBy,
  children,
}) {
  useModal({ isOpen, onClose })

  if (!isOpen) {
    return null
  }

  return (
    <div className={overlayClassName} onClick={onClose}>
      <div
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export default ModalShell
