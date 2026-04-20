import "../../styles/components/garden-care/stats-bar.css"

function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      <p>Your garden today:</p>
      <p>{stats.totalIdeas} ideas</p>
      <p>{stats.dueToday} due today</p>
      <p>{stats.growing} growing</p>
      <p>{stats.streakDays} day streak</p>
    </div>
  )
}

export default StatsBar