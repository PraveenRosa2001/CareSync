import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
} from "@mui/material";
import {
  FolderShared as PatientIcon,
  Medication as DrugIcon,
  ReceiptLong as PharmacyIcon,
  CalendarMonth as CalendarIcon,
  ManageAccounts as StaffIcon,
  Emergency as EmergencyIcon,
  Tune as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  Shield as ShieldIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  MonitorHeart as HeartIcon,
  Hotel as BedIcon,
} from "@mui/icons-material";
import { ACCESS, hasAccess, normalizeRole } from "../utils/roleAccess";

export default function AdminOverview() {
  const navigate = useNavigate();
  const role = normalizeRole(localStorage.getItem("Role"));
  const canViewStaff = hasAccess(role, ACCESS.USER_STAFF);

  const [stats, setStats] = useState({
    patients: 0,
    pharmacyTotal: 0,
    pharmacyPending: 0,
    medicinesTotal: 0,
    medicinesLowStock: 0,
    usersTotal: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, pharmacyRes, medicinesRes, usersRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/Patient`).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/Treatment/preparationcomplete`).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/Material`).catch(() => ({ data: [] })),
          canViewStaff
            ? axios.get(`${process.env.REACT_APP_API_BASE_URL}/User`).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] })
        ]);

        const patientsCount = Array.isArray(patientsRes.data) ? patientsRes.data.length : 0;
        
        const pharmacyData = Array.isArray(pharmacyRes.data) ? pharmacyRes.data : [];
        const pharmacyTotal = pharmacyData.length;
        const pharmacyPending = pharmacyData.filter(p => p.Status !== "C").length;

        const medicinesData = Array.isArray(medicinesRes.data) ? medicinesRes.data : [];
        const medicinesTotal = medicinesData.length;
        // Mocking minStock as 20 as in registerMedicine.jsx
        const medicinesLowStock = medicinesData.filter(m => {
          const stock = Number(m.MMC_REORDER_LEVEL || 0);
          return stock > 0 && stock < 20;
        }).length;

        const usersCount = Array.isArray(usersRes.data) ? usersRes.data.length : 0;

        setStats({
          patients: patientsCount,
          pharmacyTotal: pharmacyTotal,
          pharmacyPending: pharmacyPending,
          medicinesTotal: medicinesTotal,
          medicinesLowStock: medicinesLowStock,
          usersTotal: usersCount,
        });
      } catch (err) {
        console.error("Error fetching overview stats", err);
      }
    };
    fetchStats();
  }, [canViewStaff]);

  return (
    <div className="hospital-admin-page-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">Hospital Operations &amp; Executive Command Center</h1>
          <p className="page-subtitle-text">
            Enterprise clinical governance overview across inpatient wings, automated dispensary lines, specialist rosters, and real-time telemetry surveillance.
          </p>
        </div>

        {/* <div className="page-action-group">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ECFDF5",
              color: "#059669",
              padding: "6px 14px",
              borderRadius: "20px",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            <span className="pulse-dot"></span>
            <span>All Clinical Systems Nominal</span>
          </div>
          <button className="btn-primary-cyan" onClick={() => navigate("/dashboard/emergency")}>
            <EmergencyIcon sx={{ fontSize: 18 }} />
            <span>Trauma Desk</span>
          </button>
        </div> */}
      </div>

      {/* ── 4 Executive KPI Cards ────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card" onClick={() => navigate("/dashboard/medical-history")} style={{ cursor: "pointer" }}>
          <div>
            <div className="kpi-label">TOTAL REGISTERED PATIENTS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{stats.patients}</span>
              <span className="kpi-delta-pill blue">Active Data</span>
            </div>
            <div className="kpi-subtext">Registered electronic dossiers</div>
          </div>
          <div className="kpi-icon-box blue">
            <PatientIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/dashboard/pharmacy")} style={{ cursor: "pointer" }}>
          <div>
            <div className="kpi-label">DISPENSARY QUEUE</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{stats.pharmacyTotal}</span>
              <span className="kpi-delta-pill red">{stats.pharmacyPending} Pending</span>
            </div>
            <div className="kpi-subtext">Real-time pharmacy allocations</div>
          </div>
          <div className="kpi-icon-box teal">
            <PharmacyIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/dashboard/daily-appointments")} style={{ cursor: "pointer" }}>
          <div>
            <div className="kpi-label">TODAY'S SPECIALIST ROSTER</div>
            <div className="kpi-val-row">
              <span className="kpi-number">18 / 22</span>
              <span className="kpi-delta-pill blue">82% on shift</span>
            </div>
            <div className="kpi-subtext">Consultations queued</div>
          </div>
          <div className="kpi-icon-box purple">
            <CalendarIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/dashboard/register-medicines")} style={{ cursor: "pointer" }}>
          <div>
            <div className="kpi-label">FORMULARY STOCK HEALTH</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{stats.medicinesTotal}</span>
              <span className="kpi-delta-pill amber">{stats.medicinesLowStock} low stock</span>
            </div>
            <div className="kpi-subtext">Active compounds monitored</div>
          </div>
          <div className="kpi-icon-box green">
            <DrugIcon sx={{ fontSize: 22 }} />
          </div>
        </div>
      </div>

      {/* ── Quick Workspaces Launchpad ───────────────────────── */}
      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "0 0 14px 0" }}>
        Hospital Workspace Quick Access
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            title: "Staff & User Governance",
            desc: "RBAC clinical credentials, multi-factor accounts & doctors directory.",
            icon: <StaffIcon sx={{ fontSize: 22, color: "#0284C7" }} />,
            bg: "#E0F2FE",
            path: "/dashboard/Add-users",
            badge: `${stats.usersTotal} Users`,
            roles: ACCESS.USER_STAFF,
          },
          {
            title: "Patient Records & Dossiers",
            desc: "Electronic health dossiers, admission desk & treatment visits.",
            icon: <PatientIcon sx={{ fontSize: 22, color: "#0A6E7C" }} />,
            bg: "#E6F4F6",
            path: "/dashboard/medical-history",
            badge: `${stats.patients} Files`,
            roles: ACCESS.PATIENT_RECORDS,
          },
          {
            title: "Pharmacy Dispensing",
            desc: "Live prescription feed, stock dosage adjustments & itemized invoices.",
            icon: <PharmacyIcon sx={{ fontSize: 22, color: "#2563EB" }} />,
            bg: "#EFF6FF",
            path: "/dashboard/pharmacy",
            badge: `${stats.pharmacyTotal} in Queue`,
            roles: ACCESS.PHARMACY,
          },
          {
            title: "Formulary & Inventory",
            desc: "Therapeutic catalogue, safety levels, batch codes & Cold-chain sensors.",
            icon: <DrugIcon sx={{ fontSize: 22, color: "#7C3AED" }} />,
            bg: "#EDE9FE",
            path: "/dashboard/register-medicines",
            badge: `${stats.medicinesTotal} SKUs`,
            roles: ACCESS.DRUG_INVENTORY,
          },
          {
            title: "Appointments & Timeslots",
            desc: "Doctor consultation quotas, room assignments & patient token limits.",
            icon: <CalendarIcon sx={{ fontSize: 22, color: "#D97706" }} />,
            bg: "#FEF3C7",
            path: "/dashboard/daily-appointments",
            badge: "12 Active Slots",
            roles: ACCESS.APPOINTMENTS,
          },
        ].filter((item) => hasAccess(role, item.roles)).map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              padding: "18px",
              cursor: "pointer",
              transition: "all 0.18s",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </div>
                <span
                  style={{
                    background: "#F1F5F9",
                    color: "#475569",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "10px",
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>
                {item.title}
              </h4>
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#0284C7",
              }}
            >
              <span>Launch Workspace</span>
              <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Real-Time Operational Matrices & Live Feeds ───────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "22px" }}>
        {/* Inpatient Bed Occupancy & Telemetry Status */}
        <div className="clinical-table-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BedIcon sx={{ fontSize: 20, color: "#0284C7" }} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                Inpatient Bed Capacity &amp; Wing Telemetry
              </h3>
            </div>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0284C7" }}>● Live Sensor Mesh</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { wing: "Cardiology Critical Ward (Ward 4A)", beds: "24 / 25 Beds", pct: 96, status: "Critical Fill", color: "#DC2626" },
              { wing: "General Medical Inpatient (Ward 2B)", beds: "40 / 48 Beds", pct: 83, status: "Normal", color: "#0284C7" },
              { wing: "Pediatric Intensive Care (PICU)", beds: "12 / 16 Beds", pct: 75, status: "Optimal", color: "#059669" },
              { wing: "Surgical Recovery Wing (Floor 3)", beds: "32 / 36 Beds", pct: 88, status: "High Demand", color: "#D97706" },
            ].map((w, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", borderRadius: "10px", padding: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>
                  <span>{w.wing}</span>
                  <span style={{ color: w.color }}>{w.beds} ({w.pct}%)</span>
                </div>
                <div className="stock-progress-wrap" style={{ width: "100%", height: "6px" }}>
                  <div
                    className="stock-progress-bar"
                    style={{ width: `${w.pct}%`, background: w.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Clinical Security & Audit Log */}
        {/* <div className="clinical-table-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldIcon sx={{ fontSize: 20, color: "#0A6E7C" }} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                HIPAA Audit Security Feed
              </h3>
            </div>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#059669" }}>✓ All Encrypted</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { text: "AdminTest authenticated via FIDO2 MFA (Colombo)", time: "2 mins ago", type: "auth" },
              { text: "Prescription INV-2025-0509-88 dispensed by Pharm. Test Alpha", time: "11 mins ago", type: "pharm" },
              { text: "Patient PA0001 EHR dossier synchronized with Central Vault", time: "24 mins ago", type: "ehr" },
              { text: "Timeslot #TS-9021 reached 90% booking threshold", time: "42 mins ago", type: "roster" },
            ].map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#F8FAFC",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: "#0284C7" }} />
                  <span style={{ color: "#1E293B", fontWeight: 500 }}>{log.text}</span>
                </div>
                <span style={{ color: "#94A3B8", fontSize: "11px", whiteSpace: "nowrap" }}>{log.time}</span>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
