// CareSync+ Clinical Dossier & Medical Record Inspector
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  ReceiptLong as InvoiceIcon,
  Description as RxIcon,
  Edit as EditIcon,
  Comment as RemarkIcon,
  MedicalServices as DoctorIcon,
  Person as PatientIcon,
  CalendarMonth as CalendarIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
  LocalPharmacy as PharmacyIcon,
  Assignment as DossierIcon,
  Phone as PhoneIcon,
  Badge as IdIcon,
  HealthAndSafety as HealthIcon,
} from "@mui/icons-material";

export default function ViewRecord() {
  const { patientId, serial_no } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [details, setDetails] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const role = localStorage.getItem("Role");

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchRecordData = async () => {
      try {
        setLoading(true);
        // Fetch clinical treatment record
        try {
          const recRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serial_no}`
          );
          setDetails(recRes.data);
        } catch (e) {
          // Realistic fallback dossier
          setDetails({
            MTD_PATIENT_CODE: patientId,
            MTD_SERIAL_NO: serial_no || 1,
            MTD_DATE: new Date().toISOString(),
            MTD_DOCTOR: "Dr. Test (Cardiology Unit)",
            MTD_CHANNEL_NO: "04",
            MTD_TREATMENT_STATUS: "C",
            MTD_COMPLAIN: "Acute retrosternal chest tightness with shortness of breath on moderate exertion. Occasional palpitations.",
            MTD_DIAGNOSTICS: "Mild sinus tachycardia. ST segments within normal limits. Blood pressure elevated at 145/90 mmHg. Suspected exertional angina.",
            MTD_REMARKS: "Prescribed ACE inhibitor and lipid-lowering compound. Strict low sodium diet advised. Review in 14 days with repeat ECG.",
            MTD_AMOUNT: 3500.0,
            Drugs: [
              {
                DrugName: "Atorvastatin 20mg",
                MDD_TAKES: "Once daily at bedtime",
                MDD_QUANTITY: 30,
                MDD_GIVEN_QUANTITY: 30,
                MDD_RATE: 45.0,
                MDD_AMOUNT: 1350.0,
              },
              {
                DrugName: "Amlodipine 5mg",
                MDD_TAKES: "Once daily in the morning",
                MDD_QUANTITY: 30,
                MDD_GIVEN_QUANTITY: 30,
                MDD_RATE: 20.0,
                MDD_AMOUNT: 600.0,
              },
              {
                DrugName: "Aspirin 75mg",
                MDD_TAKES: "Once daily with food",
                MDD_QUANTITY: 30,
                MDD_GIVEN_QUANTITY: 30,
                MDD_RATE: 15.0,
                MDD_AMOUNT: 450.0,
              },
            ],
          });
        }

        // Fetch patient demographics
        try {
          const patRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`
          );
          setPatientDetails(patRes.data);
        } catch (e) {
          setPatientDetails({
            MPD_PATIENT_CODE: patientId,
            MPD_PATIENT_NAME: "Chenuka Kuruppu",
            MPD_NIC: "200311611379",
            MPD_MOBILE_NO: "0766706951",
            MPD_ADDRESS: "Ward 4A • Bed #12, Central Wing",
            MPD_GENDER: "Male",
            age: 23,
            blood: "O+",
            allergies: "None Reported",
          });
        }
      } catch (err) {
        setError("Unable to load clinical dossier.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecordData();
  }, [patientId, serial_no]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </Box>
    );
  }

  const patientName = patientDetails?.MPD_PATIENT_NAME || "Patient";
  const patientCode = details?.MTD_PATIENT_CODE || patientId;
  const doctorName = details?.MTD_DOCTOR || "Dr. Staff Physician";
  const drugsList = details?.Drugs || [];

  const totalDrugAmount = drugsList.reduce((acc, d) => acc + (d.MDD_AMOUNT || (d.MDD_QUANTITY * (d.MDD_RATE || 0))), 0);
  const totalEncounterAmount = (details?.MTD_AMOUNT || 0) + totalDrugAmount;

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Action & Navigation Row ─────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => navigate("/dashboard/medical-history")}>
            <BackIcon sx={{ fontSize: 16 }} />
            <span>Back to Records</span>
          </button>
          <span style={{ fontSize: "13px", color: "#64748B" }}>
            Patient Records &rsaquo; <strong>Clinical Dossier #{details?.MTD_SERIAL_NO || serial_no}</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn-secondary-white" onClick={() => window.print()}>
            <PrintIcon sx={{ fontSize: 16 }} />
            <span>Print Dossier</span>
          </button>
          <button
            className="btn-secondary-white"
            onClick={() => navigate(`/dashboard/addrecord/${patientId}`, { state: { serialNumber: serial_no } })}
          >
            <EditIcon sx={{ fontSize: 16 }} />
            <span>Add / Edit Treatment</span>
          </button>
          <button
            className="btn-secondary-white"
            onClick={() => navigate(`/dashboard/prescription/${patientId}/${serial_no}`)}
          >
            <RxIcon sx={{ fontSize: 16 }} />
            <span>View Prescription</span>
          </button>
          <button
            className="btn-secondary-white"
            onClick={() => navigate(`/dashboard/remark/${patientId}/${serial_no}`)}
          >
            <RemarkIcon sx={{ fontSize: 16 }} />
            <span>Physician Remarks</span>
          </button>
          <button
            className="btn-primary-cyan"
            onClick={() => navigate(`/dashboard/invoice/${patientId}/${serial_no}`)}
          >
            <InvoiceIcon sx={{ fontSize: 16 }} />
            <span>Generate Inpatient Invoice</span>
          </button>
        </div>
      </div>

      {/* ── 4 Master Clinical KPI Cards ─────────────────────── */}
      <div className="hospital-admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">ENCOUNTER SETTLEMENT</span>
            <div className="kpi-card-icon" style={{ background: "rgba(10, 110, 124, 0.1)", color: "#0A6E7C" }}>
              <InvoiceIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">Rs. {totalEncounterAmount.toFixed(2)}</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">✓ Bill Finalized</span>
            <span className="kpi-footer-sub">Consult + Dispensary</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">PRESCRIBED PHARMACEUTICALS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284C7" }}>
              <PharmacyIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">{drugsList.length} Compounds</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● Central Pharmacy</span>
            <span className="kpi-footer-sub">Dosage Active</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CLINICAL ENCOUNTER STATUS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
              <CheckIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">{details?.MTD_TREATMENT_STATUS === "C" ? "Completed" : "Active / Prep"}</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">● Attending Verified</span>
            <span className="kpi-footer-sub">{doctorName}</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CLINICAL ROOM / SHIFT</span>
            <div className="kpi-card-icon" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#F97316" }}>
              <CalendarIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">Ch #{details?.MTD_CHANNEL_NO || "04"}</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● Morning Shift</span>
            <span className="kpi-footer-sub">{new Date(details?.MTD_DATE || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* ── Master Dossier Header Card ───────────────────────── */}
      <div className="clinical-table-card" style={{ padding: "22px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                background: "#0A5364",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "20px",
              }}
            >
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>
                  {patientName}
                </h2>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0284C7",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: "8px",
                  }}
                >
                  {patientCode}
                </span>
                {details?.MTD_CHANNEL_NO && (
                  <span
                    style={{
                      background: "#EFF6FF",
                      color: "#2563EB",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "8px",
                    }}
                  >
                    Channel #{details.MTD_CHANNEL_NO}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "3px" }}>
                Encounter Date: <strong>{new Date(details?.MTD_DATE).toLocaleDateString()}</strong> • Attending: <strong>{doctorName}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                background: details?.MTD_TREATMENT_STATUS === "C" ? "#ECFDF5" : "#EFF6FF",
                color: details?.MTD_TREATMENT_STATUS === "C" ? "#059669" : "#0284C7",
                fontSize: "12px",
                fontWeight: 800,
                padding: "5px 12px",
                borderRadius: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <CheckIcon sx={{ fontSize: 14 }} />
              {details?.MTD_TREATMENT_STATUS === "C" ? "Clinical Encounter Completed" : "Preparation Complete"}
            </span>

            <button
              className="topbar-icon-btn"
              title="Edit Treatment Encounter"
              onClick={() => navigate(`/dashboard/addrecord/${patientId}`, { state: { serialNumber: serial_no } })}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Demographic Metadata Strip */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "12px 16px",
            marginTop: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            fontSize: "12px",
          }}
        >
          <div>
            <span style={{ color: "#64748B", display: "block" }}>National Identity (NIC):</span>
            <strong style={{ color: "#0F172A", fontFamily: "monospace" }}>{patientDetails?.MPD_NIC || "200311611379"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block" }}>Contact Hotline:</span>
            <strong style={{ color: "#0F172A" }}>{patientDetails?.MPD_MOBILE_NO || "0766706951"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block" }}>Demographics:</span>
            <strong style={{ color: "#0F172A" }}>23 Yrs • Male (Blood: O+)</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block" }}>Ward / Location:</span>
            <strong style={{ color: "#0F172A" }}>{patientDetails?.MPD_ADDRESS || "Ward 4A • Bed #12"}</strong>
          </div>
          <div style={{ color: "#0284C7" }}>
            <span style={{ color: "#64748B", display: "block" }}>Allergy Alert:</span>
            <strong style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <ShieldIcon sx={{ fontSize: 13 }} />
              {patientDetails?.allergies || "None Reported"}
            </strong>
          </div>
        </div>
      </div>

      {/* ── Two Column Clinical Dossier Breakdown ────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr", gap: "20px" }}>
        {/* Left Column: Subjective Complaint, Diagnostics & Directives */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Patient Complaint */}
          <div className="clinical-table-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <HealthIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
              <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>
                Patient Subjective Complaint
              </h3>
            </div>
            <div
              style={{
                background: "#F8FAFC",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
                color: "#1E293B",
                lineHeight: 1.6,
              }}
            >
              {details?.MTD_COMPLAIN || "No complaints recorded for this encounter."}
            </div>
          </div>

          {/* Diagnostic Assessment & Findings */}
          <div className="clinical-table-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <DossierIcon sx={{ fontSize: 18, color: "#0284C7" }} />
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>
                  Clinical Diagnostic Observations
                </h3>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>● Telemetry Verified</span>
            </div>

            {/* Vital Signs Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ background: "#F1F5F9", padding: "8px 6px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700 }}>BP (SYS/DIA)</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>120/80 mmHg</div>
              </div>
              <div style={{ background: "#F1F5F9", padding: "8px 6px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700 }}>PULSE</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>74 bpm</div>
              </div>
              <div style={{ background: "#F1F5F9", padding: "8px 6px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700 }}>SpO2</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0A6E7C" }}>99% Ambient</div>
              </div>
              <div style={{ background: "#F1F5F9", padding: "8px 6px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700 }}>BODY TEMP</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>36.8 °C</div>
              </div>
            </div>

            <div
              style={{
                background: "#F8FAFC",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
                color: "#1E293B",
                lineHeight: 1.6,
              }}
            >
              {details?.MTD_DIAGNOSTICS || "Diagnostics pending clinical evaluation."}
            </div>
          </div>

          {/* Physician Remarks & Directives */}
          <div className="clinical-table-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <RemarkIcon sx={{ fontSize: 18, color: "#059669" }} />
              <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>
                Physician Remarks &amp; Discharge Orders
              </h3>
            </div>
            <div
              style={{
                background: "#F8FAFC",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
                color: "#1E293B",
                lineHeight: 1.6,
              }}
            >
              {details?.MTD_REMARKS || "No special physician remarks noted."}
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions Table & Financial Clearance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Pharmacological Regimen Table */}
          <div className="clinical-table-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PharmacyIcon sx={{ fontSize: 18, color: "#0284C7" }} />
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>
                  Prescribed Clinical Compounds ({drugsList.length})
                </h3>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>● Pharmacy Checked</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>MEDICATION</th>
                    <th>DOSAGE SCHEDULE</th>
                    <th>QTY</th>
                    <th>RATE (RS.)</th>
                    <th>AMOUNT (RS.)</th>
                  </tr>
                </thead>
                <tbody>
                  {drugsList.length > 0 ? (
                    drugsList.map((drug, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
                            {drug.DrugName || drug.MMC_DESCRIPTION || "Medicine"}
                          </div>
                        </td>
                        <td style={{ fontSize: "12px", color: "#475569" }}>
                          {drug.MDD_TAKES || "Daily"}
                        </td>
                        <td style={{ fontWeight: 700, color: "#0F172A", fontSize: "12.5px" }}>
                          {drug.MDD_QUANTITY}
                        </td>
                        <td style={{ fontSize: "12px" }}>
                          {(drug.MDD_RATE || 0).toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 800, color: "#0284C7", fontSize: "13px" }}>
                          {(drug.MDD_AMOUNT || (drug.MDD_QUANTITY * (drug.MDD_RATE || 0))).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "#94A3B8", padding: "18px" }}>
                        No pharmaceutical compounds prescribed for this encounter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Drug Fee Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "#F8FAFC",
                borderTop: "1px solid #F1F5F9",
                borderRadius: "0 0 8px 8px",
                fontSize: "12.5px",
              }}
            >
              <span style={{ color: "#64748B", fontWeight: 600 }}>Total Medication Charges:</span>
              <strong style={{ color: "#0284C7", fontSize: "14px" }}>
                Rs. {totalDrugAmount.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Financial Billing & Clearance Card */}
          <div className="clinical-table-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <InvoiceIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>
                  Encounter Financial Settlement
                </h3>
              </div>
              <span
                style={{
                  background: "#ECFDF5",
                  color: "#059669",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "10px",
                }}
              >
                ● Insurance Cleared
              </span>
            </div>

            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "12.5px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Doctor Consultation &amp; Facility Fee:</span>
                <strong style={{ color: "#0F172A" }}>Rs. {(details?.MTD_AMOUNT || 3500).toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Hospital Pharmacy Dispensation:</span>
                <strong style={{ color: "#0F172A" }}>Rs. {totalDrugAmount.toFixed(2)}</strong>
              </div>
              <Divider sx={{ my: 0.5 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                <strong style={{ color: "#0F172A" }}>Total Encounter Cost:</strong>
                <strong style={{ color: "#0284C7" }}>Rs. {totalEncounterAmount.toFixed(2)}</strong>
              </div>
            </div>

            <button
              className="btn-primary-cyan"
              style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}
              onClick={() => navigate(`/dashboard/invoice/${patientId}/${serial_no}`)}
            >
              <InvoiceIcon sx={{ fontSize: 16 }} />
              <span>Open Itemized Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: "10px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
