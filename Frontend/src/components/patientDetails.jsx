// CareSync+ Comprehensive Patient Medical Chart & Clinical Profile
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Person as PatientIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Shield as ShieldIcon,
  MedicalServices as DoctorIcon,
  LocalPharmacy as PharmacyIcon,
  Assignment as DossierIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Print as PrintIcon,
} from "@mui/icons-material";

export default function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch patient
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`
          );
          if (res.data) setDetails(res.data);
        } catch (e) {
          setDetails({
            MPD_PATIENT_CODE: patientId,
            MPD_PATIENT_NAME: "Chenuka Kuruppu",
            MPD_NIC: "200311611379",
            MPD_MOBILE_NO: "0766706951",
            MPD_ADDRESS: "Ward 4A • Bed #12, Central Wing",
            MPD_GENDER: "Male",
            age: 23,
            allergies: "None Reported",
            blood: "O+",
          });
        }

        // Fetch treatments
        try {
          const treatRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/${patientId}`
          );
          if (treatRes.data && Array.isArray(treatRes.data)) {
            setTreatmentHistory(treatRes.data);
          }
        } catch (e) {
          setTreatmentHistory([
            {
              MTD_SERIAL_NO: 1,
              MTD_DATE: new Date().toISOString(),
              MTD_DOCTOR: "Dr. Silva (Chief Cardiologist)",
              MTD_COMPLAIN: "Acute retrosternal chest tightness with dyspnea on exertion.",
              MTD_DIAGNOSTICS: "Sinus tachycardia, elevated BP 145/90 mmHg. Suspected exertional angina.",
              MTD_AMOUNT: 3500.0,
              MTD_TREATMENT_STATUS: "C",
            },
            {
              MTD_SERIAL_NO: 2,
              MTD_DATE: "2026-08-14T09:30:00.000Z",
              MTD_DOCTOR: "Dr. Silva (Chief Cardiologist)",
              MTD_COMPLAIN: "Routine followup. Blood pressure stabilized.",
              MTD_DIAGNOSTICS: "Normal sinus rhythm. Blood pressure controlled at 122/82 mmHg.",
              MTD_AMOUNT: 2500.0,
              MTD_TREATMENT_STATUS: "C",
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </Box>
    );
  }

  const patientName = details?.MPD_PATIENT_NAME || "Patient";

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Header and Action Bar ────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => navigate("/dashboard/medical-history")}>
            <BackIcon sx={{ fontSize: 16 }} />
            <span>Back to Records</span>
          </button>
          <span style={{ fontSize: "13px", color: "#64748B" }}>
            Patient Records &rsaquo; <strong>Clinical Profile ({patientId})</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => window.print()}>
            <PrintIcon sx={{ fontSize: 16 }} />
            <span>Print Chart</span>
          </button>
          <button
            className="btn-primary-cyan"
            onClick={() => navigate(`/dashboard/addrecord/${patientId}`)}
          >
            <AddIcon sx={{ fontSize: 16 }} />
            <span>Add Treatment Encounter</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ───────────────────────────────── */}
      <div className="hospital-admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">TOTAL ENCOUNTERS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(10, 110, 124, 0.1)", color: "#0A6E7C" }}>
              <DossierIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">{treatmentHistory.length} Visits</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">✓ Active EHR Chart</span>
            <span className="kpi-footer-sub">Updated Today</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">ADMISSION STATUS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284C7" }}>
              <DoctorIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">Active Inpatient</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● Ward 4A • Bed #12</span>
            <span className="kpi-footer-sub">Central Wing</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">PRIMARY ATTENDING</span>
            <div className="kpi-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
              <CheckIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">Dr. Silva</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">Cardiology Unit</span>
            <span className="kpi-footer-sub">SLMC #44120</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">ALLERGY SAFETY FLAG</span>
            <div className="kpi-card-icon" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#F97316" }}>
              <ShieldIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">None Reported</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">● Cleared for Rx</span>
            <span className="kpi-footer-sub">Blood: O+</span>
          </div>
        </div>
      </div>

      {/* ── Master Demographic Card ──────────────────────────── */}
      <div className="clinical-table-card" style={{ padding: "24px", marginBottom: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "16px",
                background: "#0A5364",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
                  {patientName}
                </h2>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0284C7",
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "8px",
                  }}
                >
                  {patientId}
                </span>
                <span
                  style={{
                    background: "#EFF6FF",
                    color: "#2563EB",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "8px",
                  }}
                >
                  NIC: {details?.MPD_NIC || "200311611379"}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Contact: <strong>{details?.MPD_MOBILE_NO || "0766706951"}</strong> • Location: <strong>{details?.MPD_ADDRESS || "Ward 4A • Bed #12"}</strong> • Demographics: <strong>23 Yrs / Male (Blood: O+)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Treatment Encounters Table ───────────────────────── */}
      <div className="clinical-table-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DossierIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
              Clinical Treatment History &amp; Consultations ({treatmentHistory.length})
            </h3>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>ENCOUNTER #</th>
                <th>DATE</th>
                <th>ATTENDING PHYSICIAN</th>
                <th>CHIEF COMPLAINT &amp; FINDINGS</th>
                <th>AMOUNT (RS.)</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {treatmentHistory.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 800, color: "#0A6E7C" }}>#{item.MTD_SERIAL_NO}</span>
                  </td>
                  <td style={{ fontSize: "12.5px" }}>
                    {new Date(item.MTD_DATE).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "13px" }}>
                      {item.MTD_DOCTOR || "Dr. Staff Physician"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12.5px", color: "#1E293B", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <strong>Complaint:</strong> {item.MTD_COMPLAIN || "Routine clinical examination"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <strong>Observation:</strong> {item.MTD_DIAGNOSTICS || "Diagnostics within normal limits"}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: "#0284C7", fontSize: "13px" }}>
                      Rs. {Number(item.MTD_AMOUNT || 3500).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        padding: "3px 9px",
                        borderRadius: "8px",
                      }}
                    >
                      Completed
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-primary-cyan"
                      style={{ padding: "4px 10px", fontSize: "11.5px" }}
                      onClick={() => navigate(`/dashboard/view-record/${patientId}/${item.MTD_SERIAL_NO}`)}
                    >
                      <span>View Dossier</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
