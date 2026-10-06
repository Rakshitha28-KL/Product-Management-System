import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, onClear, placeholder = 'Search products by name...' }) => {
  return (
    <div className="search-input-wrap">
      <Search size={18} className="search-icon" />
      <input
        type="text"
        id="product-search-input"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={onClear}
          aria-label="Clear search input"
          id="clear-search-button"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
