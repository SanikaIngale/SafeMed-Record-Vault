import React from "react";
import { palette, fonts, shadow, radius } from "../styles/theme";

// ── Decorative background blobs ──────────────────────────────────────────────
const BgDecor = () => (
  <>
    <div style={{
      position: "fixed", top: "-120px", right: "-120px",
      width: "420px", height: "420px", borderRadius: "50%",
      background: `radial-gradient(circle, ${palette.primaryGhost} 0%, transparent 70%)`,
      pointerEvents: "none", zIndex: 0,
    }} />
    <div style={{
      position: "fixed", bottom: "-100px", left: "-100px",
      width: "350px", height: "350px", borderRadius: "50%",
      background: `radial-gradient(circle, #E8F0EE 0%, transparent 70%)`,
      pointerEvents: "none", zIndex: 0,
    }} />
    <div style={{
      position: "fixed", top: "40%", left: "5%",
      width: "180px", height: "180px", borderRadius: "50%",
      background: `radial-gradient(circle, rgba(21,101,192,0.04) 0%, transparent 70%)`,
      pointerEvents: "none", zIndex: 0,
    }} />
  </>
);

// ── Logo ─────────────────────────────────────────────────────────────────────
export const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
    <div style={{
      width: "48px", height: "48px",
      background: palette.primary,
      borderRadius: radius.md,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px rgba(28,74,62,0.3)",
      flexShrink: 0,
    }}>
      {/* Caduceus / medical cross SVG logo */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="11" y="2" width="2" height="20" rx="1" fill="white"/>
        <rect x="2" y="11" width="20" height="2" rx="1" fill="white"/>
        <rect x="7" y="7" width="10" height="10" rx="1" fill="white" opacity="0.25"/>
        <circle cx="12" cy="12" r="2.5" fill="white"/>
      </svg>
    </div>
    <div>
      <div style={{ fontSize: "22px", fontWeight: "800", color: palette.primary, fontFamily: fonts.display, letterSpacing: "-0.5px", lineHeight: 1 }}>
        SafeMed
      </div>
      <div style={{ fontSize: "10px", color: palette.textSecondary, letterSpacing: "2px", textTransform: "uppercase", fontFamily: fonts.body, marginTop: "2px" }}>
        Doctor Portal
      </div>
    </div>
  </div>
);

// ── Auth page wrapper ─────────────────────────────────────────────────────────
const AuthLayout = ({ children, maxWidth = "420px" }) => (
  <div style={{
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${palette.bg} 0%, #E8F0EE 100%)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: fonts.body,
    padding: "24px",
    position: "relative",
    overflow: "hidden",
  }}>
    <BgDecor />
    <div style={{
      background: palette.card,
      borderRadius: radius.xl,
      boxShadow: shadow.card,
      padding: "48px 40px",
      width: "100%",
      maxWidth,
      position: "relative",
      zIndex: 1,
    }}>
      {children}
    </div>
  </div>
);

export default AuthLayout;
