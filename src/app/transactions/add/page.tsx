'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { useToast } from '@/components/Toast';

interface CowOption {
  _id: string;
  tag: string;
  name: string;
}

interface CategoryOption {
  _id: string;
  name: string;
  type: string;
}

interface OwnerOption {
  _id: string;
  name: string;
}

function AddTransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cows, setCows] = useState<CowOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense' | 'investment',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cowIds: searchParams.get('cowId') ? [searchParams.get('cowId') as string] : [] as string[],
    isShared: !searchParams.get('cowId'),
    paidBy: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/cows?status=active&limit=200').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/owners').then((r) => r.json()),
    ]).then(([cowData, catData, ownerData]) => {
      setCows(cowData.cows || []);
      setCategories(catData.categories || []);
      setOwners(ownerData.owners || []);
    }).catch(() => { });
  }, []);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: form.cowIds.length > 0 ? Number(form.amount) * form.cowIds.length : Number(form.amount),
        paidBy: form.paidBy || null,
      };
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Transaction added!');
        router.push('/transactions');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add', 'error');
      }
    } catch {
      showToast('Failed to add transaction', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/transactions" className="btn-ghost p-2">
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Add Transaction</h1>
          <p className="text-surface-500 text-sm mt-0.5">Record income or expense</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selection */}
        <div className="card p-4">
          <label className="label mb-2">Transaction Type</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, type: 'expense', category: '' }))}
              className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all ${form.type === 'expense'
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-surface-200 text-surface-500 hover:border-surface-300'
                }`}
            >
              <p className="text-xl sm:text-2xl mb-1">📉</p>
              <p className="font-semibold text-xs sm:text-sm">Expense</p>
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, type: 'income', category: '' }))}
              className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all ${form.type === 'income'
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-surface-200 text-surface-500 hover:border-surface-300'
                }`}
            >
              <p className="text-xl sm:text-2xl mb-1">📈</p>
              <p className="font-semibold text-xs sm:text-sm">Income</p>
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, type: 'investment', category: '' }))}
              className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all ${form.type === 'investment'
                  ? 'border-accent-400 bg-accent-50 text-accent-700'
                  : 'border-surface-200 text-surface-500 hover:border-surface-300'
                }`}
            >
              <p className="text-xl sm:text-2xl mb-1">🏢</p>
              <p className="font-semibold text-xs sm:text-sm">Fixed Asset</p>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Details</h3>

          <div>
            <label className="label">Category *</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="input"
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (৳) *</label>
              <input
                type="number"
                required
                min="0"
                inputMode="numeric"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              type="text"
              placeholder="e.g. Bought feed from market"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="input"
            />
          </div>
        </div>


        {/* Cow Linking */}
        {form.type !== 'investment' && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-700">Link to Cow(s) (Optional)</h3>
              <button
                type="button"
                onClick={() => {
                  if (form.cowIds.length === cows.length) {
                    setForm(p => ({ ...p, cowIds: [], isShared: true }));
                  } else {
                    setForm(p => ({ ...p, cowIds: cows.map(c => c._id), isShared: false }));
                  }
                }}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {form.cowIds.length === cows.length ? 'Deselect All' : 'Select All Active'}
              </button>
            </div>
            
            <p className="text-xs text-surface-400 -mt-1">
              Select multiple cows to apply this transaction to each of them. Leave empty for general farm expenses.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 border border-surface-200 rounded-xl bg-surface-50">
              {cows.length === 0 ? (
                <p className="text-sm text-surface-500 col-span-2 text-center py-2">No active cows found.</p>
              ) : (
                cows.map((c) => (
                  <label key={c._id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.cowIds.includes(c._id) ? 'bg-primary-50 border-primary-200' : 'bg-surface-0 border-surface-200 hover:border-primary-300'}`}>
                    <input
                      type="checkbox"
                      checked={form.cowIds.includes(c._id)}
                      onChange={(e) => {
                        setForm(p => {
                          const newIds = e.target.checked 
                            ? [...p.cowIds, c._id] 
                            : p.cowIds.filter(id => id !== c._id);
                          return { ...p, cowIds: newIds, isShared: newIds.length === 0 };
                        });
                      }}
                      className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-600"
                    />
                    <span className="text-sm font-medium text-surface-700">
                      {c.tag} {c.name ? `- ${c.name}` : ''}
                    </span>
                  </label>
                ))
              )}
            </div>

            {form.cowIds.length === 0 && form.type === 'expense' && (
              <div className="bg-accent-50 border border-accent-200 rounded-xl p-3">
                <p className="text-xs text-accent-700">
                  ℹ️ This expense will be considered a general farm expense (divided equally among all active cows in reports).
                </p>
              </div>
            )}
            {form.cowIds.length > 1 && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
                <p className="text-xs text-primary-700">
                  ℹ️ The full amount of ৳{form.amount || 0} will be applied individually to each of the {form.cowIds.length} selected cows (Total: ৳{(Number(form.amount) || 0) * form.cowIds.length}).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions - sticky on mobile */}
        <div className="flex gap-3 sticky bottom-4 bg-surface-50/80 backdrop-blur-sm p-3 -mx-3 rounded-xl">
          <Link href="/transactions" className="btn-secondary flex-1 justify-center">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddTransactionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-surface-200 border-t-primary-600 rounded-full animate-spin" /></div>}>
      <AddTransactionForm />
    </Suspense>
  );
}
