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
    <div style={{ padding:'20px 16px 40px', maxWidth:520, margin:'0 auto' }}>
      <div className="animate-fade-in-up">
        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>Become a <span className="gradient-text">Vendor</span></h1>
        <p style={{ color:'#94a3b8', fontSize:'0.875rem', marginBottom:28 }}>Share your pets with the world. Fill out the form below and our team will review your application.</p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:6, display:'block' }}>Business Name *</label>
            <input className="input-field" placeholder="e.g. Happy Paws Kennel" value={form.businessName} onChange={e => setForm({...form, businessName:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:6, display:'block' }}>Description *</label>
            <textarea className="input-field" placeholder="Tell us about your business..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:6, display:'block' }}>Contact Email *</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={form.contactEmail} onChange={e => setForm({...form, contactEmail:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:6, display:'block' }}>Contact Number *</label>
            <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.contactNumber} onChange={e => setForm({...form, contactNumber:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', marginBottom:6, display:'block' }}>Address (optional)</label>
            <input className="input-field" placeholder="City, State" value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', marginTop:8 }}>{loading?'Submitting...':'Submit Application'}</button>
        </form>
      </div>
    </div>
  );
}
