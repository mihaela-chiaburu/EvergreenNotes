import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import "../styles/navbar.css"

import sprout from "../assets/images/sprout.png"
import explore from "../assets/images/application (1).png"
import gardenCare from "../assets/images/drop (1).png"
import search from "../assets/images/loupe.png"
import arrow from "../assets/images/arrow-down.png"
import settings from "../assets/images/setting (1).png"
import help from "../assets/images/question.png"
import trash from "../assets/images/trash.png"
import logout from "../assets/images/logout.png"
import avatar from "../assets/images/avatar.jpg"

function Navbar() {
  const location = useLocation()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false)
  const [visibility, setVisibility] = useState("Private")

  const userDropdownRef = useRef(null)
  const visibilityDropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }

      if (
        visibilityDropdownRef.current &&
        !visibilityDropdownRef.current.contains(event.target)
      ) {
        setIsVisibilityMenuOpen(false)
      }
    }

    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false)
        setIsVisibilityMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [])

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

  const currentPath = location.pathname.replace(/\/+$/, "") || "/"
  const isGardenSelected = currentPath === "/" || currentPath === "/garden"
  const isExploreSelected = currentPath === "/explore"
  const isGardenCareSelected = currentPath === "/garden-care"

  return (
    <nav className="navbar">
      <div className="nav-links">
        <div className="dropdown dropdown--user" ref={userDropdownRef}>
          <button
            type="button"
            className="user"
            onClick={handleToggleUserMenu}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <img src={avatar} alt="user avatar" className="profile-image" />
            <p className="username">Mihaela</p>
            <img
              src={arrow}
              alt="arrow icon"
              className={`arrow-icon ${isUserMenuOpen ? "arrow-icon--open" : ""}`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="dropdown-menu" role="menu">
              <Link to="/settings" className="dropdown-menu__item" role="menuitem">
                <img src={settings} alt="settings icon" className="icons-navbar"/>
                Settings
              </Link>
              <Link to="/help" className="dropdown-menu__item" role="menuitem">
              <img src={help} alt="settings icon" className="icons-navbar"/>
                Help
              </Link>
              <Link to="/trash" className="dropdown-menu__item" role="menuitem">
              <img src={trash} alt="settings icon" className="icons-navbar"/>
                Trash
              </Link>
              <Link to="/login" className="dropdown-menu__item" role="menuitem">
              <img src={logout} alt="settings icon" className="icons-navbar"/>
                Log out
              </Link>
            </div>
          )}
        </div>

        <Link to="/garden" className={`garden${isGardenSelected ? " garden--selected" : ""}`}>
          <img src={sprout} alt="sprout icon" className="icons-navbar"/>
          My Garden
        </Link>

        <Link to="/explore" className={`explore${isExploreSelected ? " explore--selected" : ""}`}>
          <img src={explore} alt="explore icon" className="icons-navbar"/>
          Explore
        </Link>

        <Link
          to="/garden-care"
          className={`garden-care${isGardenCareSelected ? " garden-care--selected" : ""}`}>
          <img src={gardenCare} alt="garden care icon" className="icons-navbar"/>
          Garden Care
        </Link>
      </div>
      <div className="search-wrapper">
        <div className="search search-notes">
          <img src={search} alt="search icon" className="search-icon" />
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="search-input" 
          />
        </div>
        <div className="dropdown dropdown--visibility" ref={visibilityDropdownRef}>
          <button
            type="button"
            className="visibility-togle"
            onClick={handleToggleVisibilityMenu}
            aria-expanded={isVisibilityMenuOpen}
            aria-haspopup="menu"
          >
            <p className="visibility--private">{visibility}</p>
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