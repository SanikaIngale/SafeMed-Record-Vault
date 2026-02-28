import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4F3",
  primary: "#1C4A3E",
  primaryLight: "#2D6A5A",
  primaryGhost: "#E8F2EF",
  error: "#C62828",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  inputBg: "#F9FAFB",
  white: "#FFFFFF",
};
const F = { display: "'Georgia','Times New Roman',serif", body: "'Helvetica Neue',Arial,sans-serif" };

// ── Doctor data (from JSON database) ─────────────────────────────────────────
const INITIAL = {
  full_name:     "Dr. Anya Sharma",
  email_address: "anya.sharma@hospital.com",
  phone_number:  "+91 9876543210",
  date_of_birth: "1985-08-12",
  address: {
    hospital_name: "General Hospital",
    street:        "42 Health Avenue",
    city:          "Mumbai",
    state:         "Maharashtra",
    postal_code:   "400001",
    country:       "India",
  },
  professional_credentials: [
    { title: "MBBS",                           institution: "AIIMS, Delhi",                          year: "2010"         },
    { title: "MD - General Medicine",          institution: "Grant Medical College, Mumbai",          year: "2013"         },
    { title: "Fellowship - Internal Medicine", institution: "Royal College of Physicians, London",    year: "2016"         },
    { title: "Senior Consultant",              institution: "General Hospital, Mumbai",               year: "2018-Present" },
  ],
  specializations: ["General Medicine", "Internal Medicine", "Diabetes Management", "Preventive Healthcare"],
  consultation_hours: {
    weekdays:  "09:00 AM - 05:00 PM",
    saturdays: "09:00 AM - 01:00 PM",
    sundays:   "Closed",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name.replace("Dr. ", "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const formatDOB = (iso) => {
  if (!iso || !iso.includes("-")) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const RecordsIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const PatientsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ProfileIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogoutIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const BellIcon     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const SearchIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const EditIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const SaveIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const MailIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const PhoneIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const CalIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const PinIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const CheckSmIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const HeartIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const ClockIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const DegIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const FelIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
const BriIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;

const credIcon = (title) => {
  const t = title.toLowerCase();
  if (t.includes("consultant") || t.includes("senior")) return <BriIcon />;
  if (t.includes("fellowship") || t.includes("fellow")) return <FelIcon />;
  return <DegIcon />;
};

// ── Sidebar (shared with Dashboard) ──────────────────────────────────────────
const Sidebar = ({ active, onNav, onLogout }) => {
  const navItems = [
    { key: "dashboard", label: "Dashboard",  icon: <HomeIcon />    },
    { key: "profile",   label: "My Profile", icon: <ProfileIcon /> },
  ];
  return (
    <div style={{ width: "240px", minHeight: "100vh", flexShrink: 0, background: C.primary, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.15)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="11" y="2" width="2" height="20" rx="1" fill="white"/>
              <rect x="2" y="11" width="20" height="2" rx="1" fill="white"/>
              <circle cx="12" cy="12" r="2.5" fill="white"/>
            </svg>
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
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", marginBottom: "4px", background: active === item.key ? "rgba(255,255,255,0.15)" : "transparent", border: "none", cursor: "pointer", color: active === item.key ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: active === item.key ? "600" : "400", fontFamily: F.body, textAlign: "left", transition: "background 0.2s, color 0.2s" }}
            onMouseEnter={e => { if (active !== item.key) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (active !== item.key) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}}
          >{item.icon} {item.label}</button>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: "14px", fontFamily: F.body, textAlign: "left", transition: "background 0.2s, color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        ><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
};

// ── Shared Field component ────────────────────────────────────────────────────
const Field = ({ label, icon, value, editing, focusKey, focused, onFocus, onBlur, onChange }) => (
  <div>
    <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: C.textPrimary, marginBottom: "8px", fontFamily: F.body }}>{label}</label>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: "13px", color: C.textSecondary, display: "flex", pointerEvents: "none", zIndex: 1 }}>{icon}</span>
      <input
        value={value}
        readOnly={!editing}
        onFocus={onFocus} onBlur={onBlur} onChange={onChange}
        style={{
          width: "100%", padding: "11px 14px 11px 38px",
          background: C.white,
          border: `1px solid ${editing && focused === focusKey ? C.primary : C.border}`,
          borderRadius: "8px", fontSize: "14px",
          color: C.textPrimary, fontFamily: F.body, outline: "none",
          boxSizing: "border-box",
          boxShadow: editing && focused === focusKey ? "0 0 0 3px rgba(28,74,62,0.1)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          cursor: editing ? "text" : "default",
        }}
      />
    </div>
  </div>
);

// ── ProfilePage ───────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor]   = useState(INITIAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [focused, setFocused] = useState(null);
  const [saved, setSaved]     = useState(false);

  const handleNav = (key) => {
    if (key === "dashboard") { navigate("/dashboard"); return; }
    if (key === "profile")   { return; } // already here
    navigate("/dashboard");
  };

  const startEdit  = () => { setDraft(JSON.parse(JSON.stringify(doctor))); setEditing(true); setSaved(false); };
  const cancelEdit = () => { setDraft(null); setEditing(false); };
  const saveEdit   = () => { setDoctor(draft); setEditing(false); setDraft(null); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const d    = editing ? draft : doctor;
  const setF = (k, v) => setDraft(p => ({ ...p, [k]: v }));
  const setA = (k, v) => setDraft(p => ({ ...p, address: { ...p.address, [k]: v } }));
  const setH = (k, v) => setDraft(p => ({ ...p, consultation_hours: { ...p.consultation_hours, [k]: v } }));
  const setCred = (i, k, v) => setDraft(p => {
    const arr = [...p.professional_credentials];
    arr[i] = { ...arr[i], [k]: v };
    return { ...p, professional_credentials: arr };
  });

  const tabs = [
    { key: "personal",        label: "Personal Info"   },
    { key: "credentials",     label: "Credentials"     },
    { key: "specializations", label: "Specializations" },
  ];

  const addressStr = `${d.address.hospital_name}, ${d.address.street}, ${d.address.city}, ${d.address.state} ${d.address.postal_code}`;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        * { box-sizing:border-box; }
        input[readonly] { cursor:default; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: F.body }}>

        {/* ── Sidebar ── */}
        <Sidebar active="profile" onNav={handleNav} onLogout={() => navigate("/login")} />

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 32px", animation: "fadeUp 0.4s ease" }}>

              {/* ── Profile banner card ── */}
              <div style={{ background: C.white, borderRadius: "16px", border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: "18px", boxShadow: "0 2px 8px rgba(28,74,62,0.05)", position: "relative" }}>
                {/* Green banner */}
                <div style={{ height: "130px", background: `linear-gradient(135deg, ${C.primary} 0%, #2D6A5A 65%, #3D8B6E 100%)` }} />

                {/* Avatar — absolutely positioned, half over green, half over white */}
                <div style={{ position: "absolute", top: "86px", left: "32px", width: "88px", height: "88px", borderRadius: "50%", background: "#D97706", border: "4px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "800", color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 1 }}>
                  {getInitials(doctor.full_name)}
                </div>

                {/* Info row — left padding accounts for avatar width */}
                <div style={{ padding: "10px 28px 22px 140px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", minHeight: "80px" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: C.textPrimary, fontFamily: F.display, margin: "0 0 4px" }}>{doctor.full_name}</h2>
                    <p style={{ fontSize: "13px", color: C.textSecondary, margin: "0 0 10px", fontFamily: F.body }}>
                      {doctor.specializations[0]} | {doctor.professional_credentials.filter(c => !String(c.year).includes("Present")).map(c => c.title).slice(0, 2).join(", ")}
                    </p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: "#2E7D32", background: "#E8F5E9", border: "1.5px solid #A5D6A7", padding: "4px 12px", borderRadius: "999px", fontFamily: F.body }}>
                        <CheckSmIcon /> Verified
                      </span>
                      <span style={{ fontSize: "12px", color: C.textSecondary, background: C.bg, border: `1px solid ${C.border}`, padding: "4px 12px", borderRadius: "999px", fontFamily: F.body }}>
                        {doctor.address.hospital_name}
                      </span>
                    </div>
                  </div>

                  {/* Edit / Save / Cancel */}
                  <div style={{ display: "flex", gap: "10px", paddingBottom: "4px" }}>
                    {editing ? (
                      <>
                        <button onClick={cancelEdit}
                          style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: "600", fontFamily: F.body, color: C.textSecondary, cursor: "pointer", transition: "border-color 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = C.textSecondary}
                          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                        >Cancel</button>
                        <button onClick={saveEdit}
                          style={{ padding: "9px 20px", background: C.primary, border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", fontFamily: F.body, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", transition: "background 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
                          onMouseLeave={e => e.currentTarget.style.background = C.primary}
                        ><SaveIcon /> Save Changes</button>
                      </>
                    ) : (
                      <button onClick={startEdit}
                        style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: "600", fontFamily: F.body, color: C.textPrimary, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", transition: "border-color 0.2s, background 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primaryGhost; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
                      ><EditIcon /> Edit Profile</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Saved toast */}
              {saved && (
                <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", color: "#2E7D32", padding: "10px 18px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", fontFamily: F.body, display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckSmIcon /> Profile saved successfully.
                </div>
              )}

              {/* ── Tabs ── */}
              <div style={{ display: "flex", gap: "0", marginBottom: "16px", background: C.white, borderRadius: "10px", border: `1px solid ${C.border}`, padding: "4px", boxShadow: "0 1px 4px rgba(28,74,62,0.04)" }}>
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{ flex: 1, padding: "10px 16px", border: "none", borderRadius: "7px", background: activeTab === tab.key ? C.primaryGhost : "transparent", color: activeTab === tab.key ? C.primary : C.textSecondary, fontSize: "13px", fontWeight: activeTab === tab.key ? "700" : "500", fontFamily: F.body, cursor: "pointer", borderBottom: activeTab === tab.key ? `2px solid ${C.primary}` : "2px solid transparent", transition: "background 0.2s, color 0.2s" }}
                  >{tab.label}</button>
                ))}
              </div>

              {/* ── Tab content ── */}
              <div style={{ background: C.white, borderRadius: "14px", border: `1px solid ${C.border}`, padding: "28px 32px", boxShadow: "0 2px 8px rgba(28,74,62,0.05)" }}>

                {/* ═══ PERSONAL INFO ═══ */}
                {activeTab === "personal" && (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display }}>Personal Information</div>
                    <div style={{ fontSize: "13px", color: C.textSecondary, marginTop: "3px", marginBottom: "20px", fontFamily: F.body }}>Update your personal details</div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "24px" }}>

                      {/* Full Name + Email */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                        <Field label="Full Name" icon={<span style={{ fontSize: "13px" }}>👤</span>}
                          value={d.full_name} editing={editing} focusKey="name" focused={focused}
                          onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                          onChange={e => setF("full_name", e.target.value)} />
                        <Field label="Email Address" icon={<MailIcon />}
                          value={d.email_address} editing={editing} focusKey="email" focused={focused}
                          onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                          onChange={e => setF("email_address", e.target.value)} />
                      </div>

                      {/* Phone + DOB */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                        <Field label="Phone Number" icon={<PhoneIcon />}
                          value={d.phone_number} editing={editing} focusKey="phone" focused={focused}
                          onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                          onChange={e => setF("phone_number", e.target.value)} />
                        <Field label="Date of Birth" icon={<CalIcon />}
                          value={editing ? d.date_of_birth : formatDOB(d.date_of_birth)}
                          editing={editing} focusKey="dob" focused={focused}
                          onFocus={() => setFocused("dob")} onBlur={() => setFocused(null)}
                          onChange={e => setF("date_of_birth", e.target.value)} />
                      </div>

                      {/* Address */}
                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: C.textPrimary, marginBottom: "8px", fontFamily: F.body }}>Address</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "13px", top: "13px", color: C.textSecondary, display: "flex", pointerEvents: "none", zIndex: 1 }}><PinIcon /></span>
                          <textarea readOnly value={addressStr} rows={2}
                            style={{ width: "100%", padding: "11px 14px 11px 38px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "14px", color: C.textPrimary, fontFamily: F.body, outline: "none", resize: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        {editing && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "14px" }}>
                            {[
                              { field: "hospital_name", label: "Hospital / Clinic", fk: "ah" },
                              { field: "street",         label: "Street",            fk: "as" },
                              { field: "city",           label: "City",              fk: "ac" },
                              { field: "state",          label: "State",             fk: "ast"},
                              { field: "postal_code",    label: "Postal Code",       fk: "ap" },
                              { field: "country",        label: "Country",           fk: "aco"},
                            ].map(({ field, label, fk }) => (
                              <div key={field}>
                                <label style={{ display: "block", fontSize: "11px", color: C.textSecondary, marginBottom: "4px", fontFamily: F.body, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                                <input value={d.address[field]} onChange={e => setA(field, e.target.value)}
                                  onFocus={() => setFocused(fk)} onBlur={() => setFocused(null)}
                                  style={{ width: "100%", padding: "8px 11px", background: C.white, border: `1px solid ${focused === fk ? C.primary : C.border}`, borderRadius: "7px", fontSize: "13px", color: C.textPrimary, fontFamily: F.body, outline: "none", boxSizing: "border-box", boxShadow: focused === fk ? "0 0 0 3px rgba(28,74,62,0.1)" : "none" }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* ═══ CREDENTIALS ═══ */}
                {activeTab === "credentials" && (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display }}>Professional Credentials</div>
                    <div style={{ fontSize: "13px", color: C.textSecondary, marginTop: "3px", marginBottom: "20px", fontFamily: F.body }}>Your qualifications and registrations</div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      {d.professional_credentials.map((cred, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "18px 20px", background: C.bg, borderRadius: "12px", border: `1px solid ${C.border}` }}>
                          <div style={{ width: "40px", height: "40px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, flexShrink: 0 }}>
                            {credIcon(cred.title)}
                          </div>
                          <div style={{ flex: 1 }}>
                            {editing ? (
                              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: "10px" }}>
                                {[
                                  { field: "title",       placeholder: "Degree / Title",  fk: `ct${i}` },
                                  { field: "institution", placeholder: "Institution",      fk: `ci${i}` },
                                  { field: "year",        placeholder: "Year",             fk: `cy${i}` },
                                ].map(({ field, placeholder, fk }) => (
                                  <input key={field} value={d.professional_credentials[i][field]}
                                    placeholder={placeholder}
                                    onChange={e => setCred(i, field, e.target.value)}
                                    onFocus={() => setFocused(fk)} onBlur={() => setFocused(null)}
                                    style={{ padding: "9px 12px", background: C.white, border: `1px solid ${focused === fk ? C.primary : C.border}`, borderRadius: "8px", fontSize: "13px", color: C.textPrimary, fontFamily: F.body, outline: "none", boxSizing: "border-box", boxShadow: focused === fk ? "0 0 0 3px rgba(28,74,62,0.1)" : "none" }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <>
                                <div style={{ fontSize: "15px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display }}>{cred.title}</div>
                                <div style={{ fontSize: "13px", color: C.textSecondary, marginTop: "3px", fontFamily: F.body }}>{cred.institution}</div>
                                <div style={{ fontSize: "12px", color: C.textSecondary, marginTop: "2px", fontFamily: F.body }}>{cred.year}</div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ SPECIALIZATIONS ═══ */}
                {activeTab === "specializations" && (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: C.textPrimary, fontFamily: F.display }}>Specializations</div>
                    <div style={{ fontSize: "13px", color: C.textSecondary, marginTop: "3px", marginBottom: "20px", fontFamily: F.body }}>Areas of expertise</div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "24px" }}>

                      {/* Pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                        {d.specializations.map((spec, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: "999px", fontSize: "13px", fontWeight: "600", fontFamily: F.body }}>
                            <HeartIcon /> {spec}
                            {editing && (
                              <button
                                onClick={() => { const arr = [...draft.specializations]; arr.splice(i, 1); setDraft(p => ({ ...p, specializations: arr })); }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: "16px", lineHeight: 1, padding: "0 0 0 4px", display: "flex", alignItems: "center" }}>×</button>
                            )}
                          </span>
                        ))}
                        {editing && (
                          <button
                            onClick={() => { const s = prompt("Add specialization:"); if (s?.trim()) setDraft(p => ({ ...p, specializations: [...p.specializations, s.trim()] })); }}
                            style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.border}`, borderRadius: "999px", fontSize: "13px", color: C.textSecondary, fontFamily: F.body, cursor: "pointer", transition: "border-color 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                          >+ Add</button>
                        )}
                      </div>

                      {/* Consultation Hours */}
                      <div style={{ fontSize: "14px", fontWeight: "600", color: C.textPrimary, fontFamily: F.body, marginBottom: "14px", display: "flex", alignItems: "center", gap: "7px" }}>
                        <ClockIcon /> Consultation Hours
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                        {[
                          { key: "weekdays",  label: "Weekdays"  },
                          { key: "saturdays", label: "Saturdays" },
                          { key: "sundays",   label: "Sundays"   },
                        ].map(({ key, label }) => {
                          const TIME_OPTS = ["Closed", "Open 24hrs", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "09:00 PM", "10:00 PM"];
                          const val = d.consultation_hours[key];
                          const isClosed = val === "Closed";
                          const isOpen24 = val === "Open 24hrs";
                          const parts = val && val.includes(" - ") ? val.split(" - ") : ["", ""];
                          const startVal = parts[0] || "";
                          const endVal   = parts[1] || "";

                          const selectStyle = {
                            width: "100%", padding: "7px 8px", background: C.white,
                            border: `1px solid ${C.border}`, borderRadius: "7px",
                            fontSize: "12px", color: C.textPrimary, fontFamily: F.body,
                            outline: "none", cursor: "pointer", boxSizing: "border-box",
                          };

                          return (
                            <div key={key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 18px" }}>
                              <div style={{ fontSize: "11px", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: F.body, marginBottom: "8px" }}>{label}</div>
                              {editing ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {/* Status: Open / Closed */}
                                  <select
                                    value={isClosed ? "Closed" : isOpen24 ? "Open 24hrs" : "Open"}
                                    onChange={e => {
                                      const v = e.target.value;
                                      if (v === "Closed")     setH(key, "Closed");
                                      else if (v === "Open 24hrs") setH(key, "Open 24hrs");
                                      else setH(key, `${startVal || "09:00 AM"} - ${endVal || "05:00 PM"}`);
                                    }}
                                    style={selectStyle}
                                  >
                                    <option value="Open">Open</option>
                                    <option value="Open 24hrs">Open 24 hrs</option>
                                    <option value="Closed">Closed</option>
                                  </select>

                                  {/* Start / End time — shown only when Open */}
                                  {!isClosed && !isOpen24 && (
                                    <>
                                      <select value={startVal}
                                        onChange={e => setH(key, `${e.target.value} - ${endVal || "05:00 PM"}`)}
                                        style={selectStyle}
                                      >
                                        <option value="" disabled>From</option>
                                        {TIME_OPTS.filter(t => !["Closed","Open 24hrs"].includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                      <select value={endVal}
                                        onChange={e => setH(key, `${startVal || "09:00 AM"} - ${e.target.value}`)}
                                        style={selectStyle}
                                      >
                                        <option value="" disabled>To</option>
                                        {TIME_OPTS.filter(t => !["Closed","Open 24hrs"].includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div style={{ fontSize: "14px", fontWeight: "600", color: C.textPrimary, fontFamily: F.body }}>{d.consultation_hours[key]}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;