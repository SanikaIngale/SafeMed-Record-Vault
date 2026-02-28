import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
const F = { display: "'Georgia','Times New Roman',serif", body: "'Helvetica Neue',Arial,sans-serif" };

// ── Patient Database ──────────────────────────────────────────────────────────
const PATIENTS_DB = {
  P001: {
    id: "P001", name: "Ruchita Sharma", age: 30, gender: "Female", bloodGroup: "O+",
    dob: "15/03/1995", height: "165 cm", weight: "58 kg", phone: "+91 91853 19281", city: "Mumbai",
    condition: "Migraine", consent: "Granted",
    allergies: ["Penicillin", "Dust"],
    conditions: ["Migraine", "Mild Anemia"],
    vaccinations: [
      { name: "COVID-19 (Covishield)", date: "12 Mar 2021", dose: "Dose 1" },
      { name: "COVID-19 (Covishield)", date: "14 Jun 2021", dose: "Dose 2" },
      { name: "Influenza",             date: "01 Oct 2024", dose: "Annual" },
    ],
    medications: [
      { name: "Sumatriptan 50mg",  frequency: "As needed",   duration: "Ongoing", instructions: "Take at onset of migraine" },
      { name: "Paracetamol 500mg", frequency: "Twice daily", duration: "5 days",  instructions: "After meals" },
    ],
    visits: [
      { date: "05 Jul 2025", time: "10:30 AM", doctor: "Dr. Anya Sharma", hospital: "General Hospital", type: "General Checkup",
        reason: "Ongoing tiredness and periodic throbbing headaches",
        diagnosis: "Indicative of migraine episodes aggravated by exhaustion",
        notes: "Maintain a regular sleep schedule. If symptoms persist or worsen, follow-up required." },
      { date: "12 Jan 2026", time: "2:00 PM", doctor: "Dr. Anya Sharma", hospital: "General Hospital", type: "Follow-up",
        reason: "Follow-up for migraine management",
        diagnosis: "Migraine frequency reduced. Continue current medication.",
        notes: "Patient reports improvement. Reduce triggers. Next follow-up in 3 months." },
    ],
    labReports: [
      { name: "Complete Blood Count", date: "04 Jul 2025", status: "Normal",   file: null },
      { name: "Thyroid Panel",        date: "12 Jan 2026", status: "Reviewed", file: null },
    ],
  },
  P002: {
    id: "P002", name: "Arjun Mehta", age: 45, gender: "Male", bloodGroup: "B+",
    dob: "10/06/1980", height: "172 cm", weight: "82 kg", phone: "+91 98765 00001", city: "Delhi",
    condition: "Type 2 Diabetes", consent: "Granted",
    allergies: ["Sulfa drugs"], conditions: ["Type 2 Diabetes", "Hypertension"],
    vaccinations: [{ name: "COVID-19", date: "15 Apr 2021", dose: "Dose 1" }],
    medications: [{ name: "Metformin 500mg", frequency: "Twice daily", duration: "Ongoing", instructions: "With meals" }],
    visits: [{ date: "02 Feb 2026", time: "11:00 AM", doctor: "Dr. Anya Sharma", hospital: "General Hospital", type: "Follow-up",
      reason: "Routine diabetes check", diagnosis: "Blood sugar levels stable", notes: "Continue medication. Diet counseling advised." }],
    labReports: [{ name: "HbA1c Report", date: "01 Feb 2026", status: "Reviewed", file: null }],
  },
  P003: {
    id: "P003", name: "Priya Patel", age: 28, gender: "Female", bloodGroup: "A+",
    dob: "22/09/1997", height: "158 cm", weight: "52 kg", phone: "+91 98765 00002", city: "Ahmedabad",
    condition: "Asthma", consent: "Granted",
    allergies: ["Aspirin", "Pollen"], conditions: ["Asthma"],
    vaccinations: [{ name: "Flu Vaccine", date: "10 Sep 2024", dose: "Annual" }],
    medications: [{ name: "Salbutamol Inhaler", frequency: "As needed", duration: "Ongoing", instructions: "2 puffs during attack" }],
    visits: [{ date: "01 Feb 2026", time: "9:30 AM", doctor: "Dr. Anya Sharma", hospital: "General Hospital", type: "General Checkup",
      reason: "Breathlessness on exertion", diagnosis: "Mild asthma exacerbation", notes: "Avoid cold air. Use inhaler prophylactically before exercise." }],
    labReports: [],
  },
  P004: {
    id: "P004", name: "Vikram Singh", age: 62, gender: "Male", bloodGroup: "AB-",
    dob: "03/01/1963", height: "175 cm", weight: "88 kg", phone: "+91 98765 00003", city: "Chandigarh",
    condition: "Hypertension", consent: "Granted",
    allergies: [], conditions: ["Hypertension", "Mild Obesity"],
    vaccinations: [],
    medications: [{ name: "Amlodipine 5mg", frequency: "Once daily", duration: "Ongoing", instructions: "Morning with water" }],
    visits: [{ date: "07 Feb 2026", time: "3:00 PM", doctor: "Dr. Anya Sharma", hospital: "General Hospital", type: "Follow-up",
      reason: "BP monitoring", diagnosis: "BP slightly elevated — 145/92 mmHg", notes: "Salt restriction advised. Increase physical activity." }],
    labReports: [{ name: "Lipid Profile", date: "06 Feb 2026", status: "Abnormal", file: null }],
  },
  P005: {
    id: "P005", name: "Meera Joshi", age: 35, gender: "Female", bloodGroup: "O-",
    dob: "17/07/1990", height: "162 cm", weight: "60 kg", phone: "+91 98765 00004", city: "Pune",
    condition: "Thyroid Disorder", consent: "Granted",
    allergies: ["Iodine"], conditions: ["Hypothyroidism"],
    vaccinations: [{ name: "COVID-19", date: "20 May 2021", dose: "Dose 1" }],
    medications: [{ name: "Levothyroxine 50mcg", frequency: "Once daily", duration: "Ongoing", instructions: "Empty stomach, 30 min before food" }],
    visits: [{ date: "04 Feb 2026", time: "10:00 AM", doctor: "Dr. Anya Sharma", hospital: "General Hospital", type: "Routine",
      reason: "Thyroid monitoring", diagnosis: "TSH slightly high — dose adjustment needed", notes: "Increase Levothyroxine to 75mcg. Retest in 6 weeks." }],
    labReports: [{ name: "TSH Test", date: "03 Feb 2026", status: "Abnormal", file: null }],
  },
};
["P006","P007","P008","P009","P010"].forEach((pid, i) => {
  const names = ["Rahul Verma","Sunita Devi","Neha Gupta","Karan Shah","Divya Nair"];
  const ages  = [50,55,38,29,41];
  const gend  = ["Male","Female","Female","Male","Female"];
  const bgs   = ["A-","B-","AB+","O+","A+"];
  const conds = ["COPD","Arthritis","Anemia","Back Pain","Migraine"];
  PATIENTS_DB[pid] = {
    id: pid, name: names[i], age: ages[i], gender: gend[i], bloodGroup: bgs[i],
    dob: "01/01/1980", height: "168 cm", weight: "65 kg",
    phone: "+91 98765 0000"+(5+i), city: "Mumbai",
    condition: conds[i], consent: i < 2 ? "Expiring" : "Granted",
    allergies: [], conditions: [conds[i]], vaccinations: [], medications: [], visits: [], labReports: [],
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = n => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
const avatarColor = n => {
  const p = ["#1C4A3E","#1565C0","#6A1B9A","#00695C","#4E342E","#283593","#AD1457","#00838F"];
  let h=0; for (let c of n) h=(h+c.charCodeAt(0))%p.length; return p[h];
};

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
const PinIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const RulerIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 8.7l-9 9a1 1 0 0 1-1.4 0l-6.6-6.6a1 1 0 0 1 0-1.4l9-9a1 1 0 0 1 1.4 0l6.6 6.6a1 1 0 0 1 0 1.4z"/><path d="M7.5 12.5l1.5-1.5"/><path d="M10.5 15.5l1.5-1.5"/><path d="M13.5 9.5l1.5-1.5"/></svg>;
const CheckSmIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const PlusIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TrashIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const UploadIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const FileIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const DiagIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const PrescIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const LabIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v6l-2 4v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8l-2-4V2"/><line x1="6" y1="10" x2="14" y2="10"/></svg>;
const HistoryIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SaveIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const ImageIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;

// ── Style helpers ─────────────────────────────────────────────────────────────
const inputSt = (focused) => ({
  width: "100%", padding: "10px 14px", background: C.white,
  border: `1px solid ${focused ? C.primary : C.border}`, borderRadius: "8px",
  fontSize: "14px", color: C.textPrimary, fontFamily: F.body, outline: "none",
  boxSizing: "border-box", boxShadow: focused ? "0 0 0 3px rgba(28,74,62,0.08)" : "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
});
const fldLabel = { display: "block", fontSize: "13px", fontWeight: "500", color: C.textPrimary, marginBottom: "6px", fontFamily: F.body };

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ onNav, onLogout }) => {
  const items = [
    { key: "dashboard", lbl: "Dashboard",  icon: <HomeIcon />    },
    { key: "patients",  lbl: "My Patients", icon: <PatientsIco /> },
    { key: "profile",   lbl: "My Profile",  icon: <ProfileIcon /> },
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
        {items.map(item => (
          <button key={item.key} onClick={() => onNav(item.key)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", marginBottom: "4px", background: item.key==="patients" ? "rgba(255,255,255,0.15)" : "transparent", border: "none", cursor: "pointer", color: item.key==="patients" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: item.key==="patients" ? "600" : "400", fontFamily: F.body, textAlign: "left", transition: "all 0.2s" }}
            onMouseEnter={e => { if (item.key!=="patients"){ e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}}
            onMouseLeave={e => { if (item.key!=="patients"){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.6)"; }}}
          >{item.icon} {item.lbl}</button>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: "14px", fontFamily: F.body, textAlign: "left", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.55)"; }}
        ><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
};

// ── Page Component ────────────────────────────────────────────────────────────
const PatientDetailPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const patient   = PATIENTS_DB[id] || PATIENTS_DB["P001"];

  // Single flat tab: visits | diagnosis | prescription | lab
  const [tab, setTab]           = useState("visits");
  const [visitSub, setVisitSub] = useState("history");
  const [focused, setFocused]   = useState(null);
  const [saved, setSaved]       = useState("");

  const triggerSave = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 3000); };

  // Lab reports
  const [labReports, setLabReports] = useState(patient.labReports);
  const labRef = useRef();
  const onLabUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setLabReports(r => [...r, { name: f.name, date: new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}), status: "Uploaded", file: URL.createObjectURL(f) }]);
    e.target.value = "";
  };

  // Diagnosis
  const [diag, setDiag] = useState({ reason:"", primary:"", icd:"", secondary:"", severity:"Moderate", findings:"" });

  // Prescription
  const [meds, setMeds]             = useState([{ name:"", dosage:"", frequency:"Once daily", duration:"", instructions:"" }]);
  const [prescImages, setPrescImages] = useState([]);
  const prescRef = useRef();
  const addMed    = ()      => setMeds(m => [...m, { name:"", dosage:"", frequency:"Once daily", duration:"", instructions:"" }]);
  const removeMed = (i)     => setMeds(m => m.filter((_,idx) => idx!==i));
  const updateMed = (i,k,v) => setMeds(m => { const a=[...m]; a[i]={...a[i],[k]:v}; return a; });
  const onPrescImg = (e)    => { const f=e.target.files[0]; if(!f)return; setPrescImages(p=>[...p,{name:f.name,url:URL.createObjectURL(f)}]); e.target.value=""; };

  // Status badge colour
  const sc = s => {
    if (s==="Normal")   return { bg:"#E8F5E9", color:"#2E7D32", bd:"#A5D6A7" };
    if (s==="Abnormal") return { bg:"#FFEBEE", color:"#C62828", bd:"#EF9A9A" };
    if (s==="Uploaded") return { bg:"#E3F2FD", color:"#1565C0", bd:"#90CAF9" };
    return { bg:"#FFF8E1", color:"#E65100", bd:"#FFE082" };
  };

  // Stat card
  const StatCard = ({ icon, lbl, value }) => (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px 18px", display:"flex", flexDirection:"column", gap:"6px", flex:1, minWidth:"110px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"6px", color:C.textSecondary }}>{icon}<span style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.6px", fontFamily:F.body }}>{lbl}</span></div>
      <div style={{ fontSize:"15px", fontWeight:"700", color:C.textPrimary, fontFamily:F.body }}>{value}</div>
    </div>
  );

  // Tab button
  const TabBtn = ({ tKey, icon, lbl }) => {
    const active = tab===tKey;
    return (
      <button onClick={() => setTab(tKey)}
        style={{ display:"flex", alignItems:"center", gap:"7px", padding:"10px 20px", borderRadius:"10px", border:`1.5px solid ${active ? C.primary : C.border}`, background: active ? C.primaryGhost : C.white, color: active ? C.primary : C.textSecondary, fontSize:"13px", fontWeight: active?"700":"500", fontFamily:F.body, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}
        onMouseEnter={e => { if(!active){ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primary; }}}
        onMouseLeave={e => { if(!active){ e.currentTarget.style.borderColor=C.border;  e.currentTarget.style.color=C.textSecondary; }}}
      >{icon}{lbl}</button>
    );
  };

  // Visit sub-tab button
  const SubBtn = ({ vKey, lbl }) => (
    <button onClick={() => setVisitSub(vKey)}
      style={{ padding:"10px 20px", border:"none", borderBottom:`2px solid ${visitSub===vKey ? C.primary : "transparent"}`, background:"transparent", color: visitSub===vKey ? C.primary : C.textSecondary, fontSize:"13px", fontWeight: visitSub===vKey?"700":"500", fontFamily:F.body, cursor:"pointer", transition:"color 0.2s" }}>
      {lbl}
    </button>
  );

  // Save footer shared by Diagnosis & Prescription
  const SaveFooter = ({ lbl, onSave }) => (
    <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", paddingTop:"8px" }}>
      <button onClick={() => triggerSave("Draft")}
        style={{ padding:"10px 22px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:"10px", fontSize:"13px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, cursor:"pointer" }}>
        Save as Draft
      </button>
      <button onClick={() => { onSave && onSave(); triggerSave(lbl); }}
        style={{ padding:"10px 22px", background:C.primary, border:"none", borderRadius:"10px", fontSize:"13px", fontWeight:"700", color:"#fff", fontFamily:F.body, cursor:"pointer", display:"flex", alignItems:"center", gap:"7px", transition:"background 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.background=C.primaryLight}
        onMouseLeave={e => e.currentTarget.style.background=C.primary}
      ><SaveIcon /> {lbl}</button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px);}  to{opacity:1;transform:translateY(0);} }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
        * { box-sizing:border-box; }
        textarea { resize:vertical; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:F.body }}>

        <Sidebar
          onNav={k => { if(k==="dashboard") navigate("/dashboard"); else if(k==="patients") navigate("/patients"); else navigate("/profile"); }}
          onLogout={() => navigate("/login")}
        />

        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>

          {/* ── Top bar ── */}
          <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"14px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
              <button onClick={() => navigate("/patients")}
                style={{ display:"flex", alignItems:"center", background:"none", border:"none", cursor:"pointer", color:C.textSecondary, padding:"6px", borderRadius:"8px" }}
                onMouseEnter={e => e.currentTarget.style.background=C.bg}
                onMouseLeave={e => e.currentTarget.style.background="none"}
              ><BackIcon /></button>
              <div>
                <div style={{ fontSize:"18px", fontWeight:"800", color:C.textPrimary, fontFamily:F.display }}>Patient Details</div>
                <div style={{ fontSize:"12px", color:C.textSecondary, marginTop:"1px" }}>Patient ID: {patient.id}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
              <div style={{ position:"relative", cursor:"pointer" }}>
                <BellIcon />
                <span style={{ position:"absolute", top:"-4px", right:"-4px", width:"16px", height:"16px", background:C.error, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"#fff", fontWeight:"700" }}>3</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={() => navigate("/profile")}>
                <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:"#fff" }}>AS</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:C.textPrimary }}>Dr. Anya Sharma</div>
                  <div style={{ fontSize:"11px", color:C.textSecondary }}>General Medicine</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex:1, overflow:"auto", padding:"24px 32px", animation:"fadeUp 0.3s ease" }}>

            {/* Banner — no Update Records button */}
            <div style={{ background:C.white, borderRadius:"16px", border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:"20px", boxShadow:"0 2px 8px rgba(28,74,62,0.05)", position:"relative" }}>
              <div style={{ height:"110px", background:`linear-gradient(135deg, ${C.primary} 0%, #2D6A5A 65%, #3D8B6E 100%)` }} />
              <div style={{ position:"absolute", top:"66px", left:"28px", width:"80px", height:"80px", borderRadius:"50%", background:avatarColor(patient.name), border:"4px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", fontWeight:"800", color:"#fff", boxShadow:"0 4px 14px rgba(0,0,0,0.18)", zIndex:1 }}>
                {getInitials(patient.name)}
              </div>
              <div style={{ padding:"10px 28px 22px 128px", minHeight:"72px" }}>
                <h2 style={{ fontSize:"20px", fontWeight:"800", color:C.textPrimary, fontFamily:F.display, margin:"0 0 3px" }}>{patient.name}</h2>
                <p style={{ fontSize:"13px", color:C.textSecondary, margin:"0 0 10px" }}>{patient.age} yrs | {patient.gender} | ID: {patient.id}</p>
                <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:"600", color:"#2E7D32", background:"#E8F5E9", border:"1.5px solid #A5D6A7", padding:"4px 12px", borderRadius:"999px" }}>
                  <CheckSmIcon /> Consent Active
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
              <StatCard icon={<CalIcon />}    lbl="DOB"         value={patient.dob} />
              <StatCard icon={<BloodIcon />}  lbl="Blood Group" value={patient.bloodGroup} />
              <StatCard icon={<RulerIcon />}  lbl="Height"      value={patient.height} />
              <StatCard icon={<WeightIcon />} lbl="Weight"      value={patient.weight} />
              <StatCard icon={<PhoneIcon />}  lbl="Phone"       value={patient.phone} />
              <StatCard icon={<PinIcon />}    lbl="City"        value={patient.city} />
            </div>

            {/* Save toast */}
            {saved && (
              <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", color:"#2E7D32", padding:"10px 18px", borderRadius:"10px", marginBottom:"14px", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px", animation:"slideDown 0.3s ease" }}>
                <CheckSmIcon /> {saved} saved successfully.
              </div>
            )}

            {/* ── Flat tab bar: Visit Records | Diagnosis | Prescription | Lab Reports ── */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }}>
              <TabBtn tKey="visits"       icon={<HistoryIcon />} lbl="Visit Records"  />
              <TabBtn tKey="diagnosis"    icon={<DiagIcon />}    lbl="Diagnosis"      />
              <TabBtn tKey="prescription" icon={<PrescIcon />}   lbl="Prescription"   />
              <TabBtn tKey="lab"          icon={<LabIcon />}     lbl="Lab Reports"    />
            </div>

            {/* ══════════════════════════════════════
                VISIT RECORDS
            ══════════════════════════════════════ */}
            {tab === "visits" && (
              <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, boxShadow:"0 2px 8px rgba(28,74,62,0.04)", overflow:"hidden" }}>
                <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 4px" }}>
                  <SubBtn vKey="history"      lbl="Visit History" />
                  <SubBtn vKey="allergies"    lbl="Allergies & Conditions" />
                  <SubBtn vKey="medications"  lbl="Medications" />
                  <SubBtn vKey="vaccinations" lbl="Vaccinations" />
                </div>
                <div style={{ padding:"24px" }}>

                  {visitSub === "history" && (
                    patient.visits.length === 0
                      ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No visit records found.</p>
                      : patient.visits.map((v,i) => (
                        <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"20px 24px", marginBottom:"16px" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                              <div style={{ width:"36px", height:"36px", background:C.primaryGhost, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color:C.primary, flexShrink:0 }}><CalIcon /></div>
                              <div>
                                <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary }}>{v.date} at {v.time}</div>
                                <div style={{ fontSize:"12px", color:C.textSecondary }}>{v.doctor} — {v.hospital}</div>
                              </div>
                            </div>
                            <span style={{ background:C.bg, border:`1px solid ${C.border}`, padding:"5px 14px", borderRadius:"999px", fontSize:"12px", fontWeight:"600", color:C.textPrimary, whiteSpace:"nowrap" }}>{v.type}</span>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"20px" }}>
                            {[["REASON FOR VISIT",v.reason],["DIAGNOSIS",v.diagnosis],["ADDITIONAL NOTES",v.notes]].map(([h,t]) => (
                              <div key={h}>
                                <div style={{ fontSize:"11px", fontWeight:"700", color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"6px" }}>{h}</div>
                                <div style={{ fontSize:"14px", color:C.textPrimary, lineHeight:1.6 }}>{t}</div>
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
                        {patient.allergies.length === 0
                          ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No known allergies.</p>
                          : patient.allergies.map((a,i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:"#FFF8E1", border:"1px solid #FFE082", borderRadius:"10px", marginBottom:"8px" }}>
                              <span style={{ fontSize:"16px" }}>⚠️</span>
                              <span style={{ fontSize:"14px", color:"#E65100", fontWeight:"600" }}>{a}</span>
                            </div>
                          ))
                        }
                      </div>
                      <div>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary, marginBottom:"12px" }}>Conditions</div>
                        {patient.conditions.map((c,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:C.primaryGhost, border:`1px solid rgba(28,74,62,0.2)`, borderRadius:"10px", marginBottom:"8px" }}>
                            <span style={{ fontSize:"16px" }}>🩺</span>
                            <span style={{ fontSize:"14px", color:C.primary, fontWeight:"600" }}>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {visitSub === "medications" && (
                    patient.medications.length === 0
                      ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No current medications.</p>
                      : patient.medications.map((m,i) => (
                        <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px 20px", marginBottom:"12px", display:"flex", gap:"16px", alignItems:"flex-start" }}>
                          <div style={{ width:"36px", height:"36px", background:C.primaryGhost, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>💊</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:"15px", fontWeight:"700", color:C.textPrimary, marginBottom:"4px" }}>{m.name}</div>
                            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                              <span style={{ fontSize:"13px", color:C.textSecondary }}>Frequency: <strong style={{ color:C.textPrimary }}>{m.frequency}</strong></span>
                              <span style={{ fontSize:"13px", color:C.textSecondary }}>Duration: <strong style={{ color:C.textPrimary }}>{m.duration}</strong></span>
                              <span style={{ fontSize:"13px", color:C.textSecondary }}>Instructions: <strong style={{ color:C.textPrimary }}>{m.instructions}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}

                  {visitSub === "vaccinations" && (
                    patient.vaccinations.length === 0
                      ? <p style={{ color:C.textSecondary, fontSize:"14px" }}>No vaccination records.</p>
                      : patient.vaccinations.map((v,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px", background:C.bg, borderRadius:"10px", marginBottom:"10px", border:`1px solid ${C.border}` }}>
                          <div style={{ width:"36px", height:"36px", background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>💉</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary }}>{v.name}</div>
                            <div style={{ fontSize:"12px", color:C.textSecondary }}>{v.dose} · {v.date}</div>
                          </div>
                          <span style={{ background:"#E8F5E9", color:"#2E7D32", border:"1px solid #A5D6A7", padding:"4px 12px", borderRadius:"999px", fontSize:"12px", fontWeight:"600" }}>✓ Done</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                DIAGNOSIS
            ══════════════════════════════════════ */}
            {tab === "diagnosis" && (
              <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, padding:"28px 32px", boxShadow:"0 2px 8px rgba(28,74,62,0.04)" }}>
                <div style={{ fontSize:"16px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display, marginBottom:"4px" }}>Diagnosis Entry</div>
                <div style={{ fontSize:"13px", color:C.textSecondary, marginBottom:"20px" }}>Record the patient diagnosis and findings</div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", display:"flex", flexDirection:"column", gap:"18px" }}>

                  <div>
                    <span style={fldLabel}>Reason for Visit</span>
                    <input value={diag.reason} onChange={e=>setDiag(d=>({...d,reason:e.target.value}))}
                      placeholder="e.g., Ongoing tiredness and periodic headaches"
                      onFocus={()=>setFocused("dr")} onBlur={()=>setFocused(null)}
                      style={inputSt(focused==="dr")} />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                    <div>
                      <span style={fldLabel}>Primary Diagnosis</span>
                      <input value={diag.primary} onChange={e=>setDiag(d=>({...d,primary:e.target.value}))}
                        placeholder="e.g., Migraine episodes aggravated by exhaustion"
                        onFocus={()=>setFocused("dp")} onBlur={()=>setFocused(null)}
                        style={inputSt(focused==="dp")} />
                    </div>
                    <div>
                      <span style={fldLabel}>ICD Code</span>
                      <input value={diag.icd} onChange={e=>setDiag(d=>({...d,icd:e.target.value}))}
                        placeholder="e.g., G43.909"
                        onFocus={()=>setFocused("di")} onBlur={()=>setFocused(null)}
                        style={inputSt(focused==="di")} />
                    </div>
                  </div>

                  <div>
                    <span style={fldLabel}>Secondary Diagnosis <span style={{ color:C.textSecondary, fontWeight:"400" }}>(Optional)</span></span>
                    <input value={diag.secondary} onChange={e=>setDiag(d=>({...d,secondary:e.target.value}))}
                      placeholder="Additional conditions identified"
                      onFocus={()=>setFocused("ds")} onBlur={()=>setFocused(null)}
                      style={inputSt(focused==="ds")} />
                  </div>

                  <div>
                    <span style={fldLabel}>Severity</span>
                    <select value={diag.severity} onChange={e=>setDiag(d=>({...d,severity:e.target.value}))}
                      style={{ ...inputSt(false), cursor:"pointer", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center" }}>
                      {["Mild","Moderate","Severe","Critical"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <span style={fldLabel}>Clinical Findings</span>
                    <textarea value={diag.findings} onChange={e=>setDiag(d=>({...d,findings:e.target.value}))}
                      placeholder="Describe physical examination findings, test results, and observations..."
                      rows={5} onFocus={()=>setFocused("df")} onBlur={()=>setFocused(null)}
                      style={{ ...inputSt(focused==="df"), resize:"vertical" }} />
                  </div>

                  <SaveFooter lbl="Save Diagnosis" />
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                PRESCRIPTION
            ══════════════════════════════════════ */}
            {tab === "prescription" && (
              <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, padding:"28px 32px", boxShadow:"0 2px 8px rgba(28,74,62,0.04)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
                  <div style={{ fontSize:"16px", fontWeight:"700", color:C.textPrimary, fontFamily:F.display }}>Prescription Entry</div>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"5px 14px", background:"#E8F5E9", color:"#2E7D32", border:"1px solid #A5D6A7", borderRadius:"999px", fontSize:"12px", fontWeight:"600" }}>
                    ⚡ Drug interaction checks active
                  </span>
                </div>
                <div style={{ fontSize:"13px", color:C.textSecondary, marginBottom:"20px" }}>Add medications with dosage and instructions, or upload a prescription image</div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px" }}>

                  {meds.map((med,i) => (
                    <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"20px 24px", marginBottom:"14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary }}>Medication #{i+1}</div>
                        {meds.length > 1 && (
                          <button onClick={()=>removeMed(i)}
                            style={{ background:"#FFEBEE", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", color:C.error, display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:"600" }}>
                            <TrashIcon /> Remove
                          </button>
                        )}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"14px", marginBottom:"14px" }}>
                        <div>
                          <span style={fldLabel}>Medication Name</span>
                          <input value={med.name} onChange={e=>updateMed(i,"name",e.target.value)} placeholder="e.g., Sumatriptan"
                            onFocus={()=>setFocused(`mn${i}`)} onBlur={()=>setFocused(null)} style={inputSt(focused===`mn${i}`)} />
                        </div>
                        <div>
                          <span style={fldLabel}>Dosage</span>
                          <input value={med.dosage} onChange={e=>updateMed(i,"dosage",e.target.value)} placeholder="e.g., 50mg"
                            onFocus={()=>setFocused(`md${i}`)} onBlur={()=>setFocused(null)} style={inputSt(focused===`md${i}`)} />
                        </div>
                        <div>
                          <span style={fldLabel}>Frequency</span>
                          <select value={med.frequency} onChange={e=>updateMed(i,"frequency",e.target.value)} style={{ ...inputSt(false), cursor:"pointer" }}>
                            {["Once daily","Twice daily","Three times daily","Four times daily","As needed","Every 8 hours","Every 12 hours","Weekly"].map(f=><option key={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"14px" }}>
                        <div>
                          <span style={fldLabel}>Duration</span>
                          <input value={med.duration} onChange={e=>updateMed(i,"duration",e.target.value)} placeholder="e.g., 30 days"
                            onFocus={()=>setFocused(`mdu${i}`)} onBlur={()=>setFocused(null)} style={inputSt(focused===`mdu${i}`)} />
                        </div>
                        <div>
                          <span style={fldLabel}>Special Instructions</span>
                          <input value={med.instructions} onChange={e=>updateMed(i,"instructions",e.target.value)} placeholder="e.g., Take with food"
                            onFocus={()=>setFocused(`mi${i}`)} onBlur={()=>setFocused(null)} style={inputSt(focused===`mi${i}`)} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={addMed}
                    style={{ width:"100%", padding:"13px", background:"transparent", border:`1.5px dashed ${C.border}`, borderRadius:"12px", cursor:"pointer", fontSize:"14px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"20px", transition:"all 0.2s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSecondary;}}
                  ><PlusIcon /> Add Another Medication</button>

                  {/* Upload prescription image */}
                  <div style={{ border:`1px solid ${C.border}`, borderRadius:"12px", padding:"20px 24px", marginBottom:"20px" }}>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:C.textPrimary, marginBottom:"4px", display:"flex", alignItems:"center", gap:"8px" }}>
                      <ImageIcon /> Upload Prescription Image
                    </div>
                    <div style={{ fontSize:"13px", color:C.textSecondary, marginBottom:"14px" }}>Upload a scanned or photographed prescription</div>
                    <input ref={prescRef} type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={onPrescImg} />
                    <button onClick={()=>prescRef.current.click()}
                      style={{ padding:"10px 20px", background:C.bg, border:`1.5px dashed ${C.border}`, borderRadius:"10px", cursor:"pointer", fontSize:"13px", fontWeight:"600", color:C.textSecondary, fontFamily:F.body, display:"flex", alignItems:"center", gap:"8px", transition:"all 0.2s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSecondary;}}
                    ><UploadIcon /> Choose File</button>
                    {prescImages.length > 0 && (
                      <div style={{ marginTop:"12px", display:"flex", flexWrap:"wrap", gap:"10px" }}>
                        {prescImages.map((img,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", background:C.primaryGhost, border:`1px solid rgba(28,74,62,0.2)`, padding:"7px 14px", borderRadius:"8px" }}>
                            <ImageIcon /><span style={{ fontSize:"13px", color:C.primary, fontWeight:"600" }}>{img.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <SaveFooter lbl="Submit Prescription" />
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                LAB REPORTS
            ══════════════════════════════════════ */}
            {tab === "lab" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"14px" }}>
                  <input ref={labRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={onLabUpload} />
                  <button onClick={()=>labRef.current.click()}
                    style={{ padding:"10px 20px", background:C.primary, border:"none", borderRadius:"10px", color:"#fff", fontSize:"13px", fontWeight:"700", fontFamily:F.body, cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", transition:"background 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.primaryLight}
                    onMouseLeave={e=>e.currentTarget.style.background=C.primary}
                  ><UploadIcon /> Upload Lab Report</button>
                </div>

                <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 8px rgba(28,74,62,0.04)" }}>
                  {labReports.length === 0 ? (
                    <div style={{ padding:"48px", textAlign:"center", color:C.textSecondary, fontSize:"14px" }}>
                      <div style={{ fontSize:"32px", marginBottom:"12px" }}>📋</div>
                      No lab reports uploaded yet.
                    </div>
                  ) : (
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                          {["Report Name","Date","Status","Action"].map(h => (
                            <th key={h} style={{ padding:"13px 20px", fontSize:"12px", fontWeight:"700", color:C.textSecondary, textAlign:"left", textTransform:"uppercase", letterSpacing:"0.7px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {labReports.map((r,i) => {
                          const s = sc(r.status);
                          return (
                            <tr key={i} style={{ borderBottom: i<labReports.length-1 ? `1px solid ${C.border}` : "none" }}>
                              <td style={{ padding:"16px 20px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                                  <div style={{ width:"34px", height:"34px", background:C.primaryGhost, borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color:C.primary }}><FileIcon /></div>
                                  <span style={{ fontSize:"14px", fontWeight:"600", color:C.textPrimary }}>{r.name}</span>
                                </div>
                              </td>
                              <td style={{ padding:"16px 20px", fontSize:"13px", color:C.textSecondary }}>{r.date}</td>
                              <td style={{ padding:"16px 20px" }}>
                                <span style={{ background:s.bg, color:s.color, border:`1.5px solid ${s.bd}`, padding:"5px 12px", borderRadius:"999px", fontSize:"12px", fontWeight:"600" }}>{r.status}</span>
                              </td>
                              <td style={{ padding:"16px 20px" }}>
                                {r.file
                                  ? <a href={r.file} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"7px 16px", background:C.primaryGhost, color:C.primary, border:`1px solid rgba(28,74,62,0.2)`, borderRadius:"8px", fontSize:"13px", fontWeight:"600", textDecoration:"none" }}>View</a>
                                  : <span style={{ fontSize:"13px", color:C.textSecondary }}>—</span>
                                }
                              </td>
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
