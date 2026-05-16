'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Link from 'next/link';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPlusCircle,
  FiArrowUpRight,
  FiArrowDownRight,
  FiShare2,
} from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatBDT, formatDate } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface DashboardData {
  stats: {
    activeCows: number;
    soldCows: number;
    totalCows: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyInvestment: number;
    avgCostPerCow: number;
    profit: number;
  };
  recentTransactions: Array<{
    _id: string;
    type: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    cowId?: { tag: string; name: string };
    paidBy?: { name: string };
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
  }>;
}

export default function Dashboard() {
  const { data, error, isLoading } = useSWR<DashboardData>('/api/dashboard', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !data || 'error' in data || !data.monthlyTrend) {
    return <div className="text-center py-12 text-surface-500">
      {error?.message || ('error' in (data || {}) ? (data as any).error : 'Failed to load dashboard')}
    </div>;
  }

  const { stats, recentTransactions, monthlyTrend, categoryBreakdown } = data;

  const handleShareSummary = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const text = `🐄 *GoruFarm Quick Summary* (${today})\n\n` +
      `📊 *Monthly Overview*\n` +
      `- Active Cows: ${stats.activeCows}\n` +
      `- Monthly Income: ${formatBDT(stats.monthlyIncome)}\n` +
      `- Monthly Expense: ${formatBDT(stats.monthlyExpense)}\n` +
      `- Net Profit/Loss: ${stats.profit >= 0 ? '+' : ''}${formatBDT(stats.profit)}\n` +
      `- Avg Cost/Cow: ${formatBDT(stats.avgCostPerCow)}\n\n` +
      `🇧🇩 Generated via GoruFarm Management System`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const barChartData = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrend.map((m) => m.income),
        backgroundColor: '#22c55e',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Expense',
        data: monthlyTrend.map((m) => m.expense),
        backgroundColor: '#ef4444',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const doughnutColors = [
    '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  ];

  const doughnutData = {
    labels: categoryBreakdown.map((c) => c.category),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.total),
        backgroundColor: doughnutColors.slice(0, categoryBreakdown.length),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-surface-500 text-sm mt-1">Overview of your farm this month</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShareSummary} className="btn-secondary">
            <FiShare2 size={16} />
            <span className="hidden sm:inline">Share Summary</span>
          </button>
          <Link href="/transactions/add" className="btn-secondary">
            <FiPlusCircle size={16} />
            <span className="hidden sm:inline">Add Transaction</span>
          </Link>
          <Link href="/cows/add" className="btn-primary">
            <FiPlusCircle size={16} />
            <span className="hidden sm:inline">Add Cow</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Active Cows</span>
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <GiCow className="text-primary-600" size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-surface-900">{stats.activeCows}</p>
          <p className="text-xs text-surface-400">{stats.soldCows} sold total</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Monthly Income</span>
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <FiTrendingUp className="text-green-600" size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatBDT(stats.monthlyIncome)}</p>
          <p className="text-xs text-surface-400">This month</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Monthly Expense</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <FiTrendingDown className="text-red-500" size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatBDT(stats.monthlyExpense)}</p>
          <p className="text-xs text-surface-400">This month</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Avg Cost/Cow</span>
            <div className="w-8 h-8 rounded-full bg-accent-50 flex items-center justify-center">
              <GiCow className="text-accent-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-surface-800 mt-2">{formatBDT(stats.avgCostPerCow)}</p>
          <div className="mt-2 text-xs text-surface-400">Monthly shared costs only</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Investments</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FiDollarSign className="text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatBDT(stats.monthlyInvestment)}</p>
          <div className="mt-2 text-xs text-blue-500/80 bg-blue-50 px-2 py-1 rounded-md inline-block">
            This Month
          </div>
        </div>
      </div>

      {/* Profit Banner */}
      <div className={`card p-5 flex items-center justify-between ${stats.profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <p className="text-sm font-medium text-surface-600">Monthly Profit / Loss</p>
          <p className={`text-3xl font-bold mt-1 ${stats.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {stats.profit >= 0 ? '+' : ''}{formatBDT(stats.profit)}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stats.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          {stats.profit >= 0 ? (
            <FiTrendingUp className="text-green-600" size={24} />
          ) : (
            <FiTrendingDown className="text-red-500" size={24} />
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-surface-700 mb-4">Income vs Expense (Last 6 Months)</h3>
          <div className="h-64">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20, font: { size: 12 } },
                  },
                },
                scales: {
                  x: { grid: { display: false } },
                  y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                      callback: (value) => `৳${Number(value).toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-700 mb-4">Expense Categories</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { usePointStyle: true, padding: 12, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-surface-400 text-sm">
              No expenses yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-700">Recent Transactions</h3>
          <Link href="/transactions" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {recentTransactions.map((t) => (
              <div key={t._id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-green-100' : t.type === 'investment' ? 'bg-blue-100' : 'bg-red-100'}`}>
                    {t.type === 'income' ? (
                      <FiArrowUpRight className="text-green-600" size={14} />
                    ) : t.type === 'investment' ? (
                      <FiArrowUpRight className="text-blue-500" size={14} />
                    ) : (
                      <FiArrowDownRight className="text-red-500" size={14} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">{t.category}</p>
                    <p className="text-xs text-surface-400">
                      {formatDate(t.date)}
                      {t.cowId && ` • ${t.cowId.tag}`}
                      {t.paidBy && ` • ${t.paidBy.name}`}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : t.type === 'investment' ? 'text-blue-500' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatBDT(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-surface-400 text-sm">
            No transactions yet. Start by adding income or expenses.
          </div>
        )}
      </div>
    </div>
  );
}
