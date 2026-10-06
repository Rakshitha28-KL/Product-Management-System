import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit3, ArrowLeft } from 'lucide-react';
import { getProductById, updateProduct } from '../services/api';
import { useToast } from '../context/ToastContext';
import ProductForm from '../components/ProductForm';
import LoadingSpinner from '../components/LoadingSpinner';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await getProductById(id);
        if (res.success) {
          setProduct(res.data);
        }
      } catch (err) {
        console.error('Failed to load product for editing:', err);
        setApiError(err.message || 'Product not found.');
        addToast(err.message || 'Product not found.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, addToast]);

  const handleUpdate = async (productData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      const res = await updateProduct(id, productData);

      if (res.success) {
        addToast('Product updated successfully!', 'success');
        navigate(`/products/${id}`);
      }
    } catch (err) {
      console.error('Update product failed:', err);
      const errorMessage = err.message || 'Failed to update product.';
      setApiError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading product data..." />;
  }

  if (!product && !loading) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The product you are trying to edit does not exist or has been removed.
        </p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to={`/products/${id}`}
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
          <span>Back to Product Details</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Edit3 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Edit Product</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Modify product details, adjust stock quantities, and update catalog info.
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

      {/* Reusable Form populated with product */}
      <ProductForm
        initialData={product}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        isEdit={true}
      />
    </div>
  );
};

export default EditProduct;
