import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  DollarSign,
  Package,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { getProductById, deleteProduct, getProductStockHistory } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import StockBadge from '../components/StockBadge';
import DeleteConfirmation from '../components/DeleteConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import StockUpdateModal from '../components/StockUpdateModal';
import StockHistoryChart from '../components/StockHistoryChart';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [product, setProduct] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, historyRes] = await Promise.all([
        getProductById(id),
        getProductStockHistory(id),
      ]);

      if (prodRes.success) {
        setProduct(prodRes.data);
      }
      if (historyRes.success) {
        setStockHistory(historyRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError(err.message || 'Product not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteProduct(id);
      if (res.success) {
        addToast(`Product "${product.name}" deleted successfully!`, 'success');
        navigate('/products');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      addToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleStockUpdateSuccess = (updatedProduct) => {
    setProduct(updatedProduct);
    // Refresh history
    getProductStockHistory(id).then((res) => {
      if (res.success) setStockHistory(res.data || []);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving product information and stock history..." />;
  }

  if (error || !product) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'The requested product could not be located in the inventory system.'}
        </p>
        <Link to="/products" className="btn btn-primary">
          Back to Product Catalog
        </Link>
      </div>
    );
  }

  const inventoryValuation = (Number(product.price || 0) * Number(product.stockQuantity || 0)).toFixed(2);
  const minThreshold = product.minStockThreshold || 5;

  return (
    <div className="animate-fade-in product-details-container">
      {/* Top Header & Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Product Specification</h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsStockModalOpen(true)}
            id="adjust-stock-btn"
          >
            <Boxes size={16} />
            <span>Adjust Stock Level</span>
          </button>

          <Link
            to={`/products/${product._id}/edit`}
            className="btn btn-secondary"
            id="edit-details-btn"
          >
            <Edit3 size={16} />
            <span>Edit Product</span>
          </Link>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setIsDeleteModalOpen(true)}
              id="delete-details-btn"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Hero Glass Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="product-category-tag">{product.category}</span>
              <StockBadge stock={product.stockQuantity} customStatus={product.stockStatus} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
              {product.name}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
              ID: {product._id}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Unit Price
            </span>
            <div className="detail-value-price">
              ${Number(product.price).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(14, 20, 36, 0.6)', border: '1px solid var(--border-light)' }}>
          <div className="detail-label">Product Description</div>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {product.description}
          </p>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="details-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="detail-label">Current Stock Available</div>
            <div
              className="detail-value"
              style={{
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Min Alert Threshold: <strong style={{ color: '#fbbf24' }}>{minThreshold} units</strong>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsStockModalOpen(true)}
            title="Adjust stock"
          >
            <Boxes size={14} />
            <span>Restock</span>
          </button>
        </div>

        <div className="detail-item">
          <div className="detail-label">Total Inventory Valuation</div>
          <div className="detail-value" style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
            ${inventoryValuation}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Based on unit price × current stock
          </span>
        </div>

        <div className="detail-item">
          <div className="detail-label">Created Timestamp</div>
          <div className="detail-value" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {formatDate(product.createdAt)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Catalog creation date
          </span>
        </div>

        <div className="detail-item">
          <div className="detail-label">Last Modified Timestamp</div>
          <div className="detail-value" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {formatDate(product.updatedAt)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Most recent update date
          </span>
        </div>
      </div>

      {/* Stock Movement History Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Stock Movement History &amp; Timeline
            </h3>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsStockModalOpen(true)}
          >
            + New Stock Adjustment
          </button>
        </div>

        {/* Visual Trend Chart */}
        <StockHistoryChart history={stockHistory} threshold={minThreshold} />

        {/* History Table */}
        {stockHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No stock movement history recorded for this product yet.
          </div>
        ) : (
          <div className="table-responsive" style={{ marginTop: '1rem', border: '1px solid var(--border-light)' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Prev Stock</th>
                  <th>New Stock</th>
                  <th>Change Delta</th>
                  <th>Action Type</th>
                  <th>Changed By</th>
                  <th>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                {stockHistory.map((h) => {
                  const isPositive = h.changeAmount > 0;
                  const isZero = h.changeAmount === 0;

                  return (
                    <tr key={h._id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(h.createdAt || h.timestamp)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{h.previousQuantity}</td>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>{h.newQuantity}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isPositive
                              ? 'rgba(16, 185, 129, 0.15)'
                              : isZero
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: isPositive ? '#34d399' : isZero ? 'var(--text-muted)' : '#f87171',
                          }}
                        >
                          {isPositive ? `+${h.changeAmount}` : h.changeAmount} units
                        </span>
                      </td>
                      <td>
                        <span className="product-category-tag" style={{ fontSize: '0.68rem' }}>
                          {h.changeType || 'MANUAL'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                        {h.changedBy || 'System'}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          <strong>{h.reason}</strong>
                          {h.note && <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Note: {h.note}</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
        <Link to="/products" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Product Catalog</span>
        </Link>
      </div>

      {/* Stock Adjustment Modal */}
      <StockUpdateModal
        isOpen={isStockModalOpen}
        product={product}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={handleStockUpdateSuccess}
      />

      {/* Delete Confirmation Modal */}
      {isAdmin && (
        <DeleteConfirmation
          isOpen={isDeleteModalOpen}
          product={product}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default ProductDetails;
