import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Share2, Plus, LogOut, Film, Package, X, Upload } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ShareModal from '../components/ui/ShareModal';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getVendorProducts, getApplicationStatus, createProduct, uploadSingleReel, deleteProduct, updateProfile } from '../api';

export default function ProfilePage() {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const { user, isVendor, logout } = useAuth();
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
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    if (isVendor) {
      setLoadingProducts(true);
      getVendorProducts().then(r => setProducts(r.data.products)).catch(() => {}).finally(() => setLoadingProducts(false));
    } else if (user?.role === 'user') {
      getApplicationStatus().then(r => setAppStatus(r.data.application)).catch(() => {});
    }
  }, [isVendor, user]);

  const reels = products.filter(p => !p.isOnSale && p.reels.length === 1);
  const saleProducts = products.filter(p => p.isOnSale || p.reels.length > 1);

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await deleteProduct(id); setProducts(prev => prev.filter(p => p._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed to delete'); }
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

      {/* Vendor dashboard */}
      {isVendor && (
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
                    <button onClick={() => handleDelete(p._id)} style={{ position:'absolute', top:8, right:8, background:'rgba(239,68,68,0.8)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex', zIndex:5 }}><X size={14} /></button>
                  </div>
                )) : <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No promotional reels yet</p>
              ) : (
                saleProducts.length > 0 ? saleProducts.map(p => (
                  <div key={p._id} style={{ position:'relative' }}>
                    <ProductCard product={p} />
                    <button onClick={() => handleDelete(p._id)} style={{ position:'absolute', top:8, right:8, background:'rgba(239,68,68,0.8)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex', zIndex:5 }}><X size={14} /></button>
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

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={`${window.location.origin}/profile`} title="Share Profile" />
      <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)} />
      <UploadReelModal open={showUploadReel} onClose={() => setShowUploadReel(false)} onSuccess={p => { setProducts(prev => [p,...prev]); setShowUploadReel(false); }} />
      <UploadProductModal open={showUploadProduct} onClose={() => setShowUploadProduct(false)} onSuccess={p => { setProducts(prev => [p,...prev]); setShowUploadProduct(false); }} />
    </div>
  );
}

/* ── Edit Profile Modal ─────────────────────────── */
function EditProfileModal({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.contactNumber || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('contactNumber', phone);
    if (file) fd.append('avatar', file);

    setLoading(true);
    try {
      await updateProfile(fd);
      await refreshUser();
      toast.success('Profile updated!');
      onClose();
    } catch(e) {
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

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%', marginTop:10 }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Upload Reel Modal ──────────────────────────── */
function UploadReelModal({ open, onClose, onSuccess }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) { toast.error('Select a video'); return; }
    const fd = new FormData();
    fd.append('video', file);
    fd.append('name', name || 'Promotional Reel');
    fd.append('description', desc);
    fd.append('tags', JSON.stringify([]));
    setLoading(true);
    try {
      const { data } = await uploadSingleReel(fd);
      toast.success('Reel uploaded!');
      onSuccess(data.product);
      setFile(null); setName(''); setDesc('');
    } catch(e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Upload Reel">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <FileDropZone accept="video/*" file={file} onChange={setFile} label="Drop video here" />
        <input className="input-field" placeholder="Reel title (optional)" value={name} onChange={e=>setName(e.target.value)} />
        <textarea className="input-field" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%' }}>{loading?'Uploading...':'Upload Reel'}</button>
      </div>
    </Modal>
  );
}

/* ── Upload Product Modal ──────────────────────── */
function UploadProductModal({ open, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ name:'', description:'', category:'', price:'', isOnSale:true });
  const [tags, setTags] = useState([]);
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const TAG_OPTIONS = ['dog','cat','bird','fish','reptile','rabbit','accessories','food','toys'];

  const handleSubmit = async () => {
    if (!form.name || videos.length === 0) { toast.error('Name and at least one video required'); return; }
    if (videos.length > 5) { toast.error('Maximum 5 videos allowed'); return; }
    const fd = new FormData();
    videos.forEach(f => fd.append('videos', f));
    images.forEach(f => fd.append('images', f));
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('category', form.category);
    fd.append('price', form.price || '0');
    fd.append('isOnSale', String(form.isOnSale));
    fd.append('tags', JSON.stringify(tags));
    setLoading(true);
    try {
      const { data } = await createProduct(fd);
      toast.success('Product created!');
      onSuccess(data.product);
      setForm({ name:'', description:'', category:'', price:'', isOnSale:true }); setTags([]); setVideos([]); setImages([]);
    } catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
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

        <div><label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:6, display:'block' }}>Tags</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {TAG_OPTIONS.map(t => <button key={t} type="button" className={`tag-pill ${tags.includes(t)?'active':''}`} onClick={() => setTags(prev => prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])}>{t}</button>)}
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
