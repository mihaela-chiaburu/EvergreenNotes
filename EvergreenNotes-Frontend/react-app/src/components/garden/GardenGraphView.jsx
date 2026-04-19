import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import cytoscape from "cytoscape"
import { mockGardenGraph } from "../../data/mockGardenGraph"
import leafSvg from "../../assets/images/leaf.svg"
import sproutttt from "../../assets/images/sproutttt.png"
import noteFlowerMedium2 from "../../assets/images/note-flower-medium2.png"
import noteTreeBig1 from "../../assets/images/note-tree-big1.png"
import { useAuth } from "../../context/AuthContext"
import { fetchGardenGraph, fetchPublicGardenGraph } from "../../utils/garden"
import "../../styles/components/garden/graph-view.css"

const NOTE_NODE_SIZE = 30
const TAG_NODE_MIN_SIZE = 60
const TAG_NODE_MAX_SIZE = 104
const GRAPH_EDGE_LENGTH = 105
const GRAPH_NODE_REPULSION = 5200
const PHYSICS_SPRING_STRENGTH = 0.0038
const PHYSICS_REPULSION_RADIUS = 120
const PHYSICS_REPULSION_STRENGTH = 0.0142
const PHYSICS_DAMPING = 0.86
const PHYSICS_MAX_SPEED = 8
const PHYSICS_SETTLE_MS = 260
const NOTE_LABEL_FADE_START_ZOOM = 1.2
const NOTE_LABEL_FADE_END_ZOOM = 0.8

let nodeById = new Map()
let adjacencyByNodeId = new Map()
let nodesSortedByConnectivity = []

function rebuildGraphIndexes() {
  nodeById = new Map(mockGardenGraph.nodes.map((node) => [node.id, node]))
  adjacencyByNodeId = new Map(mockGardenGraph.nodes.map((node) => [node.id, new Set()]))

  mockGardenGraph.edges.forEach((edge) => {
    if (!adjacencyByNodeId.has(edge.source) || !adjacencyByNodeId.has(edge.target)) {
      return
    }

    adjacencyByNodeId.get(edge.source).add(edge.target)
    adjacencyByNodeId.get(edge.target).add(edge.source)
  })

  nodesSortedByConnectivity = [...mockGardenGraph.nodes].sort((firstNode, secondNode) => {
    const firstDegree = adjacencyByNodeId.get(firstNode.id)?.size || firstNode.connectionCount || 0
    const secondDegree = adjacencyByNodeId.get(secondNode.id)?.size || secondNode.connectionCount || 0

    if (secondDegree !== firstDegree) {
      return secondDegree - firstDegree
    }

    if (firstNode.type !== secondNode.type) {
      return firstNode.type === "tag" ? -1 : 1
    }

    return firstNode.label.localeCompare(secondNode.label)
  })
}

rebuildGraphIndexes()

function getNodeConnectionCount(nodeId) {
  const adjacencyCount = adjacencyByNodeId.get(nodeId)?.size || 0
  const node = nodeById.get(nodeId)
  return Math.max(adjacencyCount, node?.connectionCount || 0)
}

function computeNodeSize(node) {
  if (node.type === "note") {
    return NOTE_NODE_SIZE
  }

  const boundedConnectionCount = Math.max(1, Math.min(getNodeConnectionCount(node.id), 18))
  const ratio = (boundedConnectionCount - 1) / 17
  return TAG_NODE_MIN_SIZE + ratio * (TAG_NODE_MAX_SIZE - TAG_NODE_MIN_SIZE)
}

function getTagNodeSprite(node) {
  const linkedNotesCount = Number(node.noteCount) || 0

  if (linkedNotesCount > 10) {
    return noteTreeBig1
  }

  if (linkedNotesCount >= 1) {
    return noteFlowerMedium2
  }

  return sproutttt
}

function selectDefaultSeedNodeIds() {
  const payloadSeeds = Array.isArray(mockGardenGraph.seedNodeIds)
    ? mockGardenGraph.seedNodeIds.filter((nodeId) => nodeById.has(nodeId))
    : []

  if (payloadSeeds.length > 0) {
    return payloadSeeds
  }

  return nodesSortedByConnectivity.slice(0, 18).map((node) => node.id)
}

function getNeighborhoodDepthByNodeId(focusNodeId) {
  if (!focusNodeId || !nodeById.has(focusNodeId)) {
    const defaultDepthByNodeId = new Map()

    selectDefaultSeedNodeIds().forEach((seedId) => {
      defaultDepthByNodeId.set(seedId, 0)

      const seedNeighbors = adjacencyByNodeId.get(seedId) || new Set()
      seedNeighbors.forEach((neighborId) => {
        if (!defaultDepthByNodeId.has(neighborId)) {
          defaultDepthByNodeId.set(neighborId, 1)
        }
      })
    })

    return defaultDepthByNodeId
  }

  const depthByNodeId = new Map([[focusNodeId, 0]])
  const firstLevelNeighbors = adjacencyByNodeId.get(focusNodeId) || new Set()

  firstLevelNeighbors.forEach((neighborId) => {
    depthByNodeId.set(neighborId, 1)
  })

  firstLevelNeighbors.forEach((neighborId) => {
    const secondLevelNeighbors = adjacencyByNodeId.get(neighborId) || new Set()
    secondLevelNeighbors.forEach((secondLevelId) => {
      if (depthByNodeId.has(secondLevelId)) {
        return
      }

      depthByNodeId.set(secondLevelId, 2)
    })
  })

  return depthByNodeId
}

function buildElementsForFocus(focusNodeId) {
  const depthByNodeId = getNeighborhoodDepthByNodeId(focusNodeId)
  const visibleNodeIds = new Set(depthByNodeId.keys())

  const nodes = [...visibleNodeIds]
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        size: computeNodeSize(node),
        sprite: node.type === "tag" ? getTagNodeSprite(node) : leafSvg,
        depth: depthByNodeId.get(node.id) ?? 2,
      },
    }))

  const edges = mockGardenGraph.edges
    .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map((edge, index) => ({
      data: {
        id: `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || "related",
        depth: Math.max(depthByNodeId.get(edge.source) ?? 2, depthByNodeId.get(edge.target) ?? 2),
      },
    }))

  return [...nodes, ...edges]
}

function resolveInitialFocusNodeId(initialFocusStack = [], initialFocusPathLabels = []) {
  const fromStack = Array.isArray(initialFocusStack)
    ? initialFocusStack.filter((nodeId) => nodeById.has(nodeId))
    : []

  if (fromStack.length > 0) {
    return fromStack[fromStack.length - 1]
  }

  const labels = Array.isArray(initialFocusPathLabels)
    ? initialFocusPathLabels.map((label) => label?.trim()).filter(Boolean)
    : []

  if (labels.length === 0) {
    return null
  }

  const desiredLabel = labels[labels.length - 1]
  const matchedNode = [...nodeById.values()].find((node) => node.label.toLowerCase() === desiredLabel.toLowerCase())
  return matchedNode?.id || null
}

function computeNoteLabelOpacity(zoomLevel) {
  if (zoomLevel >= NOTE_LABEL_FADE_START_ZOOM) {
    return 1
  }

  if (zoomLevel <= NOTE_LABEL_FADE_END_ZOOM) {
    return 0
  }

  return (zoomLevel - NOTE_LABEL_FADE_END_ZOOM) / (NOTE_LABEL_FADE_START_ZOOM - NOTE_LABEL_FADE_END_ZOOM)
}

function GardenGraphView({
  initialFocusStack = [],
  initialFocusPathLabels = [],
  onFocusPathChange,
  refreshTick = 0,
  userId = null,
  isReadOnly = false,
}) {
  const { authUser } = useAuth()
  const graphContainerRef = useRef(null)
  const focusedNodeIdRef = useRef(null)
  const rerenderFocusGraphRef = useRef(null)
  const velocityByNodeIdRef = useRef(new Map())
  const physicsRafRef = useRef(null)
  const settleTimeoutRef = useRef(null)
  const physicsRunningRef = useRef(false)
  const activeLayoutRef = useRef(null)
  const [focusedNodeSummary, setFocusedNodeSummary] = useState(null)
  const [graphVersion, setGraphVersion] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof onFocusPathChange !== "function") {
      return
    }

    if (!focusedNodeSummary) {
      onFocusPathChange([])
      return
    }

    onFocusPathChange([focusedNodeSummary.label])
  }, [focusedNodeSummary, onFocusPathChange])

  useEffect(() => {
    let isMounted = true

    const loadGraph = async () => {
      if (!authUser?.token) {
        return
      }

      try {
        const payload = userId
          ? await fetchPublicGardenGraph(userId, authUser.token)
          : await fetchGardenGraph(authUser.token)
        if (!isMounted || !payload?.nodes || !payload?.edges || !payload?.seedNodeIds) {
          return
        }

        mockGardenGraph.seedNodeIds = payload.seedNodeIds
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
  }, [authUser?.token, refreshTick, userId])

  const handleResetFocus = () => {
    if (!rerenderFocusGraphRef.current) {
      return
    }

    focusedNodeIdRef.current = null
    setFocusedNodeSummary(null)
    rerenderFocusGraphRef.current({ shouldFit: true })
  }

  useEffect(() => {
    if (!graphContainerRef.current) {
      return undefined
    }

    let isCyDestroyed = false

    const initialFocusNodeId = resolveInitialFocusNodeId(initialFocusStack, initialFocusPathLabels)
    focusedNodeIdRef.current = initialFocusNodeId

    if (initialFocusNodeId && nodeById.has(initialFocusNodeId)) {
      const initialNode = nodeById.get(initialFocusNodeId)
      setFocusedNodeSummary({ id: initialNode.id, label: initialNode.label, type: initialNode.type })
    } else {
      setFocusedNodeSummary(null)
    }

    const cy = cytoscape({
      container: graphContainerRef.current,
      elements: buildElementsForFocus(focusedNodeIdRef.current),
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 500,
        fit: true,
        randomize: true,
        idealEdgeLength: GRAPH_EDGE_LENGTH,
        nodeRepulsion: GRAPH_NODE_REPULSION,
        gravity: 0.08,
        padding: 40,
      },
      wheelSensitivity: 0.6,
      minZoom: 0.25,
      maxZoom: 1.2,
      style: [
        {
          selector: "node",
          style: {
            "background-opacity": 0,
            "background-image": "data(sprite)",
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
            opacity: 1,
            "transition-property": "width height opacity",
            "transition-duration": "120ms",
          },
        },
        {
          selector: 'node[type = "note"]',
          style: {
            "text-max-width": 90,
            "font-size": 13,
            "text-margin-y": 16,
          },
        },
        {
          selector: "node[depth = 2]",
          style: {
            opacity: 0.44,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#93a790",
            "target-arrow-shape": "none",
            "curve-style": "bezier",
            opacity: 0.85,
          },
        },
        {
          selector: "edge[depth = 2]",
          style: {
            width: 1.5,
            opacity: 0.42,
          },
        },
      ],
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

    const stopActiveLayout = () => {
      if (activeLayoutRef.current) {
        activeLayoutRef.current.stop()
        activeLayoutRef.current = null
      }
    }

    const runPhysicsStep = () => {
      if (!physicsRunningRef.current || isCyDestroyed || cy.destroyed()) {
        physicsRunningRef.current = false
        physicsRafRef.current = null
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
            y: position.y + velocityY,
          })
        })
      })

      if (!isCyDestroyed && !cy.destroyed() && physicsRunningRef.current) {
        physicsRafRef.current = requestAnimationFrame(runPhysicsStep)
      } else {
        physicsRunningRef.current = false
        physicsRafRef.current = null
      }
    }

    const startPhysicsLoop = () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

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

    const updateNoteLabelOpacity = () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      const opacity = computeNoteLabelOpacity(cy.zoom())
      cy.nodes('node[type = "note"]').style("text-opacity", opacity)
    }

    const rerenderFocusGraph = ({ shouldFit = true } = {}) => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      const nextElements = buildElementsForFocus(focusedNodeIdRef.current)

      stopActiveLayout()
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
        padding: 40,
      })

      activeLayoutRef.current = layout
      cy.one("layoutstop", () => {
        if (activeLayoutRef.current === layout) {
          activeLayoutRef.current = null
        }

        updateNoteLabelOpacity()
      })
      layout.run()
    }

    rerenderFocusGraphRef.current = rerenderFocusGraph

    const handleResize = () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      cy.resize()
      cy.fit(undefined, 40)
    }

    cy.on("grab", "node", () => {
      startPhysicsLoop()
    })

    cy.on("drag", "node", () => {
      startPhysicsLoop()
    })

    cy.on("zoom", updateNoteLabelOpacity)

    cy.on("free", "node", () => {
      const hasGrabbedNodes = cy.nodes().some((node) => node.grabbed())
      if (hasGrabbedNodes) {
        return
      }

      schedulePhysicsStop()
    })

    cy.on("tap", "node", (event) => {
      const nodeData = event.target.data()

      if (nodeData.type === "note") {
        const noteId = nodeData.id?.startsWith("note-") ? nodeData.id.slice(5) : null
        const neighborIds = [...(adjacencyByNodeId.get(nodeData.id) || new Set())]
        const connectedTags = neighborIds
          .map((neighborId) => nodeById.get(neighborId))
          .filter((neighborNode) => neighborNode?.type === "tag")
        const fallbackTagName = connectedTags[0]?.label || "Garden"

        navigate(
          `/note${noteId ? `?noteId=${encodeURIComponent(noteId)}` : `?title=${encodeURIComponent(nodeData.label || "Untitled note")}&tag=${encodeURIComponent(fallbackTagName)}`}${isReadOnly ? "&readOnly=1" : ""}`,
          {
            state: {
              noteId,
              noteTitle: nodeData.label || "Untitled note",
              tagName: fallbackTagName,
              readOnly: isReadOnly,
              focusStack: focusedNodeIdRef.current ? [focusedNodeIdRef.current] : [],
              focusTagId: focusedNodeIdRef.current,
              tags: connectedTags.map((tagNode) => tagNode.label),
            },
          },
        )
        return
      }

      focusedNodeIdRef.current = focusedNodeIdRef.current === nodeData.id ? null : nodeData.id
      setFocusedNodeSummary(
        focusedNodeIdRef.current
          ? {
              id: nodeData.id,
              label: nodeData.label,
              type: nodeData.type,
            }
          : null,
      )
      rerenderFocusGraph({ shouldFit: true })
    })

    window.addEventListener("resize", handleResize)
    updateNoteLabelOpacity()

    return () => {
      isCyDestroyed = true
      rerenderFocusGraphRef.current = null
      stopActiveLayout()
      stopPhysicsLoop()

      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current)
        settleTimeoutRef.current = null
      }

      window.removeEventListener("resize", handleResize)
      cy.removeListener("zoom", updateNoteLabelOpacity)
      cy.destroy()
    }
  }, [graphVersion, initialFocusPathLabels, initialFocusStack, isReadOnly, navigate])

  return (
    <div className="garden-view garden-graph-view" aria-label="Garden graph view">
      {focusedNodeSummary ? (
        <div className="garden-graph-view__breadcrumb" role="navigation" aria-label="Graph focus">
          <button
            type="button"
            className="garden-graph-view__breadcrumb-link garden-graph-view__breadcrumb-link--inactive"
            onClick={handleResetFocus}
          >
            Show Seeds
          </button>
          <span className="garden-graph-view__breadcrumb-separator" aria-hidden="true">/</span>
          <span className="garden-graph-view__breadcrumb-link garden-graph-view__breadcrumb-link--active">
            {focusedNodeSummary.label}
          </span>
        </div>
      ) : null}
      <div
        ref={graphContainerRef}
        className="garden-graph-view__canvas"
        aria-label="Knowledge graph"
      />
    </div>
  )
}

export default GardenGraphView
