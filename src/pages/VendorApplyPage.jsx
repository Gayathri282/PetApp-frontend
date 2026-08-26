import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { applyVendor } from '../api';

export default function VendorApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ businessName:'', description:'', contactEmail: user?.email||'', contactNumber: user?.contactNumber || '', address:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName || !form.description || !form.contactEmail || !form.contactNumber) {
      toast.error('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      await applyVendor(form);
      toast.success('Application submitted! We\'ll review it shortly.');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '24px 16px 100px', maxWidth: 540, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh' }}>
      <div className="card animate-fade-in-up" style={{ padding: 24 }}>
        <h1 className="serif-heading" style={{ fontSize: '1.45rem', marginBottom: 4, margin: 0 }}>Become a <span style={{ color: '#0D5148' }}>Vendor</span></h1>
        <p style={{ color: '#60736F', fontSize: '0.85rem', marginBottom: 24, marginTop: 4 }}>Share your pets and products across Kerala. Fill out the form below for verification.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>Business Name *</label>
            <input className="input-field" placeholder="e.g. Happy Paws Kennel" value={form.businessName} onChange={e => setForm({...form, businessName:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>Description *</label>
            <textarea className="input-field" placeholder="Tell us about your business..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>Contact Email *</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={form.contactEmail} onChange={e => setForm({...form, contactEmail:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>Contact Number *</label>
            <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.contactNumber} onChange={e => setForm({...form, contactNumber:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12332F', marginBottom: 6, display: 'block' }}>Address (optional)</label>
            <input className="input-field" placeholder="City, State" value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>{loading ? 'Submitting...' : 'Submit Application'}</button>
        </form>
      </div>
    </div>
  );
}
