import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage     from "./pages/auth/LoginPage";
import SignUpPage    from "./pages/auth/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage   from "./pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login"     element={<LoginPage />}     />
        <Route path="/signup"    element={<SignUpPage />}    />

        {/* App */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile"   element={<ProfilePage />}  />

        {/* Fallbacks */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;