import React, { useState, useEffect } from 'react';
import {
  Boxes,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  PackagePlus,
  ShieldCheck,
} from 'lucide-react';
import { updateProductStock } from '../services/api';
import { useToast } from '../context/ToastContext';

const REASON_OPTIONS = [
  { value: 'Restock', label: 'Restock (New shipment received)', defaultType: 'RESTOCK' },
  { value: 'Sale', label: 'Sale (Customer purchase / fulfillment)', defaultType: 'SALE' },
  { value: 'Damaged', label: 'Damaged (Damaged in storage / transit)', defaultType: 'DAMAGED' },
  { value: 'Returned', label: 'Returned (Customer return back to inventory)', defaultType: 'RETURNED' },
  { value: 'Manual Adjustment', label: 'Manual Adjustment (Audit reconciliation)', defaultType: 'MANUAL_ADJUSTMENT' },
  { value: 'Other', label: 'Other (Specify in note)', defaultType: 'OTHER' },
];

const StockUpdateModal = ({ isOpen, product, onClose, onSuccess }) => {
  const { addToast } = useToast();

  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('Restock');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setNewQuantity(product.stockQuantity !== undefined ? String(product.stockQuantity) : '0');
      setReason('Restock');
      setNote('');
      setError('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity || 0;
  const parsedNewQty = Number(newQuantity);
  const isValidNumber = newQuantity !== '' && !isNaN(parsedNewQty) && Number.isInteger(parsedNewQty) && parsedNewQty >= 0;
  const changeDelta = isValidNumber ? parsedNewQty - currentStock : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidNumber) {
      setError('Please enter a valid non-negative integer quantity (0 or greater).');
      return;
    }

    if (!reason || reason.trim().length === 0) {
      setError('Adjustment reason is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const selectedOption = REASON_OPTIONS.find((r) => r.value === reason);
      const changeType = selectedOption?.defaultType || (changeDelta >= 0 ? 'RESTOCK' : 'SALE');

      const res = await updateProductStock(product._id, {
        newQuantity: parsedNewQty,
        reason: reason.trim(),
        changeType,
        note: note.trim(),
      });

      if (res.success) {
        addToast(
          `Stock for "${product.name}" updated from ${currentStock} to ${parsedNewQty} units!`,
          'success'
        );
        if (onSuccess) onSuccess(res.data?.product);
        onClose();
      }
    } catch (err) {
      console.error('Stock adjustment error:', err);
      setError(err.message || 'Failed to update stock quantity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--secondary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Adjust Stock Quantity
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {product.name}
              </span>
            </div>
          </div>

          <button
            className="toast-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current vs New Quantity Stat Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Current Physical Stock
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {currentStock} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>units</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Calculated Movement
              </span>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color:
                    changeDelta > 0
                      ? '#34d399'
                      : changeDelta < 0
                      ? '#f87171'
                      : 'var(--text-muted)',
                }}
              >
                {changeDelta > 0 ? (
                  <>
                    <TrendingUp size={18} />
                    <span>+{changeDelta} units</span>
                  </>
                ) : changeDelta < 0 ? (
                  <>
                    <TrendingDown size={18} />
                    <span>{changeDelta} units</span>
                  </>
                ) : (
                  <span>No Change (0)</span>
                )}
              </div>
            </div>
          </div>

          {/* New Stock Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="stock-new-qty-input">
              <span>New Stock Quantity <span className="required-star">*</span></span>
              <span className="form-hint">Must be ≥ 0</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              id="stock-new-qty-input"
              className="form-control"
              style={{ fontSize: '1.1rem', fontWeight: 700 }}
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Reason Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="stock-reason-select">
              <span>Reason for Adjustment <span className="required-star">*</span></span>
            </label>
            <select
              id="stock-reason-select"
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="stock-note-input">
              <span>Audit Note / Tracking Info (Optional)</span>
            </label>
            <input
              type="text"
              id="stock-note-input"
              className="form-control"
              placeholder="e.g. Purchase order PO-9921 or inspection note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="confirm-stock-adjust-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                  <span>Saving Stock...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Update Stock Level</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateModal;
