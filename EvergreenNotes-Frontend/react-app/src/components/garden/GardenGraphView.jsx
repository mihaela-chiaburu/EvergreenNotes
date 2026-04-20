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
const PHYSICS_AUTO_SETTLE_MS = 1200
const PHYSICS_NODE_BASE_GAP = 18
const PHYSICS_NODE_COLLISION_STRENGTH = 0.06
const PHYSICS_EDGE_CLEARANCE = 20
const PHYSICS_EDGE_REPULSION_STRENGTH = 0.08
const PHYSICS_NOTE_REVEAL_SETTLE_MS = 520
const NOTE_LABEL_FADE_START_ZOOM = 1.2
const NOTE_LABEL_FADE_END_ZOOM = 0.8
const ZOOM_AUTO_REVEAL_THRESHOLD = 0.95
const ORBIT_MAIN_CLEARANCE = 26
const ORBIT_MIN_NODE_SPACING = 34
const ORBIT_NOTES_BASE_RADIUS = 130

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

function getSeedNodeIdSet() {
  const payloadSeeds = Array.isArray(mockGardenGraph.seedNodeIds)
    ? mockGardenGraph.seedNodeIds.filter((seedId) => nodeById.get(seedId)?.type === "tag")
    : []

  if (payloadSeeds.length > 0) {
    return new Set(payloadSeeds)
  }

  return new Set(selectDefaultSeedNodeIds())
}

function getRelatedTagIdsForTag(tagId) {
  if (!tagId || !nodeById.has(tagId)) {
    return new Set()
  }

  const relatedTagIds = new Set([tagId])
  const firstLevelNeighbors = adjacencyByNodeId.get(tagId) || new Set()

  firstLevelNeighbors.forEach((neighborId) => {
    const neighborNode = nodeById.get(neighborId)
    if (neighborNode?.type === "tag") {
      relatedTagIds.add(neighborId)
    }
  })

  return relatedTagIds
}

function getNoteIdsForFocusedTag(tagId) {
  if (!tagId || !nodeById.has(tagId)) {
    return new Set()
  }

  const noteIds = new Set()

  mockGardenGraph.edges.forEach((edge) => {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)

    if (sourceNode?.type === "tag" && sourceNode.id === tagId && targetNode?.type === "note") {
      noteIds.add(targetNode.id)
      return
    }

    if (targetNode?.type === "tag" && targetNode.id === tagId && sourceNode?.type === "note") {
      noteIds.add(sourceNode.id)
    }
  })

  return noteIds
}

function buildInferredTagEdgesForVisibleTags(visibleTagIds) {
  const visibleTagIdList = [...visibleTagIds]
  if (visibleTagIdList.length < 2) {
    return []
  }

  const explicitPairs = new Set()
  mockGardenGraph.edges.forEach((edge) => {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)

    if (sourceNode?.type !== "tag" || targetNode?.type !== "tag") {
      return
    }

    const firstId = sourceNode.id < targetNode.id ? sourceNode.id : targetNode.id
    const secondId = sourceNode.id < targetNode.id ? targetNode.id : sourceNode.id
    explicitPairs.add(`${firstId}|${secondId}`)
  })

  const supportCountByPair = new Map()
  nodeById.forEach((node, nodeId) => {
    if (visibleTagIds.has(nodeId) || node.type === "tag") {
      return
    }

    const neighborTagIds = [...(adjacencyByNodeId.get(nodeId) || new Set())]
      .filter((neighborId) => visibleTagIds.has(neighborId) && nodeById.get(neighborId)?.type === "tag")
      .sort((firstId, secondId) => firstId.localeCompare(secondId))

    for (let index = 0; index < neighborTagIds.length; index += 1) {
      for (let innerIndex = index + 1; innerIndex < neighborTagIds.length; innerIndex += 1) {
        const firstId = neighborTagIds[index]
        const secondId = neighborTagIds[innerIndex]
        const pairKey = `${firstId}|${secondId}`

        if (explicitPairs.has(pairKey)) {
          continue
        }

        supportCountByPair.set(pairKey, (supportCountByPair.get(pairKey) || 0) + 1)
      }
    }
  })

  return [...supportCountByPair.entries()].map(([pairKey, support]) => {
    const [source, target] = pairKey.split("|")
    return {
      source,
      target,
      type: "inferred-tag-tag",
      support,
      inferred: true,
    }
  })
}

function recenterGraphToViewport(cy) {
  const nodes = cy.nodes().toArray()
  if (nodes.length === 0) {
    return
  }

  const viewportCenter = getViewportCenterPosition(cy)
  const centroid = nodes.reduce(
    (accumulator, node) => {
      const position = node.position()
      return {
        x: accumulator.x + position.x,
        y: accumulator.y + position.y,
      }
    },
    { x: 0, y: 0 },
  )

  centroid.x /= nodes.length
  centroid.y /= nodes.length

  const shiftX = viewportCenter.x - centroid.x
  const shiftY = viewportCenter.y - centroid.y

  cy.batch(() => {
    nodes.forEach((node) => {
      const position = node.position()
      node.position({
        x: position.x + shiftX,
        y: position.y + shiftY,
      })
    })
  })
}

function captureNodePositionsById(cy) {
  const positionsById = new Map()

  cy.nodes().forEach((node) => {
    positionsById.set(node.id(), node.position())
  })

  return positionsById
}

function computeOrbitRadius({ count, baseRadius, minSpacing, minimumAllowedRadius }) {
  if (count <= 0) {
    return baseRadius
  }

  const circumferenceFromSpacing = count * minSpacing
  const radiusFromSpacing = circumferenceFromSpacing / (Math.PI * 2)
  return Math.max(baseRadius, minimumAllowedRadius, radiusFromSpacing)
}

function buildElementsForGraph(focusTagId = null, showFocusedTagNotes = false) {
  const seedNodeIdSet = getSeedNodeIdSet()
  const visibleTagIds = seedNodeIdSet
  const isExpandedFocus = Boolean(focusTagId) && showFocusedTagNotes
  const visibleNoteIds = showFocusedTagNotes && focusTagId ? getNoteIdsForFocusedTag(focusTagId) : new Set()
  const inferredCanopyEdges = buildInferredTagEdgesForVisibleTags(visibleTagIds)
  const allRenderableEdges = [...mockGardenGraph.edges, ...inferredCanopyEdges]

  const linkedTagIds = new Set([focusTagId].filter(Boolean))
  if (focusTagId) {
    allRenderableEdges.forEach((edge) => {
      const sourceIsVisibleTag = visibleTagIds.has(edge.source) && nodeById.get(edge.source)?.type === "tag"
      const targetIsVisibleTag = visibleTagIds.has(edge.target) && nodeById.get(edge.target)?.type === "tag"

      if (!sourceIsVisibleTag || !targetIsVisibleTag) {
        return
      }

      if (edge.source === focusTagId) {
        linkedTagIds.add(edge.target)
      }

      if (edge.target === focusTagId) {
        linkedTagIds.add(edge.source)
      }
    })
  }

  const highlightedTagIds = new Set([...linkedTagIds].filter(Boolean))
  const dimmedTagIds = new Set(
    [...visibleTagIds].filter((tagId) => focusTagId && !highlightedTagIds.has(tagId)),
  )
  const hiddenInExpandedTagIds = new Set(
    [...visibleTagIds].filter((tagId) => isExpandedFocus && tagId !== focusTagId),
  )

  const nodes = [...visibleTagIds]
    .map((tagId) => nodeById.get(tagId))
    .filter(Boolean)
    .map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        size: computeNodeSize(node),
        sprite: node.type === "tag" ? getTagNodeSprite(node) : leafSvg,
        depth: seedNodeIdSet.has(node.id) ? 0 : 1,
        highlighted: highlightedTagIds.has(node.id) ? 1 : 0,
        dimmed: dimmedTagIds.has(node.id) ? 1 : 0,
        hiddenInExpanded: hiddenInExpandedTagIds.has(node.id) ? 1 : 0,
      },
    }))

  visibleNoteIds.forEach((noteId) => {
    const noteNode = nodeById.get(noteId)
    if (!noteNode) {
      return
    }

    nodes.push({
      data: {
        id: noteNode.id,
        label: noteNode.label,
        type: noteNode.type,
        size: computeNodeSize(noteNode),
        sprite: leafSvg,
        depth: 2,
        highlighted: focusTagId ? 1 : 0,
        dimmed: 0,
        hiddenInExpanded: 0,
      },
    })
  })

  const visibleNodeIdSet = new Set([...visibleTagIds, ...visibleNoteIds])

  const edgeCounterByKey = new Map()
  const edges = allRenderableEdges
    .filter((edge) => {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)

      if (!sourceNode || !targetNode) {
        return false
      }

      // Render all valid relationships between nodes currently visible in the graph.
      return visibleNodeIdSet.has(sourceNode.id) && visibleNodeIdSet.has(targetNode.id)
    })
    .map((edge) => {
    const edgeType = edge.type || "related"
    const edgeKey = `${edge.source}|${edge.target}|${edgeType}`
    const edgeIndex = edgeCounterByKey.get(edgeKey) || 0
    edgeCounterByKey.set(edgeKey, edgeIndex + 1)

    const sourceNodeType = nodeById.get(edge.source)?.type
    const targetNodeType = nodeById.get(edge.target)?.type

    const edgeIsHighlighted = Boolean(focusTagId) && (
      (sourceNodeType === "tag" && targetNodeType === "tag" && highlightedTagIds.has(edge.source) && highlightedTagIds.has(edge.target)) ||
      (showFocusedTagNotes && sourceNodeType === "tag" && targetNodeType === "note" && edge.source === focusTagId) ||
      (showFocusedTagNotes && sourceNodeType === "note" && targetNodeType === "tag" && edge.target === focusTagId)
    )

    const edgeHiddenInExpanded = isExpandedFocus && (
      hiddenInExpandedTagIds.has(edge.source) || hiddenInExpandedTagIds.has(edge.target)
    )

    return {
      data: {
        id: `edge-${edge.source}-${edge.target}-${edgeType}-${edgeIndex}`,
        source: edge.source,
        target: edge.target,
        type: edgeType,
        inferred: edge.inferred ? 1 : 0,
        support: edge.support || 0,
        highlighted: edgeIsHighlighted ? 1 : 0,
        hiddenInExpanded: edgeHiddenInExpanded ? 1 : 0,
      },
    }
  })

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

function getViewportCenterPosition(cy) {
  const renderedCenter = {
    x: cy.width() / 2,
    y: cy.height() / 2,
  }

  return {
    x: (renderedCenter.x - cy.pan().x) / cy.zoom(),
    y: (renderedCenter.y - cy.pan().y) / cy.zoom(),
  }
}

function getPrimaryTagIdForNote(noteId) {
  const explicitParentEdge = mockGardenGraph.edges.find(
    (edge) => edge.source === noteId && nodeById.get(edge.target)?.type === "tag",
  )

  if (explicitParentEdge) {
    return explicitParentEdge.target
  }

  const reverseParentEdge = mockGardenGraph.edges.find(
    (edge) => edge.target === noteId && nodeById.get(edge.source)?.type === "tag",
  )

  return reverseParentEdge?.source || null
}

function arrangeFocusedNotesAroundTag(cy, focusTagId) {
  if (!focusTagId) {
    return
  }

  const focusedTagNode = cy.getElementById(focusTagId)
  if (focusedTagNode.empty()) {
    return
  }

  const noteIds = [...getNoteIdsForFocusedTag(focusTagId)]
    .filter((noteId) => cy.getElementById(noteId).nonempty())
    .sort((firstId, secondId) => firstId.localeCompare(secondId))

  if (noteIds.length === 0) {
    return
  }

  const tagPosition = focusedTagNode.position()
  const focusedTagRadius = Math.max(20, Number(focusedTagNode.data("size")) / 2 || TAG_NODE_MIN_SIZE / 2)

  const notesRadius = computeOrbitRadius({
    count: noteIds.length,
    baseRadius: ORBIT_NOTES_BASE_RADIUS,
    minSpacing: ORBIT_MIN_NODE_SPACING,
    minimumAllowedRadius: focusedTagRadius + NOTE_NODE_SIZE / 2 + ORBIT_MAIN_CLEARANCE,
  })

  cy.batch(() => {
    const noteAngleStep = (Math.PI * 2) / noteIds.length
    noteIds.forEach((noteId, index) => {
      const noteNode = cy.getElementById(noteId)

      if (noteNode.empty()) {
        return
      }

      const angle = -Math.PI / 2 + index * noteAngleStep
      noteNode.position({
        x: tagPosition.x + Math.cos(angle) * notesRadius,
        y: tagPosition.y + Math.sin(angle) * notesRadius,
      })
    })
  })
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
  const cyRef = useRef(null)
  const focusedNodeIdRef = useRef(null)
  const syncGraphElementsRef = useRef(null)
  const notesVisibleForFocusRef = useRef(false)
  const zoomRevealInFlightRef = useRef(false)
  const velocityByNodeIdRef = useRef(new Map())
  const physicsRafRef = useRef(null)
  const settleTimeoutRef = useRef(null)
  const physicsRunningRef = useRef(false)
  const activeLayoutRef = useRef(null)
  const initialSeedPositionsRef = useRef(new Map())
  const [focusedNodeSummary, setFocusedNodeSummary] = useState(null)
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

        if (focusedNodeIdRef.current && !nodeById.has(focusedNodeIdRef.current)) {
          focusedNodeIdRef.current = null
          notesVisibleForFocusRef.current = false
          setFocusedNodeSummary(null)
        }

        if (typeof syncGraphElementsRef.current === "function") {
          syncGraphElementsRef.current({ shouldFit: false })
        }
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
    focusedNodeIdRef.current = null
    notesVisibleForFocusRef.current = false
    setFocusedNodeSummary(null)

    if (typeof syncGraphElementsRef.current === "function") {
      syncGraphElementsRef.current({ shouldFit: false })
    }
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
      elements: buildElementsForGraph(),
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
          selector: "node[highlighted = 1]",
          style: {
            opacity: 1,
          },
        },
        {
          selector: "node[dimmed = 1]",
          style: {
            opacity: 0.22,
          },
        },
        {
          selector: "node[hiddenInExpanded = 1]",
          style: {
            opacity: 0,
            "text-opacity": 0,
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
          selector: "edge[highlighted = 1]",
          style: {
            width: 2.4,
            opacity: 1,
          },
        },
        {
          selector: "edge[inferred = 1]",
          style: {
            width: 1.2,
            opacity: 0.85,
            "line-style": "solid",
          },
        },
        {
          selector: "edge[hiddenInExpanded = 1]",
          style: {
            opacity: 0,
          },
        },
      ],
    })
    cyRef.current = cy

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
      const radiusByNodeId = new Map(
        nodes.map((node) => [node.id(), Math.max(12, Number(node.data("size")) / 2 || NOTE_NODE_SIZE / 2)]),
      )

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
        const nodeARadius = radiusByNodeId.get(nodeA.id()) || NOTE_NODE_SIZE / 2

        for (let innerIndex = index + 1; innerIndex < nodes.length; innerIndex += 1) {
          const nodeB = nodes[innerIndex]
          const positionB = nodeB.position()
          const deltaX = positionB.x - positionA.x
          const deltaY = positionB.y - positionA.y
          const distance = Math.hypot(deltaX, deltaY)
          const nodeBRadius = radiusByNodeId.get(nodeB.id()) || NOTE_NODE_SIZE / 2
          const minDistance = nodeARadius + nodeBRadius + PHYSICS_NODE_BASE_GAP

          if (distance > 0 && distance < minDistance) {
            const normalizedX = deltaX / distance
            const normalizedY = deltaY / distance
            const overlap = minDistance - distance
            const collisionForce = overlap * PHYSICS_NODE_COLLISION_STRENGTH

            const nodeAForces = forcesByNodeId.get(nodeA.id())
            const nodeBForces = forcesByNodeId.get(nodeB.id())

            nodeAForces.x -= normalizedX * collisionForce
            nodeAForces.y -= normalizedY * collisionForce
            nodeBForces.x += normalizedX * collisionForce
            nodeBForces.y += normalizedY * collisionForce
            continue
          }

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

      edges.forEach((edge) => {
        const sourceNode = edge.source()
        const targetNode = edge.target()
        const sourcePosition = sourceNode.position()
        const targetPosition = targetNode.position()
        const edgeDeltaX = targetPosition.x - sourcePosition.x
        const edgeDeltaY = targetPosition.y - sourcePosition.y
        const edgeLengthSquared = edgeDeltaX * edgeDeltaX + edgeDeltaY * edgeDeltaY

        if (edgeLengthSquared === 0) {
          return
        }

        nodes.forEach((node) => {
          if (node.id() === sourceNode.id() || node.id() === targetNode.id()) {
            return
          }

          const nodePosition = node.position()
          const projectionFactor = Math.max(
            0,
            Math.min(
              1,
              ((nodePosition.x - sourcePosition.x) * edgeDeltaX + (nodePosition.y - sourcePosition.y) * edgeDeltaY) /
                edgeLengthSquared,
            ),
          )
          const closestPoint = {
            x: sourcePosition.x + projectionFactor * edgeDeltaX,
            y: sourcePosition.y + projectionFactor * edgeDeltaY,
          }
          let awayX = nodePosition.x - closestPoint.x
          let awayY = nodePosition.y - closestPoint.y
          let distanceToEdge = Math.hypot(awayX, awayY)

          if (distanceToEdge === 0) {
            const normalX = -edgeDeltaY
            const normalY = edgeDeltaX
            const normalMagnitude = Math.hypot(normalX, normalY) || 1
            awayX = normalX / normalMagnitude
            awayY = normalY / normalMagnitude
            distanceToEdge = 1
          } else {
            awayX /= distanceToEdge
            awayY /= distanceToEdge
          }

          const nodeRadius = radiusByNodeId.get(node.id()) || NOTE_NODE_SIZE / 2
          const minEdgeDistance = nodeRadius + PHYSICS_EDGE_CLEARANCE

          if (distanceToEdge >= minEdgeDistance) {
            return
          }

          const edgeRepulsionForce = (minEdgeDistance - distanceToEdge) * PHYSICS_EDGE_REPULSION_STRENGTH
          const nodeForces = forcesByNodeId.get(node.id())
          const sourceForces = forcesByNodeId.get(sourceNode.id())
          const targetForces = forcesByNodeId.get(targetNode.id())

          nodeForces.x += awayX * edgeRepulsionForce
          nodeForces.y += awayY * edgeRepulsionForce

          const edgeBackForce = edgeRepulsionForce * 0.25
          sourceForces.x -= awayX * edgeBackForce
          sourceForces.y -= awayY * edgeBackForce
          targetForces.x -= awayX * edgeBackForce
          targetForces.y -= awayY * edgeBackForce
        })
      })

      cy.batch(() => {
        nodes.forEach((node) => {
          const nodeId = node.id()
          const forces = forcesByNodeId.get(nodeId)
          const nodeType = node.data("type")
          const nodeIsHighlighted = node.data("highlighted") === 1

          if (notesVisibleForFocusRef.current && nodeType === "tag" && nodeIsHighlighted) {
            velocityByNodeIdRef.current.set(nodeId, { x: 0, y: 0 })
            return
          }

          if (notesVisibleForFocusRef.current && nodeType === "tag" && !nodeIsHighlighted) {
            forces.x *= 0.42
            forces.y *= 0.42
          }

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

    const schedulePhysicsStop = (delayMs = PHYSICS_SETTLE_MS) => {
      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current)
      }

      settleTimeoutRef.current = setTimeout(() => {
        settleTimeoutRef.current = null
        stopPhysicsLoop()
      }, delayMs)
    }

    const updateNoteLabelOpacity = () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      const opacity = computeNoteLabelOpacity(cy.zoom())
      cy.nodes('node[type = "note"]').style("text-opacity", opacity)
    }

    const rerenderFocusGraph = ({ shouldFit = false } = {}) => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      const [nextNodes, nextEdges] = buildElementsForGraph(
        focusedNodeIdRef.current,
        Boolean(focusedNodeIdRef.current) && notesVisibleForFocusRef.current,
      ).reduce(
        (accumulator, element) => {
          if (element.data.source && element.data.target) {
            accumulator[1].push(element)
          } else {
            accumulator[0].push(element)
          }

          return accumulator
        },
        [[], []],
      )

      const nextNodeIds = new Set(nextNodes.map((nodeElement) => nodeElement.data.id))
      const nextEdgeIds = new Set(nextEdges.map((edgeElement) => edgeElement.data.id))
      const viewportZoom = cy.zoom()
      const viewportPan = cy.pan()
      const previousPositionsByNodeId = captureNodePositionsById(cy)

      stopActiveLayout()
      stopPhysicsLoop()
      clearVelocities()

      cy.batch(() => {
        cy.edges().forEach((edge) => {
          if (!nextEdgeIds.has(edge.id())) {
            edge.remove()
          }
        })

        cy.nodes().forEach((node) => {
          if (!nextNodeIds.has(node.id())) {
            node.remove()
          }
        })

        nextNodes.forEach((nodeElement) => {
          const existingNode = cy.getElementById(nodeElement.data.id)

          if (existingNode.nonempty()) {
            existingNode.data(nodeElement.data)
            return
          }

          cy.add(nodeElement)

          const addedNode = cy.getElementById(nodeElement.data.id)
          const viewportCenter = getViewportCenterPosition(cy)
          const parentTagId = nodeElement.data.type === "note" ? getPrimaryTagIdForNote(nodeElement.data.id) : null
          const parentTagNode = parentTagId ? cy.getElementById(parentTagId) : null
          const spawnCenter = parentTagNode && parentTagNode.nonempty() ? parentTagNode.position() : viewportCenter
          addedNode.position({
            x: spawnCenter.x + (Math.random() - 0.5) * 90,
            y: spawnCenter.y + (Math.random() - 0.5) * 90,
          })
        })

        nextEdges.forEach((edgeElement) => {
          const existingEdge = cy.getElementById(edgeElement.data.id)

          if (existingEdge.nonempty()) {
            existingEdge.data(edgeElement.data)
            return
          }

          cy.add(edgeElement)
        })

        cy.nodes().forEach((node) => {
          const previousPosition = previousPositionsByNodeId.get(node.id())
          if (!previousPosition) {
            return
          }

          node.position(previousPosition)
        })
      })

      if (shouldFit) {
        const layout = cy.layout({
          name: "cose",
          animate: true,
          animationDuration: 420,
          fit: true,
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

          arrangeFocusedNotesAroundTag(
            cy,
            Boolean(focusedNodeIdRef.current) && notesVisibleForFocusRef.current ? focusedNodeIdRef.current : null,
          )
          startPhysicsLoop()
          schedulePhysicsStop(PHYSICS_AUTO_SETTLE_MS)
          updateNoteLabelOpacity()
        })
        layout.run()
        return
      }

      cy.zoom(viewportZoom)
      cy.pan(viewportPan)

      const hasFocusNotesVisible = Boolean(focusedNodeIdRef.current) && notesVisibleForFocusRef.current
      arrangeFocusedNotesAroundTag(
        cy,
        hasFocusNotesVisible ? focusedNodeIdRef.current : null,
      )

      if (!hasFocusNotesVisible) {
        stopPhysicsLoop()

        if (!focusedNodeIdRef.current && initialSeedPositionsRef.current.size > 0) {
          cy.nodes().forEach((node) => {
            const targetPosition = initialSeedPositionsRef.current.get(node.id())
            if (!targetPosition) {
              return
            }

            node.animate({
              position: targetPosition,
              duration: 260,
              easing: "ease-out-cubic",
            })
          })
        }

        updateNoteLabelOpacity()
        return
      }

      stopPhysicsLoop()
      updateNoteLabelOpacity()
    }

    syncGraphElementsRef.current = rerenderFocusGraph

    const handleResize = () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      cy.resize()
      updateNoteLabelOpacity()
    }

    cy.on("grab", "node", () => {
      startPhysicsLoop()
    })

    cy.on("drag", "node", () => {
      startPhysicsLoop()
    })

    cy.on("zoom", updateNoteLabelOpacity)

    cy.on("zoom", () => {
      if (
        !focusedNodeIdRef.current ||
        notesVisibleForFocusRef.current ||
        zoomRevealInFlightRef.current ||
        cy.zoom() < ZOOM_AUTO_REVEAL_THRESHOLD
      ) {
        return
      }

      zoomRevealInFlightRef.current = true
      notesVisibleForFocusRef.current = true
      rerenderFocusGraph({ shouldFit: false })
      zoomRevealInFlightRef.current = false
    })

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

      const previousFocusedNodeId = focusedNodeIdRef.current

      if (previousFocusedNodeId === nodeData.id) {
        focusedNodeIdRef.current = nodeData.id
        notesVisibleForFocusRef.current = !notesVisibleForFocusRef.current
      } else {
        focusedNodeIdRef.current = nodeData.id
        notesVisibleForFocusRef.current = false
      }

      setFocusedNodeSummary(
        focusedNodeIdRef.current
          ? {
              id: nodeData.id,
              label: nodeData.label,
              type: nodeData.type,
            }
          : null,
      )

      rerenderFocusGraph({ shouldFit: false })
    })

    window.addEventListener("resize", handleResize)

    cy.one("layoutstop", () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      const seedNodeIds = getSeedNodeIdSet()
      initialSeedPositionsRef.current = new Map()
      seedNodeIds.forEach((seedId) => {
        const seedNode = cy.getElementById(seedId)
        if (seedNode.nonempty()) {
          initialSeedPositionsRef.current.set(seedId, seedNode.position())
        }
      })

      arrangeFocusedNotesAroundTag(
        cy,
        Boolean(focusedNodeIdRef.current) && notesVisibleForFocusRef.current ? focusedNodeIdRef.current : null,
      )
      startPhysicsLoop()
      schedulePhysicsStop(PHYSICS_AUTO_SETTLE_MS)
      updateNoteLabelOpacity()
    })

    updateNoteLabelOpacity()

    return () => {
      isCyDestroyed = true
      syncGraphElementsRef.current = null
      cyRef.current = null
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
  }, [initialFocusPathLabels, initialFocusStack, isReadOnly, navigate])

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
