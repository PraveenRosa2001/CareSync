import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  DeleteOutline as DeleteIcon,
  LocalPharmacy as PharmacyIcon,
  MedicalServices as DoctorIcon,
  Person as PersonIcon,
  ReceiptLong as ReceiptIcon,
  Save as SaveIcon,
  ShieldOutlined as ShieldIcon,
} from "@mui/icons-material";
import "../styles/clinicalEncounter.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const DOSAGE_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 6 hours",
  "Every 8 hours",
  "Before meals",
  "After meals",
  "At bedtime",
  "As needed (PRN)",
];

const ENCOUNTER_TYPES = [
  "Inpatient Clinical Review",
  "OPD Specialist Consultation",
  "Emergency Clinical Care",
  "Telehealth Follow-up",
];

const emptyPrescription = () => ({
  materialCode: "",
  takes: "Once daily",
  quantity: 1,
});

const toDateInput = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return String(value).split("T")[0];
};

const getAge = (birthday) => {
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
  const v = String(value || "").trim().toLowerCase();
  if (v === "m" || v === "male") return "Male";
  if (v === "f" || v === "female") return "Female";
  if (!v) return "Not recorded";
  return value;
};

const doctorLabel = (doctor) => {
  if (!doctor) return "";
  const name = doctor.FullName || doctor.UserName || doctor.UserId || "Doctor";
  return doctor.Specialization ? `${name} — ${doctor.Specialization}` : name;
};

const extractApiMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  return fallback;
};

export default function AddRecord() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const serialNumber = location.state?.serialNumber;
  const isEditMode = Boolean(serialNumber);

  const role = localStorage.getItem("Role") || "";
  const staffUserId = localStorage.getItem("id") || "";
  const isDoctorLogin = ["doc", "doctor"].includes(role.toLowerCase());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [timeslot, setTimeslot] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    MTD_PATIENT_CODE: patientId,
    MTD_DATE: new Date().toISOString().slice(0, 10),
    DoctorUserId: "",
    MTD_TYPE: "OPD Specialist Consultation",
    MTD_CHANNEL_NO: "",
    MTD_APPOINMENT_ID: null,
    MTD_COMPLAIN: "",
    MTD_DIAGNOSTICS: "",
    MTD_REMARKS: "",
    MTD_AMOUNT: "",
    MTD_TREATMENT_STATUS: "C",
  });

  const [prescriptions, setPrescriptions] = useState([emptyPrescription()]);

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setPageError("");

      try {
        const contextRequest = axios.get(`${API_BASE}/ClinicalEncounter/context/${patientId}`, {
          params: staffUserId ? { staffUserId } : {},
        });

        const recordRequest = isEditMode
          ? axios.get(`${API_BASE}/ClinicalEncounter/${patientId}/${serialNumber}`)
          : Promise.resolve(null);

        const [contextResponse, recordResponse] = await Promise.all([contextRequest, recordRequest]);
        if (cancelled) return;

        const context = contextResponse.data;
        setPatient(context.Patient || null);
        setDoctors(Array.isArray(context.Doctors) ? context.Doctors : []);
        setMedicines(Array.isArray(context.Medicines) ? context.Medicines : []);
        setAppointment(context.Appointment || null);
        setTimeslot(context.Timeslot || null);

        if (recordResponse?.data) {
          const record = recordResponse.data;
          const treatment = record.Treatment || {};
          const recordAppointment = record.Appointment || null;
          const recordDoctor = record.Doctor || null;

          setPatient(record.Patient || context.Patient || null);
          setAppointment(recordAppointment);
          setTimeslot(record.Timeslot || null);

          const recordMedicines = (record.Drugs || []).map((drug) => ({
            MaterialCode: drug.MDD_MATERIAL_CODE,
            Description: drug.MaterialName,
            Specification: drug.MaterialSpecification,
            Unit: drug.Unit,
            CurrentStock: drug.CurrentStock,
            Rate: drug.MDD_RATE,
            Status: drug.MaterialStatus,
          }));

          setMedicines((current) => {
            const byCode = new Map(current.map((m) => [m.MaterialCode, m]));
            recordMedicines.forEach((m) => {
              if (m.MaterialCode && !byCode.has(m.MaterialCode)) byCode.set(m.MaterialCode, m);
            });
            return Array.from(byCode.values());
          });

          setFormData({
            MTD_PATIENT_CODE: patientId,
            MTD_DATE: toDateInput(treatment.MTD_DATE),
            DoctorUserId: recordDoctor?.UserId || context.SuggestedDoctorUserId || "",
            MTD_TYPE: treatment.MTD_TYPE || context.SuggestedEncounterType || "OPD Specialist Consultation",
            MTD_CHANNEL_NO: treatment.MTD_CHANNEL_NO ?? recordAppointment?.PatientNo ?? "",
            MTD_APPOINMENT_ID: treatment.MTD_APPOINMENT_ID ?? recordAppointment?.AppointmentId ?? null,
            MTD_COMPLAIN: treatment.MTD_COMPLAIN || "",
            MTD_DIAGNOSTICS: treatment.MTD_DIAGNOSTICS || "",
            MTD_REMARKS: treatment.MTD_REMARKS || "",
            MTD_AMOUNT: treatment.MTD_AMOUNT ?? "",
            MTD_TREATMENT_STATUS: treatment.MTD_TREATMENT_STATUS || "C",
          });

          const rx = Array.isArray(record.Drugs)
            ? record.Drugs.map((drug) => ({
                materialCode: drug.MDD_MATERIAL_CODE || "",
                takes: drug.MDD_TAKES || "Once daily",
                quantity: Number(drug.MDD_QUANTITY || 1),
              }))
            : [];
          setPrescriptions(rx.length ? rx : [emptyPrescription()]);
        } else {
          setFormData((prev) => ({
            ...prev,
            MTD_DATE: toDateInput(context.Appointment?.AppointmentDate),
            DoctorUserId: context.SuggestedDoctorUserId || "",
            MTD_TYPE: context.SuggestedEncounterType || "OPD Specialist Consultation",
            MTD_CHANNEL_NO: context.Appointment?.PatientNo ?? "",
            MTD_APPOINMENT_ID: context.Appointment?.AppointmentId ?? null,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(extractApiMessage(error, "Unable to load the clinical encounter data."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [patientId, serialNumber, isEditMode, staffUserId]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.UserId === formData.DoctorUserId) || null,
    [doctors, formData.DoctorUserId]
  );

  const medicineByCode = useMemo(() => {
    const map = new Map();
    medicines.forEach((m) => map.set(m.MaterialCode, m));
    return map;
  }, [medicines]);

  const totalDrugAmount = useMemo(
    () =>
      prescriptions.reduce((sum, rx) => {
        const medicine = medicineByCode.get(rx.materialCode);
        const rate = Number(medicine?.Rate || 0);
        const quantity = Number(rx.quantity || 0);
        return sum + rate * quantity;
      }, 0),
    [prescriptions, medicineByCode]
  );

  const consultationFee = Number(formData.MTD_AMOUNT || 0);
  const encounterTotal = consultationFee + totalDrugAmount;
  const age = getAge(patient?.MPD_BIRTHDAY);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updatePrescription = (index, field, value) => {
    setPrescriptions((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  };

  const addPrescription = () => setPrescriptions((prev) => [...prev, emptyPrescription()]);

  const removePrescription = (index) => {
    setPrescriptions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyPrescription()];
    });
  };

  const validate = () => {
    if (!formData.DoctorUserId) return "Select the attending physician.";
    if (!formData.MTD_COMPLAIN.trim()) return "Enter the patient's presenting complaint.";
    if (!formData.MTD_DIAGNOSTICS.trim()) return "Enter the diagnostic assessment / clinical findings.";
    if (formData.MTD_AMOUNT === "" || Number(formData.MTD_AMOUNT) < 0) return "Enter a valid consultation fee.";

    const chosen = prescriptions.filter((p) => p.materialCode);
    if (chosen.some((p) => Number(p.quantity) <= 0)) return "Every prescribed medicine must have a quantity greater than zero.";

    const uniqueCodes = new Set(chosen.map((p) => p.materialCode));
    if (uniqueCodes.size !== chosen.length) return "The same medicine cannot be added more than once.";

    const incomplete = prescriptions.some((p) => !p.materialCode && (Number(p.quantity) !== 1 || p.takes !== "Once daily"));
    if (incomplete) return "Select a medicine for every prescription row or remove the unused row.";

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }

    const payload = {
      MTD_PATIENT_CODE: patientId,
      MTD_DATE: formData.MTD_DATE,
      DoctorUserId: formData.DoctorUserId,
      MTD_TYPE: formData.MTD_TYPE,
      MTD_CHANNEL_NO: formData.MTD_CHANNEL_NO === "" ? null : Number(formData.MTD_CHANNEL_NO),
      MTD_APPOINMENT_ID: formData.MTD_APPOINMENT_ID || null,
      MTD_COMPLAIN: formData.MTD_COMPLAIN.trim(),
      MTD_DIAGNOSTICS: formData.MTD_DIAGNOSTICS.trim(),
      MTD_REMARKS: formData.MTD_REMARKS.trim() || null,
      MTD_AMOUNT: Number(formData.MTD_AMOUNT || 0),
      MTD_TREATMENT_STATUS: formData.MTD_TREATMENT_STATUS,
      MTD_CREATED_BY: staffUserId || formData.DoctorUserId,
      Prescriptions: prescriptions
        .filter((p) => p.materialCode)
        .map((p) => ({
          MDD_MATERIAL_CODE: p.materialCode,
          MDD_QUANTITY: Number(p.quantity),
          MDD_TAKES: p.takes,
        })),
    };

    setSaving(true);
    try {
      const response = isEditMode
        ? await axios.put(`${API_BASE}/ClinicalEncounter/${patientId}/${serialNumber}`, payload)
        : await axios.post(`${API_BASE}/ClinicalEncounter`, payload);

      const savedSerial = response.data?.Treatment?.MTD_SERIAL_NO || serialNumber;
      if (!savedSerial) throw new Error("The server did not return the saved encounter number.");

      navigate(`/dashboard/view-record/${patientId}/${savedSerial}`, {
        replace: true,
        state: { justSaved: true },
      });
    } catch (error) {
      showToast(extractApiMessage(error, "The treatment could not be saved. Please review the entered information."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ce-loading-state">
        <CircularProgress size={34} />
        <span>Loading patient, appointment and formulary data…</span>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="ce-page">
        <div className="ce-error-panel">
          <strong>Clinical encounter could not be opened.</strong>
          <span>{pageError}</span>
          <button className="ce-btn ce-btn-secondary" onClick={() => navigate(-1)}>
            <BackIcon fontSize="small" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ce-page">
      <div className="ce-pagebar">
        <div className="ce-pagebar-left">
          <button className="ce-btn ce-btn-secondary" onClick={() => navigate(-1)}>
            <BackIcon fontSize="small" /> Cancel
          </button>
          <div>
            <div className="ce-eyebrow">Patient Records / {isEditMode ? "Edit Encounter" : "New Encounter"}</div>
            <h1>{isEditMode ? "Update Clinical Treatment" : "Clinical Treatment Entry"}</h1>
          </div>
        </div>
        <button className="ce-btn ce-btn-primary" type="submit" form="clinicalEncounterForm" disabled={saving}>
          {saving ? <CircularProgress size={17} color="inherit" /> : <SaveIcon fontSize="small" />}
          {isEditMode ? "Save Changes" : "Submit Treatment"}
        </button>
      </div>

      <section className="ce-patient-banner">
        <div className="ce-avatar">{(patient?.MPD_PATIENT_NAME || "P").charAt(0).toUpperCase()}</div>
        <div className="ce-patient-main">
          <div className="ce-patient-title-row">
            <h2>{patient?.MPD_PATIENT_NAME || "Patient"}</h2>
            <span className="ce-chip ce-chip-blue">{patient?.MPD_PATIENT_CODE || patientId}</span>
            <span className="ce-chip">{patient?.MPD_PATIENT_TYPE || "Patient type not recorded"}</span>
          </div>
          <div className="ce-patient-meta-grid">
            <span><strong>NIC</strong>{patient?.MPD_NIC_NO || "Not recorded"}</span>
            <span><strong>Phone</strong>{patient?.MPD_MOBILE_NO || "Not recorded"}</span>
            <span><strong>Age / Sex</strong>{age !== null ? `${age} yrs` : "Age not recorded"} / {genderLabel(patient?.MPD_GENDER)}</span>
            <span><strong>Blood Group</strong>{patient?.MPD_BLOOD_GROUP || "Not recorded"}</span>
            <span><strong>Location</strong>{[patient?.MPD_ADDRESS, patient?.MPD_CITY].filter(Boolean).join(", ") || "Not recorded"}</span>
          </div>
        </div>
        <div className="ce-clinical-note">
          <ShieldIcon fontSize="small" />
          <div>
            <strong>Clinical note</strong>
            <span>{patient?.MPD_PATIENT_REMARKS || "No patient-level alert or remark recorded."}</span>
          </div>
        </div>
      </section>

      <form id="clinicalEncounterForm" onSubmit={handleSubmit}>
        <div className="ce-layout">
          <div className="ce-column">
            <section className="ce-card">
              <div className="ce-card-heading">
                <CalendarIcon fontSize="small" />
                <div>
                  <h3>Clinical Encounter Parameters</h3>
                  <p>Linked to real appointment and staff records where available.</p>
                </div>
              </div>

              {appointment ? (
                <div className="ce-linked-appointment">
                  <CheckIcon fontSize="small" />
                  <div>
                    <strong>Linked appointment #{appointment.AppointmentId}</strong>
                    <span>
                      {toDateInput(appointment.AppointmentDate)}
                      {appointment.AllocatedTime ? ` • ${String(appointment.AllocatedTime).slice(0, 5)}` : ""}
                      {timeslot?.ClinicRoom ? ` • ${timeslot.ClinicRoom}` : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No unlinked appointment was found for this patient. Enter the encounter as a direct clinical review.
                </Alert>
              )}

              <div className="ce-form-grid two">
                <TextField
                  label="Consultation Date"
                  type="date"
                  value={formData.MTD_DATE}
                  onChange={(e) => setField("MTD_DATE", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  disabled={Boolean(appointment)}
                  required
                />
                <TextField
                  label="Channel / Queue #"
                  type="number"
                  value={formData.MTD_CHANNEL_NO}
                  onChange={(e) => setField("MTD_CHANNEL_NO", e.target.value)}
                  size="small"
                  disabled={Boolean(appointment)}
                  placeholder="Not assigned"
                />
              </div>

              <FormControl fullWidth size="small">
                <InputLabel>Attending Physician</InputLabel>
                <Select
                  value={formData.DoctorUserId}
                  label="Attending Physician"
                  onChange={(e) => setField("DoctorUserId", e.target.value)}
                  disabled={Boolean(appointment && formData.DoctorUserId) || isDoctorLogin}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.UserId} value={doctor.UserId}>
                      {doctorLabel(doctor)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedDoctor && (
                <div className="ce-inline-profile">
                  <DoctorIcon fontSize="small" />
                  <span>
                    <strong>{selectedDoctor.FullName || selectedDoctor.UserName}</strong>
                    {selectedDoctor.Specialization ? ` • ${selectedDoctor.Specialization}` : " • Specialization not recorded"}
                  </span>
                </div>
              )}

              <FormControl fullWidth size="small">
                <InputLabel>Encounter Category</InputLabel>
                <Select
                  value={formData.MTD_TYPE}
                  label="Encounter Category"
                  onChange={(e) => setField("MTD_TYPE", e.target.value)}
                >
                  {ENCOUNTER_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </section>

            <section className="ce-card">
              <div className="ce-card-heading">
                <PersonIcon fontSize="small" />
                <div>
                  <h3>Clinical Assessment</h3>
                  <p>Record the complaint, findings and physician plan for this encounter.</p>
                </div>
              </div>

              <TextField
                label="Patient Presenting Complaints"
                multiline
                rows={4}
                value={formData.MTD_COMPLAIN}
                onChange={(e) => setField("MTD_COMPLAIN", e.target.value)}
                placeholder="Symptoms, onset, severity, relevant history…"
                required
                fullWidth
              />
              <TextField
                label="Diagnostic Assessment & Clinical Findings"
                multiline
                rows={4}
                value={formData.MTD_DIAGNOSTICS}
                onChange={(e) => setField("MTD_DIAGNOSTICS", e.target.value)}
                placeholder="Exam findings, investigations, working diagnosis and clinical observations…"
                required
                fullWidth
              />
              <TextField
                label="Physician Remarks & Follow-up Orders"
                multiline
                rows={3}
                value={formData.MTD_REMARKS}
                onChange={(e) => setField("MTD_REMARKS", e.target.value)}
                placeholder="Follow-up instructions, nursing directions, lifestyle advice or discharge plan…"
                fullWidth
              />
            </section>
          </div>

          <div className="ce-column">
            <section className="ce-card">
              <div className="ce-card-heading ce-card-heading-split">
                <div className="ce-card-heading-main">
                  <PharmacyIcon fontSize="small" />
                  <div>
                    <h3>Pharmacological Dispensing Orders</h3>
                    <p>Medicines below are loaded from the active hospital inventory.</p>
                  </div>
                </div>
                <button type="button" className="ce-btn ce-btn-secondary compact" onClick={addPrescription}>
                  <AddIcon fontSize="small" /> Add Medicine
                </button>
              </div>

              {medicines.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No active medicines are available in the inventory catalogue.
                </Alert>
              )}

              <div className="ce-rx-list">
                {prescriptions.map((rx, index) => {
                  const selected = medicineByCode.get(rx.materialCode) || null;
                  const stock = Number(selected?.CurrentStock || 0);
                  const rate = Number(selected?.Rate || 0);
                  const lineTotal = rate * Number(rx.quantity || 0);

                  return (
                    <div className="ce-rx-row" key={`${rx.materialCode}-${index}`}>
                      <div className="ce-rx-fields">
                        <Autocomplete
                          options={medicines}
                          value={selected}
                          onChange={(_, value) => updatePrescription(index, "materialCode", value?.MaterialCode || "")}
                          isOptionEqualToValue={(option, value) => option.MaterialCode === value.MaterialCode}
                          getOptionLabel={(option) =>
                            [option.Description, option.Specification].filter(Boolean).join(" • ") || option.MaterialCode
                          }
                          renderOption={(props, option) => (
                            <li {...props} key={option.MaterialCode}>
                              <div className="ce-medicine-option">
                                <div>
                                  <strong>{option.Description || option.MaterialCode}</strong>
                                  <span>{[option.Specification, option.Unit, option.MaterialCode].filter(Boolean).join(" • ")}</span>
                                </div>
                                <div className="ce-medicine-option-right">
                                  <strong>Rs. {Number(option.Rate || 0).toFixed(2)}</strong>
                                  <span className={Number(option.CurrentStock || 0) > 0 ? "stock-ok" : "stock-empty"}>
                                    Stock: {Number(option.CurrentStock || 0)}
                                  </span>
                                </div>
                              </div>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField {...params} label="Medicine from Inventory" size="small" />
                          )}
                        />

                        <FormControl size="small" fullWidth>
                          <InputLabel>Dosage Schedule</InputLabel>
                          <Select
                            value={rx.takes}
                            label="Dosage Schedule"
                            onChange={(e) => updatePrescription(index, "takes", e.target.value)}
                          >
                            {DOSAGE_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          label="Qty"
                          type="number"
                          size="small"
                          value={rx.quantity}
                          onChange={(e) => updatePrescription(index, "quantity", e.target.value)}
                          inputProps={{ min: 1, step: 1 }}
                        />

                        <button
                          type="button"
                          className="ce-icon-danger"
                          onClick={() => removePrescription(index)}
                          title="Remove medicine"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>

                      {selected && (
                        <div className="ce-rx-meta">
                          <span><strong>Code</strong>{selected.MaterialCode}</span>
                          <span><strong>Form</strong>{selected.Unit || "Not recorded"}</span>
                          <span><strong>Available</strong><em className={stock > 0 ? "ok" : "warning"}>{stock}</em></span>
                          <span><strong>Unit Rate</strong>Rs. {rate.toFixed(2)}</span>
                          <span><strong>Line Total</strong>Rs. {lineTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="ce-card">
              <div className="ce-card-heading">
                <ReceiptIcon fontSize="small" />
                <div>
                  <h3>Encounter Settlement & Status</h3>
                  <p>Financial values are calculated from the selected inventory rates.</p>
                </div>
              </div>

              <div className="ce-form-grid two">
                <FormControl fullWidth size="small">
                  <InputLabel>Clinical Status</InputLabel>
                  <Select
                    value={formData.MTD_TREATMENT_STATUS}
                    label="Clinical Status"
                    onChange={(e) => setField("MTD_TREATMENT_STATUS", e.target.value)}
                  >
                    <MenuItem value="C">Clinical encounter completed</MenuItem>
                    <MenuItem value="P">Clinical preparation / follow-up pending</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Consultation Fee (Rs.)"
                  type="number"
                  value={formData.MTD_AMOUNT}
                  onChange={(e) => setField("MTD_AMOUNT", e.target.value)}
                  inputProps={{ min: 0, step: "0.01" }}
                  size="small"
                  required
                />
              </div>

              <div className="ce-financial-summary">
                <div><span>Consultation / facility fee</span><strong>Rs. {consultationFee.toFixed(2)}</strong></div>
                <div><span>Prescription value ({prescriptions.filter((p) => p.materialCode).length} items)</span><strong>Rs. {totalDrugAmount.toFixed(2)}</strong></div>
                <div className="total"><span>Estimated encounter total</span><strong>Rs. {encounterTotal.toFixed(2)}</strong></div>
              </div>

              <div className="ce-form-actions">
                <button type="button" className="ce-btn ce-btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="ce-btn ce-btn-primary" disabled={saving}>
                  {saving ? <CircularProgress size={17} color="inherit" /> : <SaveIcon fontSize="small" />}
                  {isEditMode ? "Update Encounter" : "Save Clinical Encounter"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5500}
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
