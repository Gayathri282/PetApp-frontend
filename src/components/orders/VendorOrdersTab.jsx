import { useState, useEffect } from 'react';
import { getVendorOrders, updateVendorOrderStatus } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function VendorOrdersTab() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

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

  const handleStatusChange = async (orderId, status) => {
    setProcessingId(orderId);
    try {
      await updateVendorOrderStatus(orderId, status);
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'payment_submitted':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Payment Pending Verification</span>;
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>✅ Confirmed & Paid</span>;
      case 'delivered':
        return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>📦 Delivered</span>;
      case 'rejected':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>❌ Rejected</span>;
      default:
        return <span style={{ background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>Pending Payment</span>;
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#60736F' }}>Loading received orders...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#12332F' }}>Received Orders & Payments</h3>
        <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#60736F' }}>
          No orders received yet.
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

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', padding: 10, background: '#F8FAFC', borderRadius: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Buyer Details:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                  {ord.buyer?.name} ({ord.buyer?.email})
                </div>
                {ord.buyer?.contactNumber && (
                  <div style={{ fontSize: '0.8rem', color: '#0D5148' }}>📞 {ord.buyer.contactNumber}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Amount:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0D5148' }}>₹{ord.amount}</div>
              </div>
            </div>

            {/* Payment Details Section */}
            {ord.paymentDetails?.utrNumber && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 10, borderRadius: 10, marginBottom: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>
                  💳 Payment Submission Reference:
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', marginTop: 2, letterSpacing: 0.5 }}>
                  UTR: {ord.paymentDetails.utrNumber}
                </div>
                {ord.paymentDetails.submittedAt && (
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                    Submitted on: {new Date(ord.paymentDetails.submittedAt).toLocaleString()}
                  </div>
                )}
                {ord.paymentDetails.paymentScreenshot && (
                  <a
                    href={ord.paymentDetails.paymentScreenshot}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.78rem', color: '#0D5148', fontWeight: 600, textDecoration: 'underline', marginTop: 4, display: 'inline-block' }}
                  >
                    View Uploaded Receipt Screenshot ↗
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {ord.status === 'payment_submitted' && (
                <>
                  <button
                    disabled={processingId === ord._id}
                    onClick={() => handleStatusChange(ord._id, 'confirmed')}
                    style={{
                      background: '#0D5148',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm & Accept Payment
                  </button>
                  <button
                    disabled={processingId === ord._id}
                    onClick={() => handleStatusChange(ord._id, 'rejected')}
                    style={{
                      background: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Reject Payment
                  </button>
                </>
              )}

              {ord.status === 'confirmed' && (
                <button
                  disabled={processingId === ord._id}
                  onClick={() => handleStatusChange(ord._id, 'delivered')}
                  style={{
                    background: '#2563EB',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Mark as Delivered 📦
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
