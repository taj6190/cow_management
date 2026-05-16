'use client';

import { useState } from 'react';
import { FiDownload, FiUpload, FiAlertTriangle, FiCheck, FiDatabase } from 'react-icons/fi';
import { useToast } from '@/components/Toast';

export default function BackupPage() {
  const { showToast } = useToast();
  const [restoring, setRestoring] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cowfarm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup downloaded!');
    } catch {
      showToast('Failed to download', 'error');
    }
    setDownloading(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('WARNING: This will REPLACE all current data. Continue?')) {
      e.target.value = '';
      return;
    }
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const r = await res.json();
        showToast(`Restored: ${r.counts.cows} cows, ${r.counts.transactions} transactions`);
      } else {
        showToast('Restore failed', 'error');
      }
    } catch {
      showToast('Invalid backup file', 'error');
    }
    setRestoring(false);
    e.target.value = '';
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backup & Restore</h1>
          <p className="text-surface-500 text-sm mt-1">Protect your farm data</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-5 bg-primary-50 border-primary-200">
          <div className="flex gap-3">
            <FiDatabase className="text-primary-600 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-primary-800 mb-1">Why Backup?</h3>
              <p className="text-sm text-primary-700">
                Regular backups protect your farm data. Download weekly and keep copies in multiple locations.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <FiDownload className="text-green-600" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-surface-800 text-lg">Download Backup</h3>
              <p className="text-sm text-surface-500 mt-1 mb-4">Complete copy of all your data as JSON.</p>
              <button onClick={handleDownload} disabled={downloading} className="btn-primary">
                <FiDownload size={16} />
                {downloading ? 'Downloading...' : 'Download Full Backup'}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
              <FiUpload className="text-accent-600" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-surface-800 text-lg">Restore from Backup</h3>
              <p className="text-sm text-surface-500 mt-1 mb-3">Upload a backup file to restore data.</p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <div className="flex gap-2">
                  <FiAlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> Restoring will replace all current data.
                  </p>
                </div>
              </div>
              <label className="cursor-pointer">
                <div className="btn-secondary inline-flex">
                  <FiUpload size={16} />
                  {restoring ? 'Restoring...' : 'Choose Backup File'}
                </div>
                <input type="file" accept=".json" onChange={handleRestore} disabled={restoring} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 mb-3">💡 Backup Tips</h3>
          <div className="space-y-3">
            {[
              'Download backup at least once a week',
              'Keep copies in multiple locations (USB, cloud)',
              'Email the backup file to yourself',
              'Always backup before major changes',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-surface-600">
                <FiCheck className="text-primary-500 shrink-0" size={14} />
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
