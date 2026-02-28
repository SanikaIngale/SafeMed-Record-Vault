import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage          from "./pages/auth/LoginPage";
import SignUpPage         from "./pages/auth/SignUpPage";
import DashboardPage      from "./pages/DashboardPage";
import ProfilePage        from "./pages/ProfilePage";
import PatientsPage       from "./pages/PatientsPage";
import PatientDetailPage  from "./pages/PatientDetailPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login"     element={<LoginPage />}     />
        <Route path="/signup"    element={<SignUpPage />}    />

        {/* App */}
        <Route path="/dashboard"        element={<DashboardPage />}     />
        <Route path="/profile"          element={<ProfilePage />}       />
        <Route path="/patients"         element={<PatientsPage />}      />
        <Route path="/patients/:id"     element={<PatientDetailPage />} />

        {/* Fallbacks */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;