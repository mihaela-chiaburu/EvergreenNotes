// src/components/garden/GardenGraphView.jsx
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import cytoscape from "cytoscape"
import { mockGardenGraph } from "../../data/mockGardenGraph"
import leafSvg from "../../assets/images/leaf.svg"
import { useAuth } from "../../context/AuthContext"
import { fetchGardenGraph } from "../../utils/garden"
import "../../styles/components/garden/graph-view.css"

const NOTE_NODE_SIZE = 38
const TAG_NODE_MIN_SIZE = 52
const TAG_NODE_MAX_SIZE = 88
const GRAPH_EDGE_LENGTH = 100
const GRAPH_NODE_REPULSION = 5000
const PHYSICS_SPRING_STRENGTH = 0.0038
const PHYSICS_REPULSION_RADIUS = 120
const PHYSICS_REPULSION_STRENGTH = 0.0142
const PHYSICS_DAMPING = 0.86
const PHYSICS_MAX_SPEED = 8
const PHYSICS_SETTLE_MS = 260

let nodeById = new Map(mockGardenGraph.nodes.map((node) => [node.id, node]))

let parentById = mockGardenGraph.nodes.reduce((accumulator, node) => {
  node.children.forEach((childId) => {
    accumulator[childId] = node.id
  })

  return accumulator
}, {})

function rebuildGraphIndexes() {
  nodeById = new Map(mockGardenGraph.nodes.map((node) => [node.id, node]))
  parentById = mockGardenGraph.nodes.reduce((accumulator, node) => {
    node.children.forEach((childId) => {
      accumulator[childId] = node.id
    })

    return accumulator
  }, {})
}

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

  const addEdgeIfMissing = (sourceId, targetId, kind = "explicit") => {
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
        target,
        kind
      }
    })
  }

  ;[...visibleNodeIds].forEach((nodeId) => {
    const parentId = parentById[nodeId]

    if (!parentId || !visibleNodeIds.has(parentId)) {
      return
    }

    addEdgeIfMissing(parentId, nodeId, "explicit")
  })

  mockGardenGraph.edges.forEach((edge) => {
    if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) {
      return
    }

    addEdgeIfMissing(edge.source, edge.target, "explicit")
  })

  // Infer higher-level links: if two visible tags point to the same lower node,
  // connect those higher tags with a lightweight inferred edge.
  const visibleTagNodes = [...visibleNodeIds]
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node) => node?.type === "tag")

  for (let firstIndex = 0; firstIndex < visibleTagNodes.length; firstIndex += 1) {
    const firstTag = visibleTagNodes[firstIndex]

    for (let secondIndex = firstIndex + 1; secondIndex < visibleTagNodes.length; secondIndex += 1) {
      const secondTag = visibleTagNodes[secondIndex]

      if (!firstTag || !secondTag) {
        continue
      }

      const isDirectParentChild = parentById[firstTag.id] === secondTag.id || parentById[secondTag.id] === firstTag.id
      if (isDirectParentChild) {
        continue
      }

      const sharedVisibleChild = firstTag.children.some((childId) => secondTag.children.includes(childId))

      if (sharedVisibleChild) {
        addEdgeIfMissing(firstTag.id, secondTag.id, "inferred")
      }
    }
  }

  return [...nodes, ...edgeMap.values()]
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
  const { authUser } = useAuth()
  const graphContainerRef = useRef(null)
  const focusStackRef = useRef([])
  const rerenderFocusGraphRef = useRef(null)
  const velocityByNodeIdRef = useRef(new Map())
  const physicsRafRef = useRef(null)
  const settleTimeoutRef = useRef(null)
  const physicsRunningRef = useRef(false)
  const [focusPath, setFocusPath] = useState([])
  const [graphVersion, setGraphVersion] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const loadGraph = async () => {
      if (!authUser?.token) {
        return
      }

      try {
        const payload = await fetchGardenGraph(authUser.token)
        if (!isMounted || !payload?.nodes || !payload?.edges || !payload?.rootNodeIds) {
          return
        }

        mockGardenGraph.rootNodeIds = payload.rootNodeIds
        mockGardenGraph.nodes = payload.nodes
        mockGardenGraph.edges = payload.edges
        rebuildGraphIndexes()
        setGraphVersion((currentVersion) => currentVersion + 1)
      } catch {
        // Keep mock fallback if graph API fails.
      }
    }

    loadGraph()

    return () => {
      isMounted = false
    }
  }, [authUser?.token])

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
        idealEdgeLength: GRAPH_EDGE_LENGTH,
        nodeRepulsion: GRAPH_NODE_REPULSION,
        gravity: 0.08,
        padding: 40
      },
      wheelSensitivity: 0.6,
      minZoom: 0.25,
      maxZoom: 1.2,
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
        },
        {
          selector: 'edge[kind = "inferred"]',
          style: {
            width: 1.5,
            "line-style": "solid",
            "line-color": "#c7d2be",
            opacity: 0.65
          }
        }
      ]
    })

    const clearVelocities = () => {
      velocityByNodeIdRef.current = new Map()
    }

    const stopPhysicsLoop = () => {
      physicsRunningRef.current = false

      if (physicsRafRef.current !== null) {
        cancelAnimationFrame(physicsRafRef.current)
        physicsRafRef.current = null
      }
    }

    const runPhysicsStep = () => {
      if (!physicsRunningRef.current) {
        return
      }

      const nodes = cy.nodes().toArray()
      const edges = cy.edges().toArray()
      const forcesByNodeId = new Map(nodes.map((node) => [node.id(), { x: 0, y: 0 }]))

      edges.forEach((edge) => {
        const sourceNode = edge.source()
        const targetNode = edge.target()
        const sourcePosition = sourceNode.position()
        const targetPosition = targetNode.position()
        const deltaX = targetPosition.x - sourcePosition.x
        const deltaY = targetPosition.y - sourcePosition.y
        const distance = Math.max(1, Math.hypot(deltaX, deltaY))
        const normalizedX = deltaX / distance
        const normalizedY = deltaY / distance
        const stretch = distance - GRAPH_EDGE_LENGTH
        const springForce = stretch * PHYSICS_SPRING_STRENGTH

        const sourceForces = forcesByNodeId.get(sourceNode.id())
        const targetForces = forcesByNodeId.get(targetNode.id())

        sourceForces.x += normalizedX * springForce
        sourceForces.y += normalizedY * springForce
        targetForces.x -= normalizedX * springForce
        targetForces.y -= normalizedY * springForce
      })

      for (let index = 0; index < nodes.length; index += 1) {
        const nodeA = nodes[index]
        const positionA = nodeA.position()

        for (let innerIndex = index + 1; innerIndex < nodes.length; innerIndex += 1) {
          const nodeB = nodes[innerIndex]
          const positionB = nodeB.position()
          const deltaX = positionB.x - positionA.x
          const deltaY = positionB.y - positionA.y
          const distance = Math.hypot(deltaX, deltaY)

          if (distance === 0 || distance > PHYSICS_REPULSION_RADIUS) {
            continue
          }

          const normalizedX = deltaX / distance
          const normalizedY = deltaY / distance
          const repulsionForce = (PHYSICS_REPULSION_RADIUS - distance) * PHYSICS_REPULSION_STRENGTH

          const nodeAForces = forcesByNodeId.get(nodeA.id())
          const nodeBForces = forcesByNodeId.get(nodeB.id())

          nodeAForces.x -= normalizedX * repulsionForce
          nodeAForces.y -= normalizedY * repulsionForce
          nodeBForces.x += normalizedX * repulsionForce
          nodeBForces.y += normalizedY * repulsionForce
        }
      }

      cy.batch(() => {
        nodes.forEach((node) => {
          const nodeId = node.id()
          const forces = forcesByNodeId.get(nodeId)

          if (node.grabbed()) {
            velocityByNodeIdRef.current.set(nodeId, { x: 0, y: 0 })
            return
          }

          const previousVelocity = velocityByNodeIdRef.current.get(nodeId) || { x: 0, y: 0 }
          let velocityX = (previousVelocity.x + forces.x) * PHYSICS_DAMPING
          let velocityY = (previousVelocity.y + forces.y) * PHYSICS_DAMPING
          const velocityMagnitude = Math.hypot(velocityX, velocityY)

          if (velocityMagnitude > PHYSICS_MAX_SPEED) {
            const clampScale = PHYSICS_MAX_SPEED / velocityMagnitude
            velocityX *= clampScale
            velocityY *= clampScale
          }

          velocityByNodeIdRef.current.set(nodeId, { x: velocityX, y: velocityY })

          const position = node.position()
          node.position({
            x: position.x + velocityX,
            y: position.y + velocityY
          })
        })
      })

      physicsRafRef.current = requestAnimationFrame(runPhysicsStep)
    }

    const startPhysicsLoop = () => {
      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current)
        settleTimeoutRef.current = null
      }

      if (physicsRunningRef.current) {
        return
      }

      physicsRunningRef.current = true
      physicsRafRef.current = requestAnimationFrame(runPhysicsStep)
    }

    const schedulePhysicsStop = () => {
      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current)
      }

      settleTimeoutRef.current = setTimeout(() => {
        settleTimeoutRef.current = null
        stopPhysicsLoop()
      }, PHYSICS_SETTLE_MS)
    }

    const rerenderFocusGraph = ({ shouldFit = true } = {}) => {
      const nextElements = buildElementsForFocus(focusStackRef.current)

      stopPhysicsLoop()
      clearVelocities()

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
        idealEdgeLength: GRAPH_EDGE_LENGTH,
        nodeRepulsion: GRAPH_NODE_REPULSION,
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

    cy.on("grab", "node", () => {
      startPhysicsLoop()
    })

    cy.on("drag", "node", () => {
      startPhysicsLoop()
    })

    cy.on("free", "node", (event) => {
      const hasGrabbedNodes = cy.nodes().some((node) => node.grabbed())

      if (hasGrabbedNodes) {
        return
      }

      schedulePhysicsStop()
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
      stopPhysicsLoop()

      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current)
        settleTimeoutRef.current = null
      }

      window.removeEventListener("resize", handleResize)
      cy.destroy()
    }
  }, [graphVersion, initialFocusStack, navigate])

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