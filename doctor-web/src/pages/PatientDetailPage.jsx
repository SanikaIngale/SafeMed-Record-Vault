import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = "http://localhost:5001";

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4F3", primary: "#1C4A3E", primaryLight: "#2D6A5A",
  primaryGhost: "#E8F2EF", error: "#C62828",
  textPrimary: "#1A1A1A", textSecondary: "#6B7280",
  border: "#E5E7EB", white: "#FFFFFF",
};
const F = { display: "'Georgia','Times New Roman',serif", body: "'Helvetica Neue',Arial,sans-serif" };

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = n => (n || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const avatarColor = n => {
  const p = ["#1C4A3E","#1565C0","#6A1B9A","#00695C","#4E342E","#283593","#AD1457","#00838F"];
  let h = 0; for (let c of (n||"")) h = (h + c.charCodeAt(0)) % p.length; return p[h];
};
const parseJ = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return fallback; } }
  return v;
};
const calcAge = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  return Math.floor((new Date() - d) / (365.25 * 24 * 60 * 60 * 1000));
};
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Empty diagnosis template ──────────────────────────────────────────────────
const emptyDiag = () => ({ reason: "", primary: "", doctor_notes: "", severity: "Moderate", medications: [] });
const emptyMed = () => ({ name: "", dosage: "", frequency: "Once daily", duration: "", instructions: "" });

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PatientsIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ProfileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogoutIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const BackIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const BellIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const CalIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const BloodIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6 10 4 14 4 16a8 8 0 0 0 16 0c0-2-2-6-8-14z"/></svg>;
const WeightIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 20l1.5-7h11L19 20H5z"/></svg>;
const PhoneIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const RulerIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 8.7l-9 9a1 1 0 0 1-1.4 0l-6.6-6.6a1 1 0 0 1 0-1.4l9-9a1 1 0 0 1 1.4 0l6.6 6.6a1 1 0 0 1 0 1.4z"/></svg>;
const CheckSmIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const PlusIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TrashIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const UploadIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const FileIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const DiagIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const LabIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v6l-2 4v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8l-2-4V2"/><line x1="6" y1="10" x2="14" y2="10"/></svg>;
const HistoryIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SaveIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const ImageIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;

// ── Style helpers ─────────────────────────────────────────────────────────────
const inputSt = (focused) => ({
  width:"100%", padding:"10px 14px", background:C.white,
  border:`1px solid ${focused ? C.primary : C.border}`, borderRadius:"8px",
  fontSize:"14px", color:C.textPrimary, fontFamily:F.body, outline:"none",
  boxSizing:"border-box", boxShadow: focused ? "0 0 0 3px rgba(28,74,62,0.08)" : "none",
  transition:"border-color 0.2s, box-shadow 0.2s",
});
const fldLabel = { display:"block", fontSize:"13px", fontWeight:"500", color:C.textPrimary, marginBottom:"6px", fontFamily:F.body };

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ onNav, onLogout }) => {
  const items = [
    { key:"dashboard", lbl:"Dashboard",  icon:<HomeIcon />    },
    { key:"patients",  lbl:"My Patients", icon:<PatientsIco /> },
    { key:"profile",   lbl:"My Profile",  icon:<ProfileIcon /> },
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
        {items.map(item => (
          <button key={item.key} onClick={() => onNav(item.key)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", marginBottom:"4px", background: item.key==="patients"?"rgba(255,255,255,0.15)":"transparent", border:"none", cursor:"pointer", color: item.key==="patients"?"#fff":"rgba(255,255,255,0.6)", fontSize:"14px", fontWeight: item.key==="patients"?"600":"400", fontFamily:F.body, textAlign:"left", transition:"all 0.2s" }}
            onMouseEnter={e => { if(item.key!=="patients"){ e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}}
            onMouseLeave={e => { if(item.key!=="patients"){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.6)"; }}}
          >{item.icon} {item.lbl}</button>
        ))}
      </nav>
      <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", background:"transparent", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.55)", fontSize:"14px", fontFamily:F.body, textAlign:"left" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.55)"; }}
        ><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
};

// ── ✅ FIXED: All sub-components moved OUTSIDE PatientDetailPage ──────────────
// This prevents them from being recreated on every render, which was causing
// state resets and the Remove button not working.

const StatCard = ({ icon, lbl, value }) => (
  <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px 18px", display:"flex", flexDirection:"column", gap:"6px", flex:1, minWidth:"110px" }}>
    <div style={{ display:"flex", alignItems:"center", gap:"6px", color:C.textSecondary }}>{icon}<span style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.6px", fontFamily:F.body }}>{lbl}</span></div>
    <div style={{ fontSize:"15px", fontWeight:"700", color:C.textPrimary, fontFamily:F.body }}>{value || "—"}</div>
  </div>
);

const TabBtn = ({ tKey, icon, lbl, activeTab, setTab }) => {
  const active = activeTab === tKey;
  return (
    <button onClick={() => setTab(tKey)}
      style={{ display:"flex", alignItems:"center", gap:"7px", padding:"10px 20px", borderRadius:"10px", border:`1.5px solid ${active ? C.primary : C.border}`, background: active ? C.primaryGhost : C.white, color: active ? C.primary : C.textSecondary, fontSize:"13px", fontWeight: active?"700":"500", fontFamily:F.body, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}
      onMouseEnter={e => { if(!active){ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primary; }}}
      onMouseLeave={e => { if(!active){ e.currentTarget.style.borderColor=C.border;  e.currentTarget.style.color=C.textSecondary; }}}
    >{icon} {lbl}</button>
  );
};

const SubBtn = ({ vKey, lbl, visitSub, setVisitSub }) => (
  <button onClick={() => setVisitSub(vKey)}
    style={{ padding:"10px 20px", border:"none", borderBottom:`2px solid ${visitSub===vKey ? C.primary : "transparent"}`, background:"transparent", color: visitSub===vKey ? C.primary : C.textSecondary, fontSize:"13px", fontWeight: visitSub===vKey?"700":"500", fontFamily:F.body, cursor:"pointer", transition:"color 0.2s" }}>
    {lbl}
  </button>
);

const SaveFooter = ({ lbl, type, saving, onDraft, onSave }) => (
  <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", paddingTop:"8px" }}>
    <button onClick={onDraft}
      style={{ padding:"10px 22px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:"10px", fontSize:"13px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, cursor:"pointer" }}>
      Save as Draft
    </button>
    <button onClick={() => onSave(type)} disabled={saving}
      style={{ padding:"10px 22px", background: saving ? "#9E9E9E" : C.primary, border:"none", borderRadius:"10px", fontSize:"13px", fontWeight:"700", color:"#fff", fontFamily:F.body, cursor: saving ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:"7px", transition:"background 0.2s" }}
      onMouseEnter={e => { if(!saving) e.currentTarget.style.background=C.primaryLight; }}
      onMouseLeave={e => { if(!saving) e.currentTarget.style.background=C.primary; }}
    ><SaveIcon /> {saving ? "Saving..." : lbl}</button>
  </div>
);

// ── PatientDetailPage ─────────────────────────────────────────────────────────
const PatientDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [patient,    setPatient]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [doctorData, setDoctorData] = useState(null);

  const [tab,      setTab]      = useState("visits");
  const [visitSub, setVisitSub] = useState("history");
  const [focused,  setFocused]  = useState(null);
  const [saved,    setSaved]    = useState("");
  const [saving,   setSaving]   = useState(false);

  const [diagList, setDiagList] = useState([emptyDiag()]);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [editingHistory, setEditingHistory]   = useState({});
  const labRef   = useRef();

  // ── Report Upload State ────────────────────────────────────────────────────
  const [reportUploadFile, setReportUploadFile] = useState(null);
  const [uploadingReport, setUploadingReport]   = useState(false);
  const [reportUploadForm, setReportUploadForm] = useState({
    title: "", lab: "", type: "Lab Report", date: new Date().toLocaleDateString("en-GB"),
  });
  const reportFileRef = useRef();

  const triggerSave = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 3000); };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("doctorData");
      if (raw) setDoctorData(JSON.parse(raw));
    } catch (_) {}

    const fetchPatient = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("doctor_token");
        if (!token) { navigate("/login"); return; }

        const res = await fetch(`${API_URL}/api/doctors/patients/${id}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) { navigate("/login"); return; }

        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed to load patient");
        setPatient(json.patient);
      } catch (err) {
        console.error("Fetch patient error:", err);
        setError(err.message || "Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, navigate]);

  const handleSaveConsultation = async (type) => {
    const token = localStorage.getItem("doctor_token");
    setSaving(true);
    try {
      const combinedDiagnosis = diagList
        .filter(d => d.primary)
        .map(d => d.primary)
        .join(" | ");

      const combinedNotes = diagList
        .filter(d => d.reason)
        .map(d => d.reason)
        .join("\n---\n");

      // Doctor's Notes — mandatory field (was "secondary diagnosis")
      const combinedDoctorNotes = diagList
        .filter(d => d.doctor_notes)
        .map(d => d.doctor_notes)
        .join("\n---\n");

      // Severity — take from first diagnosis entry
      const severity = diagList[0]?.severity || "Moderate";

      // Combine all medications from all diagnosis entries
      const allMeds = diagList
        .flatMap(d => d.medications || [])
        .filter(m => m.name);
      const combinedPrescription = allMeds
        .map(m => `${m.name} ${m.dosage} — ${m.frequency} for ${m.duration}. ${m.instructions}`)
        .join("\n");

      const body = {
        date:             new Date().toISOString().split("T")[0],
        notes:            combinedNotes || "Consultation",
        reason_for_visit: combinedNotes || "Consultation",
        diagnosis:        combinedDiagnosis,
        doctor_notes:     combinedDoctorNotes,
        severity,
        prescription:     combinedPrescription,
      };
      const res = await fetch(`${API_URL}/api/doctors/patients/${id}/consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      triggerSave("Diagnosis & Prescriptions");
      setDiagList([emptyDiag()]);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── ✅ FIXED: Diagnosis helpers using functional state updates ────────────
  const addDiag    = ()      => setDiagList(prev => [...prev, emptyDiag()]);
  const removeDiag = (i)     => setDiagList(prev => prev.filter((_, idx) => idx !== i));
  const updateDiag = (i,k,v) => setDiagList(prev => {
    const next = [...prev];
    next[i] = { ...next[i], [k]: v };
    return next;
  });

  // ── Medication helpers (within diagnosis entry) ────────────────────────────
  const addMedToDiag = (diagIdx) => setDiagList(prev => {
    const next = [...prev];
    next[diagIdx].medications = [...(next[diagIdx].medications || []), emptyMed()];
    return next;
  });
  const removeMedFromDiag = (diagIdx, medIdx) => setDiagList(prev => {
    const next = [...prev];
    next[diagIdx].medications = (next[diagIdx].medications || []).filter((_, idx) => idx !== medIdx);
    return next;
  });
  const updateMedInDiag = (diagIdx, medIdx, k, v) => setDiagList(prev => {
    const next = [...prev];
    if (!next[diagIdx].medications) next[diagIdx].medications = [];
    next[diagIdx].medications[medIdx] = { ...(next[diagIdx].medications[medIdx] || emptyMed()), [k]: v };
    return next;
  });


  // ── Report Upload Handler ──────────────────────────────────────────────────
  const handleReportUpload = async () => {
    if (!reportUploadFile) {
      alert("Please select a file");
      return;
    }
    if (!reportUploadForm.title.trim() || !reportUploadForm.lab.trim()) {
      alert("Please fill in report title and lab name");
      return;
    }

    setUploadingReport(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(",")[1];
        const token = localStorage.getItem("doctor_token");
        
        const response = await fetch(`${API_URL}/api/doctors/patients/${id}/reports/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: reportUploadFile.name,
            mimeType: reportUploadFile.type || "application/pdf",
            title: reportUploadForm.title,
            lab: reportUploadForm.lab,
            type: reportUploadForm.type,
            date: reportUploadForm.date,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to upload report");
        }

        // Reload patient data to show the new report
        const patRes = await fetch(`${API_URL}/api/doctors/patients/${id}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const patData = await patRes.json();
        if (patData.success) setPatient(patData);

        triggerSave("Report uploaded");
        setReportUploadFile(null);
        setReportUploadForm({ title: "", lab: "", type: "Lab Report", date: new Date().toLocaleDateString("en-GB") });
        reportFileRef.current.value = "";
      };
      reader.readAsDataURL(reportUploadFile);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingReport(false);
    }
  };

  const scBadge = s => {
    if (s==="Normal")   return { bg:"#E8F5E9", color:"#2E7D32", bd:"#A5D6A7" };
    if (s==="Abnormal") return { bg:"#FFEBEE", color:"#C62828", bd:"#EF9A9A" };
    if (s==="Uploaded") return { bg:"#E3F2FD", color:"#1565C0", bd:"#90CAF9" };
    return { bg:"#FFF8E1", color:"#E65100", bd:"#FFE082" };
  };

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:F.body }}>
      <Sidebar onNav={k => navigate(k==="dashboard"?"/dashboard":k==="patients"?"/patients":"/profile")} onLogout={() => navigate("/login")} />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", color:C.textSecondary }}>
          <div style={{ fontSize:"32px", marginBottom:"12px" }}>⏳</div>
          <div style={{ fontSize:"15px" }}>Loading patient records...</div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:F.body }}>
      <Sidebar onNav={k => navigate(k==="dashboard"?"/dashboard":k==="patients"?"/patients":"/profile")} onLogout={() => navigate("/login")} />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", color:C.error, maxWidth:"400px" }}>
          <div style={{ fontSize:"32px", marginBottom:"12px" }}>⚠️</div>
          <div style={{ fontSize:"15px", fontWeight:"600", marginBottom:"8px" }}>{error}</div>
          <button onClick={() => navigate("/patients")}
            style={{ marginTop:"16px", padding:"10px 24px", background:C.primary, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"600", cursor:"pointer" }}>
            ← Back to Patients
          </button>
        </div>
      </div>
    </div>
  );

  const demo          = parseJ(patient.demographics, {});
  const medications   = parseJ(patient.medications, []);
  const vaccinations  = parseJ(patient.vaccination_records, []);
  const allergies     = parseJ(patient.allergies, []);
  const conditions    = parseJ(patient.conditions, []);
  const visits        = parseJ(patient.visit_summaries, []);
  const consultations = parseJ(patient.consultations, []);
  const pdfs          = parseJ(patient.pdfs, []);

  const allVisits = [
    ...visits.map(v => ({ ...v, _type: "visit" })),
    ...consultations.map(c => ({ ...c, _type: "consultation" })),
  ].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

  const age       = calcAge(demo.dob);
  const gender    = demo.gender ? demo.gender.charAt(0).toUpperCase() + demo.gender.slice(1) : "—";
  const bloodType = demo.bloodType || demo.blood_type || "—";
  const height    = demo.height ? `${demo.height} cm` : "—";
  const weight    = demo.weight ? `${demo.weight} kg` : "—";

  const doctorInitials    = doctorData?.name ? doctorData.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "DR";
  const doctorDisplayName = doctorData?.name ? `Dr. ${doctorData.name}` : "Doctor";

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(8px);}  to{opacity:1;transform:translateY(0);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
        * { box-sizing:border-box; }
        textarea { resize:vertical; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:F.body }}>
        <Sidebar
          onNav={k => { if(k==="dashboard") navigate("/dashboard"); else if(k==="patients") navigate("/patients"); else navigate("/profile"); }}
          onLogout={() => { localStorage.removeItem("doctor_token"); localStorage.removeItem("doctorData"); navigate("/login"); }}
        />

        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>

          {/* Top bar */}
          <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"14px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
              <button onClick={() => navigate("/patients")}
                style={{ display:"flex", alignItems:"center", background:"none", border:"none", cursor:"pointer", color:C.textSecondary, padding:"6px", borderRadius:"8px" }}
                onMouseEnter={e => e.currentTarget.style.background=C.bg}
                onMouseLeave={e => e.currentTarget.style.background="none"}
              ><BackIcon /></button>
              <div>
                <div style={{ fontSize:"18px", fontWeight:"800", color:C.textPrimary, fontFamily:F.display }}>Patient Details</div>
                <div style={{ fontSize:"12px", color:C.textSecondary, marginTop:"1px" }}>Patient ID: {patient.patient_id}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
              <div style={{ cursor:"pointer" }}><BellIcon /></div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={() => navigate("/profile")}>
                <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:"#fff" }}>{doctorInitials}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:C.textPrimary }}>{doctorDisplayName}</div>
                  <div style={{ fontSize:"11px", color:C.textSecondary }}>{doctorData?.specializations?.[0] || "Doctor"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex:1, overflow:"auto", padding:"24px 32px", animation:"fadeUp 0.3s ease" }}>

            {/* Patient banner */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, #2D6A5A 65%, #3D8B6E 100%)`,
                borderRadius: "16px",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                marginBottom: "20px",
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
                      background: avatarColor(patient.name||""),
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
                    {getInitials(patient.name||"")}
                  </div>

                  {/* Patient Info */}
                  <div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "#fff",
                        fontFamily: F.display,
                        marginBottom: "4px"
                      }}
                    >
                      {patient.name || "Unknown Patient"}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.85)",
                        marginBottom: "3px",
                        fontFamily: F.body
                      }}
                    >
                      {age ? `${age} yrs` : ""}{gender !== "—" ? ` | ${gender}` : ""}{patient.patient_id ? ` | ID: ${patient.patient_id}` : ""}
                    </div>

                    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:"600", color:"#2E7D32", background:"#E8F5E9", border:"1.5px solid #A5D6A7", padding:"4px 12px", borderRadius:"999px" }}>
                      <CheckSmIcon /> Consent Active
                    </span>
                  </div>
                </div>

                {/* Right Section - Could add buttons here if needed */}
                <div></div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
              <StatCard icon={<CalIcon />}    lbl="DOB"        value={demo.dob ? fmtDate(demo.dob) : "—"} />
              <StatCard icon={<BloodIcon />}  lbl="Blood Type" value={bloodType} />
              <StatCard icon={<RulerIcon />}  lbl="Height"     value={height} />
              <StatCard icon={<WeightIcon />} lbl="Weight"     value={weight} />
              <StatCard icon={<PhoneIcon />}  lbl="Phone"      value={demo.phone_number || "—"} />
            </div>

            {/* Save toast */}
            {saved && (
              <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", color:"#2E7D32", padding:"10px 18px", borderRadius:"10px", marginBottom:"14px", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px", animation:"slideDown 0.3s ease" }}>
                <CheckSmIcon /> {saved} saved successfully.
              </div>
            )}

            {/* Tab bar */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }}>
              <TabBtn tKey="visits"       icon={<HistoryIcon />} lbl="Visit Records"  activeTab={tab} setTab={setTab} />
              <TabBtn tKey="diagnosis"    icon={<DiagIcon />}    lbl="Diagnosis & Prescriptions" activeTab={tab} setTab={setTab} />
              <TabBtn tKey="lab"          icon={<LabIcon />}     lbl="Lab Reports"    activeTab={tab} setTab={setTab} />
            </div>

            {/* ── VISIT RECORDS ── */}
            {tab === "visits" && (
              <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, boxShadow:"0 2px 8px rgba(28,74,62,0.04)", overflow:"hidden" }}>
                <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 4px" }}>
                  <SubBtn vKey="history"      lbl="Visit History"           visitSub={visitSub} setVisitSub={setVisitSub} />
                  <SubBtn vKey="allergies"    lbl="Allergies & Conditions"  visitSub={visitSub} setVisitSub={setVisitSub} />
                  <SubBtn vKey="medications"  lbl="Medications"             visitSub={visitSub} setVisitSub={setVisitSub} />
                  <SubBtn vKey="vaccinations" lbl="Vaccinations"            visitSub={visitSub} setVisitSub={setVisitSub} />
                </div>
                <div style={{ padding:"24px" }}>

                  {visitSub === "history" && (
                    allVisits.length === 0
                      ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No visit records found.</p>
                      : allVisits.map((v, i) => (
                        <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"20px 24px", marginBottom:"16px" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                              <div style={{ width:"36px", height:"36px", background:C.primaryGhost, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color:C.primary, flexShrink:0 }}><CalIcon /></div>
                              <div>
                                <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary }}>{fmtDate(v.date || v.created_at)}</div>
                                {/* ✅ FIXED: Handle doctor being an object */}
                                <div style={{ fontSize:"12px", color:C.textSecondary }}>
                                  {typeof v.doctor === "object" ? (v.doctor?.name || doctorDisplayName) : (v.doctor || doctorDisplayName)}
                                </div>
                              </div>
                            </div>
                            <span style={{ background:C.bg, border:`1px solid ${C.border}`, padding:"5px 14px", borderRadius:"999px", fontSize:"12px", fontWeight:"600", color:C.textPrimary, whiteSpace:"nowrap" }}>
                              {v._type === "consultation" ? "Consultation" : (v.type || "Visit")}
                            </span>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"20px" }}>
                            {[
                              ["REASON FOR VISIT", v.reason_for_visit || v.reason || "—"],
                              ["DIAGNOSIS",        v.diagnosis        || "—"],
                              ["DOCTOR'S NOTES",   v.doctor_notes     || "—"],
                              ["PRESCRIPTION",     v.prescription     || "—"],
                            ].map(([h,t]) => (
                              <div key={h}>
                                <div style={{ fontSize:"11px", fontWeight:"700", color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"6px" }}>{h}</div>
                                <div style={{ fontSize:"14px", color:C.textPrimary, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{t}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  )}

                  {visitSub === "allergies" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
                      <div>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary, marginBottom:"12px" }}>Allergies</div>
                        {allergies.length === 0
                          ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No known allergies.</p>
                          : allergies.map((a, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:"#FFF8E1", border:"1px solid #FFE082", borderRadius:"10px", marginBottom:"8px" }}>
                              <span style={{ fontSize:"16px" }}>⚠️</span>
                              <span style={{ fontSize:"14px", color:"#E65100", fontWeight:"600" }}>
                                {typeof a === "object" ? (a.name || a.type || JSON.stringify(a)) : a}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      <div>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary, marginBottom:"12px" }}>Conditions</div>
                        {conditions.length === 0
                          ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No conditions recorded.</p>
                          : conditions.map((c, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:C.primaryGhost, border:`1px solid rgba(28,74,62,0.2)`, borderRadius:"10px", marginBottom:"8px" }}>
                              <span style={{ fontSize:"16px" }}>🩺</span>
                              <span style={{ fontSize:"14px", color:C.primary, fontWeight:"600" }}>
                                {typeof c === "object" ? (c.name || c.condition || JSON.stringify(c)) : c}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {visitSub === "medications" && (
                    medications.length === 0
                      ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No current medications.</p>
                      : medications.map((m, i) => (
                        <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px 20px", marginBottom:"12px", display:"flex", gap:"16px", alignItems:"flex-start" }}>
                          <div style={{ width:"36px", height:"36px", background:C.primaryGhost, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>💊</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:"15px", fontWeight:"700", color:C.textPrimary, marginBottom:"4px" }}>{m.name}</div>
                            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                              {m.dosage    && <span style={{ fontSize:"13px", color:C.textSecondary }}>Dosage: <strong style={{ color:C.textPrimary }}>{m.dosage}</strong></span>}
                              {m.frequency && <span style={{ fontSize:"13px", color:C.textSecondary }}>Frequency: <strong style={{ color:C.textPrimary }}>{m.frequency}</strong></span>}
                              {(m.duration || m.start_date) && <span style={{ fontSize:"13px", color:C.textSecondary }}>Duration: <strong style={{ color:C.textPrimary }}>{m.duration || m.start_date}</strong></span>}
                              {(m.instructions || m.reason) && <span style={{ fontSize:"13px", color:C.textSecondary }}>Notes: <strong style={{ color:C.textPrimary }}>{m.instructions || m.reason}</strong></span>}
                            </div>
                          </div>
                        </div>
                      ))
                  )}

                  {visitSub === "vaccinations" && (
                    vaccinations.length === 0
                      ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No vaccination records.</p>
                      : vaccinations.map((v, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px", background:C.bg, borderRadius:"10px", marginBottom:"10px", border:`1px solid ${C.border}` }}>
                          <div style={{ width:"36px", height:"36px", background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>💉</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary }}>{v.name}</div>
                            <div style={{ fontSize:"12px", color:C.textSecondary }}>{v.dose || v.doseNumber || ""} · {fmtDate(v.date)}</div>
                          </div>
                          <span style={{ background:"#E8F5E9", color:"#2E7D32", border:"1px solid #A5D6A7", padding:"4px 12px", borderRadius:"999px", fontSize:"12px", fontWeight:"600" }}>✓ Done</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* ── DIAGNOSIS ── */}
            {tab === "diagnosis" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

              {/* ── Past Diagnosis History (expandable + editable) ── */}
              {(() => {
                const pastDiagnoses = allVisits.filter(v => v.diagnosis && v.diagnosis.trim() !== "");
                if (pastDiagnoses.length === 0) return null;
                return (
                  <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, padding:"24px 28px", boxShadow:"0 2px 8px rgba(28,74,62,0.04)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"18px" }}>
                      <div style={{ width:"32px", height:"32px", background:C.primaryGhost, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color:C.primary }}>
                        <HistoryIcon />
                      </div>
                      <div>
                        <div style={{ fontSize:"15px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display }}>Past Diagnosis History</div>
                        <div style={{ fontSize:"12px", color:C.textSecondary }}>{pastDiagnoses.length} record{pastDiagnoses.length !== 1 ? "s" : ""} — click any card to expand and edit</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                      {pastDiagnoses.map((v, i) => {
                        const isOpen   = expandedHistory === i;
                        const editVals = editingHistory[i] || {};
                        const doctorName = typeof v.doctor === "object" ? (v.doctor?.name || doctorDisplayName) : (v.doctor || doctorDisplayName);
                        return (
                          <div key={i} style={{ border:`1.5px solid ${isOpen ? C.primary : C.border}`, borderRadius:"12px", background: isOpen ? C.white : C.bg, overflow:"hidden", transition:"border-color 0.2s, box-shadow 0.2s", boxShadow: isOpen ? "0 4px 16px rgba(28,74,62,0.10)" : "none" }}>
                            {/* Collapsed header */}
                            <div onClick={() => setExpandedHistory(isOpen ? null : i)}
                              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", cursor:"pointer", gap:"12px", flexWrap:"wrap" }}>
                              <div style={{ flex:1, minWidth:"200px" }}>
                                <div style={{ fontSize:"14px", fontWeight:"600", color:C.textPrimary, lineHeight:1.5 }}>{v.diagnosis}</div>
                                {!isOpen && (v.notes || v.reason) && (
                                  <div style={{ fontSize:"12px", color:C.textSecondary, marginTop:"3px", lineHeight:1.4, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:"600px" }}>
                                    {v.notes || v.reason}
                                  </div>
                                )}
                                <div style={{ fontSize:"12px", color:C.textSecondary, marginTop:"4px" }}>
                                  By <strong style={{ color:C.textPrimary }}>{doctorName}</strong>
                                </div>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
                                <span style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", color:C.textSecondary, background:C.white, border:`1px solid ${C.border}`, padding:"4px 10px", borderRadius:"999px", whiteSpace:"nowrap" }}>
                                  <CalIcon /> {fmtDate(v.date || v.created_at)}
                                </span>
                                <span style={{ fontSize:"11px", fontWeight:"600", color: v._type==="consultation" ? C.primary : "#1565C0", background: v._type==="consultation" ? C.primaryGhost : "#E3F2FD", border:`1px solid ${v._type==="consultation" ? "rgba(28,74,62,0.2)" : "#90CAF9"}`, padding:"3px 10px", borderRadius:"999px", whiteSpace:"nowrap" }}>
                                  {v._type === "consultation" ? "Consultation" : (v.type || "Visit")}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.25s", flexShrink:0 }}>
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </div>
                            </div>
                            {/* Expanded edit panel - MATCHES New Diagnosis form */}
{isOpen && (() => {
  // Parse existing medications from prescription string if not yet edited
  const parsedMeds = (editVals.medications) ?? (
    v.prescription
      ? v.prescription.split("\n").filter(Boolean).map(line => {
          // Format: "Name Dosage — Frequency for Duration. Instructions"
          const dashIdx = line.indexOf("—");
          const left    = dashIdx > -1 ? line.slice(0, dashIdx).trim() : line;
          const right   = dashIdx > -1 ? line.slice(dashIdx + 1).trim() : "";
          // "Name Dosage" split on last space before dosage
          const lastSpace = left.lastIndexOf(" ");
          const name   = lastSpace > -1 ? left.slice(0, lastSpace) : left;
          const dosage = lastSpace > -1 ? left.slice(lastSpace + 1) : "";
          // right = "Frequency for Duration. Instructions"
          const forIdx  = right.indexOf(" for ");
          const dotIdx  = right.indexOf(".");
          const frequency   = forIdx > -1 ? right.slice(0, forIdx).trim() : "Once daily";
          const afterFor    = forIdx > -1 ? right.slice(forIdx + 5) : right;
          const duration    = dotIdx > -1 && dotIdx > forIdx
            ? right.slice(forIdx + 5, dotIdx).trim()
            : afterFor.trim();
          const instructions = dotIdx > -1 ? right.slice(dotIdx + 1).trim() : "";
          return { name, dosage, frequency, duration, instructions };
        })
      : []
  );

  const setEH = (patch) =>
    setEditingHistory(prev => ({ ...prev, [i]: { ...editVals, ...patch } }));

  const setMeds = (meds) => setEH({ medications: meds });

  // Parse primary / secondary from "Primary; Secondary" or "Primary | Secondary"
  const diagParts  = (v.diagnosis || "").split(/[;|]/).map(s => s.trim());
  const initPrimary    = editVals.primary    ?? (diagParts[0] || "");
  const initDoctorNotes = editVals.doctor_notes ?? (v.doctor_notes || v.clinical_findings || "");
  const initReason    = editVals.reason    ?? (v.reason_for_visit || v.notes || v.reason || "");
  const initSeverity  = editVals.severity  ?? "Moderate";
  const meds          = editVals.medications ?? parsedMeds;

  return (
    <div style={{ borderTop:`1px solid ${C.border}`, padding:"20px" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

        {/* Reason for Visit */}
        <div>
          <label style={fldLabel}>Reason for Visit</label>
          <input value={initReason}
            onChange={e => setEH({ reason: e.target.value })}
            placeholder="e.g., Ongoing tiredness and periodic headaches"
            onFocus={() => setFocused(`eh_reason_${i}`)} onBlur={() => setFocused(null)}
            style={inputSt(focused === `eh_reason_${i}`)} />
        </div>

        {/* Primary + Secondary */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
          <div>
            <label style={fldLabel}>Primary Diagnosis</label>
            <input value={initPrimary}
              onChange={e => setEH({ primary: e.target.value })}
              placeholder="e.g., Migraine episodes"
              onFocus={() => setFocused(`eh_primary_${i}`)} onBlur={() => setFocused(null)}
              style={inputSt(focused === `eh_primary_${i}`)} />
          </div>
          <div>
            <label style={fldLabel}>Doctor's Notes</label>
            <input value={initDoctorNotes}
              onChange={e => setEH({ doctor_notes: e.target.value })}
              placeholder="Clinical observations, additional findings..."
              onFocus={() => setFocused(`eh_secondary_${i}`)} onBlur={() => setFocused(null)}
              style={inputSt(focused === `eh_secondary_${i}`)} />
          </div>
        </div>

        {/* Severity */}
        <div>
          <label style={fldLabel}>Severity</label>
          <select value={initSeverity}
            onChange={e => setEH({ severity: e.target.value })}
            style={{ ...inputSt(false), cursor:"pointer" }}>
            {["Mild","Moderate","Severe","Critical"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Medications */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"16px" }}>
          <div style={{ fontSize:"13px", fontWeight:"700", color:C.textPrimary, marginBottom:"12px" }}>Prescribed Medications</div>
          {meds.map((med, mIdx) => (
            <div key={mIdx} style={{ border:`1px solid ${C.border}`, borderRadius:"8px", padding:"14px", marginBottom:"10px", background:C.bg }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <div style={{ fontSize:"12px", fontWeight:"600", color:C.textSecondary }}>Medication #{mIdx + 1}</div>
                <button onClick={() => setMeds(meds.filter((_, idx) => idx !== mIdx))}
                  style={{ background:"#FFEBEE", border:"none", borderRadius:"6px", padding:"4px 8px", cursor:"pointer", color:C.error, display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", fontWeight:"600" }}>
                  <TrashIcon /> Remove
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
                {[
                  ["Medication Name", "name",      "e.g., Sumatriptan", `eh_mn_${i}_${mIdx}`],
                  ["Dosage",          "dosage",    "e.g., 50mg",        `eh_md_${i}_${mIdx}`],
                ].map(([lbl, key, ph, fk]) => (
                  <div key={key}>
                    <label style={{ ...fldLabel, marginBottom:"4px" }}>{lbl}</label>
                    <input value={med[key]} placeholder={ph}
                      onChange={e => { const m=[...meds]; m[mIdx]={...m[mIdx],[key]:e.target.value}; setMeds(m); }}
                      onFocus={() => setFocused(fk)} onBlur={() => setFocused(null)}
                      style={inputSt(focused === fk)} />
                  </div>
                ))}
                <div>
                  <label style={{ ...fldLabel, marginBottom:"4px" }}>Frequency</label>
                  <select value={med.frequency}
                    onChange={e => { const m=[...meds]; m[mIdx]={...m[mIdx],frequency:e.target.value}; setMeds(m); }}
                    style={{ ...inputSt(false), cursor:"pointer" }}>
                    {["Once daily","Twice daily","Three times daily","Four times daily","As needed","Every 8 hours","Every 12 hours","Weekly"].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"10px" }}>
                {[
                  ["Duration",             "duration",     "e.g., 30 days",    `eh_mdu_${i}_${mIdx}`],
                  ["Special Instructions", "instructions", "e.g., Take with food", `eh_mi_${i}_${mIdx}`],
                ].map(([lbl, key, ph, fk]) => (
                  <div key={key}>
                    <label style={{ ...fldLabel, marginBottom:"4px" }}>{lbl}</label>
                    <input value={med[key]} placeholder={ph}
                      onChange={e => { const m=[...meds]; m[mIdx]={...m[mIdx],[key]:e.target.value}; setMeds(m); }}
                      onFocus={() => setFocused(fk)} onBlur={() => setFocused(null)}
                      style={inputSt(focused === fk)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setMeds([...meds, emptyMed()])}
            style={{ width:"100%", padding:"8px", background:"transparent", border:`1px dashed ${C.primaryGhost}`, borderRadius:"8px", cursor:"pointer", fontSize:"12px", fontWeight:"600", color:C.primary, fontFamily:F.body, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primaryGhost; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.primaryGhost; e.currentTarget.style.background="transparent"; }}>
            <PlusIcon /> Add Medication
          </button>
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"20px" }}>
        <button onClick={() => { setExpandedHistory(null); setEditingHistory(prev => { const n={...prev}; delete n[i]; return n; }); }}
          style={{ padding:"9px 20px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:"10px", fontSize:"13px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, cursor:"pointer" }}>
          Cancel
        </button>
        <button
          onClick={async () => {
            const token = localStorage.getItem("doctor_token");
            try {
              const combinedPresc = meds.filter(m => m.name).map(m =>
                `${m.name} ${m.dosage} — ${m.frequency} for ${m.duration}. ${m.instructions}`
              ).join("\n");

              // PUT to edit in-place using the consultation's own ID (no new record created)
              const res = await fetch(`${API_URL}/api/doctors/patients/${id}/consultation/${v.consultation_id}`, {
                method: "PUT",
                headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
                body: JSON.stringify({
                  date:             v.date || new Date().toISOString().split("T")[0],
                  notes:            initReason,
                  reason_for_visit: initReason,
                  diagnosis:        initPrimary,
                  doctor_notes:     initDoctorNotes,
                  severity:         initSeverity,
                  prescription:     combinedPresc,
                }),
              });
              const json = await res.json();
              if (!json.success) throw new Error(json.message);
              triggerSave("Updated record");
              setExpandedHistory(null);
              // Refresh patient data to show updated record
              const patRes = await fetch(`${API_URL}/api/doctors/patients/${id}/records`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const patData = await patRes.json();
              if (patData.success) setPatient(patData.patient);
            } catch(err) { alert("Failed to update: " + err.message); }
          }}
          style={{ padding:"9px 20px", background:C.primary, border:"none", borderRadius:"10px", fontSize:"13px", fontWeight:"700", color:"#fff", fontFamily:F.body, cursor:"pointer", display:"flex", alignItems:"center", gap:"7px" }}
          onMouseEnter={e => e.currentTarget.style.background=C.primaryLight}
          onMouseLeave={e => e.currentTarget.style.background=C.primary}
        >
          <SaveIcon /> Save Changes
        </button>
      </div>
    </div>
  );
})()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── New Diagnosis Entry Form ── */}
              <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, padding:"28px 32px", boxShadow:"0 2px 8px rgba(28,74,62,0.04)" }}>
                <div style={{ fontSize:"16px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display, marginBottom:"4px" }}>New Diagnosis Entry</div>
                <div style={{ fontSize:"13px", color:C.textSecondary, marginBottom:"20px" }}>Record one or more diagnoses — all entries will be saved to the patient's record</div>

                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", display:"flex", flexDirection:"column", gap:"0" }}>
                  {diagList.map((diag, i) => (
                    <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"20px 24px", marginBottom:"16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary, display:"flex", alignItems:"center", gap:"8px" }}>
                          <div style={{ width:"26px", height:"26px", borderRadius:"8px", background:C.primaryGhost, display:"flex", alignItems:"center", justifyContent:"center", color:C.primary, fontSize:"12px", fontWeight:"800" }}>
                            {i + 1}
                          </div>
                          Diagnosis #{i + 1}
                        </div>
                        {/* ✅ FIXED: Remove button always works now */}
                        {diagList.length > 1 && (
                          <button
                            onClick={() => removeDiag(i)}
                            style={{ background:"#FFEBEE", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", color:C.error, display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:"600", fontFamily:F.body }}>
                            <TrashIcon /> Remove
                          </button>
                        )}
                      </div>

                      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                        <div>
                          <label style={fldLabel}>Reason for Visit</label>
                          <input value={diag.reason} onChange={e => updateDiag(i, "reason", e.target.value)}
                            placeholder="e.g., Ongoing tiredness and periodic headaches"
                            onFocus={() => setFocused(`dr${i}`)} onBlur={() => setFocused(null)}
                            style={inputSt(focused === `dr${i}`)} />
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                          <div>
                            <label style={fldLabel}>Primary Diagnosis</label>
                            <input value={diag.primary} onChange={e => updateDiag(i, "primary", e.target.value)}
                              placeholder="e.g., Migraine episodes"
                              onFocus={() => setFocused(`dp${i}`)} onBlur={() => setFocused(null)}
                              style={inputSt(focused === `dp${i}`)} />
                          </div>

                        </div>
                        <div>
                          <label style={fldLabel}>Doctor's Notes</label>
                          <input value={diag.doctor_notes} onChange={e => updateDiag(i, "doctor_notes", e.target.value)}
                            placeholder="Clinical observations, additional findings..."
                            onFocus={() => setFocused(`ds${i}`)} onBlur={() => setFocused(null)}
                            style={inputSt(focused === `ds${i}`)} />
                        </div>
                        <div>
                          <label style={fldLabel}>Severity</label>
                          <select value={diag.severity} onChange={e => updateDiag(i, "severity", e.target.value)}
                            style={{ ...inputSt(false), cursor:"pointer" }}>
                            {["Mild","Moderate","Severe","Critical"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>

                        {/* ── Medications for this diagnosis ── */}
                        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"16px" }}>
                          <div style={{ fontSize:"13px", fontWeight:"700", color:C.textPrimary, marginBottom:"12px" }}>Prescribed Medications</div>
                          {(diag.medications || []).map((med, mIdx) => (
                            <div key={mIdx} style={{ border:`1px solid ${C.border}`, borderRadius:"8px", padding:"14px", marginBottom:"10px", background:C.bg }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                                <div style={{ fontSize:"12px", fontWeight:"600", color:C.textSecondary }}>Medication #{mIdx + 1}</div>
                                {(diag.medications || []).length > 0 && (
                                  <button onClick={() => removeMedFromDiag(i, mIdx)}
                                    style={{ background:"#FFEBEE", border:"none", borderRadius:"6px", padding:"4px 8px", cursor:"pointer", color:C.error, display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", fontWeight:"600" }}>
                                    <TrashIcon /> Remove
                                  </button>
                                )}
                              </div>
                              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
                                <div>
                                  <label style={{ ...fldLabel, marginBottom:"4px" }}>Medication Name</label>
                                  <input value={med.name} onChange={e => updateMedInDiag(i, mIdx, "name", e.target.value)} placeholder="e.g., Sumatriptan"
                                    onFocus={() => setFocused(`mn${i}${mIdx}`)} onBlur={() => setFocused(null)} style={inputSt(focused === `mn${i}${mIdx}`)} />
                                </div>
                                <div>
                                  <label style={{ ...fldLabel, marginBottom:"4px" }}>Dosage</label>
                                  <input value={med.dosage} onChange={e => updateMedInDiag(i, mIdx, "dosage", e.target.value)} placeholder="e.g., 50mg"
                                    onFocus={() => setFocused(`md${i}${mIdx}`)} onBlur={() => setFocused(null)} style={inputSt(focused === `md${i}${mIdx}`)} />
                                </div>
                                <div>
                                  <label style={{ ...fldLabel, marginBottom:"4px" }}>Frequency</label>
                                  <select value={med.frequency} onChange={e => updateMedInDiag(i, mIdx, "frequency", e.target.value)} style={{ ...inputSt(false), cursor:"pointer" }}>
                                    {["Once daily","Twice daily","Three times daily","Four times daily","As needed","Every 8 hours","Every 12 hours","Weekly"].map(f => <option key={f}>{f}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"10px" }}>
                                <div>
                                  <label style={{ ...fldLabel, marginBottom:"4px" }}>Duration</label>
                                  <input value={med.duration} onChange={e => updateMedInDiag(i, mIdx, "duration", e.target.value)} placeholder="e.g., 30 days"
                                    onFocus={() => setFocused(`mdu${i}${mIdx}`)} onBlur={() => setFocused(null)} style={inputSt(focused === `mdu${i}${mIdx}`)} />
                                </div>
                                <div>
                                  <label style={{ ...fldLabel, marginBottom:"4px" }}>Special Instructions</label>
                                  <input value={med.instructions} onChange={e => updateMedInDiag(i, mIdx, "instructions", e.target.value)} placeholder="e.g., Take with food"
                                    onFocus={() => setFocused(`mi${i}${mIdx}`)} onBlur={() => setFocused(null)} style={inputSt(focused === `mi${i}${mIdx}`)} />
                                </div>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addMedToDiag(i)}
                            style={{ width:"100%", padding:"8px", background:"transparent", border:`1px dashed ${C.primaryGhost}`, borderRadius:"8px", cursor:"pointer", fontSize:"12px", fontWeight:"600", color:C.primary, fontFamily:F.body, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", transition:"all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primaryGhost; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor=C.primaryGhost; e.currentTarget.style.background="transparent"; }}
                          >
                            <PlusIcon /> Add Medication
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={addDiag}
                    style={{ width:"100%", padding:"13px", background:"transparent", border:`1.5px dashed ${C.border}`, borderRadius:"12px", cursor:"pointer", fontSize:"14px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"20px", transition:"all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textSecondary; }}
                  >
                    <PlusIcon /> Add Another Diagnosis
                  </button>

                  <SaveFooter lbl="Save Diagnosis" type="diagnosis" saving={saving} onDraft={() => triggerSave("Draft")} onSave={handleSaveConsultation} />
                </div>
              </div>
              </div>
            )}



            {/* ── LAB REPORTS ── */}
            {tab === "lab" && (
              <div>
                {/* Upload Section */}
                <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, boxShadow:"0 2px 8px rgba(28,74,62,0.04)", padding:"24px", marginBottom:"20px" }}>
                  <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary, marginBottom:"14px", display:"flex", alignItems:"center", gap:"8px" }}>
                    <UploadIcon /> Upload Patient Report
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
                    <div>
                      <label style={fldLabel}>Report Title</label>
                      <input value={reportUploadForm.title} onChange={e=>setReportUploadForm(p=>({...p,title:e.target.value}))} placeholder="e.g., Blood Test Results" style={inputSt(false)} />
                    </div>
                    <div>
                      <label style={fldLabel}>Laboratory Name</label>
                      <input value={reportUploadForm.lab} onChange={e=>setReportUploadForm(p=>({...p,lab:e.target.value}))} placeholder="e.g., Apollo Labs" style={inputSt(false)} />
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
                    <div>
                      <label style={fldLabel}>Report Type</label>
                      <select value={reportUploadForm.type} onChange={e=>setReportUploadForm(p=>({...p,type:e.target.value}))} style={{...inputSt(false),cursor:"pointer"}}>
                        {["Lab Report","Blood Test","Radiology","ECG","Pathology","Ultrasound","CT Scan","MRI","Other"].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={fldLabel}>Date</label>
                      <input type="date" value={reportUploadForm.date} onChange={e=>setReportUploadForm(p=>({...p,date:e.target.value}))} style={inputSt(false)} />
                    </div>
                  </div>
                  <div style={{ marginBottom:"14px" }}>
                    <label style={fldLabel}>Select File (PDF or Image)</label>
                    <input ref={reportFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{const f=e.target.files[0]; if(f) setReportUploadFile(f);}} />
                    <button onClick={()=>reportFileRef.current.click()} disabled={uploadingReport}
                      style={{ width:"100%", padding:"12px 16px", background:C.bg, border:`1.5px dashed ${C.border}`, borderRadius:"10px", cursor: uploadingReport ? "not-allowed" : "pointer", fontSize:"13px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity: uploadingReport ? 0.6 : 1 }}>
                      <UploadIcon /> {reportUploadFile ? reportUploadFile.name : "Choose File"}
                    </button>
                  </div>
                  <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
                    <button onClick={()=>{setReportUploadFile(null);reportFileRef.current.value="";setReportUploadForm({title:"",lab:"",type:"Lab Report",date:new Date().toLocaleDateString("en-GB")});}}
                      style={{padding:"10px 20px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:"10px", fontSize:"13px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, cursor:"pointer"}}>
                      Cancel
                    </button>
                    <button onClick={handleReportUpload} disabled={uploadingReport || !reportUploadFile}
                      style={{padding:"10px 20px", background: uploadingReport ? "#999" : C.primary, border:"none", borderRadius:"10px", color:"#fff", fontSize:"13px", fontWeight:"700", fontFamily:F.body, cursor: uploadingReport ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:"8px"}}>
                      <FileIcon /> {uploadingReport ? "Uploading..." : "Upload Report"}
                    </button>
                  </div>
                </div>

                {/* Reports List */}
                <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 8px rgba(28,74,62,0.04)" }}>
                  {pdfs.length === 0 ? (
                    <div style={{ padding:"48px", textAlign:"center", color:C.textSecondary, fontSize:"14px" }}>
                      <div style={{ fontSize:"32px", marginBottom:"12px" }}>📋</div>
                      No reports uploaded yet.
                    </div>
                  ) : (
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                          {["Report","Date","Type","Source","Status"].map(h => (
                            <th key={h} style={{ padding:"13px 20px", fontSize:"12px", fontWeight:"700", color:C.textSecondary, textAlign:"left", textTransform:"uppercase", letterSpacing:"0.7px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pdfs.map((r, i) => {
                          const s = scBadge("Uploaded");
                          const isDocUploaded = r.is_doctor_upload || r.uploaded_by;
                          return (
                            <tr key={i} style={{ borderBottom: i < pdfs.length-1 ? `1px solid ${C.border}` : "none" }}>
                              <td style={{ padding:"16px 20px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                                  <div style={{ width:"34px", height:"34px", background:C.primaryGhost, borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color:C.primary }}><FileIcon /></div>
                                  <div>
                                    <div style={{ fontSize:"14px", fontWeight:"600", color:C.textPrimary }}>{r.title || r.file_name}</div>
                                    {r.lab && <div style={{fontSize:"12px", color:C.textSecondary}}>{r.lab}</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding:"16px 20px", fontSize:"13px", color:C.textSecondary }}>{fmtDate(r.date || r.uploaded_at)}</td>
                              <td style={{ padding:"16px 20px" }}>
                                <span style={{ background:s.bg, color:s.color, border:`1.5px solid ${s.bd}`, padding:"5px 12px", borderRadius:"999px", fontSize:"12px", fontWeight:"600" }}>{r.type || "Report"}</span>
                              </td>
                              <td style={{ padding:"16px 20px", fontSize:"13px" }}>
                                <span style={{color: isDocUploaded ? C.primary : C.textSecondary, fontWeight: isDocUploaded ? "600" : "400"}}>
                                  {isDocUploaded ? "📄 Doctor" : "👤 Patient"}
                                </span>
                              </td>
                              <td style={{ padding:"16px 20px", fontSize:"13px", color:C.textSecondary }}>✓</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDetailPage;