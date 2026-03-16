export const mockGardenGraph = {
  rootNodeIds: ["tag-react", "tag-psychology", "tag-writing", "tag-philosophy"],
  nodes: [
    {
      id: "tag-react",
      label: "React",
      type: "tag",
      noteCount: 24,
      children: [
        "tag-hooks",
        "tag-state",
        "tag-components",
        "tag-context",
        "tag-js",
        "tag-functional"
      ]
    },
    {
      id: "tag-psychology",
      label: "Psychology",
      type: "tag",
      noteCount: 18,
      children: ["tag-habits", "tag-memory"]
    },
    {
      id: "tag-writing",
      label: "Writing",
      type: "tag",
      noteCount: 13,
      children: ["tag-style", "tag-argument"]
    },
    {
      id: "tag-philosophy",
      label: "Philosophy",
      type: "tag",
      noteCount: 11,
      children: ["tag-logic", "tag-stoicism"]
    },
    {
      id: "tag-hooks",
      label: "Hooks",
      type: "tag",
      noteCount: 12,
      children: ["note-use-state", "note-use-effect"]
    },
    {
      id: "tag-state",
      label: "State",
      type: "tag",
      noteCount: 9,
      children: ["note-lift-state", "note-local-vs-global"]
    },
    {
      id: "tag-components",
      label: "Components",
      type: "tag",
      noteCount: 8,
      children: ["note-composition", "note-props-patterns"]
    },
    {
      id: "tag-context",
      label: "Context",
      type: "tag",
      noteCount: 7,
      children: ["note-context-performance"]
    },
    {
      id: "tag-js",
      label: "JavaScript",
      type: "tag",
      noteCount: 10,
      children: ["note-closures"]
    },
    {
      id: "tag-functional",
      label: "Functional Programming",
      type: "tag",
      noteCount: 6,
      children: ["note-pure-functions"]
    },
    { id: "tag-habits", label: "Habits", type: "tag", noteCount: 7, children: ["note-cue-routine-reward"] },
    { id: "tag-memory", label: "Memory", type: "tag", noteCount: 8, children: ["note-spaced-repetition"] },
    { id: "tag-style", label: "Style", type: "tag", noteCount: 5, children: ["note-voice-and-tone"] },
    { id: "tag-argument", label: "Argument", type: "tag", noteCount: 6, children: ["note-claim-evidence-warrant"] },
    { id: "tag-logic", label: "Logic", type: "tag", noteCount: 6, children: ["note-fallacies"] },
    { id: "tag-stoicism", label: "Stoicism", type: "tag", noteCount: 5, children: ["note-dichotomy-control"] },

    { id: "note-use-state", label: "useState", type: "note", noteCount: 1, children: [] },
    { id: "note-use-effect", label: "useEffect", type: "note", noteCount: 1, children: [] },
    { id: "note-lift-state", label: "Lift State Up", type: "note", noteCount: 1, children: [] },
    { id: "note-local-vs-global", label: "Local vs Global State", type: "note", noteCount: 1, children: [] },
    { id: "note-composition", label: "Composition", type: "note", noteCount: 1, children: [] },
    { id: "note-props-patterns", label: "Props Patterns", type: "note", noteCount: 1, children: [] },
    { id: "note-context-performance", label: "Context Performance", type: "note", noteCount: 1, children: [] },
    { id: "note-closures", label: "Closures", type: "note", noteCount: 1, children: [] },
    { id: "note-pure-functions", label: "Pure Functions", type: "note", noteCount: 1, children: [] },
    { id: "note-cue-routine-reward", label: "Cue-Routine-Reward", type: "note", noteCount: 1, children: [] },
    { id: "note-spaced-repetition", label: "Spaced Repetition", type: "note", noteCount: 1, children: [] },
    { id: "note-voice-and-tone", label: "Voice and Tone", type: "note", noteCount: 1, children: [] },
    { id: "note-claim-evidence-warrant", label: "Claim-Evidence-Warrant", type: "note", noteCount: 1, children: [] },
    { id: "note-fallacies", label: "Logical Fallacies", type: "note", noteCount: 1, children: [] },
    { id: "note-dichotomy-control", label: "Dichotomy of Control", type: "note", noteCount: 1, children: [] }
  ],
  edges: [
    { source: "tag-react", target: "tag-js" },
    { source: "tag-react", target: "tag-functional" },
    { source: "tag-hooks", target: "tag-state" },
    { source: "tag-hooks", target: "tag-components" },
    { source: "tag-state", target: "tag-context" },
    { source: "tag-memory", target: "note-spaced-repetition" },
    { source: "tag-writing", target: "tag-philosophy" },
    { source: "tag-logic", target: "tag-argument" },
    { source: "tag-psychology", target: "tag-philosophy" }
  ]
}
