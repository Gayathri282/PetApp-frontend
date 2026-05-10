import { useState, useEffect, useCallback } from 'react';
import ReelCard from '../components/reel/ReelCard';
import Spinner from '../components/ui/Spinner';
import { getFeed } from '../api';

export default function FeedPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async (p) => {
    try {
      const { data } = await getFeed(p, 5);
      setProducts(prev => p === 1 ? data.products : [...prev, ...data.products]);
      setHasMore(data.hasMore);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);

  useEffect(() => {
    if (page > 1) loadFeed(page);
  }, [page, loadFeed]);

  // Infinite scroll
  useEffect(() => {
    const container = document.querySelector('.reel-container');
    if (!container) return;
    const handleScroll = () => {
      if (!hasMore || loading) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < clientHeight) {
        setPage(p => p + 1);
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  if (loading && products.length === 0) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}><Spinner size={48} /></div>;
  }

  if (products.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70vh', gap:16, padding:40, textAlign:'center' }}>
        <div style={{ fontSize:64 }}>🐾</div>
        <h2 style={{ fontSize:'1.3rem', fontWeight:700 }}>No Reels Yet</h2>
        <p style={{ color:'#94a3b8', maxWidth:300 }}>Be the first vendor to upload pet reels and reach thousands of pet lovers!</p>
      </div>
    );
  }

  return (
    <div className="reel-container" style={{ position:'fixed', inset:0 }}>
      {products.map(product => (
        <ReelCard key={product._id} product={product} />
      ))}
      {loading && <div style={{ padding:20 }}><Spinner /></div>}
    </div>
  );
}
