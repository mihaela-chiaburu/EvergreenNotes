export const mockGardenGraph = {
  nodes: [
    { data: { id: "note-seed", label: "Seed Notes" } },
    { data: { id: "note-evergreen", label: "Evergreen Notes" } },
    { data: { id: "note-linking", label: "Linking Ideas" } },
    { data: { id: "note-feynman", label: "Feynman Technique" } },
    { data: { id: "note-spaced", label: "Spaced Repetition" } },
    { data: { id: "note-atomic", label: "Atomic Notes" } },
    { data: { id: "note-projects", label: "Learning Projects" } }
  ],
  edges: [
    {
      data: {
        id: "edge-1",
        source: "note-seed",
        target: "note-evergreen"
      }
    },
    {
      data: {
        id: "edge-2",
        source: "note-evergreen",
        target: "note-linking"
      }
    },
    {
      data: {
        id: "edge-3",
        source: "note-linking",
        target: "note-atomic"
      }
    },
    {
      data: {
        id: "edge-4",
        source: "note-atomic",
        target: "note-projects"
      }
    },
    {
      data: {
        id: "edge-5",
        source: "note-seed",
        target: "note-feynman"
      }
    },
    {
      data: {
        id: "edge-6",
        source: "note-feynman",
        target: "note-spaced"
      }
    },
    {
      data: {
        id: "edge-7",
        source: "note-spaced",
        target: "note-evergreen"
      }
    },
    {
      data: {
        id: "edge-8",
        source: "note-projects",
        target: "note-linking"
      }
    }
  ]
}
