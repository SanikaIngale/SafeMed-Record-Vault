import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout, { Logo } from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { palette, fonts } from "../../styles/theme";

// ── Icons ─────────────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ── Login Page ────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    navigate("/dashboard"); // change to your next route
  };

  return (
    <AuthLayout maxWidth="420px">
      <Logo />

      <h1 style={{ fontSize: "28px", fontWeight: "700", color: palette.textPrimary, marginBottom: "6px", fontFamily: "'Georgia', serif", letterSpacing: "-0.5px" }}>
        Welcome back,<br />Doctor
      </h1>
      <p style={{ fontSize: "14px", color: palette.textSecondary, marginBottom: "32px", lineHeight: 1.6, fontFamily: fonts.body }}>
        Sign in to access your patient dashboard and clinical tools.
      </p>

      <InputField
        label="Email Address"
        icon={<MailIcon />}
        type="email"
        placeholder="doctor@hospital.com"
        value={form.email}
        onChange={set("email")}
        error={errors.email}
        autoComplete="email"
      />

      <InputField
        label="Password"
        icon={<LockIcon />}
        placeholder="Enter your password"
        value={form.password}
        onChange={set("password")}
        isPassword
        error={errors.password}
        autoComplete="current-password"
      />

      {/* Forgot password */}
      <div style={{ textAlign: "right", marginBottom: "24px", marginTop: "-8px" }}>
        <Link
          to="/forgot-password"
          style={{ fontSize: "13px", color: palette.primary, fontWeight: "600", fontFamily: fonts.body, textDecoration: "none", borderBottom: `1px solid ${palette.primary}`, paddingBottom: "1px" }}
        >
          Forgot password?
        </Link>
      </div>

      <Button fullWidth loading={loading} onClick={handleSubmit} style={{ marginBottom: "24px", padding: "15px" }}>
        Sign In
      </Button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, height: "1px", background: palette.border }} />
        <span style={{ fontSize: "12px", color: palette.placeholder, fontFamily: fonts.body, letterSpacing: "0.5px" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: palette.border }} />
      </div>

      <p style={{ textAlign: "center", fontSize: "14px", color: palette.textSecondary, fontFamily: fonts.body }}>
        Don't have an account?{" "}
        <Link to="/signup" style={{ color: palette.primary, fontWeight: "700", textDecoration: "none", borderBottom: `1.5px solid ${palette.primary}` }}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
