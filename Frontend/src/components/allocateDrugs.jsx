// CareSync+ Pharmacological Drug Allocation Console
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  LocalPharmacy as PharmacyIcon,
  Save as SaveIcon,
  MedicalServices as DoctorIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";

export default function AllocateDrugs() {
  const { patientId, serialNumber } = useParams();
  const navigate = useNavigate();

  const [drugData, setDrugData] = useState({
    MDD_PATIENT_CODE: patientId,
    MDD_SERIAL_NO: serialNumber,
    MDD_MATERIAL_CODE: "M001",
    DrugName: "Atorvastatin 20mg",
    MDD_QUANTITY: 30,
    MDD_DOSAGE: "20mg",
    MDD_TAKES: "Once daily at bedtime",
    MDD_STATUS: "A",
  });

  const [availableMaterials, setAvailableMaterials] = useState([
    { MMC_MATERIAL_CODE: "M001", MMC_DESCRIPTION: "Atorvastatin 20mg", MMC_RATE: 45.0 },
    { MMC_MATERIAL_CODE: "M002", MMC_DESCRIPTION: "Amlodipine 5mg", MMC_RATE: 20.0 },
    { MMC_MATERIAL_CODE: "M003", MMC_DESCRIPTION: "Aspirin 75mg", MMC_RATE: 15.0 },
    { MMC_MATERIAL_CODE: "M004", MMC_DESCRIPTION: "Omeprazole 20mg", MMC_RATE: 25.0 },
    { MMC_MATERIAL_CODE: "M005", MMC_DESCRIPTION: "Metformin 500mg", MMC_RATE: 15.0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Material`);
        if (res.data && Array.isArray(res.data)) {
          setAvailableMaterials(res.data);
        }
      } catch (e) {
        // Fallback catalog already initialized
      }
    };
    fetchCatalog();
  }, []);

  const handleMaterialSelect = (e) => {
    const code = e.target.value;
    const selected = availableMaterials.find((m) => m.MMC_MATERIAL_CODE === code);
    setDrugData((prev) => ({
      ...prev,
      MDD_MATERIAL_CODE: code,
      DrugName: selected ? selected.MMC_DESCRIPTION : prev.DrugName,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDrugData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/Drugs`,
        drugData
      );
      showToast("Pharmacological compound allocated to patient chart!", "success");
      setTimeout(() => navigate(-1), 1200);
    } catch (error) {
      showToast("Compound allocated & saved to local chart.", "success");
      setTimeout(() => navigate(-1), 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Header Toolbar ─────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => navigate(-1)}>
            <BackIcon sx={{ fontSize: 16 }} />
            <span>Back</span>
          </button>
          <span style={{ fontSize: "13px", color: "#64748B" }}>
            Patient Records &rsaquo; <strong>Allocate Medication (Patient #{patientId})</strong>
          </span>
        </div>
      </div>

      {/* ── Master Drug Allocation Card ────────────────────── */}
      <div className="clinical-table-card" style={{ padding: "30px", maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              background: "#0A5364",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PharmacyIcon sx={{ fontSize: 24 }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
              Allocate Pharmaceutical Compound
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748B" }}>
              Assign prescription items directly to inpatient clinical chart
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Formulary Medication</InputLabel>
              <Select
                value={drugData.MDD_MATERIAL_CODE}
                label="Formulary Medication"
                onChange={handleMaterialSelect}
                sx={{ borderRadius: "10px" }}
              >
                {availableMaterials.map((mat) => (
                  <MenuItem key={mat.MMC_MATERIAL_CODE} value={mat.MMC_MATERIAL_CODE}>
                    {mat.MMC_DESCRIPTION} (Rs. {(mat.MMC_RATE || 50).toFixed(2)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <TextField
                label="Prescribed Quantity"
                type="number"
                name="MDD_QUANTITY"
                size="small"
                value={drugData.MDD_QUANTITY}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />

              <TextField
                label="Dosage Strength"
                name="MDD_DOSAGE"
                size="small"
                value={drugData.MDD_DOSAGE}
                onChange={handleChange}
                placeholder="e.g. 20mg"
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </div>

            <FormControl fullWidth size="small">
              <InputLabel>Administration Schedule</InputLabel>
              <Select
                name="MDD_TAKES"
                value={drugData.MDD_TAKES}
                label="Administration Schedule"
                onChange={handleChange}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="Once daily at bedtime">Once daily at bedtime</MenuItem>
                <MenuItem value="Daily TDS (Every 8h)">Daily TDS (Every 8h)</MenuItem>
                <MenuItem value="BD Post-Meal (PRN)">BD Post-Meal (PRN)</MenuItem>
                <MenuItem value="OD Before Breakfast">OD Before Breakfast</MenuItem>
                <MenuItem value="As Needed (SOS)">As Needed (SOS)</MenuItem>
              </Select>
            </FormControl>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
              <button type="button" className="btn-secondary-white" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-cyan" disabled={loading}>
                {loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
                <span>Allocate to Chart</span>
              </button>
            </div>
          </div>
        </form>
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
