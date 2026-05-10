import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Package, BarChart3, Check, X, Trash2, Clock, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/ui/Spinner';
import { getAdminStats, getApplications, reviewApplication, getEnquiries, updateEnquiry, adminDeleteProduct } from '../../api';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if(!isAdmin) navigate('/feed'); }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    if (tab === 'stats') getAdminStats().then(r => setStats(r.data.stats)).catch(()=>{}).finally(()=>setLoading(false));
    else if (tab === 'apps') getApplications().then(r => setApps(r.data.applications)).catch(()=>{}).finally(()=>setLoading(false));
    else if (tab === 'enquiries') getEnquiries().then(r => setEnquiries(r.data.enquiries)).catch(()=>{}).finally(()=>setLoading(false));
    else setLoading(false);
  }, [tab]);

  const handleReview = async (id, status) => {
    try {
      await reviewApplication(id, status);
      setApps(prev => prev.map(a => a._id===id?{...a,status}:a));
      toast.success(`Application ${status}`);
    } catch { toast.error('Failed'); }
  };

  const handleEnquiryStatus = async (id, status) => {
    try {
      await updateEnquiry(id, status);
      setEnquiries(prev => prev.map(e => e._id===id?{...e,status}:e));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const tabs = [
    { key:'stats', icon:BarChart3, label:'Dashboard' },
    { key:'apps', icon:Users, label:'Applications' },
  ];

  return (
    <div style={{ padding:'20px 16px 40px', maxWidth:720, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={() => navigate('/feed')} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10, padding:8, color:'#94a3b8', cursor:'pointer', display:'flex' }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize:'1.3rem', fontWeight:800 }}>Admin <span className="gradient-text">Panel</span></h1>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, transition:'all 0.2s', background: tab===t.key?'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))':'none', color: tab===t.key?'#a5b4fc':'#64748b' }}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="animate-fade-in">
          {/* Stats */}
          {tab === 'stats' && stats && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
              {[{label:'Users',value:stats.users,color:'#818cf8'},{label:'Vendors',value:stats.vendors,color:'#22c55e'},{label:'Products',value:stats.products,color:'#a855f7'},{label:'Pending Apps',value:stats.pendingApps,color:'#eab308'},{label:'Open Enquiries',value:stats.pendingEnquiries,color:'#ef4444'}].map(s => (
                <div key={s.label} className="glass" style={{ padding:20, borderRadius:16, textAlign:'center' }}>
                  <p style={{ fontSize:'2rem', fontWeight:800, color:s.color }}>{s.value}</p>
                  <p style={{ fontSize:'0.78rem', color:'#94a3b8', fontWeight:500 }}>{s.label}</p>
                </div>
              ))}
              
              <div 
                className="glass" 
                onClick={() => navigate('/chat')}
                style={{ gridColumn:'1 / -1', padding:20, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', gap:12, cursor:'pointer', border:'1px solid rgba(139,92,246,0.3)', background:'rgba(139,92,246,0.05)' }}
              >
                <MessageSquare size={20} color="#a855f7" />
                <span style={{ fontWeight:700, fontSize:'1rem' }}>View All Enquiries in Messages</span>
              </div>
            </div>
          )}

          {/* Applications */}
          {tab === 'apps' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {apps.length === 0 && <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>No applications</p>}
              {apps.map(app => (
                <div key={app._id} className="glass" style={{ padding:16, borderRadius:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {app.applicant?.avatar ? <img src={app.applicant.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontWeight:700 }}>{app.applicant?.name?.[0]}</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:'0.9rem' }}>{app.applicant?.name}</p>
                      <p style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{app.applicant?.email}</p>
                    </div>
                    <span style={{ fontSize:'0.7rem', padding:'3px 10px', borderRadius:999, fontWeight:600, background: app.status==='pending'?'rgba(234,179,8,0.12)':app.status==='approved'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color: app.status==='pending'?'#eab308':app.status==='approved'?'#22c55e':'#ef4444' }}>{app.status}</span>
                  </div>
                  <p style={{ fontSize:'0.85rem', fontWeight:600, marginBottom:4 }}>{app.businessName}</p>
                  <p style={{ fontSize:'0.8rem', color:'#818cf8', marginBottom:4 }}>📞 {app.contactNumber}</p>
                  <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:12 }}>{app.description}</p>
                  {app.status === 'pending' && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn-primary" style={{ flex:1, padding:'8px 0', fontSize:'0.8rem' }} onClick={() => handleReview(app._id,'approved')}><Check size={15} /> Approve</button>
                      <button className="btn-danger" style={{ flex:1, padding:'8px 0', fontSize:'0.8rem' }} onClick={() => handleReview(app._id,'rejected')}><X size={15} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


        </div>
      )}
    </div>
  );
}
