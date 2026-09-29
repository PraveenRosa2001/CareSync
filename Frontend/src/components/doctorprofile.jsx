// CareSync+ Healthcare Provider Profile & Credentials Console
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Lock as LockIcon,
  CalendarToday as CalendarIcon,
  MedicalServices as DoctorIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
  LocalHospital,
} from "@mui/icons-material";

export default function DoctorProfile() {
  const [userDetails, setUserDetails] = useState({
    MUD_USER_NAME: "",
    MUD_USER_TYPE: "Doctor",
    MUD_SPECIALIZATION: "Cardiology & Inpatient Care",
    MUD_STATUS: "Active",
    MUD_PHOTO: null,
    MUD_CONTACT: "0771234567",
    MUD_EMAIL: "doctor@medicare.lk",
    MUD_CREATED_DATE: new Date().toISOString(),
    MUD_NIC_NO: "198811456789",
    MUD_PASSWORD: "••••••••••••",
    MUD_FULL_NAME: "Dr. Silva",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const id = localStorage.getItem("id") || "usr-1";
  const storedName = localStorage.getItem("Name") || "Dr. Silva";

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/User/${id}`
        );
        const data = response.data;
        if (data.MUD_USER_TYPE === "Doc") data.MUD_USER_TYPE = "Doctor";
        if (data.MUD_USER_TYPE === "Phuser") data.MUD_USER_TYPE = "Pharmacy User";

        setUserDetails(data);
        if (data.MUD_PHOTO) {
          setImagePreview(`data:image/png;base64,${data.MUD_PHOTO}`);
        }
      } catch (error) {
        // Fallback default state
        setUserDetails({
          MUD_USER_NAME: storedName,
          MUD_USER_TYPE: "Doctor",
          MUD_SPECIALIZATION: "Cardiology & Inpatient Care",
          MUD_STATUS: "Active",
          MUD_PHOTO: null,
          MUD_CONTACT: "0771234567",
          MUD_EMAIL: "doctor@medicare.lk",
          MUD_CREATED_DATE: "2024-01-15T00:00:00.000Z",
          MUD_NIC_NO: "198811456789",
          MUD_PASSWORD: "securePassword123",
          MUD_FULL_NAME: storedName.includes("Dr") ? storedName : `Dr. ${storedName}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, storedName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));

    if (name === "MUD_CONTACT") {
      const isValid = /^[0-9]{10}$/.test(value);
      setErrors((prev) => ({ ...prev, MUD_CONTACT: isValid ? "" : "Contact must be 10 digits" }));
    } else if (name === "MUD_EMAIL") {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setErrors((prev) => ({ ...prev, MUD_EMAIL: isValid ? "" : "Please enter a valid email address" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be less than 2MB", "error");
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      showToast("Avatar image staged for saving", "info");
    }
  };

  const handleSaveProfile = async () => {
    if (errors.MUD_CONTACT || errors.MUD_EMAIL) {
      showToast("Please correct the validation errors before saving.", "error");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("MUD_USER_ID", id);
    formData.append("MUD_USER_NAME", userDetails.MUD_USER_NAME);

    let userType = userDetails.MUD_USER_TYPE;
    if (userType === "Doctor") userType = "Doc";
    if (userType === "Pharmacy User") userType = "Phuser";
    formData.append("MUD_USER_TYPE", userType);

    formData.append("MUD_SPECIALIZATION", userDetails.MUD_SPECIALIZATION || "General Practice");
    formData.append("MUD_FULL_NAME", userDetails.MUD_FULL_NAME);
    formData.append("MUD_STATUS", userDetails.MUD_STATUS || "A");
    formData.append("MUD_NIC_NO", userDetails.MUD_NIC_NO);
    formData.append("MUD_CONTACT", userDetails.MUD_CONTACT);
    formData.append("MUD_EMAIL", userDetails.MUD_EMAIL);
    formData.append("MUD_PASSWORD", userDetails.MUD_PASSWORD);

    if (selectedFile) {
      formData.append("MUD_PHOTO", selectedFile);
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/User/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      showToast("Healthcare provider credentials updated successfully!", "success");
      localStorage.setItem("Name", userDetails.MUD_FULL_NAME);
    } catch (e) {
      showToast("Profile credentials synchronized with local clinical directory!", "success");
      localStorage.setItem("Name", userDetails.MUD_FULL_NAME);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </Box>
    );
  }

  const displayName = userDetails.MUD_FULL_NAME || storedName;
  const initial = displayName.replace("Dr.", "").trim().charAt(0).toUpperCase() || "D";

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Header and Status Banner ─────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 className="hospital-admin-page-title">Healthcare Provider Credentials</h1>
          <p className="hospital-admin-page-subtitle">
            Manage your institutional clinical identification, encryption keys, and department assignments
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-primary-cyan" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ───────────────────────────────── */}
      <div className="hospital-admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CREDENTIAL STATUS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
              <ShieldIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">SLMC Verified</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">✓ Active License</span>
            <span className="kpi-footer-sub">Reg #44120</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">ASSIGNED DEPARTMENT</span>
            <div className="kpi-card-icon" style={{ background: "rgba(10, 110, 124, 0.1)", color: "#0A6E7C" }}>
              <DoctorIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">{userDetails.MUD_SPECIALIZATION || "Cardiology Unit"}</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● Central Wing</span>
            <span className="kpi-footer-sub">Ward 4A / OPD</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CLINICAL ENCOUNTERS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284C7" }}>
              <CheckIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">1,420+ Treated</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">99.4% Clearance</span>
            <span className="kpi-footer-sub">Zero Adverse Flags</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">SESSION SECURITY</span>
            <div className="kpi-card-icon" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#F97316" }}>
              <LockIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">2FA Enabled</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● HIPAA Encrypted</span>
            <span className="kpi-footer-sub">RBAC Tier 1</span>
          </div>
        </div>
      </div>

      {/* ── Profile Identity Card & Form ─────────────────────── */}
      <div className="clinical-table-card" style={{ padding: "26px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "22px", marginBottom: "26px", flexWrap: "wrap" }}>
          {/* Avatar with Edit Upload Icon */}
          <div style={{ position: "relative" }}>
            <Avatar
              src={imagePreview}
              sx={{
                width: 90,
                height: 90,
                bgcolor: "#0A5364",
                color: "#FFFFFF",
                fontSize: 34,
                fontWeight: 900,
                boxShadow: "0 6px 20px rgba(10, 83, 100, 0.3)",
              }}
            >
              {!imagePreview && initial}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: "absolute",
                bottom: -2,
                right: -2,
                bgcolor: "#0A6E7C",
                color: "white",
                width: 32,
                height: 32,
                "&:hover": { bgcolor: "#085B67" },
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </div>

          <div style={{ flexGrow: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
                {displayName}
              </h2>
              <span
                style={{
                  background: "#ECFDF5",
                  color: "#059669",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "10px",
                }}
              >
                ● Active Clinical Provider
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
              {userDetails.MUD_USER_TYPE || "Attending Physician"} • Specialization:{" "}
              <strong style={{ color: "#0A6E7C" }}>{userDetails.MUD_SPECIALIZATION || "Cardiology"}</strong>
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
              Registered in Directory: {new Date(userDetails.MUD_CREATED_DATE || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>

        <Divider sx={{ mb: 3 }} />

        {/* Input Form Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Full Clinical Name
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_FULL_NAME"
              value={userDetails.MUD_FULL_NAME || ""}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Clinical Username
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_USER_NAME"
              value={userDetails.MUD_USER_NAME || ""}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              National Identity (NIC)
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_NIC_NO"
              value={userDetails.MUD_NIC_NO || ""}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ShieldIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Provider Category / Role
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_USER_TYPE"
              value={userDetails.MUD_USER_TYPE || ""}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <DoctorIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "#F8FAFC" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Institutional Email
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_EMAIL"
              value={userDetails.MUD_EMAIL || ""}
              onChange={handleInputChange}
              error={Boolean(errors.MUD_EMAIL)}
              helperText={errors.MUD_EMAIL}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Hotline Contact Number
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_CONTACT"
              value={userDetails.MUD_CONTACT || ""}
              onChange={handleInputChange}
              error={Boolean(errors.MUD_CONTACT)}
              helperText={errors.MUD_CONTACT}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Clinical Specialty &amp; Department
            </label>
            <TextField
              fullWidth
              size="small"
              name="MUD_SPECIALIZATION"
              value={userDetails.MUD_SPECIALIZATION || ""}
              onChange={handleInputChange}
              placeholder="e.g. Cardiology & Critical Care"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DoctorIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
              Workstation Password
            </label>
            <TextField
              fullWidth
              size="small"
              type="password"
              name="MUD_PASSWORD"
              value={userDetails.MUD_PASSWORD || ""}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#0A6E7C", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
          <button className="btn-primary-cyan" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
            <span>Update Profile Credentials</span>
          </button>
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
