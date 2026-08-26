import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReelCard from '../components/reel/ReelCard';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ComingSoonModal from '../components/ui/ComingSoonModal';
import { getFeed, getLatestTimestamp, trackInterest } from '../api';
import { Smartphone, Download, RefreshCw, Bell, Search, Heart, MapPin, Play, Film, ChevronRight, ShoppingBag, Scissors, Package, Sparkles, Home, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_AVATARS = [
  { name: 'Dogs', count: '125+', tag: 'dog', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80' },
  { name: 'Cats', count: '89+', tag: 'cat', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80' },
  { name: 'Birds', count: '45+', tag: 'bird', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=200&auto=format&fit=crop&q=80' },
  { name: 'Fish', count: '30+', tag: 'fish', img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&auto=format&fit=crop&q=80' },
  { name: 'Others', count: '20+', tag: 'other', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&auto=format&fit=crop&q=80' },
];

const CATEGORY_GRID_ITEMS = [
  {
    name: 'Dogs',
    count: '125+ Listings',
    tag: 'dog',
    bg: 'linear-gradient(135deg, rgba(50, 42, 22, 0.85) 0%, rgba(18, 16, 10, 0.96) 100%)',
    img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cats',
    count: '89+ Listings',
    tag: 'cat',
    bg: 'linear-gradient(135deg, rgba(38, 33, 26, 0.85) 0%, rgba(14, 13, 11, 0.96) 100%)',
    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Birds',
    count: '45+ Listings',
    tag: 'bird',
    bg: 'linear-gradient(135deg, rgba(30, 44, 25, 0.85) 0%, rgba(12, 18, 11, 0.96) 100%)',
    img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Fish',
    count: '30+ Listings',
    tag: 'fish',
    bg: 'linear-gradient(135deg, rgba(18, 40, 34, 0.85) 0%, rgba(10, 18, 15, 0.96) 100%)',
    img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Small Pets',
    count: '20+ Listings',
    tag: 'other',
    bg: 'linear-gradient(135deg, rgba(30, 38, 32, 0.85) 0%, rgba(12, 16, 14, 0.96) 100%)',
    img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pet Services',
    count: '60+ Listings',
    featureKey: 'services',
    bg: 'linear-gradient(135deg, rgba(46, 40, 24, 0.85) 0%, rgba(18, 16, 10, 0.96) 100%)',
    img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&auto=format&fit=crop&q=80'
  },
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

      {/* 8. Categories Grid (2 Columns Photographic Cards Matching Reference Screenshot) */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 16, textAlign: 'center', letterSpacing: '-0.01em' }}>
          Categories
        </h2>

        {/* 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
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
              style={{
                height: 140,
                borderRadius: 22,
                padding: 14,
                background: cat.bg,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Plus icon top left */}
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Plus size={16} color="rgba(255, 255, 255, 0.45)" />
              </div>

              {/* Text details bottom left */}
              <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10, maxWidth: '65%' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 2, letterSpacing: '-0.01em' }}>
                  {cat.name}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#D4AF37', fontWeight: 500, margin: 0 }}>
                  {cat.count}
                </p>
              </div>

              {/* Animal Photo overlapping right side */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '58%',
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
                {/* Soft gradient mask blending image into background */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(14, 13, 11, 0.95) 0%, rgba(14, 13, 11, 0.4) 40%, transparent 100%)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Adopt, Don't Shop Full Width Banner */}
        <div
          onClick={() => setComingSoonFeature('adoption')}
          style={{
            height: 165,
            borderRadius: 22,
            padding: '20px 20px',
            background: 'linear-gradient(135deg, rgba(34, 38, 25, 0.88) 0%, rgba(12, 16, 11, 0.96) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Left Content Stack */}
          <div style={{ zIndex: 10, maxWidth: '58%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Adopt, Don’t Shop
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.35, marginBottom: 14 }}>
              Give them a home,<br />they will give you<br />a lifetime of love.
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setComingSoonFeature('adoption'); }}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: 12,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: 'fit-content',
              }}
            >
              Explore Now
            </button>
          </div>

          {/* Right Side Golden Retriever Puppy Photo */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '52%',
            overflow: 'hidden',
          }}>
            <img
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=80"
              alt="Golden Retriever Puppy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
            {/* Soft gradient mask */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(12, 16, 11, 0.98) 0%, rgba(12, 16, 11, 0.4) 40%, transparent 100%)',
            }} />
          </div>
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