import { useState } from 'react';
import { updateVendorUpiSettings } from '../../api';
import { useToast } from '../../context/ToastContext';

const PET_CATEGORIES_LIST = [
  { id: 'Dogs', label: 'Dogs 🐶' },
  { id: 'Cats', label: 'Cats 🐱' },
  { id: 'Birds', label: 'Birds 🦜' },
  { id: 'Fish', label: 'Fish & Aquatics 🐠' },
  { id: 'Small Pets', label: 'Small Animals 🐹' },
  { id: 'Exotic Pets', label: 'Exotic Pets 🦎' },
  { id: 'Pet Food', label: 'Food & Nutrition 🦴' },
  { id: 'Accessories', label: 'Pet Accessories 🎾' },
  { id: 'Grooming', label: 'Grooming & Services ✂️' },
];

export default function VendorUpiSettings({ user, onSaved }) {
  const toast = useToast();
  const initialDetails = user?.vendorDetails || {};
  const initialUpi = initialDetails.upiDetails || {};

  const [businessName, setBusinessName] = useState(initialDetails.businessName || '');
  const [description, setDescription] = useState(initialDetails.description || '');
  const [address, setAddress] = useState(initialDetails.address || '');
  const [selectedCategories, setSelectedCategories] = useState(initialDetails.petCategories || []);
  const [upiId, setUpiId] = useState(initialUpi.upiId || '');
  const [upiName, setUpiName] = useState(initialUpi.upiName || '');
  const [qrCodeUrl, setQrCodeUrl] = useState(initialUpi.qrCodeUrl || '');
  const [phonePeNumber, setPhonePeNumber] = useState(initialUpi.phonePeNumber || '');
  const [gpayNumber, setGpayNumber] = useState(initialUpi.gpayNumber || '');
  const [loading, setLoading] = useState(false);

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateVendorUpiSettings({
        businessName,
        description,
        address,
        petCategories: selectedCategories,
        upiDetails: {
          upiId: upiId.trim(),
          upiName: upiName.trim(),
          qrCodeUrl: qrCodeUrl.trim(),
          phonePeNumber: phonePeNumber.trim(),
          gpayNumber: gpayNumber.trim(),
        },
      });
      toast.success('Vendor categories & UPI settings updated!');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="serif-heading" style={{ fontSize: '1.2rem', marginBottom: 6, margin: 0 }}>
        Vendor <span style={{ color: '#0D5148' }}>Categories & UPI Payment Credentials</span>
      </h3>
      <p style={{ color: '#60736F', fontSize: '0.82rem', marginBottom: 20, marginTop: 2 }}>
        Customers pay directly to your UPI ID when purchasing your pets & products.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Business Details */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
            Business Name
          </label>
          <input
            className="input-field"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        {/* Pet Categories Multi-select */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
            Select Your Pet & Product Categories *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PET_CATEGORIES_LIST.map((cat) => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    background: active ? '#0D5148' : '#F0F4F2',
                    color: active ? '#FFFFFF' : '#2D3748',
                    border: active ? '1px solid #0D5148' : '1px solid #CBD5E0',
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat.label} {active ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>

        {/* UPI ID & Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
              Vendor UPI ID * (e.g. shop@upi)
            </label>
            <input
              className="input-field"
              placeholder="e.g. 9876543210@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
              UPI Account Holder Name
            </label>
            <input
              className="input-field"
              placeholder="Name on UPI App"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
            />
          </div>
        </div>

        {/* QR Code URL */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
            Custom UPI QR Code Image URL (Optional)
          </label>
          <input
            className="input-field"
            placeholder="https://... (leave empty to auto-generate)"
            value={qrCodeUrl}
            onChange={(e) => setQrCodeUrl(e.target.value)}
          />
        </div>

        {/* PhonePe / GPay Numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
              PhonePe Number (Optional)
            </label>
            <input
              className="input-field"
              placeholder="+91 XXXXX XXXXX"
              value={phonePeNumber}
              onChange={(e) => setPhonePeNumber(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
              Google Pay Number (Optional)
            </label>
            <input
              className="input-field"
              placeholder="+91 XXXXX XXXXX"
              value={gpayNumber}
              onChange={(e) => setGpayNumber(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? 'Saving Settings...' : 'Save UPI & Category Settings'}
        </button>
      </form>
    </div>
  );
}
