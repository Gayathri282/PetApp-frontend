import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag, MessageCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';

export default function UserOrdersTab() {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getMyOrders();
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Payment Verified ✓</span>;
      case 'declined':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> Verification Declined ✗</span>;
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
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#12332F', fontWeight: 800 }}>My Purchases & Orders</h3>
        <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: '#60736F' }}>
          You have not placed any orders yet. Browse pets and products to buy directly!
        </div>
      ) : (
        orders.map((ord) => {
          const vendorObj = ord.vendor || {};
          const vendorName = ord.vendorSnapshot?.name || vendorObj.name || 'Vendor';
          const productName = ord.productSnapshot?.name || ord.product?.name || 'Pet Product';
          const productPrice = ord.productPrice ?? ord.amount ?? 0;
          const shippingCharge = ord.shippingCharge ?? 0;
          const totalAmount = ord.totalAmount ?? ord.amount ?? 0;
          const txId = ord.transactionId || ord.paymentDetails?.utrNumber || 'N/A';

          return (
            <div key={ord._id} className="card" style={{ padding: 16, border: '1px solid #D6E3DE', borderRadius: 16, background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#60736F', display: 'block' }}>
                    Order #{ord._id.slice(-6).toUpperCase()} • {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                  <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 800, color: '#12332F' }}>
                    {productName}
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: '#0D5148', fontWeight: 600 }}>
                    Vendor: {vendorName}
                  </span>
                </div>
                <div>{getPaymentStatusBadge(ord.paymentStatus || ord.status)}</div>
              </div>

              {/* Price & Tx Details */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#4B5563' }}>
                  <span>Price: ₹{productPrice.toLocaleString('en-IN')}</span>
                  <span>Shipping: {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#111827', borderTop: '1px dashed #E5E7EB', paddingTop: 6 }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#0D5148' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>
                  <strong>Transaction / UTR ID:</strong> <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>{txId}</code>
                </div>
                {ord.declineReason && (
                  <div style={{ fontSize: '0.78rem', color: '#DC2626', background: '#FEE2E2', padding: 6, borderRadius: 6, marginTop: 4 }}>
                    <strong>Reason for decline:</strong> {ord.declineReason}
                  </div>
                )}
              </div>

              {/* Chat action button */}
              <button
                onClick={() => navigate(`/chat/${vendorObj._id || vendorObj}`)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '10px',
                  backgroundColor: '#E8F1ED',
                  color: '#0D5148',
                  border: '1px solid #D6E3DE',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MessageCircle size={16} /> Open Vendor Chat & Status
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
