import React from 'react';
import { Eye, Edit3, Trash2, Boxes } from 'lucide-react';
import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';
import { useAuth } from '../context/AuthContext';

const ProductTable = ({ products = [], onDeleteClick, onStockAdjustClick }) => {
  const { isAdmin } = useAuth();

  return (
    <div className="table-responsive">
      <table className="custom-table" id="products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Stock Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const minThreshold = product.minStockThreshold || 5;
            return (
              <tr key={product._id} id={`product-row-${product._id}`}>
                <td>
                  <Link
                    to={`/products/${product._id}`}
                    className="table-product-name"
                    style={{ color: '#ffffff', textDecoration: 'none' }}
                  >
                    {product.name}
                  </Link>
                  <div className="table-product-desc" title={product.description}>
                    {product.description}
                  </div>
                </td>

                <td>
                  <span className="product-category-tag">{product.category}</span>
                </td>

                <td>
                  <span className="table-price">${Number(product.price).toFixed(2)}</span>
                </td>

                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          product.stockQuantity === 0
                            ? '#f87171'
                            : product.stockQuantity <= minThreshold
                            ? '#fbbf24'
                            : '#f1f5f9',
                      }}
                    >
                      {product.stockQuantity} units
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Min threshold: {minThreshold}
                    </span>
                  </div>
                </td>

                <td>
                  <StockBadge stock={product.stockQuantity} customStatus={product.stockStatus} />
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Quick Stock Adjustment Button */}
                    <button
                      type="button"
                      className="btn-icon action-btn-stock"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        color: '#38bdf8',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                      }}
                      title="Adjust Stock Level"
                      onClick={() => onStockAdjustClick && onStockAdjustClick(product)}
                      id={`adjust-stock-${product._id}`}
                    >
                      <Boxes size={15} />
                    </button>

                    <Link
                      to={`/products/${product._id}`}
                      className="btn-icon action-btn-view"
                      title="View Details"
                      id={`view-product-${product._id}`}
                    >
                      <Eye size={16} />
                    </Link>

                    <Link
                      to={`/products/${product._id}/edit`}
                      className="btn-icon action-btn-edit"
                      title="Edit Product Details"
                      id={`edit-product-${product._id}`}
                    >
                      <Edit3 size={16} />
                    </Link>

                    {/* Strictly Admin Only Action */}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-icon action-btn-delete"
                        title="Delete Product (Admin Only)"
                        onClick={() => onDeleteClick(product)}
                        id={`delete-product-${product._id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
