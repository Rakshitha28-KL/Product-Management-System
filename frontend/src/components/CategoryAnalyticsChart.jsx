import React, { useState } from 'react';
import { BarChart3, Boxes, DollarSign, Package } from 'lucide-react';

const CategoryAnalyticsChart = ({ categoryBreakdown = [], totalProducts = 0, totalStock = 0, totalValue = 0 }) => {
  const [activeMetric, setActiveMetric] = useState('products'); // 'products' | 'stock' | 'value'
  const [hoveredCategory, setHoveredCategory] = useState(null);

  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No category data available for analytics.
      </div>
    );
  }

  // Determine maximum values for proportional bar scaling
  const maxProducts = Math.max(...categoryBreakdown.map((c) => c.count || 0), 1);
  const maxStock = Math.max(...categoryBreakdown.map((c) => c.totalStock || 0), 1);
  const maxValue = Math.max(...categoryBreakdown.map((c) => c.totalValue || 0), 1);

  // Palette for categories
  const colorPalette = [
    '#6366f1', // Indigo
    '#38bdf8', // Sky
    '#10b981', // Emerald
    '#a855f7', // Purple
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chart Header with Metric Selector Tabs */}
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
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Category Distribution Analytics
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time breakdown across {categoryBreakdown.length} catalog categories
            </span>
          </div>
        </div>

        {/* Metric Selector Tabs */}
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
            onClick={() => setActiveMetric('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeMetric === 'products' ? 'var(--primary)' : 'transparent',
              color: activeMetric === 'products' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Package size={13} />
            <span>Products</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('stock')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeMetric === 'stock' ? 'var(--primary)' : 'transparent',
              color: activeMetric === 'stock' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Boxes size={13} />
            <span>Stock Units</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('value')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeMetric === 'value' ? 'var(--primary)' : 'transparent',
              color: activeMetric === 'value' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <DollarSign size={13} />
            <span>Inventory Value</span>
          </button>
        </div>
      </div>

      {/* Chart Bars List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
        {categoryBreakdown.map((cat, idx) => {
          const color = colorPalette[idx % colorPalette.length];
          const isHovered = hoveredCategory === cat.category;

          let currentValue = 0;
          let formattedValue = '';
          let percentage = 0;
          let barWidth = 0;

          if (activeMetric === 'products') {
            currentValue = cat.count || 0;
            formattedValue = `${currentValue} SKUs`;
            percentage = totalProducts > 0 ? ((currentValue / totalProducts) * 100).toFixed(1) : 0;
            barWidth = (currentValue / maxProducts) * 100;
          } else if (activeMetric === 'stock') {
            currentValue = cat.totalStock || 0;
            formattedValue = `${currentValue.toLocaleString()} units`;
            percentage = totalStock > 0 ? ((currentValue / totalStock) * 100).toFixed(1) : 0;
            barWidth = (currentValue / maxStock) * 100;
          } else {
            currentValue = cat.totalValue || 0;
            formattedValue = `$${Number(currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            percentage = totalValue > 0 ? ((currentValue / totalValue) * 100).toFixed(1) : 0;
            barWidth = (currentValue / maxValue) * 100;
          }

          return (
            <div
              key={cat.category}
              onMouseEnter={() => setHoveredCategory(cat.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              style={{
                transition: 'all 0.2s ease',
                padding: '6px 8px',
                borderRadius: '8px',
                background: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 8px ${color}80`,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: isHovered ? '#ffffff' : 'var(--text-primary)' }}>
                    {cat.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'JetBrains Mono' }}>
                    {formattedValue}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: `${color}20`,
                      color: color,
                    }}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(barWidth, 2)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}90 0%, ${color} 100%)`,
                    borderRadius: '4px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isHovered ? `0 0 10px ${color}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Footer summary */}
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
        <span>Top Category: <strong>{categoryBreakdown[0]?.category || 'N/A'}</strong></span>
        <span>
          Total Value: <strong style={{ color: '#34d399' }}>${Number(totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </span>
      </div>
    </div>
  );
};

export default CategoryAnalyticsChart;
