import React from 'react';
import { Filter } from 'lucide-react';

const CategoryFilter = ({ categories = [], selectedCategory = '', onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Filter size={16} color="var(--text-muted)" />
      <select
        id="category-filter-select"
        className="form-select"
        style={{ minWidth: '170px', padding: '8px 12px', fontSize: '0.85rem' }}
        value={selectedCategory}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
