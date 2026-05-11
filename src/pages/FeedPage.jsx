import { useState, useEffect, useCallback, useRef } from 'react';
import ReelCard from '../components/reel/ReelCard';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { getFeed } from '../api';
import { Smartphone } from 'lucide-react';

export default function FeedPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showPWA, setShowPWA] = useState(false);
  const pwaShown = useRef(false);

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

  // Handle scroll tracking for 2nd reel & infinite scroll
  useEffect(() => {
    const container = document.querySelector('.reel-container');
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));
          // Trigger PWA prompt on 2nd reel (index 1)
          if (index === 1 && !pwaShown.current) {
            setShowPWA(true);
            pwaShown.current = true;
          }
          // Load more if near end
          if (index >= products.length - 2 && hasMore && !loading) {
            setPage(p => p + 1);
          }
        }
      });
    }, { threshold: 0.5 });

    const reels = container.querySelectorAll('.reel-wrapper');
    reels.forEach(r => observer.observe(r));

    return () => observer.disconnect();
  }, [products.length, hasMore, loading]);

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
    <div className="reel-container" style={{ position:'fixed', inset:0, overflowY:'scroll', scrollSnapType:'y mandatory' }}>
      {products.map((product, i) => (
        <div key={product._id} className="reel-wrapper" data-index={i} style={{ height:'100dvh', scrollSnapAlign:'start' }}>
          <ReelCard product={product} />
        </div>
      ))}
      {loading && <div style={{ padding:20 }}><Spinner /></div>}

      <Modal isOpen={showPWA} onClose={() => setShowPWA(false)} title="Install PetPlace">
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ background:'rgba(99,102,241,0.1)', width:64, height:64, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Smartphone size={32} color="#818cf8" />
          </div>
          <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:10 }}>Add to Home Screen</h3>
          <p style={{ fontSize:'0.9rem', color:'#94a3b8', marginBottom:24, lineHeight:1.5 }}>
            Get a full-screen experience and stay updated with the latest pet reels by adding PetPlace to your home screen.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:'0.75rem', color:'#64748b' }}>
              Tap the <span style={{ color:'#fff', fontWeight:600 }}>Share</span> icon in your browser and select <span style={{ color:'#fff', fontWeight:600 }}>'Add to Home Screen'</span>.
            </p>
            <button className="btn-primary" onClick={() => setShowPWA(false)} style={{ width:'100%', marginTop:10 }}>Got it!</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
