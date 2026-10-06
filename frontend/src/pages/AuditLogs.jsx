import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
  X,
  ArrowRight,
  Shield,
  Laptop,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { getAuditLogs, getAuditLogStats } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'PRODUCT_CREATE', label: 'Product Created' },
  { value: 'PRODUCT_UPDATE', label: 'Product Updated' },
  { value: 'STOCK_UPDATE', label: 'Stock Changed' },
  { value: 'PRODUCT_DELETE', label: 'Product Deleted' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'USER_REGISTER', label: 'User Registered' },
  { value: 'USER_LOGOUT', label: 'User Logout' },
  { value: 'AUTH_FAILURE', label: 'Authentication Failure' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'Product', label: 'Product' },
  { value: 'User', label: 'User' },
  { value: 'Auth', label: 'Auth' },
];

const AuditLogs = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedAction, setSelectedAction] = useState(searchParams.get('action') || '');
  const [selectedEntity, setSelectedEntity] = useState(searchParams.get('entity') || '');
  const [datePreset, setDatePreset] = useState(searchParams.get('range') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  // Pagination details
  const [pagination, setPagination] = useState({
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15,
  });

  // Details Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch stats once
  const fetchStats = async () => {
    try {
      const res = await getAuditLogStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Failed to load audit stats:', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute dates based on preset
  const getDateRange = (preset) => {
    const now = new Date();
    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { startDate: start, endDate: '' };
    } else if (preset === '7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return { startDate: start, endDate: '' };
    } else if (preset === '30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      return { startDate: start, endDate: '' };
    }
    return { startDate: '', endDate: '' };
  };

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(datePreset);
      const params = {
        search: searchTerm,
        action: selectedAction,
        entityType: selectedEntity,
        startDate,
        endDate,
        page: currentPage,
        limit: 15,
      };

      const res = await getAuditLogs(params);
      if (res.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      addToast(err.message || 'Error loading audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedAction, selectedEntity, datePreset, currentPage, addToast]);

  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedAction) params.action = selectedAction;
    if (selectedEntity) params.entity = selectedEntity;
    if (datePreset !== 'all') params.range = datePreset;
    if (currentPage > 1) params.page = currentPage;

    setSearchParams(params, { replace: true });
    fetchLogs();
  }, [searchTerm, selectedAction, selectedEntity, datePreset, currentPage, fetchLogs, setSearchParams]);

  // Handlers
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleActionChange = (action) => {
    setSelectedAction(action);
    setCurrentPage(1);
  };

  const handleEntityChange = (entity) => {
    setSelectedEntity(entity);
    setCurrentPage(1);
  };

  const handleRangeChange = (range) => {
    setDatePreset(range);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAction('');
    setSelectedEntity('');
    setDatePreset('all');
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'PRODUCT_CREATE':
        return (
          <span className="status-badge in-stock" style={{ fontSize: '0.72rem' }}>
            <span className="dot" /> Created Product
          </span>
        );
      case 'STOCK_UPDATE':
        return (
          <span className="status-badge low-stock" style={{ fontSize: '0.72rem' }}>
            <span className="dot" /> Stock Changed
          </span>
        );
      case 'PRODUCT_UPDATE':
        return (
          <span
            className="status-badge"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.3)',
            }}
          >
            <span className="dot" style={{ background: '#38bdf8' }} /> Updated Product
          </span>
        );
      case 'PRODUCT_DELETE':
        return (
          <span className="status-badge out-of-stock" style={{ fontSize: '0.72rem' }}>
            <span className="dot" /> Deleted Product
          </span>
        );
      case 'USER_LOGIN':
        return (
          <span
            className="status-badge"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(129, 140, 248, 0.15)',
              color: '#818cf8',
              borderColor: 'rgba(129, 140, 248, 0.3)',
            }}
          >
            <span className="dot" style={{ background: '#818cf8' }} /> User Login
          </span>
        );
      case 'USER_REGISTER':
        return (
          <span
            className="status-badge"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(52, 211, 153, 0.15)',
              color: '#34d399',
              borderColor: 'rgba(52, 211, 153, 0.3)',
            }}
          >
            <span className="dot" style={{ background: '#34d399' }} /> Registered
          </span>
        );
      case 'USER_LOGOUT':
        return (
          <span
            className="status-badge"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(148, 163, 184, 0.12)',
              color: '#94a3b8',
              borderColor: 'rgba(148, 163, 184, 0.25)',
            }}
          >
            <span className="dot" style={{ background: '#94a3b8' }} /> User Logout
          </span>
        );
      case 'AUTH_FAILURE':
        return (
          <span
            className="status-badge"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              borderColor: '#ef4444',
            }}
          >
            <span className="dot" style={{ background: '#ef4444' }} /> Auth Failed
          </span>
        );
      default:
        return (
          <span className="status-badge in-stock" style={{ fontSize: '0.72rem' }}>
            {action}
          </span>
        );
    }
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedAction !== '' ||
    selectedEntity !== '' ||
    datePreset !== 'all';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={18} color="#818cf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', letterSpacing: '0.05em' }}>
              Security &amp; Compliance Center
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Immutable event history tracking authentication, product changes, and stock movements.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            fetchLogs();
            fetchStats();
          }}
          title="Refresh audit events"
          id="refresh-audit-logs-btn"
        >
          <RefreshCw size={15} />
          <span>Refresh Events</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Logged Events
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {stats.totalLogs.toLocaleString()}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Activity Today
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {stats.todayLogsCount.toLocaleString()}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Actors
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              {stats.uniqueActorsCount} Users
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filter-bar">
        {/* Search */}
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            id="audit-search-input"
            className="search-input"
            placeholder="Search by user, description, action..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            id="audit-action-filter"
            className="form-select"
            style={{ minWidth: '170px', padding: '8px 12px', fontSize: '0.85rem' }}
            value={selectedAction}
            onChange={(e) => handleActionChange(e.target.value)}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Filter */}
        <select
          id="audit-entity-filter"
          className="form-select"
          style={{ minWidth: '130px', padding: '8px 12px', fontSize: '0.85rem' }}
          value={selectedEntity}
          onChange={(e) => handleEntityChange(e.target.value)}
        >
          {ENTITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Date Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <select
            id="audit-date-filter"
            className="form-select"
            style={{ minWidth: '140px', padding: '8px 12px', fontSize: '0.85rem' }}
            value={datePreset}
            onChange={(e) => handleRangeChange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          <span>Active Filters:</span>
          {searchTerm && (
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              Search: "{searchTerm}"
            </span>
          )}
          {selectedAction && (
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              Action: {selectedAction}
            </span>
          )}
          {selectedEntity && (
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              Entity: {selectedEntity}
            </span>
          )}
          {datePreset !== 'all' && (
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              Range: {datePreset}
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.78rem',
              marginLeft: '4px',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Retrieving audit records..." />
      ) : logs.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching audit logs' : 'No audit events recorded'}
          description={
            hasActiveFilters
              ? 'No audit log entries matched your filter parameters. Try clearing filters.'
              : 'Audit events will appear here automatically when actions occur in the system.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="custom-table" id="audit-logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    {/* Timestamp */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>
                        {formatDate(log.createdAt)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        IP: {log.ipAddress || '127.0.0.1'}
                      </div>
                    </td>

                    {/* Actor */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background:
                              log.userRole === 'admin'
                                ? 'rgba(99, 102, 241, 0.2)'
                                : 'rgba(16, 185, 129, 0.2)',
                            color: log.userRole === 'admin' ? '#818cf8' : '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        >
                          {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                            {log.userName}
                          </div>
                          <div
                            style={{
                              fontSize: '0.68rem',
                              textTransform: 'uppercase',
                              color: log.userRole === 'admin' ? '#818cf8' : '#34d399',
                              fontWeight: 700,
                            }}
                          >
                            {log.userRole}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td>{getActionBadge(log.action)}</td>

                    {/* Entity Tag */}
                    <td>
                      <span className="product-category-tag">{log.entityType}</span>
                    </td>

                    {/* Description */}
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: '380px' }}>
                        {log.description}
                      </div>
                    </td>

                    {/* View Details Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-icon action-btn-view"
                        title="View Full Audit Snapshot"
                        onClick={() => setSelectedLog(log)}
                        id={`view-log-${log._id}`}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalProducts={pagination.totalLogs}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Audit Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Audit Event Details
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: {selectedLog._id}
                  </span>
                </div>
              </div>

              <button
                className="toast-close"
                onClick={() => setSelectedLog(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Event Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Timestamp:</span>
                  <strong style={{ color: '#ffffff' }}>{formatDate(selectedLog.createdAt)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Actor:</span>
                  <strong style={{ color: '#ffffff' }}>{selectedLog.userName} ({selectedLog.userRole})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Action:</span>
                  <div style={{ marginTop: '2px' }}>{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Client IP &amp; Entity:</span>
                  <strong style={{ color: '#38bdf8' }}>{selectedLog.ipAddress}</strong> • {selectedLog.entityType} {selectedLog.entityId ? `(#${selectedLog.entityId.slice(-6)})` : ''}
                </div>
              </div>

              {/* Narrative Description */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(14, 20, 36, 0.8)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  Event Narrative
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.4 }}>
                  {selectedLog.description}
                </div>
              </div>

              {/* Old vs New Data Snapshot Viewer */}
              {(selectedLog.oldData || selectedLog.newData) && (
                <div style={{ display: 'grid', gridTemplateColumns: selectedLog.oldData && selectedLog.newData ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  {selectedLog.oldData && (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Previous State (Old)
                      </div>
                      <pre
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '8px',
                          borderRadius: '4px',
                          overflowX: 'auto',
                          maxHeight: '180px',
                          fontFamily: 'JetBrains Mono',
                        }}
                      >
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.newData && (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Modified State (New)
                      </div>
                      <pre
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '8px',
                          borderRadius: '4px',
                          overflowX: 'auto',
                          maxHeight: '180px',
                          fontFamily: 'JetBrains Mono',
                        }}
                      >
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLog(null)}
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
