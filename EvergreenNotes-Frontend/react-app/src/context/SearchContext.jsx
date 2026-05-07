import { createContext, useContext, useMemo, useState } from "react"

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [gardenSearchQuery, setGardenSearchQuery] = useState("")
  const [exploreSearchQuery, setExploreSearchQuery] = useState("")
  // viewMode controls whether Garden shows 'graph' or 'list'. Default 'graph'.
  const [viewMode, setViewMode] = useState("graph")

  const value = useMemo(
    () => ({
      gardenSearchQuery,
      setGardenSearchQuery,
      exploreSearchQuery,
      setExploreSearchQuery,
      viewMode,
      setViewMode,
    }),
    [exploreSearchQuery, gardenSearchQuery, viewMode]
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error("useSearch must be used inside SearchProvider.")
  }

  return context
}