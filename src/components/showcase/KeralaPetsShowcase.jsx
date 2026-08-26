import React, { useState } from 'react';
import KeralaPetsLogo from '../ui/KeralaPetsLogo';
import Modal from '../ui/Modal';
import { 
  ShoppingBag, Heart, Scissors, Package, Users, Search, SlidersHorizontal, 
  Bell, ChevronLeft, Camera, HeartHandshake, ShieldCheck, Lock, PawPrint, 
  Headphones, Plus, CheckCircle, Share2, MessageCircle, MoreVertical, MapPin, 
  Sparkles, ExternalLink, ArrowRight
} from 'lucide-react';

export default function KeralaPetsShowcase() {
  const [activeMenu, setActiveMenu] = useState('Buy / Sell Pets');
  const [activeCategory, setActiveCategory] = useState('Dogs');
  const [reelLikes, setReelLikes] = useState(1248);
  const [isLiked, setIsLiked] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Dogs');
  const [postPrice, setPostPrice] = useState('');
  const [postLocation, setPostLocation] = useState('Kochi, Kerala');
  const [followedSeller, setFollowedSeller] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home'); // 'home', 'reel', 'categories'

  // Image URLs (High resolution pet photos matching the showcase layout)
  const images = {
    goldenPuppyRun: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80",
    goldenPuppyPortrait: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80",
    persianKitten: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    lovebirds: "https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=600&q=80",
    goldfish: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80",
    rabbit: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80",
    groomingDog: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80",
    puppy2: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80",
    puppy3: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80",
  };

  const menuItems = [
    { title: 'Buy / Sell Pets', icon: ShoppingBag },
    { title: 'Adoption', icon: Heart },
    { title: 'Pet Services', icon: Scissors },
    { title: 'Pet Essentials', icon: Package },
    { title: 'Community', icon: Users },
  ];

  const categories = [
    { name: 'Dogs', count: '125+ Listings', img: images.goldenPuppyPortrait },
    { name: 'Cats', count: '89+ Listings', img: images.persianKitten },
    { name: 'Birds', count: '45+ Listings', img: images.lovebirds },
    { name: 'Fish', count: '30+ Listings', img: images.goldfish },
    { name: 'Small Pets', count: '20+ Listings', img: images.rabbit },
    { name: 'Pet Services', count: '60+ Listings', img: images.groomingDog },
  ];

  const handleLikeToggle = () => {
    if (isLiked) {
      setReelLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setReelLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 10%, #1c150c 0%, #0d0b08 55%, #050403 100%)',
        color: '#e2e8f0',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        paddingBottom: 60,
      }}
    >
      {/* Background Palm Leaf / Ambient Glow Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '700px',
          backgroundImage: 'radial-gradient(circle at 50% -10%, rgba(212, 175, 55, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Container */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 20px', position: 'relative', zIndex: 1 }}>
        
        {/* TOP HEADER & FLOATING MENU SECTION */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            marginBottom: 50,
          }}
        >
          {/* Logo & Header Title */}
          <KeralaPetsLogo size={190} showText={true} layout="vertical" />

          {/* Top Right Floating Glassmorphic Menu Card */}
          <div 
            className="menu-widget-card"
            style={{
              position: 'absolute',
              top: 10,
              right: 0,
              width: 250,
              background: 'rgba(22, 18, 14, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 20,
              padding: '16px 14px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 235, 170, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'all 0.3s ease',
            }}
          >
            {menuItems.map((item, idx) => {
              const IconComp = item.icon;
              const isActive = activeMenu === item.title;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveMenu(item.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                    color: isActive ? '#FFE58F' : '#d1d5db',
                    fontSize: '0.92rem',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                >
                  <IconComp size={18} color="#D4AF37" strokeWidth={1.8} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* THREE MOBILE MOCKUP SCREENS SHOWCASE */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 30,
            justifyContent: 'center',
            alignItems: 'start',
            marginBottom: 60,
          }}
        >
          
          {/* MOCKUP SCREEN 1: HOME DASHBOARD */}
          <div 
            style={{
              width: '100%',
              maxWidth: 360,
              margin: '0 auto',
              background: '#090807',
              borderRadius: 36,
              border: '3px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: 710,
              position: 'relative',
            }}
          >
            {/* Phone Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>9:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.7rem' }}>📶</span>
                <span style={{ fontSize: '0.7rem' }}>📡</span>
                <span style={{ fontSize: '0.7rem' }}>🔋</span>
              </div>
            </div>

            {/* Header Content */}
            <div style={{ padding: '8px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 500 }}>
                  Hey, Pet Lover! 🐾
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: 6, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Bell size={16} color="#D4AF37" />
                </div>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 14 }}>
                What are you<br />looking for today?
              </h2>

              {/* Search Bar */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 14,
                  padding: '8px 14px',
                  marginBottom: 16,
                }}
              >
                <Search size={16} color="#9ca3af" />
                <input 
                  type="text"
                  placeholder="Search pets, services, etc."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '0.8rem',
                    width: '100%',
                  }}
                  readOnly
                />
                <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: 5, borderRadius: 8 }}>
                  <SlidersHorizontal size={14} color="#D4AF37" />
                </div>
              </div>

              {/* Circular Category Avatars Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
                {[
                  { name: 'Dogs', img: images.goldenPuppyPortrait },
                  { name: 'Cats', img: images.persianKitten },
                  { name: 'Birds', img: images.lovebirds },
                  { name: 'Fish', img: images.goldfish },
                  { name: 'Others', isPaw: true },
                ].map((cat, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <div 
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        padding: 2,
                        background: i === 0 ? 'linear-gradient(135deg, #FFE58F, #D4AF37)' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cat.isPaw ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#1c1812', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PawPrint size={20} color="#D4AF37" />
                        </div>
                      ) : (
                        <img 
                          src={cat.img} 
                          alt={cat.name} 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: i === 0 ? '#FFE58F' : '#9ca3af', fontWeight: 500 }}>{cat.name}</span>
                  </div>
                ))}
              </div>

              {/* Trending Reels Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Trending Reels 🔥</span>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', cursor: 'pointer', fontWeight: 600 }}>View all</span>
              </div>

              {/* Reel Cards Horizontal Row */}
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                {[
                  { title: 'Golden Retriever Puppy for Sale', loc: 'Kochi', likes: '1.2K', img: images.goldenPuppyPortrait },
                  { title: 'Persian Kitten Available', loc: 'Calicut', likes: '892', img: images.persianKitten },
                  { title: 'Lovebird Pair', loc: 'Thrissur', likes: '540', img: images.lovebirds },
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveScreen('reel')}
                    style={{
                      minWidth: 125,
                      height: 180,
                      borderRadius: 16,
                      backgroundImage: `url(${item.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: 10,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
                        {item.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#d1d5db' }}>
                        <span>📍{item.loc}</span>
                        <span>❤️ {item.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Phone Bottom Nav Bar */}
            <div 
              style={{
                marginTop: 'auto',
                height: 56,
                background: '#0d0b09',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 10px',
              }}
            >
              <div style={{ color: '#D4AF37', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: '1.2rem' }}>🏠</span>
              </div>
              <div style={{ color: '#6b7280' }}><Search size={20} /></div>
              <div 
                onClick={() => setShowPostModal(true)}
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #FFE58F, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }}
              >
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div style={{ color: '#6b7280' }}><MessageCircle size={20} /></div>
              <div style={{ color: '#6b7280' }}><Users size={20} /></div>
            </div>
          </div>

          {/* MOCKUP SCREEN 2: VERTICAL REELS VIEWER */}
          <div 
            style={{
              width: '100%',
              maxWidth: 360,
              margin: '0 auto',
              background: '#090807',
              borderRadius: 36,
              border: '3px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: 710,
              position: 'relative',
            }}
          >
            {/* Phone Status Bar Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>9:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📶</span><span>📡</span><span>🔋</span>
              </div>
            </div>

            {/* Reels Top Navigation */}
            <div style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                <span>📹 Reels</span>
                <span style={{ fontSize: '0.7rem' }}>▼</span>
              </div>
              <Camera size={20} color="#fff" />
            </div>

            {/* Vertical Video / Image Backdrop */}
            <div 
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${images.goldenPuppyRun})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)',
                }}
              />

              {/* Right Action Icons Column */}
              <div 
                style={{
                  position: 'absolute',
                  right: 14,
                  bottom: 90,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 18,
                  zIndex: 10,
                }}
              >
                <div 
                  onClick={handleLikeToggle}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                    <Heart size={24} color={isLiked ? "#ef4444" : "#fff"} fill={isLiked ? "#ef4444" : "none"} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                    {(reelLikes / 1000).toFixed(1)}K
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                    <MessageCircle size={24} color="#fff" />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>34</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                    <Share2 size={24} color="#fff" />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>89</span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                  <MoreVertical size={24} color="#fff" />
                </div>
              </div>

              {/* Bottom Info Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  left: 16,
                  bottom: 75,
                  right: 70,
                  zIndex: 10,
                }}
              >
                {/* Seller Profile Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div 
                    style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
                      padding: 2, 
                    }}
                  >
                    <img 
                      src={images.goldenPuppyPortrait} 
                      alt="Pawfect Pups" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Pawfect Pups Kochi</span>
                  <button 
                    onClick={() => setFollowedSeller(!followedSeller)}
                    style={{
                      background: followedSeller ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {followedSeller ? 'Following' : 'Follow'}
                  </button>
                </div>

                {/* Caption */}
                <div style={{ fontSize: '0.78rem', color: '#f3f4f6', lineHeight: 1.35, marginBottom: 6 }}>
                  Pure breed Golden Retriever puppy available. DM for more details!
                </div>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#D4AF37', fontWeight: 500 }}>
                  <MapPin size={12} color="#D4AF37" />
                  <span>Kochi, Kerala</span>
                </div>
              </div>
            </div>

            {/* Bottom Nav Bar */}
            <div 
              style={{
                marginTop: 'auto',
                height: 56,
                background: '#0d0b09',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 10px',
                zIndex: 10,
              }}
            >
              <div style={{ color: '#D4AF37' }}>🏠</div>
              <div style={{ color: '#6b7280' }}><Search size={20} /></div>
              <div 
                onClick={() => setShowPostModal(true)}
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #FFE58F, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }}
              >
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div style={{ color: '#6b7280' }}><MessageCircle size={20} /></div>
              <div style={{ color: '#6b7280' }}><Users size={20} /></div>
            </div>
          </div>

          {/* MOCKUP SCREEN 3: CATEGORIES GRID & ADOPTION BANNER */}
          <div 
            style={{
              width: '100%',
              maxWidth: 360,
              margin: '0 auto',
              background: '#090807',
              borderRadius: 36,
              border: '3px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: 710,
              position: 'relative',
            }}
          >
            {/* Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>9:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📶</span><span>📡</span><span>🔋</span>
              </div>
            </div>

            {/* Categories Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px', marginBottom: 12 }}>
              <ChevronLeft size={20} color="#fff" style={{ cursor: 'pointer' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>Categories</h3>
              <div style={{ width: 20 }} />
            </div>

            {/* Categories Grid (2 Columns x 3 Rows) */}
            <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {categories.map((cat, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveCategory(cat.name)}
                  style={{
                    height: 100,
                    borderRadius: 16,
                    backgroundImage: `url(${cat.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeCategory === cat.name ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)',
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.65rem', color: '#d1d5db' }}>{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Adopt Banner Card */}
            <div style={{ padding: '0 16px', marginTop: 'auto', marginBottom: 20 }}>
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(28, 22, 14, 0.9), rgba(15, 12, 10, 0.95))',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: 20,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ maxWidth: '60%', zIndex: 2 }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFE58F', marginBottom: 4 }}>
                    Adopt, Don't Shop
                  </h4>
                  <p style={{ fontSize: '0.68rem', color: '#9ca3af', lineHeight: 1.3, marginBottom: 10 }}>
                    Give them a home, they will give you a lifetime of love.
                  </p>
                  <button 
                    onClick={() => setActiveMenu('Adoption')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#fff',
                      padding: '5px 12px',
                      borderRadius: 10,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Explore Now
                  </button>
                </div>

                <div 
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 14,
                    backgroundImage: `url(${images.goldenPuppyPortrait})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                  }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM FEATURE CARDS ROW (3 CARDS) */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* FEATURE CARD 1: TRUST & SERVICES (LEFT) */}
          <div 
            style={{
              background: 'rgba(18, 14, 11, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 24,
              padding: 24,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              alignItems: 'center',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
            }}
          >
            {[
              { title: 'Verified Sellers', icon: ShieldCheck },
              { title: 'Secure Payments', icon: Lock },
              { title: 'Quality Pets', icon: PawPrint },
              { title: '24/7 Support', icon: Headphones },
            ].map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 8,
                    padding: '12px 8px',
                  }}
                >
                  <div 
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComp size={22} color="#D4AF37" strokeWidth={1.8} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{feat.title}</span>
                </div>
              );
            })}
          </div>

          {/* FEATURE CARD 2: POST YOUR PET (MIDDLE) */}
          <div 
            style={{
              background: 'rgba(18, 14, 11, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 24,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div 
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Plus size={28} color="#D4AF37" strokeWidth={2} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              Post Your Pet
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 18, maxWidth: 220 }}>
              Reach thousands of pet lovers across Kerala.
            </p>

            <button 
              onClick={() => setShowPostModal(true)}
              style={{
                background: 'linear-gradient(135deg, #FFE58F 0%, #D4AF37 50%, #AA7C11 100%)',
                color: '#0f0c08',
                border: 'none',
                padding: '10px 32px',
                borderRadius: 12,
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              Create Post
            </button>
          </div>

          {/* FEATURE CARD 3: FEATURED SELLER PROFILE (RIGHT) */}
          <div 
            style={{
              background: 'rgba(18, 14, 11, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 24,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Seller Info Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
                    padding: 2,
                  }}
                >
                  <img 
                    src={images.goldenPuppyPortrait} 
                    alt="Pawfect Pups" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>Pawfect Pups Kochi</span>
                    <CheckCircle size={14} color="#3b82f6" fill="#3b82f6" />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Verified Seller 🛡️</span>
                </div>
              </div>

              {/* Seller Stats Bar */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '10px 0',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 12,
                  marginBottom: 14,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>128</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Posts</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>2.5K</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Followers</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>150</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Following</div>
                </div>
              </div>

              {/* Follow Button */}
              <button 
                onClick={() => setFollowedSeller(!followedSeller)}
                style={{
                  width: '100%',
                  background: followedSeller ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '8px 0',
                  borderRadius: 12,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 14,
                }}
              >
                {followedSeller ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* 3 Post Thumbnail Gallery */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ height: 60, borderRadius: 10, backgroundImage: `url(${images.goldenPuppyPortrait})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ height: 60, borderRadius: 10, backgroundImage: `url(${images.puppy2})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ height: 60, borderRadius: 10, backgroundImage: `url(${images.puppy3})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
          </div>

        </div>

        {/* BOTTOM FOOTER BAR */}
        <div 
          style={{
            background: 'rgba(18, 14, 11, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: 50,
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#d1d5db', fontWeight: 500 }}>
            <span>🐾</span>
            <span>Connecting Pet Lovers. Building Happy Communities.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#D4AF37', fontWeight: 600 }}>
            <span>🌐</span>
            <span>www.keralapets.com</span>
          </div>
        </div>

      </div>

      {/* CREATE POST MODAL */}
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="Post Your Pet">
        <div style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
            Create a New Pet Listing 🐾
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4, display: 'block' }}>Pet Title</label>
              <input 
                className="input-field"
                placeholder="e.g. Pure breed Golden Retriever puppy"
                value={postTitle}
                onChange={e => setPostTitle(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4, display: 'block' }}>Category</label>
                <select 
                  className="input-field"
                  value={postCategory}
                  onChange={e => setPostCategory(e.target.value)}
                  style={{ background: '#181410', color: '#fff' }}
                >
                  <option value="Dogs">Dogs</option>
                  <option value="Cats">Cats</option>
                  <option value="Birds">Birds</option>
                  <option value="Fish">Fish</option>
                  <option value="Small Pets">Small Pets</option>
                  <option value="Pet Services">Pet Services</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4, display: 'block' }}>Price (₹)</label>
                <input 
                  className="input-field"
                  placeholder="e.g. 15000"
                  value={postPrice}
                  onChange={e => setPostPrice(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4, display: 'block' }}>Location</label>
              <input 
                className="input-field"
                placeholder="e.g. Kochi, Kerala"
                value={postLocation}
                onChange={e => setPostLocation(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                alert('Your pet listing has been published to KeralaPets Marketplace!');
                setShowPostModal(false);
              }}
              style={{
                marginTop: 10,
                background: 'linear-gradient(135deg, #FFE58F, #D4AF37, #AA7C11)',
                color: '#0f0c08',
                border: 'none',
                padding: '12px 0',
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Publish Listing
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
