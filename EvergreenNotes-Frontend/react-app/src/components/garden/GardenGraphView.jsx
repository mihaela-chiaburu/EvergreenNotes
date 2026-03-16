// src/components/garden/GardenGraphView.jsx
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import cytoscape from "cytoscape"
import { mockGardenGraph } from "../../data/mockGardenGraph"
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/graph-view.css"

const NOTE_NODE_SIZE = 38
const TAG_NODE_MIN_SIZE = 52
const TAG_NODE_MAX_SIZE = 88

const nodeById = new Map(mockGardenGraph.nodes.map((node) => [node.id, node]))

const parentById = mockGardenGraph.nodes.reduce((accumulator, node) => {
  node.children.forEach((childId) => {
    accumulator[childId] = node.id
  })

  return accumulator
}, {})

function computeNodeSize(node) {
  if (node.type === "note") {
    return NOTE_NODE_SIZE
  }

  const boundedNoteCount = Math.max(1, Math.min(node.noteCount || 1, 24))
  const ratio = (boundedNoteCount - 1) / 23

  return TAG_NODE_MIN_SIZE + ratio * (TAG_NODE_MAX_SIZE - TAG_NODE_MIN_SIZE)
}

function buildVisibleNodeIds(focusStack) {
  if (!focusStack.length) {
    return new Set(mockGardenGraph.rootNodeIds)
  }

  const focusedNodeId = focusStack[focusStack.length - 1]
  const focusedNode = nodeById.get(focusedNodeId)
  const visibleNodeIds = new Set([focusedNodeId])

  if (!focusedNode) {
    return visibleNodeIds
  }

  focusedNode.children.forEach((childId) => visibleNodeIds.add(childId))

  mockGardenGraph.edges.forEach((edge) => {
    if (edge.source === focusedNodeId) {
      visibleNodeIds.add(edge.target)
    }

    if (edge.target === focusedNodeId) {
      visibleNodeIds.add(edge.source)
    }
  })

  return visibleNodeIds
}

function buildElementsForFocus(focusStack) {
  const visibleNodeIds = buildVisibleNodeIds(focusStack)

  const nodes = [...visibleNodeIds]
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        size: computeNodeSize(node),
        hasChildren: node.children.length > 0
      }
    }))

  const edgeMap = new Map()

  const addEdgeIfMissing = (sourceId, targetId) => {
    const source = sourceId < targetId ? sourceId : targetId
    const target = sourceId < targetId ? targetId : sourceId
    const edgeKey = `${source}__${target}`

    if (edgeMap.has(edgeKey)) {
      return
    }

    edgeMap.set(edgeKey, {
      data: {
        id: `edge-${edgeKey}`,
        source,
        target
      }
    })
  }

  ;[...visibleNodeIds].forEach((nodeId) => {
    const parentId = parentById[nodeId]

    if (!parentId || !visibleNodeIds.has(parentId)) {
      return
    }

    addEdgeIfMissing(parentId, nodeId)
  })

  mockGardenGraph.edges.forEach((edge) => {
    if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) {
      return
    }

    addEdgeIfMissing(edge.source, edge.target)
  })

  return [...nodes, ...edgeMap.values()]
}

function applyNeighborPull(node, deltaX, deltaY) {
  const clampedDeltaMagnitude = 16
  const deltaMagnitude = Math.hypot(deltaX, deltaY)
  const clampedDeltaScale = deltaMagnitude > clampedDeltaMagnitude ? clampedDeltaMagnitude / deltaMagnitude : 1
  const smoothDeltaX = deltaX * clampedDeltaScale
  const smoothDeltaY = deltaY * clampedDeltaScale

  const firstHopNeighbors = node.neighborhood("node")
  const movedSecondHopNodeIds = new Set()

  firstHopNeighbors.forEach((neighbor) => {
    if (neighbor.grabbed()) {
      return
    }

    const neighborPosition = neighbor.position()
    neighbor.position({
      x: neighborPosition.x + smoothDeltaX * 0.3,
      y: neighborPosition.y + smoothDeltaY * 0.3
    })
  })

  firstHopNeighbors.forEach((neighbor) => {
    neighbor.neighborhood("node").forEach((secondHopNeighbor) => {
      if (
        secondHopNeighbor.id() === node.id() ||
        secondHopNeighbor.grabbed() ||
        movedSecondHopNodeIds.has(secondHopNeighbor.id())
      ) {
        return
      }

      movedSecondHopNodeIds.add(secondHopNeighbor.id())

      const position = secondHopNeighbor.position()
      secondHopNeighbor.position({
        x: position.x + smoothDeltaX * 0.14,
        y: position.y + smoothDeltaY * 0.14
      })
    })
  })
}

function applyLocalRepulsion(cy, movedNode) {
  const movedPosition = movedNode.position()
  const minimumDistance = 100

  cy.nodes().forEach((node) => {
    if (node.id() === movedNode.id() || node.grabbed()) {
      return
    }

    const nodePosition = node.position()
    const deltaX = nodePosition.x - movedPosition.x
    const deltaY = nodePosition.y - movedPosition.y
    const distance = Math.hypot(deltaX, deltaY)

    if (distance >= minimumDistance || distance === 0) {
      return
    }

    const pushDistance = minimumDistance - distance
    const normalizedX = deltaX / distance
    const normalizedY = deltaY / distance

    node.position({
      x: nodePosition.x + normalizedX * pushDistance * 0.18,
      y: nodePosition.y + normalizedY * pushDistance * 0.18
    })
  })
}

function sanitizeFocusStack(candidateFocusStack) {
  if (!Array.isArray(candidateFocusStack)) {
    return []
  }

  const normalizedStack = []

  candidateFocusStack.forEach((nodeId) => {
    if (!nodeById.has(nodeId)) {
      return
    }

    const existingIndex = normalizedStack.indexOf(nodeId)

    // Stop looping paths like A/B/A by trimming back to the first A.
    if (existingIndex >= 0) {
      normalizedStack.splice(existingIndex + 1)
      return
    }

    normalizedStack.push(nodeId)
  })

  return normalizedStack
}

function buildFocusPath(focusStack) {
  return focusStack
    .map((nodeId) => {
      const node = nodeById.get(nodeId)

      if (!node) {
        return null
      }

      return {
        id: node.id,
        label: node.label
      }
    })
    .filter(Boolean)
}

function GardenGraphView({ initialFocusStack = [] }) {
  const graphContainerRef = useRef(null)
  const focusStackRef = useRef([])
  const rerenderFocusGraphRef = useRef(null)
  const lastDragPositionRef = useRef({})
  const [focusPath, setFocusPath] = useState([])
  const navigate = useNavigate()

  const handleRootPathClick = () => {
    if (!rerenderFocusGraphRef.current) {
      return
    }

    focusStackRef.current = []
    setFocusPath([])
    rerenderFocusGraphRef.current({ shouldFit: true })
  }

  const handlePathNodeClick = (pathIndex) => {
    if (!rerenderFocusGraphRef.current) {
      return
    }

    focusStackRef.current = focusStackRef.current.slice(0, pathIndex + 1)
    setFocusPath(buildFocusPath(focusStackRef.current))
    rerenderFocusGraphRef.current({ shouldFit: true })
  }

  useEffect(() => {
    if (!graphContainerRef.current) {
      return undefined
    }

    focusStackRef.current = sanitizeFocusStack(initialFocusStack)
    setFocusPath(buildFocusPath(focusStackRef.current))

    const cy = cytoscape({
      container: graphContainerRef.current,
      elements: buildElementsForFocus(focusStackRef.current),
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 500,
        fit: true,
        randomize: true,
        idealEdgeLength: 150,
        nodeRepulsion: 6200,
        gravity: 0.08,
        padding: 40
      },
      wheelSensitivity: 0.6,
      minZoom: 0.25,
      maxZoom: 1.7,
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
            width: "data(size)",
            height: "data(size)",
            "transition-property": "width height",
            "transition-duration": "120ms"
          }
        },
        {
          selector: 'node[type = "note"]',
          style: {
            "text-max-width": 90,
            "font-size": 13,
            "text-margin-y": 16
          }
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#93a790",
            "target-arrow-shape": "none",
            "curve-style": "bezier",
            opacity: 0.85
          }
        }
      ]
    })

    const rerenderFocusGraph = ({ shouldFit = true } = {}) => {
      const nextElements = buildElementsForFocus(focusStackRef.current)

      cy.batch(() => {
        cy.elements().remove()
        cy.add(nextElements)
      })

      const layout = cy.layout({
        name: "cose",
        animate: true,
        animationDuration: 420,
        fit: shouldFit,
        randomize: true,
        idealEdgeLength: 150,
        nodeRepulsion: 6200,
        gravity: 0.08,
        padding: 40
      })

      layout.run()
    }

    rerenderFocusGraphRef.current = rerenderFocusGraph

    const handleResize = () => {
      cy.resize()
      cy.fit(undefined, 40)
    }

    cy.on("grab", "node", (event) => {
      const node = event.target
      lastDragPositionRef.current[node.id()] = node.position()
    })

    cy.on("drag", "node", (event) => {
      const node = event.target
      const previousPosition = lastDragPositionRef.current[node.id()] || node.position()
      const currentPosition = node.position()
      const deltaX = currentPosition.x - previousPosition.x
      const deltaY = currentPosition.y - previousPosition.y

      if (deltaX === 0 && deltaY === 0) {
        return
      }

      cy.startBatch()
      applyNeighborPull(node, deltaX, deltaY)
      applyLocalRepulsion(cy, node)
      cy.endBatch()

      lastDragPositionRef.current[node.id()] = currentPosition
    })

    cy.on("free", "node", (event) => {
      const node = event.target
      delete lastDragPositionRef.current[node.id()]
    })

    cy.on("tap", "node", (event) => {
      const nodeData = event.target.data()
      const hasChildren = Boolean(nodeData.hasChildren)

      if (hasChildren) {
        const existingFocusIndex = focusStackRef.current.indexOf(nodeData.id)

        if (existingFocusIndex >= 0) {
          focusStackRef.current = focusStackRef.current.slice(0, existingFocusIndex + 1)
        } else {
          focusStackRef.current = [...focusStackRef.current, nodeData.id]
        }

        setFocusPath(buildFocusPath(focusStackRef.current))
        rerenderFocusGraph({ shouldFit: true })
        return
      }

      const noteTitle = nodeData.label || "Untitled note"
      const focusedTagId = focusStackRef.current[focusStackRef.current.length - 1]
      const focusedTagNode = focusedTagId ? nodeById.get(focusedTagId) : undefined
      const fallbackTagName = focusedTagNode?.label || nodeData.label || "Garden"

      navigate(
        `/note?title=${encodeURIComponent(noteTitle)}&tag=${encodeURIComponent(fallbackTagName)}`,
        {
          state: {
            noteTitle,
            tagName: fallbackTagName,
            focusStack: [...focusStackRef.current],
            focusTagId: focusedTagId,
            tags: [fallbackTagName]
          }
        }
      )
    })

    window.addEventListener("resize", handleResize)

    return () => {
      rerenderFocusGraphRef.current = null
      window.removeEventListener("resize", handleResize)
      cy.destroy()
    }
  }, [initialFocusStack, navigate])

  return (
    <div className="garden-view garden-graph-view" aria-label="Garden graph view">
      {focusPath.length > 0 && (
        <div className="garden-graph-view__breadcrumb" role="navigation" aria-label="Graph path">
          <button
            type="button"
            className="garden-graph-view__breadcrumb-link garden-graph-view__breadcrumb-link--inactive"
            onClick={handleRootPathClick}
          >
            My Garden
          </button>
          <span className="garden-graph-view__breadcrumb-separator" aria-hidden="true">/</span>
          {focusPath.map((pathNode, index) => (
            <div key={pathNode.id} className="garden-graph-view__breadcrumb-item">
              <button
                type="button"
                className={`garden-graph-view__breadcrumb-link ${
                  index === focusPath.length - 1
                    ? "garden-graph-view__breadcrumb-link--active"
                    : "garden-graph-view__breadcrumb-link--inactive"
                }`}
                onClick={() => handlePathNodeClick(index)}
              >
                {pathNode.label}
              </button>
              {index < focusPath.length - 1 && (
                <span className="garden-graph-view__breadcrumb-separator" aria-hidden="true">/</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div
        ref={graphContainerRef}
        className="garden-graph-view__canvas"
        aria-label="Knowledge graph"
      />
    </div>
  )
}

export default GardenGraphView