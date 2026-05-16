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

  const containerRef = useRef(null);
  const isRestoring = useRef(false);
  const restorationAttempted = useRef(false);

  const isFetching = useRef(false);

  const loadFeed = useCallback(async (p) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (p > 1) setLoading(true);

    try {
      const { data } = await getFeed(p, 5); // Reverted to 5 per user request
      setProducts(prev => p === 1 ? data.products : [...prev, ...data.products]);
      setHasMore(data.hasMore);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);
  useEffect(() => { if (page > 1) loadFeed(page); }, [page, loadFeed]);

  // ─── Scroll tracking + infinite scroll ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (isRestoring.current) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));

          // Save position with a timestamp for 15-min TTL
          sessionStorage.setItem('feed_pos', JSON.stringify({ i: index, ts: Date.now() }));

          // PWA prompt on 2nd reel
          if (index === 1 && !pwaShown.current && canInstall) {
            setShowPWA(true);
            pwaShown.current = true;
          }

          // Load more when on 2nd reel of current batch or near end
          const isNearEnd = index >= products.length - 2;
          const isBatchTrigger = (index % 5) === 1;

          if ((isBatchTrigger || isNearEnd) && hasMore && !isFetching.current) {
            setPage(p => p + 1);
          }
        }
      });
    }, { threshold: 0.5 });

    const reels = container.querySelectorAll('.reel-wrapper');
    reels.forEach(r => observer.observe(r));
    return () => observer.disconnect();
  }, [products.length, hasMore, loading, canInstall]);

  // ─── Scroll restoration ──────────────────────────────────────────────────────
  useEffect(() => {
    if (products.length === 0 || restorationAttempted.current) return;

    const raw = sessionStorage.getItem('feed_pos');
    if (!raw) {
      restorationAttempted.current = true;
      return;
    }

    let index = 0;
    try {
      const parsed = JSON.parse(raw);
      const FIVE_MIN = 5 * 60 * 1000;
      if (Date.now() - parsed.ts > FIVE_MIN) {
        // Cache expired — start fresh
        sessionStorage.removeItem('feed_pos');
        restorationAttempted.current = true;
        return;
      }
      index = parsed.i;
    } catch {
      // Legacy plain number format or corrupt — discard
      sessionStorage.removeItem('feed_pos');
      restorationAttempted.current = true;
      return;
    }

    if (index === 0) {
      restorationAttempted.current = true;
      return;
    }

    // If we don't have enough products loaded yet, wait for more
    if (index >= products.length) {
      if (hasMore && !isFetching.current) setPage(p => p + 1);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    restorationAttempted.current = true;
    // Block the observer from overwriting feed_pos immediately
    isRestoring.current = true;

    // Use scrollTop directly — scrollIntoView fights with CSS scroll-snap on
    // position:fixed containers and gets overridden, snapping back to index 0.
    const targetScrollTop = index * window.innerHeight;

    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    const tryScroll = () => {
      const c = containerRef.current;
      if (!c) { isRestoring.current = false; return; }

      if (c.scrollHeight >= targetScrollTop + window.innerHeight || attempts >= MAX_ATTEMPTS) {
        c.scrollTop = targetScrollTop;
        // Release the guard after the snap engine has settled
        setTimeout(() => { isRestoring.current = false; }, 500);
      } else {
        attempts++;
        requestAnimationFrame(tryScroll);
      }
    };

    requestAnimationFrame(tryScroll);
  }, [products.length, hasMore]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Spinner size={48} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 16, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🐾</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No Reels Yet</h2>
        <p style={{ color: '#94a3b8', maxWidth: 300 }}>Be the first vendor to upload pet reels and reach thousands of pet lovers!</p>
      </div>
    );
  }

  return (
    <div
      className="reel-container"
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, overflowY: 'scroll', scrollSnapType: 'y mandatory' }}
    >
      {products.map((product, i) => (
        <div
          key={product._id}
          className="reel-wrapper"
          data-index={i}
          style={{ height: '100dvh', scrollSnapAlign: 'start' }}
        >
          <ReelCard product={product} />
        </div>
      ))}

      {loading && (
        <div style={{ padding: 20 }}>
          <Spinner />
        </div>
      )}

      <Modal isOpen={showPWA} onClose={() => setShowPWA(false)} title="Install PetPlace">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            width: 80, height: 80, borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Smartphone size={40} color="#818cf8" />
          </div>
          <h3 style={{
            fontSize: '1.25rem', fontWeight: 800, marginBottom: 12,
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Experience PetPlace App
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: 32, lineHeight: 1.6 }}>
            Install PetPlace on your home screen for a faster, full-screen experience and instant pet reel updates.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn-primary"
              onClick={() => { installApp(); setShowPWA(false); }}
              style={{ width: '100%', padding: 14, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Download size={20} /> Install Now
            </button>
            <button
              onClick={() => setShowPWA(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 8 }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}