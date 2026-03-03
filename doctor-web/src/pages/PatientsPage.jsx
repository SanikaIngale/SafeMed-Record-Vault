import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#F0F4F3", primary: "#1C4A3E", primaryLight: "#2D6A5A",
  primaryGhost: "#E8F2EF", error: "#C62828",
  textPrimary: "#1A1A1A", textSecondary: "#6B7280",
  border: "#E5E7EB", white: "#FFFFFF",
};
const F = {
  display: "'Georgia','Times New Roman',serif",
  body: "'Helvetica Neue',Arial,sans-serif",
};
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "??";

const avatarColor = (name) => {
  const palette = ["#1C4A3E","#1565C0","#6A1B9A","#00695C","#4E342E","#283593","#AD1457","#00838F"];
  let h = 0;
  for (let ch of (name || "")) h = (h + ch.charCodeAt(0)) % palette.length;
  return palette[h];
};

const safeStr = (val, fallback = "—") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string")  return val.trim() || fallback;
  if (typeof val === "number")  return String(val);
  if (typeof val === "object")  return val.name || val.condition || val.label || val.value || fallback;
  return String(val);
};

/** "2d left" / "5h left" / "30m left" / "Expired" */
const timeLeft = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso) - Date.now();
  if (ms <= 0) return "Expired";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (d  >= 1) return `${d}d left`;
  if (h  >= 1) return `${h}h left`;
  return `${m}m left`;
};

const expiryChipColor = (iso) => {
  if (!iso) return { color: C.textSecondary, bg: C.bg, border: C.border };
  const ms = new Date(iso) - Date.now();
  if (ms <= 0)       return { color: "#9E9E9E", bg: "#F5F5F5",  border: "#E0E0E0" };
  if (ms < 3_600_000)  return { color: "#C62828", bg: "#FFEBEE",  border: "#FFCDD2" }; // < 1 h
  if (ms < 86_400_000) return { color: "#E65100", bg: "#FFF3E0",  border: "#FFCC80" }; // < 1 d
  return                      { color: "#2E7D32", bg: "#E8F5E9",  border: "#A5D6A7" }; // > 1 d
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
const ChevronIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const CheckSmIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ClockIcon    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// ── Access chip shown in the Consent column ───────────────────────────────────
const AccessChip = ({ expiresAt }) => {
  const label = timeLeft(expiresAt);
  const chip  = expiryChipColor(expiresAt);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
      {/* "Granted" green pill */}
      <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"4px 10px", background:"#E8F5E9", color:"#2E7D32", border:"1.5px solid #A5D6A7", borderRadius:"999px", fontSize:"12px", fontWeight:"600", fontFamily:F.body, whiteSpace:"nowrap" }}>
        <CheckSmIcon /> Granted
      </span>
      {/* Expiry countdown pill */}
      {label && (
        <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"3px 8px", background:chip.bg, color:chip.color, border:`1.5px solid ${chip.border}`, borderRadius:"999px", fontSize:"11px", fontWeight:"700", fontFamily:F.body, whiteSpace:"nowrap" }}>
          <ClockIcon /> {label}
        </span>
      )}
    </div>
  );
};

const SkeletonRow = () => (
  <tr>
    {[220, 60, 90, 55, 130, 80, 50].map((w, i) => (
      <td key={i} style={{ padding:"18px 16px" }}>
        <div style={{ height:"13px", width:`${w}px`, background:"#E5E7EB", borderRadius:"6px", animation:"pulse 1.4s ease-in-out infinite" }} />
      </td>
    ))}
  </tr>
);

// ── Sidebar (unchanged) ───────────────────────────────────────────────────────
const Sidebar = ({ active, onNav, onLogout }) => {
  const navItems = [
    { key:"dashboard", label:"Dashboard",  icon:<HomeIcon />     },
    { key:"patients",  label:"My Patients", icon:<PatientsIcon /> },
    { key:"profile",   label:"My Profile",  icon:<ProfileIcon />  },
  ];
  return (
    <div style={{ width:"240px", minHeight:"100vh", flexShrink:0, background:C.primary, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"28px 24px 24px", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"36px", height:"36px", background:"rgba(255,255,255,0.15)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="11" y="2" width="2" height="20" rx="1" fill="white"/>
              <rect x="2" y="11" width="20" height="2" rx="1" fill="white"/>
              <circle cx="12" cy="12" r="2.5" fill="white"/>
            </svg>
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
            style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", marginBottom:"4px", background:active===item.key?"rgba(255,255,255,0.15)":"transparent", border:"none", cursor:"pointer", color:active===item.key?"#fff":"rgba(255,255,255,0.6)", fontSize:"14px", fontWeight:active===item.key?"600":"400", fontFamily:F.body, textAlign:"left", transition:"background 0.2s,color 0.2s" }}
            onMouseEnter={e=>{ if(active!==item.key){e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#fff";}}}
            onMouseLeave={e=>{ if(active!==item.key){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}}
          >{item.icon} {item.label}</button>
        ))}
      </nav>
      <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", background:"transparent", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.55)", fontSize:"14px", fontFamily:F.body, textAlign:"left", transition:"background 0.2s,color 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.55)";}}
        ><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
};

// ── PatientsPage ──────────────────────────────────────────────────────────────
const PatientsPage = () => {
  const navigate = useNavigate();

  const [patients,     setPatients]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [doctorData,   setDoctorData]   = useState(null);

  // ⭐ Tick every 60 s so the countdown chips re-render without a page refresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("doctorData");
      if (raw) setDoctorData(JSON.parse(raw));
    } catch (_) {}

    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("doctor_token");
        if (!token) { navigate("/login"); return; }

        const res = await fetch(`${API_BASE}/api/doctors/my-patients`, {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("doctor_token");
          localStorage.removeItem("doctorData");
          navigate("/login");
          return;
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed to fetch patients");

        // ⭐ Also map expires_at so AccessChip can display it
        const mapped = (json.patients || []).map(p => ({
          id:         safeStr(p.patient_id),
          name:       safeStr(p.name, "Unknown"),
          age:        p.age ?? "—",
          gender:     p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "—",
          bloodType:  safeStr(p.bloodType),
          condition:  safeStr(p.condition),
          expires_at: p.expires_at || null,   // ⭐ from backend
        }));

        setPatients(mapped);
      } catch (err) {
        console.error("Fetch patients error:", err);
        setError(err.message || "Failed to load patients. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [navigate]);

  const handleNav    = (key) => { if (key === "dashboard") navigate("/dashboard"); else if (key === "profile") navigate("/profile"); };
  const handleLogout = ()    => { localStorage.removeItem("doctor_token"); localStorage.removeItem("doctorData"); navigate("/login"); };

  const filtered = patients.filter(p => {
    const q = search.trim().toLowerCase();
    const matchSearch  = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.condition.toLowerCase().includes(q);
    const matchGender  = genderFilter === "All" || p.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const filterOptions     = ["All", "Male", "Female", "Other"];
  const doctorInitials    = doctorData?.name ? doctorData.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "DR";
  const doctorDisplayName = doctorData?.name ? `Dr. ${doctorData.name}` : "Doctor";
  const doctorSpec        = Array.isArray(doctorData?.specializations) ? doctorData.specializations[0] : (doctorData?.specializations || "Doctor");

  const th = { padding:"14px 16px", fontSize:"12px", fontWeight:"700", color:C.textSecondary, fontFamily:F.body, textTransform:"uppercase", letterSpacing:"0.7px", textAlign:"left", background:C.bg, borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse  { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        * { box-sizing:border-box; }
        .row-hover   { transition:background 0.15s; }
        .action-btn:hover { background:${C.primaryGhost} !important; color:${C.primary} !important; }
        .filter-opt:hover { background:${C.primaryGhost} !important; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:F.body }}>
        <Sidebar active="patients" onNav={handleNav} onLogout={handleLogout} />

        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>

          {/* Top bar */}
          <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <div style={{ fontSize:"20px", fontWeight:"800", color:C.textPrimary, fontFamily:F.display }}>My Patients</div>
              <div style={{ fontSize:"12px", color:C.textSecondary, marginTop:"2px" }}>Patients who have approved your access request</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ cursor:"pointer" }}><BellIcon /></div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={() => navigate("/profile")}>
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"800", color:"#fff" }}>{doctorInitials}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:C.textPrimary, lineHeight:1.2 }}>{doctorDisplayName}</div>
                  <div style={{ fontSize:"11px", color:C.textSecondary }}>{doctorSpec}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding:"28px 32px", flex:1, animation:"fadeUp 0.4s ease" }}>

            {/* Controls */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:"10px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"10px", padding:"0 16px", height:"44px", boxShadow:"0 1px 4px rgba(28,74,62,0.05)" }}>
                <span style={{ color:C.textSecondary, display:"flex", flexShrink:0 }}><SearchIcon /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or condition..."
                  style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:"14px", color:C.textPrimary, fontFamily:F.body }} />
              </div>

              <div style={{ position:"relative" }}>
                <button onClick={() => setFilterOpen(o => !o)}
                  style={{ display:"flex", alignItems:"center", gap:"8px", padding:"0 16px", height:"44px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"10px", cursor:"pointer", fontSize:"14px", fontWeight:"500", color:C.textPrimary, fontFamily:F.body, boxShadow:"0 1px 4px rgba(28,74,62,0.05)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <FilterIcon /> {genderFilter === "All" ? "All Genders" : genderFilter} <ChevronIcon />
                </button>
                {filterOpen && (
                  <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:C.white, border:`1px solid ${C.border}`, borderRadius:"10px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:100, minWidth:"150px", overflow:"hidden" }}>
                    {filterOptions.map(opt => (
                      <button key={opt} className="filter-opt"
                        onClick={() => { setGenderFilter(opt); setFilterOpen(false); }}
                        style={{ width:"100%", padding:"10px 16px", background:genderFilter===opt?C.primaryGhost:"transparent", border:"none", textAlign:"left", fontSize:"13px", fontFamily:F.body, color:genderFilter===opt?C.primary:C.textPrimary, fontWeight:genderFilter===opt?"600":"400", cursor:"pointer" }}
                      >{opt === "All" ? "All Genders" : opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"10px", padding:"14px 20px", marginBottom:"20px", color:C.error, fontSize:"14px", display:"flex", alignItems:"center", gap:"10px" }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Table */}
            <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, boxShadow:"0 2px 8px rgba(28,74,62,0.05)", overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, paddingLeft:"24px" }}>Patient</th>
                    <th style={th}>ID</th>
                    <th style={th}>Age / Gender</th>
                    <th style={th}>Blood Type</th>
                    <th style={th}>Condition</th>
                    <th style={th}>Access</th>
                    <th style={{ ...th, textAlign:"right", paddingRight:"24px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding:"64px", textAlign:"center", color:C.textSecondary }}>
                        <div style={{ fontSize:"36px", marginBottom:"12px" }}>🩺</div>
                        <div style={{ fontSize:"15px", fontWeight:"600", color:C.textPrimary, marginBottom:"6px" }}>
                          {patients.length === 0 ? "No patients yet" : "No patients match your search"}
                        </div>
                        <div style={{ fontSize:"13px" }}>
                          {patients.length === 0
                            ? "Send access requests from the Dashboard. They will appear here once a patient approves."
                            : "Try adjusting your search or filter."}
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((p, i) => (
                    <tr key={p.id} className="row-hover"
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background:hoveredRow===p.id?"#F8FBF9":C.white, borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none" }}
                    >
                      <td style={{ padding:"16px 16px 16px 24px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                          <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:avatarColor(p.name), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
                            {getInitials(p.name)}
                          </div>
                          <span style={{ fontSize:"14px", fontWeight:"600", color:C.textPrimary }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"16px", fontSize:"13px", color:C.textSecondary }}>{p.id}</td>
                      <td style={{ padding:"16px", fontSize:"13px", color:C.textPrimary }}>{p.age} / {p.gender}</td>
                      <td style={{ padding:"16px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:"40px", height:"28px", padding:"0 8px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:"999px", fontSize:"12px", fontWeight:"700", color:C.textPrimary }}>
                          {p.bloodType}
                        </span>
                      </td>
                      <td style={{ padding:"16px", fontSize:"14px", color:C.textPrimary }}>{p.condition}</td>
                      {/* ⭐ Access column with expiry countdown */}
                      <td style={{ padding:"16px" }}>
                        <AccessChip expiresAt={p.expires_at} />
                      </td>
                      <td style={{ padding:"16px 24px 16px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"flex-end" }}>
                          <button className="action-btn" title="View patient records"
                            onClick={() => navigate(`/patients/${p.id}`)}
                            style={{ width:"32px", height:"32px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textSecondary, transition:"background 0.15s,color 0.15s" }}>
                            <EyeIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && (
                <div style={{ padding:"14px 24px", borderTop:`1px solid ${C.border}`, background:C.bg }}>
                  <span style={{ fontSize:"13px", color:C.textSecondary }}>
                    Showing <strong style={{ color:C.textPrimary }}>{filtered.length}</strong> of{" "}
                    <strong style={{ color:C.textPrimary }}>{patients.length}</strong> patients
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientsPage;