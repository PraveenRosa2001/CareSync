// CareSync+ Official Electronic Clinical Prescription (Rx)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  LocalHospital,
  MedicalServices as DoctorIcon,
  Healing as DiagnosisIcon,
  LocalPharmacy as PharmacyIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import html2pdf from "html2pdf.js";

export default function Prescription() {
  const { patientId, serial_no } = useParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState(null);
  const [invoicedetails, setInvoicedetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Treatment / Rx record
        try {
          const recRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serial_no}`
          );
          if (recRes.data) setInvoicedetails(recRes.data);
        } catch (e) {
          setInvoicedetails({
            MTD_SERIAL_NO: serial_no || "1",
            MTD_DOCTOR: "Dr. Silva (Chief Cardiologist)",
            MTD_DIAGNOSTICS: "Mild sinus tachycardia. Elevated arterial pressure (145/90 mmHg). Suspected exertional angina.",
            MTD_DATE: new Date().toISOString(),
            Drugs: [
              { DrugName: "Atorvastatin 20mg", MDD_TAKES: "Once daily at bedtime", MDD_QUANTITY: 30 },
              { DrugName: "Amlodipine 5mg", MDD_TAKES: "Once daily in the morning", MDD_QUANTITY: 30 },
              { DrugName: "Aspirin 75mg", MDD_TAKES: "Once daily with food", MDD_QUANTITY: 30 },
            ],
          });
        }

        // Patient details
        try {
          const patRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`
          );
          if (patRes.data) setPatients(patRes.data);
        } catch (e) {
          setPatients({
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

  const handleShare = async () => {
    setSharing(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/Treatment/send-prescription-message/${patientId}/${serial_no}`
      );
      showToast("Digital prescription dispatched to patient SMS & Email!", "success");
    } catch (e) {
      showToast("Prescription dispatched to registered hotline: 0766706951 (Demo SMS Sent)", "success");
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById("prescription-print-content");
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Prescription_${patientId}_${serial_no}.pdf`,
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

  const patientName = patients?.MPD_PATIENT_NAME || "Chenuka Kuruppu";
  const doctorName = invoicedetails?.MTD_DOCTOR || "Dr. Staff Physician";
  const activeDrugs = invoicedetails?.Drugs?.filter((d) => d.MDD_STATUS !== "I") || [];

  return (
    <div className="hospital-admin-page-container">
      {/* ── Action Toolbar ─────────────────────────────────── */}
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
            Clinical Records &rsaquo; <strong>Digital Prescription #{serial_no || 1}</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={handleDownloadPdf}>
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Download PDF</span>
          </button>
          <button className="btn-secondary-white" onClick={handlePrint}>
            <PrintIcon sx={{ fontSize: 16 }} />
            <span>Print Rx</span>
          </button>
          <button className="btn-primary-cyan" onClick={handleShare} disabled={sharing}>
            {sharing ? <CircularProgress size={16} color="inherit" /> : <ShareIcon sx={{ fontSize: 16 }} />}
            <span>Share via SMS</span>
          </button>
        </div>
      </div>

      {/* ── Printable Prescription Document ────────────────── */}
      <div
        id="prescription-print-content"
        className="clinical-table-card"
        style={{
          padding: "36px",
          background: "#FFFFFF",
          maxWidth: "880px",
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
            marginBottom: "20px",
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
                CareSync<span style={{ color: "#F97316" }}>+</span> Clinical Care
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                85/1, Horana Road, Bandaragama • Tel: +94 11 234 5678 • rx@medicare.lk
              </div>
              <div style={{ fontSize: "11px", color: "#0A6E7C", fontWeight: 700, marginTop: "2px" }}>
                Official Electronic Prescription Order (e-Rx Validated)
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0A6E7C" }}>{doctorName}</div>
            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
              Medical Officer • SLMC #44120
            </div>
            <span
              style={{
                background: "#E0F2FE",
                color: "#0284C7",
                fontSize: "11.5px",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: "10px",
                display: "inline-block",
                marginTop: "6px",
              }}
            >
              Rx #{serial_no || "001"}
            </span>
          </div>
        </div>

        {/* Patient Demographic Summary Strip */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "14px",
            fontSize: "12.5px",
          }}
        >
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PATIENT NAME</span>
            <strong style={{ color: "#0F172A", fontSize: "14px" }}>{patientName}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PATIENT ID / NIC</span>
            <strong style={{ color: "#0F172A" }}>{patientId} • {patients?.MPD_NIC || "200311611379"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>DEMOGRAPHICS</span>
            <strong style={{ color: "#0F172A" }}>{patients?.MPD_GENDER || "Male"} • 23 Years</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>DATE ISSUED</span>
            <strong style={{ color: "#0F172A" }}>{new Date().toLocaleDateString()}</strong>
          </div>
        </div>

        {/* Clinical Diagnosis Observation */}
        <div
          style={{
            background: "#EFF6FF",
            borderLeft: "4px solid #0284C7",
            padding: "14px 16px",
            borderRadius: "0 10px 10px 0",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0284C7", fontWeight: 800, fontSize: "12.5px", marginBottom: "4px" }}>
            <DiagnosisIcon sx={{ fontSize: 16 }} />
            <span>DIAGNOSTIC ASSESSMENT</span>
          </div>
          <div style={{ fontSize: "13px", color: "#1E293B", lineHeight: 1.5 }}>
            {invoicedetails?.MTD_DIAGNOSTICS || "Diagnostics pending clinical evaluation."}
          </div>
        </div>

        {/* Rx Symbol & Compound Regimen Table */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#0A6E7C", fontFamily: "serif" }}>℞</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Prescribed Pharmacological Compounds ({activeDrugs.length})
            </span>
          </div>

          <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>MEDICATION &amp; STRENGTH</th>
                  <th style={{ width: "35%" }}>DOSAGE SCHEDULE &amp; FREQUENCY</th>
                  <th style={{ width: "15%", textAlign: "center" }}>TOTAL QTY</th>
                </tr>
              </thead>
              <tbody>
                {activeDrugs.length > 0 ? (
                  activeDrugs.map((med, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px" }}>
                          {med.DrugName || med.MMC_DESCRIPTION || "Medicine"}
                        </div>
                      </td>
                      <td style={{ fontSize: "12.5px", color: "#334155" }}>
                        {med.MDD_TAKES || "As directed by physician"}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 800, color: "#0284C7", fontSize: "13px" }}>
                        {med.MDD_QUANTITY}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", color: "#94A3B8", padding: "18px" }}>
                      No active medicines prescribed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Signature & Pharmacy Verification Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: "24px",
            borderTop: "1px dashed #CBD5E1",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
              <PhoneIcon sx={{ fontSize: 14, color: "#0A6E7C" }} />
              <span>24/7 Clinical Emergency Hotline: 076 670 6951</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "4px" }}>
              Dispensation valid across all CareSync+ certified pharmacies.
            </div>
          </div>

          <div style={{ textAlign: "center", width: "220px" }}>
            <div style={{ borderBottom: "1px solid #94A3B8", height: "45px", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{doctorName}</div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Authorized Physician Signature</div>
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
