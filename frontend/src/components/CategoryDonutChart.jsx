import React, { useState } from 'react';
import { PieChart, Layers } from 'lucide-react';

const CategoryDonutChart = ({ categoryBreakdown = [], totalProducts = 0, totalValue = 0 }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return null;
  }

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

  // Compute SVG SVG donut arcs
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = categoryBreakdown.map((cat, i) => {
    const percent = totalProducts > 0 ? cat.count / totalProducts : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...cat,
      percent: (percent * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color: colorPalette[i % colorPalette.length],
    };
  });

  const activeCategory = hoveredIdx !== null ? segments[hoveredIdx] : segments[0];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
          }}
        >
          <PieChart size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Category SKU Share
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Proportional product distribution
          </span>
        </div>
      </div>

      {/* Donut Body and Legends */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '1.5rem',
          flex: 1,
        }}
      >
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            {segments.map((seg, i) => (
              <circle
                key={seg.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hoveredIdx === i ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Donut Center Display */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: activeCategory?.color || '#ffffff' }}>
              {activeCategory?.percent}%
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeCategory?.category}
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
          {segments.map((seg, i) => (
            <div
              key={seg.category}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '6px',
                background: hoveredIdx === i ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: seg.color,
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: hoveredIdx === i ? '#ffffff' : 'var(--text-primary)', fontWeight: 500 }}>
                  {seg.category}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: seg.color, fontFamily: 'JetBrains Mono' }}>
                {seg.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDonutChart;
