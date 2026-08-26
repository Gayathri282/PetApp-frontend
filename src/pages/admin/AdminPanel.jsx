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
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => { if(!isAdmin) navigate('/feed'); }, [isAdmin]);

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

  // handleDeleteProduct is now handled through the modal — kept for legacy safety
  const handleDeleteProduct = (id, name) => openTakedownModal(id, name, 'delete');

  const tabs = [
    { key:'stats', icon:BarChart3, label:'Dashboard' },
    { key:'apps', icon:Users, label:'Applications' },
    { key:'moderate', icon:CheckCircle, label:'Moderate' },
    { key:'manage', icon:Package, label:'Manage All' },
    { key:'users', icon:Users, label:'Users' },
  ];

  return (
    <div style={{ padding:'20px 16px 40px', maxWidth:720, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={() => navigate('/feed')} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10, padding:8, color:'#94a3b8', cursor:'pointer', display:'flex' }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize:'1.3rem', fontWeight:800 }}>Admin <span className="gradient-text">Panel</span></h1>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(15,29,20,0.75)', border: '1px solid rgba(212,175,55,0.2)', borderRadius:14, padding:4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, border: tab===t.key?'1px solid rgba(212,175,55,0.4)':'1px solid transparent', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, transition:'all 0.2s', background: tab===t.key?'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(16,185,129,0.15))':'none', color: tab===t.key?'#FFE58F':'#A3B8A8' }}>
            <t.icon size={16} color={tab===t.key?'#D4AF37':'#A3B8A8'} />{t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="animate-fade-in">
          {/* Stats */}
          {tab === 'stats' && stats && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
              {[{label:'Users',value:stats.users,color:'#FFE58F'},{label:'Vendors',value:stats.vendors,color:'#D4AF37'},{label:'Products',value:stats.products,color:'#D4AF37'},{label:'Pending Apps',value:stats.pendingApps,color:'#D4AF37'}].map(s => (
                <div key={s.label} className="glass" style={{ padding:20, borderRadius:16, textAlign:'center' }}>
                  <p style={{ fontSize:'2rem', fontWeight:800, color:s.color }}>{s.value}</p>
                  <p style={{ fontSize:'0.78rem', color:'#A3B8A8', fontWeight:500 }}>{s.label}</p>
                </div>
              ))}
              
              <div 
                className="glass" 
                onClick={() => navigate('/chat')}
                style={{ gridColumn:'1 / -1', padding:20, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', gap:12, cursor:'pointer', border:'1px solid rgba(212,175,55,0.3)', background:'rgba(212,175,55,0.08)' }}
              >
                <MessageSquare size={20} color="#D4AF37" />
                <span style={{ fontWeight:700, fontSize:'1rem', color:'#FFE58F' }}>View {stats.pendingEnquiries} Open Enquiries</span>
              </div>
            </div>
          )}

          {/* Applications */}
          {tab === 'apps' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {apps.length === 0 && <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No applications</p>}
              {apps.map(app => (
                <div key={app._id} className="glass" style={{ padding:16, borderRadius:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#FFE58F,#D4AF37)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {app.applicant?.avatar ? <img src={getFullSrc(app.applicant.avatar)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontWeight:700, color:'#0f0c08' }}>{app.applicant?.name?.[0]}</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:'0.9rem' }}>{app.applicant?.name}</p>
                      <p style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{app.applicant?.email}</p>
                    </div>
                    <span style={{ fontSize:'0.7rem', padding:'3px 10px', borderRadius:999, fontWeight:600, background: app.status==='pending'?'rgba(212,175,55,0.12)':app.status==='approved'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color: app.status==='pending'?'#D4AF37':app.status==='approved'?'#22c55e':'#ef4444' }}>{app.status}</span>
                  </div>
                  <p style={{ fontSize:'0.85rem', fontWeight:600, marginBottom:4 }}>{app.businessName}</p>
                  <p style={{ fontSize:'0.8rem', color:'#D4AF37', marginBottom:4 }}>📞 {app.contactNumber}</p>
                  <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:12 }}>{app.description}</p>
                  {app.status === 'pending' && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn-primary" style={{ flex:1, padding:'8px 0', fontSize:'0.8rem', background: '#D4AF37' }} onClick={() => handleReview(app._id,'approved')}><Check size={15} /> Approve</button>
                      <button className="btn-danger" style={{ flex:1, padding:'8px 0', fontSize:'0.8rem' }} onClick={() => handleReview(app._id,'rejected')}><X size={15} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Moderate Pending Products */}
          {tab === 'moderate' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {pendingProducts.length === 0 && <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No pending products for review</p>}
              {pendingProducts.map(p => (
                <div key={p._id} className="glass" style={{ padding:16, borderRadius:16 }}>
                  <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                    <div 
                      onClick={() => setPreviewVideo({ id: p._id, url: p.reels[0].videoUrl, name: p.name, source: 'moderate' })}
                      style={{ width:64, height:96, borderRadius:8, overflow:'hidden', background:'#000', flexShrink:0, cursor:'pointer', position:'relative' }}
                    >
                      <video src={getFullSrc(p.reels[0].videoUrl)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <PlayIcon size={16} color="#fff" fill="#fff" />
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:2 }}>{p.name}</p>
                      <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:4 }}>By {p.vendor?.name} • {p.category}</p>
                      <p style={{ fontSize:'0.8rem', fontWeight:700, color:'#D4AF37', marginBottom:6 }}>₹{p.price}</p>
                      {p.description && (
                        <p style={{ fontSize:'0.7rem', color:'#64748b', marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.description}</p>
                      )}
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={() => handleProductReview(p._id, 'approved')} style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:8, padding:'6px 12px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}>Approve</button>
                        <button onClick={() => openTakedownModal(p._id, p.name)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:8, padding:'6px 12px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}>Reject</button>
                        <button onClick={() => handleDeleteProduct(p._id, p.name)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:8, padding:'6px 12px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'manage' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', gap:8 }}>
                <input 
                  className="input-field" 
                  placeholder="Search products by name..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex:1 }}
                />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {allProducts.length === 0 && <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No products found</p>}
                {allProducts.map(p => (
                  <div key={p._id} className="glass" style={{ padding:16, borderRadius:16, border: p.status === 'rejected' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                      <div 
                        onClick={() => setPreviewVideo({ id: p._id, url: p.reels[0].videoUrl, name: p.name, source: 'all' })}
                        style={{ width:64, height:96, borderRadius:8, overflow:'hidden', background:'#000', flexShrink:0, cursor:'pointer', position:'relative' }}
                      >
                        <video src={getFullSrc(p.reels[0].videoUrl)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <PlayIcon size={16} color="#fff" fill="#fff" />
                        </div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <p style={{ fontWeight:700, fontSize:'0.9rem', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{p.name}</p>
                          <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:99, fontWeight:700, background: p.status==='approved'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color: p.status==='approved'?'#22c55e':'#ef4444' }}>{p.status}</span>
                        </div>
                        <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:6 }}>By {p.vendor?.name} • {p.category}</p>
                        
                        <div style={{ display:'flex', gap:8 }}>
                          {p.status !== 'rejected' ? (
                            <button 
                              onClick={() => openTakedownModal(p._id, p.name)}
                              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:8, padding:'4px 10px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}
                            >
                              Take Down
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleProductReview(p._id, 'approved')}
                              style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:8, padding:'4px 10px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}
                            >
                              Restore
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:8, padding:'4px 10px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}
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
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input
                className="input-field"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {allUsers.length === 0 && <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No users found</p>}
              {allUsers.map(u => (
                <div key={u._id} className="glass" style={{ padding:14, borderRadius:16, display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {u.avatar ? <img src={getFullSrc(u.avatar)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontWeight:700 }}>{u.name?.[0]}</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700, fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                    <p style={{ fontSize:'0.7rem', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</p>
                  </div>
                  <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:99, fontWeight:700, flexShrink:0,
                    background: u.role==='admin'?'rgba(251,146,60,0.15)':u.role==='vendor'?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.07)',
                    color: u.role==='admin'?'#fb923c':u.role==='vendor'?'#818cf8':'#94a3b8'
                  }}>{u.role}</span>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => openTakedownModal(u._id, u.name, 'user')}
                      style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:8, padding:'4px 10px', fontSize:'0.7rem', fontWeight:600, cursor:'pointer', flexShrink:0 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Preview Modal */}
      <Modal 
        isOpen={!!previewVideo} 
        onClose={() => setPreviewVideo(null)} 
        title={previewVideo ? `${previewVideo.name} (${(previewVideo.index || 0) + 1}/${pendingProducts.find(x=>x._id===previewVideo.id)?.reels.length})` : 'Preview'}
      >
        <div style={{ position:'relative', width:'100%', aspectRatio:'9/16', maxHeight:'55vh', borderRadius:16, overflow:'hidden', background:'#000' }}>
          {previewVideo && (
            <>
              <VideoPlayer src={previewVideo.url} />
              {/* Navigation overlay remains same */}
              {(() => {
                const currentList = previewVideo.source === 'all' ? allProducts : pendingProducts;
                const p = currentList.find(x => x._id === previewVideo.id);
                if (!p || p.reels.length <= 1) return null;
                return (
                  <div style={{ position:'absolute', bottom:20, left:0, right:0, display:'flex', justifyContent:'center', gap:20, zIndex:100 }}>
                    <button onClick={(e) => { e.stopPropagation(); const newIdx = ((previewVideo.index || 0) - 1 + p.reels.length) % p.reels.length; setPreviewVideo({ ...previewVideo, index: newIdx, url: p.reels[newIdx].videoUrl }); }} style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(10px)', border:'none', borderRadius:99, width:40, height:40, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ArrowLeft size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); const newIdx = ((previewVideo.index || 0) + 1) % p.reels.length; setPreviewVideo({ ...previewVideo, index: newIdx, url: p.reels[newIdx].videoUrl }); }} style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(10px)', border:'none', borderRadius:99, width:40, height:40, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ArrowLeft style={{ transform:'rotate(180deg)' }} size={20} /></button>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Product Details Section */}
        {previewVideo && (() => {
          const currentList = previewVideo.source === 'all' ? allProducts : pendingProducts;
          const p = currentList.find(x => x._id === previewVideo.id);
          if (!p) return null;
          return (
            <div style={{ marginTop: 16, maxHeight: '25vh', overflowY: 'auto', padding: '0 4px' }} className="custom-scrollbar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.8rem' }}>
                    <Package size={14} />
                    <span>{p.category} • By {p.vendor?.name}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#818cf8', marginBottom: 2 }}>₹{p.price}</p>
                  {p.isOnSale && <span style={{ fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, letterSpacing: '0.05em' }}>ON SALE</span>}
                </div>
              </div>

              {p.description && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>{p.description}</p>
                </div>
              )}

              {p.tags && p.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  {p.tags.map(t => (
                    <span key={t} style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: 8, background: 'rgba(129,140,248,0.08)', color: '#a5b4fc', border: '1px solid rgba(129,140,246,0.1)', fontWeight: 600 }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ display:'flex', gap:8, marginTop:20, flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ flex:1, padding:'12px 0', minWidth: 100 }} onClick={() => handleProductReview(previewVideo.id, 'approved')}>Approve</button>
          <button className="btn-danger" style={{ flex:1, padding:'12px 0', minWidth: 100 }} onClick={() => openTakedownModal(previewVideo.id, previewVideo.name)}>Reject</button>
          <button 
            onClick={() => handleDeleteProduct(previewVideo.id, previewVideo.name)}
            style={{ flex: '0 0 auto', padding: '0 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#ef4444', borderRadius:12, fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </Modal>

      {/* Takedown Reason Modal */}
       <Modal isOpen={!!takedownModal} onClose={() => setTakedownModal(null)} title={
        takedownModal?.type === 'user' ? 'Remove Account' : 
        takedownModal?.type === 'delete' ? 'Permanently Delete Product' : 
        'Take Down Product'
      }>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            {takedownModal?.type === 'user' ? (
              <>You are permanently removing the account of <strong style={{ color: '#fff' }}>"{takedownModal?.name}"</strong>. All their reels, products, and messages will be deleted.</>
            ) : takedownModal?.type === 'delete' ? (
              <>You are permanently deleting <strong style={{ color: '#fff' }}>"{takedownModal?.name}"</strong>. A message with your reason will be sent to the vendor.</>
            ) : (
              <>You are taking down <strong style={{ color: '#fff' }}>"{takedownModal?.name}"</strong>. A message with your reason will be sent to the vendor's inbox.</>
            )}
          </p>
          <textarea
            className="input-field"
            placeholder="Enter reason for takedown (required)..."
            value={takedownReason}
            onChange={e => setTakedownReason(e.target.value)}
            rows={4}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setTakedownModal(null)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 12, padding: '12px 0', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={confirmTakedown}
              disabled={!takedownReason.trim() || takingDown}
              style={{ flex: 1 }}
            >
              {takingDown ? 'Processing...' : 
               takedownModal?.type === 'delete' ? 'Confirm Permanent Delete' :
               takedownModal?.type === 'user' ? 'Confirm Removal' :
               'Confirm Takedown'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


