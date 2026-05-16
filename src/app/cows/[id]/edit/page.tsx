'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { formatDateForInput } from '@/lib/utils';

export default function EditCowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    tag: '',
    name: '',
    breed: '',
    dateOfBirth: '',
    purchaseDate: '',
    purchasePrice: '',
    weight: '',
    image: '',
    status: 'active' as 'active' | 'sold',
    sellDate: '',
    sellPrice: '',
    buyerName: '',
    buyerPhone: '',
    notes: '',
  });

  useEffect(() => {
    fetch(`/api/cows/${id}`)
      .then((res) => res.json())
      .then((cow) => {
        setForm({
          tag: cow.tag || '',
          name: cow.name || '',
          breed: cow.breed || '',
          dateOfBirth: cow.dateOfBirth ? formatDateForInput(cow.dateOfBirth) : '',
          purchaseDate: cow.purchaseDate ? formatDateForInput(cow.purchaseDate) : '',
          purchasePrice: cow.purchasePrice?.toString() || '',
          weight: cow.weight?.toString() || '',
          image: cow.image || '',
          status: cow.status || 'active',
          sellDate: cow.sellDate ? formatDateForInput(cow.sellDate) : '',
          sellPrice: cow.sellPrice?.toString() || '',
          buyerName: cow.buyerName || '',
          buyerPhone: cow.buyerPhone || '',
          notes: cow.notes || '',
        });
        setLoading(false);
      })
      .catch(() => {
        showToast('Failed to load cow', 'error');
        setLoading(false);
      });
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, image: data.url }));
        showToast('Image uploaded');
      }
    } catch {
      showToast('Image upload failed', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        weight: form.weight ? Number(form.weight) : undefined,
        sellPrice: form.sellPrice ? Number(form.sellPrice) : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        sellDate: form.sellDate || undefined,
      };
      const res = await fetch(`/api/cows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Cow updated successfully!');
        router.push(`/cows/${id}`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update', 'error');
      }
    } catch {
      showToast('Failed to update cow', 'error');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cows/${id}`} className="btn-ghost p-2">
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Edit Cow - {form.tag}</h1>
          <p className="text-surface-500 text-sm mt-0.5">Update cow information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image */}
        <div className="card p-5">
          <label className="label">Cow Photo</label>
          <div className="flex items-center gap-4">
            {(imagePreview || form.image) && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-surface-200">
                <Image src={imagePreview || form.image} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setForm((p) => ({ ...p, image: '' })); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <FiX size={12} />
                </button>
              </div>
            )}
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-surface-200 rounded-xl p-6 text-center hover:border-primary-400 transition-all">
                <FiUpload className="mx-auto text-surface-400 mb-2" size={24} />
                <p className="text-sm text-surface-500">Upload new photo</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tag / ID *</label>
              <input type="text" required value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Breed</label>
              <select value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))} className="input">
                <option value="">Select breed</option>
                <option value="Shahiwal">Shahiwal</option>
                <option value="Red Chittagong">Red Chittagong</option>
                <option value="Local Desi">Local Desi</option>
                <option value="Friesian">Friesian</option>
                <option value="Jersey">Jersey</option>
                <option value="Cross Breed">Cross Breed</option>
                <option value="Brahman">Brahman</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className="input" />
          </div>
        </div>

        {/* Purchase Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Purchase Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Date *</label>
              <input type="date" required value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Purchase Price (৳) *</label>
              <input type="number" required value={form.purchasePrice} onChange={(e) => setForm((p) => ({ ...p, purchasePrice: e.target.value }))} className="input" />
            </div>
          </div>
        </div>

        {/* Status & Sale Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Status</h3>
          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'active' | 'sold' }))} className="input">
              <option value="active">Active</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {form.status === 'sold' && (
            <div className="space-y-4 pt-2 border-t border-surface-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Sell Date</label>
                  <input type="date" value={form.sellDate} onChange={(e) => setForm((p) => ({ ...p, sellDate: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Sell Price (৳)</label>
                  <input type="number" value={form.sellPrice} onChange={(e) => setForm((p) => ({ ...p, sellPrice: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Buyer Name</label>
                  <input type="text" value={form.buyerName} onChange={(e) => setForm((p) => ({ ...p, buyerName: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Buyer Phone</label>
                  <input type="text" value={form.buyerPhone} onChange={(e) => setForm((p) => ({ ...p, buyerPhone: e.target.value }))} className="input" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label">Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="input resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href={`/cows/${id}`} className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
