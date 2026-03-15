import "../../styles/components/garden-care/stats-bar.css"

function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      <p>Your garden today:</p>
      <p>{stats.totalIdeas} ideas</p>
      <p>{stats.thriving} thriving</p>
      <p>{stats.waiting} waiting</p>
      <p>{stats.streakDays} day streak</p>
    </div>
  )
}

export default StatsBar