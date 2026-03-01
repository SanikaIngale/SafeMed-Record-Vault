import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = 'http://localhost:5001'; // change to your backend URL

const C = {
  bg: "#F0F4F3", primary: "#1C4A3E", primaryLight: "#2D6A5A",
  primaryGhost: "#E8F2EF", error: "#C62828", errorBg: "#FFEBEE",
  textPrimary: "#1A1A1A", textSecondary: "#6B7280",
  border: "#E5E7EB", inputBg: "#F0F7F5", white: "#FFFFFF",
};
const F = { display: "'Georgia', 'Times New Roman', serif", body: "'Helvetica Neue', Arial, sans-serif" };

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const avatarColor = (name) => {
  const palette = ["#1C4A3E", "#1565C0", "#6A1B9A", "#00695C", "#4E342E", "#283593"];
  let h = 0;
  for (let c of name) h = (h + c.charCodeAt(0)) % palette.length;
  return palette[h];
};

const RequestBadge = ({ status }) => {
  const map = {
    "pending":  { bg: "#FFF8E1", color: "#E65100", border: "#FFE082", icon: "⏱", label: "Pending"  },
    "approved": { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7", icon: "✓", label: "Approved" },
    "rejected": { bg: "#FFEBEE", color: "#C62828", border: "#FFCDD2", icon: "✕", label: "Rejected" },
  };
  const s = map[status?.toLowerCase()] || map["pending"];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.border}`, padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", fontFamily: F.body, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {s.icon} {s.label}
    </span>
  );
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const SearchIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ShieldIcon  = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const LogoutIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const CloseIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const BellIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const HomeIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ProfileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PatientsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const WarningIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const LockIcon    = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const SendIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ active, onNav, onLogout, doctorName }) => {
  const navItems = [
    { key: "dashboard", label: "Dashboard",  icon: <HomeIcon />    },
    { key: "patients",   label: "My Patients", icon: <PatientsIcon /> },
    { key: "profile",   label: "My Profile", icon: <ProfileIcon /> },
  ];
  return (
    <div style={{ width: "240px", minHeight: "100vh", flexShrink: 0, background: C.primary, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.15)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="2" width="2" height="20" rx="1" fill="white"/><rect x="2" y="11" width="20" height="2" rx="1" fill="white"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: "800", fontSize: "17px", fontFamily: F.display }}>SafeMed</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: F.body }}>Doctor Portal</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map(item => (
          <button key={item.key} onClick={() => onNav(item.key)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", marginBottom: "4px", background: active === item.key ? "rgba(255,255,255,0.15)" : "transparent", border: "none", cursor: "pointer", color: active === item.key ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: active === item.key ? "600" : "400", fontFamily: F.body, textAlign: "left" }}
          >{item.icon} {item.label}</button>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: "14px", fontFamily: F.body, textAlign: "left" }}
        ><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
};

// ── Emergency Modal ───────────────────────────────────────────────────────────
const EmergencyModal = ({ onClose }) => {
  const [reason, setReason] = useState("");
  const [patientId, setPatientId] = useState("");
  const [rf, setRf] = useState(false);
  const [pf, setPf] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(4px)" }}>
      <div style={{ background: C.white, borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: C.error }}><ShieldIcon size={22} /></span>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display, margin: 0 }}>Emergency Break-Glass Access</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", padding: "4px" }}><CloseIcon /></button>
        </div>
        <div style={{ background: C.errorBg, border: "1px solid #FFCDD2", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px", display: "flex", gap: "10px" }}>
          <span style={{ color: C.error, flexShrink: 0 }}><WarningIcon /></span>
          <p style={{ fontSize: "13px", color: C.error, fontFamily: F.body, lineHeight: 1.6, margin: 0 }}>
            <strong>Warning:</strong> This action will be logged and audited. Only use in genuine emergency situations.
          </p>
        </div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: C.textSecondary, marginBottom: "8px", fontFamily: F.body }}>Reason for Emergency Access</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} onFocus={() => setRf(true)} onBlur={() => setRf(false)}
          placeholder="Describe the emergency situation..." rows={4}
          style={{ width: "100%", padding: "13px 16px", background: C.inputBg, border: `1.5px solid ${rf ? C.primary : C.border}`, borderRadius: "12px", fontSize: "14px", color: C.textPrimary, fontFamily: F.body, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "20px" }}
        />
        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: C.textSecondary, marginBottom: "8px", fontFamily: F.body }}>Patient ID</label>
        <input value={patientId} onChange={e => setPatientId(e.target.value)} onFocus={() => setPf(true)} onBlur={() => setPf(false)}
          placeholder="Enter patient ID"
          style={{ width: "100%", padding: "13px 16px", background: C.inputBg, border: `1.5px solid ${pf ? C.primary : C.border}`, borderRadius: "12px", fontSize: "14px", color: C.textPrimary, fontFamily: F.body, outline: "none", boxSizing: "border-box", marginBottom: "28px" }}
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: "12px", fontSize: "15px", fontWeight: "600", fontFamily: F.body, color: C.textSecondary, cursor: "pointer" }}>Cancel</button>
          <button style={{ flex: 2, padding: "13px", background: C.error, border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", fontFamily: F.body, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <ShieldIcon size={16} /> Grant Emergency Access
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Request Access Modal ──────────────────────────────────────────────────────
const RequestAccessModal = ({ patientId, onClose, onSubmit, loading }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(4px)" }}>
    <div style={{ background: C.white, borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "400px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", background: C.primaryGhost, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}><SendIcon /></div>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display, margin: 0 }}>Request Patient Access</h2>
            <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0", fontFamily: F.body }}>Patient ID: {patientId}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", padding: "4px" }}><CloseIcon /></button>
      </div>
      <div style={{ background: C.primaryGhost, borderRadius: "14px", padding: "24px", marginBottom: "28px", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
        <p style={{ fontSize: "15px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display, margin: "0 0 8px" }}>Are you sure you want to request access?</p>
        <p style={{ fontSize: "13px", color: C.textSecondary, fontFamily: F.body, lineHeight: 1.6, margin: 0 }}>
          A request will be sent for patient <strong style={{ color: C.primary }}>{patientId}</strong>. You will be notified once approved.
        </p>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: "13px", background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: "12px", fontSize: "14px", fontWeight: "600", fontFamily: F.body, color: C.textSecondary, cursor: "pointer" }}>Cancel</button>
        <button onClick={onSubmit} disabled={loading}
          style={{ flex: 2, padding: "13px", background: C.primary, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "700", fontFamily: F.body, color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <SendIcon /> {loading ? "Sending..." : "Yes, Send Request"}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav]       = useState("dashboard");
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [requestModal, setRequestModal] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  // Real data from API
  const [myPatients, setMyPatients]     = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [doctorInfo, setDoctorInfo]     = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const token = localStorage.getItem('doctor_token');

  // Redirect to login if no token — prevents 'Bearer null' requests that
  // cause CORS errors (middleware rejects before CORS headers are set)
  useEffect(() => {
    if (!token) navigate('/login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch approved patients (Recent Patients list)
  const fetchMyPatients = useCallback(async () => {
    try {
      setLoadingPatients(true);
      const res = await fetch(`${API_URL}/api/doctors/my-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMyPatients(data.patients);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  }, [token]);

  // Fetch access requests (doctor's dashboard requests panel)
  const fetchAccessRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch(`${API_URL}/api/doctors/access-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAccessRequests(data.requests);
    } catch (err) {
      console.error('Error fetching access requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [token]);

  useEffect(() => {
    // Load doctor info from localStorage
    const name = localStorage.getItem('doctor_name');
    const email = localStorage.getItem('doctor_email');
    if (name || email) {
      setDoctorInfo({ name, email });
    }

    fetchMyPatients();
    fetchAccessRequests();
  }, [fetchMyPatients, fetchAccessRequests]);

  const handleNav = (key) => {
    if (key === "profile") { navigate("/profile"); return; }
    if (key === "patients") { navigate("/patients"); return; }
    setActiveNav(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('doctor_token');
    localStorage.removeItem('doctor_id');
    localStorage.removeItem('doctor_name');
    localStorage.removeItem('doctor_email');
    navigate("/login");
  };

  // Send access request to patient
  const handleRequestSubmit = async () => {
    if (!requestModal) return;
    try {
      setRequestLoading(true);
      const res = await fetch(`${API_URL}/api/doctors/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patient_id: requestModal })
      });
      const data = await res.json();
      if (data.success) {
        alert('Access request sent! The patient will be notified in their app.');
        fetchAccessRequests(); // refresh the requests panel
      } else {
        alert(data.message || 'Failed to send request');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setRequestLoading(false);
      setRequestModal(null);
      setSearchQuery("");
    }
  };

  // Filter patients by search
  const q = searchQuery.trim().toLowerCase();
  const filteredPatients = q
    ? myPatients.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.patient_id?.toLowerCase().includes(q) ||
        p.condition?.toLowerCase().includes(q)
      )
    : myPatients;

  const isSearching   = q.length > 0;
  const noRecentMatch = isSearching && filteredPatients.length === 0;

  const doctorName = doctorInfo?.name || 'Doctor';
  const hospital   = doctorInfo?.hospital || 'SafeMed';

  return (
    <>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideIn { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .patient-row:hover { background:#F8FBF9 !important; }
        .request-row:hover { background:#FAFAFA !important; }
        * { box-sizing:border-box; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: F.body }}>

        <Sidebar active={activeNav} onNav={handleNav} onLogout={handleLogout} doctorName={doctorName} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* Top bar */}
          <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexShrink: 0 }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: "800", color: C.textPrimary, fontFamily: F.display, margin: 0 }}>{hospital}</h1>
              <p style={{ color: C.textSecondary, fontSize: "13px", margin: "3px 0 0", fontFamily: F.body }}>Welcome back, Dr. {doctorName}.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", alignItems: "center", position: "relative", padding: "8px" }}>
                <BellIcon />
                {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: C.error, borderRadius: "50%", border: `2px solid ${C.white}` }} />
                )}
              </button>
              <div onClick={() => navigate("/profile")}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 14px", background: C.primaryGhost, borderRadius: "999px", cursor: "pointer" }}>
                <div style={{ width: "28px", height: "28px", background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#fff" }}>
                  {initials(doctorName)}
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600", color: C.primary }}>Dr. {doctorName}</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div style={{ padding: "28px 32px", flex: 1, animation: "fadeUp 0.4s ease" }}>

            {/* Search + Emergency */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ flex: 1, height: "50px", background: C.white, borderRadius: "14px", border: `1.5px solid ${searchFocused ? C.primary : C.border}`, padding: "0 16px", display: "flex", alignItems: "center", gap: "10px", boxShadow: searchFocused ? "0 0 0 3px rgba(28,74,62,0.1)" : "0 2px 8px rgba(28,74,62,0.04)", transition: "border-color 0.2s, box-shadow 0.2s" }}>
                <span style={{ color: searchFocused ? C.primary : C.textSecondary, display: "flex", flexShrink: 0 }}><SearchIcon /></span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search patient by name or ID..."
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "15px", color: C.textPrimary, fontFamily: F.body }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", padding: "2px" }}><CloseIcon /></button>
                )}
              </div>
              <button onClick={() => setShowEmergency(true)}
                style={{ height: "50px", padding: "0 22px", display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: `1.5px solid ${C.error}`, borderRadius: "14px", cursor: "pointer", color: C.error, fontSize: "14px", fontWeight: "600", fontFamily: F.body, whiteSpace: "nowrap" }}>
                <ShieldIcon size={16} /> Emergency Access
              </button>
            </div>

            {/* Unknown patient card — shown when search doesn't match any known patient */}
            {noRecentMatch && (
              <div style={{ marginBottom: "24px", animation: "slideIn 0.3s ease" }}>
                <div style={{ background: C.white, borderRadius: "16px", border: `1.5px solid ${C.border}`, boxShadow: "0 4px 20px rgba(28,74,62,0.08)", overflow: "hidden" }}>
                  <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #2D6A5A 100%)`, padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px dashed rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}><LockIcon /></div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: F.body }}>Patient ID</div>
                      <div style={{ color: "#fff", fontSize: "22px", fontWeight: "800", fontFamily: F.display }}>{searchQuery.toUpperCase()}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", fontFamily: F.body, border: "1px solid rgba(255,255,255,0.25)" }}>🔒 Access Required</span>
                    </div>
                  </div>
                  <div style={{ padding: "24px" }}>
                    <p style={{ fontSize: "14px", color: C.textSecondary, fontFamily: F.body, lineHeight: 1.6, margin: "0 0 16px" }}>
                      This patient's records are not in your care list. Request access to view their medical history.
                    </p>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <p style={{ fontSize: "13px", color: C.textSecondary, fontFamily: F.body, margin: 0 }}>
                        {accessRequests.some(r => r.patient_id === searchQuery.toUpperCase() && r.status === 'pending')
                          ? "✓ Access request already sent. Waiting for patient approval."
                          : "Send a request to access this patient's records."}
                      </p>
                      {accessRequests.some(r => r.patient_id === searchQuery.toUpperCase() && r.status === 'pending') ? (
                        <span style={{ padding: "10px 22px", background: "#E8F5E9", color: "#2E7D32", border: "1.5px solid #A5D6A7", borderRadius: "12px", fontSize: "14px", fontWeight: "700", fontFamily: F.body }}>✓ Request Sent</span>
                      ) : (
                        <button onClick={() => setRequestModal(searchQuery.toUpperCase())}
                          style={{ padding: "11px 24px", background: C.primary, border: "none", borderRadius: "12px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: "700", fontFamily: F.body, display: "flex", alignItems: "center", gap: "8px" }}>
                          <SendIcon /> Request Access
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two-column cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

              {/* Recent Patients */}
              <div style={{ background: C.white, borderRadius: "16px", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(28,74,62,0.06)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display, margin: 0 }}>Recent Patients</h2>
                    <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0", fontFamily: F.body }}>Patients with active consent</p>
                  </div>
                </div>
                {loadingPatients ? (
                  <div style={{ padding: "36px", textAlign: "center", color: C.textSecondary, fontFamily: F.body, fontSize: "14px" }}>Loading...</div>
                ) : filteredPatients.length === 0 ? (
                  <div style={{ padding: "36px", textAlign: "center", color: C.textSecondary, fontFamily: F.body, fontSize: "14px" }}>
                    {myPatients.length === 0 ? "No approved patients yet." : "No patients match your search."}
                  </div>
                ) : filteredPatients.map((p, i) => (
                  <div key={p.patient_id} className="patient-row"
                    style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < filteredPatients.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", background: C.white }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarColor(p.name), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: "700", flexShrink: 0, marginRight: "12px" }}>
                      {initials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: C.textPrimary, fontFamily: F.display, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: C.textSecondary, marginTop: "2px", fontFamily: F.body }}>
                        {p.age ? `${p.age} yrs` : ''}{p.gender ? ` | ${p.gender}` : ''} | ID: {p.patient_id}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: "8px" }}>
                      <span style={{ fontSize: "13px", color: C.textSecondary, fontFamily: F.body }}>{(typeof p.condition === 'object' ? p.condition?.name : p.condition) || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Access Requests */}
              <div style={{ background: C.white, borderRadius: "16px", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(28,74,62,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display, margin: 0 }}>Access Requests</h2>
                  <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0", fontFamily: F.body }}>Patient record access requests you've sent</p>
                </div>
                {loadingRequests ? (
                  <div style={{ padding: "36px", textAlign: "center", color: C.textSecondary, fontFamily: F.body, fontSize: "14px" }}>Loading...</div>
                ) : accessRequests.length === 0 ? (
                  <div style={{ padding: "36px", textAlign: "center", color: C.textSecondary, fontFamily: F.body, fontSize: "14px" }}>No access requests yet.</div>
                ) : accessRequests.map((req, i) => (
                  <div key={req.id} className="request-row"
                    style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: i < accessRequests.length - 1 ? `1px solid ${C.border}` : "none", background: C.white, gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display }}>{req.patient_name}</div>
                      <div style={{ fontSize: "11px", color: C.textSecondary, marginTop: "2px", fontFamily: F.body }}>ID: {req.patient_id}</div>
                      {req.message && (
                        <div style={{ fontSize: "12px", color: C.textSecondary, marginTop: "5px", fontFamily: F.body, lineHeight: 1.4 }}>{req.message}</div>
                      )}
                      <div style={{ fontSize: "11px", color: C.textSecondary, marginTop: "4px", fontFamily: F.body }}>
                        {new Date(req.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, paddingTop: "2px" }}>
                      <RequestBadge status={req.status} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
      {requestModal  && <RequestAccessModal patientId={requestModal} onClose={() => setRequestModal(null)} onSubmit={handleRequestSubmit} loading={requestLoading} />}
    </>
  );
};

export default DashboardPage;