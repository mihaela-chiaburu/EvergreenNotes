// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import GardenPage from "./pages/GardenPage"
import ExplorePage from "./pages/ExplorePage"
import GardenCarePage from "./pages/GardenCarePage"
import TrashPage from "./pages/TrashPage"
import UserGarden from "./pages/UserGarden"
import NotePage from "./pages/NotePage"
import HelpPage from "./pages/HelpPage"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { AuthProvider } from "./context/AuthContext"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Garden */}
          <Route path="/" element={
            <LandingPage />
          } />

          <Route path="/landing" element={
            <LandingPage />
          } />

          <Route path="/garden" element={
            <ProtectedRoute>
              <GardenPage />
            </ProtectedRoute>
          } />

          <Route path="/garden/:userId" element={
            <ProtectedRoute>
              <UserGarden />
            </ProtectedRoute>
          } />

          {/* Explore */}
          <Route path="/explore" element={
              <ExplorePage />
          } />

          {/* Garden Care */}
          <Route path="/garden-care" element={
              <ProtectedRoute>
                <GardenCarePage />
              </ProtectedRoute>
          } />

          {/* Note */}
          <Route path="/note" element={
            <ProtectedRoute>
              <NotePage />
            </ProtectedRoute>
          } />

          {/* Trash */}
          <Route path="/trash" element={
              <ProtectedRoute>
                <TrashPage />
              </ProtectedRoute>
          } />

          {/* Help */}
          <Route path="/help" element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          } />

          {/* User 
          <Route path="/user" element={
            <Layout>
              <UserPage />
            </Layout>
          } />*/}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App