'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiList,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { formatBDT, formatDate } from '@/lib/utils';

interface CowData {
  _id: string;
  tag: string;
  name: string;
  breed: string;
  purchaseDate: string;
  purchasePrice: number;
  weight?: number;
  image?: string;
  status: 'active' | 'sold';
  sellDate?: string;
  sellPrice?: number;
  dateOfBirth?: string;
}

type SortField = 'tag' | 'name' | 'purchaseDate' | 'purchasePrice' | 'weight';
type SortDir = 'asc' | 'desc';

export default function CowsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/cows?limit=500', fetcher, {
    revalidateOnFocus: true,
  });

  const cows: CowData[] = data?.cows || [];
  const loading = isLoading;
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [breedFilter, setBreedFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortField, setSortField] = useState<SortField>('purchaseDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast('Failed to load cows', 'error');
  }, [error, showToast]);

  const handleDelete = async (id: string, tag: string) => {
    if (!confirm(`Are you sure you want to delete cow ${tag}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/cows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Cow ${tag} deleted`);
        mutate();
      } else {
        showToast('Failed to delete cow', 'error');
      }
    } catch {
      showToast('Failed to delete cow', 'error');
    }
  };

  // Get unique breeds
  const allBreeds = useMemo(() => {
    const breeds = new Set<string>();
    cows.forEach((c) => {
      if (c.breed) breeds.add(c.breed);
    });
    return [...breeds].sort();
  }, [cows]);

  // Client-side filtering + sorting
  const filteredCows = useMemo(() => {
    let result = [...cows];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.tag.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.breed.toLowerCase().includes(q)
      );
    }

    // Breed filter
    if (breedFilter) {
      result = result.filter((c) => c.breed === breedFilter);
    }

    // Price range
    if (priceRange.min) {
      result = result.filter((c) => c.purchasePrice >= Number(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter((c) => c.purchasePrice <= Number(priceRange.max));
    }

    // Date range (purchase date)
    if (dateRange.start) {
      result = result.filter((c) => c.purchaseDate >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter((c) => c.purchaseDate.slice(0, 10) <= dateRange.end);
    }

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'tag') cmp = a.tag.localeCompare(b.tag);
      else if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortField === 'purchaseDate') cmp = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      else if (sortField === 'purchasePrice') cmp = a.purchasePrice - b.purchasePrice;
      else if (sortField === 'weight') cmp = (a.weight || 0) - (b.weight || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [cows, statusFilter, search, breedFilter, priceRange, dateRange, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const hasActiveFilters = breedFilter || priceRange.min || priceRange.max || dateRange.start || dateRange.end || search;

  const clearAllFilters = () => {
    setSearch('');
    setBreedFilter('');
    setPriceRange({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
    setStatusFilter('all');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <FiChevronDown size={12} className="text-surface-300" />;
    return sortDir === 'asc' ? (
      <FiChevronUp size={12} className="text-surface-700" />
    ) : (
      <FiChevronDown size={12} className="text-surface-700" />
    );
  };

  // Stats
  const totalValue = filteredCows.reduce((s, c) => s + c.purchasePrice, 0);
  const activeCows = filteredCows.filter((c) => c.status === 'active').length;
  const soldCows = filteredCows.filter((c) => c.status === 'sold').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cows</h1>
          <p className="text-surface-500 text-sm mt-1">
            {filteredCows.length} cow{filteredCows.length !== 1 ? 's' : ''} found
            {hasActiveFilters ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-surface-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-surface-0 shadow-sm text-surface-800' : 'text-surface-400'}`}
              title="Grid View"
            >
              <FiGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-surface-0 shadow-sm text-surface-800' : 'text-surface-400'}`}
              title="Table View"
            >
              <FiList size={16} />
            </button>
          </div>
          <Link href="/cows/add" className="btn-primary">
            <FiPlus size={16} />
            Add Cow
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Total</span>
          <p className="text-xl font-bold text-surface-900">{filteredCows.length}</p>
        </div>
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Active</span>
          <p className="text-xl font-bold text-primary-600">{activeCows}</p>
        </div>
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Sold</span>
          <p className="text-xl font-bold text-accent-600">{soldCows}</p>
        </div>
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Total Value</span>
          <p className="text-xl font-bold text-surface-800">{formatBDT(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col gap-3">
          {/* Row 1: Status + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
              {['all', 'active', 'sold'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    statusFilter === s
                      ? 'bg-surface-0 text-surface-800 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
              <input
                type="text"
                placeholder="Search by tag, name, or breed..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Advanced Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Breed */}
            {allBreeds.length > 0 && (
              <select
                value={breedFilter}
                onChange={(e) => setBreedFilter(e.target.value)}
                className="input w-auto text-xs py-1.5 px-3 min-w-[130px]"
              >
                <option value="">All Breeds</option>
                {allBreeds.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {/* Price Range */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <FiDollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400" size={12} />
                <input
                  type="number"
                  placeholder="Min price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                  className="input w-28 text-xs py-1.5 pl-6 pr-2"
                />
              </div>
              <span className="text-surface-300 text-xs">—</span>
              <div className="relative">
                <FiDollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400" size={12} />
                <input
                  type="number"
                  placeholder="Max price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                  className="input w-28 text-xs py-1.5 pl-6 pr-2"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <FiCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" size={12} />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))}
                  className="input w-auto text-xs py-1.5 pl-7 pr-2"
                  title="Purchased from"
                />
              </div>
              <span className="text-surface-300 text-xs">→</span>
              <div className="relative">
                <FiCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" size={12} />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
                  className="input w-auto text-xs py-1.5 pl-7 pr-2"
                  title="Purchased to"
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={`${sortField}-${sortDir}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split('-');
                setSortField(f as SortField);
                setSortDir(d as SortDir);
              }}
              className="input w-auto text-xs py-1.5 px-3 min-w-[150px]"
            >
              <option value="purchaseDate-desc">Newest First</option>
              <option value="purchaseDate-asc">Oldest First</option>
              <option value="purchasePrice-desc">Price: High→Low</option>
              <option value="purchasePrice-asc">Price: Low→High</option>
              <option value="tag-asc">Tag: A→Z</option>
              <option value="name-asc">Name: A→Z</option>
              <option value="weight-desc">Heaviest First</option>
            </select>

            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="btn-ghost text-xs gap-1 text-surface-400 hover:text-surface-600 py-1.5">
                <FiX size={12} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredCows.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCows.map((cow) => (
              <div key={cow._id} className="card-hover overflow-hidden group">
                <div className="relative h-44 bg-surface-100 overflow-hidden">
                  {cow.image ? (
                    <Image
                      src={cow.image}
                      alt={cow.tag}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GiCow className="text-surface-300" size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={cow.status === 'active' ? 'badge-active' : 'badge-sold'}>
                      {cow.status === 'active' ? '● Active' : '● Sold'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-surface-900">{cow.tag}</h3>
                      {cow.name && <p className="text-sm text-surface-500">{cow.name}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-surface-500">
                    {cow.breed && <p>Breed: {cow.breed}</p>}
                    <p>Bought: {formatDate(cow.purchaseDate)}</p>
                    <p className="font-medium text-surface-700">Price: {formatBDT(cow.purchasePrice)}</p>
                    {cow.weight && <p>Weight: {cow.weight} kg</p>}
                    {cow.status === 'sold' && cow.sellPrice && (
                      <p className="font-medium text-accent-600">Sold: {formatBDT(cow.sellPrice)}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-surface-100">
                    <Link href={`/cows/${cow._id}`} className="btn-ghost flex-1 text-xs py-2">
                      <FiEye size={14} /> View
                    </Link>
                    <Link href={`/cows/${cow._id}/edit`} className="btn-ghost flex-1 text-xs py-2">
                      <FiEdit2 size={14} /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(cow._id, cow.tag)}
                      className="btn-ghost flex-1 text-xs py-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="table-container">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">
                      <button onClick={() => handleSort('tag')} className="flex items-center gap-1 hover:text-surface-700">
                        Tag <SortIcon field="tag" />
                      </button>
                    </th>
                    <th className="whitespace-nowrap">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-surface-700">
                        Name <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="whitespace-nowrap">Breed</th>
                    <th className="whitespace-nowrap">Status</th>
                    <th className="whitespace-nowrap">
                      <button onClick={() => handleSort('purchaseDate')} className="flex items-center gap-1 hover:text-surface-700">
                        Purchased <SortIcon field="purchaseDate" />
                      </button>
                    </th>
                    <th className="text-right whitespace-nowrap">
                      <button onClick={() => handleSort('purchasePrice')} className="flex items-center gap-1 ml-auto hover:text-surface-700">
                        Price <SortIcon field="purchasePrice" />
                      </button>
                    </th>
                    <th className="text-right whitespace-nowrap">
                      <button onClick={() => handleSort('weight')} className="flex items-center gap-1 ml-auto hover:text-surface-700">
                        Weight <SortIcon field="weight" />
                      </button>
                    </th>
                    <th className="text-right whitespace-nowrap">Sold Price</th>
                    <th className="text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCows.map((cow) => (
                    <tr key={cow._id}>
                      <td className="font-bold text-surface-900 whitespace-nowrap">{cow.tag}</td>
                      <td className="whitespace-nowrap">{cow.name || '—'}</td>
                      <td className="whitespace-nowrap">{cow.breed || '—'}</td>
                      <td className="whitespace-nowrap">
                        <span className={cow.status === 'active' ? 'badge-active' : 'badge-sold'}>
                          {cow.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{formatDate(cow.purchaseDate)}</td>
                      <td className="text-right font-medium whitespace-nowrap">{formatBDT(cow.purchasePrice)}</td>
                      <td className="text-right whitespace-nowrap">{cow.weight ? `${cow.weight} kg` : '—'}</td>
                      <td className="text-right whitespace-nowrap">
                        {cow.status === 'sold' && cow.sellPrice ? (
                          <span className="font-medium text-accent-600">{formatBDT(cow.sellPrice)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex gap-1 justify-end">
                          <Link href={`/cows/${cow._id}`} className="btn-ghost p-2">
                            <FiEye size={14} />
                          </Link>
                          <Link href={`/cows/${cow._id}/edit`} className="btn-ghost p-2">
                            <FiEdit2 size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(cow._id, cow.tag)}
                            className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-50">
                    <td colSpan={5} className="text-right font-semibold text-surface-600 text-sm">
                      Total ({filteredCows.length} cows)
                    </td>
                    <td className="text-right font-bold text-surface-800">{formatBDT(totalValue)}</td>
                    <td />
                    <td className="text-right font-bold text-accent-600">
                      {formatBDT(filteredCows.reduce((s, c) => s + (c.sellPrice || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="empty-state">
          <GiCow className="text-surface-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-surface-600 mb-1">No cows found</h3>
          <p className="text-sm text-surface-400 mb-4">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Start by adding your first cow'}
          </p>
          {hasActiveFilters ? (
            <button onClick={clearAllFilters} className="btn-secondary">
              <FiX size={16} />
              Clear Filters
            </button>
          ) : (
            <Link href="/cows/add" className="btn-primary">
              <FiPlus size={16} />
              Add Your First Cow
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
