import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteConfirmation = ({
  isOpen,
  product,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content animate-fade-in">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f87171',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Confirm Product Deletion</h3>
          </div>

          <button
            className="toast-close"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            Are you sure you want to permanently delete this product from the inventory database?
          </p>

          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem', marginBottom: '4px' }}>
              {product.name}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Category: <strong style={{ color: 'var(--text-secondary)' }}>{product.category}</strong></span>
              <span>Price: <strong style={{ color: '#38bdf8' }}>${Number(product.price).toFixed(2)}</strong></span>
              <span>Stock: <strong style={{ color: 'var(--text-secondary)' }}>{product.stockQuantity}</strong></span>
            </div>
          </div>

          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#f87171' }}>
            Warning: This action cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
            id="cancel-delete-btn"
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
            id="confirm-delete-btn"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Product</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
