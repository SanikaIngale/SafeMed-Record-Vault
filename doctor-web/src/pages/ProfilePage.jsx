import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4F3", primary: "#1C4A3E", primaryLight: "#2D6A5A", primaryGhost: "#E8F2EF",
  error: "#C62828", textPrimary: "#1A1A1A", textSecondary: "#6B7280",
  border: "#E5E7EB", inputBg: "#F9FAFB", white: "#FFFFFF",
};
const F = { display: "'Georgia','Times New Roman',serif", body: "'Helvetica Neue',Arial,sans-serif" };

// ── API helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, method = "GET", body = null) {
  const token = localStorage.getItem("doctor_token");
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res  = await fetch(`${API_BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
  return data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  (name || "").replace("Dr. ", "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const formatDOB = (iso) => {
  if (!iso || !iso.includes("-")) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PatientsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ProfileIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogoutIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const EditIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const SaveIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const MailIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const PhoneIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const CalIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const PinIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const HeartIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const ClockIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const DegIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const FelIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
const BriIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const PlusIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TrashIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;

const credIcon = (title = "") => {
  const t = title.toLowerCase();
  if (t.includes("consultant") || t.includes("senior")) return <BriIcon />;
  if (t.includes("fellowship") || t.includes("fellow")) return <FelIcon />;
  return <DegIcon />;
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ active, onNav, onLogout }) => {
  const navItems = [
    { key: "dashboard", label: "Dashboard",  icon: <HomeIcon />    },
    { key: "patients",  label: "My Patients", icon: <PatientsIcon /> },
    { key: "profile",   label: "My Profile", icon: <ProfileIcon /> },
  ];
  return (
    <div style={{ width:"240px", minHeight:"100vh", flexShrink:0, background:C.primary, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"28px 24px 24px", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"36px", height:"36px", background:"rgba(255,255,255,0.15)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="2" width="2" height="20" rx="1" fill="white"/><rect x="2" y="11" width="20" height="2" rx="1" fill="white"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>
          </div>
          <div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"17px", fontFamily:F.display }}>SafeMed</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", fontFamily:F.body }}>Doctor Portal</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"16px 12px" }}>
        {navItems.map(item => (
          <button key={item.key} onClick={() => onNav(item.key)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", marginBottom:"4px", background: active === item.key ? "rgba(255,255,255,0.15)" : "transparent", border:"none", cursor:"pointer", color: active === item.key ? "#fff" : "rgba(255,255,255,0.6)", fontSize:"14px", fontWeight: active === item.key ? "600" : "400", fontFamily:F.body, textAlign:"left", transition:"background 0.2s, color 0.2s" }}
            onMouseEnter={e => { if (active !== item.key) { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}}
            onMouseLeave={e => { if (active !== item.key) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.6)"; }}}
          >{item.icon} {item.label}</button>
        ))}
      </nav>
      <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", background:"transparent", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.55)", fontSize:"14px", fontFamily:F.body, textAlign:"left", transition:"background 0.2s, color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.55)"; }}
        ><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
};

// ── Shared Field ──────────────────────────────────────────────────────────────
const Field = ({ label, icon, value, editing, focusKey, focused, onFocus, onBlur, onChange, type = "text" }) => (
  <div>
    <label style={{ display:"block", fontSize:"13px", fontWeight:"500", color:C.textPrimary, marginBottom:"8px", fontFamily:F.body }}>{label}</label>
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      <span style={{ position:"absolute", left:"13px", color:C.textSecondary, display:"flex", pointerEvents:"none", zIndex:1 }}>{icon}</span>
      <input type={type} value={value || ""} readOnly={!editing} onFocus={onFocus} onBlur={onBlur} onChange={onChange}
        style={{ width:"100%", padding:"11px 14px 11px 38px", background:C.white, border:`1px solid ${editing && focused===focusKey ? C.primary : C.border}`, borderRadius:"8px", fontSize:"14px", color:C.textPrimary, fontFamily:F.body, outline:"none", boxSizing:"border-box", boxShadow: editing && focused===focusKey ? "0 0 0 3px rgba(28,74,62,0.1)" : "none", transition:"border-color 0.2s, box-shadow 0.2s", cursor: editing ? "text" : "default" }}
      />
    </div>
  </div>
);

// ── Btn helper ────────────────────────────────────────────────────────────────
const Btn = ({ onClick, children, variant = "primary", disabled = false, style: extra = {} }) => {
  const base = { display:"inline-flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"8px", fontSize:"13px", fontWeight:"600", fontFamily:F.body, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, border:"none", transition:"opacity 0.2s", ...extra };
  const variants = {
    primary: { background:C.primary, color:"#fff" },
    outline: { background:"transparent", border:`1.5px solid ${C.border}`, color:C.textSecondary },
    danger:  { background:"transparent", border:`1.5px solid #FECACA`, color:C.error },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = "success" }) => (
  <div style={{ position:"fixed", bottom:"24px", right:"24px", zIndex:999, padding:"12px 20px", borderRadius:"10px", background: type === "success" ? C.primary : C.error, color:"#fff", fontSize:"13px", fontFamily:F.body, fontWeight:"600", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", animation:"fadeUp 0.3s ease" }}>
    {message}
  </div>
);

// ── ProfilePage ───────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate  = useNavigate();
  const doctorId  = localStorage.getItem("doctor_id");

  const [doctor,     setDoctor]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState("");

  // edit states
  const [editing,   setEditing]   = useState(false);
  const [draft,     setDraft]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast,     setToast]     = useState(null);

  const [activeTab, setActiveTab] = useState("personal");
  const [focused,   setFocused]   = useState(null);

  // credential add form
  const [addingCred, setAddingCred] = useState(false);
  const [newCred,    setNewCred]    = useState({ title:"", institution:"", year:"" });
  const [credSaving, setCredSaving] = useState(false);

  // specialization add
  const [addingSpec, setAddingSpec] = useState(false);
  const [newSpec,    setNewSpec]    = useState("");
  const [specSaving, setSpecSaving] = useState(false);

  // ── Show toast ──────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch doctor profile ────────────────────────────────────────────────────
  const fetchDoctor = useCallback(async () => {
    if (!doctorId) { navigate("/login"); return; }
    setLoading(true);
    setFetchError("");
    try {
      const data = await apiFetch(`/doctors/${doctorId}`);
      setDoctor(data.doctor);
    } catch (err) {
      setFetchError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, navigate]);

  useEffect(() => { fetchDoctor(); }, [fetchDoctor]);

  const handleNav = (key) => {
    if (key === "dashboard") navigate("/dashboard");
    if (key === "patients") navigate("/patients");
  };

  const handleLogout = () => {
    localStorage.removeItem('doctor_token');
    localStorage.removeItem('doctor_id');
    localStorage.removeItem('doctor_name');
    localStorage.removeItem('doctor_email');
    navigate("/login");
  };

  // ── Personal Info editing ───────────────────────────────────────────────────
  const startEdit  = () => { setDraft(JSON.parse(JSON.stringify(doctor))); setEditing(true); setSaveError(""); };
  const cancelEdit = () => { setDraft(null); setEditing(false); setSaveError(""); };

  const savePersonalInfo = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const demographics = {
        full_name:     draft.demographics.full_name,
        phone_number:  draft.demographics.phone_number,
        date_of_birth: draft.demographics.date_of_birth,
        address:       draft.demographics.address,
      };
      await apiFetch(`/doctors/${doctorId}/demographics`, "PUT", { ...demographics });
      setDoctor(d => ({ ...d, name: draft.demographics.full_name, demographics: { ...d.demographics, ...demographics } }));
      setEditing(false);
      setDraft(null);
      showToast("Personal info saved.");
    } catch (err) {
      setSaveError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const saveConsultationHours = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const data = await apiFetch(`/doctors/${doctorId}/consultation-hours`, "PUT", draft.consultation_hours);
      setDoctor(d => ({ ...d, consultation_hours: data.consultation_hours }));
      setEditing(false);
      setDraft(null);
      showToast("Consultation hours saved.");
    } catch (err) {
      setSaveError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // Save dispatcher by active tab
  const handleSave = () => {
    if (activeTab === "personal") return savePersonalInfo();
    if (activeTab === "specializations") return savePersonalInfo(); // handled inline
    savePersonalInfo(); // fallback
  };

  // ── Credential CRUD ─────────────────────────────────────────────────────────
  const handleAddCredential = async () => {
    if (!newCred.title || !newCred.institution || !newCred.year) return;
    setCredSaving(true);
    try {
      const data = await apiFetch(`/doctors/${doctorId}/credentials`, "POST", newCred);
      setDoctor(d => ({ ...d, credentials: data.credentials }));
      setNewCred({ title:"", institution:"", year:"" });
      setAddingCred(false);
      showToast("Credential added.");
    } catch (err) {
      showToast(err.message || "Failed to add credential.", "error");
    } finally {
      setCredSaving(false);
    }
  };

  const handleUpdateCredential = async (credId, updates) => {
    try {
      const data = await apiFetch(`/doctors/${doctorId}/credentials/${credId}`, "PUT", updates);
      setDoctor(d => ({ ...d, credentials: data.credentials }));
      showToast("Credential updated.");
    } catch (err) {
      showToast(err.message || "Failed to update.", "error");
    }
  };

  const handleDeleteCredential = async (credId) => {
    if (!window.confirm("Delete this credential?")) return;
    try {
      const data = await apiFetch(`/doctors/${doctorId}/credentials/${credId}`, "DELETE");
      setDoctor(d => ({ ...d, credentials: data.credentials }));
      showToast("Credential deleted.");
    } catch (err) {
      showToast(err.message || "Failed to delete.", "error");
    }
  };

  // ── Specialization CRUD ─────────────────────────────────────────────────────
  const handleAddSpec = async () => {
    if (!newSpec.trim()) return;
    setSpecSaving(true);
    try {
      const data = await apiFetch(`/doctors/${doctorId}/specializations`, "POST", { specialization: newSpec.trim() });
      setDoctor(d => ({ ...d, specializations: data.specializations }));
      setNewSpec("");
      setAddingSpec(false);
      showToast("Specialization added.");
    } catch (err) {
      showToast(err.message || "Failed to add.", "error");
    } finally {
      setSpecSaving(false);
    }
  };

  const handleDeleteSpec = async (spec) => {
    try {
      const data = await apiFetch(`/doctors/${doctorId}/specializations`, "DELETE", { specialization: spec });
      setDoctor(d => ({ ...d, specializations: data.specializations }));
      showToast("Specialization removed.");
    } catch (err) {
      showToast(err.message || "Failed to remove.", "error");
    }
  };

  // ── Consultation hours save ─────────────────────────────────────────────────
  const handleSaveHours = async (updatedHours) => {
    try {
      const data = await apiFetch(`/doctors/${doctorId}/consultation-hours`, "PUT", updatedHours);
      setDoctor(d => ({ ...d, consultation_hours: data.consultation_hours }));
      showToast("Consultation hours saved.");
    } catch (err) {
      showToast(err.message || "Failed to save hours.", "error");
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:F.body, color:C.textSecondary }}>
      Loading profile…
    </div>
  );

  if (fetchError) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:F.body }}>
      <div style={{ textAlign:"center" }}>
        <p style={{ color:C.error, marginBottom:"16px" }}>{fetchError}</p>
        <button onClick={fetchDoctor} style={{ padding:"10px 20px", background:C.primary, color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", fontFamily:F.body }}>Retry</button>
      </div>
    </div>
  );

  const d   = editing ? draft : doctor;
  const dem = d.demographics || {};
  const setF  = (k, v) => setDraft(p => ({ ...p, demographics: { ...p.demographics, [k]: v } }));
  const setA  = (k, v) => setDraft(p => ({ ...p, demographics: { ...p.demographics, address: { ...(p.demographics.address || {}), [k]: v } } }));
  const setH  = (k, v) => setDraft(p => ({ ...p, consultation_hours: { ...p.consultation_hours, [k]: v } }));

  const addressStr = dem.address
    ? [dem.address.hospital_name, dem.address.street, dem.address.city, dem.address.state, dem.address.postal_code].filter(Boolean).join(", ")
    : "";

  const tabs = [
    { key:"personal",        label:"Personal Info"    },
    { key:"credentials",     label:"Credentials"      },
    { key:"specializations", label:"Specializations"  },
  ];

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}*{box-sizing:border-box;}input[readonly]{cursor:default;}`}</style>
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:F.body }}>
        <Sidebar active="profile" onNav={handleNav} onLogout={handleLogout} />

        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
          <div style={{ flex:1, overflow:"auto" }}>
            <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"28px 32px", animation:"fadeUp 0.4s ease" }}>

              {/* ── Banner card ── */}
              <div
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, #2D6A5A 65%, #3D8B6E 100%)`,
                borderRadius: "16px",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                marginBottom: "18px",
                boxShadow: "0 2px 8px rgba(28,74,62,0.05)",
                padding: "32px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between"
                }}
              >
                {/* Left Section */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: "88px",
                      height: "88px",
                      borderRadius: "50%",
                      background: "#1E4D40",
                      border: "4px solid rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "26px",
                      fontWeight: "800",
                      color: "#fff",
                      fontFamily: F.display
                    }}
                  >
                    {getInitials(dem.full_name || doctor.name)}
                  </div>

                  {/* Doctor Info */}
                  <div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "#fff",
                        fontFamily: F.display
                      }}
                    >
                      {dem.full_name || doctor.name}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.85)",
                        marginTop: "4px",
                        fontFamily: F.body
                      }}
                    >
                      {(doctor.specializations || []).slice(0, 2).join(" · ")}
                      {(doctor.specializations || []).length > 2 &&
                        ` · +${doctor.specializations.length - 2} more`}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.75)",
                        marginTop: "3px",
                        fontFamily: F.body
                      }}
                    >
                      {doctor.license_id && `License: ${doctor.license_id}`}
                      {dem.address?.hospital_name &&
                        ` · ${dem.address.hospital_name}`}
                    </div>
                  </div>
                </div>

                {/* Right Section - Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {editing ? (
                    <>
                      <Btn variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Btn>

                      <Btn
                        onClick={
                          activeTab === "personal"
                            ? savePersonalInfo
                            : saveConsultationHours
                        }
                        disabled={saving}
                      >
                        <SaveIcon /> {saving ? "Saving…" : "Save Changes"}
                      </Btn>
                    </>
                  ) : (
                    <Btn onClick={startEdit}>
                      <EditIcon /> Edit Profile
                    </Btn>
                  )}
                </div>
              </div>
            </div>

              {saveError && (
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"8px", padding:"10px 14px", marginBottom:"14px", fontSize:"13px", color:C.error, fontFamily:F.body }}>
                  {saveError}
                </div>
              )}

              {/* ── Tabs + content card ── */}
              <div style={{ background:C.white, borderRadius:"16px", border:`1px solid ${C.border}`, boxShadow:"0 2px 8px rgba(28,74,62,0.05)" }}>
                {/* Tab bar */}
                <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 32px" }}>
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => { setActiveTab(t.key); if (editing) cancelEdit(); }}
                      style={{ padding:"16px 0", marginRight:"28px", background:"none", border:"none", cursor:"pointer", fontSize:"14px", fontFamily:F.body, fontWeight: activeTab===t.key ? "700" : "500", color: activeTab===t.key ? C.primary : C.textSecondary, borderBottom:`2.5px solid ${activeTab===t.key ? C.primary : "transparent"}`, transition:"all 0.2s" }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding:"28px 32px" }}>

                  {/* ═══ PERSONAL INFO ═══ */}
                  {activeTab === "personal" && (
                    <div>
                      <div style={{ fontSize:"16px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display }}>Personal Information</div>
                      <div style={{ fontSize:"13px", color:C.textSecondary, marginTop:"3px", marginBottom:"24px", fontFamily:F.body }}>Your contact and demographic details</div>
                      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px" }}>

                        {/* Name + Email */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"20px" }}>
                          <Field label="Full Name" icon={<ProfileIcon />}
                            value={dem.full_name} editing={editing} focusKey="name" focused={focused}
                            onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                            onChange={e => setF("full_name", e.target.value)} />
                          <Field label="Email Address" icon={<MailIcon />}
                            value={dem.email} editing={false} focusKey="email" focused={focused}
                            onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                            onChange={() => {}} />
                        </div>

                        {/* Phone + DOB */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"20px" }}>
                          <Field label="Phone Number" icon={<PhoneIcon />}
                            value={dem.phone_number} editing={editing} focusKey="phone" focused={focused}
                            onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                            onChange={e => setF("phone_number", e.target.value)} />
                          <Field label="Date of Birth" icon={<CalIcon />}
                            value={editing ? dem.date_of_birth : formatDOB(dem.date_of_birth)}
                            type={editing ? "date" : "text"}
                            editing={editing} focusKey="dob" focused={focused}
                            onFocus={() => setFocused("dob")} onBlur={() => setFocused(null)}
                            onChange={e => setF("date_of_birth", e.target.value)} />
                        </div>

                        {/* Address */}
                        <div>
                          <label style={{ display:"block", fontSize:"13px", fontWeight:"500", color:C.textPrimary, marginBottom:"8px", fontFamily:F.body }}>Address</label>
                          <div style={{ position:"relative" }}>
                            <span style={{ position:"absolute", left:"13px", top:"13px", color:C.textSecondary, display:"flex", pointerEvents:"none", zIndex:1 }}><PinIcon /></span>
                            <textarea readOnly value={addressStr} rows={2}
                              style={{ width:"100%", padding:"11px 14px 11px 38px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"8px", fontSize:"14px", color:C.textPrimary, fontFamily:F.body, outline:"none", resize:"none", boxSizing:"border-box" }} />
                          </div>
                          {editing && (
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginTop:"14px" }}>
                              {[
                                { field:"hospital_name", label:"Hospital / Clinic" },
                                { field:"street",        label:"Street"            },
                                { field:"city",          label:"City"              },
                                { field:"state",         label:"State"             },
                                { field:"postal_code",   label:"Postal Code"       },
                                { field:"country",       label:"Country"           },
                              ].map(({ field, label }) => (
                                <div key={field}>
                                  <label style={{ display:"block", fontSize:"11px", color:C.textSecondary, marginBottom:"4px", fontFamily:F.body, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</label>
                                  <input value={(dem.address || {})[field] || ""} onChange={e => setA(field, e.target.value)}
                                    onFocus={() => setFocused(field)} onBlur={() => setFocused(null)}
                                    style={{ width:"100%", padding:"8px 11px", background:C.white, border:`1px solid ${focused===field ? C.primary : C.border}`, borderRadius:"7px", fontSize:"13px", color:C.textPrimary, fontFamily:F.body, outline:"none", boxSizing:"border-box", boxShadow: focused===field ? "0 0 0 3px rgba(28,74,62,0.1)" : "none" }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Consultation Hours (inside personal tab, separate save) */}
                        <div style={{ marginTop:"28px", paddingTop:"24px", borderTop:`1px solid ${C.border}` }}>
                          <div style={{ fontSize:"14px", fontWeight:"600", color:C.textPrimary, fontFamily:F.body, marginBottom:"14px", display:"flex", alignItems:"center", gap:"7px" }}>
                            <ClockIcon /> Consultation Hours
                          </div>
                          <ConsultationHoursEditor
                            hours={doctor.consultation_hours || {}}
                            onSave={handleSaveHours}
                          />
                        </div>

                      </div>
                    </div>
                  )}

                  {/* ═══ CREDENTIALS ═══ */}
                  {activeTab === "credentials" && (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"4px" }}>
                        <div>
                          <div style={{ fontSize:"16px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display }}>Professional Credentials</div>
                          <div style={{ fontSize:"13px", color:C.textSecondary, marginTop:"3px", fontFamily:F.body }}>Your qualifications and registrations</div>
                        </div>
                        <Btn onClick={() => setAddingCred(true)}><PlusIcon /> Add</Btn>
                      </div>

                      {/* Add credential form */}
                      {addingCred && (
                        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"18px", marginBottom:"16px", marginTop:"16px" }}>
                          <div style={{ fontSize:"13px", fontWeight:"700", color:C.textPrimary, fontFamily:F.body, marginBottom:"12px" }}>New Credential</div>
                          <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr", gap:"10px", marginBottom:"10px" }}>
                            {[
                              { key:"title",       placeholder:"Degree / Title",  label:"Title"       },
                              { key:"institution", placeholder:"Institution",      label:"Institution" },
                              { key:"year",        placeholder:"Year",             label:"Year"        },
                            ].map(({ key, placeholder, label }) => (
                              <div key={key}>
                                <label style={{ display:"block", fontSize:"11px", color:C.textSecondary, marginBottom:"4px", fontFamily:F.body, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</label>
                                <input value={newCred[key]} placeholder={placeholder} onChange={e => setNewCred(p => ({ ...p, [key]: e.target.value }))}
                                  style={{ width:"100%", padding:"9px 12px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"8px", fontSize:"13px", color:C.textPrimary, fontFamily:F.body, outline:"none", boxSizing:"border-box" }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ display:"flex", gap:"8px" }}>
                            <Btn onClick={handleAddCredential} disabled={credSaving}>{credSaving ? "Saving…" : "Save"}</Btn>
                            <Btn variant="outline" onClick={() => { setAddingCred(false); setNewCred({ title:"", institution:"", year:"" }); }}>Cancel</Btn>
                          </div>
                        </div>
                      )}

                      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", display:"flex", flexDirection:"column", gap:"12px" }}>
                        {(doctor.credentials || []).length === 0 && (
                          <p style={{ color:C.textSecondary, fontFamily:F.body, fontSize:"14px" }}>No credentials added yet.</p>
                        )}
                        {(doctor.credentials || []).map((cred) => (
                          <EditableCredentialRow
                            key={cred.id}
                            cred={cred}
                            onSave={(updates) => handleUpdateCredential(cred.id, updates)}
                            onDelete={() => handleDeleteCredential(cred.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ═══ SPECIALIZATIONS ═══ */}
                  {activeTab === "specializations" && (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"4px" }}>
                        <div>
                          <div style={{ fontSize:"16px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display }}>Specializations</div>
                          <div style={{ fontSize:"13px", color:C.textSecondary, marginTop:"3px", fontFamily:F.body }}>Areas of expertise</div>
                        </div>
                        <Btn onClick={() => setAddingSpec(true)}><PlusIcon /> Add</Btn>
                      </div>

                      {addingSpec && (
                        <div style={{ display:"flex", gap:"8px", marginBottom:"16px", marginTop:"16px" }}>
                          <input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="e.g. Interventional Cardiology"
                            onKeyDown={e => { if (e.key === "Enter") handleAddSpec(); }}
                            style={{ flex:1, padding:"10px 14px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"8px", fontSize:"14px", color:C.textPrimary, fontFamily:F.body, outline:"none", boxSizing:"border-box" }} />
                          <Btn onClick={handleAddSpec} disabled={specSaving || !newSpec.trim()}>{specSaving ? "Adding…" : "Add"}</Btn>
                          <Btn variant="outline" onClick={() => { setAddingSpec(false); setNewSpec(""); }}>Cancel</Btn>
                        </div>
                      )}

                      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", display:"flex", flexWrap:"wrap", gap:"10px" }}>
                        {(doctor.specializations || []).length === 0 && (
                          <p style={{ color:C.textSecondary, fontFamily:F.body, fontSize:"14px" }}>No specializations added yet.</p>
                        )}
                        {(doctor.specializations || []).map((spec, i) => (
                          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"8px 16px", background:"transparent", color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:"999px", fontSize:"13px", fontWeight:"600", fontFamily:F.body }}>
                            <HeartIcon /> {spec}
                            <button onClick={() => handleDeleteSpec(spec)}
                              style={{ background:"none", border:"none", cursor:"pointer", color:C.primary, fontSize:"16px", lineHeight:1, padding:"0 0 0 4px", display:"flex", alignItems:"center" }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Editable Credential Row ───────────────────────────────────────────────────
const EditableCredentialRow = ({ cred, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({ title: cred.title, institution: cred.institution, year: cred.year });
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:"16px", padding:"18px 20px", background:C.bg, borderRadius:"12px", border:`1px solid ${C.border}` }}>
      <div style={{ width:"40px", height:"40px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color:C.primary, flexShrink:0 }}>
        {credIcon(cred.title)}
      </div>
      <div style={{ flex:1 }}>
        {editing ? (
          <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr", gap:"10px" }}>
            {[
              { key:"title",       placeholder:"Degree / Title" },
              { key:"institution", placeholder:"Institution"     },
              { key:"year",        placeholder:"Year"            },
            ].map(({ key, placeholder }) => (
              <input key={key} value={draft[key]} placeholder={placeholder} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
                style={{ padding:"9px 12px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"8px", fontSize:"13px", color:C.textPrimary, fontFamily:F.body, outline:"none", boxSizing:"border-box" }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ fontSize:"15px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display }}>{cred.title}</div>
            <div style={{ fontSize:"13px", color:C.textSecondary, marginTop:"3px", fontFamily:F.body }}>{cred.institution}</div>
            <div style={{ fontSize:"12px", color:C.textSecondary, marginTop:"2px", fontFamily:F.body }}>{cred.year}</div>
          </>
        )}
      </div>
      <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
        {editing ? (
          <>
            <Btn onClick={handleSave} disabled={saving} style={{ padding:"6px 12px", fontSize:"12px" }}>{saving ? "…" : "Save"}</Btn>
            <Btn variant="outline" onClick={() => { setEditing(false); setDraft({ title:cred.title, institution:cred.institution, year:cred.year }); }} style={{ padding:"6px 12px", fontSize:"12px" }}>Cancel</Btn>
          </>
        ) : (
          <>
            <Btn variant="outline" onClick={() => setEditing(true)} style={{ padding:"6px 10px", fontSize:"12px" }}><EditIcon /></Btn>
            <Btn variant="danger"  onClick={onDelete}               style={{ padding:"6px 10px", fontSize:"12px" }}><TrashIcon /></Btn>
          </>
        )}
      </div>
    </div>
  );
};

// ── Consultation Hours Editor (self-contained, saves independently) ────────────
const ConsultationHoursEditor = ({ hours, onSave }) => {
  const [local,   setLocal]   = useState(hours);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => { setLocal(hours); }, [hours]);

  const TIME_OPTS = ["Closed","Open 24hrs","06:00 AM","06:30 AM","07:00 AM","07:30 AM","08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM","06:30 PM","07:00 PM","07:30 PM","08:00 PM","09:00 PM","10:00 PM"];

  const setH = (key, val) => setLocal(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    setEditing(false);
  };

  const selectStyle = { width:"100%", padding:"7px 8px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"7px", fontSize:"12px", color:C.textPrimary, fontFamily:F.body, outline:"none", cursor:"pointer", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px", marginBottom:"14px" }}>
        {[
          { key:"weekdays",  label:"Weekdays"  },
          { key:"saturdays", label:"Saturdays" },
          { key:"sundays",   label:"Sundays"   },
        ].map(({ key, label }) => {
          const val      = local[key] || "Closed";
          const isClosed = val === "Closed";
          const isOpen24 = val === "Open 24hrs";
          const parts    = val.includes(" - ") ? val.split(" - ") : ["09:00 AM","05:00 PM"];
          return (
            <div key={key} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px 18px" }}>
              <div style={{ fontSize:"11px", color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.8px", fontFamily:F.body, marginBottom:"8px" }}>{label}</div>
              {editing ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  <select style={selectStyle} value={isClosed ? "Closed" : isOpen24 ? "Open 24hrs" : "Open"}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "Closed") setH(key, "Closed");
                      else if (v === "Open 24hrs") setH(key, "Open 24hrs");
                      else setH(key, `${parts[0] || "09:00 AM"} - ${parts[1] || "05:00 PM"}`);
                    }}>
                    <option value="Open">Open</option>
                    <option value="Open 24hrs">Open 24 hrs</option>
                    <option value="Closed">Closed</option>
                  </select>
                  {!isClosed && !isOpen24 && (
                    <>
                      <select style={selectStyle} value={parts[0]} onChange={e => setH(key, `${e.target.value} - ${parts[1]}`)}>
                        {TIME_OPTS.filter(t => !["Closed","Open 24hrs"].includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select style={selectStyle} value={parts[1]} onChange={e => setH(key, `${parts[0]} - ${e.target.value}`)}>
                        {TIME_OPTS.filter(t => !["Closed","Open 24hrs"].includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ fontSize:"14px", fontWeight:"600", color:C.textPrimary, fontFamily:F.body }}>{val}</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:"8px" }}>
        {editing ? (
          <>
            <Btn onClick={handleSave} disabled={saving}><SaveIcon />{saving ? "Saving…" : "Save Hours"}</Btn>
            <Btn variant="outline" onClick={() => { setLocal(hours); setEditing(false); }}>Cancel</Btn>
          </>
        ) : (
          <Btn variant="outline" onClick={() => setEditing(true)}><EditIcon /> Edit Hours</Btn>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
