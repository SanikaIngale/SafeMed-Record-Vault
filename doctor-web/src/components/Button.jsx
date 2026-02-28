import React, { useState } from "react";
import { palette, fonts, radius, shadow } from "../styles/theme";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",   // "primary" | "outline" | "ghost"
  fullWidth = false,
  disabled = false,
  loading = false,
  style: extraStyle = {},
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "14px 24px",
    borderRadius: radius.lg,
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: fonts.body,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    border: "none",
    transition: "background 0.2s, box-shadow 0.2s, transform 0.1s, opacity 0.2s",
    width: fullWidth ? "100%" : "auto",
    opacity: disabled ? 0.55 : 1,
    transform: pressed && !disabled ? "scale(0.98)" : "scale(1)",
    letterSpacing: "0.3px",
    ...extraStyle,
  };

  const variants = {
    primary: {
      background: hovered && !disabled ? palette.primaryLight : palette.primary,
      color: palette.white,
      boxShadow: hovered && !disabled ? shadow.btnHover : shadow.btn,
    },
    outline: {
      background: "transparent",
      color: palette.primary,
      border: `2px solid ${palette.primary}`,
      boxShadow: "none",
    },
    ghost: {
      background: hovered && !disabled ? palette.primaryGhost : "transparent",
      color: palette.primary,
      boxShadow: "none",
    },
  };

  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {loading ? (
        <>
          <span style={{
            width: "16px", height: "16px",
            border: `2px solid rgba(255,255,255,0.4)`,
            borderTop: `2px solid white`,
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            display: "inline-block",
          }} />
          Please wait...
        </>
      ) : children}
    </button>
  );
};

export default Button;
