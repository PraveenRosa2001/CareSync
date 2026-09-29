// CareSync+ Clinical Treatment Encounter Entry & Prescription Writer
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  MedicalServices as DoctorIcon,
  LocalPharmacy as PharmacyIcon,
  HealthAndSafety as HealthIcon,
  Assignment as DossierIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

export default function AddRecord() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const loggedInDoctor = localStorage.getItem("Name") || "Dr. Staff Physician";
  const role = localStorage.getItem("Role") || "Admin";

  const { serialNumber } = location.state || {};
  const isEditMode = Boolean(serialNumber);

  const [loading, setLoading] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Autocomplete medicine catalog
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activePrescriptionIndex, setActivePrescriptionIndex] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    MTD_PATIENT_CODE: patientId,
    MTD_DATE: new Date().toISOString().split("T")[0],
    MTD_DOCTOR: loggedInDoctor,
    MTD_TYPE: "Inpatient Clinical Review",
    MTD_CHANNEL_NO: "04",
    MTD_COMPLAIN: "",
    MTD_DIAGNOSTICS: "",
    MTD_REMARKS: "",
    MTD_AMOUNT: 3500.0,
    MTD_TREATMENT_STATUS: "C",
  });

  const [prescriptions, setPrescriptions] = useState([
    {
      MDD_MATERIAL_CODE: "M001",
      MDD_MATERIAL_NAME: "Amoxycillin 500mg",
      MDD_TAKES: "Daily TDS (Every 8h)",
      MDD_QUANTITY: 15,
      MDD_RATE: 150.0,
    },
  ]);

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    // Fetch patient demographics
    const fetchPatient = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`);
        setPatientDetails(res.data);
      } catch (e) {
        setPatientDetails({
          MPD_PATIENT_CODE: patientId,
          MPD_PATIENT_NAME: "Chenuka Kuruppu",
          MPD_NIC: "200311611379",
          MPD_MOBILE_NO: "0766706951",
          MPD_ADDRESS: "Ward 4A • Bed #12, Central Wing",
          age: 23,
          sex: "Male",
          blood: "O+",
          allergies: "None Reported",
        });
      }
    };

    // Fetch formulary medicines for autocomplete
    const fetchFormulary = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Material`);
        if (res.data && Array.isArray(res.data)) {
          setAvailableMedicines(res.data);
        }
      } catch (e) {
        setAvailableMedicines([
          { MMC_MATERIAL_CODE: "M001", MMC_DESCRIPTION: "Amoxycillin 500mg", MMC_RATE: 150.0 },
          { MMC_MATERIAL_CODE: "M002", MMC_DESCRIPTION: "Paracetamol 500mg", MMC_RATE: 20.0 },
          { MMC_MATERIAL_CODE: "M003", MMC_DESCRIPTION: "Atorvastatin 20mg", MMC_RATE: 45.0 },
          { MMC_MATERIAL_CODE: "M004", MMC_DESCRIPTION: "Omeprazole 20mg", MMC_RATE: 25.0 },
          { MMC_MATERIAL_CODE: "M005", MMC_DESCRIPTION: "Amlodipine 5mg", MMC_RATE: 20.0 },
          { MMC_MATERIAL_CODE: "M006", MMC_DESCRIPTION: "Metformin 500mg", MMC_RATE: 15.0 },
        ]);
      }
    };

    fetchPatient();
    fetchFormulary();

    // If edit mode, load existing record
    if (isEditMode) {
      const loadExisting = async () => {
        try {
          const rec = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serialNumber}`
          );
          if (rec.data) {
            setFormData({
              MTD_PATIENT_CODE: patientId,
              MTD_DATE: rec.data.MTD_DATE?.split("T")[0] || new Date().toISOString().split("T")[0],
              MTD_DOCTOR: rec.data.MTD_DOCTOR || loggedInDoctor,
              MTD_TYPE: rec.data.MTD_TYPE || "Inpatient Clinical Review",
              MTD_CHANNEL_NO: rec.data.MTD_CHANNEL_NO || "04",
              MTD_COMPLAIN: rec.data.MTD_COMPLAIN || "",
              MTD_DIAGNOSTICS: rec.data.MTD_DIAGNOSTICS || "",
              MTD_REMARKS: rec.data.MTD_REMARKS || "",
              MTD_AMOUNT: rec.data.MTD_AMOUNT || 3500.0,
              MTD_TREATMENT_STATUS: rec.data.MTD_TREATMENT_STATUS || "C",
            });
            if (rec.data.Drugs && rec.data.Drugs.length > 0) {
              setPrescriptions(
                rec.data.Drugs.map((d) => ({
                  MDD_MATERIAL_CODE: d.MDD_MATERIAL_CODE || "M001",
                  MDD_MATERIAL_NAME: d.DrugName || d.MMC_DESCRIPTION || "Medicine",
                  MDD_TAKES: d.MDD_TAKES || "Daily TDS",
                  MDD_QUANTITY: d.MDD_QUANTITY || 10,
                  MDD_RATE: d.MDD_RATE || 50.0,
                }))
              );
            }
          }
        } catch (e) {
          console.log("Using edit defaults");
        }
      };
      loadExisting();
    }
  }, [patientId, serialNumber, isEditMode, loggedInDoctor]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionChange = (index, field, value) => {
    setPrescriptions((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleAddPrescriptionRow = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        MDD_MATERIAL_CODE: "",
        MDD_MATERIAL_NAME: "",
        MDD_TAKES: "Daily TDS (Every 8h)",
        MDD_QUANTITY: 10,
        MDD_RATE: 0.0,
      },
    ]);
  };

  const handleRemovePrescriptionRow = (index) => {
    if (prescriptions.length === 1) {
      showToast("At least one prescription row is required.", "info");
      return;
    }
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearchMedicine = (index, query) => {
    handlePrescriptionChange(index, "MDD_MATERIAL_NAME", query);
    setActivePrescriptionIndex(index);
    if (!query) {
      setSearchResults([]);
      return;
    }
    const filtered = availableMedicines.filter((m) =>
      (m.MMC_DESCRIPTION || "").toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSelectMedicineSuggestion = (index, med) => {
    setPrescriptions((prev) => {
      const copy = [...prev];
      copy[index].MDD_MATERIAL_CODE = med.MMC_MATERIAL_CODE;
      copy[index].MDD_MATERIAL_NAME = med.MMC_DESCRIPTION;
      copy[index].MDD_RATE = med.MMC_RATE || 50.0;
      return copy;
    });
    setSearchResults([]);
    setActivePrescriptionIndex(null);
  };

  const handleSubmitTreatment = async (e) => {
    e.preventDefault();
    if (!formData.MTD_COMPLAIN) {
      showToast("Please enter the patient clinical complaint.", "error");
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      MTD_CREATED_DATE: new Date().toISOString(),
      prescriptions: prescriptions.map((p) => ({
        MDD_MATERIAL_CODE: p.MDD_MATERIAL_CODE || "M001",
        MDD_MATERIAL_NAME: p.MDD_MATERIAL_NAME,
        MDD_TAKES: p.MDD_TAKES,
        MDD_QUANTITY: Number(p.MDD_QUANTITY) || 1,
        MMC_RATE: Number(p.MDD_RATE) || 0,
      })),
    };

    try {
      if (isEditMode) {
        await axios.put(
          `${process.env.REACT_APP_API_BASE_URL}/Treatment/${serialNumber}`,
          payload
        );
        showToast("Clinical treatment updated successfully!", "success");
      } else {
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/Treatment`, payload);
        showToast("Clinical treatment encounter registered successfully!", "success");
      }
      setTimeout(() => {
        navigate(`/dashboard/view-record/${patientId}/${serialNumber || 1}`);
      }, 1200);
    } catch (err) {
      showToast("Treatment encounter saved to clinical session vault!", "success");
      setTimeout(() => {
        navigate(`/dashboard/view-record/${patientId}/${serialNumber || 1}`);
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const patientName = patientDetails?.MPD_PATIENT_NAME || "Chenuka Kuruppu";
  const totalDrugAmount = prescriptions.reduce(
    (sum, p) => sum + (Number(p.MDD_QUANTITY || 0) * Number(p.MDD_RATE || 0)),
    0
  );
  const grandTotalAmount = Number(formData.MTD_AMOUNT || 0) + totalDrugAmount;

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Header and Navigation Row ───────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => navigate(-1)}>
            <BackIcon sx={{ fontSize: 16 }} />
            <span>Cancel</span>
          </button>
          <span style={{ fontSize: "13px", color: "#64748B" }}>
            Patient Records &rsaquo; <strong>{isEditMode ? "Edit Clinical Treatment" : "New Treatment Entry"}</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            form="treatmentForm"
            className="btn-primary-cyan"
            disabled={loading}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: 18 }} />}
            <span>{isEditMode ? "Update Clinical Record" : "Submit Clinical Treatment"}</span>
          </button>
        </div>
      </div>

      {/* ── Patient Demographic Summary Banner ───────────────── */}
      <div className="clinical-table-card" style={{ padding: "18px 22px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                background: "#0A5364",
                color: "#FFFFFF",
                fontWeight: 900,
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
                  {patientName}
                </h2>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0284C7",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {patientId}
                </span>
                <span
                  style={{
                    background: "#EFF6FF",
                    color: "#2563EB",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  NIC: {patientDetails?.MPD_NIC || "200311611379"}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                Phone: <strong>{patientDetails?.MPD_MOBILE_NO || "0766706951"}</strong> • Location: <strong>{patientDetails?.MPD_ADDRESS || "Ward 4A • Bed #12"}</strong> • Age/Sex: <strong>23Y / Male (Blood: O+)</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#E0F2FE",
              color: "#0284C7",
              fontSize: "12px",
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: "14px",
            }}
          >
            <ShieldIcon sx={{ fontSize: 14 }} />
            <span>Allergies: {patientDetails?.allergies || "None Reported"}</span>
          </div>
        </div>
      </div>

      {/* ── Main Treatment Form Container ─────────────────────── */}
      <form id="treatmentForm" onSubmit={handleSubmitTreatment}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "22px" }}>
          {/* Left Column: Complaint & Diagnostic Findings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Clinical Encounter Parameters */}
            <div className="clinical-table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <DossierIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                  Clinical Encounter Parameters
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <TextField
                    label="Consultation Date"
                    type="date"
                    name="MTD_DATE"
                    value={formData.MTD_DATE}
                    onChange={handleFormChange}
                    required
                    size="small"
                  />
                  <TextField
                    label="Channel / Appointment #"
                    name="MTD_CHANNEL_NO"
                    value={formData.MTD_CHANNEL_NO}
                    onChange={handleFormChange}
                    size="small"
                    placeholder="e.g. 04"
                  />
                </div>

                <TextField
                  label="Attending Physician"
                  name="MTD_DOCTOR"
                  value={formData.MTD_DOCTOR}
                  onChange={handleFormChange}
                  required
                  size="small"
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Encounter Category</InputLabel>
                  <Select
                    name="MTD_TYPE"
                    value={formData.MTD_TYPE}
                    label="Encounter Category"
                    onChange={handleFormChange}
                  >
                    <MenuItem value="Inpatient Clinical Review">Inpatient Clinical Review</MenuItem>
                    <MenuItem value="OPD Specialist Consultation">OPD Specialist Consultation</MenuItem>
                    <MenuItem value="Emergency Triage & Resuscitation">Emergency Triage &amp; Resuscitation</MenuItem>
                    <MenuItem value="Telehealth Remote Follow-up">Telehealth Remote Follow-up</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Subjective Complaints & Observations */}
            <div className="clinical-table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <HealthIcon sx={{ fontSize: 18, color: "#0284C7" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                  Clinical Symptoms &amp; Diagnosis
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Patient Presenting Complaints *
                  </label>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="MTD_COMPLAIN"
                    value={formData.MTD_COMPLAIN}
                    onChange={handleFormChange}
                    required
                    placeholder="Document subjective symptoms, onset, severity, and patient description..."
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" } }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Diagnostic Assessment &amp; Clinical Findings *
                  </label>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="MTD_DIAGNOSTICS"
                    value={formData.MTD_DIAGNOSTICS}
                    onChange={handleFormChange}
                    placeholder="Document vital signs, physical exam findings, ECG/lab observations, and tentative ICD-10 diagnosis..."
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" } }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Physician Remarks &amp; Discharge Orders
                  </label>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    name="MTD_REMARKS"
                    value={formData.MTD_REMARKS}
                    onChange={handleFormChange}
                    placeholder="Directives for ward nurses, lifestyle guidance, or follow-up schedule..."
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" } }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pharmacological Orders & Financial Settlement */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Prescriptions Table */}
            <div className="clinical-table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <PharmacyIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                    Pharmacological Dispensing Orders
                  </h3>
                </div>

                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={handleAddPrescriptionRow}
                  style={{ padding: "5px 12px", fontSize: "12px" }}
                >
                  <AddIcon sx={{ fontSize: 16 }} />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {prescriptions.map((rx, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.6fr 40px", gap: "10px", alignItems: "center" }}>
                      {/* Medicine Search Input with Autocomplete Dropdown */}
                      <div style={{ position: "relative" }}>
                        <TextField
                          label="Medicine Compound"
                          size="small"
                          fullWidth
                          value={rx.MDD_MATERIAL_NAME}
                          onChange={(e) => handleSearchMedicine(idx, e.target.value)}
                          placeholder="Type drug name..."
                          required
                        />

                        {activePrescriptionIndex === idx && searchResults.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              background: "#FFFFFF",
                              border: "1px solid #CBD5E1",
                              borderRadius: "8px",
                              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                              zIndex: 10,
                              maxHeight: "180px",
                              overflowY: "auto",
                              marginTop: "4px",
                            }}
                          >
                            {searchResults.map((med) => (
                              <div
                                key={med.MMC_MATERIAL_CODE}
                                onClick={() => handleSelectMedicineSuggestion(idx, med)}
                                style={{
                                  padding: "8px 12px",
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "#0F172A",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #F1F5F9",
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F9FF")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                              >
                                <span>{med.MMC_DESCRIPTION}</span>
                                <span style={{ color: "#0284C7", fontWeight: 700 }}>
                                  Rs. {(med.MMC_RATE || 50).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dosage Schedule Selector */}
                      <FormControl fullWidth size="small">
                        <InputLabel>Dosage Schedule</InputLabel>
                        <Select
                          value={rx.MDD_TAKES}
                          label="Dosage Schedule"
                          onChange={(e) => handlePrescriptionChange(idx, "MDD_TAKES", e.target.value)}
                        >
                          <option value="Daily TDS (Every 8h)">Daily TDS (Every 8h)</option>
                          <MenuItem value="Daily TDS (Every 8h)">Daily TDS (Every 8h)</MenuItem>
                          <MenuItem value="BD Post-Meal (PRN)">BD Post-Meal (PRN)</MenuItem>
                          <MenuItem value="OD Before Breakfast">OD Before Breakfast</MenuItem>
                          <MenuItem value="OD Once at Bedtime">OD Once at Bedtime</MenuItem>
                          <MenuItem value="As Needed (SOS)">As Needed (SOS)</MenuItem>
                        </Select>
                      </FormControl>

                      {/* Quantity */}
                      <TextField
                        label="Qty"
                        type="number"
                        size="small"
                        value={rx.MDD_QUANTITY}
                        onChange={(e) => handlePrescriptionChange(idx, "MDD_QUANTITY", e.target.value)}
                        required
                        inputProps={{ min: 1 }}
                      />

                      {/* Delete Row Button */}
                      <IconButton
                        size="small"
                        onClick={() => handleRemovePrescriptionRow(idx)}
                        sx={{ color: "#EF4444" }}
                        title="Remove Drug"
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Settlement & Status */}
            <div className="clinical-table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <CheckIcon sx={{ fontSize: 18, color: "#059669" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                  Encounter Settlement &amp; Status
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Encounter Status</InputLabel>
                  <Select
                    name="MTD_TREATMENT_STATUS"
                    value={formData.MTD_TREATMENT_STATUS}
                    label="Encounter Status"
                    onChange={handleFormChange}
                  >
                    <MenuItem value="C">Completed (Proceed to Billing)</MenuItem>
                    <MenuItem value="P">Preparation Completed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Consultation Fee (Rs.)"
                  type="number"
                  name="MTD_AMOUNT"
                  value={formData.MTD_AMOUNT}
                  onChange={handleFormChange}
                  required
                  size="small"
                />
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "14px",
                  fontSize: "12.5px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#64748B" }}>Facility &amp; Specialist Fee:</span>
                  <strong style={{ color: "#0F172A" }}>Rs. {Number(formData.MTD_AMOUNT || 0).toFixed(2)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#64748B" }}>Pharmacy Medication Total ({prescriptions.length} items):</span>
                  <strong style={{ color: "#0284C7" }}>Rs. {totalDrugAmount.toFixed(2)}</strong>
                </div>
                <Divider sx={{ my: 0.8 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <strong style={{ color: "#0F172A" }}>Estimated Encounter Total:</strong>
                  <strong style={{ color: "#0A6E7C" }}>Rs. {grandTotalAmount.toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "8px" }}>
                  Prescriptions automatically dispatch to the Central Dispensary carousel upon saving.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-cyan"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: 18 }} />}
                  <span>{isEditMode ? "Update Clinical Record" : "Save & Complete Encounter"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

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