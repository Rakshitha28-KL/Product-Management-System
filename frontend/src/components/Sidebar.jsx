import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  Database,
  ShieldCheck,
  LogOut,
  User,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    closeSidebar();
    logout();
    addToast('You have been logged out successfully.', 'info');
    navigate('/login');
  };

  const isUserAdmin = (user?.role || '').toLowerCase() === 'admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 95 }}
          onClick={closeSidebar}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div
          style={{
            padding: '1.5rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div className="brand-icon-box">
            <Boxes size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Inventory OS
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              v1.0.0 • RBAC &amp; Audit Active
            </span>
          </div>
        </div>

        {/* User Role Card in Sidebar */}
        {user && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isUserAdmin ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${isUserAdmin ? '#818cf8' : '#34d399'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isUserAdmin ? '#818cf8' : '#34d399',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: isUserAdmin ? '#818cf8' : '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
                  {user.role} Account
                </div>
              </div>
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="sidebar-heading">Navigation</div>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link-item ${isActive ? 'active' : ''}`
            }
            onClick={closeSidebar}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/products"
            end
            className={({ isActive }) =>
              `nav-link-item ${isActive ? 'active' : ''}`
            }
            onClick={closeSidebar}
          >
            <Package size={18} />
            <span>All Products</span>
          </NavLink>

          {isUserAdmin && (
            <NavLink
              to="/products/new"
              className={({ isActive }) =>
                `nav-link-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
              id="sidebar-add-product-link"
            >
              <PlusCircle size={18} />
              <span>Add Product</span>
            </NavLink>
          )}

          {isUserAdmin && (
            <NavLink
              to="/audit-logs"
              className={({ isActive }) =>
                `nav-link-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
              id="sidebar-audit-logs-link"
            >
              <ClipboardList size={18} />
              <span>Audit Logs</span>
            </NavLink>
          )}

          <div className="sidebar-heading" style={{ marginTop: '1.5rem' }}>
            System Security
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <Database size={14} color="#34d399" />
              <span>MongoDB Connected</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <ShieldCheck size={14} color="#818cf8" />
              <span>Audit Logging Active</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Product &amp; Inventory System
          </span>
          <span>Security &amp; Audit Compliance</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
