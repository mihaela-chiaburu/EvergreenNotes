import { useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import "../styles/navbar.css"
import { useDismiss } from "../hooks/useDismiss"
import { useAuth } from "../context/AuthContext"

import sprout from "../assets/images/sprout.png"
import explore from "../assets/images/application (1).png"
import gardenCare from "../assets/images/drop (1).png"
import search from "../assets/images/loupe.png"
import arrow from "../assets/images/arrow-down.png"
import settings from "../assets/images/setting (1).png"
import help from "../assets/images/question.png"
import trash from "../assets/images/trash.png"
import logouticon from "../assets/images/logout.png"
import avatar from "../assets/images/avatar.jpg"

function Navbar({ onOpenSettingsModal }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { authUser, isAuthenticated, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false)
  const [visibility, setVisibility] = useState("Private")

  const userDropdownRef = useRef(null)
  const visibilityDropdownRef = useRef(null)

  useDismiss({ refs: [userDropdownRef], isOpen: isUserMenuOpen, onDismiss: () => setIsUserMenuOpen(false) })
  useDismiss({ refs: [visibilityDropdownRef], isOpen: isVisibilityMenuOpen, onDismiss: () => setIsVisibilityMenuOpen(false) })

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev)
    setIsVisibilityMenuOpen(false)
  }

  const handleToggleVisibilityMenu = () => {
    setIsVisibilityMenuOpen((prev) => !prev)
    setIsUserMenuOpen(false)
  }

  const handleSelectVisibility = (value) => {
    setVisibility(value)
    setIsVisibilityMenuOpen(false)
  }

  const handleOpenSettingsModal = () => {
    onOpenSettingsModal()
    setIsUserMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate("/", { replace: true })
  }

  const getNavTarget = (target) => {
    if (!isAuthenticated) {
      return target
    }

    return target === "/explore" ? "/explore" : "/garden"
  }

  const currentPath = location.pathname.replace(/\/+$/, "") || "/"
  const isGardenSelected = currentPath === "/" || currentPath === "/garden"
  const isExploreSelected = currentPath === "/explore"
  const isGardenCareSelected = currentPath === "/garden-care"
  const searchPlaceholder = isExploreSelected ? "Search users..." : "Search notes..."

  return (
    <nav className="navbar">
      <div className="navbar__links">
        <div className="dropdown dropdown--user" ref={userDropdownRef}>
          <button
            type="button"
            className="navbar__user-button"
            onClick={handleToggleUserMenu}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <img src={avatar} alt="user avatar" className="navbar__profile-image" />
            <p className="navbar__username">{authUser?.username || "User"}</p>
            <img
              src={arrow}
              alt="arrow icon"
              className={`arrow-icon ${isUserMenuOpen ? "arrow-icon--open" : ""}`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="dropdown-menu" role="menu">
              <button
                type="button"
                className="dropdown-menu__item"
                role="menuitem"
                onClick={handleOpenSettingsModal}
              >
                <img src={settings} alt="settings icon" className="navbar__icon"/>
                Settings
              </button>
              <Link to={getNavTarget("/help")} className="dropdown-menu__item" role="menuitem">
              <img src={help} alt="help icon" className="navbar__icon"/>
                Help
              </Link>
              <Link to={getNavTarget("/trash")} className="dropdown-menu__item" role="menuitem">
              <img src={trash} alt="trash icon" className="navbar__icon"/>
                Trash
              </Link>
              <button
                type="button"
                className="dropdown-menu__item"
                role="menuitem"
                onClick={handleLogout}
              >
              <img src={logouticon} alt="log out icon" className="navbar__icon"/>
                Log out
              </button>
            </div>
          )}
        </div>

        <Link to={getNavTarget("/garden")} className={`navbar__link navbar__link--garden${isGardenSelected ? " navbar__link--selected" : ""}`}>
          <img src={sprout} alt="sprout icon" className="navbar__icon"/>
          My Garden
        </Link>

        <Link to={getNavTarget("/explore")} className={`navbar__link navbar__link--explore${isExploreSelected ? " navbar__link--selected" : ""}`}>
          <img src={explore} alt="explore icon" className="navbar__icon"/>
          Explore
        </Link>

        <Link
          to={getNavTarget("/garden-care")}
          className={`navbar__link navbar__link--garden-care${isGardenCareSelected ? " navbar__link--selected" : ""}`}>
          <img src={gardenCare} alt="garden care icon" className="navbar__icon"/>
          Garden Care
        </Link>
      </div>
      <div className="navbar__search-wrapper">
        <div className="navbar__search">
          <img src={search} alt="search icon" className="navbar__search-icon" />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            className="navbar__search-input" 
          />
        </div>
        <div className="dropdown dropdown--visibility" ref={visibilityDropdownRef}>
          <button
            type="button"
            className="navbar__visibility-toggle"
            onClick={handleToggleVisibilityMenu}
            aria-expanded={isVisibilityMenuOpen}
            aria-haspopup="menu"
          >
            <p className="navbar__visibility-label">{visibility}</p>
            <img
              src={arrow}
              alt="arrow icon"
              className={`arrow-icon ${isVisibilityMenuOpen ? "arrow-icon--open" : ""}`}
            />
          </button>

          {isVisibilityMenuOpen && (
            <div className="dropdown-menu dropdown-menu--visibility" role="menu">
              <button
                type="button"
                className="dropdown-menu__item"
                onClick={() => handleSelectVisibility("Private")}
                role="menuitem"
              >
                Private
              </button>
              <button
                type="button"
                className="dropdown-menu__item"
                onClick={() => handleSelectVisibility("Public")}
                role="menuitem"
              >
                Public
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar