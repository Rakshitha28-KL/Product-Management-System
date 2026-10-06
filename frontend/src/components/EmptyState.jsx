import React from 'react';
import { PackageSearch, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  title = 'No products found',
  description = 'No inventory items match your current filter criteria.',
  actionText = 'Add Product',
  actionLink = '/products/new',
  onAction,
}) => {
  return (
    <div className="glass-panel empty-state">
      <div className="empty-state-icon">
        <PackageSearch size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{description}</p>

      {actionText && (
        actionLink ? (
          <Link to={actionLink} className="btn btn-primary" id="empty-state-action-btn">
            <Plus size={16} />
            <span>{actionText}</span>
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onAction} id="empty-state-action-btn">
            <Plus size={16} />
            <span>{actionText}</span>
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
