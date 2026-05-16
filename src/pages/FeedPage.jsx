import { useState, useEffect, useCallback, useRef } from 'react';
import ReelCard from '../components/reel/ReelCard';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { getFeed } from '../api';
import { Smartphone, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FeedPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showPWA, setShowPWA] = useState(false);
  const pwaShown = useRef(false);
  const { canInstall, installApp } = useAuth();

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

  const isRestoring = useRef(false);

  // Handle scroll tracking for 2nd reel & infinite scroll
  useEffect(() => {
    const container = document.querySelector('.reel-container');
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (isRestoring.current) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));
          
          // Save scroll position
          sessionStorage.setItem('feed_pos', index);

          // Trigger PWA prompt on 2nd reel (index 1) if installable
          if (index === 1 && !pwaShown.current && canInstall) {
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
  }, [products.length, hasMore, loading, canInstall]);

  const restorationAttempted = useRef(false);

  // Restore scroll position
  useEffect(() => {
    if (products.length > 0 && !restorationAttempted.current) {
      const savedIndex = sessionStorage.getItem('feed_pos');
      if (savedIndex) {
        const index = parseInt(savedIndex);
        const container = document.querySelector('.reel-container');
        if (container) {
          const reels = container.querySelectorAll('.reel-wrapper');
          if (reels[index]) {
            restorationAttempted.current = true;
            isRestoring.current = true;
            reels[index].scrollIntoView();
            setTimeout(() => { isRestoring.current = false; }, 500);
          }
        }
      } else {
        restorationAttempted.current = true;
      }
    }
  }, [products.length]);

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
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', width:80, height:80, borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', border:'1px solid rgba(255,255,255,0.05)' }}>
            <Smartphone size={40} color="#818cf8" />
          </div>
          <h3 style={{ fontSize:'1.25rem', fontWeight:800, marginBottom:12, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Experience PetPlace App</h3>
          <p style={{ fontSize:'0.95rem', color:'#94a3b8', marginBottom:32, lineHeight:1.6 }}>
            Install PetPlace on your home screen for a faster, full-screen experience and instant pet reel updates.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <button 
              className="btn-primary" 
              onClick={() => {
                installApp();
                setShowPWA(false);
              }} 
              style={{ width:'100%', padding:'14px', fontSize:'1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}
            >
              <Download size={20} /> Install Now
            </button>
            <button 
              onClick={() => setShowPWA(false)} 
              style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', padding:'8px' }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
