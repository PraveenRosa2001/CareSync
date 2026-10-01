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
import { ACCESS, ROLES, getDefaultDashboardPath, getRoleLabel, hasAccess, normalizeRole } from '../utils/roleAccess';

export default function Doctordashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = normalizeRole(localStorage.getItem('Role'));
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

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard/overview',
      icon: DashboardIcon,
      roles: ACCESS.DASHBOARD,
    },
    {
      label: 'Patient Records',
      to: '/dashboard/medical-history',
      icon: PatientRecordsIcon,
      roles: ACCESS.PATIENT_RECORDS,
    },
    {
      label: 'Drug & Inventory',
      to: '/dashboard/register-medicines',
      icon: DrugInventoryIcon,
      roles: ACCESS.DRUG_INVENTORY,
    },
    {
      label: 'Pharmacy Dispensing',
      to: '/dashboard/pharmacy',
      icon: PharmacyIcon,
      roles: ACCESS.PHARMACY,
    },
    {
      label: 'Appointments & Timeslots',
      to: '/dashboard/daily-appointments',
      icon: AppointmentsIcon,
      roles: ACCESS.APPOINTMENTS,
      matchExtra: 'add-timeslot',
    },
    {
      label: 'User & Staff',
      to: '/dashboard/Add-users',
      icon: UserStaffIcon,
      roles: ACCESS.USER_STAFF,
    },
  ];

  const visibleNavItems = navItems.filter((item) => hasAccess(role, item.roles));
  const defaultDashboardPath = getDefaultDashboardPath(role);

  const handleAvatarClick = () => {
    if (role === ROLES.ADMIN) {
      navigate('/dashboard/Add-users');
      return;
    }

    if (role === ROLES.DOCTOR) {
      navigate('/dashboard/doctor-profile');
      return;
    }

    navigate(defaultDashboardPath);
  };

  const contextInfo = getBreadcrumbContext();

  return (
    <div className="hospital-admin-layout">
      {/* ── Left Sidebar ────────────────────────────────────────── */}
      <aside className={`hospital-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-show' : ''}`}>
        {/* Brand header */}
        <div className="hospital-sidebar-brand">
          <div className="brand-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '36px', position: 'relative' }}>
            <img src={LogoOriginal} alt="CareSync Logo" style={{ width: '100%', position: 'absolute', top: '50%', transform: 'translateY(-50%)', objectFit: 'contain' }} />
          </div>
          {/* <div className="hipaa-pill-badge">
            <ShieldIcon sx={{ fontSize: 13 }} />
            <span>HIPAA Encrypted v4.2</span>
          </div> */}
        </div>

        {/* Navigation list - filtered by logged-in staff role */}
        <div className="hospital-nav-scroll">
          <div className="nav-section-label">MAIN WORKSPACE</div>
          <ul className="hospital-nav-list">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li className="hospital-nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `hospital-nav-link ${
                        isActive || (item.matchExtra && location.pathname.includes(item.matchExtra)) ? 'active' : ''
                      }`
                    }
                    onClick={closeMobile}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
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
                {getRoleLabel(role)}
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
                <span className="crumb-link" onClick={() => navigate(defaultDashboardPath)}>
                  Hospital Core
                </span>
                <span className="crumb-sep">&rsaquo;</span>
                <span>Clinical Operations</span>
              </div>

              {/* <div className="status-pill sync-active">
                <span className="pulse-dot"></span>
                <span>Directory Sync: Active</span>
              </div> */}

              {/* <div className="status-pill telemetry-live">
                <span className="pulse-dot"></span>
                <span>ICU Telemetry: Live</span>
              </div> */}
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
                onClick={handleAvatarClick}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Secondary Context Row */}
          {/* <div className="topbar-secondary-row">
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
          </div> */}
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
