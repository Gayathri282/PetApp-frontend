import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Package, BarChart3, Check, X, Trash2, Clock, CheckCircle, Phone, MessageCircle, Play as PlayIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import VideoPlayer from '../../components/reel/VideoPlayer';
import { getAdminStats, getApplications, reviewApplication, getEnquiries, updateEnquiry, adminDeleteProduct, adminGetUsers, adminDeleteUser } from '../../api';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [takedownModal, setTakedownModal] = useState(null); // { id, name }
  const [takedownReason, setTakedownReason] = useState('');
  const [takingDown, setTakingDown] = useState(false);

  const getFullSrc = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.replace(/\\/g, '/');
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  useEffect(() => { if (!isAdmin) navigate('/feed'); }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    if (tab === 'stats') getAdminStats().then(r => setStats(r.data.stats)).catch(()=>{}).finally(()=>setLoading(false));
    else if (tab === 'apps') getApplications().then(r => setApps(r.data.applications)).catch(()=>{}).finally(()=>setLoading(false));
    else if (tab === 'moderate') {
      import('../../api').then(({ getPendingProducts }) => {
        getPendingProducts().then(r => setPendingProducts(r.data.products)).catch(()=>{}).finally(()=>setLoading(false));
      });
    }
    else if (tab === 'manage') {
      import('../../api').then(({ getAllAdminProducts }) => {
        getAllAdminProducts('', searchQuery).then(r => setAllProducts(r.data.products)).catch(()=>{}).finally(()=>setLoading(false));
      });
    }
    else if (tab === 'users') {
      adminGetUsers(searchQuery).then(r => setAllUsers(r.data.users)).catch(()=>{}).finally(()=>setLoading(false));
    }
    else setLoading(false);
  }, [tab, searchQuery]);

  const handleReview = async (id, status) => {
    try {
      await reviewApplication(id, status);
      setApps(prev => prev.map(a => a._id===id?{...a,status}:a));
      toast.success(`Application ${status}`);
    } catch { toast.error('Failed'); }
  };

  const handleProductReview = async (id, status, reason = '') => {
    try {
      const { reviewProduct } = await import('../../api');
      await reviewProduct(id, status, reason);
      setPendingProducts(prev => prev.filter(p => p._id !== id));
      setAllProducts(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      toast.success(`Product ${status}`);
      if (previewVideo && previewVideo.id === id) setPreviewVideo(null);
    } catch { toast.error('Failed to update product status'); }
  };

  const openTakedownModal = (id, name, type = 'product') => {
    setTakedownReason('');
    setTakedownModal({ id, name, type });
  };

  const confirmTakedown = async () => {
    if (!takedownReason.trim()) return;
    setTakingDown(true);
    try {
      if (takedownModal.type === 'user') {
        await adminDeleteUser(takedownModal.id, takedownReason.trim());
        setAllUsers(prev => prev.filter(u => u._id !== takedownModal.id));
        toast.success('Account removed');
      } else if (takedownModal.type === 'delete') {
        await adminDeleteProduct(takedownModal.id, takedownReason.trim());
        setPendingProducts(prev => prev.filter(p => p._id !== takedownModal.id));
        setAllProducts(prev => prev.filter(p => p._id !== takedownModal.id));
        if (previewVideo && previewVideo.id === takedownModal.id) setPreviewVideo(null);
        toast.success('Product permanently deleted and vendor notified.');
      } else {
        await handleProductReview(takedownModal.id, 'rejected', takedownReason.trim());
      }
      setTakedownModal(null);
    } finally {
      setTakingDown(false);
    }
  };

  const handleDeleteProduct = (id, name) => openTakedownModal(id, name, 'delete');

  const tabs = [
    { key:'stats', icon:BarChart3, label:'Dashboard' },
    { key:'apps', icon:Users, label:'Applications' },
    { key:'moderate', icon:CheckCircle, label:'Moderate' },
    { key:'manage', icon:Package, label:'Manage All' },
    { key:'users', icon:Users, label:'Users' },
  ];

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 720, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/feed')} style={{ background: '#FFFFFF', border: '1px solid #D6E3DE', borderRadius: 12, padding: 8, color: '#0D5148', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
        <h1 className="serif-heading" style={{ fontSize: '1.5rem', margin: 0 }}>Admin <span style={{ color: '#0D5148' }}>Dashboard</span></h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#FFFFFF', border: '1px solid #D6E3DE', borderRadius: 16, padding: 4, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s', background: tab===t.key ? '#0D5148' : 'transparent', color: tab===t.key ? '#FFFFFF' : '#60736F', whiteSpace: 'nowrap' }}>
            <t.icon size={16} color={tab===t.key ? '#FFFFFF' : '#60736F'} />{t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="animate-fade-in">
          {/* Stats */}
          {tab === 'stats' && stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[{label:'Users',value:stats.users},{label:'Vendors',value:stats.vendors},{label:'Products',value:stats.products},{label:'Pending Apps',value:stats.pendingApps}].map(s => (
                <div key={s.label} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0D5148' }}>{s.value}</p>
                  <p style={{ fontSize: '0.8rem', color: '#60736F', fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
              
              <div 
                className="card" 
                onClick={() => navigate('/chat')}
                style={{ gridColumn: '1 / -1', padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', background: '#0D5148', color: '#FFFFFF' }}
              >
                <MessageSquare size={20} color="#FFFFFF" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>View {stats.pendingEnquiries} Open Customer Enquiries</span>
              </div>
            </div>
          )}

          {/* Applications */}
          {tab === 'apps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {apps.length === 0 && <p style={{ textAlign: 'center', color: '#60736F', padding: 40 }}>No applications pending</p>}
              {apps.map(app => (
                <div key={app._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: '#E8F1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #0D5148' }}>
                      {app.applicant?.avatar ? <img src={getFullSrc(app.applicant.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 800, color: '#0D5148' }}>{app.applicant?.name?.[0]}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#12332F' }}>{app.applicant?.name}</p>
                      <p style={{ fontSize: '0.76rem', color: '#60736F' }}>{app.applicant?.email}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 999, fontWeight: 700, background: app.status==='pending'?'#F3C34E':app.status==='approved'?'#dcfce7':'#fee2e2', color: app.status==='pending'?'#082F2B':app.status==='approved'?'#166534':'#991b1b' }}>{app.status}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#12332F', marginBottom: 4 }}>{app.businessName}</p>
                  <p style={{ fontSize: '0.82rem', color: '#0D5148', marginBottom: 4, fontWeight: 600 }}>📞 {app.contactNumber}</p>
                  <p style={{ fontSize: '0.82rem', color: '#60736F', marginBottom: 14 }}>{app.description}</p>
                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" style={{ flex: 1, padding: '9px 0', fontSize: '0.82rem' }} onClick={() => handleReview(app._id,'approved')}><Check size={16} /> Approve Vendor</button>
                      <button className="btn-danger" style={{ flex: 1, padding: '9px 0', fontSize: '0.82rem' }} onClick={() => handleReview(app._id,'rejected')}><X size={16} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Moderate Pending Products */}
          {tab === 'moderate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingProducts.length === 0 && <p style={{ textAlign: 'center', color: '#60736F', padding: 40 }}>No pending products for review</p>}
              {pendingProducts.map(p => (
                <div key={p._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div 
                      onClick={() => setPreviewVideo({ id: p._id, url: p.reels?.[0]?.videoUrl || '', name: p.name, source: 'moderate' })}
                      style={{ width: 72, height: 100, borderRadius: 12, overflow: 'hidden', background: '#E8F1ED', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                    >
                      {p.reels?.[0]?.videoUrl ? (
                        <video src={getFullSrc(p.reels[0].videoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : p.images?.[0] ? (
                        <img src={getFullSrc(p.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayIcon size={20} color="#0D5148" /></div>
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlayIcon size={18} color="#fff" fill="#fff" />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#12332F', marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: '0.78rem', color: '#60736F', marginBottom: 4 }}>By {p.vendor?.name || 'Vendor'} • {p.category}</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0D5148', marginBottom: 8 }}>₹{p.price}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => handleProductReview(p._id, 'approved')} style={{ background: '#0D5148', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => openTakedownModal(p._id, p.name)} style={{ background: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                        <button onClick={() => handleDeleteProduct(p._id, p.name)} style={{ background: '#E8F1ED', color: '#0D5148', border: '1px solid #D6E3DE', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manage All Listings */}
          {tab === 'manage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input 
                className="input-field" 
                placeholder="Search products by name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {allProducts.length === 0 && <p style={{ textAlign: 'center', color: '#60736F', padding: 40 }}>No products found</p>}
                {allProducts.map(p => (
                  <div key={p._id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div 
                        onClick={() => setPreviewVideo({ id: p._id, url: p.reels?.[0]?.videoUrl || '', name: p.name, source: 'all' })}
                        style={{ width: 68, height: 90, borderRadius: 12, overflow: 'hidden', background: '#E8F1ED', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                      >
                        {p.reels?.[0]?.videoUrl ? (
                          <video src={getFullSrc(p.reels[0].videoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : p.images?.[0] ? (
                          <img src={getFullSrc(p.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayIcon size={18} color="#0D5148" /></div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#12332F', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</p>
                          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: p.status==='approved'?'#dcfce7':'#fee2e2', color: p.status==='approved'?'#166534':'#991b1b' }}>{p.status}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#60736F', marginBottom: 8 }}>By {p.vendor?.name || 'Vendor'} • {p.category}</p>
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          {p.status !== 'rejected' ? (
                            <button 
                              onClick={() => openTakedownModal(p._id, p.name)}
                              style={{ background: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Take Down
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleProductReview(p._id, 'approved')}
                              style={{ background: '#0D5148', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Restore
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            style={{ background: '#E8F1ED', color: '#0D5148', border: '1px solid #D6E3DE', borderRadius: 8, padding: '5px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="input-field"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {allUsers.length === 0 && <p style={{ textAlign: 'center', color: '#60736F', padding: 40 }}>No users found</p>}
              {allUsers.map(u => (
                <div key={u._id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#E8F1ED', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0D5148' }}>
                    {u.avatar ? <img src={getFullSrc(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 800, color: '#0D5148' }}>{u.name?.[0]}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#12332F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                    <p style={{ fontSize: '0.74rem', color: '#60736F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <button
                    onClick={() => openTakedownModal(u._id, u.name, 'user')}
                    style={{ background: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <Modal title={`Preview: ${previewVideo.name}`} onClose={() => setPreviewVideo(null)}>
          <div style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ width: '100%', height: 320, borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
              <VideoPlayer src={previewVideo.url} />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPreviewVideo(null)}>Close Preview</button>
          </div>
        </Modal>
      )}

      {/* Takedown Modal */}
      {takedownModal && (
        <Modal title={`Action Notice: ${takedownModal.name}`} onClose={() => setTakedownModal(null)}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.85rem', color: '#60736F' }}>Please state the moderation reason for this action:</p>
            <textarea
              className="input-field"
              placeholder="e.g. Inappropriate content, invalid video, spam..."
              value={takedownReason}
              onChange={e => setTakedownReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setTakedownModal(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} disabled={takingDown || !takedownReason.trim()} onClick={confirmTakedown}>
                {takingDown ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
