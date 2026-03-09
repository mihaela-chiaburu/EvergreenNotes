// src/components/Navbar.jsx
import { Link } from "react-router-dom"
import "../styles/navbar.css" // vei crea acest fișier pentru stiluri

function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="logo">EvergreenNotes</h1>
      <div className="nav-links">
        <Link to="/">Explore</Link>
        <Link to="/garden">Garden</Link>
        <Link to="/trash">Trash</Link>
        <Link to="/user">User</Link>
      </div>
    </nav>
  )
}

export default Navbar