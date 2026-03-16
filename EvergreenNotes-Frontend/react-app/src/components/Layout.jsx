import { useState } from "react"
import Navbar from "./Navbar"
import BackgroundDecor from "./BackgroundDecor"
import SettingsModal from "./modals/SettingsModal"
import "../styles/layout.css"

function Layout({ children }) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true)
  }

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false)
  }

  return (
    <div className="layout">
      <BackgroundDecor />
      <Navbar onOpenSettingsModal={handleOpenSettingsModal} />
      <main className="content">
        {children}
      </main>
      <SettingsModal
      isOpen={isSettingsModalOpen}
      onClose={handleCloseSettingsModal}
      userName="Mihaela"
    />
    </div>
  )
}

export default Layout