import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReelCard from '../components/reel/ReelCard';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { getFeed, getLatestTimestamp, trackInterest } from '../api';
import { Smartphone, Download, RefreshCw, Bell, Search, Heart, MapPin, Play, Film, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_AVATARS = [
  { name: 'Dogs', count: '125+', tag: 'dog', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cats', count: '89+', tag: 'cat', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80' },
  { name: 'Birds', count: '45+', tag: 'bird', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=150&auto=format&fit=crop&q=80' },
  { name: 'Fish', count: '30+', tag: 'fish', img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=150&auto=format&fit=crop&q=80' },
  { name: 'Others', count: '20+', tag: 'accessories', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150&auto=format&fit=crop&q=80' },
];

const CATEGORY_GRID_ITEMS = [
  { name: 'Dogs', count: '125+ Listings', tag: 'dog', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&auto=format&fit=crop&q=80' },
  { name: 'Cats', count: '89+ Listings', tag: 'cat', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80' },
  { name: 'Birds', count: '45+ Listings', tag: 'bird', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&auto=format&fit=crop&q=80' },
  { name: 'Fish', count: '30+ Listings', tag: 'fish', img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=300&auto=format&fit=crop&q=80' },
  { name: 'Small Pets', count: '20+ Listings', tag: 'rabbit', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&auto=format&fit=crop&q=80' },
  { name: 'Pet Services', count: '60+ Listings', tag: 'grooming', img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=300&auto=format&fit=crop&q=80' },
];

export default function FeedPage() {
  const navigate = useNavigate();
  const { user, canInstall, installApp, unreadNotificationsCount } = useAuth();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showPWA, setShowPWA] = useState(false);
  const [showNewReels, setShowNewReels] = useState(false);
  const [viewMode, setViewMode] = useState('home'); // 'home' | 'reels'
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  const containerRef = useRef(null);
  const isFetching = useRef(false);
  const newestTimestamp = useRef(null);
  const viewedProducts = useRef(new Set());

  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const loadFeed = useCallback(async (p, customLimit) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (p > 1 || (customLimit && customLimit > 5)) setLoading(true);

    try {
      const limit = customLimit || 10;
      const { data } = await getFeed(p, limit);
      setProducts(prev => {
        const next = p === 1 ? data.products : [...prev, ...data.products];
        if (p === 1 && data.products.length > 0 && !newestTimestamp.current) {
          newestTimestamp.current = data.products[0].createdAt;
        }
        return next;
      });
      setHasMore(data.hasMore);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    loadFeed(1, 10);
  }, [loadFeed]);

  useEffect(() => { if (page > 1) loadFeed(page); }, [page, loadFeed]);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await getLatestTimestamp();
        if (
          data.latestTimestamp &&
          newestTimestamp.current &&
          new Date(data.latestTimestamp) > new Date(newestTimestamp.current)
        ) {
          setShowNewReels(true);
        }
      } catch {}
    };

    const timer = setInterval(poll, 60_000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setShowNewReels(false);
    newestTimestamp.current = null;
    setPage(1);
    if (containerRef.current) containerRef.current.scrollTop = 0;
    loadFeed(1, 10);
  };

  const openFullReelAt = (index) => {
    setSelectedReelIndex(index);
    setViewMode('reels');
  };

  // Render Full Screen Vertical Reels Mode
  if (viewMode === 'reels') {
    return (
      <div
        className="reel-container"
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          background: '#040704',
          zIndex: 100,
        }}
      >
        {/* Back to Homepage Header */}
        <div style={{
          position: 'fixed',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => setViewMode('home')}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              background: 'rgba(10, 18, 13, 0.85)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#FFE58F',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to Feed
          </button>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            color: '#FFE58F',
            letterSpacing: '0.04em',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            Reels 🎬
          </div>
        </div>

        {products.map((product, i) => (
          <div
            key={product._id}
            className="reel-wrapper"
            data-index={i}
            data-product-id={product._id}
            style={{ height: '100dvh', scrollSnapAlign: 'start' }}
          >
            <ReelCard product={product} />
          </div>
        ))}
      </div>
    );
  }

  // ── Render Mobile Landing Homepage View ──────────────────────────────────────────
  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 680, margin: '0 auto' }}>
      {/* 1. Mobile Header Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="Kerala Pets Logo" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(15, 29, 20, 0.75)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFE58F',
              position: 'relative',
            }}
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <div style={{
                position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid #080d09'
              }} />
            )}
          </button>
          <div
            onClick={() => navigate('/profile')}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #D4AF37',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.avatar ? (
              <img src={getFullSrc(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f0c08' }}>{user?.name?.[0] || '🐾'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Greeting Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F5F5EC', marginBottom: 4, fontFamily: 'Cinzel, serif' }}>
          Hey, Pet Lover! 🐾
        </h1>
        <p style={{ fontSize: '0.92rem', color: '#A3B8A8', fontWeight: 500 }}>
          What are you looking for today?
        </p>
      </div>

      {/* 3. Search Bar */}
      <div
        onClick={() => navigate('/search')}
        style={{
          position: 'relative',
          marginBottom: 24,
          cursor: 'pointer',
        }}
      >
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#D4AF37' }} />
        <div
          style={{
            padding: '14px 16px 14px 44px',
            borderRadius: 16,
            fontSize: '0.9rem',
            background: 'rgba(15, 29, 20, 0.75)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            color: '#8c9e90',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
          }}
        >
          Search pets, services, breeds...
        </div>
      </div>

      {/* 4. Horizontal Scrollable Category Avatars */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, marginBottom: 28, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORY_AVATARS.map((cat) => (
          <div
            key={cat.name}
            onClick={() => navigate(`/search?tag=${cat.tag}`)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              padding: 2,
              background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)',
            }}>
              <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F5F5EC' }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* 5. Trending Reels Carousel */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFE58F', display: 'flex', alignItems: 'center', gap: 6 }}>
            Trending Reels 🔥
          </h2>
          <button
            onClick={() => setViewMode('reels')}
            style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View all <ChevronRight size={16} />
          </button>
        </div>

        {/* Carousel Row */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {products.slice(0, 6).map((product, idx) => {
            const reel = product.primaryReel || product.reels?.[0];
            return (
              <div
                key={product._id}
                onClick={() => openFullReelAt(idx)}
                className="glass"
                style={{
                  width: 170,
                  height: 240,
                  borderRadius: 20,
                  flexShrink: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                  background: '#040704',
                }}
              >
                {reel ? (
                  <video
                    poster={reel.thumbnail ? getFullSrc(reel.thumbnail) : undefined}
                    src={getFullSrc(reel.videoUrl)}
                    muted
                    preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0d1a12, #16281c)' }} />
                )}

                {/* Dark Gradient Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,7,4,0.95) 0%, rgba(0,0,0,0.1) 60%)' }} />

                {/* Play Badge Top */}
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,18,13,0.7)', backdropFilter: 'blur(8px)', padding: 6, borderRadius: '50%' }}>
                  <Play size={14} fill="#FFE58F" color="#D4AF37" />
                </div>

                {/* Details Bottom */}
                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F5F5EC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {product.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 4, fontSize: '0.72rem', color: '#A3B8A8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MapPin size={10} color="#D4AF37" /> {product.location?.city || 'Kerala'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                      <Heart size={10} color="#ef4444" fill="#ef4444" /> {product.likesCount || 0}
                    </span>
                  </div>
                  {product.price > 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.82rem', fontWeight: 800, color: '#FFE58F' }}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. "Adopt, Don't Shop" Banner Card */}
      <div
        className="glass"
        style={{
          borderRadius: 22,
          padding: '20px 22px',
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(15, 29, 20, 0.85), rgba(10, 18, 13, 0.95))',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F5F5EC', marginBottom: 6, fontFamily: 'Cinzel, serif' }}>
            Adopt, Don't Shop
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#A3B8A8', lineHeight: 1.4, marginBottom: 14 }}>
            Give them a loving home, they will give you a lifetime of love.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/search?tag=adoption')}
            style={{ padding: '8px 18px', fontSize: '0.78rem', borderRadius: 12 }}
          >
            Explore Now
          </button>
        </div>
        <div style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(212,175,55,0.4)' }}>
          <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80" alt="Puppy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* 7. Categories Grid (2 Columns Mobile) */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFE58F', marginBottom: 14, fontFamily: 'Cinzel, serif' }}>
          Browse Categories
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {CATEGORY_GRID_ITEMS.map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate(`/search?tag=${cat.tag}`)}
              className="glass"
              style={{
                borderRadius: 20,
                padding: 14,
                background: 'rgba(15, 29, 20, 0.75)',
                border: '1px solid rgba(212, 175, 55, 0.22)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
              }}
            >
              <img src={cat.img} alt={cat.name} style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(212,175,55,0.3)' }} />
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F5F5EC', marginBottom: 2 }}>{cat.name}</h4>
                <p style={{ fontSize: '0.7rem', color: '#A3B8A8' }}>{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Recommended Listings (2 Columns Grid) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFE58F', fontFamily: 'Cinzel, serif' }}>
            Recommended Pets
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#A3B8A8' }}>Near Kerala</span>
        </div>

        {loading && products.length === 0 ? <Spinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}