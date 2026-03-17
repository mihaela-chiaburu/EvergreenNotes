import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import FilterPanel from "../components/explore/FilterPanel"
import ExploreSection from "../components/explore/ExploreSection"
import LoginModal from "../components/modals/LoginModal"
import RegisterModal from "../components/modals/RegisterModal"
import { useAuth } from "../context/AuthContext"
import logo from "../assets/images/logo.png"
import exploreIcon from "../assets/images/application (1).png"
import sproutIcon from "../assets/images/sprout.png"
import "../styles/pages/explore.css"
import "../styles/pages/landing.css"

function ExplorePage() {
  const navigate = useNavigate()
  const { isAuthenticated, establishSession, logout } = useAuth()
  const [authModal, setAuthModal] = useState(null)

  const handleOpenLogin = () => {
    setAuthModal("login")
  }

  const handleOpenRegister = () => {
    setAuthModal("register")
  }

  const handleCloseAuthModal = () => {
    setAuthModal(null)
  }

  const handleSwitchToRegister = () => {
    setAuthModal("register")
  }

  const handleSwitchToLogin = () => {
    setAuthModal("login")
  }

  const handleLogout = () => {
    logout()
    setAuthModal(null)
    navigate("/", { replace: true })
  }

  const handleAuthSuccess = async (auth) => {
    const isSessionReady = await establishSession(auth)
    if (isSessionReady) {
      navigate("/garden")
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <nav className="landing-navbar">
          <Link className="landing-navbar__item landing-navbar__item--brand" to="/">
            <img className="landing-navbar__brand-logo" src={logo} alt="evergreen logo" />
            <p className="landing-navbar__brand-name">EvergreenNotes</p>
          </Link>
          <Link className="landing-navbar__item landing-navbar__item--explore" to="/explore">
            <img className="landing-navbar__icon" src={exploreIcon} alt="explore icon" />
            <p className="landing-navbar__label">Explore</p>
          </Link>
          <button
            type="button"
            className="landing-navbar__item landing-navbar__item--new-seed"
            onClick={handleOpenRegister}
          >
            <img className="landing-navbar__icon" src={sproutIcon} alt="sprout icon" />
            <p className="landing-navbar__label">New Seed</p>
          </button>
          <button
            type="button"
            className="landing-navbar__item landing-navbar__item--login"
            onClick={isAuthenticated ? handleLogout : handleOpenLogin}
          >
            <p className="landing-navbar__label">{isAuthenticated ? "Log out" : "Log In"}</p>
          </button>
        </nav>

        <div className="explore-page">
          <FilterPanel />
          <ExploreSection isPublicView />
        </div>

        <LoginModal
          isOpen={authModal === "login"}
          onClose={handleCloseAuthModal}
          onSwitchToRegister={handleSwitchToRegister}
          onAuthSuccess={handleAuthSuccess}
        />

        <RegisterModal
          isOpen={authModal === "register"}
          onClose={handleCloseAuthModal}
          onSwitchToLogin={handleSwitchToLogin}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    )
  }

  return (
    <Layout>
      <div className="explore-page">
        <FilterPanel />
        <ExploreSection />
      </div>
    </Layout>
  )
}

export default ExplorePage