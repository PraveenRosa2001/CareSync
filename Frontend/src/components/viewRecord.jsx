import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, CircularProgress, Snackbar } from "@mui/material";
import {
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Description as PrescriptionIcon,
  EditOutlined as EditIcon,
  LocalPharmacy as PharmacyIcon,
  MedicalServices as DoctorIcon,
  Print as PrintIcon,
  ReceiptLong as InvoiceIcon,
  Schedule as TimeIcon,
  ShieldOutlined as ShieldIcon,
  StickyNote2Outlined as NoteIcon,
} from "@mui/icons-material";
import "../styles/clinicalEncounter.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const extractApiMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  return data?.message || data?.error || data?.detail || fallback;
};

const money = (value) => Number(value || 0).toFixed(2);

const dateLabel = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const timeLabel = (value) => {
  if (!value) return "";
  const text = String(value);
  const [hRaw, mRaw] = text.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw || 0);
  if (Number.isNaN(h)) return text;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const ageFromBirthday = (birthday) => {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

const genderLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "m" || normalized === "male") return "Male";
  if (normalized === "f" || normalized === "female") return "Female";
  return value || "Not recorded";
};

const paymentLabel = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "P") return "Pending billing";
  if (["C", "Y", "S"].includes(value)) return "Cleared / settled";
  if (value === "N") return "Not settled";
  return "Not recorded";
};

export default function ViewRecord() {
  const { patientId, serial_no } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: Boolean(location.state?.justSaved),
    message: location.state?.justSaved ? "Clinical encounter saved successfully." : "",
    severity: "success",
  });

  useEffect(() => {
    let cancelled = false;

    const loadRecord = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE}/ClinicalEncounter/${patientId}/${serial_no}`);
        if (!cancelled) setRecord(response.data);
      } catch (err) {
        if (!cancelled) setError(extractApiMessage(err, "Unable to load this clinical encounter."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [patientId, serial_no]);

  const treatment = record?.Treatment || {};
  const patient = record?.Patient || {};
  const doctor = record?.Doctor || {};
  const appointment = record?.Appointment || null;
  const timeslot = record?.Timeslot || null;
  const drugs = Array.isArray(record?.Drugs) ? record.Drugs : [];

  const medicationTotal = useMemo(
    () => drugs.reduce((sum, drug) => sum + Number(drug.MDD_AMOUNT ?? (Number(drug.MDD_QUANTITY || 0) * Number(drug.MDD_RATE || 0))), 0),
    [drugs]
  );

  const consultationFee = Number(treatment.MTD_AMOUNT || 0);
  const encounterTotal = consultationFee + medicationTotal;

  const pharmacyStatus = useMemo(() => {
    if (!drugs.length) return { label: "No medicines prescribed", className: "neutral" };
    const fullyDispensed = drugs.every(
      (d) => Number(d.MDD_GIVEN_QUANTITY || 0) >= Number(d.MDD_QUANTITY || 0) && Number(d.MDD_QUANTITY || 0) > 0
    );
    const partlyDispensed = drugs.some((d) => Number(d.MDD_GIVEN_QUANTITY || 0) > 0);
    if (fullyDispensed) return { label: "Dispensed", className: "success" };
    if (partlyDispensed) return { label: "Partially dispensed", className: "warning" };
    return { label: "Awaiting pharmacy", className: "info" };
  }, [drugs]);

  if (loading) {
    return (
      <div className="ce-loading-state">
        <CircularProgress size={34} />
        <span>Loading clinical dossier…</span>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="ce-page">
        <div className="ce-error-panel">
          <strong>Clinical dossier unavailable.</strong>
          <span>{error || "No record was returned by the server."}</span>
          <button className="ce-btn ce-btn-secondary" onClick={() => navigate("/dashboard/medical-history")}>
            <BackIcon fontSize="small" /> Back to Patient Records
          </button>
        </div>
      </div>
    );
  }

  const patientAge = ageFromBirthday(patient.MPD_BIRTHDAY);
  const doctorName = doctor.FullName || doctor.UserName || treatment.MTD_DOCTOR || "Not assigned";
  const doctorSpecialization = doctor.Specialization || "Specialization not recorded";
  const locationText = [patient.MPD_ADDRESS, patient.MPD_CITY].filter(Boolean).join(", ") || "Not recorded";
  const encounterStatus = treatment.MTD_TREATMENT_STATUS === "C" ? "Completed" : "In progress";

  return (
    <div className="ce-page ce-record-page">
      <div className="ce-record-toolbar">
        <div className="ce-record-toolbar-left">
          <button className="ce-btn ce-btn-secondary compact" onClick={() => navigate("/dashboard/medical-history")}>
            <BackIcon fontSize="small" /> Back
          </button>
          <div>
            <div className="ce-eyebrow">Patient Records / Clinical Dossier</div>
            <h1>Encounter #{treatment.MTD_SERIAL_NO}</h1>
          </div>
        </div>

        <div className="ce-record-actions">
          <button className="ce-btn ce-btn-secondary compact" onClick={() => window.print()}>
            <PrintIcon fontSize="small" /> Print
          </button>
          <button
            className="ce-btn ce-btn-secondary compact"
            onClick={() => navigate(`/dashboard/addrecord/${patientId}`, { state: { serialNumber: serial_no } })}
          >
            <EditIcon fontSize="small" /> Edit
          </button>
          <button
            className="ce-btn ce-btn-secondary compact"
            onClick={() => navigate(`/dashboard/prescription/${patientId}/${serial_no}`)}
          >
            <PrescriptionIcon fontSize="small" /> Prescription
          </button>
          <button
            className="ce-btn ce-btn-secondary compact"
            onClick={() => navigate(`/dashboard/remark/${patientId}/${serial_no}`)}
          >
            <NoteIcon fontSize="small" /> Remarks
          </button>
          <button
            className="ce-btn ce-btn-primary compact"
            onClick={() => navigate(`/dashboard/invoice/${patientId}/${serial_no}`)}
          >
            <InvoiceIcon fontSize="small" /> Invoice
          </button>
        </div>
      </div>

      <section className="ce-record-hero">
        <div className="ce-record-hero-main">
          <div className="ce-avatar large">{(patient.MPD_PATIENT_NAME || "P").charAt(0).toUpperCase()}</div>
          <div className="ce-record-identity">
            <div className="ce-patient-title-row">
              <h2>{patient.MPD_PATIENT_NAME || "Patient"}</h2>
              <span className="ce-chip ce-chip-blue">{patient.MPD_PATIENT_CODE || patientId}</span>
              <span className={`ce-status-pill ${treatment.MTD_TREATMENT_STATUS === "C" ? "success" : "info"}`}>
                <CheckIcon fontSize="inherit" /> {encounterStatus}
              </span>
            </div>
            <div className="ce-record-subline">
              <span><CalendarIcon fontSize="inherit" /> {dateLabel(treatment.MTD_DATE)}</span>
              <span><DoctorIcon fontSize="inherit" /> {doctorName}</span>
              <span>{doctorSpecialization}</span>
              {appointment?.AppointmentId && <span>Appointment #{appointment.AppointmentId}</span>}
            </div>
          </div>
        </div>

        <div className="ce-record-facts">
          <div><strong>NIC</strong><span>{patient.MPD_NIC_NO || "Not recorded"}</span></div>
          <div><strong>Contact</strong><span>{patient.MPD_MOBILE_NO || "Not recorded"}</span></div>
          <div><strong>Age / Sex</strong><span>{patientAge !== null ? `${patientAge} yrs` : "Age not recorded"} / {genderLabel(patient.MPD_GENDER)}</span></div>
          <div><strong>Blood Group</strong><span>{patient.MPD_BLOOD_GROUP || "Not recorded"}</span></div>
          <div><strong>Location</strong><span>{locationText}</span></div>
          <div><strong>Encounter Type</strong><span>{treatment.MTD_TYPE || "Not recorded"}</span></div>
        </div>

        <div className="ce-record-strip">
          <span><TimeIcon fontSize="inherit" /> {appointment?.AllocatedTime ? timeLabel(appointment.AllocatedTime) : "No allocated appointment time"}</span>
          <span>Channel: {treatment.MTD_CHANNEL_NO ?? "Not assigned"}</span>
          {timeslot?.ClinicRoom && <span>Room: {timeslot.ClinicRoom}</span>}
          {timeslot?.DeliveryChannel && <span>{timeslot.DeliveryChannel}</span>}
          <span className={`ce-status-pill ${pharmacyStatus.className}`}>{pharmacyStatus.label}</span>
          <span className="ce-status-pill neutral">Billing: {paymentLabel(treatment.MTD_PAYMENT_STATUS)}</span>
        </div>
      </section>

      {patient.MPD_PATIENT_REMARKS && (
        <div className="ce-patient-alert">
          <ShieldIcon fontSize="small" />
          <div><strong>Patient-level clinical note</strong><span>{patient.MPD_PATIENT_REMARKS}</span></div>
        </div>
      )}

      <div className="ce-record-layout">
        <div className="ce-column">
          <section className="ce-card">
            <div className="ce-card-heading">
              <NoteIcon fontSize="small" />
              <div><h3>Presenting Complaint</h3><p>Patient-reported symptoms and reason for this encounter.</p></div>
            </div>
            <div className="ce-clinical-text">{treatment.MTD_COMPLAIN || "No presenting complaint was recorded."}</div>
          </section>

          <section className="ce-card">
            <div className="ce-card-heading">
              <DoctorIcon fontSize="small" />
              <div><h3>Diagnostic Assessment & Findings</h3><p>Only findings actually recorded for this encounter are shown.</p></div>
            </div>
            <div className="ce-clinical-text">{treatment.MTD_DIAGNOSTICS || "No diagnostic assessment was recorded."}</div>
          </section>

          <section className="ce-card">
            <div className="ce-card-heading">
              <ShieldIcon fontSize="small" />
              <div><h3>Physician Remarks & Follow-up Orders</h3><p>Clinical instructions, follow-up plan and discharge notes.</p></div>
            </div>
            <div className="ce-clinical-text">{treatment.MTD_REMARKS || "No physician remarks were recorded."}</div>
          </section>
        </div>

        <div className="ce-column">
          <section className="ce-card">
            <div className="ce-card-heading ce-card-heading-split">
              <div className="ce-card-heading-main">
                <PharmacyIcon fontSize="small" />
                <div><h3>Prescribed Medicines</h3><p>{drugs.length} item{drugs.length === 1 ? "" : "s"} linked to this encounter.</p></div>
              </div>
              <span className={`ce-status-pill ${pharmacyStatus.className}`}>{pharmacyStatus.label}</span>
            </div>

            {drugs.length ? (
              <div className="ce-table-wrap">
                <table className="ce-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Schedule</th>
                      <th>Qty</th>
                      <th>Dispensed</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugs.map((drug) => (
                      <tr key={drug.MDD_MATERIAL_CODE}>
                        <td>
                          <strong>{drug.MaterialName || drug.MDD_MATERIAL_CODE}</strong>
                          <span>{[drug.MaterialSpecification, drug.Unit, drug.MDD_MATERIAL_CODE].filter(Boolean).join(" • ")}</span>
                        </td>
                        <td>{drug.MDD_TAKES || "Not recorded"}</td>
                        <td>{Number(drug.MDD_QUANTITY || 0)}</td>
                        <td>{Number(drug.MDD_GIVEN_QUANTITY || 0)}</td>
                        <td>Rs. {money(drug.MDD_RATE)}</td>
                        <td><strong>Rs. {money(drug.MDD_AMOUNT)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ce-empty-state">No medicines were prescribed for this encounter.</div>
            )}
          </section>

          <section className="ce-card">
            <div className="ce-card-heading">
              <InvoiceIcon fontSize="small" />
              <div><h3>Encounter Financial Summary</h3><p>Calculated from the stored treatment fee and prescription lines.</p></div>
            </div>
            <div className="ce-financial-summary">
              <div><span>Consultation / facility fee</span><strong>Rs. {money(consultationFee)}</strong></div>
              <div><span>Prescription value</span><strong>Rs. {money(medicationTotal)}</strong></div>
              <div className="total"><span>Total encounter value</span><strong>Rs. {money(encounterTotal)}</strong></div>
            </div>
            <div className="ce-billing-note">
              <span>Payment status</span>
              <strong>{paymentLabel(treatment.MTD_PAYMENT_STATUS)}</strong>
            </div>
            <button
              className="ce-btn ce-btn-primary ce-full-width"
              onClick={() => navigate(`/dashboard/invoice/${patientId}/${serial_no}`)}
            >
              <InvoiceIcon fontSize="small" /> Open Itemized Invoice
            </button>
          </section>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
