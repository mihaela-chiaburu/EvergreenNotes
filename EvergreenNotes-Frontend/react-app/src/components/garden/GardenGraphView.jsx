import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import cytoscape from "cytoscape"
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force"
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
const D3_ALPHA_INITIAL = 0.78
const D3_ALPHA_REHEAT = 0.42
const D3_ALPHA_DECAY = 0.028
const D3_ALPHA_MIN = 0.004
const D3_VELOCITY_DECAY = 0.50
const D3_DRAG_ALPHA_TARGET = 0.28
const D3_IDLE_ALPHA_TARGET = 0
const D3_CENTER_STRENGTH = 0.065
const D3_MANY_BODY_DISTANCE_MAX = 50
const D3_COLLIDE_STRENGTH = 0.92
const COLLISION_BASE_PADDING = 16
const HIGH_DEGREE_PADDING_FACTOR = 1.55
const HIGH_DEGREE_PADDING_MAX = 22
const TAG_TEXT_MAX_WIDTH = 110
const NOTE_TEXT_MAX_WIDTH = 90
const TAG_FONT_SIZE = 15
const NOTE_FONT_SIZE = 13
const TAG_TEXT_MARGIN_Y = 18
const NOTE_TEXT_MARGIN_Y = 16
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

function estimateLabelHeight(label, maxWidth, fontSize) {
  const safeLabel = String(label || "")
  const approxCharWidth = fontSize * 0.56
  const estimatedTextWidth = Math.min(maxWidth, Math.max(fontSize, safeLabel.length * approxCharWidth))
  const lineCount = Math.max(1, Math.ceil(estimatedTextWidth / maxWidth))
  return lineCount * fontSize * 1.25
}

function computeNodeCollisionRadius(nodeId) {
  const node = nodeById.get(nodeId)
  const nodeSize = computeNodeSize(node || { type: "note", id: nodeId })
  const isNote = node?.type === "note"
  const labelHeight = estimateLabelHeight(
    node?.label,
    isNote ? NOTE_TEXT_MAX_WIDTH : TAG_TEXT_MAX_WIDTH,
    isNote ? NOTE_FONT_SIZE : TAG_FONT_SIZE,
  )
  const labelMargin = isNote ? NOTE_TEXT_MARGIN_Y : TAG_TEXT_MARGIN_Y
  const labelWidth = isNote ? NOTE_TEXT_MAX_WIDTH : TAG_TEXT_MAX_WIDTH
  const totalHeight = nodeSize + labelMargin + labelHeight
  const totalWidth = Math.max(nodeSize, labelWidth)
  const degreePadding = Math.min(
    HIGH_DEGREE_PADDING_MAX,
    getNodeConnectionCount(nodeId) * HIGH_DEGREE_PADDING_FACTOR,
  )

  return Math.hypot(totalWidth * 0.5, totalHeight * 0.5) + COLLISION_BASE_PADDING + degreePadding
}

function computeLinkTargetDistance(sourceId, targetId) {
  const sourceDegree = getNodeConnectionCount(sourceId)
  const targetDegree = getNodeConnectionCount(targetId)
  const sourceRadius = computeNodeCollisionRadius(sourceId)
  const targetRadius = computeNodeCollisionRadius(targetId)
  const degreeBreathingRoom = Math.min(42, (sourceDegree + targetDegree) * 1.35)
  return Math.max(GRAPH_EDGE_LENGTH, sourceRadius + targetRadius + degreeBreathingRoom)
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
    ? mockGardenGraph.seedNodeIds.filter((nodeId) => nodeById.get(nodeId)?.type === "tag")
    : []

  if (payloadSeeds.length > 0) {
    return payloadSeeds
  }

  return nodesSortedByConnectivity
    .filter((node) => node.type === "tag")
    .slice(0, 18)
    .map((node) => node.id)
}

function getStandaloneTagSeedIds() {
  return [...nodeById.values()]
    .filter((node) => node.type === "tag")
    .filter((tagNode) => {
      const neighborIds = adjacencyByNodeId.get(tagNode.id) || new Set()
      if (neighborIds.size === 0) {
        return true
      }

      return [...neighborIds].every((neighborId) => nodeById.get(neighborId)?.type !== "note")
    })
    .map((tagNode) => tagNode.id)
}

function getSeedNodeIdSet() {
  const providedSeedTagIds = Array.isArray(mockGardenGraph.seedNodeIds)
    ? mockGardenGraph.seedNodeIds.filter((seedId) => nodeById.get(seedId)?.type === "tag")
    : []
  const standaloneTagSeedIds = getStandaloneTagSeedIds()

  if (providedSeedTagIds.length > 0) {
    return new Set([...providedSeedTagIds, ...standaloneTagSeedIds])
  }

  return new Set([...selectDefaultSeedNodeIds(), ...standaloneTagSeedIds])
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
  const forceSimulationRef = useRef(null)
  const forceNodeByIdRef = useRef(new Map())
  const forceNodeStateByIdRef = useRef(new Map())
  const activeLayoutRef = useRef(null)
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
        if (!isMounted || !Array.isArray(payload?.nodes) || !Array.isArray(payload?.edges)) {
          return
        }

        mockGardenGraph.seedNodeIds = Array.isArray(payload.seedNodeIds) ? payload.seedNodeIds : []
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
        name: "circle",
        animate: true,
        animationDuration: 360,
        fit: true,
        padding: 56,
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

    const stopActiveLayout = () => {
      if (activeLayoutRef.current) {
        activeLayoutRef.current.stop()
        activeLayoutRef.current = null
      }
    }

    const stopForceSimulation = () => {
      if (forceSimulationRef.current) {
        forceSimulationRef.current.stop()
        forceSimulationRef.current = null
      }

      forceNodeByIdRef.current = new Map()
    }

    const startForceSimulation = ({ alpha = D3_ALPHA_INITIAL } = {}) => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      stopForceSimulation()

      const viewportCenter = getViewportCenterPosition(cy)
      const previousNodeStateById = forceNodeStateByIdRef.current
      const simulationNodes = cy.nodes().toArray().map((cyNode) => {
        const nodeId = cyNode.id()
        const previousState = previousNodeStateById.get(nodeId)
        const position = cyNode.position()

        return {
          id: nodeId,
          x: position.x,
          y: position.y,
          vx: previousState?.vx ?? 0,
          vy: previousState?.vy ?? 0,
          collisionRadius: computeNodeCollisionRadius(nodeId),
          chargeStrength: -380 - Math.min(340, getNodeConnectionCount(nodeId) * 18),
        }
      })

      const simulationLinks = cy.edges().toArray().map((cyEdge) => {
        const sourceId = cyEdge.source().id()
        const targetId = cyEdge.target().id()
        const sourceDegree = getNodeConnectionCount(sourceId)
        const targetDegree = getNodeConnectionCount(targetId)

        return {
          source: sourceId,
          target: targetId,
          distance: computeLinkTargetDistance(sourceId, targetId),
          strength: 0.12 + Math.min(0.2, (sourceDegree + targetDegree) * 0.01),
        }
      })

      const simulation = forceSimulation(simulationNodes)
        .alpha(Math.max(alpha, D3_ALPHA_MIN))
        .alphaTarget(D3_IDLE_ALPHA_TARGET)
        .alphaDecay(D3_ALPHA_DECAY)
        .alphaMin(D3_ALPHA_MIN)
        .velocityDecay(D3_VELOCITY_DECAY)
        .force("charge", forceManyBody().strength((node) => node.chargeStrength).distanceMax(D3_MANY_BODY_DISTANCE_MAX))
        .force("link", forceLink(simulationLinks).id((node) => node.id).distance((link) => link.distance).strength((link) => link.strength))
        .force("center", forceCenter(viewportCenter.x, viewportCenter.y))
        .force("centerX", forceX(viewportCenter.x).strength(D3_CENTER_STRENGTH))
        .force("centerY", forceY(viewportCenter.y).strength(D3_CENTER_STRENGTH))
        .force("collision", forceCollide().radius((node) => node.collisionRadius).strength(D3_COLLIDE_STRENGTH).iterations(2))

      simulation.on("tick", () => {
        if (isCyDestroyed || cy.destroyed()) {
          simulation.stop()
          return
        }

        cy.batch(() => {
          simulationNodes.forEach((simulationNode) => {
            const cyNode = cy.getElementById(simulationNode.id)
            if (cyNode.empty()) {
              return
            }

            if (cyNode.grabbed()) {
              const grabbedPosition = cyNode.position()
              simulationNode.x = grabbedPosition.x
              simulationNode.y = grabbedPosition.y
              simulationNode.fx = grabbedPosition.x
              simulationNode.fy = grabbedPosition.y
              return
            }

            cyNode.position({
              x: simulationNode.x,
              y: simulationNode.y,
            })
          })
        })
      })

      simulation.on("end", () => {
        forceNodeStateByIdRef.current = new Map(
          simulationNodes.map((node) => [
            node.id,
            {
              x: node.x,
              y: node.y,
              vx: node.vx,
              vy: node.vy,
            },
          ]),
        )
      })

      forceSimulationRef.current = simulation
      forceNodeByIdRef.current = new Map(simulationNodes.map((node) => [node.id, node]))
    }

    const reheatForceSimulation = ({ alpha = D3_ALPHA_REHEAT, alphaTarget = D3_DRAG_ALPHA_TARGET } = {}) => {
      const simulation = forceSimulationRef.current

      if (!simulation) {
        startForceSimulation({ alpha })
        return
      }

      simulation
        .alpha(Math.max(simulation.alpha(), alpha))
        .alphaTarget(alphaTarget)
        .restart()
    }

    const pinNodeInSimulation = (cyNode) => {
      if (!cyNode || cyNode.empty()) {
        return
      }

      const simulationNode = forceNodeByIdRef.current.get(cyNode.id())
      if (!simulationNode) {
        return
      }

      const position = cyNode.position()
      simulationNode.x = position.x
      simulationNode.y = position.y
      simulationNode.fx = position.x
      simulationNode.fy = position.y
    }

    const releaseNodeInSimulation = (cyNode) => {
      if (!cyNode || cyNode.empty()) {
        return
      }

      const simulationNode = forceNodeByIdRef.current.get(cyNode.id())
      if (!simulationNode) {
        return
      }

      const position = cyNode.position()
      simulationNode.x = position.x
      simulationNode.y = position.y
      simulationNode.fx = null
      simulationNode.fy = null
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
      stopForceSimulation()

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
          name: "circle",
          animate: true,
          animationDuration: 300,
          fit: true,
          padding: 56,
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
          startForceSimulation({ alpha: D3_ALPHA_REHEAT })
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

      startForceSimulation({ alpha: hasFocusNotesVisible ? D3_ALPHA_REHEAT : D3_ALPHA_INITIAL })
      updateNoteLabelOpacity()
    }

    syncGraphElementsRef.current = rerenderFocusGraph

    const handleResize = () => {
      if (isCyDestroyed || cy.destroyed()) {
        return
      }

      cy.resize()
      reheatForceSimulation({ alpha: D3_ALPHA_REHEAT, alphaTarget: 0.18 })
      updateNoteLabelOpacity()
    }

    cy.on("grab", "node", (event) => {
      reheatForceSimulation({ alpha: D3_ALPHA_REHEAT, alphaTarget: D3_DRAG_ALPHA_TARGET })
      pinNodeInSimulation(event.target)
    })

    cy.on("drag", "node", (event) => {
      pinNodeInSimulation(event.target)
      reheatForceSimulation({ alpha: D3_ALPHA_REHEAT, alphaTarget: D3_DRAG_ALPHA_TARGET })
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

    cy.on("free", "node", (event) => {
      releaseNodeInSimulation(event.target)
      reheatForceSimulation({ alpha: D3_ALPHA_REHEAT, alphaTarget: D3_IDLE_ALPHA_TARGET })
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

      arrangeFocusedNotesAroundTag(
        cy,
        Boolean(focusedNodeIdRef.current) && notesVisibleForFocusRef.current ? focusedNodeIdRef.current : null,
      )
      startForceSimulation({ alpha: D3_ALPHA_INITIAL })
      updateNoteLabelOpacity()
    })

    updateNoteLabelOpacity()

    return () => {
      isCyDestroyed = true
      syncGraphElementsRef.current = null
      cyRef.current = null
      stopActiveLayout()
      stopForceSimulation()

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
