import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatMessages, sendMessage } from '../api';
import { ArrowLeft, Send, Phone, User, ShoppingBag, ChevronRight, Image as ImageIcon, Camera, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function ChatRoomPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUnread } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sendingImage, setSendingImage] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await getChatMessages(userId);
        setMessages(data.messages);
        updateUnread();
        
        if (data.messages.length > 0) {
          const firstOther = data.messages.find(m => m.sender._id === userId);
          if (firstOther) setOtherUser(firstOther.sender);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId, updateUnread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    const currentText = content;
    const currentFile = selectedFile;
    const currentPreview = previewUrl;

    setContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const tempMsg = {
      _id: Date.now(),
      sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      content: currentText,
      image: currentPreview || '',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      if (currentFile) {
        setSendingImage(true);
        const formData = new FormData();
        formData.append('receiverId', userId);
        if (currentText) formData.append('content', currentText);
        formData.append('image', currentFile);
        await sendMessage(formData);
      } else {
        await sendMessage({ receiverId: userId, content: currentText });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingImage(false);
    }
  };

  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderContent = (text, isMine = false) => {
    if (!text) return null;
    const linkColor = isMine ? '#F3C34E' : '#0D5148';
    
    // First, handle markdown links [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let parts = text.split(mdLinkRegex);
    
    let result = [];
    for (let i = 0; i < parts.length; i += 3) {
      const plain = parts[i];
      if (plain) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const subParts = plain.split(boldRegex);
        result.push(...subParts.map((sub, j) => (j % 2 === 1 ? <strong key={`${i}-${j}`}>{sub}</strong> : sub)));
      }
      
      if (i + 1 < parts.length) {
        const linkText = parts[i+1];
        const linkUrl = parts[i+2];
        const isInternal = linkUrl.startsWith(window.location.origin) || 
                          linkUrl.startsWith('/') || 
                          linkUrl.includes('/product/') || 
                          linkUrl.includes('/reel/') || 
                          linkUrl.includes('/reels/') || 
                          linkUrl.includes('/feed');
        
        if (isInternal) {
          let path = linkUrl;
          if (linkUrl.startsWith('http')) {
            try {
              const url = new URL(linkUrl);
              path = url.pathname + url.search;
            } catch {
              path = linkUrl;
            }
          }
          
          result.push(
            <span 
              key={`link-${i}`} 
              onClick={() => navigate(path, { state: { from: 'chat' } })}
              style={{ color: linkColor, textDecoration: 'underline', fontWeight: 700, cursor:'pointer' }}
            >
              {linkText}
            </span>
          );
        } else {
          result.push(
            <a key={`link-${i}`} href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'underline', fontWeight: 700 }}>
              {linkText}
            </a>
          );
        }
      }
    }
    
    if (result.length === 1 && typeof result[0] === 'string') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let urlParts = result[0].split(urlRegex);
      return urlParts.map((part, i) => {
        if (urlRegex.test(part)) {
          let path = part;
          const isInternal = part.includes('/product/') || part.includes('/reel/') || part.includes('/reels/') || part.includes('/feed');
          if (isInternal) {
            try {
              const u = new URL(part);
              path = u.pathname + u.search;
            } catch { /* use raw */ }
            return (
              <span key={i} onClick={() => navigate(path, { state: { from: 'chat' } })} style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer', wordBreak: 'break-all', fontWeight: 700 }}>
                {part}
              </span>
            );
          }
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 700 }}>
              {part}
            </a>
          );
        }
        return part;
      });
    }

    return result;
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}><Spinner size={48} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#F3F8F5', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #D6E3DE', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(13,81,72,0.04)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#0D5148', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #0D5148', background: '#E8F1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {otherUser?.avatar ? (
            <img src={getFullSrc(otherUser.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="#0D5148" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#12332F', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {otherUser?.name || 'Seller'} 
            {otherUser?.role === 'admin' && <span style={{ fontSize: '0.62rem', background: '#0D5148', color: '#FFFFFF', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Admin Support</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>● Active Now</span>
            {otherUser?.contactNumber && (
              <span style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 500 }}>• {otherUser.contactNumber}</span>
            )}
          </div>
        </div>
        {otherUser?.contactNumber && (
          <a href={`tel:${otherUser.contactNumber}`} style={{ background: '#E8F1ED', border: '1px solid #D6E3DE', borderRadius: 10, padding: 8, color: '#0D5148', display: 'flex' }}>
            <Phone size={18} />
          </a>
        )}
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: '#F3F8F5' }}
      >
        {messages.map((m) => {
          const isMine = m.sender._id.toString() === currentUser._id.toString();

          // Extract product info if present either from populated object or content text
          let prodInfo = null;
          if (m.product && typeof m.product === 'object' && m.product._id) {
            prodInfo = {
              id: m.product._id,
              name: m.product.name || 'Pet Listing',
              price: m.product.price,
            };
          } else if (m.content) {
            const matchName = m.content.match(/Product:\s*(.+)/);
            const matchUrl = m.content.match(/View product:\s*(https?:\/\/[^\s]+|\/product\/[^\s]+)/);
            if (matchName || matchUrl) {
              let id = typeof m.product === 'string' ? m.product : '';
              if (!id && matchUrl) {
                const parts = matchUrl[1].split('/product/');
                if (parts[1]) id = parts[1].trim();
              }
              prodInfo = {
                id: id || '',
                name: matchName ? matchName[1].trim() : 'Pet Listing',
              };
            }
          }

          const isPurchaseMsg = m.content && (m.content.includes('PURCHASE_REQUEST') || m.content.includes('PAYMENT_VERIFIED') || m.content.includes('PAYMENT_DECLINED'));

          // Parse Purchase Details if purchase message
          let purchaseDetails = null;
          if (isPurchaseMsg) {
            const orderIdMatch = m.content.match(/Order ID:\s*([^\n]+)/);
            const prodMatch = m.content.match(/Product:\s*([^\n]+)/);
            const priceMatch = m.content.match(/Product Price:\s*([^\n]+)/);
            const shipMatch = m.content.match(/Shipping:\s*([^\n]+)/);
            const totalMatch = m.content.match(/Total:\s*([^\n]+)/);
            const txMatch = m.content.match(/Transaction ID:\s*([^\n]+)|UPI Transaction ID:\s*([^\n]+)/);
            const reasonMatch = m.content.match(/Reason:\s*([^\n]+)/);
            
            const isVerified = m.content.includes('PAYMENT_VERIFIED');
            const isDeclined = m.content.includes('PAYMENT_DECLINED');

            purchaseDetails = {
              orderId: orderIdMatch ? orderIdMatch[1].trim() : '',
              productName: prodMatch ? prodMatch[1].trim() : 'Pet Product',
              productPrice: priceMatch ? priceMatch[1].trim() : '',
              shippingCharge: shipMatch ? shipMatch[1].trim() : '',
              totalAmount: totalMatch ? totalMatch[1].trim() : '',
              transactionId: txMatch ? (txMatch[1] || txMatch[2] || '').trim() : '',
              reason: reasonMatch ? reasonMatch[1].trim() : '',
              status: isVerified ? 'verified' : isDeclined ? 'declined' : 'pending_verification',
            };
          }

          return (
            <div
              key={m._id}
              style={{
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Clickable Product Context Card */}
              {prodInfo && !isPurchaseMsg && (
                <div 
                  onClick={() => {
                    if (prodInfo.id) navigate(`/product/${prodInfo.id}`);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    marginBottom: 6,
                    background: isMine ? 'rgba(13, 81, 72, 0.12)' : '#FFFFFF',
                    border: '1px solid #D6E3DE',
                    color: '#12332F',
                    cursor: prodInfo.id ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'between',
                    gap: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    minWidth: 220,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ fontSize: '1.2rem', padding: '6px 8px', background: '#E8F1ED', borderRadius: 10, flexShrink: 0 }}>
                      🐕
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: '#12332F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prodInfo.name}
                      </p>
                      <p style={{ fontSize: '0.74rem', margin: '2px 0 0', color: '#0D5148', fontWeight: 700 }}>
                        View product →
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#0D5148" />
                </div>
              )}

              {/* Special Interactive Purchase Request / Verification Card */}
              {isPurchaseMsg && purchaseDetails ? (
                <div
                  style={{
                    width: '100%',
                    minWidth: 260,
                    maxWidth: 340,
                    background: '#FFFFFF',
                    border: purchaseDetails.status === 'verified' ? '2px solid #10B981' : purchaseDetails.status === 'declined' ? '2px solid #EF4444' : '2px solid #D97706',
                    borderRadius: 18,
                    padding: 16,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                    color: '#111827',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid #F3F4F6', pb: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                      📦 Purchase Verification
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: purchaseDetails.status === 'verified' ? '#DEF7EC' : purchaseDetails.status === 'declined' ? '#FDE8E8' : '#FEF3C7',
                        color: purchaseDetails.status === 'verified' ? '#03543F' : purchaseDetails.status === 'declined' ? '#9B1C1C' : '#92400E',
                      }}
                    >
                      {purchaseDetails.status === 'verified' ? 'Verified ✓' : purchaseDetails.status === 'declined' ? 'Declined ✗' : 'Pending Verification'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Product</span>
                      <strong style={{ color: '#111827' }}>{purchaseDetails.productName}</strong>
                    </div>
                    {purchaseDetails.productPrice && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Price</span>
                        <span>{purchaseDetails.productPrice}</span>
                      </div>
                    )}
                    {purchaseDetails.shippingCharge && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Shipping</span>
                        <span>{purchaseDetails.shippingCharge}</span>
                      </div>
                    )}
                    {purchaseDetails.totalAmount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E5E7EB', paddingTop: 4, fontWeight: 800, fontSize: '0.95rem' }}>
                        <span>Total Amount</span>
                        <span style={{ color: '#0D5148' }}>{purchaseDetails.totalAmount}</span>
                      </div>
                    )}
                    <div style={{ background: '#F3F4F6', padding: '6px 10px', borderRadius: 8, marginTop: 4, fontSize: '0.8rem', color: '#374151' }}>
                      <strong>Transaction ID:</strong> <code>{purchaseDetails.transactionId}</code>
                    </div>
                    {purchaseDetails.reason && (
                      <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 10px', borderRadius: 8, marginTop: 2, fontSize: '0.78rem' }}>
                        <strong>Reason:</strong> {purchaseDetails.reason}
                      </div>
                    )}
                  </div>

                  {/* Buyer Payment Screenshot Button */}
                  {isMine && purchaseDetails.status === 'pending_verification' && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: '#E8F1ED',
                          color: '#0D5148',
                          border: '1px solid #B8D8CE',
                          borderRadius: 10,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Camera size={15} color="#0D5148" />
                        Attach Payment Screenshot
                      </button>
                    </div>
                  )}

                  {/* Vendor verification buttons if current user is Vendor & status is pending */}
                  {!isMine && purchaseDetails.status === 'pending_verification' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                      <button
                        onClick={async () => {
                          if (!purchaseDetails.orderId) return;
                          try {
                            const { verifyOrderPayment } = await import('../api');
                            await verifyOrderPayment(purchaseDetails.orderId, { action: 'approve' });
                            window.location.reload();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Verification failed');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#0D5148',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Approve Payment
                      </button>
                      <button
                        onClick={async () => {
                          if (!purchaseDetails.orderId) return;
                          const reason = prompt('Reason for declining payment (optional):');
                          if (reason === null) return;
                          try {
                            const { verifyOrderPayment } = await import('../api');
                            await verifyOrderPayment(purchaseDetails.orderId, { action: 'decline', reason });
                            window.location.reload();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Decline failed');
                          }
                        }}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FFFFFF',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          borderRadius: 10,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: isMine ? '#0D5148' : '#FFFFFF',
                    color: isMine ? '#FFFFFF' : '#111111',
                    border: isMine ? 'none' : '1px solid #D6E3DE',
                    fontSize: '0.9rem',
                    lineHeight: 1.45,
                    boxShadow: '0 2px 10px rgba(13, 81, 72, 0.04)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.image && (
                    <div style={{ marginBottom: m.content ? 8 : 0, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', maxWidth: 280 }}>
                      <img
                        src={getFullSrc(m.image)}
                        alt="Payment proof / Attachment"
                        onClick={() => setActiveLightboxImage(getFullSrc(m.image))}
                        style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                      />
                    </div>
                  )}
                  {renderContent(m.content, isMine)}
                  
                  {/* Admin Only Content */}
                  {m.adminOnlyContent && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: isMine ? '1px solid rgba(255,255,255,0.2)' : '1px solid #D6E3DE', fontSize: '0.8rem' }}>
                      {renderContent(m.adminOnlyContent, isMine)}
                    </div>
                  )}
                </div>
              )}

              <span style={{ fontSize: '0.68rem', color: '#60736F', marginTop: 4, fontWeight: 500 }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Image Preview Bar before sending */}
      {previewUrl && (
        <div style={{ padding: '8px 16px', background: '#E8F1ED', borderTop: '1px solid #B8D8CE', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={previewUrl} alt="Preview" style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover', border: '2px solid #0D5148' }} />
            <button
              onClick={handleClearFile}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#0D5148', fontWeight: 700 }}>Payment Screenshot Ready</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#60736F' }}>Tap send button to attach proof to chat</p>
          </div>
        </div>
      )}

      {/* Chat Input Form */}
      <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: '#FFFFFF', borderTop: '1px solid #D6E3DE' }}>
        <form
          onSubmit={handleSend}
          style={{ display: 'flex', gap: 8, background: '#F3F8F5', padding: '6px 6px 6px 12px', borderRadius: 24, border: '1px solid #D6E3DE', alignItems: 'center' }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              color: '#0D5148',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
            title="Attach payment screenshot or image"
          >
            <ImageIcon size={22} color="#0D5148" />
          </button>
          <input
            type="text"
            placeholder={selectedFile ? "Add caption (optional)..." : "Type a message..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#111111',
              fontSize: '0.9rem',
              outline: 'none',
              fontWeight: 500,
            }}
          />
          <button
            type="submit"
            disabled={sendingImage}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: 'none',
              background: '#0D5148',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: sendingImage ? 'not-allowed' : 'pointer',
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            {sendingImage ? <Spinner size={16} color="#FFFFFF" /> : <Send size={17} color="#FFFFFF" />}
          </button>
        </form>
      </div>

      {/* Image Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <button
              onClick={() => setActiveLightboxImage(null)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={24} />
            </button>
          </div>
          <img
            src={activeLightboxImage}
            alt="Full View"
            style={{ maxWidth: '95vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
          />
          <p style={{ color: '#E2E8F0', marginTop: 12, fontSize: '0.85rem', fontWeight: 600 }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
}
