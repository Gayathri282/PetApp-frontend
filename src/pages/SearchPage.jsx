import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ReelsViewer from '../components/reel/ReelsViewer';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchProducts, getFeed } from '../api';

const TAGS = ['dog', 'cat', 'bird', 'fish', 'other', 'grooming', 'adoption', 'accessories', 'food', 'toys'];
const SPECIAL_TAGS = ['On Sale', 'Not For Sale', 'Near Me'];

const CATEGORY_MAP = {
  dogs: 'dog',
  dog: 'dog',
  cats: 'cat',
  cat: 'cat',
  birds: 'bird',
  bird: 'bird',
  fish: 'fish',
  others: 'other',
  other: 'other',
  services: 'services',
  accessories: 'other',
  rabbit: 'other',
};

export default function SearchPage() {
  const location = useLocation();
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reelsViewerState, setReelsViewerState] = useState({
    isOpen: false,
    initialVideoId: null,
    videos: [],
  });

  const handleOpenReels = (clickedItem, list = []) => {
    if (!clickedItem) return;
    const targetId = clickedItem._id || clickedItem.id;
    setReelsViewerState({
      isOpen: true,
      initialVideoId: targetId,
      videos: list && list.length > 0 ? list : [clickedItem],
    });
  };
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState(['on sale']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [initialProducts, setInitialProducts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [priceMax, setPriceMax] = useState(50000);
  const [sortBy, setSortBy] = useState('newest');

  const { user, refreshUser } = useAuth();
  const [showLocPrompt, setShowLocPrompt] = useState(false);
  const toast = useToast();

  // Listen to URL search params (e.g. /search?category=dog or /search)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawCat = params.get('category') || params.get('tag');
    if (rawCat) {
      const normalized = rawCat.toLowerCase();
      const mappedTag = CATEGORY_MAP[normalized] || normalized;
      setSelectedTags([mappedTag]);
    } else {
      setSelectedTags(['on sale']);
    }
  }, [location.search]);

  const toggleTag = (tag) => {
    if (tag === 'near me' && (!user?.location?.coordinates || (user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0))) {
      setShowLocPrompt(true);
      return;
    }
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { updateProfile } = await import('../api');
        await updateProfile({ location: JSON.stringify({ type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] }) });
        await refreshUser();
        toast.success('Location set! Now you can find nearby pets.');
        setShowLocPrompt(false);
        setSelectedTags(prev => [...prev, 'near me']);
      } catch (err) {
        toast.error('Failed to save location');
      }
    }, () => {
      toast.error('Location permission denied');
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getFeed(1, 20);
        setInitialProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load initial products:', err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() && selectedTags.length === 0) {
        setSearched(false);
        setResults([]);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const isNearMe = selectedTags.includes('near me');
        const cleanTags = selectedTags.filter(t => t !== 'near me');
        const { data } = await searchProducts(query, cleanTags, isNearMe);
        setResults(data.products || []);
      } catch (e) {
        console.error(e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedTags]);

  const rawList = searched ? results : initialProducts;

  const displayProducts = rawList
    .filter(p => p.price <= priceMax)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const isLoading = searched ? loading : initialLoading;

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 680, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p className="section-label">EXPLORE & SEARCH</p>
        <h1 className="serif-heading" style={{ fontSize: '1.65rem' }}>
          Browse Marketplace
        </h1>
      </div>

      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#0D5148' }} />
          <input
            className="input-field"
            placeholder="Search pets, breeds, products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 46 }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#60736F', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilterModal(true)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #D6E3DE',
            borderRadius: 14,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0D5148',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(13,81,72,0.04)',
          }}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Special Filter Tags */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {SPECIAL_TAGS.map(tag => {
          const isActive = selectedTags.includes(tag.toLowerCase());
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag.toLowerCase())}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                border: isActive ? 'none' : '1px solid #D6E3DE',
                background: isActive ? '#0D5148' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#60736F',
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Category Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 20, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {TAGS.map(tag => {
          const isActive = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 600,
                border: isActive ? 'none' : '1px solid #D6E3DE',
                background: isActive ? '#E8F1ED' : '#FFFFFF',
                color: isActive ? '#0D5148' : '#60736F',
                cursor: 'pointer',
              }}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {/* Product Results */}
      {isLoading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {Array.isArray(displayProducts) && displayProducts.map(p => (
            <ProductCard
              key={p._id}
              product={p}
              activeVideoId={activeVideoId}
              setActiveVideoId={setActiveVideoId}
              onVideoClick={(item) => handleOpenReels(item, displayProducts)}
            />
          ))}
          {!isLoading && displayProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#60736F', gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#12332F', marginBottom: 4 }}>No listings found</p>
              <p style={{ fontSize: '0.84rem' }}>Try adjusting your search terms or filter tags.</p>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter & Sort">
        <div style={{ padding: '8px 4px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12332F', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Max Price</span>
              <span>₹{priceMax >= 50000 ? 'Any' : priceMax.toLocaleString('en-IN')}</span>
            </label>
            <input 
              type="range" 
              min="500" 
              max="50000" 
              step="500" 
              value={priceMax} 
              onChange={e => setPriceMax(Number(e.target.value))} 
              style={{ width: '100%', accentColor: '#0D5148' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12332F', display: 'block', marginBottom: 10 }}>Sort By</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'newest', label: 'Newest First' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    textAlign: 'left',
                    background: sortBy === opt.id ? '#E8F1ED' : '#F3F8F5',
                    border: sortBy === opt.id ? '1px solid #0D5148' : '1px solid #D6E3DE',
                    color: sortBy === opt.id ? '#0D5148' : '#60736F',
                    fontWeight: sortBy === opt.id ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowFilterModal(false)}
            className="btn-primary"
            style={{ width: '100%', marginTop: 8 }}
          >
            Apply Filters
          </button>
        </div>
      </Modal>

      {/* Location Prompt Modal */}
      {showLocPrompt && (
        <Modal title="Set Your Location" onClose={() => setShowLocPrompt(false)}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <MapPin size={40} color="#0D5148" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.1rem', color: '#12332F', fontWeight: 700, marginBottom: 8 }}>
              Find Nearby Pets & Sellers
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#60736F', marginBottom: 20 }}>
              Allow location access to sort listings by distance near your city.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLocPrompt(false)} className="btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleSetLocation} className="btn-primary" style={{ flex: 1 }}>
                Enable Location
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reels Viewer Modal */}
      <ReelsViewer
        isOpen={reelsViewerState.isOpen}
        videos={reelsViewerState.videos}
        initialVideoId={reelsViewerState.initialVideoId}
        onClose={() => setReelsViewerState({ isOpen: false, initialVideoId: null, videos: [] })}
      />
    </div>
  );
}
