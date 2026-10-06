import React from 'react';
import { Eye, Edit3, Trash2, Boxes } from 'lucide-react';
import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, onDeleteClick, onStockAdjustClick }) => {
  const { isAdmin } = useAuth();
  const minThreshold = product.minStockThreshold || 5;

  return (
    <div className="glass-panel glass-panel-hover product-item-card" id={`product-card-${product._id}`}>
      <div>
        <div className="product-card-top">
          <span className="product-category-tag">{product.category}</span>
          <StockBadge stock={product.stockQuantity} customStatus={product.stockStatus} />
        </div>

        <Link
          to={`/products/${product._id}`}
          style={{ textDecoration: 'none', color: '#ffffff', display: 'block', marginTop: '10px' }}
        >
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.3 }}>
            {product.name}
          </h4>
        </Link>

        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}
        >
          {product.description}
        </p>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Price
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
              ${Number(product.price).toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Stock Level
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color:
                  product.stockQuantity === 0
                    ? '#f87171'
                    : product.stockQuantity <= minThreshold
                    ? '#fbbf24'
                    : '#ffffff',
              }}
            >
              {product.stockQuantity} units
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={() => onStockAdjustClick && onStockAdjustClick(product)}
            title="Adjust Stock Quantity"
          >
            <Boxes size={14} />
            <span>Stock</span>
          </button>

          <Link
            to={`/products/${product._id}`}
            className="btn-icon action-btn-view"
            title="View Details"
          >
            <Eye size={15} />
          </Link>

          <Link
            to={`/products/${product._id}/edit`}
            className="btn-icon action-btn-edit"
            title="Edit Product"
          >
            <Edit3 size={15} />
          </Link>

          {/* Delete is Admin only */}
          {isAdmin && (
            <button
              type="button"
              className="btn-icon action-btn-delete"
              title="Delete (Admin Only)"
              onClick={() => onDeleteClick(product)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
