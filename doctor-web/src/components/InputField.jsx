import React, { useState } from "react";
import { palette, fonts, radius, shadow } from "../styles/theme";

// ── Eye toggle icon ───────────────────────────────────────────────────────────
const EyeIcon = ({ visible }) =>
  visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

// ── InputField ────────────────────────────────────────────────────────────────
const InputField = ({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  isPassword = false,
  error,
  autoComplete,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);

  return (
    <div style={{ marginBottom: error ? "8px" : "16px" }}>
      {label && (
        <label style={{
          display: "block",
          fontSize: "11px",
          fontWeight: "700",
          color: focused ? palette.accent : palette.textSecondary,
          marginBottom: "6px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontFamily: fonts.body,
          transition: "color 0.2s",
        }}>
          {label}
        </label>
      )}

      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {/* Leading icon */}
        <span style={{
          position: "absolute", left: "14px",
          color: focused ? palette.accent : palette.placeholder,
          fontSize: "17px", pointerEvents: "none",
          transition: "color 0.2s",
          display: "flex", alignItems: "center",
        }}>
          {icon}
        </span>

        <input
          type={isPassword ? (showPw ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: `13px 14px 13px ${icon ? "44px" : "16px"}`,
            paddingRight: isPassword ? "44px" : "14px",
            background: focused ? palette.white : palette.inputBg,
            border: `1.5px solid ${error ? palette.error : focused ? palette.accent : palette.border}`,
            borderRadius: radius.md,
            fontSize: "15px",
            color: palette.textPrimary,
            fontFamily: fonts.body,
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
            boxShadow: focused
              ? error
                ? "0 0 0 3px rgba(211,47,47,0.12)"
                : shadow.inputFocus
              : "none",
            boxSizing: "border-box",
          }}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            style={{
              position: "absolute", right: "14px",
              background: "none", border: "none", cursor: "pointer",
              color: focused ? palette.accent : palette.placeholder,
              display: "flex", alignItems: "center", padding: "4px",
              transition: "color 0.2s",
            }}
          >
            <EyeIcon visible={showPw} />
          </button>
        )}
      </div>

      {/* Inline error message */}
      {error && (
        <p style={{
          fontSize: "12px", color: palette.error,
          marginTop: "4px", fontFamily: fonts.body,
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
