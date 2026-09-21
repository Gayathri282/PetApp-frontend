import { useState, useEffect } from 'react';
import { updateVendorShippingSettings } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Truck, ShieldCheck, Save } from 'lucide-react';
import Spinner from '../ui/Spinner';

export default function VendorShippingSettings() {
  const toast = useToast();
  const { user, refreshUser } = useAuth();

  const vendorDetails = user?.vendorDetails || {};
  const currentShipping = vendorDetails.shippingDetails || {};

  const [shippingType, setShippingType] = useState(currentShipping.shippingType || 'unconfigured');
  const [flatRate, setFlatRate] = useState(currentShipping.flatRate || 0);
  const [notes, setNotes] = useState(currentShipping.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendorDetails.shippingDetails) {
      setShippingType(vendorDetails.shippingDetails.shippingType || 'unconfigured');
      setFlatRate(vendorDetails.shippingDetails.flatRate || 0);
      setNotes(vendorDetails.shippingDetails.notes || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateVendorShippingSettings({
        shippingType,
        flatRate: Number(flatRate) || 0,
        notes,
      });
      await refreshUser();
      toast.success('Shipping settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update shipping settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #D6E3DE', borderRadius: 16, padding: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E8F1ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Truck size={20} color="#0D5148" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#12332F' }}>Vendor Shipping Configuration</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#60736F' }}>Configure how shipping charges are calculated for buyers</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#12332F', marginBottom: 8 }}>
            Shipping Method
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'free', label: 'Free Shipping', desc: 'Buyers pay ₹0 for delivery on all products.' },
              { id: 'flat', label: 'Flat Shipping', desc: 'Charge a fixed shipping fee per order.' },
              { id: 'variable', label: 'Shipping Varies by Location', desc: 'Confirm shipping charges individually based on buyer location.' },
            ].map((option) => (
              <label
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: shippingType === option.id ? '2px solid #0D5148' : '1px solid #D6E3DE',
                  background: shippingType === option.id ? 'rgba(13, 81, 72, 0.04)' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="shippingType"
                  value={option.id}
                  checked={shippingType === option.id}
                  onChange={(e) => setShippingType(e.target.value)}
                  style={{ marginTop: 2, accentColor: '#0D5148' }}
                />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#12332F' }}>{option.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#60736F', marginTop: 2 }}>{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {shippingType === 'flat' && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 14, borderRadius: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#12332F', marginBottom: 6 }}>
              Flat Shipping Charge (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 150"
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #D1D5DB',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px',
            backgroundColor: '#0D5148',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {saving ? <Spinner size={18} /> : <><Save size={16} /> Save Shipping Policy</>}
        </button>
      </form>
    </div>
  );
}
