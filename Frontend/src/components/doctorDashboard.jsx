import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../styles/hospitalAdmin.css';
import {
  GridView as DashboardIcon,
  FolderShared as PatientRecordsIcon,
  Medication as DrugInventoryIcon,
  ReceiptLong as PharmacyIcon,
  CalendarMonth as AppointmentsIcon,
  ManageAccounts as UserStaffIcon,
  Emergency as EmergencyIcon,
  Tune as SettingsIcon,
  Search as SearchIcon,
  NotificationsNone as BellIcon,
  Logout as LogoutIcon,
  Shield as ShieldIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import LogoOriginal from '../assets/Logo_Original.png';

export default function Doctordashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem('Role') || 'Admin';
  const userName = localStorage.getItem('Name') || 'AdminTest';

  const handleLogout = () => {
    localStorage.removeItem('Token');
    localStorage.removeItem('Role');
    localStorage.removeItem('Name');
    localStorage.removeItem('id');
    navigate('/admin');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  // Derive page specific breadcrumbs for the top bar
  const getBreadcrumbContext = () => {
    const path = location.pathname;
    if (path.includes('Add-users') || path.includes('users')) {
      return {
        section: 'Identity & Access Governance',
        page: 'Staff Directory',
        statusText: 'Sync: Active LDAP/Okta',
        secCode: 'v4.2.1-SEC',
      };
    }
    if (path.includes('pharmacy')) {
      return {
        section: 'Clinical Dispensary Core',
        page: 'Ward & OPD Billing Hub',
        statusText: 'Terminal Rx-North-04',
        secCode: 'Stock Database Live ERP Sync (0.8s)',
      };
    }
    if (path.includes('medical-history') || path.includes('patient-records')) {
      return {
        section: 'Portal',
        page: 'Search Patient Records',
        statusText: 'Live EHR Synchronized',
        secCode: 'Active Inpatients: 342 • Latency: 42ms',
      };
    }
    if (path.includes('register-medicines') || path.includes('inventory')) {
      return {
        section: 'Portal > Pharmacy & Formulary',
        page: 'Drug Registration & Stock',
        statusText: 'Central Vault Sync: Real-Time',
        secCode: 'Last audit: 12 mins ago',
      };
    }
    if (path.includes('daily-appointments') || path.includes('add-timeslot')) {
      return {
        section: 'CareSync+ OPD Roster & Real-time Scheduling Engine',
        page: 'Clinic Floor Tier 2 & 4',
        statusText: 'Roster Synchronized',
        secCode: 'All Clinics Active',
      };
    }
    if (path.includes('emergency')) {
      return {
        section: 'Trauma & Acute Emergency Response Wing',
        page: 'Live Triage Desk',
        statusText: 'Telemetry: 24/7 Red-Alert Ready',
        secCode: 'Defibrillator Mesh Active',
      };
    }
    return {
      section: 'CareSync+ Core Enterprise',
      page: 'Executive Clinical Overview',
      statusText: 'System Core v4.2.1',
      secCode: 'HIPAA Encrypted',
    };
  };

  const contextInfo = getBreadcrumbContext();

  return (
    <div className="hospital-admin-layout">
      {/* ── Left Sidebar ────────────────────────────────────────── */}
      <aside className={`hospital-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-show' : ''}`}>
        {/* Brand header */}
        <div className="hospital-sidebar-brand">
          <div className="brand-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LogoOriginal} alt="CareSync Logo" style={{ height: '36px', objectFit: 'contain' }} />
            <div className="brand-text-block" style={{ marginTop: '4px' }}>
              <span className="brand-subtitle" style={{ fontSize: '10.5px', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.7)' }}>HOSPITAL ADMIN</span>
            </div>
          </div>
          <div className="hipaa-pill-badge">
            <ShieldIcon sx={{ fontSize: 13 }} />
            <span>HIPAA Encrypted v4.2</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="hospital-nav-scroll">
          <div className="nav-section-label">MAIN WORKSPACE</div>
          <ul className="hospital-nav-list">
            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/overview"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <DashboardIcon className="nav-icon" />
                <span>Dashboard</span>
              </NavLink>
            </li>

            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/medical-history"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <PatientRecordsIcon className="nav-icon" />
                <span>Patient Records</span>
              </NavLink>
            </li>

            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/register-medicines"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <DrugInventoryIcon className="nav-icon" />
                <span>Drug & Inventory</span>
              </NavLink>
            </li>

            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/pharmacy"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <PharmacyIcon className="nav-icon" />
                <span>Pharmacy Dispensing</span>
              </NavLink>
            </li>

            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/daily-appointments"
                className={({ isActive }) =>
                  `hospital-nav-link ${isActive || location.pathname.includes('add-timeslot') ? 'active' : ''}`
                }
                onClick={closeMobile}
              >
                <AppointmentsIcon className="nav-icon" />
                <span>Appointments & Timeslots</span>
              </NavLink>
            </li>

            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/Add-users"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <UserStaffIcon className="nav-icon" />
                <span>User & Staff</span>
              </NavLink>
            </li>
          </ul>

          <div className="nav-section-label">SYSTEM / CLINICAL</div>
          <ul className="hospital-nav-list">
            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/emergency"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <EmergencyIcon className="nav-icon" sx={{ color: '#EF4444 !important' }} />
                <span>Trauma / Emergency</span>
              </NavLink>
            </li>

            <li className="hospital-nav-item">
              <NavLink
                to="/dashboard/settings-audit"
                className={({ isActive }) => `hospital-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <SettingsIcon className="nav-icon" />
                <span>Settings & Audit</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer User Widget */}
        <div className="hospital-sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">
                {role === 'Admin' ? 'Super Admin' : role === 'Doc' ? 'Attending Doctor' : 'Pharmacist'}
              </div>
            </div>
            <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign Out">
              <LogoutIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <div className="hospital-main-wrapper">
        {/* Topbar Header */}
        <header className="hospital-topbar">
          <div className="topbar-primary-row">
            <div className="topbar-left">
              <button
                className="topbar-icon-btn d-md-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ display: window.innerWidth <= 900 ? 'flex' : 'none' }}
              >
                {mobileMenuOpen ? <CloseIcon sx={{ fontSize: 20 }} /> : <MenuIcon sx={{ fontSize: 20 }} />}
              </button>

              <div className="topbar-breadcrumbs">
                <span className="crumb-link" onClick={() => navigate('/dashboard/overview')}>
                  Hospital Core
                </span>
                <span className="crumb-sep">&rsaquo;</span>
                <span>Clinical Operations</span>
              </div>

              <div className="status-pill sync-active">
                <span className="pulse-dot"></span>
                <span>Directory Sync: Active</span>
              </div>

              <div className="status-pill telemetry-live">
                <span className="pulse-dot"></span>
                <span>ICU Telemetry: Live</span>
              </div>
            </div>

            <div className="topbar-right">
              <div className="topbar-search-box">
                <SearchIcon sx={{ fontSize: 18, color: '#64748B' }} />
                <input type="text" placeholder="Search EHR, MRN, Rx..." />
              </div>

              <button className="topbar-icon-btn" title="Clinical Notifications">
                <BellIcon sx={{ fontSize: 20 }} />
                <span className="notif-badge-dot"></span>
              </button>

              <div
                className="sidebar-user-avatar"
                style={{ width: 34, height: 34, cursor: 'pointer', fontSize: 13 }}
                title={`${userName} (${role})`}
                onClick={() => navigate('/dashboard/Add-users')}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Secondary Context Row */}
          <div className="topbar-secondary-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{contextInfo.section}</span>
              <span style={{ color: '#CBD5E1' }}>&rsaquo;</span>
              <strong style={{ color: '#1E293B' }}>{contextInfo.page}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#0284C7', fontWeight: 600 }}>● {contextInfo.statusText}</span>
              <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <SecurityIcon sx={{ fontSize: 13, color: '#0A6E7C' }} /> {contextInfo.secCode}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="hospital-content-body">
          <Outlet />
        </main>

        {/* Shared Hospital Admin Footer */}
        <footer className="hospital-footer">
          <div className="footer-left">
            CareSync+ System Core v4.2.1 • Clinical Administration Console
          </div>
          <div className="footer-right">
            <span className="footer-badge-item">
              <ShieldIcon sx={{ fontSize: 14, color: '#0A6E7C' }} />
              <span>HIPAA Compliant</span>
            </span>
            <span className="footer-badge-item">
              <VerifiedIcon sx={{ fontSize: 14, color: '#0284C7' }} />
              <span>JCI Accredited Facility</span>
            </span>
            <span>&copy; 2024 CareSync+ Health Systems</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
