import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
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
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [initialProducts, setInitialProducts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

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

  // Load initial products on mount
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

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await searchProducts(query, selectedTags.join(','));
      setResults(data.products || []);
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
  }, [query, selectedTags]);

  const displayProducts = searched ? results : initialProducts;
  const isLoading = searched ? loading : initialLoading;

  return (
    <div style={{ padding:'20px 16px 40px', maxWidth:640, margin:'0 auto' }}>
      {/* Search input */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={18} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#64748b' }} />
        <input className="input-field" placeholder="Search pets, products, breeds..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft:44, borderRadius:16, fontSize:'0.95rem' }} />
      </div>

      {/* Tags */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
        {SPECIAL_TAGS.map(tag => {
          const isActive = selectedTags.includes(tag.toLowerCase());
          let activeStyle = {};
          if (isActive) {
            if (tag === 'On Sale') activeStyle = { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none' };
            if (tag === 'Not For Sale') activeStyle = { background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none' };
            if (tag === 'Near Me') activeStyle = { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none' };
          }
          return (
            <button key={tag} className={`tag-pill ${isActive ? 'active' : ''}`} style={activeStyle} onClick={() => toggleTag(tag.toLowerCase())}>
              {tag}
            </button>
          );
        })}
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
        {TAGS.map(tag => (
          <button key={tag} className={`tag-pill ${selectedTags.includes(tag)?'active':''}`} onClick={() => toggleTag(tag)}>
            {tag}
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
      {/* Location Prompt Modal */}
      <Modal isOpen={showLocPrompt} onClose={() => setShowLocPrompt(false)} title="Set Your Location">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <MapPin size={32} color="#8b5cf6" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Where are you?</h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 24, lineHeight: 1.5 }}>
            To find pets and vendors near you, we need your current location. This helps us show you results within your city.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn-primary" onClick={handleSetLocation} style={{ width: '100%' }}>Use Current Location</button>
            <button onClick={() => setShowLocPrompt(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}>Maybe Later</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
