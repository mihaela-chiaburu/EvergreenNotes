import { useState } from "react"
import Navbar from "./Navbar"
import BackgroundDecor from "./BackgroundDecor"
import SettingsModal from "./modals/SettingsModal"
import "../styles/layout.css"
import { useAuth } from "../context/AuthContext"

function Layout({ children }) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const { authUser, updateProfile } = useAuth()

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true)
  }

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false)
  }

  const handleSaveProfile = (updates) => {
    updateProfile(updates)
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
      userName={authUser?.username || "User"}
      userEmail={authUser?.email || ""}
      userBio={authUser?.bio || ""}
      userAvatar={authUser?.avatarUrl || ""}
      onSaveProfile={handleSaveProfile}
    />
    </div>
  )
}

export default Layout