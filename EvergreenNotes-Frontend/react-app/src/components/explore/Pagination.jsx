import "/src/styles/components/explore/pagination.css"

function Pagination() {
  return (
    <div className="pagination">
      <p className="selected">1</p>
      <p>2</p>
      <p>3</p>
      <p className="points">...</p>
      <p>10</p>
    </div>
  )
}

export default Pagination