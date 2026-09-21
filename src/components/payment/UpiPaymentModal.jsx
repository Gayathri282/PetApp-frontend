import { useState } from 'react';
import { submitOrderPayment } from '../../api';
import { useToast } from '../../context/ToastContext';

const PET_APP_DEEP_LINK_FORMAT = (upiId, upiName, amount, orderId) => {
  const cleanId = encodeURIComponent(upiId);
  const cleanName = encodeURIComponent(upiName || 'Pet App Vendor');
  const cleanNote = encodeURIComponent(`Order_${orderId.slice(-6)}`);
  return `upi://pay?pa=${cleanId}&pn=${cleanName}&am=${amount}&tn=${cleanNote}&cu=INR`;
};

export default function UpiPaymentModal({ order, product, vendor, onClose, onSuccess }) {
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: Pay & Launch Apps, 2: Submit UTR & Receipt
  const [utrNumber, setUtrNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const vendorUpi = vendor?.vendorDetails?.upiDetails || {};
  const upiId = vendorUpi.upiId || 'vendor@upi';
  const upiName = vendorUpi.upiName || vendor?.name || 'Verified Pet Vendor';
  const amount = order?.amount || product?.price || 0;
  const orderId = order?._id || 'temp';

  const upiDeepLink = PET_APP_DEEP_LINK_FORMAT(upiId, upiName, amount, orderId);

  // Dynamic QR Code using Google API or vendor's uploaded QR
  const qrCodeImageUrl = vendorUpi.qrCodeUrl || 
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeepLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      toast.error('Please enter a valid UTR / Transaction Reference ID (at least 6 characters)');
      return;
    }

    setLoading(true);
    try {
      await submitOrderPayment(order._id, {
        utrNumber: utrNumber.trim(),
        paymentScreenshot: screenshotUrl.trim(),
        notes: notes.trim(),
      });
      toast.success('Payment submitted! Vendor will verify and confirm your order.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 28, 24, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div className="card animate-fade-in-up" style={{
        maxWidth: 480,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: '#F0F4F2',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            color: '#2D3748'
          }}
        >
          ✕
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <span style={{
            background: '#0D5148',
            color: '#fff',
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            Step {step} of 2
          </span>
          <span style={{ fontSize: '0.8rem', color: '#60736F' }}>
            {step === 1 ? 'Direct UPI Payment' : 'Confirm Transaction UTR'}
          </span>
        </div>

        {step === 1 ? (
          <div>
            <h2 className="serif-heading" style={{ fontSize: '1.35rem', marginBottom: 4 }}>
              Pay Vendor <span style={{ color: '#0D5148' }}>Directly via UPI</span>
            </h2>
            <p style={{ color: '#60736F', fontSize: '0.82rem', marginBottom: 16 }}>
              Money goes 100% directly to the vendor's bank account with zero platform markup.
            </p>

            {/* Vendor & Product summary */}
            <div style={{
              background: '#F4F8F6',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              border: '1px solid #E1ECE8',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#60736F' }}>Vendor:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0D5148' }}>
                  {vendor?.vendorDetails?.businessName || vendor?.name} ✔️
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#60736F' }}>Product / Pet:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#12332F' }}>
                  {product?.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CDDDD7', paddingTop: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12332F' }}>Total Amount:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0D5148' }}>
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* QR Code section */}
            <div style={{ textAlgin: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                padding: 12,
                background: '#fff',
                borderRadius: 16,
                border: '2px solid #0D5148',
                boxShadow: '0 4px 12px rgba(13,81,72,0.1)',
                marginBottom: 10
              }}>
                <img src={qrCodeImageUrl} alt="UPI QR Code" style={{ width: 170, height: 170, borderRadius: 8, display: 'block' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#60736F' }}>
                Scan QR Code using PhonePe, GPay, Paytm, or BHIM
              </span>
            </div>

            {/* UPI ID Copy Card */}
            <div style={{
              background: '#EBF4F1',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#60736F', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendor UPI ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0D5148', wordBreak: 'break-all' }}>{upiId}</div>
                {upiName && <div style={{ fontSize: '0.75rem', color: '#4A5568' }}>Holder: {upiName}</div>}
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                style={{
                  background: copied ? '#0D5148' : '#12332F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? 'Copied! ✓' : 'Copy UPI'}
              </button>
            </div>

            {/* Pay buttons for Mobile */}
            <div style={{ marginBottom: 20 }}>
              <a
                href={upiDeepLink}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #0D5148 0%, #177366 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(13,81,72,0.3)',
                  marginBottom: 10
                }}
              >
                ⚡ Open Any UPI Payment App
              </a>
            </div>

            {/* Next step button */}
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep(2)}
              style={{ width: '100%', padding: '12px', borderRadius: 12 }}
            >
              I Have Paid → Enter UTR / Transaction ID
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitPayment}>
            <h2 className="serif-heading" style={{ fontSize: '1.35rem', marginBottom: 4 }}>
              Confirm Payment <span style={{ color: '#0D5148' }}>Submission</span>
            </h2>
            <p style={{ color: '#60736F', fontSize: '0.82rem', marginBottom: 16 }}>
              Enter the 12-digit UTR / Reference ID from your UPI app receipt (Google Pay / PhonePe / Paytm / Bank SMS).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
                  UPI Reference / UTR Number *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 326194820194"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  required
                  style={{ letterSpacing: 1, fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.72rem', color: '#718096', marginTop: 4, display: 'block' }}>
                  Find this in your payment app history under "UPI Ref No." or "UTR".
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
                  Payment Screenshot URL (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://... (or leave empty)"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
                  Delivery / Buyer Notes (Optional)
                </label>
                <textarea
                  className="input-field"
                  placeholder="Any delivery details or preferences for the vendor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 2 }}
              >
                {loading ? 'Submitting...' : 'Submit Payment Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
