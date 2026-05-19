'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/Toast';

export default function AddCowPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    tag: '',
    name: '',
    breed: '',
    dateOfBirth: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    weight: '',
    image: '',
    notes: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, image: data.url }));
        showToast('Image uploaded');
      } else {
        showToast(data.error || 'Upload failed', 'error');
        setImagePreview(null);
      }
    } catch {
      showToast('Image upload failed', 'error');
      setImagePreview(null);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        weight: form.weight ? Number(form.weight) : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      };

      const res = await fetch('/api/cows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Cow added successfully!');
        router.push('/cows');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add cow', 'error');
      }
    } catch {
      showToast('Failed to add cow', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cows" className="btn-ghost p-2">
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Add New Cow</h1>
          <p className="text-surface-500 text-sm mt-0.5">Register a newly purchased cow</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="card p-5">
          <label className="label">Cow Photo</label>
          <div className="flex items-center gap-4">
            {imagePreview || form.image ? (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-surface-200">
                <Image
                  src={imagePreview || form.image}
                  alt="Cow preview"
                  fill
                  sizes="96px"
                  unoptimized={!!imagePreview}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setForm((prev) => ({ ...prev, image: '' }));
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : null}
            <label className="flex-1 cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploading ? 'border-primary-400 bg-primary-50/50' : 'border-surface-200 hover:border-primary-400 hover:bg-primary-50/50'}`}>
                <FiUpload className={`mx-auto mb-2 ${uploading ? 'text-primary-500 animate-pulse' : 'text-surface-400'}`} size={24} />
                <p className="text-sm text-surface-500">{uploading ? 'Uploading...' : 'Click to upload photo'}</p>
                <p className="text-xs text-surface-400 mt-1">JPEG, PNG, WebP (max 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Basic Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tag / ID (Auto-generated if blank)</label>
              <input
                type="text"
                placeholder="Leave blank for cow-0001"
                value={form.tag}
                onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                placeholder="e.g. Lalmoni"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Breed</label>
              <select
                value={form.breed}
                onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                className="input"
              >
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
              <input
                type="number"
                placeholder="e.g. 250"
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Date of Birth (Approximate)</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        {/* Purchase Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Purchase Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Date *</label>
              <input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Purchase Price (৳) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 80000"
                value={form.purchasePrice}
                onChange={(e) => setForm((p) => ({ ...p, purchasePrice: e.target.value }))}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Notes</h3>
          <textarea
            rows={3}
            placeholder="Any additional notes about this cow..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="input resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link href="/cows" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading || uploading} className="btn-primary">
            {loading ? 'Adding...' : uploading ? 'Wait for upload...' : 'Add Cow'}
          </button>
        </div>
      </form>
    </div>
  );
}
