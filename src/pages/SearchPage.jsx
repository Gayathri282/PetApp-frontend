import { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchProducts, getFeed } from '../api';

const TAGS = ['dog','cat','bird','fish','grooming','adoption','accessories','food','toys'];
const SPECIAL_TAGS = ['On Sale', 'Not For Sale', 'Near Me'];

export default function SearchPage() {
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
        setInitialLoading(false);
      } catch (err) {
        console.error('Failed to load initial products:', err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await searchProducts(query, selectedTags.join(','));
      let productsList = data.products || [];
      if (priceMax && priceMax < 50000) {
        productsList = productsList.filter(p => !p.price || p.price <= priceMax);
      }
      if (sortBy === 'price_asc') {
        productsList.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === 'price_desc') {
        productsList.sort((a, b) => (b.price || 0) - (a.price || 0));
      }
      setResults(productsList);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query || selectedTags.length) doSearch();
      else { setResults([]); setSearched(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, selectedTags, priceMax, sortBy]);

  const displayProducts = searched ? results : initialProducts;
  const isLoading = searched ? loading : initialLoading;

  return (
    <div style={{ padding:'20px 16px 40px', maxWidth:680, margin:'0 auto', paddingBottom: 90 }}>
      {/* Search Input Bar with Filter Button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position:'relative', flex: 1 }}>
          <Search size={18} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#D4AF37' }} />
          <input 
            className="input-field" 
            placeholder="Search pets, products, breeds..." 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            style={{ 
              paddingLeft:44, 
              borderRadius:16, 
              fontSize:'0.92rem',
              background: 'rgba(15, 29, 20, 0.75)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              color: '#F5F5EC',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
              height: 48,
            }} 
          />
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'rgba(15, 29, 20, 0.75)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFE58F',
            flexShrink: 0,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
          }}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Horizontal Scrollable Filter Chips */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:14, scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
        {SPECIAL_TAGS.map(tag => {
          const isActive = selectedTags.includes(tag.toLowerCase());
          let activeStyle = {};
          if (isActive) {
            if (tag === 'On Sale') activeStyle = { background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(16, 185, 129, 0.3))', color: '#FFE58F', border: '1px solid rgba(212, 175, 55, 0.6)', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)' };
            if (tag === 'Not For Sale') activeStyle = { background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.3))', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.5)' };
            if (tag === 'Near Me') activeStyle = { background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(170, 124, 17, 0.3))', color: '#FFE58F', border: '1px solid rgba(212, 175, 55, 0.6)' };
          }
          return (
            <button key={tag} className={`tag-pill ${isActive ? 'active' : ''}`} style={{ whiteSpace: 'nowrap', ...activeStyle }} onClick={() => toggleTag(tag.toLowerCase())}>
              {tag}
            </button>
          );
        })}
      </div>

      {/* Horizontal Scrollable Category Chips */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:20, scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
        {TAGS.map(tag => (
          <button key={tag} className={`tag-pill ${selectedTags.includes(tag)?'active':''}`} style={{ whiteSpace: 'nowrap' }} onClick={() => toggleTag(tag)}>
            #{tag}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? <Spinner /> : (
        <div className="stagger-children" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Array.isArray(displayProducts) && displayProducts.map(p => <ProductCard key={p._id} product={p} />)}
          {!isLoading && displayProducts.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{searched ? '🔍' : '🐾'}</div>
              <p>{searched ? 'No results found. Try different keywords or tags.' : 'No products available yet.'}</p>
            </div>
          )}
        </div>
      )}
      {/* Mobile Bottom Sheet Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter & Sort">
        <div style={{ padding: '8px 4px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Price Range Filter */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFE58F', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
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
              style={{ width: '100%', accentColor: '#D4AF37' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#A3B8A8', marginTop: 4 }}>
              <span>₹500</span>
              <span>₹25,000</span>
              <span>₹50,000+</span>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFE58F', display: 'block', marginBottom: 10 }}>Sort By</label>
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
                    background: sortBy === opt.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: sortBy === opt.id ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                    color: sortBy === opt.id ? '#FFE58F' : '#F5F5EC',
                    fontSize: '0.88rem',
                    fontWeight: sortBy === opt.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button 
              onClick={() => { setPriceMax(50000); setSortBy('newest'); }}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#A3B8A8',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
            <button 
              className="btn-primary" 
              onClick={() => { setShowFilterModal(false); doSearch(); }} 
              style={{ flex: 2, padding: 14 }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
