import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVendorOrders, verifyOrderPayment } from '../../api';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';

export default function VendorOrdersTab() {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'verified' | 'declined' | 'all'
  const [processingId, setProcessingId] = useState(null);
  
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineTargetOrder, setDeclineTargetOrder] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getVendorOrders();
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch vendor orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (orderId) => {
    setProcessingId(orderId);
    try {
      await verifyOrderPayment(orderId, { action: 'approve' });
      toast.success('Payment verified successfully!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setProcessingId(null);
    }
  };

  const openDeclineModal = (order) => {
    setDeclineTargetOrder(order);
    setDeclineReason('');
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async (e) => {
    e.preventDefault();
    if (!declineTargetOrder) return;
    setProcessingId(declineTargetOrder._id);
    try {
      await verifyOrderPayment(declineTargetOrder._id, {
        action: 'decline',
        reason: declineReason || 'Payment could not be verified by vendor.',
      });
      toast.success('Payment verification declined.');
      setDeclineModalOpen(false);
      setDeclineTargetOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline payment');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const status = ord.paymentStatus || ord.status;
    if (filter === 'pending') return status === 'pending_verification' || status === 'payment_submitted' || status === 'pending_payment';
    if (filter === 'verified') return status === 'verified' || status === 'confirmed';
    if (filter === 'declined') return status === 'declined' || status === 'rejected';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Verified ✓</span>;
      case 'declined':
      case 'rejected':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> Declined ✗</span>;
      default:
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Pending Verification</span>;
    }
  };

  if (loading) {
    return <div style={{ padding: 30, textAlign: 'center' }}><Spinner size={28} /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#12332F', fontWeight: 800 }}>Vendor Purchase Management</h3>
        <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', border: '1px solid #D6E3DE', borderRadius: 12, padding: 4 }}>
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'verified', label: 'Verified' },
          { key: 'declined', label: 'Declined' },
          { key: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === f.key ? '#0D5148' : 'transparent',
              color: filter === f.key ? '#FFFFFF' : '#60736F',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: '#60736F' }}>
          No purchase requests in this section.
        </div>
      ) : (
        filteredOrders.map((ord) => {
          const buyerObj = ord.buyer || {};
          const buyerName = buyerObj.name || 'Buyer';
          const productName = ord.productSnapshot?.name || ord.product?.name || 'Product';
          const productPrice = ord.productPrice ?? ord.amount ?? 0;
          const shippingCharge = ord.shippingCharge ?? 0;
          const totalAmount = ord.totalAmount ?? ord.amount ?? 0;
          const txId = ord.transactionId || ord.paymentDetails?.utrNumber || 'N/A';
          const paymentStatus = ord.paymentStatus || ord.status;
          const isPending = paymentStatus === 'pending_verification' || paymentStatus === 'payment_submitted' || paymentStatus === 'pending_payment';

          return (
            <div key={ord._id} className="card" style={{ padding: 16, border: '1px solid #D6E3DE', borderRadius: 16, background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#60736F', display: 'block' }}>
                    Order #{ord._id.slice(-6).toUpperCase()} • {new Date(ord.createdAt).toLocaleString()}
                  </span>
                  <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 800, color: '#12332F' }}>
                    {productName}
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: '#0D5148', fontWeight: 600 }}>
                    Buyer: {buyerName} ({buyerObj.email || 'N/A'})
                  </span>
                </div>
                <div>{getStatusBadge(paymentStatus)}</div>
              </div>

              {/* Price & Tx Details */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#4B5563' }}>
                  <span>Product price: ₹{productPrice.toLocaleString('en-IN')}</span>
                  <span>Shipping: {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#111827', borderTop: '1px dashed #E5E7EB', paddingTop: 6 }}>
                  <span>Total Amount Received</span>
                  <span style={{ color: '#0D5148' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#111827', marginTop: 2, background: '#E5E7EB', padding: '6px 10px', borderRadius: 8, fontWeight: 700 }}>
                  UPI / UTR Transaction ID: <code>{txId}</code>
                </div>
                {ord.declineReason && (
                  <div style={{ fontSize: '0.78rem', color: '#DC2626', background: '#FEE2E2', padding: 6, borderRadius: 6, marginTop: 4 }}>
                    <strong>Decline Reason:</strong> {ord.declineReason}
                  </div>
                )}
              </div>

              {/* Verification & Chat Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {isPending && (
                  <>
                    <button
                      disabled={processingId === ord._id}
                      onClick={() => handleApprove(ord._id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#0D5148',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      {processingId === ord._id ? <Spinner size={16} /> : 'Approve Payment ✓'}
                    </button>
                    <button
                      disabled={processingId === ord._id}
                      onClick={() => openDeclineModal(ord)}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#FFFFFF',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate(`/chat/${buyerObj._id || buyerObj}`)}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#E8F1ED',
                    color: '#0D5148',
                    border: '1px solid #D6E3DE',
                    borderRadius: 10,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MessageCircle size={16} /> Chat
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Decline Reason Modal */}
      <Modal isOpen={declineModalOpen} onClose={() => setDeclineModalOpen(false)} title="Decline Payment">
        <form onSubmit={handleConfirmDecline} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>
            Please state the reason for declining payment for <strong>{declineTargetOrder?.productSnapshot?.name || 'this item'}</strong>:
          </p>
          <textarea
            rows={3}
            required
            placeholder="e.g. Transaction ID not found in bank statement, incorrect amount received..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #D1D5DB',
              fontSize: '0.9rem',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setDeclineModalOpen(false)}
              style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingId === declineTargetOrder?._id}
              style={{ flex: 1, padding: '10px', background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
            >
              {processingId === declineTargetOrder?._id ? <Spinner size={16} /> : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
