// profile.jsx - Redesigned Patient Profile & Appointments Page matching modern CareSync+ design

import React, { useEffect, useState } from "react";
import axios from "axios";
import PatientNavbar from "../components/PatientNavbar";
import PatientAppointment from "../components/patientappoinment";

import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Chip,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  PhotoCamera,
  Verified,
  Shield,
  Close,
  ExpandMore,
  ExpandLess,
  EventAvailable,
} from "@mui/icons-material";
import profile_bg from "../assets/doctor_consultation.jpg";
import medicare_modern_bg from "../assets/medicare_modern_bg.jpg";

export default function Profile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [userAppointments, setUserAppointments] = useState([]);
  const [displayedAppointments, setDisplayedAppointments] = useState([]);
  const email1 = localStorage.getItem("Email");
  const patientid = localStorage.getItem("PatientCode") || "PA-001";

  const [profiledata, setProfiledata] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});
  const [originalProfile, setOriginalProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [emailerror, setEmailerror] = useState("");
  const [mobilerror, setMobilerror] = useState("");
  const [nicerror, setNicerror] = useState("");
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appointmentPopup, setAppointmentPopup] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleToggleAppointments = () => {
    if (showAllAppointments) {
      setDisplayedAppointments(userAppointments.slice(0, 5));
    } else {
      setDisplayedAppointments(userAppointments);
    }
    setShowAllAppointments(!showAllAppointments);
  };

  const fetchAppointmentDetails = async () => {
    if (email1 || patientid) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/Appointment/getappointment/patientcode?patientcode=${patientid}`
        );
        const data = response.data || [];
        setUserAppointments(data);
        setDisplayedAppointments(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching appointment details:", error);
      }
    }
  };

  const fetchProfileDetails = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/Patient/patient/findbyid?patientcode=${patientid}`
      );
      setProfiledata(response.data || {});
      setUpdatedProfile(response.data || {});
      setOriginalProfile(response.data || {});

      if (response.data && response.data.MPD_PHOTO) {
        setImagePreview(`data:image/jpeg;base64,${response.data.MPD_PHOTO}`);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      showSnackbar("Failed to load profile details", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile({ ...updatedProfile, [name]: value });

    if (name === "MPD_EMAIL") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        setEmailerror("Please enter a valid email address.");
      } else {
        setEmailerror("");
      }
    }

    if (name === "MPD_MOBILE_NO") {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(value)) {
        setMobilerror("Please enter a valid 10-digit mobile number.");
      } else {
        setMobilerror("");
      }
    }

    if (name === "MPD_NIC_NO") {
      if (value.length !== 10 && value.length !== 12) {
        setNicerror("NIC must be 10 or 12 characters long.");
      } else {
        setNicerror("");
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showSnackbar("Image size should be less than 2MB", "error");
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (emailerror || mobilerror || nicerror) {
      showSnackbar("Please correct the errors before saving", "error");
      return;
    }

    const formData = new FormData();
    Object.keys(updatedProfile).forEach((key) => {
      if (updatedProfile[key] !== null && updatedProfile[key] !== undefined) {
        formData.append(key, updatedProfile[key]);
      }
    });

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      setSaving(true);
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/Patient/${updatedProfile.MPD_PATIENT_CODE}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setProfiledata(updatedProfile);
      setOriginalProfile(updatedProfile);
      if (updatedProfile.MPD_PATIENT_NAME) {
        localStorage.setItem("Name", updatedProfile.MPD_PATIENT_NAME);
      }
      showSnackbar("Profile updated successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setUpdatedProfile(originalProfile);
    setImagePreview(
      originalProfile.MPD_PHOTO
        ? `data:image/jpeg;base64,${originalProfile.MPD_PHOTO}`
        : null
    );
    setProfileImage(null);
    setEmailerror("");
    setMobilerror("");
    setNicerror("");
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
    fetchProfileDetails();
  }, [email1, patientid]);

  const completedAppointments = userAppointments.filter(
    (a) => a.TreatmentStatus === "Completed"
  ).length;
  const pendingAppointments = userAppointments.filter(
    (a) => a.TreatmentStatus !== "Completed"
  ).length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), url(${medicare_modern_bg})`,
        backgroundSize: "100% auto",
        backgroundRepeat: "repeat",
        backgroundPosition: "top center",
        backgroundAttachment: "scroll",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. CENTERED PATIENT NAVBAR
      ───────────────────────────────────────────────────────────── */}
      <PatientNavbar
        activePage="profile"
        onBookAppointment={() => setAppointmentPopup(true)}
        breadcrumbSubtitle="Patient Profile & Appointments"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. FULL WIDTH PROFILE HERO BANNER
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: "340px", md: "380px" },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          mb: 4,
        }}
      >
        {/* Background Image */}
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box
            component="img"
            src={profile_bg}
            alt="Profile Background"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
        {/* Gradient Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(10, 110, 124, 0.95) 0%, rgba(2, 132, 199, 0.85) 100%)",
            zIndex: 1,
            backdropFilter: "blur(4px)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 3, pb: { xs: 6, md: 8 }, pt: { xs: 12, md: 14 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 3,
              color: "#FFFFFF",
            }}
          >
            {/* Avatar + Basic Details */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "center", md: "flex-end" },
                gap: 3,
                textAlign: { xs: "center", md: "left" },
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={imagePreview}
                  alt={profiledata.MPD_PATIENT_NAME}
                  sx={{
                    width: { xs: 110, md: 130 },
                    height: { xs: 110, md: 130 },
                    bgcolor: "#0284C7",
                    fontSize: "2.8rem",
                    fontWeight: 800,
                    border: "4px solid #FFFFFF",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",
                  }}
                >
                  {!imagePreview && (
                    (profiledata.MPD_PATIENT_NAME
                      ? profiledata.MPD_PATIENT_NAME.slice(0, 2).toUpperCase()
                      : "PT")
                  )}
                </Avatar>

                {isEditing && (
                  <Box sx={{ position: "absolute", bottom: 4, right: 4 }}>
                    <input
                      accept="image/*"
                      id="profileImageUpload"
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                    />
                    <label htmlFor="profileImageUpload">
                      <IconButton
                        component="span"
                        sx={{
                          bgcolor: "#0A6E7C",
                          color: "#FFFFFF",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          "&:hover": { bgcolor: "#085B67" },
                        }}
                      >
                        <PhotoCamera sx={{ fontSize: 18 }} />
                      </IconButton>
                    </label>
                  </Box>
                )}
              </Box>

              <Box sx={{ pb: { md: 1 } }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "20px",
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "11px",
                    mb: 1.2,
                  }}
                >
                  <Verified sx={{ fontSize: 14, color: "#5EEAD4" }} />
                  <span>Verified Patient Account</span>
                </Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ fontWeight: 800, fontSize: { xs: "2rem", md: "2.5rem" }, color: "#FFFFFF", mb: 1, lineHeight: 1.1, letterSpacing: "-0.02em" }}
                >
                  {profiledata.MPD_PATIENT_NAME || "Patient Profile"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Chip
                    label={`Patient ID: ${patientid}`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "11px",
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  />
                  <Chip
                    label="Active Patient"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "11px",
                      bgcolor: "rgba(16, 185, 129, 0.2)",
                      color: "#A7F3D0",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, pb: { md: 1.5 } }}>
              {isEditing ? (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    startIcon={<CancelIcon />}
                    sx={{
                      borderRadius: "14px",
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      borderColor: "rgba(255,255,255,0.4)",
                      px: 2.5,
                      py: 1,
                      "&:hover": { borderColor: "#FFFFFF", bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !!(emailerror || mobilerror || nicerror)}
                    startIcon={
                      saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                    }
                    sx={{
                      background: "#FFFFFF",
                      color: "#0A6E7C",
                      borderRadius: "14px",
                      textTransform: "none",
                      fontWeight: 800,
                      px: 3,
                      py: 1,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      "&:hover": { background: "#F0FDFA" },
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(true)}
                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: "14px",
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      borderColor: "rgba(255,255,255,0.4)",
                      px: 2.5,
                      py: 1,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "#FFFFFF" },
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setAppointmentPopup(true)}
                    startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      background: "#FFFFFF",
                      color: "#0A6E7C",
                      borderRadius: "14px",
                      textTransform: "none",
                      fontWeight: 800,
                      px: 3,
                      py: 1,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      "&:hover": { background: "#F0FDFA" },
                    }}
                  >
                    Book Visit
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ flexGrow: 1, pb: 4, mt: { xs: -5, md: -8 }, position: "relative", zIndex: 4 }}>
        {/* Quick Stats Pills */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "rgba(248, 250, 252, 0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "10px",
                      bgcolor: "#E0F2FE",
                      color: "#0284C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CalendarIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                      {userAppointments.length}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                      Total Scheduled Visits
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "rgba(248, 250, 252, 0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "10px",
                      bgcolor: "#ECFDF5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                      {completedAppointments}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                      Completed Consultations
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "rgba(248, 250, 252, 0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "10px",
                      bgcolor: "#FFFBEB",
                      color: "#D97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TimeIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                      {pendingAppointments}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                      Pending / Upcoming
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

        {/* ─────────────────────────────────────────────────────────────
            3. PERSONAL INFORMATION SECTION (MODERN TILES / INPUTS)
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: "20px",
            border: "1px solid rgba(226, 232, 240, 0.4)",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(12px)",
            mb: 4,
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.03)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.2rem" }}
              >
                Personal & Contact Details
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.85rem" }}>
                Official patient identification and communication channels.
              </Typography>
            </Box>

            {!isEditing && (
              <Button
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                onClick={() => setIsEditing(true)}
                sx={{ textTransform: "none", fontWeight: 700, color: "#0284C7" }}
              >
                Modify
              </Button>
            )}
          </Box>

          {isEditing ? (
            /* Edit Mode with Modern Outlined TextFields */
            <form onSubmit={handleSave}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Legal Name"
                    name="MPD_PATIENT_NAME"
                    value={updatedProfile?.MPD_PATIENT_NAME || ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: "#0284C7" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="MPD_EMAIL"
                    value={updatedProfile?.MPD_EMAIL || ""}
                    onChange={handleInputChange}
                    error={!!emailerror}
                    helperText={emailerror}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: "#0284C7" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mobile Contact Number"
                    name="MPD_MOBILE_NO"
                    value={updatedProfile?.MPD_MOBILE_NO || ""}
                    onChange={handleInputChange}
                    error={!!mobilerror}
                    helperText={mobilerror}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: "#0284C7" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="National ID (NIC)"
                    name="MPD_NIC_NO"
                    value={updatedProfile?.MPD_NIC_NO || ""}
                    onChange={handleInputChange}
                    error={!!nicerror}
                    helperText={nicerror}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: "#0284C7" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Residential Address"
                    name="MPD_ADDRESS"
                    value={updatedProfile?.MPD_ADDRESS || ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeIcon sx={{ color: "#0284C7" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || !!(emailerror || mobilerror || nicerror)}
                  sx={{
                    background: "linear-gradient(135deg, #0A6E7C, #0284C7)",
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                  }}
                >
                  {saving ? "Saving..." : "Save Details"}
                </Button>
              </Box>
            </form>
          ) : (
            /* View Mode with Clean, Sleek Information Tiles */
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "14px",
bgcolor: "rgba(248, 250, 252, 0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "#E0F2FE",
                        color: "#0284C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 700 }}>
                      FULL NAME
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", pl: 0.5 }}>
                    {profiledata.MPD_PATIENT_NAME || "Not available"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "14px",
bgcolor: "rgba(248, 250, 252, 0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "#E0E7FF",
                        color: "#4F46E5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <EmailIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 700 }}>
                      EMAIL ADDRESS
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", pl: 0.5 }}>
                    {profiledata.MPD_EMAIL || "Not available"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "14px",
bgcolor: "rgba(248, 250, 252, 0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "#ECFDF5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 700 }}>
                      MOBILE NUMBER
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", pl: 0.5 }}>
                    {profiledata.MPD_MOBILE_NO || "Not available"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "14px",
bgcolor: "rgba(248, 250, 252, 0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "#F3E8FF",
                        color: "#9333EA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BadgeIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 700 }}>
                      NATIONAL ID (NIC)
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", pl: 0.5 }}>
                    {profiledata.MPD_NIC_NO || "Not available"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={8}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "14px",
bgcolor: "rgba(248, 250, 252, 0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(226, 232, 240, 0.4)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "#FEF3C7",
                        color: "#D97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <HomeIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 700 }}>
                      RESIDENTIAL ADDRESS
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", pl: 0.5 }}>
                    {profiledata.MPD_ADDRESS || "Not available"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            4. APPOINTMENTS SCHEDULE SECTION
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: "20px",
            border: "1px solid rgba(226, 232, 240, 0.4)",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.03)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.2rem" }}
              >
                My Scheduled Appointments
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.85rem" }}>
                Keep track of upcoming and completed consultations with your physicians.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {userAppointments.length > 5 && (
                <Button
                  onClick={handleToggleAppointments}
                  endIcon={showAllAppointments ? <ExpandLess /> : <ExpandMore />}
                  size="small"
                  sx={{ textTransform: "none", fontWeight: 700, color: "#0284C7" }}
                >
                  {showAllAppointments ? "Show Less" : "Show All"}
                </Button>
              )}

              <Button
                variant="contained"
                size="small"
                onClick={() => setAppointmentPopup(true)}
                startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
                sx={{
                  background: "linear-gradient(135deg, #0A6E7C, #0284C7)",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  px: 2,
                  py: 0.8,
                }}
              >
                Book Appointment
              </Button>
            </Box>
          </Box>

          {displayedAppointments.length > 0 ? (
            <TableContainer
              sx={{
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: "rgba(248, 250, 252, 0.5)", borderBottom: "2px solid rgba(226, 232, 240, 0.5)" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>
                      DOCTOR
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>
                      DATE
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>
                          DOCTOR SCHEDULE
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>
                          ALLOCATED TIME
                        </TableCell>
                      </>
                    )}
                    <TableCell align="center" sx={{ fontWeight: 800, color: "#334155", fontSize: "12px" }}>
                      STATUS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedAppointments.map((appointment, index) => {
                    const isCompleted = appointment.TreatmentStatus === "Completed";
                    return (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          "&:hover": { bgcolor: "#F0F9FF" },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: "#E0F2FE",
                                color: "#0369A1",
                                fontSize: "13px",
                                fontWeight: 800,
                              }}
                            >
                              {appointment.MAD_DOCTOR ? appointment.MAD_DOCTOR.charAt(0) : "D"}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: "13.5px", color: "#0F172A" }}>
                                Dr. {appointment.MAD_DOCTOR}
                              </Typography>
                              <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                                Specialist Consultant
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.8,
                              px: 1.5,
                              py: 0.4,
                              borderRadius: "8px",
                              bgcolor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <CalendarIcon sx={{ fontSize: 14, color: "#0284C7" }} />
                            <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                              {formatDate(appointment.MAD_APPOINMENT_DATE)}
                            </Typography>
                          </Box>
                        </TableCell>

                        {!isMobile && (
                          <>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <TimeIcon sx={{ fontSize: 15, color: "#64748B" }} />
                                <Typography sx={{ fontSize: "13px", color: "#334155" }}>
                                  {formatTime(appointment.MAD_START_TIME)} - {formatTime(appointment.MAD_END_TIME)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <TimeIcon sx={{ fontSize: 15, color: "#0284C7" }} />
                                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#0284C7" }}>
                                  {formatTime(appointment.MAD_ALLOCATED_TIME)}
                                </Typography>
                              </Box>
                            </TableCell>
                          </>
                        )}

                        <TableCell align="center">
                          <Chip
                            icon={
                              isCompleted ? (
                                <CheckCircleIcon sx={{ fontSize: "14px !important", color: "#059669 !important" }} />
                              ) : (
                                <TimeIcon sx={{ fontSize: "14px !important", color: "#D97706 !important" }} />
                              )
                            }
                            label={appointment.TreatmentStatus || "Pending"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "11.5px",
                              bgcolor: isCompleted ? "#ECFDF5" : "#FFFBEB",
                              color: isCompleted ? "#059669" : "#D97706",
                              border: `1px solid ${isCompleted ? "#A7F3D0" : "#FDE68A"}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                p: 5,
                textAlign: "center",
                bgcolor: "rgba(248, 250, 252, 0.6)",
                backdropFilter: "blur(8px)",
                borderRadius: "14px",
                border: "1px dashed rgba(203, 213, 225, 0.6)",
              }}
            >
              <EventAvailable sx={{ fontSize: 44, color: "#94A3B8", mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                No appointments found
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#64748B", mb: 2 }}>
                You don't have any appointments scheduled currently.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setAppointmentPopup(true)}
                sx={{
                  background: "linear-gradient(135deg, #0A6E7C, #0284C7)",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Book Your First Visit
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          5. APPOINTMENT BOOKING MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        open={appointmentPopup}
        onClose={() => setAppointmentPopup(false)}
        aria-labelledby="appointment-modal-title"
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Fade in={appointmentPopup} timeout={300}>
          <Paper
            elevation={12}
            sx={{
              position: "relative",
              width: { xs: "96%", sm: "88%", md: "75%", lg: "65%" },
              maxWidth: "920px",
              maxHeight: { xs: "95vh", md: "90vh" },
              overflow: "hidden",
              borderRadius: "20px",
              background: "#FFFFFF",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
              p: 0,
              outline: "none",
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                color: "white",
                px: { xs: 2.5, md: 3.5 },
                py: 2.2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.15rem" }}>
                  Schedule Doctor Consultation
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.82rem" }}>
                  Select your preferred doctor, appointment date and available timeslot
                </Typography>
              </Box>
              <IconButton
                onClick={() => setAppointmentPopup(false)}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { background: "rgba(255,255,255,0.25)" },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            <Box
              sx={{
                height: { xs: "70vh", md: "68vh" },
                overflowY: "auto",
                p: { xs: 2, sm: 3, md: 4 },
                background: "#F8FAFC",
              }}
            >
              <PatientAppointment />
            </Box>
          </Paper>
        </Fade>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          6. SNACKBAR NOTIFICATIONS
      ───────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 600 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          mt: "auto",
          py: 2.5,
          px: { xs: 2, md: 4 },
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          fontSize: "12px",
          color: "#64748B",
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: "12px", color: "#64748B" }}>
          CareSync+ Core v4.2.1 • Patient Portal Console
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
            <Shield sx={{ fontSize: 15, color: "#0A6E7C" }} />
            <span style={{ fontWeight: 600 }}>HIPAA Certified</span>
          </Box>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
            <Verified sx={{ fontSize: 15, color: "#0284C7" }} />
            <span style={{ fontWeight: 600 }}>JCI Accredited</span>
          </Box>
          <Typography component="span" sx={{ fontSize: "12px" }}>
            © {new Date().getFullYear()} CareSync+ Health Systems.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}