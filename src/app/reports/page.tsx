'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { fetcher } from '@/lib/fetcher';
import { formatBDT, getMonthName } from '@/lib/utils';
import Image from 'next/image';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title, Tooltip,
} from 'chart.js';
import { jsPDF } from 'jspdf';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiBarChart2, FiCalendar, FiCheck, FiChevronDown, FiDollarSign, FiDownload, FiFileText, FiFilter, FiUser, FiClock } from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';
import useSWR from 'swr';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type ReportTab = 'monthly' | 'cow-cost' | 'custom';

interface CategoryOption { _id: string; name: string; type: string; }

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="input flex items-center justify-between gap-2 text-left">
        <span className="truncate text-sm">
          {selected.length === 0 ? 'All' : `${selected.length} selected`}
        </span>
        <FiChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-surface-0 border border-surface-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1.5">
          <button type="button" onClick={() => onChange([])}
            className="w-full text-left px-3 py-1.5 text-xs text-primary-600 font-medium hover:bg-primary-50 rounded-lg">
            Clear All
          </button>
          <button type="button" onClick={() => onChange([...options])}
            className="w-full text-left px-3 py-1.5 text-xs text-primary-600 font-medium hover:bg-primary-50 rounded-lg mb-1">
            Select All
          </button>
          {options.map((opt) => (
            <label key={opt}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-50 cursor-pointer text-sm">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected.includes(opt) ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300'}`}>
                {selected.includes(opt) && <FiCheck size={10} />}
              </div>
              {opt}
            </label>
          ))}
          {options.length === 0 && <p className="px-3 py-2 text-sm text-surface-400">No options</p>}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Admin';
  const [tab, setTab] = useState<ReportTab>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const REPORT_PER_PAGE = 15;
  const { showToast } = useToast();

  // Categories SWR
  const { data: catData } = useSWR('/api/categories', fetcher);
  const allCategories: CategoryOption[] = catData?.categories || [];

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Cow Filters
  const [cowSearch, setCowSearch] = useState('');
  const [cowStatusFilter, setCowStatusFilter] = useState('all');

  // Construct URL for Report SWR
  const reportUrl = useMemo(() => {
    const params = new URLSearchParams({ type: tab });
    if (tab === 'monthly') {
      params.set('year', year.toString());
      params.set('month', month.toString());
    }
    if (tab === 'custom') {
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','));
      if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    }
    return `/api/reports?${params.toString()}`;
  }, [tab, year, month, startDate, endDate, selectedTypes, selectedCategories]);

  const { data: reportData, error, isLoading } = useSWR(reportUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const loading = isLoading;

  const availableCategories = allCategories
    .filter(c => selectedTypes.length === 0 || selectedTypes.includes(c.type))
    .map(c => c.name);

  useEffect(() => {
    if (error) showToast('Failed to load report', 'error');
  }, [error, showToast]);

  const filteredCows = useMemo(() => {
    if (!reportData?.cows) return [];
    return reportData.cows.filter((c: any) => {
      if (cowStatusFilter !== 'all' && c.status !== cowStatusFilter) return false;
      if (cowSearch) {
        const q = cowSearch.toLowerCase();
        return c.tag.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [reportData?.cows, cowSearch, cowStatusFilter]);

  const fetchReport = () => {
    // Handled automatically by SWR when filters change
  };

  useEffect(() => { setReportPage(1); }, [tab]);

  const tabs = [
    { id: 'monthly' as const, label: 'Monthly Report', icon: FiCalendar },
    { id: 'cow-cost' as const, label: 'Cow Cost Analysis', icon: GiCow },
    { id: 'custom' as const, label: 'Custom Report', icon: FiFilter },
  ];

  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setDownloadingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 15; // margin
      const CW = W - M * 2; // content width
      let y = 0;
      let pageNum = 1;

      // ── Color helpers ──
      const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] as [number, number, number];
      const GREEN = '#16a34a', RED = '#dc2626', BLUE = '#2563eb', DARK = '#0f172a', GRAY = '#64748b', LIGHT = '#f1f5f9';
      const BRAND = '#15803d';

      // ── Footer on every page ──
      const addFooter = () => {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...hex(GRAY));
        pdf.text(`GoruFarm Management System  |  Generated: ${new Date().toLocaleString('en-GB')}`, M, H - 8);
        pdf.text(`Page ${pageNum}`, W - M, H - 8, { align: 'right' });
        pdf.setDrawColor(...hex('#e2e8f0'));
        pdf.line(M, H - 12, W - M, H - 12);
      };

      // ── Page break check ──
      const checkPage = (need = 10) => {
        if (y > H - 20 - need) {
          addFooter();
          pdf.addPage();
          pageNum++;
          y = 15;
        }
      };

      // ── Header Bar ──
      pdf.setFillColor(...hex(BRAND));
      pdf.rect(0, 0, W, 32, 'F');
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('GoruFarm', M, 14);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Farm Management Report', M, 22);
      pdf.setFontSize(9);
      pdf.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), W - M, 14, { align: 'right' });
      pdf.text('All amounts in BDT', W - M, 22, { align: 'right' });
      y = 42;

      // ── Report Title ──
      const reportTitle = tab === 'monthly'
        ? `Monthly Report — ${getMonthName(reportData.period?.month ?? month)} ${reportData.period?.year ?? year}`
        : tab === 'cow-cost' ? 'Cow Cost Analysis' : 'Custom Report';
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...hex(DARK));
      pdf.text(reportTitle, M, y);
      y += 4;
      pdf.setDrawColor(...hex(BRAND));
      pdf.setLineWidth(0.8);
      pdf.line(M, y, M + 40, y);
      y += 10;

      // ── Summary Stat Boxes ──
      const drawStatBox = (x: number, label: string, value: string, color: string) => {
        const boxW = (CW - 9) / 4;
        pdf.setFillColor(...hex('#f8fafc'));
        pdf.setDrawColor(...hex('#e2e8f0'));
        pdf.rect(x, y, boxW, 18, 'FD');
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...hex(GRAY));
        pdf.text(label.toUpperCase(), x + 3, y + 6);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...hex(color));
        pdf.text(value, x + 3, y + 14);
      };

      // ── Table helper ──
      const drawTable = (headers: string[], rows: string[][], widths: number[], typeColIdx = -1) => {
        checkPage(20);
        // Header row
        pdf.setFillColor(...hex(BRAND));
        pdf.rect(M, y, CW, 8, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        let hx = M + 2;
        headers.forEach((h, i) => {
          const align = i === headers.length - 1 ? 'right' as const : 'left' as const;
          const tx = align === 'right' ? M + widths.slice(0, i + 1).reduce((a, b) => a + b, 0) - 2 : hx;
          pdf.text(h, tx, y + 5.5, { align });
          hx += widths[i];
        });
        y += 8;

        // Data rows
        rows.forEach((row, ri) => {
          checkPage(7);
          if (ri % 2 === 0) {
            pdf.setFillColor(...hex(LIGHT));
            pdf.rect(M, y - 1, CW, 7, 'F');
          }
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...hex(DARK));
          let rx = M + 2;
          row.forEach((cell, ci) => {
            // Color the type/amount column
            if (ci === typeColIdx) {
              const c = cell.toLowerCase();
              pdf.setTextColor(...hex(c.includes('income') || cell.startsWith('+') ? GREEN : c.includes('investment') ? BLUE : RED));
            } else {
              pdf.setTextColor(...hex(DARK));
            }
            const align = ci === row.length - 1 ? 'right' as const : 'left' as const;
            const tx = align === 'right' ? M + widths.slice(0, ci + 1).reduce((a, b) => a + b, 0) - 2 : rx;
            pdf.text(cell.substring(0, 35), tx, y + 4, { align });
            rx += widths[ci];
          });
          y += 7;
        });
        // Bottom border
        pdf.setDrawColor(...hex('#e2e8f0'));
        pdf.line(M, y, M + CW, y);
        y += 4;
      };

      // ── Section header ──
      const sectionHeader = (title: string) => {
        checkPage(15);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...hex(DARK));
        pdf.text(title, M, y);
        y += 2;
        pdf.setDrawColor(...hex('#cbd5e1'));
        pdf.setLineWidth(0.3);
        pdf.line(M, y, W - M, y);
        y += 6;
      };

      // ═══════════════════ MONTHLY ═══════════════════
      if (tab === 'monthly' && reportData.summary) {
        const s = reportData.summary;
        const boxW = (CW - 9) / 4;
        drawStatBox(M, 'Income', formatBDT(s.totalIncome), GREEN);
        drawStatBox(M + boxW + 3, 'Expense', formatBDT(s.totalExpense), RED);
        drawStatBox(M + (boxW + 3) * 2, 'Profit / Loss', formatBDT(s.profit), s.profit >= 0 ? GREEN : RED);
        drawStatBox(M + (boxW + 3) * 3, 'Active Cows', String(s.activeCowsCount), DARK);
        y += 26;

        if (reportData.categoryBreakdown?.length > 0) {
          sectionHeader('Category Breakdown');
          const rows = reportData.categoryBreakdown.map((c: any) => [c.type, c.category, String(c.count), formatBDT(c.total)]);
          drawTable(['Type', 'Category', 'Count', 'Amount'], rows, [30, 60, 25, CW - 115], 0);
        }
      }

      // ═══════════════════ COW COST ═══════════════════
      if (tab === 'cow-cost' && reportData.cows?.length > 0) {
        sectionHeader('Per-Cow Cost Summary');
        const rows = reportData.cows.map((c: any) => [
          c.tag, c.name || '-', c.status, formatBDT(c.purchasePrice),
          formatBDT(c.totalCost), c.profitLoss !== null ? formatBDT(c.profitLoss) : '-',
        ]);
        drawTable(['Tag', 'Name', 'Status', 'Purchase', 'Total Cost', 'Profit/Loss'], rows, [25, 30, 18, 32, 35, CW - 140], 5);

        checkPage(20);
        y += 4;
        const totalCost = reportData.cows.reduce((s: number, c: any) => s + c.totalCost, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...hex(DARK));
        pdf.text(`Total Cost Across All Cows: ${formatBDT(totalCost)}`, M, y);
        y += 8;
      }

      // ═══════════════════ CUSTOM ═══════════════════
      if (tab === 'custom' && reportData.summary) {
        const s = reportData.summary;
        const boxW = (CW - 9) / 4;
        drawStatBox(M, 'Income', formatBDT(s.totalIncome), GREEN);
        drawStatBox(M + boxW + 3, 'Expense', formatBDT(s.totalExpense), RED);
        drawStatBox(M + (boxW + 3) * 2, 'Net', formatBDT(s.totalIncome - s.totalExpense), s.totalIncome - s.totalExpense >= 0 ? GREEN : RED);
        drawStatBox(M + (boxW + 3) * 3, 'Transactions', String(s.totalTransactions), DARK);
        y += 26;

        if (reportData.categories?.length > 0) {
          sectionHeader('Category Breakdown');
          const rows = reportData.categories.map((c: any) => [c.type, c.category, String(c.count), formatBDT(c.total)]);
          drawTable(['Type', 'Category', 'Count', 'Amount'], rows, [30, 60, 25, CW - 115], 0);
        }

        if (reportData.transactions?.length > 0) {
          sectionHeader('Transaction Details');
          const rows = reportData.transactions.map((t: any) => [
            new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
            t.type, t.category, t.description?.substring(0, 25) || '-',
            `${t.type === 'income' ? '+' : '-'}${formatBDT(t.amount)}`,
          ]);
          drawTable(['Date', 'Type', 'Category', 'Description', 'Amount'], rows, [25, 22, 40, 50, CW - 137], 4);
        }
      }

      // Final footer
      addFooter();
      pdf.save(`GoruFarm_${tab}_Report.pdf`);
      showToast('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Failed to generate PDF', 'error');
    }
    setDownloadingPdf(false);
  };

  const doughnutColors = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  // ── Excel Download ──
  const handleDownloadExcel = () => {
    if (!reportData) return;
    try {
      const wb = XLSX.utils.book_new();

      if (tab === 'monthly' && reportData.summary) {
        // Summary sheet
        const summaryData = [
          ['GoruFarm Monthly Report'],
          [`Month: ${getMonthName(reportData.period?.month ?? month)} ${reportData.period?.year ?? year}`],
          [],
          ['Metric', 'Value'],
          ['Total Income', reportData.summary.totalIncome],
          ['Total Expense', reportData.summary.totalExpense],
          ['Profit/Loss', reportData.summary.profit],
          ['Active Cows', reportData.summary.activeCowsCount],
          ['Avg Cost/Cow', reportData.summary.avgCostPerCow],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

        // Category breakdown sheet
        if (reportData.categoryBreakdown?.length > 0) {
          const catData = [['Type', 'Category', 'Count', 'Amount']];
          reportData.categoryBreakdown.forEach((c: any) => catData.push([c.type, c.category, c.count, c.total]));
          const ws2 = XLSX.utils.aoa_to_sheet(catData);
          XLSX.utils.book_append_sheet(wb, ws2, 'Categories');
        }

        // Transactions sheet
        if (reportData.transactions?.length > 0) {
          const txData = [['Date', 'Type', 'Category', 'Description', 'Amount', 'Cow', 'Shared']];
          reportData.transactions.forEach((t: any) => txData.push([
            new Date(t.date).toLocaleDateString('en-GB'),
            t.type, t.category, t.description || '', t.amount,
            t.cowId?.tag || '', t.isShared ? 'Yes' : 'No',
          ]));
          const ws3 = XLSX.utils.aoa_to_sheet(txData);
          XLSX.utils.book_append_sheet(wb, ws3, 'Transactions');
        }
      }

      if (tab === 'cow-cost' && reportData.cows?.length > 0) {
        const cowData = [['Tag', 'Name', 'Status', 'Purchase Price', 'Individual Expenses', 'Shared Expenses', 'Total Cost', 'Months Active', 'Sell Price', 'Suggested Price', 'Profit/Loss']];
        reportData.cows.forEach((c: any) => cowData.push([
          c.tag, c.name || '', c.status, c.purchasePrice, c.individualExpenses,
          c.sharedExpenses, c.totalCost, c.monthsActive, c.sellPrice || '',
          c.suggestedSellPrice, c.profitLoss ?? '',
        ]));
        const ws = XLSX.utils.aoa_to_sheet(cowData);
        XLSX.utils.book_append_sheet(wb, ws, 'Cow Costs');
      }

      if (tab === 'custom' && reportData.summary) {
        // Summary
        const summaryData = [
          ['GoruFarm Custom Report'],
          [`Generated: ${new Date().toLocaleDateString('en-GB')}`],
          [],
          ['Metric', 'Value'],
          ['Total Income', reportData.summary.totalIncome],
          ['Total Expense', reportData.summary.totalExpense],
          ['Total Investment', reportData.summary.totalInvestment],
          ['Net', reportData.summary.totalIncome - reportData.summary.totalExpense],
          ['Total Transactions', reportData.summary.totalTransactions],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

        // Categories
        if (reportData.categories?.length > 0) {
          const catData = [['Type', 'Category', 'Count', 'Amount']];
          reportData.categories.forEach((c: any) => catData.push([c.type, c.category, c.count, c.total]));
          const ws2 = XLSX.utils.aoa_to_sheet(catData);
          XLSX.utils.book_append_sheet(wb, ws2, 'Categories');
        }

        // Transactions
        if (reportData.transactions?.length > 0) {
          const txData = [['Date', 'Type', 'Category', 'Description', 'Amount', 'Cow', 'Paid By']];
          reportData.transactions.forEach((t: any) => txData.push([
            new Date(t.date).toLocaleDateString('en-GB'),
            t.type, t.category, t.description || '', t.amount,
            t.cowId?.tag || '', t.paidBy?.name || '',
          ]));
          const ws3 = XLSX.utils.aoa_to_sheet(txData);
          XLSX.utils.book_append_sheet(wb, ws3, 'Transactions');
        }
      }

      XLSX.writeFile(wb, `GoruFarm_${tab}_Report.xlsx`);
      showToast('Excel downloaded successfully');
    } catch (err) {
      console.error('Excel error:', err);
      showToast('Failed to generate Excel', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-surface-500 text-sm mt-1">Detailed financial analysis</p>
        </div>
        {reportData && (
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="btn-secondary">
              <FiDownload size={16} />
              <span className="hidden sm:inline">{downloadingPdf ? 'Generating...' : 'PDF'}</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button onClick={handleDownloadExcel} className="btn-secondary">
              <FiFileText size={16} />
              <span className="hidden sm:inline">Excel</span>
              <span className="sm:hidden">XLS</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id}
            onClick={() => { setTab(t.id); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-surface-0 text-surface-800 shadow-sm' : 'text-surface-500 hover:text-surface-700'
              }`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div id="report-content" className="p-1 sm:p-2 bg-surface-50">

        {/* Monthly Report */}
        {tab === 'monthly' && (
          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="label">Year</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input w-32">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Month</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input w-40">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{getMonthName(i)}</option>
                    ))}
                  </select>
                </div>
                <button onClick={fetchReport} className="btn-primary">Generate Report</button>
              </div>
            </div>

            {loading ? <LoadingSpinner /> : reportData?.summary && (
              <>
                <div className="bg-surface-0 border border-surface-200 rounded-2xl overflow-hidden mb-6">
                  <div className="bg-primary-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white">Monthly Financial Report</h2>
                      <span className="text-primary-200 text-sm font-medium">GoruFarm</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Period</span>
                      <p className="text-surface-800 font-semibold">{getMonthName(month)} {year}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Generated By</span>
                      <p className="text-surface-800 font-semibold flex items-center gap-1"><FiUser size={12} /> {userName}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Date</span>
                      <p className="text-surface-800 font-semibold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Currency</span>
                      <p className="text-surface-800 font-semibold">BDT (Taka)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Income</span>
                    <p className="text-xl font-bold text-green-600">{formatBDT(reportData.summary.totalIncome)}</p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Expense</span>
                    <p className="text-xl font-bold text-red-500">{formatBDT(reportData.summary.totalExpense)}</p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Profit/Loss</span>
                    <p className={`text-xl font-bold ${reportData.summary.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatBDT(reportData.summary.profit)}
                    </p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Active Cows</span>
                    <p className="text-xl font-bold text-surface-800">{reportData.summary.activeCowsCount}</p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Avg Cost/Cow</span>
                    <p className="text-xl font-bold text-accent-600">{formatBDT(reportData.summary.avgCostPerCow)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-surface-700 mb-4">Category Breakdown</h3>
                    {reportData.categoryBreakdown?.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[1fr,50px,120px] gap-2 text-xs font-semibold text-surface-500 uppercase mb-2 pb-1 border-b border-surface-100">
                          <span>Category</span>
                          <span className="text-center">Count</span>
                          <span className="text-right">Amount</span>
                        </div>
                        {(() => {
                          const maxTotal = Math.max(...reportData.categoryBreakdown.map((x: any) => x.total), 1);
                          return reportData.categoryBreakdown.map((c: { type: string; category: string; total: number; count: number }, i: number) => {
                            const color = c.type === 'income' ? 'green' : 'red';
                            return (
                              <div key={i}>
                                <div className="grid grid-cols-[1fr,50px,120px] gap-2 text-sm mb-1 items-center">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className={`w-2 h-2 rounded-full bg-${color}-500 shrink-0`} />
                                    <span className="text-surface-700 truncate">{c.category}</span>
                                  </div>
                                  <span className="text-xs text-surface-400 text-center">({c.count})</span>
                                  <span className={`font-semibold text-right text-${color}-600`}>{formatBDT(c.total)}</span>
                                </div>
                                <div className="w-full bg-surface-100 rounded-full h-1.5">
                                  <div className={`bg-${color}-400 h-1.5 rounded-full transition-all`}
                                    style={{ width: `${(c.total / maxTotal) * 100}%` }} />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (<p className="text-sm text-surface-400">No data for this month</p>)}
                  </div>
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-surface-700 mb-4">Expense Distribution</h3>
                    {reportData.categoryBreakdown?.filter((c: { type: string }) => c.type === 'expense').length > 0 ? (
                      <div className="h-64">
                        <Doughnut
                          data={{
                            labels: reportData.categoryBreakdown.filter((c: { type: string }) => c.type === 'expense').map((c: { category: string }) => c.category),
                            datasets: [{
                              data: reportData.categoryBreakdown.filter((c: { type: string }) => c.type === 'expense').map((c: { total: number }) => c.total),
                              backgroundColor: doughnutColors, borderWidth: 0,
                            }],
                          }}
                          options={{
                            responsive: true, maintainAspectRatio: false, cutout: '60%',
                            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 11 } } } },
                          }}
                        />
                      </div>
                    ) : (<div className="h-64 flex items-center justify-center text-surface-400 text-sm">No expenses</div>)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Cow Cost Analysis */}
        {tab === 'cow-cost' && (
          <div className="space-y-6">
            <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-700">Cost Analysis Options</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Search tag or name..." 
                  className="input flex-1 sm:w-48 text-sm py-2"
                  value={cowSearch}
                  onChange={(e) => setCowSearch(e.target.value)}
                />
                <select 
                  className="input w-auto text-sm py-2" 
                  value={cowStatusFilter} 
                  onChange={(e) => setCowStatusFilter(e.target.value)}
                >
                  <option value="all">All Cows</option>
                  <option value="active">Active Only</option>
                  <option value="sold">Sold Only</option>
                </select>
              </div>
            </div>
            {loading ? <LoadingSpinner /> : reportData?.cows?.length > 0 ? (
              <>
                <div className="bg-surface-0 border border-surface-200 rounded-2xl overflow-hidden mb-6">
                  <div className="bg-primary-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white">Cow Cost Analysis Report</h2>
                      <span className="text-primary-200 text-sm font-medium">GoruFarm</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Total Cows</span>
                      <p className="text-surface-800 font-semibold">{reportData.cows.length}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Generated By</span>
                      <p className="text-surface-800 font-semibold flex items-center gap-1"><FiUser size={12} /> {userName}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Date</span>
                      <p className="text-surface-800 font-semibold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Currency</span>
                      <p className="text-surface-800 font-semibold">BDT (Taka)</p>
                    </div>
                  </div>
                </div>

                {(() => {
                  const totalPurchase = filteredCows.reduce((sum: number, c: any) => sum + c.purchasePrice, 0);
                  const totalIndividual = filteredCows.reduce((sum: number, c: any) => sum + c.individualExpenses, 0);
                  const totalShared = filteredCows.reduce((sum: number, c: any) => sum + c.sharedExpenses, 0);
                  const totalCost = filteredCows.reduce((sum: number, c: any) => sum + c.totalCost, 0);
                  const totalProfit = filteredCows.reduce((sum: number, c: any) => sum + (c.profitLoss || 0), 0);
                  
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                      <div className="stat-card">
                        <span className="text-xs font-medium text-surface-500 uppercase">Total Purchase</span>
                        <p className="text-xl font-bold text-surface-800">{formatBDT(totalPurchase)}</p>
                      </div>
                      <div className="stat-card">
                        <span className="text-xs font-medium text-surface-500 uppercase">Indiv. Expenses</span>
                        <p className="text-xl font-bold text-surface-800">{formatBDT(totalIndividual)}</p>
                      </div>
                      <div className="stat-card">
                        <span className="text-xs font-medium text-surface-500 uppercase">Shared Expenses</span>
                        <p className="text-xl font-bold text-surface-800">{formatBDT(totalShared)}</p>
                      </div>
                      <div className="stat-card">
                        <span className="text-xs font-medium text-surface-500 uppercase">Total Cost</span>
                        <p className="text-xl font-bold text-accent-600">{formatBDT(totalCost)}</p>
                      </div>
                      <div className="stat-card">
                        <span className="text-xs font-medium text-surface-500 uppercase">Total Profit</span>
                        <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatBDT(totalProfit)}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="table-container">
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Tag</th><th>Name</th><th>Status</th>
                          <th className="text-right">Purchase</th><th className="text-right">Individual</th>
                          <th className="text-right">Shared</th><th className="text-right">Total Cost</th>
                          <th className="text-right">Months</th><th className="text-right">Sell / Suggested</th>
                          <th className="text-right">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCows.map((cow: any) => (
                          <tr key={cow._id}>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                {cow.image ? (
                                  <div className="relative w-7 h-7 rounded bg-surface-100 overflow-hidden shrink-0">
                                    <Image src={cow.image} alt={cow.tag} fill sizes="28px" className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded bg-surface-100 flex items-center justify-center shrink-0">
                                    <GiCow className="text-surface-400" size={14} />
                                  </div>
                                )}
                                <span>{cow.tag}</span>
                              </div>
                            </td>
                            <td>{cow.name || '—'}</td>
                            <td><span className={cow.status === 'active' ? 'badge-active' : 'badge-sold'}>{cow.status}</span></td>
                            <td className="text-right">{formatBDT(cow.purchasePrice)}</td>
                            <td className="text-right">{formatBDT(cow.individualExpenses)}</td>
                            <td className="text-right">{formatBDT(cow.sharedExpenses)}</td>
                            <td className="text-right font-semibold">{formatBDT(cow.totalCost)}</td>
                            <td className="text-right">{cow.monthsActive}</td>
                            <td className="text-right">
                              {cow.status === 'sold' && cow.sellPrice
                                ? <span className="text-accent-600 font-medium">{formatBDT(cow.sellPrice)}</span>
                                : <span className="text-green-600 font-medium">{formatBDT(cow.suggestedSellPrice)}</span>}
                            </td>
                            <td className="text-right">
                              {cow.profitLoss !== null ? (
                                <span className={`font-semibold ${cow.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {cow.profitLoss >= 0 ? '+' : ''}{formatBDT(cow.profitLoss)}
                                </span>
                              ) : <span className="text-surface-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : !loading && (
              <div className="empty-state">
                <GiCow className="text-surface-300 mb-4" size={48} />
                <p className="text-surface-500">No cows found. Add cows first to see cost analysis.</p>
              </div>
            )}
          </div>
        )}

        {/* Custom Flexible Report */}
        {tab === 'custom' && (
          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-surface-700 mb-4 flex items-center gap-2">
                <FiFilter size={15} /> Filter Options
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
                </div>
                <MultiSelect label="Transaction Type" options={['expense', 'income', 'investment']}
                  selected={selectedTypes} onChange={(v) => { setSelectedTypes(v); setSelectedCategories([]); }} />
                <MultiSelect label="Categories" options={[...new Set(availableCategories)]}
                  selected={selectedCategories} onChange={setSelectedCategories} />
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-surface-100">
                <button onClick={fetchReport} className="btn-primary">
                  <FiBarChart2 size={14} /> Generate Report
                </button>
                <button onClick={() => { setStartDate(''); setEndDate(''); setSelectedTypes([]); setSelectedCategories([]); }}
                  className="btn-ghost text-sm">Clear Filters</button>
                {(selectedCategories.length > 0 || selectedTypes.length > 0) && (
                  <p className="text-xs text-surface-400">
                    Filtering: {selectedTypes.length > 0 ? `${selectedTypes.length} type(s)` : 'All types'}
                    {selectedCategories.length > 0 ? `, ${selectedCategories.length} category(ies)` : ''}
                  </p>
                )}
              </div>
            </div>

            {loading ? <LoadingSpinner /> : reportData?.summary ? (
              <>
                <div className="bg-surface-0 border border-surface-200 rounded-2xl overflow-hidden mb-6">
                  <div className="bg-primary-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white">Custom Financial Report</h2>
                      <span className="text-primary-200 text-sm font-medium">GoruFarm</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Period</span>
                      <p className="text-surface-800 font-semibold">{startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Generated By</span>
                      <p className="text-surface-800 font-semibold flex items-center gap-1"><FiUser size={12} /> {userName}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Date</span>
                      <p className="text-surface-800 font-semibold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <span className="text-surface-400 text-xs uppercase font-medium">Currency</span>
                      <p className="text-surface-800 font-semibold">BDT (Taka)</p>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Total Income</span>
                    <p className="text-xl font-bold text-green-600">{formatBDT(reportData.summary.totalIncome)}</p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Total Expense</span>
                    <p className="text-xl font-bold text-red-500">{formatBDT(reportData.summary.totalExpense)}</p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Net Profit/Loss</span>
                    <p className={`text-xl font-bold ${(reportData.summary.totalIncome - reportData.summary.totalExpense) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatBDT(reportData.summary.totalIncome - reportData.summary.totalExpense)}
                    </p>
                  </div>
                  <div className="stat-card">
                    <span className="text-xs font-medium text-surface-500 uppercase">Transactions</span>
                    <p className="text-xl font-bold text-surface-800">{reportData.summary.totalTransactions}</p>
                  </div>
                </div>

                {/* Charts + Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Breakdown with progress bars */}
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-surface-700 mb-4">Category Breakdown</h3>
                    {reportData.categories?.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        <div className="grid grid-cols-[1fr,50px,120px] gap-2 text-xs font-semibold text-surface-500 uppercase mb-2 pb-1 border-b border-surface-100">
                          <span>Category</span>
                          <span className="text-center">Count</span>
                          <span className="text-right">Amount</span>
                        </div>
                        {reportData.categories.map((c: { type: string; category: string; total: number; count: number }, i: number) => {
                          const maxTotal = Math.max(...reportData.categories.map((x: { total: number }) => x.total), 1);
                          const color = c.type === 'income' ? 'green' : c.type === 'investment' ? 'blue' : 'red';
                          return (
                            <div key={i}>
                                <div className="grid grid-cols-[1fr,50px,120px] gap-2 text-sm mb-1 items-center">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className={`w-2 h-2 rounded-full bg-${color}-500 shrink-0`} />
                                    <span className="text-surface-700 truncate">{c.category}</span>
                                  </div>
                                  <span className="text-xs text-surface-400 text-center">({c.count})</span>
                                  <span className={`font-semibold text-right text-${color}-600`}>{formatBDT(c.total)}</span>
                                </div>
                              <div className="w-full bg-surface-100 rounded-full h-2">
                                <div className={`bg-${color}-400 h-2 rounded-full transition-all`}
                                  style={{ width: `${(c.total / maxTotal) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-sm text-surface-400">No data found</p>}
                  </div>

                  {/* Doughnut Chart */}
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-surface-700 mb-4">Distribution</h3>
                    {reportData.categories?.length > 0 ? (
                      <div className="h-72 flex items-center justify-center">
                        <Doughnut
                          data={{
                            labels: reportData.categories.map((c: { category: string }) => c.category),
                            datasets: [{
                              data: reportData.categories.map((c: { total: number }) => c.total),
                              backgroundColor: doughnutColors.slice(0, reportData.categories.length),
                              borderWidth: 0, hoverOffset: 6,
                            }],
                          }}
                          options={{
                            responsive: true, maintainAspectRatio: false, cutout: '55%',
                            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } },
                          }}
                        />
                      </div>
                    ) : <div className="h-72 flex items-center justify-center text-surface-400 text-sm">No data</div>}
                  </div>
                </div>

                {/* Transaction Details Table with Pagination */}
                {reportData.transactions?.length > 0 && (() => {
                  const txList = reportData.transactions;
                  const rpTotalPages = Math.ceil(txList.length / REPORT_PER_PAGE);
                  const rpStart = (reportPage - 1) * REPORT_PER_PAGE;
                  const rpSlice = txList.slice(rpStart, rpStart + REPORT_PER_PAGE);
                  return (
                    <div className="card">
                      <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-surface-700">
                          Transaction Details ({txList.length})
                        </h3>
                        <p className="text-xs text-surface-400">
                          Page {reportPage} of {rpTotalPages}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-50 border-b border-surface-200">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Date</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Type</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Category</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Description</th>
                              <th className="px-5 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rpSlice.map((t: any) => (
                              <tr key={t._id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50/50">
                                <td className="px-5 py-3 whitespace-nowrap text-surface-600">
                                  {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`badge ${t.type === 'income' ? 'bg-green-50 text-green-700' : t.type === 'investment' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-surface-700">{t.category}</td>
                                <td className="px-5 py-3 text-surface-500 max-w-[200px] truncate">{t.description || '—'}</td>
                                <td className={`px-5 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                  {t.type === 'income' ? '+' : '-'}{formatBDT(t.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {rpTotalPages > 1 && (
                        <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
                          <p className="text-xs text-surface-400">
                            Showing {rpStart + 1}–{Math.min(rpStart + REPORT_PER_PAGE, txList.length)} of {txList.length}
                          </p>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setReportPage(p => Math.max(1, p - 1))} disabled={reportPage === 1}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                            {Array.from({ length: Math.min(rpTotalPages, 5) }, (_, i) => {
                              let p: number;
                              if (rpTotalPages <= 5) p = i + 1;
                              else if (reportPage <= 3) p = i + 1;
                              else if (reportPage >= rpTotalPages - 2) p = rpTotalPages - 4 + i;
                              else p = reportPage - 2 + i;
                              return (
                                <button key={p} onClick={() => setReportPage(p)}
                                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${reportPage === p ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100 border border-surface-200'
                                    }`}>{p}</button>
                              );
                            })}
                            <button onClick={() => setReportPage(p => Math.min(rpTotalPages, p + 1))} disabled={reportPage === rpTotalPages}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : !loading && (
              <div className="empty-state">
                <FiFilter className="text-surface-300 mb-4" size={48} />
                <p className="text-surface-500">Set your filters and click Generate Report</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
