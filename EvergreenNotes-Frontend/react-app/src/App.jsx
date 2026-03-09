// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import GardenPage from "./pages/GardenPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Explore 
        <Route path="/" element={
          <Layout>
            <ExplorePage />
          </Layout>
        } />*/}

        {/* Garden */}
        <Route path="/" element={
          <GardenPage />
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