import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout, { Logo } from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { palette, fonts, radius } from "../../styles/theme";

// ── Icons ─────────────────────────────────────────────────────────────────────
const PersonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.28 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.32-1.32a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IdIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="8" y1="10" x2="8" y2="10" strokeWidth="3" />
    <line x1="12" y1="9" x2="16" y2="9" />
    <line x1="12" y1="12" x2="16" y2="12" />
    <line x1="12" y1="15" x2="14" y2="15" />
    <circle cx="8" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const HospitalIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const GraduationIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="9" y1="7" x2="9" y2="7" strokeWidth="3" />
    <line x1="15" y1="7" x2="15" y2="7" strokeWidth="3" />
    <line x1="9" y1="12" x2="9" y2="12" strokeWidth="3" />
    <line x1="15" y1="12" x2="15" y2="12" strokeWidth="3" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Specialty selector ────────────────────────────────────────────────────────
const specialtyOptions = [
  "General Practitioner", "Cardiologist", "Neurologist", "Orthopedic Surgeon",
  "Pediatrician", "Dermatologist", "Psychiatrist", "Radiologist",
  "Oncologist", "Emergency Medicine", "Gynecologist", "Anesthesiologist",
  "General Medicine", "Internal Medicine", "Diabetes Management",
  "Preventive Healthcare",
];

// ── Specialty Multi-Select Dropdown ──────────────────────────────────────────
const SpecialtySelector = ({ selected, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const toggle = (s) => {
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addCustom(); }
  };

  const remove = (s) => onChange(selected.filter((x) => x !== s));

  return (
    <div style={{ marginBottom: error ? "8px" : "20px" }}>
      <FieldLabel>Specializations</FieldLabel>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {selected.map((s) => (
            <span key={s} style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 10px", borderRadius: "999px",
              background: `${palette.primary}18`, border: `1.5px solid ${palette.primary}`,
              color: palette.primary, fontSize: "13px", fontFamily: fonts.body, fontWeight: "600",
            }}>
              {s}
              <button onClick={() => remove(s)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: palette.primary, padding: "0", lineHeight: 1,
                fontSize: "15px", display: "flex", alignItems: "center",
              }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: "100%", padding: "13px 14px",
            background: palette.inputBg,
            border: `1.5px solid ${error ? palette.error : palette.border}`,
            borderRadius: open ? `${radius.md} ${radius.md} 0 0` : radius.md,
            fontSize: "14px", color: palette.textSecondary,
            fontFamily: fonts.body, outline: "none",
            cursor: "pointer", textAlign: "left",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <span>{selected.length ? `${selected.length} selected — add more` : "Select specializations…"}</span>
          <span style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", fontSize: "12px" }}>▾</span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            background: palette.inputBg,
            border: `1.5px solid ${palette.border}`, borderTop: "none",
            borderRadius: `0 0 ${radius.md} ${radius.md}`,
            maxHeight: "220px", overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}>
            {specialtyOptions.map((s) => {
              const isSelected = selected.includes(s);
              return (
                <div
                  key={s}
                  onClick={() => toggle(s)}
                  style={{
                    padding: "11px 14px", cursor: "pointer", fontSize: "14px",
                    fontFamily: fonts.body, display: "flex", alignItems: "center", gap: "10px",
                    background: isSelected ? `${palette.primary}10` : "transparent",
                    color: isSelected ? palette.primary : palette.textPrimary,
                    fontWeight: isSelected ? "600" : "400",
                    transition: "background 0.1s",
                  }}
                >
                  <span style={{
                    width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                    border: `2px solid ${isSelected ? palette.primary : palette.border}`,
                    background: isSelected ? palette.primary : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
                  </span>
                  {s}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom specialization input */}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <input
          type="text"
          placeholder="Can't find yours? Type a custom specialization…"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, padding: "10px 12px",
            background: palette.inputBg,
            border: `1.5px solid ${palette.border}`,
            borderRadius: radius.md, fontSize: "13px",
            color: palette.textPrimary, fontFamily: fonts.body,
            outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          onClick={addCustom}
          disabled={!customInput.trim()}
          style={{
            padding: "10px 14px", borderRadius: radius.md,
            background: customInput.trim() ? palette.primary : palette.border,
            border: "none", color: customInput.trim() ? "#fff" : palette.textSecondary,
            fontSize: "13px", fontFamily: fonts.body, fontWeight: "600",
            cursor: customInput.trim() ? "pointer" : "not-allowed",
            whiteSpace: "nowrap", transition: "background 0.15s",
          }}
        >
          + Add
        </button>
      </div>

      {error && <p style={{ fontSize: "12px", color: palette.error, marginTop: "6px", fontFamily: fonts.body }}>{error}</p>}
    </div>
  );
};

// ── Credential types ──────────────────────────────────────────────────────────
const credentialTypes = ["MBBS", "MD", "MS", "DNB", "Fellowship", "DM", "MCh", "PhD", "FRCS", "MRCP", "Other"];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, total }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div style={{
          width: i === current ? "28px" : "10px",
          height: "8px",
          borderRadius: "999px",
          background: i <= current ? palette.primary : palette.border,
          transition: "all 0.3s ease",
          flexShrink: 0,
        }} />
      </React.Fragment>
    ))}
    <span style={{ marginLeft: "auto", fontSize: "12px", color: palette.textSecondary, fontFamily: fonts.body }}>
      Step {current + 1} of {total}
    </span>
  </div>
);

// ── Label component ───────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
  <label style={{
    display: "block", fontSize: "11px", fontWeight: "700",
    color: palette.textSecondary, marginBottom: "6px",
    letterSpacing: "1px", textTransform: "uppercase", fontFamily: fonts.body,
  }}>
    {children}
  </label>
);

// ── Credential Card ───────────────────────────────────────────────────────────
const CredentialCard = ({ cred, index, onChange, onRemove, errors }) => {
  const field = (key) => (e) => onChange(index, key, e.target.value);
  const inputStyle = (errKey) => ({
    width: "100%", padding: "11px 12px",
    background: palette.inputBg,
    border: `1.5px solid ${errors?.[errKey] ? palette.error : palette.border}`,
    borderRadius: radius.md, fontSize: "14px",
    color: palette.textPrimary, fontFamily: fonts.body,
    outline: "none", boxSizing: "border-box",
  });

  return (
    <div style={{
      background: palette.inputBg,
      border: `1.5px solid ${palette.border}`,
      borderRadius: radius.md,
      padding: "16px",
      marginBottom: "12px",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: palette.textPrimary, fontFamily: fonts.body }}>
          Credential {index + 1}
        </span>
        {index > 0 && (
          <button
            onClick={() => onRemove(index)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: palette.error, padding: "4px", borderRadius: "4px",
              display: "flex", alignItems: "center",
            }}
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Type + Degree row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div>
          <FieldLabel>Degree / Type</FieldLabel>
          <div style={{ position: "relative" }}>
            <select value={cred.type} onChange={field("type")} style={{ ...inputStyle("type"), appearance: "none", cursor: "pointer", paddingRight: "28px" }}>
              <option value="" disabled>Select type</option>
              {credentialTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: palette.placeholder, fontSize: "12px" }}>▾</span>
          </div>
          {errors?.type && <p style={{ fontSize: "11px", color: palette.error, marginTop: "3px" }}>{errors.type}</p>}
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <input
            type="number" min="1950" max={new Date().getFullYear()}
            placeholder="e.g. 2010"
            value={cred.year} onChange={field("year")}
            style={inputStyle("year")}
          />
          {errors?.year && <p style={{ fontSize: "11px", color: palette.error, marginTop: "3px" }}>{errors.year}</p>}
        </div>
      </div>

      {/* Specialization field (what the degree is in) */}
      <div style={{ marginBottom: "10px" }}>
        <FieldLabel>Specialization / Field</FieldLabel>
        <input
          type="text" placeholder="e.g. General Medicine, Cardiology…"
          value={cred.field} onChange={field("field")}
          style={inputStyle("field")}
        />
        {errors?.field && <p style={{ fontSize: "11px", color: palette.error, marginTop: "3px" }}>{errors.field}</p>}
      </div>

      {/* Institution */}
      <div>
        <FieldLabel>Institution</FieldLabel>
        <input
          type="text" placeholder="e.g. AIIMS, Delhi"
          value={cred.institution} onChange={field("institution")}
          style={inputStyle("institution")}
        />
        {errors?.institution && <p style={{ fontSize: "11px", color: palette.error, marginTop: "3px" }}>{errors.institution}</p>}
      </div>
    </div>
  );
};

// ── SignUp Page ───────────────────────────────────────────────────────────────
const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=personal, 1=professional, 2=credentials, 3=security
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", dob: "",
    licenseId: "", hospital: "",
    specialties: [],
    password: "", confirmPassword: "",
  });
  const [credentials, setCredentials] = useState([
    { type: "", field: "", institution: "", year: "" },
  ]);
  const [errors, setErrors] = useState({});
  const [credErrors, setCredErrors] = useState([{}]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // ── Credentials helpers ──
  const updateCred = (idx, key, val) => {
    setCredentials((cs) => cs.map((c, i) => i === idx ? { ...c, [key]: val } : c));
    if (credErrors[idx]?.[key]) {
      setCredErrors((ce) => ce.map((e, i) => i === idx ? { ...e, [key]: undefined } : e));
    }
  };
  const addCred = () => {
    setCredentials((cs) => [...cs, { type: "", field: "", institution: "", year: "" }]);
    setCredErrors((ce) => [...ce, {}]);
  };
  const removeCred = (idx) => {
    setCredentials((cs) => cs.filter((_, i) => i !== idx));
    setCredErrors((ce) => ce.filter((_, i) => i !== idx));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.fullName.trim()) errs.fullName = "Full name is required.";
      if (!form.email) errs.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
      if (!form.phone.trim()) errs.phone = "Mobile number is required.";
      if (!form.dob) errs.dob = "Date of birth is required.";
    }
    if (step === 1) {
      if (!form.licenseId.trim()) errs.licenseId = "License ID is required.";
      if (!form.hospital.trim()) errs.hospital = "Hospital / clinic name is required.";
      if (!form.specialties.length) errs.specialties = "Please select at least one specialty.";
    }
    if (step === 2) {
      const newCredErrors = credentials.map((c) => {
        const e = {};
        if (!c.type) e.type = "Required";
        if (!c.field.trim()) e.field = "Required";
        if (!c.institution.trim()) e.institution = "Required";
        if (!c.year) e.year = "Required";
        return e;
      });
      const hasCredErr = newCredErrors.some((e) => Object.keys(e).length > 0);
      if (hasCredErr) { setCredErrors(newCredErrors); return { _credError: true }; }
    }
    if (step === 3) {
      if (!form.password) errs.password = "Password is required.";
      else if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
      if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
      else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
      if (!agreed) errs.agreed = "You must agree to the Terms of Service.";
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    const errs = validateStep();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    navigate("/login");
  };

  const stepTitles = ["Personal Info", "Professional Info", "Credentials", "Set Password"];
  const stepSubtitles = [
    "Let's start with your basic information.",
    "Tell us about your role and specializations.",
    "Add your academic and professional credentials.",
    "Secure your SafeMed account.",
  ];

  const inputIconStyle = {
    position: "relative", display: "flex", alignItems: "center",
  };

  return (
    <AuthLayout maxWidth="460px">
      <Logo />
      <StepIndicator current={step} total={4} />

      <h1 style={{ fontSize: "24px", fontWeight: "700", color: palette.textPrimary, marginBottom: "4px", fontFamily: "'Georgia', serif", letterSpacing: "-0.3px" }}>
        {stepTitles[step]}
      </h1>
      <p style={{ fontSize: "14px", color: palette.textSecondary, marginBottom: "28px", lineHeight: 1.6, fontFamily: fonts.body }}>
        {stepSubtitles[step]}
      </p>

      {/* ── Step 0: Personal ── */}
      {step === 0 && (
        <>
          <InputField label="Full Name" icon={<PersonIcon />} placeholder="Dr. Jane Smith" value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
          <InputField label="Email Address" icon={<MailIcon />} type="email" placeholder="doctor@hospital.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
          <InputField label="Phone Number" icon={<PhoneIcon />} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
          <InputField label="Date of Birth" icon={<CalendarIcon />} type="date" value={form.dob} onChange={set("dob")} error={errors.dob} autoComplete="bday" />
        </>
      )}

      {/* ── Step 1: Professional ── */}
      {step === 1 && (
        <>
          <InputField label="Medical License ID" icon={<IdIcon />} placeholder="MED-XXXXX" value={form.licenseId} onChange={set("licenseId")} error={errors.licenseId} />
          <InputField label="Hospital / Clinic" icon={<HospitalIcon />} placeholder="City General Hospital" value={form.hospital} onChange={set("hospital")} error={errors.hospital} />

          <SpecialtySelector
            selected={form.specialties}
            onChange={(val) => { setForm((f) => ({ ...f, specialties: val })); if (errors.specialties) setErrors((e) => ({ ...e, specialties: undefined })); }}
            error={errors.specialties}
          />
        </>
      )}

      {/* ── Step 2: Credentials ── */}
      {step === 2 && (
        <>
          <p style={{ fontSize: "13px", color: palette.textSecondary, marginBottom: "16px", fontFamily: fonts.body, lineHeight: 1.5 }}>
            Add your degrees, fellowships, and work experience. You can add multiple entries.
          </p>

          {credentials.map((cred, i) => (
            <CredentialCard
              key={i}
              cred={cred}
              index={i}
              onChange={updateCred}
              onRemove={removeCred}
              errors={credErrors[i]}
            />
          ))}

          <button
            onClick={addCred}
            style={{
              width: "100%",
              padding: "12px",
              border: `1.5px dashed ${palette.primary}`,
              borderRadius: radius.md,
              background: `${palette.primary}08`,
              color: palette.primary,
              fontSize: "14px",
              fontFamily: fonts.body,
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px",
              transition: "background 0.15s",
            }}
          >
            <PlusIcon /> Add Another Credential
          </button>
        </>
      )}

      {/* ── Step 3: Security ── */}
      {step === 3 && (
        <>
          <InputField label="Password" icon={<LockIcon />} placeholder="Min. 8 characters" value={form.password} onChange={set("password")} isPassword error={errors.password} autoComplete="new-password" />
          <InputField label="Confirm Password" icon={<LockIcon />} placeholder="Re-enter your password" value={form.confirmPassword} onChange={set("confirmPassword")} isPassword error={errors.confirmPassword} autoComplete="new-password" />

          {/* Password strength hint */}
          {form.password && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1, 2, 3, 4].map((lvl) => {
                  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(form.password)).length);
                  const colors = ["#D32F2F", "#E65100", "#F9A825", "#2E7D32"];
                  return <div key={lvl} style={{ flex: 1, height: "4px", borderRadius: "999px", background: lvl <= strength ? colors[strength - 1] : palette.border, transition: "background 0.3s" }} />;
                })}
              </div>
              <p style={{ fontSize: "11px", color: palette.textSecondary, fontFamily: fonts.body }}>
                Use uppercase, numbers, and symbols to strengthen your password.
              </p>
            </div>
          )}

          {/* Terms checkbox */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: errors.agreed ? "8px" : "24px" }}>
            <input type="checkbox" id="terms" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (errors.agreed) setErrors(er => ({ ...er, agreed: undefined })); }}
              style={{ width: "18px", height: "18px", accentColor: palette.primary, marginTop: "2px", flexShrink: 0, cursor: "pointer" }} />
            <label htmlFor="terms" style={{ fontSize: "13px", color: palette.textSecondary, fontFamily: fonts.body, lineHeight: 1.5, cursor: "pointer" }}>
              I agree to the{" "}
              <Link to="/terms" style={{ color: palette.primary, fontWeight: "600" }}>Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" style={{ color: palette.primary, fontWeight: "600" }}>Privacy Policy</Link>{" "}
              for healthcare professionals.
            </label>
          </div>
          {errors.agreed && <p style={{ fontSize: "12px", color: palette.error, marginBottom: "16px", fontFamily: fonts.body }}>{errors.agreed}</p>}
        </>
      )}

      {/* ── Navigation buttons ── */}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px", marginBottom: "24px" }}>
        {step > 0 && (
          <Button variant="outline" onClick={handleBack} style={{ flex: 1, padding: "14px" }}>
            ← Back
          </Button>
        )}
        {step < 3
          ? <Button onClick={handleNext} style={{ flex: 1, padding: "14px" }}>Continue →</Button>
          : <Button onClick={handleSubmit} loading={loading} style={{ flex: 1, padding: "14px" }}>Create Account</Button>
        }
      </div>

      <p style={{ textAlign: "center", fontSize: "14px", color: palette.textSecondary, fontFamily: fonts.body }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: palette.primary, fontWeight: "700", textDecoration: "none", borderBottom: `1.5px solid ${palette.primary}` }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignUpPage;
