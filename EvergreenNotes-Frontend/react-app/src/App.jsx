// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import GardenPage from "./pages/GardenPage"
import ExplorePage from "./pages/ExplorePage"
import GardenCarePage from "./pages/GardenCarePage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Garden */}
        <Route path="/" element={
          <GardenPage />
        } />

        <Route path="/garden" element={
          <GardenPage />
        } />

        {/* Explore */}
        <Route path="/explore" element={
            <ExplorePage />
        } />

        {/* Garden Care */}
        <Route path="/garden-care" element={
            <GardenCarePage />
        } />
        {/* Trash 
        <Route path="/trash" element={
          <Layout>
            <TrashPage />
          </Layout>
        } />*/}

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