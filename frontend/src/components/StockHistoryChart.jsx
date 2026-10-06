import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';

const StockHistoryChart = ({ history = [], threshold = 5 }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No historical stock adjustments logged for this product yet.
      </div>
    );
  }

  // Reverse so chronological left-to-right
  const chronologicalHistory = [...history].reverse();
  const values = chronologicalHistory.map((h) => h.newQuantity);
  const maxVal = Math.max(...values, threshold, 10);
  const minVal = 0;

  const width = 600;
  const height = 180;
  const padding = 35;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const getX = (index) => {
    if (chronologicalHistory.length === 1) return width / 2;
    return padding + (index / (chronologicalHistory.length - 1)) * graphWidth;
  };

  const getY = (val) => {
    const norm = (val - minVal) / (maxVal - minVal || 1);
    return height - padding - norm * graphHeight;
  };

  const points = chronologicalHistory.map((h, i) => `${getX(i)},${getY(h.newQuantity)}`).join(' ');
  const thresholdY = getY(threshold);

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: '1rem 0',
      }}
    >
      <div style={{ minWidth: '480px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Background Grid Lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Threshold Baseline (Dotted Amber Line) */}
          <line
            x1={padding}
            y1={thresholdY}
            x2={width - padding}
            y2={thresholdY}
            stroke="rgba(245, 158, 11, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={width - padding + 5}
            y={thresholdY + 4}
            fill="#fbbf24"
            fontSize="10"
            fontWeight="600"
          >
            Threshold: {threshold}
          </text>

          {/* Area Gradient */}
          <defs>
            <linearGradient id="stockAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Filled Area */}
          {chronologicalHistory.length > 1 && (
            <polygon
              points={`${getX(0)},${height - padding} ${points} ${getX(chronologicalHistory.length - 1)},${height - padding}`}
              fill="url(#stockAreaGrad)"
            />
          )}

          {/* Connected Polyline */}
          {chronologicalHistory.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Labels */}
          {chronologicalHistory.map((h, i) => {
            const cx = getX(i);
            const cy = getY(h.newQuantity);
            const isLow = h.newQuantity <= threshold;

            return (
              <g key={h._id || i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={isLow ? '#f87171' : '#38bdf8'}
                  stroke="#0e1424"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                >
                  {h.newQuantity}
                </text>
                <text
                  x={cx}
                  y={height - padding + 15}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="9"
                >
                  {new Date(h.createdAt || h.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
            <span>Stock Level</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #fbbf24' }} />
            <span>Min Threshold ({threshold} units)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryChart;
