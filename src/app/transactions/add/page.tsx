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
    cowId: searchParams.get('cowId') || '',
    isShared: true,
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
        amount: Number(form.amount),
        cowId: form.cowId || null,
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
            <h3 className="text-sm font-semibold text-surface-700">Link to Cow (Optional)</h3>
            <p className="text-xs text-surface-400 -mt-1">
              Leave empty for shared farm expenses split across all active cows.
            </p>
            <select
              value={form.cowId}
              onChange={(e) => setForm((p) => ({
                ...p,
                cowId: e.target.value,
                isShared: !e.target.value,
              }))}
              className="input"
            >
              <option value="">No specific cow (Shared)</option>
              {cows.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.tag} {c.name ? `- ${c.name}` : ''}
                </option>
              ))}
            </select>

            {!form.cowId && form.type === 'expense' && (
              <div className="bg-accent-50 border border-accent-200 rounded-xl p-3">
                <p className="text-xs text-accent-700">
                  ℹ️ This expense will be divided equally among all active cows.
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
