import React, { useState, useEffect } from 'react';
import { LayoutGrid, Check, RefreshCw, Sparkles, Tag, Plus, Trash2, ArrowUp, ArrowDown, Upload, Image as ImageIcon, Circle } from 'lucide-react';
import { adminGetVendorCategories, adminGetHomepageShowcase, adminUpdateHomepageShowcase, uploadToCloudinary } from '../../api';
import { useToast } from '../../context/ToastContext';

const DEFAULT_BREED_CIRCLES = [
  { id: 'guppy', name: 'Guppy', tag: 'guppy', count: 'Premium Guppy Strains & Varieties', color: '#E08A3C', image: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Guppy_02.JPG' },
  { id: 'hmpk', name: 'HMPK', tag: 'hmpk', count: 'Half Moon Plakat Bettas', color: '#2F7FD1', image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop' }
];

export default function AdminShowcaseManager() {
  const toast = useToast();
  const [vendorsData, setVendorsData] = useState([]);
  const [showcase, setShowcase] = useState({ featuredCategories: [], featuredBreeds: [], breedCircles: DEFAULT_BREED_CIRCLES });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [activeTab, setActiveTab] = useState('circles'); // 'circles' | 'vendor_badges'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, sRes] = await Promise.all([
        adminGetVendorCategories(),
        adminGetHomepageShowcase(),
      ]);
      setVendorsData(vRes.data.vendorCategories || []);
      const loadedShowcase = sRes.data.showcase || {};
      setShowcase({
        featuredCategories: loadedShowcase.featuredCategories || [],
        featuredBreeds: loadedShowcase.featuredBreeds || [],
        breedCircles: (loadedShowcase.breedCircles && loadedShowcase.breedCircles.length > 0)
          ? loadedShowcase.breedCircles
          : DEFAULT_BREED_CIRCLES,
      });
    } catch (err) {
      console.error('Failed to load showcase data:', err);
      toast.error('Failed to load vendor categories');
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract list of all unique breed names & category names across vendors
  const allAvailableBreedOptions = React.useMemo(() => {
    const options = new Map();
    vendorsData.forEach(v => {
      (v.categories || []).forEach(cat => {
        if (!options.has(cat.categoryName.toLowerCase())) {
          options.set(cat.categoryName.toLowerCase(), { name: cat.categoryName, type: 'Category' });
        }
        (cat.breeds || []).forEach(b => {
          if (!options.has(b.toLowerCase())) {
            options.set(b.toLowerCase(), { name: b, type: `Breed (${cat.categoryName})` });
          }
        });
      });
    });
    return Array.from(options.values());
  }, [vendorsData]);

  // Handle Circle Avatar Edits
  const handleUpdateCircleField = (index, field, value) => {
    setShowcase(prev => {
      const nextCircles = [...(prev.breedCircles || [])];
      nextCircles[index] = { ...nextCircles[index], [field]: value };
      return { ...prev, breedCircles: nextCircles };
    });
  };

  const handleAddCircle = () => {
    const newCircle = {
      id: `circle_${Date.now()}`,
      name: 'New Breed / Category',
      tag: 'new_breed',
      count: 'Explore varieties',
      color: '#0D5148',
      image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop',
    };
    setShowcase(prev => ({
      ...prev,
      breedCircles: [...(prev.breedCircles || []), newCircle],
    }));
    toast.success('Added new breed circle');
  };

  const handleRemoveCircle = (index) => {
    if ((showcase.breedCircles || []).length <= 1) {
      toast.info('At least one circle is required');
      return;
    }
    setShowcase(prev => ({
      ...prev,
      breedCircles: prev.breedCircles.filter((_, i) => i !== index),
    }));
  };

  const handleMoveCircle = (index, direction) => {
    const circles = [...(showcase.breedCircles || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= circles.length) return;
    const temp = circles[index];
    circles[index] = circles[targetIdx];
    circles[targetIdx] = temp;
    setShowcase(prev => ({ ...prev, breedCircles: circles }));
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploadingIdx(index);
      toast.info('Uploading circle image...');
      const url = await uploadToCloudinary(file);
      handleUpdateCircleField(index, 'image', url);
      toast.success('Circle image uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingIdx(null);
    }
  };

  const isCategoryFeatured = (vendorId, catName) => {
    return (showcase.featuredCategories || []).some(
      (fc) => String(fc.vendorId) === String(vendorId) && fc.categoryName.toLowerCase() === catName.toLowerCase()
    );
  };

  const isBreedFeatured = (vendorId, catName, breedName) => {
    return (showcase.featuredBreeds || []).some(
      (fb) =>
        String(fb.vendorId) === String(vendorId) &&
        fb.categoryName.toLowerCase() === catName.toLowerCase() &&
        fb.breedName.toLowerCase() === breedName.toLowerCase()
    );
  };

  const toggleCategory = (vendor, cat) => {
    setShowcase((prev) => {
      const current = prev.featuredCategories || [];
      const exists = current.some(
        (fc) => String(fc.vendorId) === String(vendor.vendorId) && fc.categoryName.toLowerCase() === cat.categoryName.toLowerCase()
      );

      let next;
      if (exists) {
        next = current.filter(
          (fc) => !(String(fc.vendorId) === String(vendor.vendorId) && fc.categoryName.toLowerCase() === cat.categoryName.toLowerCase())
        );
      } else {
        next = [
          ...current,
          {
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName,
            categoryName: cat.categoryName,
            breeds: cat.breeds,
          },
        ];
      }
      return { ...prev, featuredCategories: next };
    });
  };

  const toggleBreed = (vendor, cat, breedName) => {
    setShowcase((prev) => {
      const current = prev.featuredBreeds || [];
      const exists = current.some(
        (fb) =>
          String(fb.vendorId) === String(vendor.vendorId) &&
          fb.categoryName.toLowerCase() === cat.categoryName.toLowerCase() &&
          fb.breedName.toLowerCase() === breedName.toLowerCase()
      );

      let next;
      if (exists) {
        next = current.filter(
          (fb) =>
            !(
              String(fb.vendorId) === String(vendor.vendorId) &&
              fb.categoryName.toLowerCase() === cat.categoryName.toLowerCase() &&
              fb.breedName.toLowerCase() === breedName.toLowerCase()
            )
        );
      } else {
        next = [
          ...current,
          {
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName,
            categoryName: cat.categoryName,
            breedName: breedName,
          },
        ];
      }
      return { ...prev, featuredBreeds: next };
    });
  };

  const handleSaveShowcase = async () => {
    try {
      setSaving(true);
      const res = await adminUpdateHomepageShowcase(showcase);
      setShowcase(prev => ({ ...prev, ...res.data.showcase }));
      window.dispatchEvent(new CustomEvent('app-data-updated'));
      toast.success('Homepage featured showcase & breed circles saved successfully!');
    } catch (err) {
      toast.error('Failed to save showcase settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#60736F' }}>
        <RefreshCw className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
        <p>Loading vendor categories and showcase data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: 20, background: '#FFFFFF', borderRadius: 16, border: '1px solid #D6E3DE' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#12332F', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles style={{ width: 22, height: 22, color: '#D97706' }} /> Homepage Breed Circles & Showcase Settings
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#60736F', margin: '4px 0 0 0' }}>
              Customize the small breed circle avatars shown on the top feed and highlight top vendor categories.
            </p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleSaveShowcase} 
            disabled={saving}
            style={{ padding: '9px 22px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #E2EBE6', paddingBottom: 10 }}>
          <button
            onClick={() => setActiveTab('circles')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'circles' ? '#0D5148' : '#E8F1ED',
              color: activeTab === 'circles' ? '#FFFFFF' : '#0D5148',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Circle size={15} /> Breed Circles (Small Avatars)
          </button>

          <button
            onClick={() => setActiveTab('vendor_badges')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'vendor_badges' ? '#0D5148' : '#E8F1ED',
              color: activeTab === 'vendor_badges' ? '#FFFFFF' : '#0D5148',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Tag size={15} /> Vendor Badges & Categories
          </button>
        </div>
      </div>

      {/* TAB 1: HOMEPAGE BREED CIRCLES CUSTOMIZER */}
      {activeTab === 'circles' && (
        <div className="card" style={{ padding: 20, background: '#FFFFFF', borderRadius: 16, border: '1px solid #D6E3DE' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#12332F', margin: 0 }}>
                🔴 Circle Avatars Preview & Manager
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#60736F', margin: '2px 0 0' }}>
                These round icons are displayed on the top of the homepage feed. You can change their breed name, image, and color.
              </p>
            </div>
            <button
              onClick={handleAddCircle}
              style={{
                background: '#E8F1ED',
                color: '#0D5148',
                border: '1px solid #B8D5CB',
                borderRadius: 10,
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} /> Add Breed Circle
            </button>
          </div>

          {/* LIVE HOMEPAGE PREVIEW BAR */}
          <div style={{ background: '#F3F8F5', borderRadius: 16, padding: 14, marginBottom: 24, border: '1px dashed #0D5148' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0D5148', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
              LIVE HOMEPAGE CIRCLES PREVIEW
            </p>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 6 }}>
              {(showcase.breedCircles || []).map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: cat.color || '#0D5148',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
                  }}>
                    <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Guppy_02.JPG'; }} />
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#12332F' }}>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CIRCLE EDITORS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(showcase.breedCircles || []).map((circle, index) => (
              <div
                key={circle.id || index}
                style={{
                  border: '1px solid #E2EBE6',
                  borderRadius: 14,
                  padding: 16,
                  background: '#FAFCFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: circle.color || '#0D5148',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>
                      <img src={circle.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.94rem', color: '#12332F' }}>
                        Circle #{index + 1}: {circle.name}
                      </h5>
                      <span style={{ fontSize: '0.74rem', color: '#60736F' }}>Tag / Filter: <strong>{circle.tag || circle.id}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleMoveCircle(index, -1)}
                      disabled={index === 0}
                      title="Move Up"
                      style={{ background: '#E8F1ED', border: 'none', borderRadius: 8, padding: 6, cursor: index === 0 ? 'default' : 'pointer', color: '#0D5148', opacity: index === 0 ? 0.4 : 1 }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveCircle(index, 1)}
                      disabled={index === showcase.breedCircles.length - 1}
                      title="Move Down"
                      style={{ background: '#E8F1ED', border: 'none', borderRadius: 8, padding: 6, cursor: index === showcase.breedCircles.length - 1 ? 'default' : 'pointer', color: '#0D5148', opacity: index === showcase.breedCircles.length - 1 ? 0.4 : 1 }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveCircle(index)}
                      title="Delete Circle"
                      style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* EDIT FORM FIELDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 4 }}>
                  {/* Select from existing vendor breeds/categories */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#12332F', display: 'block', marginBottom: 4 }}>
                      Choose Breed / Category
                    </label>
                    <select
                      value={circle.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateCircleField(index, 'name', val);
                        handleUpdateCircleField(index, 'tag', val.toLowerCase().replace(/\s+/g, '_'));
                      }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D6E3DE', fontSize: '0.82rem', background: '#FFF' }}
                    >
                      <option value={circle.name}>{circle.name} (Custom)</option>
                      {allAvailableBreedOptions.map((opt, i) => (
                        <option key={i} value={opt.name}>{opt.name} — {opt.type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Name */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#12332F', display: 'block', marginBottom: 4 }}>
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={circle.name}
                      onChange={(e) => handleUpdateCircleField(index, 'name', e.target.value)}
                      placeholder="e.g. Guppy, HMPK, Betta"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D6E3DE', fontSize: '0.82rem', background: '#FFF' }}
                    />
                  </div>

                  {/* Tag / Search Keyword */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#12332F', display: 'block', marginBottom: 4 }}>
                      Filter Tag / Search Keyword
                    </label>
                    <input
                      type="text"
                      value={circle.tag || circle.id || ''}
                      onChange={(e) => handleUpdateCircleField(index, 'tag', e.target.value)}
                      placeholder="e.g. guppy, hmpk, betta"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D6E3DE', fontSize: '0.82rem', background: '#FFF' }}
                    />
                  </div>

                  {/* Subtitle / Count text */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#12332F', display: 'block', marginBottom: 4 }}>
                      Subtitle / Description
                    </label>
                    <input
                      type="text"
                      value={circle.count || ''}
                      onChange={(e) => handleUpdateCircleField(index, 'count', e.target.value)}
                      placeholder="e.g. Premium Guppy Strains"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D6E3DE', fontSize: '0.82rem', background: '#FFF' }}
                    />
                  </div>
                </div>

                {/* IMAGE URL & UPLOAD */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#12332F', display: 'block', marginBottom: 4 }}>
                    Circle Image (File Upload or Image URL)
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={circle.image || ''}
                      onChange={(e) => handleUpdateCircleField(index, 'image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #D6E3DE', fontSize: '0.82rem', background: '#FFF' }}
                    />
                    <label
                      style={{
                        background: '#0D5148',
                        color: '#FFFFFF',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {uploadingIdx === index ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
                      {uploadingIdx === index ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleImageUpload(index, e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR FEATURED BADGES & CATEGORIES */}
      {activeTab === 'vendor_badges' && (
        <div className="card" style={{ padding: 20, background: '#FFFFFF', borderRadius: 16, border: '1px solid #D6E3DE' }}>
          {/* Selected Counts Overview */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#FEF3C7', padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag style={{ width: 18, height: 18, color: '#B45309' }} />
              <span style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
                {(showcase.featuredCategories || []).length} Featured Categories
              </span>
            </div>
            <div style={{ background: '#E0F2FE', padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutGrid style={{ width: 18, height: 18, color: '#0369A1' }} />
              <span style={{ fontWeight: 700, color: '#075985', fontSize: '0.9rem' }}>
                {(showcase.featuredBreeds || []).length} Featured Breeds
              </span>
            </div>
          </div>

          {/* Vendors List */}
          {vendorsData.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', background: '#F8FAF9', borderRadius: 12, color: '#829792' }}>
              No vendors with categories found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {vendorsData.map((vendor) => (
                <div 
                  key={vendor.vendorId} 
                  style={{ 
                    border: '1px solid #E2EBE6', 
                    borderRadius: 14, 
                    padding: 18, 
                    background: '#FAFCFA' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <img
                      src={vendor.vendorAvatar || '/ck-guppies-logo.jpg'}
                      alt={vendor.vendorName}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/ck-guppies-logo.jpg'; }}
                    />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: '#12332F' }}>
                        {vendor.vendorName}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#60736F' }}>{vendor.vendorEmail}</span>
                    </div>
                  </div>

                  {vendor.categories?.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
                      No categories defined by this vendor.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {vendor.categories.map((cat, catIdx) => {
                        const catSelected = isCategoryFeatured(vendor.vendorId, cat.categoryName);
                        return (
                          <div key={catIdx} style={{ background: '#FFFFFF', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cat.breeds?.length ? 8 : 0 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: '#1F2937' }}>
                                <input
                                  type="checkbox"
                                  checked={catSelected}
                                  onChange={() => toggleCategory(vendor, cat)}
                                  style={{ width: 18, height: 18, accentColor: '#0D5148', cursor: 'pointer' }}
                                />
                                🏷️ {cat.categoryName}
                              </label>

                              {catSelected && (
                                <span style={{ fontSize: '0.75rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                                  Featured on Home
                                </span>
                              )}
                            </div>

                            {/* Breeds Selection */}
                            {cat.breeds?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 28 }}>
                                {cat.breeds.map((breed, bIdx) => {
                                  const breedSelected = isBreedFeatured(vendor.vendorId, cat.categoryName, breed);
                                  return (
                                    <button
                                      key={bIdx}
                                      type="button"
                                      onClick={() => toggleBreed(vendor, cat, breed)}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: 16,
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        border: breedSelected ? '1px solid #0D5148' : '1px solid #D1D5DB',
                                        background: breedSelected ? '#0D5148' : '#F9FAFB',
                                        color: breedSelected ? '#FFFFFF' : '#374151',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      {breedSelected && <Check style={{ width: 12, height: 12 }} />}
                                      {breed}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
