'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

const ITEMS_PER_PAGE = 10;
import Link from 'next/link';
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiArrowUpRight,
  FiArrowDownRight,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiCalendar,
} from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { formatBDT, formatDate } from '@/lib/utils';

interface TransactionData {
  _id: string;
  type: 'income' | 'expense' | 'investment';
  category: string;
  amount: number;
  date: string;
  description: string;
  isShared: boolean;
  cowId?: { _id: string; tag: string; name: string };
  paidBy?: { _id: string; name: string };
  createdByName?: string;
  updatedByName?: string;
}

type SortField = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

/* ─── Transaction Table ─── */
function TransactionTable({
  transactions,
  type,
  sortField,
  sortDir,
  onSort,
  onDelete,
  searchTerm,
  categoryFilter,
  setCategoryFilter,
  dateRange,
  setDateRange,
  allCategories,
}: {
  transactions: TransactionData[];
  type: 'income' | 'expense' | 'investment';
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (v: { start: string; end: string }) => void;
  allCategories: string[];
}) {
  const isIncome = type === 'income';
  const isInvestment = type === 'investment';
  const color = isIncome ? 'green' : isInvestment ? 'accent' : 'red';
  const Icon = isIncome ? FiArrowUpRight : isInvestment ? FiArrowUpRight : FiArrowDownRight;
  const label = isIncome ? 'Income' : isInvestment ? 'Fixed Investments' : 'Expenses';

  const filtered = useMemo(() => {
    let result = transactions.filter((t) => t.type === type);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.cowId?.tag || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter) result = result.filter((t) => t.category === categoryFilter);
    if (dateRange.start) result = result.filter((t) => t.date >= dateRange.start);
    if (dateRange.end) result = result.filter((t) => t.date.slice(0, 10) <= dateRange.end);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, type, searchTerm, categoryFilter, dateRange, sortField, sortDir]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const hasFilters = categoryFilter || dateRange.start || dateRange.end;

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, categoryFilter, dateRange, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <FiChevronDown size={12} className="text-surface-300 hidden sm:block" />;
    return sortDir === 'asc' ? <FiChevronUp size={12} className="text-surface-700" /> : <FiChevronDown size={12} className="text-surface-700" />;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`text-${color}-600`} size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-surface-900">{label}</h2>
            <p className="text-[11px] text-surface-400">
              {filtered.length} entries • <span className={`font-semibold text-${color}-600`}>{formatBDT(total)}</span>
            </p>
          </div>
        </div>
        {hasFilters && (
          <button onClick={() => { setCategoryFilter(''); setDateRange({ start: '', end: '' }); }} className="text-xs text-surface-400 hover:text-surface-600 flex items-center gap-1">
            <FiX size={12} /> Clear
          </button>
        )}
      </div>

      {/* Inline Filters - scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-auto text-xs py-1.5 px-2 min-w-[110px] shrink-0"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex items-center gap-1 shrink-0">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input w-[130px] text-xs py-1.5 px-2"
          />
          <span className="text-surface-300 text-xs">→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input w-[130px] text-xs py-1.5 px-2"
          />
        </div>
      </div>

      {/* Table / Cards */}
      {filtered.length > 0 ? (
        <>
          {/* Full Table View for All Devices */}
          <div className="table-container">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="whitespace-nowrap"><button onClick={() => onSort('date')} className="flex items-center gap-1">Date <SortIcon field="date" /></button></th>
                    <th className="whitespace-nowrap"><button onClick={() => onSort('category')} className="flex items-center gap-1">Category <SortIcon field="category" /></button></th>
                    <th className="min-w-[150px]">Description</th>
                    <th className="whitespace-nowrap">Cow</th>
                    <th className="whitespace-nowrap">Last Touched By</th>
                    <th className="text-right whitespace-nowrap"><button onClick={() => onSort('amount')} className="flex items-center gap-1 ml-auto">Amount <SortIcon field="amount" /></button></th>
                    <th className="text-right w-20 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {paginated.map((t) => (
                    <tr key={t._id}>
                      <td className="whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="whitespace-nowrap"><span className={`badge bg-${color}-50 text-${color}-700`}>{t.category}</span></td>
                      <td className="max-w-[150px] sm:max-w-[180px] truncate text-surface-600">{t.description || '—'}</td>
                      <td>
                        {t.cowId ? (
                          <Link href={`/cows/${t.cowId._id}`} className="text-primary-600 hover:underline text-sm">{t.cowId.tag}</Link>
                        ) : (
                          <span className="text-surface-400 text-xs">{t.isShared ? 'Shared' : '—'}</span>
                        )}
                      </td>
                      <td className="text-xs text-surface-400">
                        {t.updatedByName ? (
                          <span title="Edited by">{t.updatedByName} <span className="text-[10px] text-surface-300">(edit)</span></span>
                        ) : (
                          t.createdByName || '—'
                        )}
                      </td>
                      <td className={`text-right font-semibold whitespace-nowrap text-${color}-600`}>
                        {isIncome ? '+' : '-'}{formatBDT(t.amount)}
                      </td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <Link href={`/transactions/${t._id}/edit`} className="btn-ghost p-1.5"><FiEdit2 size={14} /></Link>
                          <button onClick={() => onDelete(t._id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-50">
                    <td colSpan={5} className="text-right font-semibold text-surface-600 text-sm">Total</td>
                    <td className={`text-right font-bold text-${color}-600`}>{isIncome ? '+' : '-'}{formatBDT(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>


          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-surface-400">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100 border border-surface-200'
                        }`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card py-8 text-center">
          <Icon className="mx-auto text-surface-300 mb-2" size={28} />
          <p className="text-sm text-surface-400">
            {hasFilters || searchTerm ? `No matching ${type} transactions` : `No ${type} transactions yet`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function TransactionsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/transactions?limit=500', fetcher, {
    revalidateOnFocus: true,
  });

  const transactions: TransactionData[] = data?.transactions || [];
  const summary = data?.summary || { totalIncome: 0, totalExpense: 0 };
  const loading = isLoading;
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'investment'>('expense');
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [expenseCatFilter, setExpenseCatFilter] = useState('');
  const [incomeCatFilter, setIncomeCatFilter] = useState('');
  const [investmentCatFilter, setInvestmentCatFilter] = useState('');
  const [expenseDateRange, setExpenseDateRange] = useState({ start: '', end: '' });
  const [incomeDateRange, setIncomeDateRange] = useState({ start: '', end: '' });
  const [investmentDateRange, setInvestmentDateRange] = useState({ start: '', end: '' });
  const [expenseSort, setExpenseSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'date', dir: 'desc' });
  const [incomeSort, setIncomeSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'date', dir: 'desc' });
  const [investmentSort, setInvestmentSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'date', dir: 'desc' });
  const [quickPreset, setQuickPreset] = useState('all');

  useEffect(() => {
    if (error) showToast('Failed to load transactions', 'error');
  }, [error, showToast]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Deleted'); mutate(); }
    } catch { showToast('Failed', 'error'); }
  };

  const toggleSort = (setter: typeof setExpenseSort) => (field: SortField) => {
    setter((prev) => ({ field, dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc' }));
  };

  // Unique categories and owners from data
  const expenseCategories = useMemo(() => [...new Set(transactions.filter((t) => t.type === 'expense').map((t) => t.category))].sort(), [transactions]);
  const incomeCategories = useMemo(() => [...new Set(transactions.filter((t) => t.type === 'income').map((t) => t.category))].sort(), [transactions]);
  const investmentCategories = useMemo(() => [...new Set(transactions.filter((t) => t.type === 'investment').map((t) => t.category))].sort(), [transactions]);

  const applyQuickPreset = (preset: string) => {
    setQuickPreset(preset);
    const now = new Date();
    let start = '', end = '';
    if (preset === 'today') { start = end = now.toISOString().split('T')[0]; }
    else if (preset === 'week') { const w = new Date(now); w.setDate(w.getDate() - 7); start = w.toISOString().split('T')[0]; end = now.toISOString().split('T')[0]; }
    else if (preset === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; end = now.toISOString().split('T')[0]; }
    else if (preset === 'year') { start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; end = now.toISOString().split('T')[0]; }
    setExpenseDateRange({ start, end });
    setIncomeDateRange({ start, end });
    setInvestmentDateRange({ start, end });
  };

  const net = summary.totalIncome - summary.totalExpense;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-surface-500 text-sm mt-1 hidden sm:block">Track all income and expenses</p>
        </div>
        <Link href="/transactions/add" className="btn-primary">
          <FiPlus size={16} />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Summary - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase">Income</span>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{formatBDT(summary.totalIncome)}</p>
        </div>
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase">Expense</span>
          <p className="text-lg sm:text-2xl font-bold text-red-500">{formatBDT(summary.totalExpense)}</p>
        </div>
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase">Net</span>
          <p className={`text-lg sm:text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {net >= 0 ? '+' : ''}{formatBDT(net)}
          </p>
        </div>
        <div className="stat-card !p-3">
          <span className="text-[10px] font-semibold text-surface-400 uppercase">Entries</span>
          <p className="text-lg sm:text-2xl font-bold text-surface-800">{transactions.length}</p>
        </div>
      </div>

      {/* Global Controls */}
      <div className="card p-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 py-2.5"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                <FiX size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-1 bg-surface-100 rounded-xl p-1 overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7d' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyQuickPreset(p.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${quickPreset === p.id ? 'bg-surface-0 text-surface-800 shadow-sm' : 'text-surface-500'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : transactions.length > 0 ? (
        <div className="space-y-6">
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-surface-100 rounded-xl p-1 overflow-x-auto">
            {[
              { id: 'expense', label: 'Expenses', icon: '📉' },
              { id: 'income', label: 'Income', icon: '📈' },
              { id: 'investment', label: 'Fixed Assets', icon: '🏢' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.id
                    ? 'bg-surface-0 text-surface-800 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                  }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'expense' && (
            <TransactionTable
              transactions={transactions} type="expense"
              sortField={expenseSort.field} sortDir={expenseSort.dir}
              onSort={toggleSort(setExpenseSort)} onDelete={handleDelete}
              searchTerm={searchTerm}
              categoryFilter={expenseCatFilter} setCategoryFilter={setExpenseCatFilter}
              dateRange={expenseDateRange} setDateRange={setExpenseDateRange}
              allCategories={expenseCategories}
            />
          )}
          {activeTab === 'income' && (
            <TransactionTable
              transactions={transactions} type="income"
              sortField={incomeSort.field} sortDir={incomeSort.dir}
              onSort={toggleSort(setIncomeSort)} onDelete={handleDelete}
              searchTerm={searchTerm}
              categoryFilter={incomeCatFilter} setCategoryFilter={setIncomeCatFilter}
              dateRange={incomeDateRange} setDateRange={setIncomeDateRange}
              allCategories={incomeCategories}
            />
          )}
          {activeTab === 'investment' && (
            <TransactionTable
              transactions={transactions} type="investment"
              sortField={investmentSort.field} sortDir={investmentSort.dir}
              onSort={toggleSort(setInvestmentSort)} onDelete={handleDelete}
              searchTerm={searchTerm}
              categoryFilter={investmentCatFilter} setCategoryFilter={setInvestmentCatFilter}
              dateRange={investmentDateRange} setDateRange={setInvestmentDateRange}
              allCategories={investmentCategories}
            />
          )}
        </div>
      ) : (
        <div className="empty-state">
          <FiArrowUpRight className="text-surface-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-surface-600 mb-1">No transactions yet</h3>
          <p className="text-sm text-surface-400 mb-4">Start tracking income and expenses</p>
          <Link href="/transactions/add" className="btn-primary"><FiPlus size={16} /> Add Transaction</Link>
        </div>
      )}
    </div>
  );
}
