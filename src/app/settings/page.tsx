'use client';

import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiInfo, FiUsers, FiTag } from 'react-icons/fi';
import { useToast } from '@/components/Toast';

interface CategoryData {
  _id: string;
  name: string;
  type: 'income' | 'expense' | 'investment';
}

interface OwnerData {
  _id: string;
  name: string;
  phone?: string;
}

type ActiveTab = 'categories' | 'owners' | 'about';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<ActiveTab>('categories');

  const { data: catData, mutate: mutateCats, isLoading: catLoading } = useSWR('/api/categories', fetcher);
  const categories: CategoryData[] = catData?.categories || [];
  
  const { data: ownerData, mutate: mutateOwners, isLoading: ownerLoading } = useSWR('/api/owners', fetcher);
  const owners: OwnerData[] = ownerData?.owners || [];

  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income' | 'investment'>('expense');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Owner state
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');



  // Category CRUD
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), type: newCatType }),
      });
      if (res.ok) {
        showToast('Category added');
        setNewCatName('');
        mutateCats();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed', 'error');
      }
    } catch {
      showToast('Failed to add category', 'error');
    }
  };

  const updateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName.trim() }),
      });
      if (res.ok) {
        showToast('Category updated');
        setEditingCat(null);
        mutateCats();
      }
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Category deleted');
        mutateCats();
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  // Owner CRUD
  const addOwner = async () => {
    if (!newOwnerName.trim()) return;
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOwnerName.trim(), phone: newOwnerPhone.trim() }),
      });
      if (res.ok) {
        showToast('Owner added');
        setNewOwnerName('');
        setNewOwnerPhone('');
        mutateOwners();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed', 'error');
      }
    } catch {
      showToast('Failed to add owner', 'error');
    }
  };

  const updateOwner = async (id: string) => {
    if (!editOwnerName.trim()) return;
    try {
      const res = await fetch(`/api/owners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editOwnerName.trim(), phone: editOwnerPhone.trim() }),
      });
      if (res.ok) {
        showToast('Owner updated');
        setEditingOwner(null);
        mutateOwners();
      }
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const deleteOwner = async (id: string, name: string) => {
    if (!confirm(`Delete owner "${name}"?`)) return;
    try {
      const res = await fetch(`/api/owners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Owner deleted');
        mutateOwners();
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const investmentCategories = categories.filter((c) => c.type === 'investment');

  const tabs = [
    { id: 'categories' as const, label: 'Categories', icon: FiTag },
    { id: 'about' as const, label: 'About', icon: FiInfo },
  ];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-surface-500 text-sm mt-1">Manage categories, owners & system</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-surface-0 text-surface-800 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Add New Category</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as 'expense' | 'income' | 'investment')}
                className="input w-full sm:w-44"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="investment">Fixed Investment</option>
              </select>
              <input
                type="text"
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                className="input flex-1"
              />
              <button onClick={addCategory} className="btn-primary whitespace-nowrap">
                <FiPlus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="card">
            <div className="px-4 py-3 border-b border-surface-100">
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                📉 Expense Categories
                <span className="text-xs text-surface-400 font-normal">({expenseCategories.length})</span>
              </h3>
            </div>
            {catLoading ? (
              <div className="p-8 text-center text-surface-400 text-sm">Loading...</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {expenseCategories.map((cat) => (
                  <div key={cat._id} className="px-4 py-3 flex items-center justify-between gap-2">
                    {editingCat === cat._id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && updateCategory(cat._id)}
                          className="input flex-1 py-1.5 text-sm"
                          autoFocus
                        />
                        <button onClick={() => updateCategory(cat._id)} className="btn-ghost p-1.5 text-green-600">
                          <FiCheck size={16} />
                        </button>
                        <button onClick={() => setEditingCat(null)} className="btn-ghost p-1.5 text-surface-400">
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-surface-700">{cat.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingCat(cat._id); setEditCatName(cat.name); }}
                            className="btn-ghost p-1.5 text-surface-400"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat._id, cat.name)}
                            className="btn-ghost p-1.5 text-red-400 hover:text-red-600"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <div className="p-6 text-center text-surface-400 text-sm">No expense categories</div>
                )}
              </div>
            )}
          </div>

          {/* Income Categories */}
          <div className="card">
            <div className="px-4 py-3 border-b border-surface-100">
              <h3 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                📈 Income Categories
                <span className="text-xs text-surface-400 font-normal">({incomeCategories.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-surface-100">
              {incomeCategories.map((cat) => (
                <div key={cat._id} className="px-4 py-3 flex items-center justify-between gap-2">
                  {editingCat === cat._id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateCategory(cat._id)}
                        className="input flex-1 py-1.5 text-sm"
                        autoFocus
                      />
                      <button onClick={() => updateCategory(cat._id)} className="btn-ghost p-1.5 text-green-600">
                        <FiCheck size={16} />
                      </button>
                      <button onClick={() => setEditingCat(null)} className="btn-ghost p-1.5 text-surface-400">
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-surface-700">{cat.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingCat(cat._id); setEditCatName(cat.name); }}
                          className="btn-ghost p-1.5 text-surface-400"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat._id, cat.name)}
                          className="btn-ghost p-1.5 text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <div className="p-6 text-center text-surface-400 text-sm">No income categories</div>
              )}
            </div>
          </div>

          {/* Investment Categories */}
          <div className="card">
            <div className="px-4 py-3 border-b border-surface-100">
              <h3 className="text-sm font-semibold text-accent-600 flex items-center gap-2">
                🏢 Fixed Investment Categories
                <span className="text-xs text-surface-400 font-normal">({investmentCategories.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-surface-100">
              {investmentCategories.map((cat) => (
                <div key={cat._id} className="px-4 py-3 flex items-center justify-between gap-2">
                  {editingCat === cat._id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateCategory(cat._id)}
                        className="input flex-1 py-1.5 text-sm"
                        autoFocus
                      />
                      <button onClick={() => updateCategory(cat._id)} className="btn-ghost p-1.5 text-green-600">
                        <FiCheck size={16} />
                      </button>
                      <button onClick={() => setEditingCat(null)} className="btn-ghost p-1.5 text-surface-400">
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-surface-700">{cat.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingCat(cat._id); setEditCatName(cat.name); }}
                          className="btn-ghost p-1.5 text-surface-400"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat._id, cat.name)}
                          className="btn-ghost p-1.5 text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {investmentCategories.length === 0 && (
                <div className="p-6 text-center text-surface-400 text-sm">No investment categories</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Owners Tab */}
      {tab === 'owners' && (
        <div className="space-y-6">
          {/* Add Owner */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Add New Owner / Partner</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Owner name..."
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addOwner()}
                className="input flex-1"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newOwnerPhone}
                onChange={(e) => setNewOwnerPhone(e.target.value)}
                className="input sm:w-40"
              />
              <button onClick={addOwner} className="btn-primary whitespace-nowrap">
                <FiPlus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Owners List */}
          <div className="card">
            <div className="px-4 py-3 border-b border-surface-100">
              <h3 className="text-sm font-semibold text-surface-700 flex items-center gap-2">
                <FiUsers size={16} />
                Partners / Owners
                <span className="text-xs text-surface-400 font-normal">({owners.length})</span>
              </h3>
            </div>
            {ownerLoading ? (
              <div className="p-8 text-center text-surface-400 text-sm">Loading...</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {owners.map((owner) => (
                  <div key={owner._id} className="px-4 py-3 flex items-center justify-between gap-2">
                    {editingOwner === owner._id ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editOwnerName}
                          onChange={(e) => setEditOwnerName(e.target.value)}
                          className="input flex-1 py-1.5 text-sm"
                          autoFocus
                        />
                        <input
                          type="tel"
                          value={editOwnerPhone}
                          onChange={(e) => setEditOwnerPhone(e.target.value)}
                          placeholder="Phone"
                          className="input sm:w-36 py-1.5 text-sm"
                        />
                        <div className="flex gap-1">
                          <button onClick={() => updateOwner(owner._id)} className="btn-ghost p-1.5 text-green-600">
                            <FiCheck size={16} />
                          </button>
                          <button onClick={() => setEditingOwner(null)} className="btn-ghost p-1.5 text-surface-400">
                            <FiX size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-medium text-surface-700">{owner.name}</p>
                          {owner.phone && <p className="text-xs text-surface-400">{owner.phone}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingOwner(owner._id);
                              setEditOwnerName(owner.name);
                              setEditOwnerPhone(owner.phone || '');
                            }}
                            className="btn-ghost p-1.5 text-surface-400"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteOwner(owner._id, owner.name)}
                            className="btn-ghost p-1.5 text-red-400 hover:text-red-600"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {owners.length === 0 && (
                  <div className="p-8 text-center text-surface-400">
                    <FiUsers className="mx-auto mb-2 text-surface-300" size={32} />
                    <p className="text-sm">No owners yet. Add your partners above.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-4 bg-primary-50 border-primary-200">
            <p className="text-sm text-primary-700">
              💡 <strong>Tip:</strong> Add all 3 partners here, then select who paid when adding transactions.
              This helps track who spent what.
            </p>
          </div>
        </div>
      )}

      {/* About Tab */}
      {tab === 'about' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <FiInfo size={16} />
              About
            </h3>
            <div className="space-y-3">
              {[
                ['Application', 'CowFarm Management System'],
                ['Version', '2.0.0'],
                ['Currency', 'BDT (৳)'],
                ['Country', '🇧🇩 Bangladesh'],
                ['Stack', 'Next.js + MongoDB'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm border-b border-surface-100 pb-2">
                  <span className="text-surface-500">{label}</span>
                  <span className="font-medium text-surface-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-surface-800 mb-4">📋 How Cost Calculation Works</h3>
            <div className="text-sm text-surface-600 space-y-3">
              <p>
                <strong>Shared Expenses</strong> (feed, labor, electricity etc.) are divided equally
                among all active cows for each month.
              </p>
              <p>
                <strong>Individual Expenses</strong> (medicine for a specific cow) are tracked
                separately and added to that cow&apos;s total cost.
              </p>
              <p>
                <strong>Total Cost</strong> = Purchase Price + Monthly Shared Costs + Individual Expenses
              </p>
              <p>
                <strong>Suggested Sell Price</strong> = Total Cost × 1.15 (15% profit margin)
              </p>
              <div className="bg-primary-50 rounded-xl p-3 mt-3">
                <p className="text-primary-700 font-medium">
                  💡 Tip: Check the Cow Cost Analysis report before selling to know the minimum
                  price you should sell at.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
