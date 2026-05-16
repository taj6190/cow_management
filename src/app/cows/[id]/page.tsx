'use client';

import { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiEdit2, FiTrash2, FiCalendar, FiDollarSign, FiTag } from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { formatBDT, formatDate } from '@/lib/utils';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface CowDetail {
  _id: string;
  tag: string;
  name: string;
  breed: string;
  dateOfBirth?: string;
  purchaseDate: string;
  purchasePrice: number;
  weight?: number;
  image?: string;
  status: 'active' | 'sold';
  sellDate?: string;
  sellPrice?: number;
  buyerName?: string;
  buyerPhone?: string;
  notes?: string;
  createdByName?: string;
  updatedByName?: string;
}

interface CowTransaction {
  _id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export default function CowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const { data: cow, error: cowError, isLoading: cowLoading } = useSWR<CowDetail>(`/api/cows/${id}`, fetcher);
  const { data: txData, error: txError } = useSWR(`/api/transactions?cowId=${id}&limit=100`, fetcher);
  const { data: costReport, error: costError } = useSWR(`/api/reports?type=cow-cost`, fetcher);

  const transactions: CowTransaction[] = txData?.transactions || [];
  
  const costData = useMemo(() => {
    if (!costReport || !id) return null;
    const thisCow = costReport.cows?.find((c: { _id: string }) => c._id === id);
    if (!thisCow) return null;
    return {
      individualExpenses: thisCow.individualExpenses,
      sharedExpenses: thisCow.sharedExpenses,
      totalCost: thisCow.totalCost,
      suggestedPrice: thisCow.suggestedSellPrice,
    };
  }, [costReport, id]);

  const loading = cowLoading;

  useEffect(() => {
    if (cowError || txError || costError) {
      showToast('Failed to load some data', 'error');
    }
  }, [cowError, txError, costError, showToast]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete cow ${cow?.tag}?`)) return;
    try {
      const res = await fetch(`/api/cows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cow deleted');
        router.push('/cows');
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!cow) return <div className="text-center py-12 text-surface-500">Cow not found</div>;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/cows" className="btn-ghost p-2">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">{cow.tag}</h1>
            {cow.name && <p className="text-surface-500 text-sm">{cow.name}</p>}
          </div>
          <span className={cow.status === 'active' ? 'badge-active' : 'badge-sold'}>
            {cow.status === 'active' ? '● Active' : '● Sold'}
          </span>
        </div>
        <div className="flex gap-2">
          <Link href={`/cows/${id}/edit`} className="btn-secondary">
            <FiEdit2 size={14} />
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger">
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image & Info */}
        <div className="space-y-4">
          {/* Image */}
          <div className="card overflow-hidden">
            <div className="relative h-64 bg-surface-100">
              {cow.image ? (
                <Image src={cow.image} alt={cow.tag} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GiCow className="text-surface-300" size={64} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Details</h3>
            <div className="flex items-center gap-3 text-sm">
              <FiTag className="text-surface-400" size={14} />
              <span className="text-surface-500">Tag:</span>
              <span className="font-medium text-surface-800">{cow.tag}</span>
            </div>
            {cow.breed && (
              <div className="flex items-center gap-3 text-sm">
                <GiCow className="text-surface-400" size={14} />
                <span className="text-surface-500">Breed:</span>
                <span className="font-medium text-surface-800">{cow.breed}</span>
              </div>
            )}
            {cow.weight && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-surface-400 text-xs">⚖️</span>
                <span className="text-surface-500">Weight:</span>
                <span className="font-medium text-surface-800">{cow.weight} kg</span>
              </div>
            )}
            {cow.dateOfBirth && (
              <div className="flex items-center gap-3 text-sm">
                <FiCalendar className="text-surface-400" size={14} />
                <span className="text-surface-500">Born:</span>
                <span className="font-medium text-surface-800">{formatDate(cow.dateOfBirth)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <FiCalendar className="text-surface-400" size={14} />
              <span className="text-surface-500">Purchased:</span>
              <span className="font-medium text-surface-800">{formatDate(cow.purchaseDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FiDollarSign className="text-surface-400" size={14} />
              <span className="text-surface-500">Buy Price:</span>
              <span className="font-semibold text-surface-800">{formatBDT(cow.purchasePrice)}</span>
            </div>
            {cow.status === 'sold' && (
              <>
                <div className="pt-2 border-t border-surface-100">
                  <div className="flex items-center gap-3 text-sm">
                    <FiCalendar className="text-accent-500" size={14} />
                    <span className="text-surface-500">Sold on:</span>
                    <span className="font-medium text-surface-800">{cow.sellDate ? formatDate(cow.sellDate) : 'N/A'}</span>
                  </div>
                </div>
                {cow.sellPrice && (
                  <div className="flex items-center gap-3 text-sm">
                    <FiDollarSign className="text-accent-500" size={14} />
                    <span className="text-surface-500">Sell Price:</span>
                    <span className="font-semibold text-accent-600">{formatBDT(cow.sellPrice)}</span>
                  </div>
                )}
                {cow.buyerName && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-surface-400 text-xs">👤</span>
                    <span className="text-surface-500">Buyer:</span>
                    <span className="font-medium text-surface-800">{cow.buyerName}</span>
                  </div>
                )}
              </>
            )}
            {cow.notes && (
              <div className="pt-2 border-t border-surface-100">
                <p className="text-xs text-surface-400 mb-1">Notes</p>
                <p className="text-sm text-surface-600">{cow.notes}</p>
              </div>
            )}
            {(cow.createdByName || cow.updatedByName) && (
              <div className="pt-2 border-t border-surface-100 space-y-1">
                {cow.createdByName && (
                  <p className="text-xs text-surface-400">Added by: <span className="font-medium text-surface-600">{cow.createdByName}</span></p>
                )}
                {cow.updatedByName && (
                  <p className="text-xs text-surface-400">Last updated by: <span className="font-medium text-surface-600">{cow.updatedByName}</span></p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Cost Analysis & Transactions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cost Analysis */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-surface-700 mb-4">💰 Cost Analysis</h3>
            {costData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-50 rounded-xl p-4">
                    <p className="text-xs text-surface-500">Purchase Price</p>
                    <p className="text-lg font-bold text-surface-800">{formatBDT(cow.purchasePrice)}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-4">
                    <p className="text-xs text-surface-500">Individual Expenses</p>
                    <p className="text-lg font-bold text-surface-800">{formatBDT(costData.individualExpenses)}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-4">
                    <p className="text-xs text-surface-500">Shared Expenses (Avg)</p>
                    <p className="text-lg font-bold text-surface-800">{formatBDT(costData.sharedExpenses)}</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                    <p className="text-xs text-primary-600 font-medium">Total Cost</p>
                    <p className="text-lg font-bold text-primary-700">{formatBDT(costData.totalCost)}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-4 ${cow.status === 'sold' ? 'bg-accent-50 border border-accent-200' : 'bg-green-50 border border-green-200'}`}>
                  {cow.status === 'sold' && cow.sellPrice ? (
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Profit / Loss</p>
                      <p className={`text-2xl font-bold ${cow.sellPrice - costData.totalCost >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {cow.sellPrice - costData.totalCost >= 0 ? '+' : ''}
                        {formatBDT(cow.sellPrice - costData.totalCost)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-green-600 font-medium mb-1">Suggested Sell Price (15% margin)</p>
                      <p className="text-2xl font-bold text-green-700">{formatBDT(costData.suggestedPrice)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-surface-400">No cost data available yet. Add expenses to see analysis.</p>
            )}
          </div>

          {/* Linked Transactions */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-700">Linked Transactions</h3>
              <Link
                href={`/transactions/add?cowId=${id}`}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add for this cow
              </Link>
            </div>
            {transactions.length > 0 ? (
              <div className="divide-y divide-surface-100">
                {transactions.map((t) => (
                  <div key={t._id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{t.category}</p>
                      <p className="text-xs text-surface-400">{formatDate(t.date)} • {t.description}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatBDT(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-surface-400 text-sm">
                No transactions linked to this cow yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
