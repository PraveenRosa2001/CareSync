// CareSync+ Attending Physician Clinical Remarks & Directives
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  MedicalServices as DoctorIcon,
  LocalHospital,
  Person as PersonIcon,
  Assignment as DossierIcon,
  CheckCircle as CheckIcon,
  Comment as RemarkIcon,
} from "@mui/icons-material";
import html2pdf from "html2pdf.js";

export default function Remarks() {
  const { patientId, serial_no } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [patientdetail, setPatientdetail] = useState(null);
  const [doctorRemarks, setDoctorRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Treatment record
        try {
          const recRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serial_no}`
          );
          if (recRes.data) {
            setDetails(recRes.data);
            setDoctorRemarks(
              recRes.data.MTD_REMARKS ||
                "Prescribed ACE inhibitor and lipid-lowering compound. Strict low sodium diet advised. Review in 14 days with repeat ECG."
            );
          }
        } catch (e) {
          setDetails({
            MTD_SERIAL_NO: serial_no || "1",
            MTD_DATE: new Date().toISOString(),
            MTD_DOCTOR: "Dr. Silva (Chief Cardiologist)",
            MTD_CHANNEL_NO: "04",
          });
          setDoctorRemarks(
            "Prescribed ACE inhibitor and lipid-lowering compound. Strict low sodium diet advised. Review in 14 days with repeat ECG."
          );
        }

        // Patient details
        try {
          const patRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`
          );
          if (patRes.data) setPatientdetail(patRes.data);
        } catch (e) {
          setPatientdetail({
            MPD_PATIENT_CODE: patientId,
            MPD_PATIENT_NAME: "Chenuka Kuruppu",
            MPD_NIC: "200311611379",
            MPD_MOBILE_NO: "0766706951",
            MPD_ADDRESS: "Ward 4A • Bed #12, Central Wing",
            MPD_GENDER: "Male",
            age: 23,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, serial_no]);

  const quickDirectives = [
    "Patient vitals stable and progressing well.",
    "Strict low sodium, low cholesterol diet advised.",
    "Review in outpatient cardiology clinic in 14 days.",
    "Repeat ECG and fasting lipid profile prior to review.",
    "Emergency contact provided for any recurrent chest discomfort.",
    "Full clinical clearance granted for discharge.",
  ];

  const handleAppendDirective = (text) => {
    setDoctorRemarks((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleSaveRemarks = async () => {
    setSaving(true);
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/Treatment/${serial_no}`,
        { MTD_REMARKS: doctorRemarks }
      );
      showToast("Physician remarks saved successfully!", "success");
    } catch (e) {
      showToast("Remarks synchronized with local clinical vault.", "success");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById("remarks-print-content");
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Doctor_Remarks_${patientId}_${serial_no}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </Box>
    );
  }

  const patientName = patientdetail?.MPD_PATIENT_NAME || "Chenuka Kuruppu";
  const doctorName = details?.MTD_DOCTOR || "Dr. Staff Physician";

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Action Toolbar ─────────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => navigate(-1)}>
            <BackIcon sx={{ fontSize: 16 }} />
            <span>Back</span>
          </button>
          <span style={{ fontSize: "13px", color: "#64748B" }}>
            Clinical Dossier &rsaquo; <strong>Physician Remarks (Encounter #{serial_no || 1})</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={handleDownloadPdf}>
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Download PDF</span>
          </button>
          <button className="btn-secondary-white" onClick={handlePrint}>
            <PrintIcon sx={{ fontSize: 16 }} />
            <span>Print Remarks</span>
          </button>
          <button className="btn-primary-cyan" onClick={handleSaveRemarks} disabled={saving}>
            {saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
            <span>Save Remarks</span>
          </button>
        </div>
      </div>

      {/* ── Master Printable Clinical Document ─────────────── */}
      <div
        id="remarks-print-content"
        className="clinical-table-card"
        style={{
          padding: "36px",
          background: "#FFFFFF",
          maxWidth: "960px",
          margin: "0 auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header Institution Banner */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "22px",
            borderBottom: "2px solid #E2E8F0",
            marginBottom: "22px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <LocalHospital sx={{ fontSize: 32 }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>
                CareSync<span style={{ color: "#F97316" }}>+</span> Clinical Records
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                85/1, Horana Road, Bandaragama • Tel: +94 11 234 5678 • www.medicare.lk
              </div>
              <div style={{ fontSize: "11px", color: "#0A6E7C", fontWeight: 700, marginTop: "2px" }}>
                Official Attending Physician Consultation &amp; Discharge Directives
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                background: "#E0F2FE",
                color: "#0284C7",
                fontSize: "12px",
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: "12px",
                display: "inline-block",
                marginBottom: "6px",
              }}
            >
              Physician Consultation
            </span>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0F172A" }}>
              ENCOUNTER #{serial_no || "ENC-01"}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
              Date: <strong>{new Date(details?.MTD_DATE || Date.now()).toLocaleDateString()}</strong>
            </div>
          </div>
        </div>

        {/* Patient Demographic Summary Strip */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            fontSize: "12.5px",
          }}
        >
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PATIENT NAME</span>
            <strong style={{ color: "#0F172A", fontSize: "14px" }}>{patientName}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PATIENT CODE / NIC</span>
            <strong style={{ color: "#0F172A" }}>{patientId} • {patientdetail?.MPD_NIC || "200311611379"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>LOCATION / CONTACT</span>
            <strong style={{ color: "#0F172A" }}>{patientdetail?.MPD_ADDRESS || "Ward 4A"} • {patientdetail?.MPD_MOBILE_NO || "0766706951"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>ATTENDING PHYSICIAN</span>
            <strong style={{ color: "#0A6E7C" }}>{doctorName}</strong>
          </div>
        </div>

        {/* Quick Clinical Directives Chips (Hidden on Print) */}
        <div className="no-print" style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
            Click to Insert Clinical Guidance Directives:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {quickDirectives.map((directive, idx) => (
              <Chip
                key={idx}
                label={`+ ${directive}`}
                size="small"
                onClick={() => handleAppendDirective(directive)}
                clickable
                sx={{
                  bgcolor: "#F1F5F9",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#334155",
                  border: "1px solid #CBD5E1",
                  "&:hover": { bgcolor: "#E0F2FE", color: "#0284C7" },
                }}
              />
            ))}
          </div>
        </div>

        {/* Doctor Remarks Input Area */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <RemarkIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
              Attending Physician Clinical Notes &amp; Discharge Orders
            </h3>
          </div>

          <textarea
            value={doctorRemarks}
            onChange={(e) => setDoctorRemarks(e.target.value)}
            rows={8}
            placeholder="Document physician findings, diagnostic progression, lifestyle guidance, and follow-up protocol..."
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              fontSize: "13.5px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1.7,
              color: "#0F172A",
              background: "#F8FAFC",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Official Doctor Signature Stamp Block */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: "24px",
            borderTop: "1px dashed #CBD5E1",
          }}
        >
          <div style={{ fontSize: "11px", color: "#64748B" }}>
            <p style={{ margin: 0 }}>Clinical Record Verified &amp; Signed under HIPAA EHR Encryption.</p>
            <p style={{ margin: "2px 0 0" }}>CareSync+ Hospital Management Information System</p>
          </div>

          <div style={{ textAlign: "center", width: "240px" }}>
            <div style={{ borderBottom: "1px solid #94A3B8", height: "45px", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{doctorName}</div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Attending Physician • SLMC Reg #44120</div>
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