import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Layers, Film, Package, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { 
  getVendorCustomCategories, 
  updateVendorCustomCategories, 
  vendorClearReels, 
  vendorClearProducts, 
  vendorClearCategories 
} from '../../api';
import { useToast } from '../../context/ToastContext';

export default function VendorCategoriesManager({ onDataCleared }) {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Inputs for adding category/breed
  const [newCatName, setNewCatName] = useState('');
  const [breedInputs, setBreedInputs] = useState({}); // { catIndex: string }

  // Modal confirmation for bulk delete
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'reels' | 'products' | 'categories'
    title: '',
    description: '',
    actionText: '',
  });
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getVendorCustomCategories();
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load custom categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    setCategories(prev => [...prev, { name: trimmed, breeds: [] }]);
    setNewCatName('');
  };

  const handleRemoveCategory = (index) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddBreed = (catIndex) => {
    const val = (breedInputs[catIndex] || '').trim();
    if (!val) return;
    setCategories(prev => {
      const next = [...prev];
      const breeds = next[catIndex].breeds || [];
      if (!breeds.includes(val)) {
        next[catIndex].breeds = [...breeds, val];
      }
      return next;
    });
    setBreedInputs(prev => ({ ...prev, [catIndex]: '' }));
  };

  const handleRemoveBreed = (catIndex, breedName) => {
    setCategories(prev => {
      const next = [...prev];
      next[catIndex].breeds = next[catIndex].breeds.filter(b => b !== breedName);
      return next;
    });
  };

  const handleSaveCategories = async () => {
    try {
      setSaving(true);
      const res = await updateVendorCustomCategories(categories);
      setCategories(res.data.categories || []);
      toast.success('Categories & breeds saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  const openConfirmModal = (type) => {
    if (type === 'reels') {
      setConfirmModal({
        isOpen: true,
        type: 'reels',
        title: 'Delete All Reels?',
        description: 'Are you sure you want to delete ALL your uploaded reels? This will permanently remove your promotional videos.',
        actionText: 'Delete All Reels',
      });
    } else if (type === 'products') {
      setConfirmModal({
        isOpen: true,
        type: 'products',
        title: 'Delete All Products?',
        description: 'Are you sure you want to delete ALL your listed products for sale? This action cannot be undone.',
        actionText: 'Delete All Products',
      });
    } else if (type === 'categories') {
      setConfirmModal({
        isOpen: true,
        type: 'categories',
        title: 'Delete All Categories?',
        description: 'Are you sure you want to remove ALL your custom categories and breeds?',
        actionText: 'Delete All Categories',
      });
    }
  };

  const handleConfirmBulkDelete = async () => {
    setClearing(true);
    try {
      if (confirmModal.type === 'reels') {
        const res = await vendorClearReels();
        toast.success(res.data.message || 'All reels deleted');
      } else if (confirmModal.type === 'products') {
        const res = await vendorClearProducts();
        toast.success(res.data.message || 'All products deleted');
      } else if (confirmModal.type === 'categories') {
        const res = await vendorClearCategories();
        setCategories([]);
        toast.success(res.data.message || 'All categories cleared');
      }
      if (onDataCleared) onDataCleared(confirmModal.type);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to perform bulk delete');
    } finally {
      setClearing(false);
      setConfirmModal({ isOpen: false, type: null, title: '', description: '', actionText: '' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#60736F' }}>
        <RefreshCw className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
        <p style={{ fontSize: '0.88rem' }}>Loading your store categories...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Categories & Breeds Builder */}
      <div className="card" style={{ padding: 20, background: '#FFFFFF', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#12332F', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers style={{ width: 20, height: 20, color: '#0D5148' }} /> Custom Categories & Breeds
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#60736F', margin: '4px 0 0 0' }}>
              Add pet categories and breeds offered in your store so buyers can filter your items.
            </p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleSaveCategories} 
            disabled={saving}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Add Category Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="New category name (e.g., Guppies, Bettas, Plants)..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #D2E0D9',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddCategory}
            style={{
              padding: '10px 18px',
              background: '#0D5148',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus style={{ width: 16, height: 16 }} /> Add Category
          </button>
        </div>

        {/* Categories List */}
        {categories.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAF9', borderRadius: 12, color: '#829792' }}>
            No custom categories created yet. Type a category name above to start!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {categories.map((cat, catIdx) => (
              <div 
                key={catIdx} 
                style={{ 
                  border: '1px solid #E2EBE6', 
                  borderRadius: 12, 
                  padding: 16, 
                  background: '#F9FBF9' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ width: 18, height: 18, color: '#0D5148' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#12332F' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', background: '#E0EDE8', color: '#0D5148', padding: '2px 8px', borderRadius: 12 }}>
                      {cat.breeds?.length || 0} Breeds
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCategory(catIdx)}
                    title="Delete Category"
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Breeds Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {(cat.breeds || []).map((b, bIdx) => (
                    <span 
                      key={bIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#FFFFFF',
                        border: '1px solid #D2E0D9',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: '0.82rem',
                        color: '#2A3F3B',
                      }}
                    >
                      {b}
                      <button
                        onClick={() => handleRemoveBreed(catIdx, b)}
                        style={{ border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Breed under this Category */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder={`Add breed under ${cat.name}...`}
                    value={breedInputs[catIdx] || ''}
                    onChange={(e) => setBreedInputs({ ...breedInputs, [catIdx]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBreed(catIdx)}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid #D2E0D9',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                    }}
                  />
                  <button
                    onClick={() => handleAddBreed(catIdx)}
                    style={{
                      padding: '7px 14px',
                      background: '#12332F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Breed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Delete Store Data Actions */}
      <div className="card" style={{ padding: 20, background: '#FFF5F5', borderRadius: 16, border: '1px solid #FCD3D3' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#991B1B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle style={{ width: 18, height: 18, color: '#DC2626' }} /> Clear Store Content & Management
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#7F1D1D', margin: '0 0 16px 0' }}>
          Bulk clear actions to clean up your vendor account items instantly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <button
            onClick={() => openConfirmModal('reels')}
            style={{
              padding: '12px 14px',
              background: '#FFFFFF',
              border: '1px solid #FCA5A5',
              borderRadius: 12,
              color: '#DC2626',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 8,
            }}
          >
            <Film style={{ width: 16, height: 16 }} /> Clear All Reels
          </button>

          <button
            onClick={() => openConfirmModal('products')}
            style={{
              padding: '12px 14px',
              background: '#FFFFFF',
              border: '1px solid #FCA5A5',
              borderRadius: 12,
              color: '#DC2626',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 8,
            }}
          >
            <Package style={{ width: 16, height: 16 }} /> Clear All Products
          </button>

          <button
            onClick={() => openConfirmModal('categories')}
            style={{
              padding: '12px 14px',
              background: '#FFFFFF',
              border: '1px solid #FCA5A5',
              borderRadius: 12,
              color: '#DC2626',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 8,
            }}
          >
            <Layers style={{ width: 16, height: 16 }} /> Clear All Categories
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991B1B', marginTop: 0, marginBottom: 8 }}>
              {confirmModal.title}
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#4B5563', marginBottom: 20 }}>
              {confirmModal.description}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: null, title: '', description: '', actionText: '' })}
                disabled={clearing}
                style={{ padding: '9px 16px', background: '#F3F4F6', border: 'none', borderRadius: 8, color: '#374151', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={clearing}
                style={{ padding: '9px 16px', background: '#DC2626', border: 'none', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
              >
                {clearing ? 'Deleting...' : confirmModal.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
