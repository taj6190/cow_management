'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { fetcher } from '@/lib/fetcher';
import { formatBDT, formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiGrid,
  FiList,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';
import useSWR from 'swr';

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
    dedupingInterval: 10000,
    revalidateOnReconnect: true,
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
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; cowId: string; tag: string; sellPrice: string }>({
    isOpen: false, cowId: '', tag: '', sellPrice: ''
  });

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

  const handleStatusDropdownChange = (id: string, tag: string, newStatus: string) => {
    if (newStatus === 'sold') {
      setStatusModal({ isOpen: true, cowId: id, tag, sellPrice: '' });
    } else {
      if (confirm(`Are you sure you want to change ${tag}'s status to Active?`)) {
        updateStatus(id, 'active');
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string, sellPrice?: number) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'sold') {
        payload.sellPrice = sellPrice;
        payload.sellDate = new Date().toISOString().split('T')[0];
      } else {
        payload.$unset = { sellPrice: 1, sellDate: 1 };
      }

      const res = await fetch(`/api/cows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Status updated successfully');
        mutate();
        setStatusModal({ isOpen: false, cowId: '', tag: '', sellPrice: '' });
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Failed to update status', 'error');
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
          <Link href="/cows/add" className="btn-primary whitespace-nowrap">
            <FiPlus size={16} />
            <span className="hidden sm:inline">Add Cow</span>
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${statusFilter === s
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
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 items-center hide-scrollbar sm:flex-wrap sm:pb-0 w-full sm:w-auto">
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
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GiCow className="text-surface-300" size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={cow.status === 'active' ? 'badge-active' : 'badge-sold'}>
                      {cow.status === 'active' ? '● Active' : '● বিক্রি হয়েছে'}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1 bg-white">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {cow.name ? (
                        <>
                          <h3 className="font-bold text-[17px] text-surface-900 leading-tight">{cow.name}</h3>
                          <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-surface-100/70 border border-surface-200">
                            <span className="text-[10px] text-surface-500 uppercase font-semibold">Tag</span>
                            <span className="text-xs font-bold text-surface-800">{cow.tag}</span>
                          </div>
                        </>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100/70 border border-surface-200">
                          <span className="text-[10px] text-surface-500 uppercase font-semibold">Tag</span>
                          <span className="text-sm font-bold text-surface-800">{cow.tag}</span>
                        </div>
                      )}
                    </div>
                    {cow.weight && (
                      <div className="flex flex-col items-end justify-center bg-surface-50 px-2.5 py-1.5 rounded-lg border border-surface-100 shadow-sm">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Weight</span>
                        <span className="text-sm font-bold text-surface-800">{cow.weight} <span className="text-xs text-surface-500 font-medium">kg</span></span>
                      </div>
                    )}
                  </div>

                  {/* Info List */}
                  <div className="flex flex-col mt-auto">
                    {cow.breed && (
                      <div className="flex justify-between items-center text-sm border-b border-surface-100/70 pb-1.5 mb-1.5">
                        <span className="text-surface-500 text-xs font-medium">জাত (Breed)</span>
                        <span className="font-semibold text-surface-800 text-xs">{cow.breed}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm border-b border-surface-100/70 pb-1.5 mb-3">
                      <span className="text-surface-500 text-xs font-medium">ক্রয় তারিখ (Date)</span>
                      <span className="font-semibold text-surface-800 text-xs">{formatDate(cow.purchaseDate)}</span>
                    </div>

                    {/* Price section */}
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex justify-between items-center bg-gradient-to-r from-primary-50 to-primary-100/40 px-3 py-2 rounded-lg border border-primary-100/50">
                        <span className="text-primary-700/80 text-xs font-bold">ক্রয়মূল্য</span>
                        <span className="text-primary-700 font-bold text-sm">{formatBDT(cow.purchasePrice)}</span>
                      </div>

                      {cow.status === 'sold' && cow.sellPrice && (
                        <div className="flex justify-between items-center bg-gradient-to-r from-accent-50 to-accent-100/40 px-3 py-2 rounded-lg border border-accent-100/50">
                          <span className="text-accent-700/80 text-xs font-bold">বিক্রয়মূল্য</span>
                          <span className="text-accent-700 font-bold text-sm">{formatBDT(cow.sellPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-3 border-t border-surface-100">
                    <Link href={`/cows/${cow._id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-50 text-surface-700 hover:bg-surface-100 hover:text-surface-900 hover:shadow-sm transition-all text-xs font-bold">
                      <FiEye size={14} className="text-surface-500" /> View
                    </Link>
                    <Link href={`/cows/${cow._id}/edit`} className="flex items-center justify-center w-10 rounded-lg bg-surface-50 text-surface-600 hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm transition-all" title="Edit">
                      <FiEdit2 size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(cow._id, cow.tag)}
                      className="flex items-center justify-center w-10 rounded-lg bg-surface-50 text-surface-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
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
                    <th className="whitespace-nowrap hidden sm:table-cell">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-surface-700">
                        Name <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="whitespace-nowrap hidden md:table-cell">Breed</th>
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
                    <th className="text-right whitespace-nowrap hidden sm:table-cell">
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
                      <td className="whitespace-nowrap hidden sm:table-cell">{cow.name || '—'}</td>
                      <td className="whitespace-nowrap hidden md:table-cell">{cow.breed || '—'}</td>
                      <td className="whitespace-nowrap">
                        <select
                          value={cow.status}
                          onChange={(e) => handleStatusDropdownChange(cow._id, cow.tag, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border-0 cursor-pointer focus:ring-2 focus:outline-none transition-colors ${cow.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                              : 'bg-accent-100 text-accent-700 hover:bg-accent-200 focus:ring-accent-500'
                            }`}
                        >
                          <option value="active" className="font-semibold text-surface-900">Active</option>
                          <option value="sold" className="font-semibold text-surface-900">Sold</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap">{formatDate(cow.purchaseDate)}</td>
                      <td className="text-right font-medium whitespace-nowrap">{formatBDT(cow.purchasePrice)}</td>
                      <td className="text-right whitespace-nowrap hidden sm:table-cell">{cow.weight ? `${cow.weight} kg` : '—'}</td>
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

      {/* Premium Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity" onClick={() => setStatusModal({ ...statusModal, isOpen: false })} />

          <div className="relative bg-surface-0 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in border border-surface-100">
            {/* Top decorative gradient */}
            <div className="h-2 w-full bg-gradient-to-r from-accent-400 to-accent-600" />

            <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className="absolute top-4 right-4 p-2 bg-surface-50 rounded-full text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
              <FiX size={18} />
            </button>

            <div className="p-8 pt-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-50 to-accent-100 border-4 border-white shadow-sm rounded-full flex items-center justify-center mb-5">
                <FiDollarSign className="text-accent-600" size={28} />
              </div>

              <h3 className="font-bold text-2xl text-surface-900 mb-2">Mark Cow as Sold</h3>
              <p className="text-surface-500 mb-8 text-sm">
                You are about to finalize the sale for <span className="font-bold text-surface-800 px-2 py-0.5 bg-surface-100 rounded-md mx-0.5">{statusModal.tag}</span>.
                <br />Please enter the final selling price below.
              </p>

              <div className="w-full mb-8">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-surface-400 font-bold text-xl">৳</span>
                  </div>
                  <input
                    type="number"
                    autoFocus
                    required
                    value={statusModal.sellPrice}
                    onChange={(e) => setStatusModal({ ...statusModal, sellPrice: e.target.value })}
                    className="block w-full pl-10 pr-4 py-4 text-center text-3xl font-black text-surface-900 bg-surface-50 border-2 border-surface-200 rounded-2xl focus:ring-0 focus:border-accent-500 transition-colors placeholder:text-surface-300 placeholder:font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="w-full flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-surface-600 bg-surface-100 hover:bg-surface-200 hover:text-surface-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatus(statusModal.cowId, 'sold', Number(statusModal.sellPrice))}
                  disabled={!statusModal.sellPrice || Number(statusModal.sellPrice) <= 0}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 shadow-lg shadow-accent-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Confirm Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
