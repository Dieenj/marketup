'use client';

import * as React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    <div className="bg-white border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-10 pr-12 h-10 border-border/60 bg-muted/20 hover:bg-muted/10 focus:bg-white rounded-xl transition-all duration-200 placeholder:text-muted-foreground/60 w-full focus-visible:ring-1 focus-visible:ring-zinc-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground text-[10px] font-semibold bg-muted/50 hover:bg-muted px-1.5 py-0.5 rounded-md transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Lọc theo kho */}
        <div className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-xl px-3 py-1.5">
          <span className="text-xs text-muted-foreground font-semibold">Stock:</span>
          <select
            value={stockFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStockFilter(e.target.value)}
            aria-label="Filter by stock status"
            className="bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer pr-1 outline-none text-foreground"
          >
            <option value="all">All Status</option>
            <option value="instock">In Stock</option>
            <option value="lowstock">Low Stock (≤10)</option>
            <option value="outofstock">Out of Stock</option>
          </select>
        </div>

        {/* Sắp xếp */}
        <div className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-xl px-3 py-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer pr-1 outline-none text-foreground"
          >
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-asc">Stock: Low to High</option>
            <option value="stock-desc">Stock: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
