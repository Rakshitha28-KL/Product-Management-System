import React from 'react';
import { Menu, Plus, PackageCheck, Layers, LogOut, User, Shield, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logoutApi } from '../services/api';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { addToast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // Continue client-side logout
    }
    logout();
    addToast('You have been logged out successfully.', 'info');
    navigate('/login');
  };

  const roleName = (user?.role || 'staff').toLowerCase();
  const isUserAdmin = roleName === 'admin';

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn-icon"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
          style={{ display: 'flex' }}
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
          <div className="brand-icon-box">
            <PackageCheck size={22} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>Product Management & Inventory</span>
            <span className="brand-badge">CSE Pro</span>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/products" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
          <Layers size={16} />
          <span>Catalog</span>
        </Link>

        {isUserAdmin && (
          <Link to="/audit-logs" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }} id="nav-audit-logs-btn">
            <ClipboardList size={16} />
            <span>Audit Logs</span>
          </Link>
        )}

        {isUserAdmin && (
          <Link to="/products/new" className="btn btn-primary btn-sm" style={{ display: 'inline-flex' }} id="nav-add-product-btn">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        )}

        {/* User Profile Badge & Logout */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '12px',
              borderLeft: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isUserAdmin ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${isUserAdmin ? '#818cf8' : '#34d399'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isUserAdmin ? '#818cf8' : '#34d399',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isUserAdmin ? '#818cf8' : '#34d399',
                  }}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-icon"
              onClick={handleLogout}
              title="Sign Out"
              id="logout-btn"
              style={{ marginLeft: '4px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
