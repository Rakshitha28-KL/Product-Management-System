import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  LayoutGrid,
  List,
  RefreshCw,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { getProducts, getCategories, deleteProduct } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import SortDropdown from '../components/SortDropdown';
import ProductTable from '../components/ProductTable';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import DeleteConfirmation from '../components/DeleteConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StockUpdateModal from '../components/StockUpdateModal';

const Products = () => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management for filters and pagination
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Query state initialized from URL params if present
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  // Pagination details
  const [pagination, setPagination] = useState({
    totalProducts: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stock update modal state
  const [productForStock, setProductForStock] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const res = await getCategories();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategoryList();
  }, []);

  // Fetch products based on current search, category, sort, and page
  const fetchProductList = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        category: selectedCategory,
        sort: sortBy,
        page: currentPage,
        limit: 10,
      };

      const res = await getProducts(params);
      if (res.success) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      addToast(err.message || 'Error loading product list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, sortBy, currentPage, addToast]);

  // Synchronize URL search params with state
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    if (sortBy && sortBy !== 'newest') params.sort = sortBy;
    if (currentPage > 1) params.page = currentPage;

    setSearchParams(params, { replace: true });
    fetchProductList();
  }, [searchTerm, selectedCategory, sortBy, currentPage, fetchProductList, setSearchParams]);

  // Handlers
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1); // reset to page 1 on new search
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSortChange = (sortVal) => {
    setSortBy(sortVal);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDeleteModal = (product) => {
    if (!isAdmin) {
      addToast('Permission Denied: Only Administrator accounts can delete inventory items.', 'warning');
      return;
    }
    setProductToDelete(product);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setProductToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteProduct(productToDelete._id);
      if (res.success) {
        addToast(`Product "${productToDelete.name}" deleted successfully!`, 'success');
        setProductToDelete(null);
        // Refresh product list and categories
        fetchProductList();
        const catRes = await getCategories();
        if (catRes.success) setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      addToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== '' || sortBy !== 'newest';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleOpenStockModal = (product) => {
    setProductForStock(product);
    setIsStockModalOpen(true);
  };

  const handleStockSuccess = (updatedProduct) => {
    addToast(`Stock for ${updatedProduct.name} updated to ${updatedProduct.stockQuantity} units!`, 'success');
    setIsStockModalOpen(false);
    setProductForStock(null);
    fetchProductList();
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
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
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '4px' }}>
            Product Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Search, filter, update, and manage your inventory items and stock levels.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchProductList}
            title="Refresh list"
            id="refresh-products-btn"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <Link to="/products/new" className="btn btn-primary" id="add-product-btn">
              <Plus size={16} />
              <span>Add Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Search input */}
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder="Search by product name..."
        />

        {/* Dynamic Category filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onChange={handleCategoryChange}
        />

        {/* Sort dropdown */}
        <SortDropdown value={sortBy} onChange={handleSortChange} />

        {/* View Mode Toggle (Table / Grid) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: '2px',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            className={`btn-icon ${viewMode === 'table' ? 'btn-primary' : ''}`}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
            }}
            onClick={() => setViewMode('table')}
            title="Table View"
            id="table-view-btn"
          >
            <List size={18} />
          </button>

          <button
            type="button"
            className={`btn-icon ${viewMode === 'grid' ? 'btn-primary' : ''}`}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
            }}
            onClick={() => setViewMode('grid')}
            title="Card Grid View"
            id="grid-view-btn"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Active Filter Chips / Reset */}
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
          {selectedCategory && (
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              Category: {selectedCategory}
            </span>
          )}
          {sortBy !== 'newest' && (
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              Sort: {sortBy}
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
            id="clear-all-filters-btn"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner message="Fetching matching products..." />
      ) : products.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No products found' : 'No products available'}
          description={
            hasActiveFilters
              ? 'No products matched your search or category filter. Try clearing filters.'
              : 'Your inventory is currently empty. Add your first product to get started.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : isAdmin ? 'Add Product' : undefined}
          actionLink={hasActiveFilters ? undefined : isAdmin ? '/products/new' : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <>
          {viewMode === 'table' ? (
            <ProductTable
              products={products}
              onDeleteClick={handleOpenDeleteModal}
              onStockAdjustClick={handleOpenStockModal}
            />
          ) : (
            <div className="products-card-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onDeleteClick={handleOpenDeleteModal}
                  onStockAdjustClick={handleOpenStockModal}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalProducts={pagination.totalProducts}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Stock Adjustment Modal */}
      {productForStock && (
        <StockUpdateModal
          isOpen={isStockModalOpen}
          product={productForStock}
          onClose={() => {
            setIsStockModalOpen(false);
            setProductForStock(null);
          }}
          onSuccess={handleStockSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isAdmin && (
        <DeleteConfirmation
          isOpen={!!productToDelete}
          product={productToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteModal}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default Products;
