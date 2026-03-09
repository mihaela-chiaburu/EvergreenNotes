import Navbar from "./Navbar"

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="content">
        {children}
      </main>
    </div>
  )
}

export default Layout