import "../../styles/components/explore/pagination.css"

function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="pagination">
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={`pagination__page ${page === currentPage ? "pagination__page--selected" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  )
}

export default Pagination