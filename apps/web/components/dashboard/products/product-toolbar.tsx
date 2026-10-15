'use client';

import * as React from 'react';
import SearchInput from '@/components/search-input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

interface ProductToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  stockFilter: string;
  setStockFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function ProductToolbar({
  searchQuery,
  setSearchQuery,
  stockFilter,
  setStockFilter,
  sortBy,
  setSortBy,
}: ProductToolbarProps) {
  return (
    <div className="bg-card border rounded-xl p-3 shadow-xs flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-4">
      <SearchInput
        label="Search products"
        placeholder="Search products by name..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md flex-1"
      />

      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          aria-label="Filter by stock status"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <NativeSelectOption value="all">All stock</NativeSelectOption>
          <NativeSelectOption value="instock">In stock</NativeSelectOption>
          <NativeSelectOption value="lowstock">Low stock (≤10)</NativeSelectOption>
          <NativeSelectOption value="outofstock">Out of stock</NativeSelectOption>
        </NativeSelect>
        <NativeSelect
          aria-label="Sort products"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <NativeSelectOption value="name-asc">Name: A to Z</NativeSelectOption>
          <NativeSelectOption value="name-desc">Name: Z to A</NativeSelectOption>
          <NativeSelectOption value="price-asc">Price: Low to High</NativeSelectOption>
          <NativeSelectOption value="price-desc">Price: High to Low</NativeSelectOption>
          <NativeSelectOption value="stock-asc">Stock: Low to High</NativeSelectOption>
          <NativeSelectOption value="stock-desc">Stock: High to Low</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  );
}
