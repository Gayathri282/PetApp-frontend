import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { applyVendor } from '../api';

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

export default function VendorApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    businessName: '',
    description: '',
    contactEmail: user?.email || '',
    contactNumber: user?.contactNumber || '',
    address: '',
    upiId: '',
    upiName: '',
  });

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName || !form.description || !form.contactEmail || !form.contactNumber) {
      toast.error('Please fill all required business contact fields');
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one pet category');
      return;
    }
    if (!form.upiId.trim()) {
      toast.error('Please enter your Vendor UPI ID so customers can pay you directly');
      return;
    }

    setLoading(true);
    try {
      await applyVendor({
        businessName: form.businessName,
        description: form.description,
        contactEmail: form.contactEmail,
        contactNumber: form.contactNumber,
        address: form.address,
        petCategories: selectedCategories,
        upiDetails: {
          upiId: form.upiId.trim(),
          upiName: form.upiName.trim() || form.businessName,
        },
      });
      toast.success("Application submitted! We'll review it shortly.");
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 16px 100px', maxWidth: 580, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      <div className="card animate-fade-in-up" style={{ padding: 24 }}>
        <h1 className="serif-heading" style={{ fontSize: '1.45rem', marginBottom: 4, margin: 0 }}>
          Become a <span style={{ color: '#0D5148' }}>Vendor</span>
        </h1>
        <p style={{ color: '#60736F', fontSize: '0.85rem', marginBottom: 24, marginTop: 4 }}>
          List your pets and pet products across Kerala. Setup your pet categories and UPI account for direct customer payments.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
              Business Name *
            </label>
            <input
              className="input-field"
              placeholder="e.g. Happy Paws Kennel"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
              Select Pet Categories Offered *
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
                      background: active ? '#0D5148' : '#FFFFFF',
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

          <div style={{ background: '#EBF4F1', padding: 14, borderRadius: 12, border: '1px dashed #A7F3D0' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0D5148' }}>
              💳 Direct Customer UPI Payment Credentials
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#4A5568' }}>
              Payments go 100% directly to your UPI ID without platform commission.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
                  Vendor UPI ID * (Google Pay / PhonePe / Paytm)
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. 9876543210@paytm or vendorname@okicici"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12332F', marginBottom: 4, display: 'block' }}>
                  Account Holder Name
                </label>
                <input
                  className="input-field"
                  placeholder="Name as registered on UPI"
                  value={form.upiName}
                  onChange={(e) => setForm({ ...form, upiName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
              Description *
            </label>
            <textarea
              className="input-field"
              placeholder="Tell us about your breeding, kennel, or pet shop business..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
                Contact Email *
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
                Contact Number *
              </label>
              <input
                className="input-field"
                placeholder="+91 XXXXX XXXXX"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>
              Address / Location (optional)
            </label>
            <input
              className="input-field"
              placeholder="City, District, State"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Submitting Application...' : 'Submit Vendor Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
