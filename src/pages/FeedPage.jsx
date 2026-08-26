import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReelCard from '../components/reel/ReelCard';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ComingSoonModal from '../components/ui/ComingSoonModal';
import { getFeed, getLatestTimestamp, trackInterest } from '../api';
import { Smartphone, Download, RefreshCw, Bell, Search, Heart, MapPin, Play, Film, ChevronRight, ShoppingBag, Scissors, Package, Sparkles, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_AVATARS = [
  { name: 'Dogs', count: '125+', tag: 'dog', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80' },
  { name: 'Cats', count: '89+', tag: 'cat', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80' },
  { name: 'Birds', count: '45+', tag: 'bird', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=200&auto=format&fit=crop&q=80' },
  { name: 'Fish', count: '30+', tag: 'fish', img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&auto=format&fit=crop&q=80' },
  { name: 'Others', count: '20+', tag: 'other', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&auto=format&fit=crop&q=80' },
];

const CATEGORY_GRID_ITEMS = [
  { name: 'Dogs', count: '125+ Listings', tag: 'dog', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80' },
  { name: 'Cats', count: '89+ Listings', tag: 'cat', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80' },
  { name: 'Birds', count: '45+ Listings', tag: 'bird', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80' },
  { name: 'Fish', count: '30+ Listings', tag: 'fish', img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop&q=80' },
  { name: 'Small Pets', count: '20+ Listings', tag: 'other', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&auto=format&fit=crop&q=80' },
  { name: 'Pet Services', count: 'Coming Soon', featureKey: 'services', img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&auto=format&fit=crop&q=80' },
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
  const [comingSoonFeature, setComingSoonFeature] = useState(null);

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
        {/* Sleek Home Icon Overlay (Top-Left) */}
        <div style={{
          position: 'fixed',
          top: 20,
          left: 16,
          zIndex: 1000,
        }}>
          <button
            onClick={() => {
              setViewMode('home');
              navigate('/feed');
            }}
            aria-label="Home"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(10, 18, 13, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#FFE58F',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            }}
          >
            <Home size={22} color="#FFE58F" />
          </button>
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
      {/* Greeting Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F5F5EC', marginBottom: 2, fontFamily: 'Cinzel, serif' }}>
          Hey, Pet Lover! 🐾
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#A3B8A8', fontWeight: 500 }}>
          What are you looking for today?
        </p>
      </div>

      {/* 3. Search Bar */}
      <div
        onClick={() => navigate('/search')}
        style={{
          position: 'relative',
          marginBottom: 20,
          cursor: 'pointer',
        }}
      >
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#D4AF37' }} />
        <div
          style={{
            padding: '13px 16px 13px 44px',
            borderRadius: 16,
            fontSize: '0.88rem',
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
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, marginBottom: 20, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORY_AVATARS.map((cat) => (
          <div
            key={cat.name}
            onClick={() => navigate(`/search?category=${cat.tag}`)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              padding: 2,
              background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
              boxShadow: '0 0 14px rgba(212, 175, 55, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#F5F5EC', fontFamily: 'Cinzel, serif' }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* 5. Compact Explore Discovery Row (Section 4) */}
      <div style={{ marginBottom: 26 }}>
        <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#A3B8A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Explore Features
        </p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => navigate('/search')}
            className="tag-pill active"
            style={{
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(16,185,129,0.3))',
              color: '#FFE58F',
              border: '1px solid rgba(212,175,55,0.6)',
              padding: '6px 14px',
              fontSize: '0.78rem',
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            🛍️ Buy & Sell
          </button>
          <button
            onClick={() => setComingSoonFeature('adoption')}
            className="tag-pill"
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 14px',
              fontSize: '0.78rem',
              borderRadius: 20,
            }}
          >
            ❤️ Adoption <span style={{ fontSize: '0.6rem', color: '#FFE58F', background: 'rgba(212,175,55,0.2)', padding: '2px 6px', borderRadius: 8, marginLeft: 4, fontWeight: 700 }}>Soon</span>
          </button>
          <button
            onClick={() => setComingSoonFeature('services')}
            className="tag-pill"
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 14px',
              fontSize: '0.78rem',
              borderRadius: 20,
            }}
          >
            ✂️ Pet Services <span style={{ fontSize: '0.6rem', color: '#FFE58F', background: 'rgba(212,175,55,0.2)', padding: '2px 6px', borderRadius: 8, marginLeft: 4, fontWeight: 700 }}>Soon</span>
          </button>
          <button
            onClick={() => setComingSoonFeature('essentials')}
            className="tag-pill"
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 14px',
              fontSize: '0.78rem',
              borderRadius: 20,
            }}
          >
            📦 Essentials <span style={{ fontSize: '0.6rem', color: '#FFE58F', background: 'rgba(212,175,55,0.2)', padding: '2px 6px', borderRadius: 8, marginLeft: 4, fontWeight: 700 }}>Soon</span>
          </button>
        </div>
      </div>

      {/* 6. Trending Reels Carousel */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFE58F', display: 'flex', alignItems: 'center', gap: 6 }}>
            Trending Reels 🔥
          </h2>
          <button
            onClick={() => setViewMode('reels')}
            style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View all <ChevronRight size={15} />
          </button>
        </div>

        {/* Carousel Row */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {products.slice(0, 6).map((product, idx) => {
            const reel = product.primaryReel || product.reels?.[0];
            return (
              <div
                key={product._id}
                onClick={() => openFullReelAt(idx)}
                className="glass"
                style={{
                  width: 165,
                  height: 230,
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
                  <Play size={13} fill="#FFE58F" color="#D4AF37" />
                </div>

                {/* Details Bottom */}
                <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F5F5EC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {product.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 4, fontSize: '0.7rem', color: '#A3B8A8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MapPin size={10} color="#D4AF37" /> {product.location?.city || 'Kerala'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                      <Heart size={10} color="#ef4444" fill="#ef4444" /> {product.likesCount || 0}
                    </span>
                  </div>
                  {product.price > 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.8rem', fontWeight: 800, color: '#FFE58F' }}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. "Adopt, Don't Shop" Teaser Banner */}
      <div
        className="glass"
        onClick={() => setComingSoonFeature('adoption')}
        style={{
          borderRadius: 22,
          padding: '18px 20px',
          marginBottom: 30,
          background: 'linear-gradient(135deg, rgba(15, 29, 20, 0.85), rgba(10, 18, 13, 0.95))',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F5F5EC', marginBottom: 4, fontFamily: 'Cinzel, serif' }}>
            Adopt, Don't Shop
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#A3B8A8', lineHeight: 1.4, marginBottom: 12 }}>
            Give them a loving home, they will give you a lifetime of love.
          </p>
          <button
            className="btn-primary"
            onClick={(e) => { e.stopPropagation(); setComingSoonFeature('adoption'); }}
            style={{ padding: '7px 16px', fontSize: '0.76rem', borderRadius: 12 }}
          >
            Explore Now
          </button>
        </div>
        <div style={{ width: 90, height: 90, borderRadius: 16, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(212,175,55,0.4)' }}>
          <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80" alt="Puppy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* 8. Categories Grid (2 Columns Photographic Cards Matching Reference Design) */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFE58F', marginBottom: 14, fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}>
          Categories
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {CATEGORY_GRID_ITEMS.map((cat) => (
            <div
              key={cat.name}
              onClick={() => {
                if (cat.featureKey) {
                  setComingSoonFeature(cat.featureKey);
                } else {
                  navigate(`/search?category=${cat.tag}`);
                }
              }}
              className="glass"
              style={{
                height: 122,
                borderRadius: 20,
                padding: '14px 14px',
                background: 'linear-gradient(135deg, rgba(20, 36, 26, 0.88), rgba(8, 14, 10, 0.96))',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.45)',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Decorative Sparkle icon top left */}
              <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                <Sparkles size={13} color="#D4AF37" style={{ opacity: 0.7 }} />
              </div>

              {/* Text details bottom left */}
              <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10, maxWidth: '65%' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#F5F5EC', marginBottom: 2, fontFamily: 'Cinzel, serif', letterSpacing: '0.01em' }}>
                  {cat.name}
                </h4>
                <p style={{ fontSize: '0.72rem', color: '#A3B8A8', fontWeight: 500, margin: 0 }}>
                  {cat.count}
                </p>
              </div>

              {/* Large photographic pet image overlapping right side */}
              <div style={{
                position: 'absolute',
                top: -6,
                right: -6,
                bottom: -6,
                width: '60%',
                overflow: 'hidden',
              }}>
                <img
                  src={cat.img}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                {/* Gradient mask blending image seamlessly into dark glass card */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(10, 18, 13, 0.98) 0%, rgba(10, 18, 13, 0.5) 45%, transparent 100%)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Recommended Listings */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFE58F', fontFamily: 'Cinzel, serif' }}>
            Recommended Pets
          </h2>
          <span style={{ fontSize: '0.76rem', color: '#A3B8A8' }}>Near Kerala</span>
        </div>

        {loading && products.length === 0 ? <Spinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Reusable Modal */}
      <ComingSoonModal
        isOpen={!!comingSoonFeature}
        onClose={() => setComingSoonFeature(null)}
        feature={comingSoonFeature}
      />
    </div>
  );
}