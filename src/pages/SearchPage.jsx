import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/ui/Spinner';
import { searchProducts } from '../api';

const TAGS = ['dog','cat','bird','fish','reptile','rabbit','accessories','food','toys','grooming','adoption'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await searchProducts(query, selectedTags.join(','));
      setResults(data.products);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query || selectedTags.length) doSearch();
      else { setResults([]); setSearched(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, selectedTags]);

  return (
    <div style={{ padding:'20px 16px 40px', maxWidth:640, margin:'0 auto' }}>
      {/* Search input */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={18} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#64748b' }} />
        <input className="input-field" placeholder="Search pets, products, breeds..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft:44, borderRadius:16, fontSize:'0.95rem' }} />
      </div>

      {/* Tags */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
        {TAGS.map(tag => (
          <button key={tag} className={`tag-pill ${selectedTags.includes(tag)?'active':''}`} onClick={() => toggleTag(tag)}>
            {tag}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? <Spinner /> : (
        <div className="stagger-children" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Array.isArray(results) && results.map(p => <ProductCard key={p._id} product={p} />)}
          {searched && !loading && (!results || results.length === 0) && (
            <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <p>No results found. Try different keywords or tags.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
