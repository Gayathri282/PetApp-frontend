import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Send, Zap, Layers, ArrowLeft, ShoppingBag } from 'lucide-react';
import VideoPlayer from '../components/reel/VideoPlayer';
import ShareModal from '../components/ui/ShareModal';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getProduct, toggleLike, submitEnquiry, updateProfile, getAdminUser, sendMessage } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ProductReelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(null);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProduct(id);
        setProduct(data.product);
      } catch { toast.error('Product not found'); navigate(-1); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleLike = async (reelIndex) => {
    setLikeAnimating(reelIndex);
    setTimeout(() => setLikeAnimating(null), 400);
    try {
      const { data } = await toggleLike(product._id, reelIndex);
      setProduct(prev => {
        const updated = { ...prev, likeCount: data.likeCount };
        updated.reels = prev.reels.map((r, i) => i === reelIndex ? { ...r, isLiked: data.liked } : r);
        return updated;
      });
    } catch {}
  };

  const handleShare = () => {
    setShareAnimating(true);
    setTimeout(() => {
      setShowShare(true);
      setShareAnimating(false);
    }, 600);
  };

  const handleEnquiry = async () => {
    if (!user.contactNumber && !tempPhone) {
      toast.error('Please enter your contact number');
      return;
    }
    setSending(true);
    try {
      if (!user.contactNumber) {
        await updateProfile({ contactNumber: tempPhone });
        await refreshUser();
      }

      const { data: enqData } = await submitEnquiry({ productId: product._id, message: 'Interested in this product' });
      
      const { data: adminData } = await getAdminUser();
      const adminId = adminData.admin._id;

      await sendMessage({ 
        receiverId: adminId, 
        content: `🛍️ **NEW INTEREST**\n\n**Product:** ${product.name}\n**Price:** ₹${product.price.toLocaleString()}\n**Vendor:** ${product.vendor?.name} (${product.vendor?.contactNumber || 'N/A'})\n\n**Link:** ${window.location.origin}/product/${product._id}\n\nHi Admin, I'm interested in this product!`,
        productId: product._id,
        enquiryId: enqData.enquiry._id
      });

      navigate(`/chat/${adminId}`);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to start chat'); 
    } finally { 
      setSending(false); 
    }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}><Spinner size={48} /></div>;
  if (!product) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'#000' }}>
      {/* Top bar */}
        {/* Buy Now button moved from top to bottom left contextual area, but we can keep a back button here */}
        <button onClick={() => navigate(-1)} style={{ background:'rgba(0,0,0,0.3)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:10, color:'#fff', cursor:'pointer', display:'flex', pointerEvents:'auto' }}>
          <ArrowLeft size={20} />
        </button>

      {/* Reels */}
      <div className="reel-container" style={{ height:'100dvh', overflowY:'scroll', scrollSnapType:'y mandatory' }}>
        {product.reels.map((reel, i) => (
          <div key={i} className="reel-item" style={{ position:'relative', height:'100dvh', scrollSnapAlign:'start', overflow:'hidden' }}>
            <VideoPlayer src={reel.videoUrl} />
            
            {/* Bottom Gradient Overlay */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents:'none', zIndex:5 }} />

            {/* Actions (Right Side) */}
            <div style={{ position:'absolute', right:16, bottom:120, display:'flex', flexDirection:'column', gap:24, zIndex:20, alignItems:'center' }}>
              <button onClick={() => handleLike(i)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#fff', padding:0 }}>
                <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={likeAnimating === i ? 'animate-icon-tap' : ''}>
                  <Heart size={26} fill={reel.isLiked?'#ef4444':'none'} color={reel.isLiked?'#ef4444':'#fff'} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize:'0.7rem', fontWeight:700, textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>{reel.isLiked ? product.likeCount : (product.likeCount || 0)}</span>
              </button>


              
              <button onClick={handleShare} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#fff', padding:0 }}>
                <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={shareAnimating ? 'animate-send-fly' : ''}>
                  <Send size={24} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize:'0.7rem', fontWeight:700, textShadow:'0 2px 4px rgba(0,0,0,0.5)', opacity: shareAnimating ? 0 : 1 }}>Share</span>
              </button>

              {/* Buy button */}
              {product.isOnSale && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEnquiry(true);
                  }}
                  className="animate-zap-pulse"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#a78bfa',
                    padding: 0
                  }}
                >
                  <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.5))' }}>
                    <Zap size={28} fill="#8b5cf6" strokeWidth={0} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textShadow:'0 2px 4px rgba(0,0,0,0.5)', color: '#fff' }}>BUY</span>
                </button>
              )}
            </div>

            {/* Vendor Info & Product Details (Bottom Left) */}
            <div style={{ position:'absolute', bottom:100, left:16, right:100, zIndex:15 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #818cf8', padding:2, background:'rgba(0,0,0,0.3)' }}>
                  <img 
                    src={product.vendor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendor?.name)}&background=6366f1&color=fff`} 
                    alt="" 
                    style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} 
                  />
                </div>
                <div>
                  <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#fff', textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>@{product.vendor?.name?.replace(/\s+/g,'').toLowerCase()}</h3>
                  <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.8)', fontWeight:500 }}>Verified Vendor</p>
                </div>
              </div>

              <h1 style={{ fontSize:'1.1rem', fontWeight:700, color:'#fff', marginBottom:6, textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>{product.name}</h1>
              <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.7)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginBottom:8 }}>{product.description}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  {product.price > 0 && <span style={{ background:'#8b5cf6', color:'#fff', padding:'4px 12px', borderRadius:10, fontSize:'1rem', fontWeight:800 }}>₹{product.price.toLocaleString()}</span>}
                </div>
            </div>
          </div>
        ))}
      </div>

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} />
      <Modal isOpen={showEnquiry} onClose={() => setShowEnquiry(false)} title="Register Interest">
        <div style={{ padding: 20 }}>
          {!user?.contactNumber ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.7)' }}>To help the admin reach out, please provide your contact number:</p>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                className="input-field"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={handleEnquiry}
                disabled={sending || tempPhone.length < 10}
                style={{ width: '100%' }}
              >
                {sending ? 'Saving...' : 'Confirm & Register'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 20, fontSize: '0.95rem' }}>
                Registering interest for <strong>{product.name}</strong>.
                Admin will contact you at <strong>{user.contactNumber}</strong>.
              </p>
              <button
                className="btn-primary"
                onClick={handleEnquiry}
                disabled={sending}
                style={{ width: '100%' }}
              >
                {sending ? 'Processing...' : 'Confirm Interest'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
