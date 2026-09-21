import { useState, useEffect } from 'react';
import { getMyOrders } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function UserOrdersTab({ onPayOrder }) {
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_payment':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Action Required: Pay via UPI</span>;
      case 'payment_submitted':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>⏳ Verification Pending</span>;
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>✅ Confirmed by Vendor</span>;
      case 'delivered':
        return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>📦 Delivered</span>;
      case 'rejected':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>❌ Rejected</span>;
      default:
        return <span style={{ background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>Pending</span>;
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#60736F' }}>Loading your orders...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#12332F' }}>My Purchases & Orders</h3>
        <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#60736F' }}>
          You have not placed any orders yet. Browse pets and products in the feed to buy directly!
        </div>
      ) : (
        orders.map((ord) => (
          <div key={ord._id} className="card" style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', display: 'block' }}>
                  Order #{ord._id.slice(-6).toUpperCase()} • {new Date(ord.createdAt).toLocaleDateString()}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#12332F' }}>
                  {ord.product?.name || 'Product'}
                </span>
              </div>
              <div>{getStatusBadge(ord.status)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', padding: 10, background: '#F8FAFC', borderRadius: 10 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Vendor:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0D5148' }}>
                  {ord.vendor?.vendorDetails?.businessName || ord.vendor?.name}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Amount:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0D5148' }}>₹{ord.amount}</span>
              </div>
            </div>

            {ord.paymentDetails?.utrNumber && (
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                <strong>Submitted UTR:</strong> {ord.paymentDetails.utrNumber}
              </div>
            )}

            {ord.status === 'pending_payment' && (
              <button
                onClick={() => onPayOrder && onPayOrder(ord, ord.product, ord.vendor)}
                className="btn-primary"
                style={{ width: '100%', marginTop: 10, padding: '10px' }}
              >
                💳 Pay Now via Direct UPI →
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
