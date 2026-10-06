import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  XCircle,
  Plus,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  BellRing,
  CheckCircle2,
  RefreshCw,
  FolderTree,
  Calendar,
} from 'lucide-react';
import { getProductStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DashboardCard from '../components/DashboardCard';
import StockBadge from '../components/StockBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import StockUpdateModal from '../components/StockUpdateModal';
import CategoryAnalyticsChart from '../components/CategoryAnalyticsChart';
import LowStockAnalyticsChart from '../components/LowStockAnalyticsChart';
import CategoryDonutChart from '../components/CategoryDonutChart';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Selected product for quick stock update modal
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const res = await getProductStats();
      if (res.success) {
        setStats(res.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenStockModal = (prod) => {
    setSelectedProductForStock(prod);
    setIsStockModalOpen(true);
  };

  const handleStockUpdateSuccess = (updatedProduct) => {
    addToast(`Stock for ${updatedProduct.name} updated to ${updatedProduct.stockQuantity} units!`, 'success');
    setIsStockModalOpen(false);
    setSelectedProductForStock(null);
    fetchDashboardData(true);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating real-time MongoDB inventory statistics and category metrics..." />;
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
          Failed to Load Inventory Analytics
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fetchDashboardData()}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    totalProducts = 0,
    totalStock = 0,
    totalInventoryValue = 0,
    totalCategories = 0,
    lowStockCount = 0,
    outOfStockCount = 0,
    categoryBreakdown = [],
    recentProducts = [],
    lowStockProducts = [],
    lowStockAlerts = [],
    stockStatusDistribution = [],
  } = stats || {};

  const computedCategoriesCount = totalCategories || categoryBreakdown.length || 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Top Banner Header with Live Last Refreshed Timestamp */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', letterSpacing: '0.05em' }}>
              Executive Analytics Dashboard • Role: {user?.role}
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Inventory Analytics &amp; Health</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
            <Calendar size={13} color="#94a3b8" />
            <span>
              Live MongoDB Data • Last updated:{' '}
              <strong style={{ color: '#ffffff' }}>
                {formatDateTime(lastRefreshed)}
              </strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            title="Refresh analytics data"
            id="refresh-dashboard-btn"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link to="/products" className="btn btn-secondary btn-sm">
            <Layers size={14} />
            <span>Catalog</span>
          </Link>

          {isAdmin && (
            <Link to="/products/new" className="btn btn-primary btn-sm" id="dashboard-add-product-btn">
              <Plus size={14} />
              <span>Add Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* 6 Core Executive KPI Cards Grid */}
      <div className="dashboard-metrics-grid">
        {/* 1. Total Products */}
        <DashboardCard
          title="Total Products"
          value={totalProducts.toLocaleString()}
          icon={Package}
          accentColor="#6366f1"
          accentGlow="rgba(99, 102, 241, 0.25)"
          footerText="Active SKUs"
          badgeText="Active"
          badgeType="info"
        />

        {/* 2. Total Stock Units */}
        <DashboardCard
          title="Total Stock"
          value={totalStock.toLocaleString()}
          icon={Boxes}
          accentColor="#06b6d4"
          accentGlow="rgba(6, 182, 212, 0.25)"
          footerText="Physical units"
          badgeText="Volume"
          badgeType="info"
        />

        {/* 3. Total Inventory Value */}
        <DashboardCard
          title="Inventory Value"
          value={`$${Number(totalInventoryValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          accentColor="#10b981"
          accentGlow="rgba(16, 185, 129, 0.25)"
          footerText="Price × Stock"
          badgeText="Valuation"
          badgeType="info"
        />

        {/* 4. Low Stock Products */}
        <DashboardCard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          accentColor="#f59e0b"
          accentGlow="rgba(245, 158, 11, 0.25)"
          footerText="≤ Min Threshold"
          badgeText={lowStockCount > 0 ? 'Warning' : 'Healthy'}
          badgeType={lowStockCount > 0 ? 'warning' : 'info'}
        />

        {/* 5. Out of Stock Products */}
        <DashboardCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={XCircle}
          accentColor="#ef4444"
          accentGlow="rgba(239, 68, 68, 0.25)"
          footerText="0 units left"
          badgeText={outOfStockCount > 0 ? 'Critical' : 'None'}
          badgeType={outOfStockCount > 0 ? 'danger' : 'info'}
        />

        {/* 6. Number of Categories */}
        <DashboardCard
          title="Categories"
          value={computedCategoriesCount}
          icon={FolderTree}
          accentColor="#a855f7"
          accentGlow="rgba(168, 85, 247, 0.25)"
          footerText="Taxonomy"
          badgeText="Segments"
          badgeType="info"
        />
      </div>

      {/* Row 1: Analytics Visualizations Grid */}
      <div className="dashboard-charts-grid">
        {/* Left: Category Analytics with metric tabs */}
        <CategoryAnalyticsChart
          categoryBreakdown={categoryBreakdown}
          totalProducts={totalProducts}
          totalStock={totalStock}
          totalValue={totalInventoryValue}
        />

        {/* Right: Stock Health & Low-Stock Analysis */}
        <LowStockAnalyticsChart
          lowStockProducts={lowStockProducts}
          stockStatusDistribution={stockStatusDistribution}
          totalProducts={totalProducts}
          onStockAdjustClick={handleOpenStockModal}
        />
      </div>

      {/* Row 2: Recently Added Products Table & Low Stock Alert Feed */}
      <div className="dashboard-sections-grid">
        {/* Left: Recently Added Products */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
              <Clock size={16} color="#38bdf8" />
              <span>Recently Added Products</span>
            </h2>
            <Link to="/products" style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No products found in the database.
            </div>
          ) : (
            <div className="table-responsive" style={{ border: 'none', background: 'transparent' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Added Date / Time</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.slice(0, 5).map((product) => (
                    <tr key={product._id}>
                      <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/products/${product._id}`}
                          className="table-product-name"
                          style={{ color: '#ffffff', fontSize: '0.85rem' }}
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td>
                        <span className="product-category-tag" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                          {product.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(product.createdAt)}
                      </td>
                      <td>
                        <span className="table-price" style={{ fontSize: '0.85rem' }}>${Number(product.price).toFixed(2)}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{product.stockQuantity}</span>
                      </td>
                      <td>
                        <StockBadge stock={product.stockQuantity} customStatus={product.stockStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Low Stock & Out-of-Stock Alert Notifications Feed */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BellRing size={16} color={outOfStockCount > 0 ? '#ef4444' : '#f59e0b'} />
              <h2 className="section-title" style={{ fontSize: '1.05rem', color: outOfStockCount > 0 ? '#f87171' : '#fbbf24' }}>
                Low Stock Alerts
              </h2>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '10px',
                background: outOfStockCount > 0 ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
              }}
            >
              {lowStockAlerts.length} Flagged
            </span>
          </div>

          {lowStockAlerts.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={16} />
              <span>All items have healthy stock levels above minimum thresholds.</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {lowStockAlerts.map((alert) => {
                const isOut = alert.type === 'OUT_OF_STOCK' || alert.stock === 0;
                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isOut ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div style={{ color: isOut ? '#f87171' : '#fbbf24', flexShrink: 0 }}>
                        {isOut ? <XCircle size={15} /> : <AlertTriangle size={15} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={isOut ? `${alert.name} is out of stock.` : `${alert.name} stock is low. Current stock: ${alert.stock}`}
                        >
                          {isOut ? `${alert.name} is out of stock.` : `${alert.name} stock is low: ${alert.stock} left`}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {alert.category} • Threshold: {alert.threshold}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${isOut ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '0.72rem', flexShrink: 0 }}
                        onClick={() =>
                          handleOpenStockModal({
                            _id: alert.id,
                            name: alert.name,
                            stockQuantity: alert.stock,
                            minStockThreshold: alert.threshold,
                          })
                        }
                        title="Restock this item"
                      >
                        Adjust
                      </button>
                      <Link
                        to={`/products/${alert.id}`}
                        className="btn-icon"
                        style={{ padding: '3px', color: 'var(--text-secondary)', flexShrink: 0 }}
                        title="View Details"
                      >
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      {selectedProductForStock && (
        <StockUpdateModal
          isOpen={isStockModalOpen}
          product={selectedProductForStock}
          onClose={() => {
            setIsStockModalOpen(false);
            setSelectedProductForStock(null);
          }}
          onSuccess={handleStockUpdateSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;


