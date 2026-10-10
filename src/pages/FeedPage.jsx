import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Play, ChevronRight, CheckCircle, Star, ShieldCheck, ShoppingBag } from 'lucide-react';
import ReelCard from '../components/reel/ReelCard';
import ProductCard from '../components/product/ProductCard';
import PetVideoCard from '../components/video/PetVideoCard';
import ReelsViewer from '../components/reel/ReelsViewer';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getFeed, getLatestTimestamp, getHomepageShowcase } from '../api';
import { CATEGORIES, HOME_CATEGORY_COUNT } from '../data/categories';
import { FALLBACK_GUPPY_PRODUCTS, GUPPY_VARIETIES_LIST } from '../data/guppyProducts';
import { getPlayableVideoUrl, getPosterUrl, getFullSrc, logVideoDiagnostics } from '../utils/media';
import { isReelItem, isProductItem } from '../utils/productUtils';

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
  const [modalViewTab, setModalViewTab] = useState('breeds');
  const [breedSearchQuery, setBreedSearchQuery] = useState('');
  const [modalSelectedCat, setModalSelectedCat] = useState('all');
  const homeCategories = (adminShowcase.breedCircles && adminShowcase.breedCircles.length > 0)
    ? adminShowcase.breedCircles.map(c => ({
        id: c.id || c.tag || c.name.toLowerCase().replace(/\s+/g, '_'),
        name: c.name,
        tag: c.tag || c.id || c.name.toLowerCase().replace(/\s+/g, '_'),
        count: c.count || 'Breeds & Varieties',
        image: c.image || 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Guppy_02.JPG',
        color: c.color || '#0D5148',
        bg: `linear-gradient(135deg, ${c.color || '#0D5148'} 0%, rgba(12, 18, 16, 0.96) 100%)`,
      }))
    : CATEGORIES.slice(0, HOME_CATEGORY_COUNT);

  const openCategory = (cat) => {
    setShowAllCategories(false);
    navigate(`/search?q=${encodeURIComponent(cat.tag || cat.name)}`);
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
  const [adminShowcase, setAdminShowcase] = useState({ featuredCategories: [], featuredBreeds: [] });

  const filteredBreeds = GUPPY_VARIETIES_LIST.filter(b => {
    const matchesCat = modalSelectedCat === 'all' || b.cat === modalSelectedCat;
    const qLower = breedSearchQuery.toLowerCase().trim();
    const matchesSearch = !qLower || b.name.toLowerCase().includes(qLower) || String(b.no) === qLower || b.cat.toLowerCase().includes(qLower);
    return matchesCat && matchesSearch;
  });

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
    getHomepageShowcase()
      .then(res => setAdminShowcase(res.data.showcase || { featuredCategories: [], featuredBreeds: [] }))
      .catch(() => {});
    return () => {
      isFetching.current = false;
    };
  }, [loadFeed]);

  useEffect(() => { if (page > 1) loadFeed(page); }, [page, loadFeed]);

  useEffect(() => {
    const handleDataUpdate = () => {
      loadFeed(1, 10);
    };

    const poll = async () => {
      try {
        const { data } = await getLatestTimestamp();
        if (
          data.latestTimestamp &&
          newestTimestamp.current &&
          new Date(data.latestTimestamp) > new Date(newestTimestamp.current)
        ) {
          loadFeed(1, 10);
          setShowNewReels(false);
        }
      } catch {}
    };

    window.addEventListener('focus', handleDataUpdate);
    window.addEventListener('app-data-updated', handleDataUpdate);
    const timer = setInterval(poll, 5_000);

    return () => {
      window.removeEventListener('focus', handleDataUpdate);
      window.removeEventListener('app-data-updated', handleDataUpdate);
      clearInterval(timer);
    };
  }, [loadFeed]);

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

  // ── Data Filtering ─────────────────────────────────────────────────────────────
  // Only promotional / standalone reels (never products)
  const allPetReels = products.filter(p => isReelItem(p));
  // Only pets / products currently listed for sale
  const onSaleReels = products.filter(p => isProductItem(p) && p.isOnSale !== false);

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

        {allPetReels.map((product, i) => (
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

      {/* Admin Featured Categories & Breeds Showcase */}
      {((adminShowcase.featuredCategories || []).length > 0 || (adminShowcase.featuredBreeds || []).length > 0) && (
        <div style={{ marginBottom: 24, background: '#FFFFFF', borderRadius: 16, padding: 14, border: '1px solid #D6E3DE', boxShadow: '0 4px 14px rgba(13, 81, 72, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0D5148', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ✨ FEATURED VENDOR SHOWCASE
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(adminShowcase.featuredCategories || []).map((fc, idx) => (
              <button
                key={`cat-${idx}`}
                onClick={() => navigate(`/search?q=${encodeURIComponent(fc.categoryName)}`)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #0D5148 0%, #163B34 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(13, 81, 72, 0.2)',
                }}
              >
                🏷️ {fc.categoryName} <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({fc.vendorName})</span>
              </button>
            ))}

            {(adminShowcase.featuredBreeds || []).map((fb, idx) => (
              <button
                key={`breed-${idx}`}
                onClick={() => navigate(`/search?q=${encodeURIComponent(fb.breedName)}`)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: '#F0F7F4',
                  color: '#0D5148',
                  border: '1px solid #B8D5CB',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🐾 {fb.breedName} <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({fb.vendorName})</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* 4. AUTHORISED TOP BREEDERS Section (Positioned at the very top) */}
      <div style={{ marginBottom: 30 }}>
        <p className="section-label">AUTHORISED TOP BREEDERS</p>
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

      {/* Modal: all guppy categories & 111 breeds */}
      <Modal isOpen={showAllCategories} title="All 111 Guppy Breeds & Categories" onClose={() => setShowAllCategories(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Tab Toggle: All 111 Breeds vs 12 Categories Grid */}
          <div style={{ display: 'flex', gap: 8, background: '#E8F1ED', padding: 4, borderRadius: 12 }}>
            <button
              onClick={() => setModalViewTab('breeds')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: modalViewTab === 'breeds' ? '#0D5148' : 'transparent',
                color: modalViewTab === 'breeds' ? '#FFFFFF' : '#60736F',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              All 111 Breeds ({filteredBreeds.length})
            </button>
            <button
              onClick={() => setModalViewTab('categories')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: modalViewTab === 'categories' ? '#0D5148' : 'transparent',
                color: modalViewTab === 'categories' ? '#FFFFFF' : '#60736F',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              12 Category Circles
            </button>
          </div>

          {/* Search Input for Breeds */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#60736F" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search 111 Guppy strains (e.g. AFR, Koi, Silverado)..."
              value={breedSearchQuery}
              onChange={(e) => setBreedSearchQuery(e.target.value)}
              style={{ paddingLeft: 36, fontSize: '0.85rem' }}
            />
            {breedSearchQuery && (
              <button
                onClick={() => setBreedSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#60736F', fontWeight: 700 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            <button
              onClick={() => setModalSelectedCat('all')}
              style={{
                whiteSpace: 'nowrap',
                padding: '5px 12px',
                borderRadius: 999,
                border: modalSelectedCat === 'all' ? 'none' : '1px solid #D6E3DE',
                background: modalSelectedCat === 'all' ? '#0D5148' : '#FFFFFF',
                color: modalSelectedCat === 'all' ? '#FFFFFF' : '#60736F',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All (111)
            </button>
            {CATEGORIES.map(c => {
              const count = GUPPY_VARIETIES_LIST.filter(v => v.cat === c.id).length;
              const isSel = modalSelectedCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setModalSelectedCat(c.id); setModalViewTab('breeds'); }}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: isSel ? 'none' : '1px solid #D6E3DE',
                    background: isSel ? '#0D5148' : '#FFFFFF',
                    color: isSel ? '#FFFFFF' : '#60736F',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>

          {/* View Content */}
          {modalViewTab === 'categories' ? (
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
          ) : (
            /* Breeds List (111 items) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredBreeds.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#60736F', padding: 20, fontSize: '0.85rem' }}>No guppy breeds match your search query</p>
              ) : (
                filteredBreeds.map((breed) => {
                  const catObj = CATEGORIES.find(c => c.id === breed.cat);
                  return (
                    <div
                      key={breed.no}
                      onClick={() => {
                        setShowAllCategories(false);
                        navigate(`/search?q=${encodeURIComponent(breed.name)}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#FFFFFF',
                        borderRadius: 14,
                        border: '1px solid #E2ECE8',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D5148'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2ECE8'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: '50%', background: '#E8F1ED',
                          color: '#0D5148', fontWeight: 800, fontSize: '0.72rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          #{breed.no}
                        </span>
                        <div>
                          <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#12332F', margin: 0 }}>{breed.name}</h5>
                          <span style={{ fontSize: '0.72rem', color: '#60736F' }}>Category: {catObj?.name || breed.cat}</span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, color: '#0D5148',
                        background: '#E8F1ED', padding: '4px 10px', borderRadius: 999, flexShrink: 0
                      }}>
                        View Strain →
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
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