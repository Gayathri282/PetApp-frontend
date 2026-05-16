import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Share2, Plus, LogOut, Film, Package, X, Upload, Edit2 } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ShareModal from '../components/ui/ShareModal';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getVendorProducts, getApplicationStatus, createProduct, uploadSingleReel, deleteProduct, updateProfile, uploadToCloudinary, updateProduct, deleteMyAccount } from '../api';

const getFullSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProfilePage() {

  const { user, isVendor, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [showShare, setShowShare] = useState(false);
  const [tab, setTab] = useState('reels');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [appStatus, setAppStatus] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUploadReel, setShowUploadReel] = useState(false);
  const [showUploadProduct, setShowUploadProduct] = useState(false);
  const [showEditReel, setShowEditReel] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (isVendor || isAdmin) {
      setLoadingProducts(true);
      getVendorProducts()
        .then(r => setProducts(r.data.products || []))
        .catch(err => { console.error('Failed to load vendor products:', err); setProducts([]); })
        .finally(() => setLoadingProducts(false));
    } else if (user?.role === 'user') {
      getApplicationStatus().then(r => setAppStatus(r.data.application)).catch(() => {});
    }
  }, [isVendor, isAdmin, user]);

  const reels = (products || []).filter(p => p.category === 'promotional' || (!p.isOnSale && p.reels?.length === 1));
  const saleProducts = (products || []).filter(p => p.isOnSale || (p.reels?.length > 1 && p.category !== 'promotional'));

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await deleteProduct(id); setProducts(prev => prev.filter(p => p._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await deleteMyAccount();
      localStorage.removeItem('jwt');
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (!user) return <Spinner />;

  return (
    <div style={{ padding:'20px 16px 40px', maxWidth:640, margin:'0 auto' }}>
      {/* Profile header */}
      <div className="animate-fade-in" style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(99,102,241,0.4)', flexShrink:0, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {user.avatar ? <img src={getFullSrc(user.avatar)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:28, fontWeight:800 }}>{user.name?.[0]}</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ fontSize:'1.25rem', fontWeight:800, marginBottom:2 }}>{user.name}</h1>
          <p style={{ fontSize:'0.8rem', color:'#818cf8', fontWeight:500 }}>{user.role === 'vendor' ? '✨ Verified Vendor' : user.role === 'admin' ? '🛡️ Admin' : '🐾 Pet Lover'}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowEditProfile(true)} className="btn-ghost" style={{ padding:10, borderRadius:12, fontSize:'0.75rem', fontWeight:600 }}>Edit Profile</button>
          <button onClick={() => setShowShare(true)} className="btn-ghost" style={{ padding:10, borderRadius:12 }}><Share2 size={18} /></button>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding:10, borderRadius:12, color:'#ef4444' }}><LogOut size={18} /></button>
        </div>
      </div>

      {/* Normal user — become vendor */}
      {user.role === 'user' && (
        <div className="glass animate-fade-in-up" style={{ padding:20, borderRadius:16, marginBottom:24 }}>
          {appStatus?.status === 'pending' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>⏳</div>
              <p style={{ fontWeight:600, marginBottom:4 }}>Application Pending</p>
              <p style={{ fontSize:'0.8rem', color:'#94a3b8' }}>We're reviewing your vendor application.</p>
            </div>
          ) : appStatus?.status === 'rejected' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>😔</div>
              <p style={{ fontWeight:600, marginBottom:4 }}>Application Rejected</p>
              <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:12 }}>You can apply again with updated details.</p>
              <button className="btn-primary" onClick={() => navigate('/vendor/apply')}>Re-apply</button>
            </div>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🏪</div>
              <p style={{ fontWeight:600, marginBottom:4 }}>Want to sell pets or products?</p>
              <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:16 }}>Apply to become a vendor and start uploading reels.</p>
              <button className="btn-primary" onClick={() => navigate('/vendor/apply')}>Become a Vendor</button>
            </div>
          )}
        </div>
      )}

      {/* Vendor/Admin dashboard */}
      {(isVendor || isAdmin) && (
        <>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:4 }}>
            {[{key:'reels',icon:Film,label:'My Reels'},{key:'products',icon:Package,label:'My Products'}].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, transition:'all 0.2s', background: tab===t.key?'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))':'none', color: tab===t.key?'#a5b4fc':'#64748b' }}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>

          {loadingProducts ? <Spinner /> : (
            <div className="stagger-children" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {tab === 'reels' ? (
                reels.length > 0 ? reels.map(p => (
                  <div key={p._id} style={{ position:'relative' }}>
                    <ProductCard product={p} />
                    <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:6, zIndex:5 }}>
                      <button onClick={() => { setEditingProduct(p); setShowEditReel(true); }} style={{ background:'rgba(34,197,94,0.85)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} style={{ background:'rgba(239,68,68,0.85)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex' }}><X size={14} /></button>
                    </div>
                  </div>
                )) : <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No promotional reels yet</p>
              ) : (
                saleProducts.length > 0 ? saleProducts.map(p => (
                  <div key={p._id} style={{ position:'relative' }}>
                    <ProductCard product={p} />
                    <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:6, zIndex:5 }}>
                      <button onClick={() => { setEditingProduct(p); setShowEditProduct(true); }} style={{ background:'rgba(34,197,94,0.85)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} style={{ background:'rgba(239,68,68,0.85)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex' }}><X size={14} /></button>
                    </div>
                  </div>
                )) : <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No products yet</p>
              )}
            </div>
          )}

          {/* FAB */}
          <div style={{ position:'fixed', bottom:84, right:20, zIndex:90 }}>
            {showAddMenu && (
              <div className="glass animate-scale-in" style={{ position:'absolute', bottom:60, right:0, borderRadius:16, padding:8, minWidth:200 }}>
                <button onClick={() => { setShowAddMenu(false); setShowUploadReel(true); }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'none', border:'none', borderRadius:10, color:'#e2e8f0', cursor:'pointer', fontSize:'0.85rem', fontWeight:500 }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <Film size={18} color="#818cf8" /> Upload Reel
                </button>
                <button onClick={() => { setShowAddMenu(false); setShowUploadProduct(true); }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'none', border:'none', borderRadius:10, color:'#e2e8f0', cursor:'pointer', fontSize:'0.85rem', fontWeight:500 }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <Package size={18} color="#fb923c" /> Upload Product
                </button>
              </div>
            )}
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="gradient-primary animate-pulse-glow" style={{ width:52, height:52, borderRadius:16, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', boxShadow:'0 8px 30px rgba(99,102,241,0.5)', transition:'transform 0.2s', transform: showAddMenu?'rotate(45deg)':'none' }}>
              <Plus size={26} />
            </button>
          </div>
        </>
      )}

      {/* Danger Zone — Delete Account */}
      {(isVendor || user.role === 'user') && (
        <div style={{ marginTop: 32, padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Danger Zone</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 12 }}>Permanently delete your account and all your reels/products. This cannot be undone.</p>
          <button
            onClick={() => { setDeleteConfirmText(''); setShowDeleteAccount(true); }}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, padding: '8px 18px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Delete My Account
          </button>
        </div>
      )}

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={`${window.location.origin}/profile`} title="Share Profile" />
      <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)} user={user} />
      <UploadReelModal open={showUploadReel} onClose={() => setShowUploadReel(false)} user={user} onSuccess={p => { setProducts(prev => [p,...prev]); setShowUploadReel(false); }} />
      <UploadProductModal open={showUploadProduct} onClose={() => setShowUploadProduct(false)} user={user} onSuccess={p => { setProducts(prev => [p,...prev]); setShowUploadProduct(false); }} />
      <EditProductModal open={showEditProduct} product={editingProduct} onClose={() => { setShowEditProduct(false); setEditingProduct(null); }} onSuccess={p => { setProducts(prev => prev.map(x => x._id === p._id ? p : x)); setShowEditProduct(false); }} />
      <EditReelModal open={showEditReel} product={editingProduct} onClose={() => { setShowEditReel(false); setEditingProduct(null); }} onSuccess={p => { setProducts(prev => prev.map(x => x._id === p._id ? p : x)); setShowEditReel(false); }} />

      {/* Delete Account Confirmation Modal */}
      <Modal isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} title="Delete Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 4 }}>
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.6 }}>
              ⚠️ This will <strong>permanently delete</strong> your account, all your reels, products, and messages. <strong>This cannot be undone.</strong>
            </p>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8, display: 'block' }}>Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm</label>
            <input
              className="input-field"
              placeholder="Type DELETE here"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ borderColor: deleteConfirmText === 'DELETE' ? 'rgba(239,68,68,0.5)' : undefined }}
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
            style={{ background: deleteConfirmText === 'DELETE' ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fff', borderRadius: 12, padding: '12px 0', fontWeight: 700, cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontSize: '0.9rem', transition: 'all 0.2s' }}
          >
            {deletingAccount ? 'Deleting...' : 'Permanently Delete My Account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}


/* ── Edit Product Modal ───────────────────────── */
function EditProductModal({ open, product, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '', isOnSale: true, deliveryChargesAdditional: false });
  const [tags, setTags] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const TAG_OPTIONS = ['dog','cat','bird','fish','reptile','rabbit','accessories','food','toys'];

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        isOnSale: product.isOnSale ?? true,
        deliveryChargesAdditional: product.deliveryChargesAdditional ?? false
      });
      setTags(product.tags || []);
      setNewVideos([]);
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(key => fd.append(key, form[key]));
      fd.append('tags', JSON.stringify(tags));

      // Upload any new videos to Cloudinary first
      if (newVideos.length > 0) {
        toast.info(`Uploading ${newVideos.length} video(s)...`);
        const videoUrls = await Promise.all(newVideos.map(v => uploadToCloudinary(v)));
        fd.append('videoUrls', JSON.stringify(videoUrls));
      }

      const { data } = await updateProduct(product._id, fd);
      toast.success('Product updated! Sent to admin for review.');
      onSuccess(data.product);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Product">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto' }}>
        <input className="input-field" placeholder="Product name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <textarea className="input-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input className="input-field" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <input className="input-field" type="number" placeholder="Price (₹)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>For Sale</span>
          <label className="toggle-switch"><input type="checkbox" checked={form.isOnSale} onChange={e => setForm({ ...form, isOnSale: e.target.checked })} /><span className="toggle-slider"></span></label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Delivery Charges Additional?</span>
          </div>
          <label className="toggle-switch"><input type="checkbox" checked={form.deliveryChargesAdditional} onChange={e => setForm({ ...form, deliveryChargesAdditional: e.target.checked })} /><span className="toggle-slider"></span></label>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Tags</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {TAG_OPTIONS.map(t => (
              <button key={t} type="button" className={`tag-pill ${tags.includes(t) ? 'active' : ''}`} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{t}</button>
            ))}
            {tags.filter(t => !TAG_OPTIONS.includes(t)).map(t => (
              <button key={t} type="button" className="tag-pill active" onClick={() => setTags(prev => prev.filter(x => x !== t))}>{t} ✕</button>
            ))}
          </div>
        </div>

        {/* Add replacement videos */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Add / Replace Videos</label>
          <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8 }}>Existing videos: {product?.reels?.length || 0}. New uploads will be added alongside them.</p>
          <FileDropZone accept="video/*" multiple onChange={files => setNewVideos(prev => [...prev, ...files].slice(0, 5))} label="Drop replacement videos here" />
          {newVideos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {newVideos.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34,197,94,0.08)', padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem' }}>
                  <span style={{ color: '#22c55e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {v.name}</span>
                  <button onClick={() => setNewVideos(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 14px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, fontSize: '0.75rem', color: '#fb923c' }}>
          ⚠️ After updating, your product will go to <strong>admin review</strong> before going live again.
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>{loading ? 'Saving...' : 'Update Product'}</button>
      </div>
    </Modal>
  );
}

/* ── Edit Reel Modal ──────────────────────────── */
function EditReelModal({ open, product, onClose, onSuccess }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState([]);
  const [newVideo, setNewVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDesc(product.description || '');
      setTags(product.tags || []);
      setNewVideo(null);
    }
  }, [product]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', desc);
      fd.append('tags', JSON.stringify(tags));

      // Upload replacement video to Cloudinary if provided
      if (newVideo) {
        toast.info('Uploading new video...');
        const videoUrl = await uploadToCloudinary(newVideo);
        fd.append('videoUrls', JSON.stringify([videoUrl]));
      }

      const { data } = await updateProduct(product._id, fd);
      toast.success('Reel updated! Sent to admin for review.');
      onSuccess(data.product);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Reel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input className="input-field" placeholder="Reel title (optional)" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="input-field" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
        
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Tags</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {tags.map(t => (
              <button key={t} type="button" className="tag-pill active" onClick={() => setTags(prev => prev.filter(x => x !== t))}>{t} ✕</button>
            ))}
          </div>
        </div>

        {/* Replacement video */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Replace Video (optional)</label>
          <FileDropZone accept="video/*" onChange={files => setNewVideo(files[0])} label="Drop a new video to replace the existing one" />
          {newVideo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34,197,94,0.08)', padding: '6px 12px', borderRadius: 8, marginTop: 6, fontSize: '0.75rem' }}>
              <span style={{ color: '#22c55e' }}>✓ {newVideo.name}</span>
              <button onClick={() => setNewVideo(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}
        </div>

        <div style={{ padding: '10px 14px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, fontSize: '0.75rem', color: '#fb923c' }}>
          ⚠️ After updating, your reel will go to <strong>admin review</strong> before going live again.
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>{loading ? (newVideo ? 'Uploading...' : 'Saving...') : 'Update Reel'}</button>
      </div>
    </Modal>
  );
}


/* ── Edit Profile Modal ─────────────────────────── */
function EditProfileModal({ open, onClose, user }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.contactNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [location, setLocation] = useState(user?.location?.coordinates || [0, 0]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.contactNumber || '');
      setAddress(user.address || '');
      setLocation(user.location?.coordinates || [0, 0]);
    }
  }, [user]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation([pos.coords.longitude, pos.coords.latitude]);
      toast.success('Location updated!');
    }, () => {
      toast.error('Location permission denied');
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let avatarUrl = '';
      if (file) {
        toast.info('Uploading avatar...');
        avatarUrl = await uploadToCloudinary(file);
      }

      await updateProfile({
        name,
        contactNumber: phone,
        address,
        location: JSON.stringify({ type: 'Point', coordinates: location }),
        avatarUrl
      });
      
      await refreshUser();
      toast.success('Profile updated!');
      onClose();
    } catch(e) {
      console.error('Profile update error:', e);
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Profile">
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <div 
            onClick={() => document.getElementById('avatar-input').click()}
            style={{ width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)', border:'2px dashed rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}
          >
            {file ? (
              <img src={URL.createObjectURL(file)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : user?.avatar ? (
              <img src={getFullSrc(user.avatar)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <Upload size={32} color="#64748b" />
            )}
            <div style={{ position:'absolute', bottom:0, width:'100%', background:'rgba(0,0,0,0.5)', padding:'4px 0', textAlign:'center', fontSize:'0.65rem' }}>Change</div>
          </div>
          <input id="avatar-input" type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ display:'none' }} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#94a3b8' }}>Full Name</label>
          <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#94a3b8' }}>Contact Number</label>
          <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#94a3b8' }}>Physical Address</label>
          <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, Zip" />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#94a3b8' }}>Geolocation</label>
          <div style={{ display:'flex', gap:8 }}>
            <div className="input-field" style={{ flex:1, fontSize:'0.75rem', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center' }}>
              {location[0] === 0 && location[1] === 0 ? 'Not set' : `${location[1].toFixed(4)}, ${location[0].toFixed(4)}`}
            </div>
            <button className="btn-accent" onClick={handleGetLocation} style={{ padding:'0 14px', fontSize:'0.75rem' }}>Update</button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%', marginTop:10 }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Upload Reel Modal ──────────────────────────── */
function UploadReelModal({ open, onClose, onSuccess, user }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) { toast.error('Select a video'); return; }
    if (!user?.location?.coordinates || (user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0)) {
      toast.info('Please set your location in profile to help users find you nearby');
      onClose();
      return;
    }
    
    setLoading(true);
    try {
      // 1. Upload directly to Cloudinary to bypass server timeouts
      toast.info('Uploading video to secure storage...');
      const videoUrl = await uploadToCloudinary(file, (progress) => {
        // You could add a progress bar here if you want
        console.log(`Upload progress: ${progress}%`);
      });

      // 2. Send only the URL to our backend
      const { data } = await uploadSingleReel({
        videoUrl,
        name: name || 'Promotional Reel',
        description: desc,
        tags: JSON.stringify(tags)
      });

      toast.success('Reel uploaded!');
      onSuccess(data.product);
      setFile(null); setName(''); setDesc(''); setTags([]);
      onClose();
    } catch(e) { 
      console.error('Upload error:', e);
      toast.error(e.response?.data?.message || 'Upload failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Upload Reel">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <FileDropZone 
          accept="video/*" 
          onChange={files => setFile(files[0])} 
          label="Drop video here or click to select" 
        />
        {file && (
          <div style={{ padding: 10, background: 'rgba(34,197,94,0.1)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>✓ Video selected:</span>
            <span style={{ color: '#fff', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.name}</span>
          </div>
        )}
        <input className="input-field" placeholder="Reel title (optional)" value={name} onChange={e=>setName(e.target.value)} />
        <textarea className="input-field" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        
        <div>
          <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:8, display:'block' }}>Tags</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {tags.map(t => (
              <button 
                key={t} 
                type="button" 
                className="tag-pill active" 
                onClick={() => setTags(prev => prev.filter(x=>x!==t))}
              >
                {t} ✕
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input 
              id="reel-tag-input"
              className="input-field" 
              placeholder="Add tag (e.g. funny, kitten)..." 
              style={{ flex:1, height:38, fontSize:'0.85rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = e.target.value.trim().toLowerCase();
                  if (val && !tags.includes(val)) {
                    setTags([...tags, val]);
                    e.target.value = '';
                  }
                }
              }}
            />
            <button 
              type="button" 
              className="btn-accent" 
              style={{ padding:'0 16px', height:38, fontSize:'0.8rem' }}
              onClick={() => {
                const input = document.getElementById('reel-tag-input');
                const val = input.value.trim().toLowerCase();
                if (val && !tags.includes(val)) {
                  setTags([...tags, val]);
                  input.value = '';
                }
              }}
            >
              Add
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%' }}>{loading?'Uploading...':'Upload Reel'}</button>
      </div>
    </Modal>
  );
}

/* ── Upload Product Modal ──────────────────────── */
function UploadProductModal({ open, onClose, onSuccess, user }) {
  const toast = useToast();
  const [form, setForm] = useState({ name:'', description:'', category:'', price:'', isOnSale:true, deliveryChargesAdditional: false });
  const [tags, setTags] = useState([]);
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const TAG_OPTIONS = ['dog','cat','bird','fish','reptile','rabbit','accessories','food','toys'];

  const handleSubmit = async () => {
    if (!form.name || videos.length === 0) { toast.error('Name and at least one video required'); return; }
    if (!user?.location?.coordinates || (user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0)) {
      toast.info('Please set your location in profile to help users find you nearby');
      onClose();
      return;
    }
    if (videos.length > 5) { toast.error('Maximum 5 videos allowed'); return; }
    
    setLoading(true);
    try {
      // 1. Upload all videos to Cloudinary
      toast.info(`Uploading ${videos.length} video(s)...`);
      const videoUrls = await Promise.all(
        videos.map(v => uploadToCloudinary(v))
      );

      // 2. Upload images to Cloudinary
      let imageUrls = [];
      if (images.length > 0) {
        toast.info(`Uploading ${images.length} image(s)...`);
        imageUrls = await Promise.all(
          images.map(img => uploadToCloudinary(img))
        );
      }

      // 3. Send URLs to backend
      const { data } = await createProduct({
        ...form,
        videoUrls,
        imageUrls,
        tags: JSON.stringify(tags)
      });

      toast.success('Product created!');
      onSuccess(data.product);
      setForm({ name:'', description:'', category:'', price:'', isOnSale:true }); setTags([]); setVideos([]); setImages([]);
    } catch(e) { 
      console.error('Upload error:', e);
      toast.error(e.response?.data?.message || 'Failed to create product'); 
    } finally { 
      setLoading(false); 
    }
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Upload Product">
      <div style={{ display:'flex', flexDirection:'column', gap:14, maxHeight:'60vh', overflowY:'auto' }}>
        <input className="input-field" placeholder="Product name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <textarea className="input-field" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <input className="input-field" placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
        <input className="input-field" type="number" placeholder="Price (₹)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'0.85rem', fontWeight:600 }}>For Sale</span>
          <label className="toggle-switch"><input type="checkbox" checked={form.isOnSale} onChange={e=>setForm({...form,isOnSale:e.target.checked})} /><span className="toggle-slider"></span></label>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:600 }}>Delivery Charges Additional?</span>
            <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Are shipping costs extra?</span>
          </div>
          <label className="toggle-switch"><input type="checkbox" checked={form.deliveryChargesAdditional} onChange={e=>setForm({...form,deliveryChargesAdditional:e.target.checked})} /><span className="toggle-slider"></span></label>
        </div>

        <div>
          <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:8, display:'block' }}>Tags</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {TAG_OPTIONS.map(t => (
              <button 
                key={t} 
                type="button" 
                className={`tag-pill ${tags.includes(t)?'active':''}`} 
                onClick={() => setTags(prev => prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])}
              >
                {t}
              </button>
            ))}
            {tags.filter(t => !TAG_OPTIONS.includes(t)).map(t => (
              <button 
                key={t} 
                type="button" 
                className="tag-pill active" 
                onClick={() => setTags(prev => prev.filter(x=>x!==t))}
              >
                {t} ✕
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input 
              id="custom-tag-input"
              className="input-field" 
              placeholder="Add custom tag..." 
              style={{ flex:1, height:38, fontSize:'0.85rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = e.target.value.trim().toLowerCase();
                  if (val && !tags.includes(val)) {
                    setTags([...tags, val]);
                    e.target.value = '';
                  }
                }
              }}
            />
            <button 
              type="button" 
              className="btn-accent" 
              style={{ padding:'0 16px', height:38, fontSize:'0.8rem' }}
              onClick={() => {
                const input = document.getElementById('custom-tag-input');
                const val = input.value.trim().toLowerCase();
                if (val && !tags.includes(val)) {
                  setTags([...tags, val]);
                  input.value = '';
                }
              }}
            >
              Add
            </button>
          </div>
        </div>

        <FileDropZone accept="video/*" multiple onChange={files => {
          setVideos(prev => {
            const next = [...prev, ...files];
            if (next.length > 5) {
              toast.error('Limit 5 videos');
              return next.slice(0, 5);
            }
            return next;
          });
        }} label="Drop up to 5 videos *" />
        
        {videos.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
            {videos.map((v, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.05)', padding:'6px 12px', borderRadius:10, fontSize:'0.75rem' }}>
                <span style={{ color:'#e2e8f0', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{v.name}</span>
                <button onClick={() => removeVideo(i)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:4 }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <FileDropZone accept="image/*" onChange={files => setImages([files[0]])} label="Drop image (optional)" />
        {images.length > 0 && <p style={{ fontSize:'0.75rem', color:'#22c55e' }}>✓ {images[0].name}</p>}

        <button className="btn-accent" onClick={handleSubmit} disabled={loading} style={{ width:'100%' }}>{loading?'Creating...':'Create Product'}</button>
      </div>
    </Modal>
  );
}

/* ── File Drop Zone ─────────────────────────────── */
function FileDropZone({ accept, onChange, label, multiple = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onChange(Array.from(files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{ border: `2px dashed ${dragging?'#818cf8':'rgba(255,255,255,0.1)'}`, borderRadius:14, padding:'24px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background: dragging?'rgba(99,102,241,0.08)':'rgba(255,255,255,0.02)' }}
    >
      <Upload size={24} color="#64748b" style={{ marginBottom:8 }} />
      <p style={{ fontSize:'0.8rem', color:'#64748b' }}>{label}</p>
      <input 
        ref={inputRef} 
        type="file" 
        accept={accept} 
        multiple={multiple}
        onChange={e => handleFiles(e.target.files)} 
        style={{ display:'none' }} 
      />
    </div>
  );
}
