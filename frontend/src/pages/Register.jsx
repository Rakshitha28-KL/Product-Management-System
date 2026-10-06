import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Lock,
  Shield,
  UserCheck,
  CheckCircle2,
  Boxes,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateField = (field, value) => {
    let err = '';
    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) {
          err = 'Full name is required';
        } else if (value.trim().length < 2) {
          err = 'Name must be at least 2 characters long';
        }
        break;

      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value || value.trim().length === 0) {
          err = 'Email address is required';
        } else if (!emailRegex.test(value.trim())) {
          err = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (!value) {
          err = 'Password is required';
        } else if (value.length < 6) {
          err = 'Password must be at least 6 characters long';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          err = 'Please confirm your password';
        } else if (value !== formData.password) {
          err = 'Passwords do not match';
        }
        break;

      case 'role':
        if (!value) {
          err = 'Role selection is required';
        }
        break;

      default:
        break;
    }
    return err;
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((f) => {
      const e = validateField(f, formData[f]);
      if (e) newErrors[f] = e;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (apiError) setApiError('');

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }

    // Live check for confirmPassword when password changes
    if (name === 'password' && touched.confirmPassword) {
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true,
    });

    if (!validateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError('');
      const authUser = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
      });

      addToast(`Account created successfully! Welcome, ${authUser.name}.`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      setApiError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 10%, rgba(79, 70, 229, 0.15) 0%, var(--bg-main) 70%)',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Boxes size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            Create New Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Register as an Administrator or Inventory Staff member
          </p>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              <span>Full Name <span className="required-star">*</span></span>
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                id="reg-name"
                name="name"
                className={`form-control ${touched.name && errors.name ? 'is-invalid' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="e.g. Alex Morgan"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
            {touched.name && errors.name && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              <span>Email Address <span className="required-star">*</span></span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="email"
                id="reg-email"
                name="email"
                className={`form-control ${touched.email && errors.email ? 'is-invalid' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
            {touched.email && errors.email && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">
              <span>Select Account Role <span className="required-star">*</span></span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: formData.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                  border: `1px solid ${formData.role === 'admin' ? 'var(--primary-light)' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--primary-light)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>Admin</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Full CRUD & Delete</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: formData.role === 'staff' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                  border: `1px solid ${formData.role === 'staff' ? '#34d399' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="staff"
                  checked={formData.role === 'staff'}
                  onChange={handleChange}
                  style={{ accentColor: '#10b981' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>Staff</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View, Search, Edit</div>
                </div>
              </label>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              <span>Password <span className="required-star">*</span></span>
              <span className="form-hint">Min 6 characters</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="password"
                id="reg-password"
                name="password"
                className={`form-control ${touched.password && errors.password ? 'is-invalid' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
            {touched.password && errors.password && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" htmlFor="reg-confirm-password">
              <span>Confirm Password <span className="required-star">*</span></span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="password"
                id="reg-confirm-password"
                name="confirmPassword"
                className={`form-control ${touched.confirmPassword && errors.confirmPassword ? 'is-invalid' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="••••••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="invalid-feedback">
                <AlertCircle size={14} />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={isSubmitting}
            id="register-submit-btn"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Navigation to Login */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'underline' }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
