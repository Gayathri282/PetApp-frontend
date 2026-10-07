import React, { useState, useEffect } from 'react';
import { LayoutGrid, Check, RefreshCw, Sparkles, Store, Tag } from 'lucide-react';
import { adminGetVendorCategories, adminGetHomepageShowcase, adminUpdateHomepageShowcase } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function AdminShowcaseManager() {
  const toast = useToast();
  const [vendorsData, setVendorsData] = useState([]);
  const [showcase, setShowcase] = useState({ featuredCategories: [], featuredBreeds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setShowcase(sRes.data.showcase || { featuredCategories: [], featuredBreeds: [] });
    } catch (err) {
      console.error('Failed to load showcase data:', err);
      toast.error('Failed to load vendor categories');
    } finally {
      setLoading(false);
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
      setShowcase(res.data.showcase || showcase);
      toast.success('Homepage showcase updated successfully!');
    } catch (err) {
      toast.error('Failed to save showcase');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#60736F' }}>
        <RefreshCw className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
        <p>Loading vendor categories across all vendors...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 20, background: '#FFFFFF', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#12332F', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles style={{ width: 20, height: 20, color: '#D97706' }} /> Homepage Featured Categories & Breeds
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#60736F', margin: '4px 0 0 0' }}>
              Select which vendor categories and breeds to highlight on the Home Page feed.
            </p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleSaveShowcase} 
            disabled={saving}
            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
          >
            {saving ? 'Saving...' : 'Save Featured Showcase'}
          </button>
        </div>

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
    </div>
  );
}
