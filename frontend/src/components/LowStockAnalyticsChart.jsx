import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, XCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const LowStockAnalyticsChart = ({
  lowStockProducts = [],
  stockStatusDistribution = [],
  totalProducts = 0,
  onStockAdjustClick,
}) => {
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'items'

  const inStock = stockStatusDistribution.find((s) => s.status === 'In Stock') || { count: 0, percentage: 0 };
  const lowStock = stockStatusDistribution.find((s) => s.status === 'Low Stock') || { count: 0, percentage: 0 };
  const outOfStock = stockStatusDistribution.find((s) => s.status === 'Out of Stock') || { count: 0, percentage: 0 };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Stock Health &amp; Low-Stock Analysis
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time threshold monitoring &amp; inventory risk overview
            </span>
          </div>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'health' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'health' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            Health Ratio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'items' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'items' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            Critical Items ({lowStockProducts.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overall Stock Health Distribution */}
      {activeTab === 'health' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
          {/* Multi-Segment Health Distribution Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Inventory Health Status</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{totalProducts} Total SKUs</span>
            </div>

            <div
              style={{
                width: '100%',
                height: '16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  width: `${inStock.percentage}%`,
                  height: '100%',
                  background: '#10b981',
                  transition: 'width 0.6s ease',
                }}
                title={`In Stock: ${inStock.count} items (${inStock.percentage}%)`}
              />
              <div
                style={{
                  width: `${lowStock.percentage}%`,
                  height: '100%',
                  background: '#f59e0b',
                  transition: 'width 0.6s ease',
                }}
                title={`Low Stock: ${lowStock.count} items (${lowStock.percentage}%)`}
              />
              <div
                style={{
                  width: `${outOfStock.percentage}%`,
                  height: '100%',
                  background: '#ef4444',
                  transition: 'width 0.6s ease',
                }}
                title={`Out of Stock: ${outOfStock.count} items (${outOfStock.percentage}%)`}
              />
            </div>
          </div>

          {/* Status Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* In Stock */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#34d399', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <CheckCircle2 size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{inStock.count}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In Stock</div>
              <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '2px' }}>{inStock.percentage}%</div>
            </div>

            {/* Low Stock */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#fbbf24', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <AlertTriangle size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{lowStock.count}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Low Stock</div>
              <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '2px' }}>{lowStock.percentage}%</div>
            </div>

            {/* Out of Stock */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#f87171', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <XCircle size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{outOfStock.count}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Out of Stock</div>
              <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '2px' }}>{outOfStock.percentage}%</div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Specific Low Stock Products vs Threshold Comparison */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#34d399', fontSize: '0.85rem' }}>
              ✓ All catalog products currently maintain healthy inventory levels.
            </div>
          ) : (
            lowStockProducts.slice(0, 5).map((p) => {
              const threshold = p.minStockThreshold || 5;
              const isOut = p.stockQuantity === 0;
              const ratio = threshold > 0 ? Math.min((p.stockQuantity / threshold) * 100, 100) : 0;

              return (
                <div
                  key={p._id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: isOut ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <Link
                      to={`/products/${p._id}`}
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        textDecoration: 'none',
                        maxWidth: '65%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isOut ? '#f87171' : '#fbbf24',
                          fontFamily: 'JetBrains Mono',
                        }}
                      >
                        {p.stockQuantity} / {threshold} units
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        onClick={() => onStockAdjustClick && onStockAdjustClick(p)}
                      >
                        Restock
                      </button>
                    </div>
                  </div>

                  {/* Stock vs Threshold Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(ratio, 3)}%`,
                        height: '100%',
                        background: isOut ? '#ef4444' : '#f59e0b',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Risk Level:{' '}
          <strong style={{ color: outOfStock.count > 0 ? '#f87171' : lowStock.count > 0 ? '#fbbf24' : '#34d399' }}>
            {outOfStock.count > 0 ? 'High (Stockouts)' : lowStock.count > 0 ? 'Moderate (Low Stock)' : 'Optimal'}
          </strong>
        </span>
        <Link to="/products" style={{ color: '#818cf8', textDecoration: 'none' }}>
          View Full Catalog →
        </Link>
      </div>
    </div>
  );
};

export default LowStockAnalyticsChart;
