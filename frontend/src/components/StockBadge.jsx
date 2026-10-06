import React from 'react';

/**
 * Reusable Stock Status Badge Component
 * @param {number} stock - Current stock quantity
 * @param {string} customStatus - Optional explicit status string ('In Stock', 'Low Stock', 'Out of Stock')
 */
const StockBadge = ({ stock, customStatus }) => {
  let status = customStatus;

  if (!status && typeof stock === 'number') {
    if (stock === 0) {
      status = 'Out of Stock';
    } else if (stock <= 5) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }
  }

  const getBadgeClass = () => {
    switch (status) {
      case 'Out of Stock':
        return 'out-of-stock';
      case 'Low Stock':
        return 'low-stock';
      case 'In Stock':
      default:
        return 'in-stock';
    }
  };

  return (
    <span className={`status-badge ${getBadgeClass()}`}>
      <span className="dot" />
      {status || 'Unknown'}
    </span>
  );
};

export default StockBadge;
