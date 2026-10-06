import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Layers } from 'lucide-react';
import { createProduct } from '../services/api';
import { useToast } from '../context/ToastContext';
import ProductForm from '../components/ProductForm';

const AddProduct = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleCreate = async (productData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      const res = await createProduct(productData);

      if (res.success) {
        addToast('Product added successfully!', 'success');
        navigate('/products');
      }
    } catch (err) {
      console.error('Create product failed:', err);
      const errorMessage = err.message || 'Failed to create product.';
      setApiError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <PlusCircle size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Add New Product</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Enter product details to create a new inventory item in the database.
            </p>
          </div>
        </div>
      </div>

      {/* Backend API Error Alert if any */}
      {apiError && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {/* Reusable Form */}
      <ProductForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        isEdit={false}
      />
    </div>
  );
};

export default AddProduct;
