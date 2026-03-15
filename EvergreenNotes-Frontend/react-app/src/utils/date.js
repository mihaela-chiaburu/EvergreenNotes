export function getIsoDate(value) {
  if (!value) {
    return ""
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ""
  }

  return parsedDate.toISOString().slice(0, 10)
}

export function getRandomRecentDateIso() {
  const now = new Date()
  const randomDaysAgo = Math.floor(Math.random() * 30)
  now.setDate(now.getDate() - randomDaysAgo)
  return now.toISOString().slice(0, 10)
}
