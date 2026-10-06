import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  limit = 10,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = totalProducts === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalProducts);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-wrap">
      <div className="pagination-info">
        Showing <strong style={{ color: '#ffffff' }}>{startItem}</strong> to{' '}
        <strong style={{ color: '#ffffff' }}>{endItem}</strong> of{' '}
        <strong style={{ color: '#ffffff' }}>{totalProducts}</strong> products
      </div>

      <div className="pagination-pages">
        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
          id="pagination-prev-btn"
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers().map((num) => (
          <button
            key={num}
            type="button"
            className={`page-btn ${num === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(num)}
            id={`pagination-page-${num}-btn`}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
          id="pagination-next-btn"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
