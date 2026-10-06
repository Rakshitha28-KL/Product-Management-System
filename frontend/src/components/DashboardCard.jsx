import React from 'react';

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  accentColor = '#4f46e5',
  accentGlow = 'rgba(79, 70, 229, 0.2)',
  footerText,
  badgeText,
  badgeType = 'info',
}) => {
  return (
    <div
      className="glass-panel glass-panel-hover metric-card"
      style={{ '--accent-glow': accentGlow }}
    >
      <div>
        <div className="metric-header">
          <span className="metric-title">{title}</span>
          <div
            className="metric-icon-box"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {Icon && <Icon size={22} />}
          </div>
        </div>

        <div className="metric-value">{value}</div>
      </div>

      <div className="metric-footer">
        {badgeText && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 600,
              background:
                badgeType === 'danger'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : badgeType === 'warning'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(99, 102, 241, 0.2)',
              color:
                badgeType === 'danger'
                  ? '#f87171'
                  : badgeType === 'warning'
                  ? '#fbbf24'
                  : '#818cf8',
            }}
          >
            {badgeText}
          </span>
        )}
        {footerText && <span>{footerText}</span>}
      </div>
    </div>
  );
};

export default DashboardCard;
