// src/components/garden/GardenGraphView.jsx
import { useEffect, useRef } from "react"
import cytoscape from "cytoscape"
import { mockGardenGraph } from "../../data/mockGardenGraph"
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/graph-view.css"

function GardenGraphView() {
  const graphContainerRef = useRef(null)

  useEffect(() => {
    if (!graphContainerRef.current) {
      return undefined
    }

    const cy = cytoscape({
      container: graphContainerRef.current,
      elements: [...mockGardenGraph.nodes, ...mockGardenGraph.edges],
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 600,
        fit: true,
        padding: 40
      },
      wheelSensitivity: 0.6,
      minZoom: 0.4,
      maxZoom: 2.2,
      style: [
        {
          selector: "node",
          style: {
            "background-opacity": 0,
            "background-image": leafSvg,
            "background-fit": "contain",
            "background-clip": "none",
            "background-width": "100%",
            "background-height": "100%",
            label: "data(label)",
            color: "#ffffff",
            "font-size": 15,
            "font-family": "Poppins, Segoe UI, sans-serif",
            "text-wrap": "wrap",
            "text-max-width": 110,
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 18,
            "line-height": 1.2,
            width: 58,
            height: 58
          }
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#93a790",
            "target-arrow-shape": "none",
            "curve-style": "bezier"
          }
        }
      ]
    })

    const handleResize = () => {
      cy.resize()
      cy.fit(undefined, 40)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cy.destroy()
    }
  }, [])

  return (
    <div className="garden-view garden-graph-view" aria-label="Garden graph view">
      <div
        ref={graphContainerRef}
        className="garden-graph-view__canvas"
        aria-label="Knowledge graph"
      />
    </div>
  )
}

export default GardenGraphView