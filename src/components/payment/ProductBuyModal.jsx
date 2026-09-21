import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Copy, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { createOrder, submitOrderPayment } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOrder(null);
      setTransactionId('');
      setLoading(false);
      setSubmittingTx(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const vendor = product.vendor || {};
  const vendorDetails = vendor.vendorDetails || {};
  const upiDetails = vendorDetails.upiDetails || {};

  const productPrice = Math.max(0, Number(product.price) || 0);

  // Kerala-wide shipping charge from product
  const rawShipping = product.shippingChargeKerala;
  const isShippingConfigured = rawShipping !== undefined && rawShipping !== null && !isNaN(Number(rawShipping));
  const shippingChargeKerala = isShippingConfigured ? Math.max(0, Number(rawShipping) || 0) : 0;

  const totalAmount = productPrice + shippingChargeKerala;

  // Handle Order Initiation (Step 1 -> Step 2)
  const handleInitiateOrder = async () => {
    if (!user) {
      toast.info('Please log in to purchase');
      navigate('/login');
      return;
    }

    if (!isShippingConfigured) {
      toast.error('Shipping charge across Kerala is not configured by the vendor for this product.');
      return;
    }

    setLoading(true);
    try {
      const res = await createOrder({ productId: product._id });
      setOrder(res.data.order);
      setVendorUpi(res.data.vendorUpi || { upiId: upiDetails.upiId || '', upiName: upiDetails.upiName || vendor.name });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate order');
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
      toast.error(err.response?.data?.message || 'Failed to submit transaction ID');
    } finally {
      setSubmittingTx(false);
    }
  };

  const copyUpiId = () => {
    const idToCopy = vendorUpi.upiId || upiDetails.upiId;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const upiDeepLink = (() => {
    const upiId = vendorUpi.upiId || upiDetails.upiId || '';
    const upiName = vendorUpi.upiName || vendor.name || 'Vendor';
    if (!upiId) return '';
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(order ? `Order ${order._id}` : `Pet ${product.name}`)}`;
  })();

  const handleOpenChatWithVendor = () => {
    onClose();
    const vendorId = vendor._id || vendor;
    if (vendorId) {
      navigate(`/chat/${vendorId}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Product">
      <div style={{ color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
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

            {/* Shipping Policy Notice */}
            <div style={{ background: isShippingConfigured ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${isShippingConfigured ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={18} color={isShippingConfigured ? '#16A34A' : '#D97706'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isShippingConfigured ? '#166534' : '#92400E' }}>
                  Shipping across Kerala: {isShippingConfigured ? (shippingChargeKerala === 0 ? 'FREE' : `₹${shippingChargeKerala.toLocaleString('en-IN')}`) : 'Unconfigured by Vendor'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: isShippingConfigured ? '#15803D' : '#B45309', lineHeight: 1.4 }}>
                {isShippingConfigured
                  ? (shippingChargeKerala === 0 ? 'The seller offers free shipping across Kerala.' : `Flat shipping charge of ₹${shippingChargeKerala.toLocaleString('en-IN')} applies across Kerala.`)
                  : 'The seller has not configured a Kerala shipping charge for this product yet.'
                }
              </p>
            </div>

            {/* Pricing Breakdown Table */}
            <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4B5563' }}>
                <span>Product price</span>
                <span style={{ fontWeight: 600 }}>₹{productPrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4B5563' }}>
                <span>Shipping across Kerala</span>
                <span style={{ fontWeight: 600, color: shippingChargeKerala === 0 ? '#16A34A' : '#111827' }}>
                  {isShippingConfigured ? (shippingChargeKerala === 0 ? 'FREE' : `₹${shippingChargeKerala.toLocaleString('en-IN')}`) : 'Unconfigured'}
                </span>
              </div>
              {isShippingConfigured && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#111827', paddingTop: 6, borderTop: '1px dashed #E5E7EB' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#0D5148' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {isShippingConfigured ? (
              <button
                onClick={handleInitiateOrder}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0D5148',
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
                  boxShadow: '0 4px 14px rgba(13, 81, 72, 0.25)',
                }}
              >
                {loading ? <Spinner size={20} /> : <>Proceed to Payment <ArrowRight size={18} /></>}
              </button>
            ) : (
              <button
                onClick={handleOpenChatWithVendor}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                Ask Vendor to Configure Shipping in Chat
              </button>
            )}
          </div>
        )}

        {/* STEP 2: UPI PAYMENT & TRANSACTION ID ENTRY */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 16, borderRadius: 16, textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', tracking: '0.05em', color: '#166534', fontWeight: 700 }}>Pay Vendor via UPI</span>
              <h2 style={{ margin: '4px 0', fontSize: '1.8rem', fontWeight: 800, color: '#0D5148' }}>₹{totalAmount.toLocaleString('en-IN')}</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803D' }}>Order #{order?._id?.slice(-8)}</p>
            </div>

            {/* Vendor Details & Copy */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Vendor Name</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{vendorUpi.upiName || vendor.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>UPI ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: 6, fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                    {vendorUpi.upiId || 'Not provided'}
                  </code>
                  {vendorUpi.upiId && (
                    <button
                      onClick={copyUpiId}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0D5148', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Copy UPI ID"
                    >
                      <Copy size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Open UPI App Button */}
            {upiDeepLink && (
              <a
                href={upiDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0D5148',
                  color: '#FFFFFF',
                  borderRadius: 14,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(13, 81, 72, 0.2)',
                }}
              >
                <ExternalLink size={18} />
                Pay via UPI App
              </a>
            )}

            {/* Mandatory UTR / Transaction ID Form */}
            <form onSubmit={handleSubmitTx} style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Enter UPI Transaction / UTR ID <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4268XXXXXXXX (12 digits)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4, display: 'block' }}>
                  Required for vendor verification. Found in your Google Pay, PhonePe, or Paytm receipt.
                </span>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 12, borderRadius: 12, fontSize: '0.8rem', color: '#92400E', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>Payment will remain <strong>PENDING VERIFICATION</strong> until confirmed by vendor.</span>
              </div>

              <button
                type="submit"
                disabled={submittingTx}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submittingTx ? <Spinner size={18} /> : 'Submit Payment for Verification'}
              </button>
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
            <div style={{ background: '#F3F4F6', padding: 14, borderRadius: 14, width: '100%', textStyle: 'left', fontSize: '0.85rem' }}>
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
