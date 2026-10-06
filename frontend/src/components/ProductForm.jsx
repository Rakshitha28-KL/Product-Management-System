import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../services/api';
import StockBadge from './StockBadge';
import { DollarSign, Layers, Package, FileText, Hash, Check, X, AlertCircle, AlertTriangle } from 'lucide-react';

const DEFAULT_INITIAL_DATA = {
  name: '',
  category: '',
  price: '',
  stockQuantity: '',
  minStockThreshold: 5,
  description: '',
};

const ProductForm = ({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  isEdit = false,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    category: initialData?.category || '',
    price: initialData?.price !== undefined ? initialData.price : '',
    stockQuantity: initialData?.stockQuantity !== undefined ? initialData.stockQuantity : '',
    minStockThreshold: initialData?.minStockThreshold !== undefined ? initialData.minStockThreshold : 5,
    description: initialData?.description || '',
  }));

  const [availableCategories, setAvailableCategories] = useState([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success && Array.isArray(res.data)) {
          setAvailableCategories(res.data);
          if (initialData?.category && !res.data.includes(initialData.category)) {
            setAvailableCategories((prev) => [...prev, initialData.category]);
          }
        }
      } catch (e) {
        console.error('Error fetching categories for form:', e);
      }
    };
    fetchCats();
  }, [initialData?.category]);

  // Only re-populate formData when editing and a new product entity is loaded
  useEffect(() => {
    if (initialData && initialData._id) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        price: initialData.price !== undefined ? initialData.price : '',
        stockQuantity: initialData.stockQuantity !== undefined ? initialData.stockQuantity : '',
        minStockThreshold: initialData.minStockThreshold !== undefined ? initialData.minStockThreshold : 5,
        description: initialData.description || '',
      });
    }
  }, [initialData?._id]);

  // Client-side Validation logic
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          error = 'Product name is required';
        } else if (value.trim().length < 2) {
          error = 'Product name must be at least 2 characters long';
        } else if (value.trim().length > 100) {
          error = 'Product name cannot exceed 100 characters';
        }
        break;

      case 'category':
        if (!value || value.trim().length === 0) {
          error = 'Category is required';
        }
        break;

      case 'price':
        const numPrice = Number(value);
        if (value === '' || value === null || value === undefined) {
          error = 'Price is required';
        } else if (isNaN(numPrice) || numPrice <= 0) {
          error = 'Price must be greater than 0';
        }
        break;

      case 'stockQuantity':
        const numStock = Number(value);
        if (value === '' || value === null || value === undefined) {
          error = 'Stock quantity is required';
        } else if (isNaN(numStock) || !Number.isInteger(numStock) || numStock < 0) {
          error = 'Stock quantity cannot be negative (must be a non-negative integer)';
        }
        break;

      case 'minStockThreshold':
        const numThreshold = Number(value);
        if (value === '' || value === null || value === undefined) {
          error = 'Minimum threshold is required';
        } else if (isNaN(numThreshold) || !Number.isInteger(numThreshold) || numThreshold < 1) {
          error = 'Threshold must be an integer of 1 or greater';
        }
        break;

      case 'description':
        if (!value || value.trim().length === 0) {
          error = 'Description is required';
        } else if (value.trim().length < 5) {
          error = 'Description must be at least 5 characters long';
        }
        break;

      default:
        break;
    }
    return error;
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleCategorySelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setFormData((prev) => ({ ...prev, category: customCategoryInput }));
    } else {
      setIsCustomCategory(false);
      setFormData((prev) => ({ ...prev, category: val }));
      if (touched.category) {
        const err = validateField('category', val);
        setErrors((prev) => ({ ...prev, category: err }));
      }
    }
  };

  const handleCustomCategoryInput = (e) => {
    const val = e.target.value;
    setCustomCategoryInput(val);
    setFormData((prev) => ({ ...prev, category: val }));
    if (touched.category) {
      const err = validateField('category', val);
      setErrors((prev) => ({ ...prev, category: err }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      category: true,
      price: true,
      stockQuantity: true,
      minStockThreshold: true,
      description: true,
    });

    if (!validateAll()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      stockQuantity: Number(formData.stockQuantity),
      minStockThreshold: Number(formData.minStockThreshold) || 5,
      description: formData.description.trim(),
    };

    onSubmit(payload);
  };

  const parsedPrice = Number(formData.price) || 0;
  const parsedStock = Number(formData.stockQuantity) || 0;
  const parsedThreshold = Number(formData.minStockThreshold) || 5;
  const liveInventoryValue = (parsedPrice * parsedStock).toFixed(2);

  // Dynamic calculated status for preview
  let dynamicStatus = 'In Stock';
  if (parsedStock === 0) dynamicStatus = 'Out of Stock';
  else if (parsedStock <= parsedThreshold) dynamicStatus = 'Low Stock';

  return (
    <form onSubmit={handleSubmit} noValidate className="animate-fade-in" id="product-form">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          {/* Product Name */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="product-name-input">
              <span>
                Product Name <span className="required-star">*</span>
              </span>
              <span className="form-hint">2 - 100 characters</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="product-name-input"
                name="name"
                className={`form-control ${touched.name && errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Dell XPS 15 High-Performance Laptop"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            {touched.name && errors.name && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="product-category-select">
              <span>
                Category <span className="required-star">*</span>
              </span>
              {!isCustomCategory && (
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setIsCustomCategory(true);
                    setFormData((prev) => ({ ...prev, category: '' }));
                  }}
                >
                  + New Category
                </button>
              )}
            </label>

            {!isCustomCategory ? (
              <select
                id="product-category-select"
                name="category"
                className={`form-select ${touched.category && errors.category ? 'is-invalid' : ''}`}
                value={formData.category}
                onChange={handleCategorySelectChange}
                onBlur={handleBlur}
              >
                <option value="">Select a category...</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Enter custom category...</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  id="custom-category-input"
                  className={`form-control ${touched.category && errors.category ? 'is-invalid' : ''}`}
                  placeholder="Enter new category name..."
                  value={customCategoryInput}
                  onChange={handleCustomCategoryInput}
                  onBlur={handleBlur}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData((prev) => ({
                      ...prev,
                      category: availableCategories[0] || '',
                    }));
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {touched.category && errors.category && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.category}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="form-label" htmlFor="product-price-input">
              <span>
                Unit Price ($) <span className="required-star">*</span>
              </span>
              <span className="form-hint">Must be &gt; 0</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              id="product-price-input"
              name="price"
              className={`form-control ${touched.price && errors.price ? 'is-invalid' : ''}`}
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.price && errors.price && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.price}</span>
              </div>
            )}
          </div>

          {/* Stock Quantity */}
          <div className="form-group">
            <label className="form-label" htmlFor="product-stock-input">
              <span>
                Initial Stock Quantity <span className="required-star">*</span>
              </span>
              <span className="form-hint">Non-negative integer (0+)</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              id="product-stock-input"
              name="stockQuantity"
              className={`form-control ${touched.stockQuantity && errors.stockQuantity ? 'is-invalid' : ''}`}
              placeholder="0"
              value={formData.stockQuantity}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.stockQuantity && errors.stockQuantity && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.stockQuantity}</span>
              </div>
            )}
          </div>

          {/* Configurable Low Stock Threshold */}
          <div className="form-group">
            <label className="form-label" htmlFor="product-threshold-input">
              <span>
                Min Stock Alert Threshold <span className="required-star">*</span>
              </span>
              <span className="form-hint">Alert triggers when ≤ threshold</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              id="product-threshold-input"
              name="minStockThreshold"
              className={`form-control ${touched.minStockThreshold && errors.minStockThreshold ? 'is-invalid' : ''}`}
              placeholder="5"
              value={formData.minStockThreshold}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.minStockThreshold && errors.minStockThreshold && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.minStockThreshold}</span>
              </div>
            )}
          </div>

          {/* Live Preview Bar */}
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Stock Status Preview:
              </span>
              <StockBadge customStatus={dynamicStatus} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Configured Low-Stock Level:
              </span>
              <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                ≤ {parsedThreshold} units
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total SKU Valuation:
              </span>
              <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono', fontSize: '1rem' }}>
                ${liveInventoryValue}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="product-desc-input">
              <span>
                Product Description <span className="required-star">*</span>
              </span>
              <span className="form-hint">Minimum 5 characters</span>
            </label>
            <textarea
              id="product-desc-input"
              name="description"
              rows={4}
              className={`form-textarea ${touched.description && errors.description ? 'is-invalid' : ''}`}
              placeholder="Detailed description of features, technical specs, condition, and warranty..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.description && errors.description && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          id="cancel-form-btn"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          id="submit-form-btn"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
              <span>{isEdit ? 'Updating Product...' : 'Adding Product...'}</span>
            </>
          ) : (
            <>
              <Check size={18} />
              <span>{isEdit ? 'Update Product' : 'Add Product'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
