import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Play, ChevronRight, CheckCircle, Star, ShieldCheck } from 'lucide-react';
import ReelCard from '../components/reel/ReelCard';
import ProductCard from '../components/product/ProductCard';
import PetVideoCard from '../components/video/PetVideoCard';
import ReelsViewer from '../components/reel/ReelsViewer';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getFeed, getLatestTimestamp } from '../api';
import { CATEGORIES } from '../data/categories';
import { getPlayableVideoUrl, getPosterUrl, getFullSrc, logVideoDiagnostics } from '../utils/media';

export default function FeedPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showNewReels, setShowNewReels] = useState(false);
  const [viewMode, setViewMode] = useState('home'); // 'home' or 'reels'
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);

  const [reelsViewerState, setReelsViewerState] = useState({
    isOpen: false,
    initialVideoId: null,
    videos: [],
  });

  const handleOpenReels = (clickedItem, list = products) => {
    if (!clickedItem) return;
    const targetId = clickedItem._id || clickedItem.id;
    setReelsViewerState({
      isOpen: true,
      initialVideoId: targetId,
      videos: list && list.length > 0 ? list : [clickedItem],
    });
  };

  const containerRef = useRef(null);
  const newestTimestamp = useRef(null);
  const isFetching = useRef(false);

  const getFullSrc = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.replace(/\\/g, '/');
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
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
    isFetching.current = false;
    loadFeed(1, 10);
    return () => {
      isFetching.current = false;
    };
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

  const openFullReelAt = (index) => {
    setSelectedReelIndex(index);
    setViewMode('reels');
  };

  // Scroll to selected reel index when switching to reels viewMode
  useEffect(() => {
    if (viewMode === 'reels' && containerRef.current) {
      const children = containerRef.current.querySelectorAll('.reel-wrapper');
      if (children[selectedReelIndex]) {
        children[selectedReelIndex].scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [viewMode, selectedReelIndex]);

  // ── Fullscreen Reels Vertical Scroll View Mode ─────────────────────────────────
  if (viewMode === 'reels') {
    return (
      <div
        className="reel-container"
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 9999,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
        }}
      >
        <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 10000 }}>
          <button
            onClick={() => setViewMode('home')}
            style={{
              background: '#0D5148',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(13, 81, 72, 0.4)',
            }}
          >
            ← Back to Feed
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

  // Slice maximum 3 products for single-row "Available near Kochi" section
  const nearbyProducts = products.slice(0, 3);

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 680, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      
      {/* 1. Header Hero Section */}
      <div style={{ marginBottom: 20 }}>
        <p className="section-label">KERALA'S PET MARKETPLACE</p>
        <h1 className="serif-heading" style={{ fontSize: '1.75rem', marginBottom: 6 }}>
          Find your next best companion
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#60736F' }}>
          Connect with trusted breeders and pet lovers across Kerala.
        </p>
      </div>

      {/* 2. Search Bar */}
      <div
        onClick={() => navigate('/search')}
        style={{
          position: 'relative',
          marginBottom: 24,
          cursor: 'pointer',
        }}
      >
        <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#0D5148' }} />
        <div
          style={{
            padding: '14px 16px 14px 48px',
            borderRadius: 18,
            fontSize: '0.9rem',
            background: '#FFFFFF',
            border: '1px solid #D6E3DE',
            color: '#60736F',
            boxShadow: '0 4px 18px rgba(13, 81, 72, 0.05)',
          }}
        >
          Search pets, breeds, products...
        </div>
      </div>

      {/* 3. Category Avatar Row */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, marginBottom: 26, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              if (cat.featureKey) {
                setComingSoonFeature(cat.featureKey);
              } else {
                navigate(`/search?category=${cat.tag}`);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={cat.image}
                alt={cat.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#12332F' }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* 4. Marketplace Features Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 30, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => navigate('/search')}
          style={{
            whiteSpace: 'nowrap',
            background: '#0D5148',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 16px',
            fontSize: '0.8rem',
            borderRadius: 999,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Buy & Sell
        </button>
        <button
          onClick={() => setComingSoonFeature('adoption')}
          style={{
            whiteSpace: 'nowrap',
            background: '#FFFFFF',
            color: '#0D5148',
            border: '1px solid #D6E3DE',
            padding: '8px 16px',
            fontSize: '0.8rem',
            borderRadius: 999,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Adoption <span style={{ fontSize: '0.62rem', background: '#F3C34E', color: '#082F2B', padding: '2px 6px', borderRadius: 8, fontWeight: 800, marginLeft: 4 }}>Soon</span>
        </button>
        <button
          onClick={() => setComingSoonFeature('services')}
          style={{
            whiteSpace: 'nowrap',
            background: '#FFFFFF',
            color: '#0D5148',
            border: '1px solid #D6E3DE',
            padding: '8px 16px',
            fontSize: '0.8rem',
            borderRadius: 999,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Pet Services <span style={{ fontSize: '0.62rem', background: '#F3C34E', color: '#082F2B', padding: '2px 6px', borderRadius: 8, fontWeight: 800, marginLeft: 4 }}>Soon</span>
        </button>
        <button
          onClick={() => setComingSoonFeature('essentials')}
          style={{
            whiteSpace: 'nowrap',
            background: '#FFFFFF',
            color: '#0D5148',
            border: '1px solid #D6E3DE',
            padding: '8px 16px',
            fontSize: '0.8rem',
            borderRadius: 999,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Essentials <span style={{ fontSize: '0.62rem', background: '#F3C34E', color: '#082F2B', padding: '2px 6px', borderRadius: 8, fontWeight: 800, marginLeft: 4 }}>Soon</span>
        </button>
      </div>

      {/* 5. AVAILABLE NEAR KOCHI (Single Row — Max 3 Cards) */}
      <div style={{ marginBottom: 34 }}>
        <p className="section-label">CURATED AROUND YOUR LOCATION</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="serif-heading" style={{ fontSize: '1.35rem' }}>
            Available near Kochi
          </h2>
          <button
            onClick={() => navigate('/search')}
            style={{ background: 'none', border: 'none', color: '#0D5148', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View all <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {nearbyProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                activeVideoId={activeVideoId}
                setActiveVideoId={setActiveVideoId}
                onVideoClick={(item) => handleOpenReels(item, products)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Promotional Banner */}
      <div style={{
        background: '#F3C34E',
        borderRadius: 22,
        padding: 20,
        marginBottom: 34,
        color: '#082F2B',
        boxShadow: '0 4px 18px rgba(243, 195, 78, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SELL WITH CONFIDENCE</p>
        <h3 className="serif-heading" style={{ fontSize: '1.3rem', color: '#082F2B' }}>
          Reach trusted pet lovers across Kerala
        </h3>
        <p style={{ fontSize: '0.84rem', color: '#123F3A', lineHeight: 1.4 }}>
          List your pet or breed with verified badge protection and direct local enquiries.
        </p>
        <button
          onClick={() => navigate('/vendor/apply')}
          style={{
            marginTop: 4,
            alignSelf: 'flex-start',
            background: '#0D5148',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          List Your Pet
        </button>
      </div>

      {/* 7. TRUSTED BREEDERS SECTION */}
      <div style={{ marginBottom: 34 }}>
        <p className="section-label">TRUSTED BY LOCAL PET LOVERS</p>
        <h2 className="serif-heading" style={{ fontSize: '1.35rem', marginBottom: 14 }}>
          Meet Kerala's top breeders
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div className="card" style={{ padding: 16, background: '#0D5148', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em' }}>PROFESSIONAL BREEDER</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#F3C34E', color: '#082F2B', padding: '4px 10px', borderRadius: 999 }}>TOP BREEDER</span>
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              GreenFin Aquatics & Pets <CheckCircle size={16} color="#F3C34E" />
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#E8F1ED', marginBottom: 12 }}>Kozhikode, Kerala</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#F3C34E' }}><Star size={14} fill="#F3C34E" /> 4.9 Rating</span>
              <span style={{ color: '#E8F1ED' }}>328 Verified Reviews</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#E8F1ED', color: '#0D5148', padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em' }}>CERTIFIED HOME BREEDER</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#E8F1ED', color: '#0D5148', padding: '4px 10px', borderRadius: 999 }}>VERIFIED</span>
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#12332F', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              BlueWave Companion Kennels <CheckCircle size={16} color="#0D5148" />
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#60736F', marginBottom: 12 }}>Ernakulam, Kochi</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: 10, borderTop: '1px solid #D6E3DE' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#0D5148' }}><Star size={14} fill="#0D5148" /> 4.8 Rating</span>
              <span style={{ color: '#60736F' }}>194 Verified Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. WATCH PET REELS (Trending Reels Horizontal Carousel) */}
      <div style={{ marginBottom: 34 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p className="section-label">TRENDING REELS</p>
            <h2 className="serif-heading" style={{ fontSize: '1.35rem' }}>Watch pet reels</h2>
          </div>
          <button
            onClick={() => handleOpenReels(products[0], products)}
            style={{ background: 'none', border: 'none', color: '#0D5148', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View all <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {products.slice(0, 6).map((product) => (
            <div
              key={product._id}
              className="card"
              style={{
                width: 165,
                height: 230,
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
                padding: 0,
                borderRadius: 18,
              }}
            >
              <PetVideoCard
                item={product}
                activeVideoId={activeVideoId}
                setActiveVideoId={setActiveVideoId}
                onVideoClick={(item) => handleOpenReels(item, products)}
                mediaHeight={230}
                sectionName="Watch Pet Reels"
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,47,43,0.9) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff', pointerEvents: 'none' }}>
                  <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {product.name}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#E8F1ED' }}>₹{product.price?.toLocaleString() || '0'}</p>
                </div>
              </PetVideoCard>
            </div>
          ))}
        </div>
      </div>

      {/* 9. START WITH A CATEGORY Cards Carousel (Positioned at the Bottom) */}
      <div style={{ marginBottom: 34 }}>
        <p className="section-label">START WITH A CATEGORY</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="serif-heading" style={{ fontSize: '1.35rem' }}>
            Find your next pet
          </h2>
          <button
            onClick={() => navigate('/search')}
            style={{ background: 'none', border: 'none', color: '#0D5148', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Browse all <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                if (cat.featureKey) {
                  setComingSoonFeature(cat.featureKey);
                } else {
                  navigate(`/search?category=${cat.tag}`);
                }
              }}
              className="card"
              style={{
                width: 170,
                flexShrink: 0,
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ height: 110, width: '100%', overflow: 'hidden', background: '#E8F1ED' }}>
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#12332F', marginBottom: 2 }}>{cat.name}</h4>
                  <p style={{ fontSize: '0.72rem', color: '#60736F' }}>{cat.count}</p>
                </div>
                <span style={{ color: '#0D5148', fontWeight: 800, fontSize: '0.9rem' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reel Viewer Modal for Click Playback */}
      <ReelsViewer
        isOpen={reelsViewerState.isOpen}
        videos={reelsViewerState.videos}
        initialVideoId={reelsViewerState.initialVideoId}
        onClose={() => setReelsViewerState({ isOpen: false, initialVideoId: null, videos: [] })}
      />

      {/* Modal for Coming Soon Features */}
      {comingSoonFeature && (
        <Modal title="Feature Coming Soon" onClose={() => setComingSoonFeature(null)}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0D5148', fontWeight: 700, marginBottom: 8 }}>
              {comingSoonFeature.toUpperCase()} SERVICES
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#60736F', marginBottom: 20 }}>
              We are currently onboarding verified local partners across Kerala for {comingSoonFeature}.
            </p>
            <button
              onClick={() => setComingSoonFeature(null)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Understood
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}