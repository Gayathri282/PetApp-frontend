import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Send, Zap, Layers, User, ShoppingBag } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import ShareModal from '../ui/ShareModal';
import Modal from '../ui/Modal';
import { toggleLike, submitEnquiry, updateProfile, getAdminUser, sendMessage } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function ReelCard({ product, onLikeUpdate }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [liked, setLiked] = useState(product.isLiked || false);
  const [likeCount, setLikeCount] = useState(product.likeCount || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  const reel = product.primaryReel || product.reels?.[0];
  if (!reel) return null;

  const handleLike = async (e) => {
    e.stopPropagation();
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const { data } = await toggleLike(product._id, 0);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      if (onLikeUpdate) onLikeUpdate(product._id, data);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
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
      
      // Get admin to start chat
      const { data: adminData } = await getAdminUser();
      const adminId = adminData.admin._id;
      
      // Send initial message
      await sendMessage({ 
        receiverId: adminId, 
        content: `🛍️ **NEW INTEREST**\n\n**Product:** ${product.name}\n**Price:** ₹${product.price.toLocaleString()}\n**Vendor:** ${product.vendor?.name} (${product.vendor?.contactNumber || 'N/A'})\n\n**Link:** ${window.location.origin}/product/${product._id}\n\nHi Admin, I'm interested in this product!`,
        productId: product._id,
        enquiryId: enqData.enquiry._id
      });

      // Navigate to chat
      navigate(`/chat/${adminId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start chat');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="reel-item" style={{ position: 'relative', height: '100dvh', scrollSnapAlign: 'start', overflow: 'hidden' }}>
      <VideoPlayer src={reel.videoUrl} />

      {/* Bottom Gradient Overlay */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents:'none', zIndex:5 }} />

      {/* Right action bar */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          zIndex: 20,
        }}
      >
        {/* Like */}
        <button
          onClick={handleLike}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            padding: 0
          }}
        >
          <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={likeAnimating ? 'animate-icon-tap' : ''}>
            <Heart
              size={26}
              fill={liked ? '#ef4444' : 'none'}
              color={liked ? '#ef4444' : '#fff'}
              strokeWidth={2.2}
            />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>
            {likeCount}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            padding: 0
          }}
        >
          <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={shareAnimating ? 'animate-send-fly' : ''}>
            <Send size={24} strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow:'0 2px 4px rgba(0,0,0,0.5)', opacity: shareAnimating ? 0 : 1 }}>Share</span>
        </button>

        {/* More/Reels (if multiple) */}
        {product.hasMultipleReels && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product._id}`);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              padding: 0
            }}
          >
            <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
              <Layers size={24} strokeWidth={2.2} />
            </div>
          </button>
        )}

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

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/product/${product._id}`}
        title="Share Reel"
      />

      {/* Enquiry Modal */}
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
