import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Copy, AlertCircle, ExternalLink, ShieldCheck, MessageSquare } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { createOrder, submitOrderPayment } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getVendorUpiId, getVendorUpiName } from '../../utils/vendorPayment';

export default function ProductBuyModal({ product, isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: Summary, 2: UPI Pay & TxInput, 3: Success
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [vendorUpi, setVendorUpi] = useState({ upiId: '', upiName: '' });
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittingTx, setSubmittingTx] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOrder(null);
      setTransactionId('');
      setLoading(false);
      setSubmittingTx(false);
      setSelectedGroupIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const vendor = product.vendor || {};
  const canonicalUpiId = getVendorUpiId(vendor);
  const canonicalUpiName = getVendorUpiName(vendor);

  const effectiveUpiId = vendorUpi.upiId || canonicalUpiId;
  const effectiveUpiName = vendorUpi.upiName || canonicalUpiName;

  const hasVendorUpi = Boolean(effectiveUpiId && effectiveUpiId.trim().length > 0);

  const productPrice = Math.max(0, Number(product.price) || 0);

  const shippingGroups = Array.isArray(product.shippingGroups) && product.shippingGroups.length > 0 ? product.shippingGroups : [];

  const rawShipping = product.shippingChargeKerala;
  const isShippingConfigured = (rawShipping !== undefined && rawShipping !== null && rawShipping !== '' && !isNaN(Number(rawShipping))) || shippingGroups.length > 0;

  const currentShippingCharge = shippingGroups.length > 0
    ? (Number(shippingGroups[selectedGroupIndex]?.charge) || 0)
    : (rawShipping !== undefined && rawShipping !== null && rawShipping !== '' && !isNaN(Number(rawShipping)) ? Math.max(0, Number(rawShipping)) : 0);

  const currentShippingName = shippingGroups.length > 0
    ? shippingGroups[selectedGroupIndex]?.name
    : (currentShippingCharge === 0 ? 'Free Shipping' : 'Flat Kerala Shipping');

  const totalAmount = productPrice + currentShippingCharge;

  const upiDeepLink = (() => {
    if (!effectiveUpiId) return '';
    return `upi://pay?pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent(effectiveUpiName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(order ? `Order ${order._id}` : `Pet ${product.name}`)}`;
  })();

  // Handle Order Initiation (Step 1 -> Step 2)
  const handleInitiateOrder = async () => {
    if (loading) return; // Prevent double request

    if (!user) {
      toast.info('Please log in to purchase');
      navigate('/login');
      return;
    }

    if (!hasVendorUpi) {
      toast.error('The seller has not configured a UPI ID yet. Please contact the seller.');
      return;
    }

    if (!isShippingConfigured) {
      toast.error('Shipping charge is not configured for this product. Please contact the seller.');
      return;
    }

    setLoading(true);

    const payload = {
      productId: product._id,
      selectedShippingCharge: currentShippingCharge,
      selectedShippingName: currentShippingName,
    };

    try {
      // 1. Create order on backend
      const res = await createOrder(payload);
      const createdOrder = res.data.order;
      const returnedVendorUpi = res.data.vendorUpi || { upiId: canonicalUpiId, upiName: canonicalUpiName };

      setOrder(createdOrder);
      setVendorUpi(returnedVendorUpi);

      console.log(`[ORDER CREATE SUCCESS] Order #${createdOrder._id} created for product ${product.name}`);
      setStep(2);
    } catch (err) {
      const status = err.response?.status;
      const responseData = err.response?.data;
      const errorMessage = responseData?.message || responseData?.error || err.message || 'Failed to initiate order';

      console.error(`[ORDER CREATE ERROR] status: ${status || 'N/A'} message: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Transaction ID Submission (Step 2 -> Step 3)
  const handleSubmitTx = async (e) => {
    e.preventDefault();
    if (!order) return;

    const trimmedTx = transactionId.trim();
    if (!trimmedTx || trimmedTx.length < 4) {
      toast.error('Please enter a valid UPI Transaction / UTR ID');
      return;
    }

    setSubmittingTx(true);
    try {
      const res = await submitOrderPayment(order._id, { transactionId: trimmedTx });
      setOrder(res.data.order);
      toast.success('Payment submitted for verification!');
      setStep(3);
    } catch (err) {
      console.error(`[PAYMENT ERROR] Submit Tx ID Failed
code: ${err.code || err.response?.status || 'UNKNOWN'}
message: ${err.message || 'Failed to submit transaction ID'}
backendResponse:`, err.response?.data);

      toast.error(err.response?.data?.message || 'Failed to submit transaction ID');
    } finally {
      setSubmittingTx(false);
    }
  };

  const copyUpiId = () => {
    if (!effectiveUpiId) return;
    navigator.clipboard.writeText(effectiveUpiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChatWithVendor = () => {
    onClose();
    const vendorId = vendor._id || vendor;
    if (vendorId) {
      navigate(`/chat/${vendorId}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Product">
      <div
        style={{
          color: '#111827',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          maxHeight: '85vh',
          overflowY: 'auto',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* STEP 1: ORDER SUMMARY & KERALA SHIPPING */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Product Card Info */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#F9FAFB', padding: 14, borderRadius: 16, border: '1px solid #E5E7EB' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: '#E5E7EB', flexShrink: 0 }}>
                {product.images?.[0] || product.reels?.[0]?.thumbnail ? (
                  <img src={product.images?.[0] || product.reels?.[0]?.thumbnail} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🐾</div>
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{product.name}</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Seller: {vendor.name || 'KeralaPets Vendor'}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#0D5148' }}>₹{productPrice.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* VENDOR MISSING UPI WARNING */}
            {!hasVendorUpi && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 14, borderRadius: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: '#991B1B' }}>Payment Unavailable</h4>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#B91C1C', lineHeight: 1.4 }}>
                    The seller has not configured a UPI ID yet. Please contact the seller to make payment arrangements.
                  </p>
                </div>
              </div>
            )}

            {/* UNCONFIGURED SHIPPING WARNING */}
            {hasVendorUpi && !isShippingConfigured && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 14, borderRadius: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: '#92400E' }}>Payment Unavailable</h4>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#B45309', lineHeight: 1.4 }}>
                    Shipping charge has not been set by the seller. The seller must edit this listing before purchase.
                  </p>
                </div>
              </div>
            )}

            {/* Shipping Selection / Policy Notice */}
            {hasVendorUpi && isShippingConfigured && (
              shippingGroups.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#16A34A" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>Select Delivery Zone / Group:</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {shippingGroups.map((group, idx) => (
                      <label
                        key={idx}
                        onClick={() => setSelectedGroupIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 12,
                          border: selectedGroupIndex === idx ? '2px solid #0D5148' : '1px solid #D1D5DB',
                          background: selectedGroupIndex === idx ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="radio"
                            name="shippingGroup"
                            checked={selectedGroupIndex === idx}
                            onChange={() => setSelectedGroupIndex(idx)}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{group.name}</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: Number(group.charge) === 0 ? '#16A34A' : '#0D5148' }}>
                          {Number(group.charge) === 0 ? 'FREE' : `₹${Number(group.charge).toLocaleString('en-IN')}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <ShieldCheck size={18} color="#16A34A" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>
                      Shipping across Kerala: {currentShippingCharge === 0 ? 'FREE' : `₹${currentShippingCharge.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#15803D', lineHeight: 1.4 }}>
                    {currentShippingCharge === 0 ? 'The seller offers free shipping across Kerala.' : `Flat shipping charge of ₹${currentShippingCharge.toLocaleString('en-IN')} applies across Kerala.`}
                  </p>
                </div>
              )
            )}

            {/* Pricing Breakdown Table */}
            <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4B5563' }}>
                <span>Product price</span>
                <span style={{ fontWeight: 600 }}>₹{productPrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4B5563' }}>
                <span>Shipping ({currentShippingName})</span>
                <span style={{ fontWeight: 600, color: currentShippingCharge === 0 ? '#16A34A' : '#111827' }}>
                  {!isShippingConfigured ? 'Not configured' : (currentShippingCharge === 0 ? 'FREE' : `₹${currentShippingCharge.toLocaleString('en-IN')}`)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#111827', paddingTop: 6, borderTop: '1px dashed #E5E7EB' }}>
                <span>Total Amount</span>
                <span style={{ color: '#0D5148' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 16, padding: 18, textAlign: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#0D5148' }}>Sign in to Purchase</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#115E59', lineHeight: 1.4 }}>
                    Please sign in with Google to purchase this pet and connect with the seller.
                  </p>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: 'linear-gradient(135deg, #0D5148 0%, #177366 100%)',
                    color: '#FFFFFF',
                    padding: '14px 20px',
                    fontSize: '0.975rem',
                    fontWeight: 800,
                    borderRadius: 14,
                    textDecoration: 'none',
                    width: '100%',
                    boxShadow: '0 4px 14px rgba(13, 81, 72, 0.25)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google to Purchase
                </a>
              </div>
            ) : !hasVendorUpi || !isShippingConfigured ? (
              <button
                onClick={handleOpenChatWithVendor}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  padding: '14px 20px',
                  backgroundColor: '#374151',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <MessageSquare size={18} color="#FFFFFF" />
                Contact Seller
              </button>
            ) : (
              <button
                onClick={handleInitiateOrder}
                disabled={loading}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  padding: '14px 20px',
                  backgroundColor: '#0D5148',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(13, 81, 72, 0.3)',
                  WebkitAppearance: 'none',
                  visibility: 'visible',
                  opacity: loading ? 0.7 : 1,
                  zIndex: 10,
                }}
              >
                {loading ? (
                  <Spinner size={22} color="#FFFFFF" />
                ) : (
                  <span style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.01em' }}>
                    Pay ₹{totalAmount.toLocaleString('en-IN')} via UPI
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* STEP 2: UPI QR SCAN & PAYMENT PROOF */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 16, borderRadius: 16, textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', fontWeight: 700 }}>Scan QR & Pay Vendor via UPI</span>
              <h2 style={{ margin: '4px 0', fontSize: '1.8rem', fontWeight: 800, color: '#0D5148' }}>₹{totalAmount.toLocaleString('en-IN')}</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803D' }}>Order #{order?._id?.slice(-8)}</p>
            </div>

            {/* Vendor Details & Copy */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Vendor Name</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{effectiveUpiName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>UPI ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: 6, fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                    {effectiveUpiId || 'Not provided'}
                  </code>
                  {effectiveUpiId && (
                    <button
                      onClick={copyUpiId}
                      style={{ background: '#0D5148', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Copy UPI ID"
                    >
                      <Copy size={14} />
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Vendor UPI QR Code Box */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 18, borderRadius: 16, textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                📷 Scan QR Code with GPay / PhonePe / Paytm:
              </span>
              <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 14, border: '2px solid #0D5148', boxShadow: '0 4px 12px rgba(13, 81, 72, 0.1)', display: 'inline-block' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeepLink)}`}
                  alt={`UPI QR Code for ${effectiveUpiName}`}
                  style={{ width: 190, height: 190, display: 'block' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                💡 <strong>Tip:</strong> Take a screenshot of this QR code to scan it from your gallery in Google Pay or PhonePe.
              </p>
            </div>

            {/* Primary Action: Go to Chat & Upload Payment Screenshot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              <button
                type="button"
                onClick={handleGoToChat}
                disabled={submittingTx}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  padding: '14px 20px',
                  backgroundColor: '#0D5148',
                  color: '#FFFFFF',
                  borderRadius: 14,
                  fontSize: '1rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: submittingTx ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(13, 81, 72, 0.25)',
                }}
              >
                {submittingTx ? (
                  <Spinner size={20} color="#FFFFFF" />
                ) : (
                  <>
                    <MessageSquare size={20} color="#FFFFFF" />
                    <span>Open Seller Chat & Send Payment Proof</span>
                  </>
                )}
              </button>
            </div>

            {/* Optional UTR / Transaction ID Form */}
            <form onSubmit={handleSubmitTx} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                Optional: Enter UPI UTR / Transaction ID if available
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. 4268XXXXXXXX"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="submit"
                  disabled={submittingTx}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: submittingTx ? 'not-allowed' : 'pointer',
                  }}
                >
                  Submit ID
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DEF7EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={36} color="#0E9F6E" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Payment Submitted!</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.5 }}>
              Your purchase request and transaction ID (<code>{order?.transactionId}</code>) have been sent to the vendor in your chat.
            </p>
            <div style={{ background: '#F3F4F6', padding: 14, borderRadius: 14, width: '100%', textAlign: 'left', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#6B7280' }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: '#D97706' }}>Pending Verification</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Total Paid:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button
              onClick={handleOpenChatWithVendor}
              style={{
                width: '100%',
                minHeight: '50px',
                padding: '14px',
                backgroundColor: '#0D5148',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Open Vendor Chat & View Status
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
