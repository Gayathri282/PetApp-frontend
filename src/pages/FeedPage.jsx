import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Play, ChevronRight, CheckCircle, Star, ShieldCheck, ShoppingBag } from 'lucide-react';
import ReelCard from '../components/reel/ReelCard';
import ProductCard from '../components/product/ProductCard';
import PetVideoCard from '../components/video/PetVideoCard';
import ReelsViewer from '../components/reel/ReelsViewer';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getFeed, getLatestTimestamp } from '../api';
import { CATEGORIES, HOME_CATEGORY_COUNT } from '../data/categories';
import { FALLBACK_GUPPY_PRODUCTS } from '../data/guppyProducts';
import { getPlayableVideoUrl, getPosterUrl, getFullSrc, logVideoDiagnostics } from '../utils/media';

/** Category image with a colored initial placeholder shown until the image is uploaded. */
function CategoryImage({ cat, style }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cat.bg, color: '#FFFFFF', fontWeight: 800, fontSize: '1.4rem' }}>
        {cat.name.charAt(0)}
      </div>
    );
  }
  return <img src={cat.image} alt={cat.name} onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
}

export default function FeedPage() {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const homeCategories = CATEGORIES.slice(0, HOME_CATEGORY_COUNT);
  const openCategory = (cat) => {
    setShowAllCategories(false);
    navigate(`/search?category=${cat.tag}`);
  };
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
      if (data && data.products && data.products.length > 0) {
        setProducts(prev => {
          const next = p === 1 ? data.products : [...prev, ...data.products];
          if (p === 1 && data.products.length > 0 && !newestTimestamp.current) {
            newestTimestamp.current = data.products[0].createdAt;
          }
          return next;
        });
        setHasMore(data.hasMore);
      } else if (p === 1) {
        setProducts(FALLBACK_GUPPY_PRODUCTS);
        setHasMore(false);
      }
    } catch (e) {
      console.error('Feed error:', e);
      if (p === 1) {
        setProducts(FALLBACK_GUPPY_PRODUCTS);
        setHasMore(false);
      }
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

  // ── Data Filtering ─────────────────────────────────────────────────────────────
  // All pet reels — no filtering
  const allPetReels = products;
  // Only pets currently listed for sale
  const onSaleReels = products.filter(p => p.isOnSale === true);

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 680, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      
      {/* 1. Header Hero Section */}
      <div style={{ marginBottom: 20 }}>
        <p className="section-label">TRUSTED BY LOCAL PET LOVERS</p>
        <h1 className="serif-heading" style={{ fontSize: '1.75rem', marginBottom: 6 }}>
          Kerala's Pet Marketplace
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#60736F' }}>
          Connect with verified local breeders and pet lovers across Kerala.
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
        {homeCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => openCategory(cat)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
            }}>
              <CategoryImage cat={cat} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#12332F' }}>{cat.name}</span>
          </div>
        ))}
        {CATEGORIES.length > HOME_CATEGORY_COUNT && (
          <div
            id="view-more-categories"
            onClick={() => setShowAllCategories(true)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8F1ED', border: '1.5px dashed #0D5148', color: '#0D5148' }}>
              <ChevronRight size={26} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0D5148' }}>View more</span>
          </div>
        )}
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

      {/* 5. ON SALE (Horizontal Scrolling Row — All On-Sale Pets) */}
      <div style={{ marginBottom: 34 }}>
        <p className="section-label">PETS ON SALE</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="serif-heading" style={{ fontSize: '1.35rem' }}>
            On Sale
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
        ) : onSaleReels.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #D6E3DE',
            gap: 12,
          }}>
            <ShoppingBag size={36} color="#0D5148" opacity={0.5} />
            <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#60736F', margin: 0 }}>No pets currently on sale</p>
          </div>
        ) : (
          <div
            className="on-sale-scroll"
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              overflowY: 'hidden',
              flexWrap: 'nowrap',
              scrollSnapType: 'x mandatory',
              paddingBottom: 10,
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <style>{`.on-sale-scroll::-webkit-scrollbar { display: none; }`}</style>
            {onSaleReels.map((p) => (
              <div
                key={p._id}
                className="on-sale-card"
                style={{
                  flex: '0 0 auto',
                  width: 220,
                  scrollSnapAlign: 'start',
                }}
              >
                <ProductCard
                  product={p}
                  activeVideoId={activeVideoId}
                  setActiveVideoId={setActiveVideoId}
                  onVideoClick={(item) => handleOpenReels(item, onSaleReels)}
                />
              </div>
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
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          List Your Pet
        </button>
      </div>

      {/* 8. WATCH PET REELS (Trending Reels Horizontal Carousel — ALL Reels) */}
      <div style={{ marginBottom: 34 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p className="section-label">TRENDING REELS</p>
            <h2 className="serif-heading" style={{ fontSize: '1.35rem' }}>Watch pet reels</h2>
          </div>
          <button
            onClick={() => handleOpenReels(allPetReels[0], allPetReels)}
            style={{ background: 'none', border: 'none', color: '#0D5148', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View all <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {allPetReels.map((product) => (
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
                onVideoClick={(item) => handleOpenReels(item, allPetReels)}
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

      {/* 9. FEATURED BREEDERS (Placed AFTER the Reels Section — No contact details or WhatsApp button) */}
      <div style={{ marginBottom: 34 }}>
        <p className="section-label">FEATURED BREEDERS</p>
        <h2 className="serif-heading" style={{ fontSize: '1.35rem', marginBottom: 14 }}>
          Meet Kerala's top breeders
        </h2>

        <div
          style={{
            background: 'linear-gradient(135deg, #0D5148 0%, #163B34 100%)',
            borderRadius: 20,
            padding: '20px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(13, 81, 72, 0.22)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <img
              src="/ck-guppies-logo.jpg"
              alt="CK Guppies Logo"
              style={{
                width: 62,
                height: 62,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid #FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                background: '#FFFFFF',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  CK Guppies
                </h3>
                <CheckCircle size={18} color="#F3C34E" fill="#0D5148" />
              </div>
              <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A3E2D5', margin: 0 }}>
                🏆 India’s Biggest Guppy Farm 🇮🇳
              </p>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#F3C34E', color: '#082F2B', padding: '4px 12px', borderRadius: 999 }}>
              VERIFIED BREEDER
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.78rem', opacity: 0.95, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <span>🎉 <strong>7600+</strong> Happy Customers</span>
            <span>•</span>
            <span>🌿 <strong>100+</strong> Premium Strains</span>
            <span>•</span>
            <span>💯 Educational 🎬 No Harm to Fish</span>
          </div>
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
            onClick={() => setShowAllCategories(true)}
            style={{ background: 'none', border: 'none', color: '#0D5148', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View more <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {homeCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => openCategory(cat)}
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
                <CategoryImage cat={cat} />
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

      {/* Modal: all guppy categories */}
      <Modal isOpen={showAllCategories} title="All Guppy Categories" onClose={() => setShowAllCategories(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '8px 0' }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => openCategory(cat)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <CategoryImage cat={cat} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', textAlign: 'center' }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal for Coming Soon Features */}
      <Modal isOpen={Boolean(comingSoonFeature)} title="Feature Coming Soon" onClose={() => setComingSoonFeature(null)}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#0D5148', fontWeight: 700, marginBottom: 8 }}>
            {comingSoonFeature?.toUpperCase()} SERVICES
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
    </div>
  );
}