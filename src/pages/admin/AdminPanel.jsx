import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Package, BarChart3, Check, X, Trash2, CheckCircle, Play as PlayIcon, Film, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import VideoPlayer from '../../components/reel/VideoPlayer';
import {
  getAdminStats,
  getApplications,
  reviewApplication,
  getAllAdminProducts,
  reviewProduct,
  adminDeleteProduct,
  adminGetReels,
  adminReviewReel,
  adminDeleteReel,
  adminGetUsers,
  adminSuspendUser,
  adminDeleteUser,
} from '../../api';

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('reels'); // 'dashboard' | 'reels' | 'products' | 'users' | 'apps'
  const [stats, setStats] = useState(null);

  // Sub-filters
  const [reelFilter, setReelFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'deleted'
  const [productFilter, setProductFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'deleted'
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'active' | 'suspended'

  // Data states
  const [reels, setReels] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [takedownModal, setTakedownModal] = useState(null); // { id, name, type }
  const [takedownReason, setTakedownReason] = useState('');
  const [takingDown, setTakingDown] = useState(false);

  const getFullSrc = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.replace(/\\/g, '/');
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  // Redirect non-admin server-side/auth guard
  useEffect(() => {
    if (!isAdmin && user?.role !== 'admin') {
      navigate('/feed');
    }
  }, [isAdmin, user, navigate]);

  // Fetch Stats on mount
  const loadStats = async () => {
    try {
      const { data } = await getAdminStats();
      setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Fetch data based on tab & filters
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (tab === 'reels') {
          const { data } = await adminGetReels(reelFilter, searchQuery);
          if (!isCancelled) setReels(data.reels || []);
        } else if (tab === 'products') {
          const { data } = await getAllAdminProducts(productFilter, searchQuery);
          if (!isCancelled) setProducts(data.products || []);
        } else if (tab === 'users') {
          const { data } = await adminGetUsers(userFilter, searchQuery);
          if (!isCancelled) setUsers(data.users || []);
        } else if (tab === 'apps') {
          const { data } = await getApplications();
          if (!isCancelled) setApps(data.applications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { isCancelled = true; };
  }, [tab, reelFilter, productFilter, userFilter, searchQuery]);

  // Moderation Action Handlers
  const handleReelAction = async (id, status, reason = '') => {
    try {
      await adminReviewReel(id, status, reason);
      setReels(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      loadStats();
      toast.success(`Reel ${status}`);
    } catch {
      toast.error('Failed to update reel status');
    }
  };

  const handleProductAction = async (id, status, reason = '') => {
    try {
      await reviewProduct(id, status, reason);
      setProducts(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      loadStats();
      toast.success(`Product ${status}`);
    } catch {
      toast.error('Failed to update product status');
    }
  };

  const handleUserSuspendToggle = async (userId, isCurrentlySuspended) => {
    try {
      const nextSuspend = !isCurrentlySuspended;
      await adminSuspendUser(userId, nextSuspend);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: nextSuspend ? 'suspended' : 'active', isSuspended: nextSuspend } : u));
      loadStats();
      toast.success(`User account ${nextSuspend ? 'suspended' : 'activated'}`);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const openTakedownModal = (id, name, type) => {
    setTakedownReason('');
    setTakedownModal({ id, name, type });
  };

  const confirmTakedown = async () => {
    if (!takedownReason.trim() && takedownModal.type !== 'delete_reel') return;
    setTakingDown(true);
    try {
      const reason = takedownReason.trim() || 'Violation of community guidelines';
      if (takedownModal.type === 'delete_reel') {
        await adminDeleteReel(takedownModal.id, reason);
        setReels(prev => prev.map(r => r._id === takedownModal.id ? { ...r, status: 'deleted' } : r));
        toast.success('Reel deleted by admin.');
      } else if (takedownModal.type === 'delete_product') {
        await adminDeleteProduct(takedownModal.id, reason);
        setProducts(prev => prev.map(p => p._id === takedownModal.id ? { ...p, status: 'deleted' } : p));
        toast.success('Product deleted by admin.');
      } else if (takedownModal.type === 'delete_user') {
        await adminDeleteUser(takedownModal.id, reason);
        setUsers(prev => prev.filter(u => u._id !== takedownModal.id));
        toast.success('User account removed.');
      }
      loadStats();
      setTakedownModal(null);
    } catch {
      toast.error('Moderation action failed.');
    } finally {
      setTakingDown(false);
    }
  };

  const tabs = [
    { key: 'dashboard', icon: BarChart3, label: 'Overview' },
    { key: 'reels', icon: Film, label: 'Reels' },
    { key: 'products', icon: Package, label: 'Products' },
    { key: 'users', icon: Users, label: 'Users' },
    { key: 'apps', icon: CheckCircle, label: 'Applications' },
  ];

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 740, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/feed')}
            style={{ background: '#FFFFFF', border: '1px solid #D6E3DE', borderRadius: 12, padding: 8, color: '#0D5148', cursor: 'pointer', display: 'flex' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="serif-heading" style={{ fontSize: '1.45rem', margin: 0, color: '#12332F' }}>
              Admin <span style={{ color: '#0D5148' }}>Moderation Panel</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#60736F', margin: 0 }}>System Management & Content Review</p>
          </div>
        </div>
      </div>

      {/* ADMIN COUNTS HEADER */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316', margin: 0 }}>{stats.pendingReels || 0}</p>
            <p style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 700, margin: 0 }}>Pending Reels</p>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316', margin: 0 }}>{stats.pendingProducts || 0}</p>
            <p style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 700, margin: 0 }}>Pending Products</p>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0D5148', margin: 0 }}>{stats.totalReels || 0}</p>
            <p style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 700, margin: 0 }}>Total Reels</p>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0D5148', margin: 0 }}>{stats.totalProducts || 0}</p>
            <p style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 700, margin: 0 }}>Total Products</p>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0D5148', margin: 0 }}>{stats.users || 0}</p>
            <p style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 700, margin: 0 }}>Total Users</p>
          </div>
        </div>
      )}

      {/* Main Nav Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, background: '#FFFFFF', border: '1px solid #D6E3DE', borderRadius: 16, padding: 4, overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearchQuery(''); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 12px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              transition: 'all 0.2s',
              background: tab === t.key ? '#0D5148' : 'transparent',
              color: tab === t.key ? '#FFFFFF' : '#60736F',
              whiteSpace: 'nowrap',
            }}
          >
            <t.icon size={16} color={tab === t.key ? '#FFFFFF' : '#60736F'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* SUB-FILTERS & SEARCH */}
      {tab !== 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <input
            type="text"
            className="input-field"
            placeholder={`Search ${tab} by name...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: '#FFFFFF', border: '1px solid #D6E3DE', color: '#111111' }}
          />

          {/* Reel Sub-filters */}
          {tab === 'reels' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', 'pending', 'approved', 'rejected', 'deleted'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReelFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '1px solid #D6E3DE',
                    background: reelFilter === st ? '#0D5148' : '#FFFFFF',
                    color: reelFilter === st ? '#FFFFFF' : '#12332F',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* Product Sub-filters */}
          {tab === 'products' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', 'pending', 'approved', 'rejected', 'deleted'].map((st) => (
                <button
                  key={st}
                  onClick={() => setProductFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '1px solid #D6E3DE',
                    background: productFilter === st ? '#0D5148' : '#FFFFFF',
                    color: productFilter === st ? '#FFFFFF' : '#12332F',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* User Sub-filters */}
          {tab === 'users' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', 'active', 'suspended'].map((st) => (
                <button
                  key={st}
                  onClick={() => setUserFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '1px solid #D6E3DE',
                    background: userFilter === st ? '#0D5148' : '#FFFFFF',
                    color: userFilter === st ? '#FFFFFF' : '#12332F',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENTS */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
      ) : (
        <div>
          {/* Dashboard Overview */}
          {tab === 'dashboard' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: 20, background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#12332F', marginBottom: 12 }}>
                  Moderation Quick Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <button
                    onClick={() => { setTab('reels'); setReelFilter('pending'); }}
                    style={{ padding: '12px', borderRadius: 12, background: '#F3F8F5', border: '1px solid #D6E3DE', color: '#0D5148', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Review Pending Reels ({stats.pendingReels || 0}) →
                  </button>
                  <button
                    onClick={() => { setTab('products'); setProductFilter('pending'); }}
                    style={{ padding: '12px', borderRadius: 12, background: '#F3F8F5', border: '1px solid #D6E3DE', color: '#0D5148', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Review Pending Products ({stats.pendingProducts || 0}) →
                  </button>
                  <button
                    onClick={() => setTab('apps')}
                    style={{ padding: '12px', borderRadius: 12, background: '#F3F8F5', border: '1px solid #D6E3DE', color: '#0D5148', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Vendor Applications ({stats.pendingApps || 0}) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* A. REELS MODERATION TAB */}
          {tab === 'reels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reels.length === 0 && (
                <p style={{ textAlign: 'center', color: '#60736F', padding: 40, background: '#FFFFFF', borderRadius: 16 }}>
                  No reels match filter: <strong>{reelFilter}</strong>
                </p>
              )}
              {reels.map((r) => (
                <div key={r._id} className="card" style={{ padding: 16, background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      onClick={() => setPreviewVideo({ id: r._id, url: r.reels?.[0]?.videoUrl || '', name: r.name })}
                      style={{ width: 80, height: 110, borderRadius: 12, overflow: 'hidden', background: '#E8F1ED', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                    >
                      {r.reels?.[0]?.videoUrl ? (
                        <video src={getFullSrc(r.reels[0].videoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayIcon size={20} color="#0D5148" /></div>
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlayIcon size={20} color="#fff" fill="#fff" />
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#12332F', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {r.name}
                        </h4>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: r.status === 'approved' ? '#dcfce7' : r.status === 'pending' ? '#ffedd5' : '#fee2e2',
                          color: r.status === 'approved' ? '#166534' : r.status === 'pending' ? '#c2410c' : '#991b1b',
                        }}>
                          {r.status}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: '#60736F', margin: '2px 0 4px' }}>
                        Seller: <strong>{r.vendor?.name || 'Vendor'}</strong> ({r.vendor?.email || 'N/A'})
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#60736F', margin: '0 0 8px' }}>
                        Submitted: {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                      {r.description && (
                        <p style={{ fontSize: '0.78rem', color: '#12332F', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{r.description}"
                        </p>
                      )}

                      {/* Moderation Actions */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {r.status !== 'approved' && (
                          <button
                            onClick={() => handleReelAction(r._id, 'approved')}
                            style={{ background: '#0D5148', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            onClick={() => handleReelAction(r._id, 'rejected')}
                            style={{ background: '#f97316', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        )}
                        {r.status !== 'deleted' && (
                          <button
                            onClick={() => openTakedownModal(r._id, r.name, 'delete_reel')}
                            style={{ background: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Delete Reel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* B. PRODUCT MODERATION TAB */}
          {tab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {products.length === 0 && (
                <p style={{ textAlign: 'center', color: '#60736F', padding: 40, background: '#FFFFFF', borderRadius: 16 }}>
                  No products match filter: <strong>{productFilter}</strong>
                </p>
              )}
              {products.map((p) => (
                <div key={p._id} className="card" style={{ padding: 16, background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{ width: 72, height: 90, borderRadius: 12, overflow: 'hidden', background: '#E8F1ED', flexShrink: 0 }}
                    >
                      {p.images?.[0] ? (
                        <img src={getFullSrc(p.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : p.reels?.[0]?.videoUrl ? (
                        <video src={getFullSrc(p.reels[0].videoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#0D5148" /></div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#12332F', margin: 0 }}>{p.name}</h4>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: p.status === 'approved' ? '#dcfce7' : p.status === 'pending' ? '#ffedd5' : '#fee2e2',
                          color: p.status === 'approved' ? '#166534' : p.status === 'pending' ? '#c2410c' : '#991b1b',
                        }}>
                          {p.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#60736F', margin: '2px 0' }}>
                        Category: <strong>{p.category}</strong> • Price: <strong>₹{p.price}</strong>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#60736F', margin: '0 0 8px' }}>
                        Seller: {p.vendor?.name || 'Vendor'} • Submitted: {new Date(p.createdAt).toLocaleDateString()}
                      </p>

                      {/* Product Actions */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => handleProductAction(p._id, 'approved')}
                            style={{ background: '#0D5148', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button
                            onClick={() => handleProductAction(p._id, 'rejected')}
                            style={{ background: '#f97316', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        )}
                        {p.status !== 'deleted' && (
                          <button
                            onClick={() => openTakedownModal(p._id, p.name, 'delete_product')}
                            style={{ background: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Delete Product
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* C. USER MANAGEMENT TAB */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.length === 0 && (
                <p style={{ textAlign: 'center', color: '#60736F', padding: 40, background: '#FFFFFF', borderRadius: 16 }}>
                  No users match filter: <strong>{userFilter}</strong>
                </p>
              )}
              {users.map((u) => (
                <div key={u._id} className="card" style={{ padding: 14, background: '#FFFFFF', border: '1px solid #D6E3DE', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#E8F1ED', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0D5148' }}>
                    {u.avatar ? (
                      <img src={getFullSrc(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 800, color: '#0D5148' }}>{u.name?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#12332F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </p>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontWeight: 800,
                        background: u.status === 'suspended' ? '#fee2e2' : '#dcfce7',
                        color: u.status === 'suspended' ? '#991b1b' : '#166534',
                      }}>
                        {u.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#60736F', margin: '2px 0' }}>
                      {u.email || u.contactNumber || 'No contact email'} • Role: <strong>{u.role}</strong>
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#60736F', margin: 0 }}>
                      Products: {u.productCount || 0} • Reels: {u.reelCount || 0} • Joined: {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* User Actions */}
                  {u.role !== 'admin' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleUserSuspendToggle(u._id, u.status === 'suspended')}
                        style={{
                          background: u.status === 'suspended' ? '#0D5148' : '#f97316',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => openTakedownModal(u._id, u.name, 'delete_user')}
                        style={{ background: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Applications Tab */}
          {tab === 'apps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {apps.length === 0 && <p style={{ textAlign: 'center', color: '#60736F', padding: 40, background: '#FFFFFF', borderRadius: 16 }}>No vendor applications found</p>}
              {apps.map((app) => (
                <div key={app._id} className="card" style={{ padding: 16, background: '#FFFFFF', border: '1px solid #D6E3DE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: '#E8F1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #0D5148' }}>
                      {app.applicant?.avatar ? <img src={getFullSrc(app.applicant.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 800, color: '#0D5148' }}>{app.applicant?.name?.[0]}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#12332F' }}>{app.applicant?.name}</p>
                      <p style={{ fontSize: '0.76rem', color: '#60736F' }}>{app.applicant?.email}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 999, fontWeight: 700, background: app.status === 'pending' ? '#F3C34E' : app.status === 'approved' ? '#dcfce7' : '#fee2e2', color: app.status === 'pending' ? '#082F2B' : app.status === 'approved' ? '#166534' : '#991b1b' }}>{app.status}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#12332F', marginBottom: 4 }}>{app.businessName}</p>
                  <p style={{ fontSize: '0.82rem', color: '#0D5148', marginBottom: 4, fontWeight: 600 }}>📞 {app.contactNumber}</p>
                  <p style={{ fontSize: '0.82rem', color: '#60736F', marginBottom: 14 }}>{app.description}</p>
                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" style={{ flex: 1, padding: '9px 0', fontSize: '0.82rem' }} onClick={() => reviewApplication(app._id, 'approved').then(() => { setApps(prev => prev.map(a => a._id === app._id ? { ...a, status: 'approved' } : a)); toast.success('Approved'); })}><Check size={16} /> Approve Vendor</button>
                      <button className="btn-danger" style={{ flex: 1, padding: '9px 0', fontSize: '0.82rem' }} onClick={() => reviewApplication(app._id, 'rejected').then(() => { setApps(prev => prev.map(a => a._id === app._id ? { ...a, status: 'rejected' } : a)); toast.success('Rejected'); })}><X size={16} /> Reject</button>
                    </div>
                  )}
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

      {/* Takedown / Reason Modal */}
      {takedownModal && (
        <Modal title={`Action Notice: ${takedownModal.name}`} onClose={() => setTakedownModal(null)}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.85rem', color: '#60736F' }}>Please state the moderation reason for this action:</p>
            <textarea
              className="input-field"
              placeholder="e.g. Violation of community rules, spam..."
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              style={{ background: '#FFFFFF', border: '1px solid #D6E3DE', color: '#111111' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setTakedownModal(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} disabled={takingDown} onClick={confirmTakedown}>
                {takingDown ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

