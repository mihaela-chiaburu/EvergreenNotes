// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import GardenPage from "./pages/GardenPage"
import ExplorePage from "./pages/ExplorePage"
import GardenCarePage from "./pages/GardenCarePage"
import TrashPage from "./pages/TrashPage"
import UserGarden from "./pages/UserGarden"

function App() {
  return (
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
          <GardenPage />
        } />

        <Route path="/garden/:userId" element={
          <UserGarden />
        } />

        {/* Explore */}
        <Route path="/explore" element={
            <ExplorePage />
        } />

        {/* Garden Care */}
        <Route path="/garden-care" element={
            <GardenCarePage />
        } />
        {/* Trash */}
        <Route path="/trash" element={
            <TrashPage />
        } />

        {/* User 
        <Route path="/user" element={
          <Layout>
            <UserPage />
          </Layout>
        } />*/}
      </Routes>
    </BrowserRouter>
  )
}

export default App