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
  white: "#FFFFFF",
};
const F = {
  display: "'Georgia','Times New Roman',serif",
  body: "'Helvetica Neue',Arial,sans-serif",
};

// ── Patient data ──────────────────────────────────────────────────────────────
const PATIENTS = [
  { id: "P001", name: "Ruchita Sharma", age: 30, gender: "Female", bloodGroup: "O+",  condition: "Migraine",         lastVisit: "05 Jul 2025", consent: "Granted"  },
  { id: "P002", name: "Arjun Mehta",    age: 45, gender: "Male",   bloodGroup: "B+",  condition: "Type 2 Diabetes",  lastVisit: "02 Feb 2026", consent: "Granted"  },
  { id: "P003", name: "Priya Patel",    age: 28, gender: "Female", bloodGroup: "A+",  condition: "Asthma",           lastVisit: "01 Feb 2026", consent: "Granted"  },
  { id: "P004", name: "Vikram Singh",   age: 62, gender: "Male",   bloodGroup: "AB-", condition: "Hypertension",     lastVisit: "07 Feb 2026", consent: "Granted"  },
  { id: "P005", name: "Meera Joshi",    age: 35, gender: "Female", bloodGroup: "O-",  condition: "Thyroid Disorder", lastVisit: "04 Feb 2026", consent: "Granted"  },
  { id: "P006", name: "Rahul Verma",    age: 50, gender: "Male",   bloodGroup: "A-",  condition: "COPD",             lastVisit: "31 Jan 2026", consent: "Granted"  },
  { id: "P007", name: "Sunita Devi",    age: 55, gender: "Female", bloodGroup: "B-",  condition: "Arthritis",        lastVisit: "29 Jan 2026", consent: "Expiring" },
  { id: "P008", name: "Neha Gupta",     age: 38, gender: "Female", bloodGroup: "AB+", condition: "Anemia",           lastVisit: "22 Jan 2026", consent: "Expiring" },
  { id: "P009", name: "Karan Shah",     age: 29, gender: "Male",   bloodGroup: "O+",  condition: "Back Pain",        lastVisit: "18 Jan 2026", consent: "Granted"  },
  { id: "P010", name: "Divya Nair",     age: 41, gender: "Female", bloodGroup: "A+",  condition: "Migraine",         lastVisit: "15 Jan 2026", consent: "Granted"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const avatarColor = (name) => {
  const palette = ["#1C4A3E", "#1565C0", "#6A1B9A", "#00695C", "#4E342E", "#283593", "#AD1457", "#00838F"];
  let h = 0;
  for (let ch of name) h = (h + ch.charCodeAt(0)) % palette.length;
  return palette[h];
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ProfileIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PatientsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const LogoutIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const BellIcon     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const SearchIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const FilterIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const EyeIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EditIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const ChevronIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const CheckSmIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ClockSmIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// ── Consent badge ─────────────────────────────────────────────────────────────
const ConsentBadge = ({ status }) => {
  const styles = {
    Granted:  { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7", icon: <CheckSmIcon /> },
    Expiring: { bg: "#FFF8E1", color: "#E65100", border: "#FFE082", icon: <ClockSmIcon /> },
    Pending:  { bg: "#FFF3E0", color: "#BF360C", border: "#FFCC80", icon: <ClockSmIcon /> },
  };
  const s = styles[status] || styles.Granted;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: s.bg, color: s.color, border: `1.5px solid ${s.border}`, borderRadius: "999px", fontSize: "12px", fontWeight: "600", fontFamily: F.body, whiteSpace: "nowrap" }}>
      {s.icon} {status}
    </span>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ active, onNav, onLogout }) => {
  const navItems = [
    { key: "dashboard", label: "Dashboard",  icon: <HomeIcon />     },
    { key: "patients",  label: "My Patients", icon: <PatientsIcon /> },
    { key: "profile",   label: "My Profile",  icon: <ProfileIcon />  },
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

// ── PatientsPage ──────────────────────────────────────────────────────────────
const PatientsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch]         = useState("");
  const [consentFilter, setConsentFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleNav = (key) => {
    if (key === "dashboard") navigate("/dashboard");
    else if (key === "profile") navigate("/profile");
  };

  const filtered = PATIENTS.filter(p => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.condition.toLowerCase().includes(q);
    const matchConsent = consentFilter === "All" || p.consent === consentFilter;
    return matchSearch && matchConsent;
  });

  const consentOptions = ["All", "Granted", "Expiring", "Pending"];

  // Column header style
  const th = { padding: "14px 16px", fontSize: "12px", fontWeight: "700", color: C.textSecondary, fontFamily: F.body, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", background: C.bg, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        * { box-sizing:border-box; }
        .row-hover { transition: background 0.15s; }
        .action-btn:hover { background: ${C.primaryGhost} !important; color: ${C.primary} !important; }
        .filter-opt:hover { background: ${C.primaryGhost} !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: F.body }}>

        {/* Sidebar */}
        <Sidebar active="patients" onNav={handleNav} onLogout={() => navigate("/login")} />

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* Top bar */}
          <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: C.textPrimary, fontFamily: F.display }}>My Patients</div>
              <div style={{ fontSize: "12px", color: C.textSecondary, marginTop: "2px", fontFamily: F.body }}>Patients under your care with active consent</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Bell */}
              <div style={{ position: "relative", cursor: "pointer" }}>
                <BellIcon />
                <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", background: C.error, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#fff", fontWeight: "700" }}>3</span>
              </div>
              {/* Doctor chip */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/profile")}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", color: "#fff" }}>AS</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: C.textPrimary, lineHeight: 1.2 }}>Dr. Anya Sharma</div>
                  <div style={{ fontSize: "11px", color: C.textSecondary }}>General Medicine</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 32px", flex: 1, animation: "fadeUp 0.4s ease" }}>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              {/* Search bar */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "0 16px", height: "44px", boxShadow: "0 1px 4px rgba(28,74,62,0.05)" }}>
                <span style={{ color: C.textSecondary, display: "flex", flexShrink: 0 }}><SearchIcon /></span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, ID, or condition..."
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "14px", color: C.textPrimary, fontFamily: F.body }}
                />
              </div>

              {/* Consent filter dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 16px", height: "44px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: C.textPrimary, fontFamily: F.body, boxShadow: "0 1px 4px rgba(28,74,62,0.05)", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <FilterIcon />
                  {consentFilter === "All" ? "All Status" : consentFilter}
                  <ChevronIcon />
                </button>
                {filterOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: "150px", overflow: "hidden" }}>
                    {consentOptions.map(opt => (
                      <button key={opt} className="filter-opt"
                        onClick={() => { setConsentFilter(opt); setFilterOpen(false); }}
                        style={{ width: "100%", padding: "10px 16px", background: consentFilter === opt ? C.primaryGhost : "transparent", border: "none", textAlign: "left", fontSize: "13px", fontFamily: F.body, color: consentFilter === opt ? C.primary : C.textPrimary, fontWeight: consentFilter === opt ? "600" : "400", cursor: "pointer" }}
                      >{opt === "All" ? "All Status" : opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table card */}
            <div style={{ background: C.white, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(28,74,62,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, paddingLeft: "24px" }}>Patient</th>
                    <th style={th}>ID</th>
                    <th style={th}>Age / Gender</th>
                    <th style={th}>Blood Group</th>
                    <th style={th}>Condition</th>
                    <th style={th}>Last Visit</th>
                    <th style={th}>Consent</th>
                    <th style={{ ...th, textAlign: "right", paddingRight: "24px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: C.textSecondary, fontFamily: F.body, fontSize: "14px" }}>
                        No patients found.
                      </td>
                    </tr>
                  ) : filtered.map((p, i) => (
                    <tr key={p.id}
                      className="row-hover"
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: hoveredRow === p.id ? "#F8FBF9" : C.white, borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                    >
                      {/* Patient */}
                      <td style={{ padding: "16px 16px 16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: avatarColor(p.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>
                            {getInitials(p.name)}
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: C.textPrimary, fontFamily: F.body }}>{p.name}</span>
                        </div>
                      </td>

                      {/* ID */}
                      <td style={{ padding: "16px", fontSize: "13px", color: C.textSecondary, fontFamily: F.body }}>{p.id}</td>

                      {/* Age / Gender */}
                      <td style={{ padding: "16px", fontSize: "13px", color: C.textPrimary, fontFamily: F.body }}>{p.age} / {p.gender}</td>

                      {/* Blood Group */}
                      <td style={{ padding: "16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "28px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "999px", fontSize: "12px", fontWeight: "700", color: C.textPrimary, fontFamily: F.body }}>
                          {p.bloodGroup}
                        </span>
                      </td>

                      {/* Condition */}
                      <td style={{ padding: "16px", fontSize: "14px", color: C.textPrimary, fontFamily: F.body }}>{p.condition}</td>

                      {/* Last Visit */}
                      <td style={{ padding: "16px", fontSize: "13px", color: C.textSecondary, fontFamily: F.body }}>{p.lastVisit}</td>

                      {/* Consent */}
                      <td style={{ padding: "16px" }}>
                        <ConsentBadge status={p.consent} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 24px 16px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                          <button className="action-btn"
                            title="View patient"
                            onClick={() => navigate(`/patients/${p.id}`)}
                            style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSecondary, transition: "background 0.15s, color 0.15s" }}>
                            <EyeIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer count */}
              <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, background: C.bg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: C.textSecondary, fontFamily: F.body }}>
                  Showing <strong style={{ color: C.textPrimary }}>{filtered.length}</strong> of <strong style={{ color: C.textPrimary }}>{PATIENTS.length}</strong> patients
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientsPage;