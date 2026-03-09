// src/components/garden/GraphSettingsPanel.jsx
function GraphSettingsPanel({ setView }) {
  return (
    <div className="graph-settings">
      <button onClick={() => setView("graph")}>Graph View</button>
      <button onClick={() => setView("list")}>List View</button>
      {/* Aici vei adăuga filtre, setări, toggle-uri etc */}
    </div>
  )
}

export default GraphSettingsPanel