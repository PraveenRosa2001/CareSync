// Patient login - OTP is emailed (via the backend + Gmail) to the address on file for
// the mobile number entered, and verified server-side. The old version kept a copy of
// the generated OTP in React state and compared it locally, which meant anyone could
// bypass the check entirely from devtools without ever seeing the real code - the
// backend now returns no code at all, and VerifyOtp/patient-login-api do the checking.

import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  LocalHospital,
  Shield,
  Person,
  HealthAndSafety,
  CalendarToday,
  MedicalServices,
  Verified,
  VpnKey,
} from "@mui/icons-material";

export default function Patientlogin() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [popupmessage, setPopupmessage] = useState("");
  const [patientdetails, setPatientdetails] = useState([]);
  const [patientlistpopup, setPatientlistpopup] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateContact = (contact) => /^[0-9]{10}$/.test(contact);

  const checkUserExists = async (contact) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/CheckUserExists`,
        { contact }
      );
      return response.status === 200;
    } catch (error) {
      setErrorMessage("User not registered. Please sign up first.");
      return false;
    }
  };

  const sendOtp = async () => {
    if (!validateContact(contact)) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    const userExists = await checkUserExists(contact);
    if (!userExists) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/RequestOtp`,
        { contact }
      );

      setPopupmessage(response.data?.message || "OTP sent to your registered email address");
      setIsOtpSent(true);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithLogin = async () => {
    if (!selectedPatient) {
      setErrorMessage("Please select a user to proceed.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/patient-login-api`,
        { patientcode: selectedPatient.MPD_PATIENT_CODE, contact }
      );

      localStorage.setItem("Token", response.data.Token);
      localStorage.setItem("Email", response.data.Email);
      localStorage.setItem("isLoggedIn", true);
      localStorage.setItem("PatientCode", selectedPatient.MPD_PATIENT_CODE);
      localStorage.setItem("Name", selectedPatient.MPD_PATIENT_NAME);
      localStorage.setItem("Contact", selectedPatient.MPD_MOBILE_NO);
      localStorage.setItem("Role", response.data.Role);

      setErrorMessage("");
      setPatientlistpopup(false);
      navigate("/home");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "An error occurred during login."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/userlists`,
        { contact }
      );

      setPatientdetails(response.data);
      setPopupmessage("Please select your profile to continue");
      setPatientlistpopup(true);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to fetch patient details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Verifies the OTP against the server (instead of a locally-remembered copy),
  // then fetches the patient list once the server confirms it's correct.
  const handleLogin = async () => {
    if (!otp) {
      setErrorMessage("Please enter the OTP sent to your email.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/VerifyOtp`,
        { contact, otp }
      );
      setErrorMessage("");
      await fetchPatientList();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContact("");
    setOtp("");
    setIsOtpSent(false);
    setErrorMessage("");
  };

  const featureHighlights = [
    { icon: <CalendarToday sx={{ fontSize: 16 }} />, label: "Book Appointments", color: "#5EEAD4", bg: "rgba(94, 234, 212, 0.12)" },
    { icon: <MedicalServices sx={{ fontSize: 16 }} />, label: "View Records", color: "#A5B4FC", bg: "rgba(165, 180, 252, 0.12)" },
    { icon: <HealthAndSafety sx={{ fontSize: 16 }} />, label: "Track Health", color: "#FDBA74", bg: "rgba(253, 186, 116, 0.12)" },
  ];

  // Shared input styles matching admin
  const inputSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        bgcolor: "#0F172A",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ── LEFT PANEL — Patient Portal Brand Showcase ────────── */}
      <Box
        sx={{
          width: isMobile ? "100%" : "50%",
          minHeight: isMobile ? "38vh" : "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0A6E7C 100%)",
          p: { xs: 3, md: 6 },
        }}
      >
        {/* Decorative Circles */}
        <Box
          sx={{
            position: "absolute",
            top: "15%",
            right: "-10%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "10%",
            left: "-8%",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(94,234,212,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle Grid Dot Matrix */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "white",
            textAlign: "center",
            maxWidth: 460,
          }}
        >
          {/* Logo Badge */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "20px",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <LocalHospital sx={{ fontSize: 38, color: "#5EEAD4" }} />
          </Box>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 1.5,
              fontSize: { xs: "1.8rem", md: "2.4rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            CareSync
            <Box
              component="sup"
              sx={{ color: "#F97316", fontSize: "1.2rem", fontWeight: 900 }}
            >
              +
            </Box>{" "}
            Patient Portal
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.6,
              borderRadius: "20px",
              background: "rgba(94, 234, 212, 0.15)",
              border: "1px solid rgba(94, 234, 212, 0.3)",
              color: "#E0F2FE",
              fontSize: "0.8rem",
              fontWeight: 700,
              mb: 3,
            }}
          >
            <Shield sx={{ fontSize: 14, color: "#5EEAD4" }} />
            <span>Secure OTP Authentication • HIPAA Protected</span>
          </Box>

          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.75)", mb: 4, lineHeight: 1.7, fontSize: "0.95rem" }}
          >
            Your personal gateway to managing appointments, viewing medical records,
            tracking prescriptions, and staying connected with your healthcare providers — all in one secure portal.
          </Typography>

          {/* Feature Badges */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", mb: 4 }}>
            {featureHighlights.map((f, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: "12px",
                  background: f.bg,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    background: "rgba(255,255,255,0.18)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                  },
                }}
              >
                <Box sx={{ color: f.color, display: "flex" }}>{f.icon}</Box>
                <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.82rem" }}>
                  {f.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Status Bar */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span className="pulse-dot"></span>
              <span>Patient Portal: Online</span>
            </span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span className="pulse-dot" style={{ backgroundColor: "#5EEAD4" }}></span>
              <span>Secure Connection: Active</span>
            </span>
          </Box>

          {/* Sign Up Prompt */}
          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 1.5, fontSize: "0.85rem" }}>
              Don't have an account?
            </Typography>
            <Button
              component={Link}
              to="/addusers"
              variant="outlined"
              sx={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.3)",
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                py: 1,
                fontSize: "0.88rem",
                "&:hover": {
                  borderColor: "#5EEAD4",
                  backgroundColor: "rgba(94, 234, 212, 0.1)",
                },
              }}
            >
              Create Patient Account
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── RIGHT PANEL — Patient Login Form ───────────── */}
      <Box
        sx={{
          width: isMobile ? "100%" : "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          p: { xs: 3, md: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {/* Tag */}
          <Chip
            label="PATIENT PORTAL LOGIN"
            size="small"
            sx={{
              mb: 2,
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              bgcolor: "rgba(10, 110, 124, 0.08)",
              color: "#0A6E7C",
              border: "1px solid rgba(10, 110, 124, 0.2)",
            }}
          />

          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 800,
              mb: 1,
              fontSize: { xs: "1.6rem", md: "2.1rem" },
              color: "#0F172A",
              letterSpacing: "-0.02em",
            }}
          >
            {isOtpSent ? "Verify OTP" : "Patient Sign In"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mb: 3, fontSize: "0.92rem" }}>
            {isOtpSent
              ? "Enter the OTP code sent to your registered email address."
              : "Enter your mobile number — we'll email a one-time code to the address on your patient record."}
          </Typography>

          {/* OTP Sent Success Alert */}
          {isOtpSent && popupmessage && (
            <Alert
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success"
              sx={{
                mb: 2.5,
                borderRadius: "12px",
                bgcolor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {popupmessage}
            </Alert>
          )}

          {/* Mobile Number Input */}
          <TextField
            fullWidth
            label="Mobile Number"
            variant="outlined"
            value={contact}
            inputProps={{ maxLength: 10 }}
            onChange={(e) => setContact(e.target.value)}
            disabled={isOtpSent}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: "#0A6E7C" }} />
                </InputAdornment>
              ),
            }}
            placeholder="Enter 10-digit mobile number"
            sx={inputSx}
          />

          {!isOtpSent ? (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={sendOtp}
              disabled={isLoading}
              sx={{
                py: 1.6,
                fontWeight: 800,
                fontSize: "1rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                boxShadow: "0 6px 20px rgba(10, 110, 124, 0.28)",
                textTransform: "none",
                "&:hover": {
                  boxShadow: "0 8px 25px rgba(10, 110, 124, 0.38)",
                  background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "Send Verification OTP"}
            </Button>
          ) : (
            <Fade in={isOtpSent}>
              <Box>
                <TextField
                  fullWidth
                  label="Enter OTP Code"
                  variant="outlined"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: "#0A6E7C" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleCancel}
                          edge="end"
                          size="small"
                          title="Reset"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx}
                />

                <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleLogin}
                    disabled={isLoading || !otp}
                    endIcon={!isLoading && <ArrowForwardIcon />}
                    sx={{
                      py: 1.5,
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                      boxShadow: "0 6px 20px rgba(10, 110, 124, 0.28)",
                      textTransform: "none",
                      "&:hover": {
                        boxShadow: "0 8px 25px rgba(10, 110, 124, 0.38)",
                        background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                      },
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Verify & Continue"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleCancel}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      fontWeight: 700,
                      borderRadius: "12px",
                      borderColor: "#E2E8F0",
                      color: "#475569",
                      textTransform: "none",
                      minWidth: 120,
                      "&:hover": {
                        borderColor: "#CBD5E1",
                        backgroundColor: "#F8FAFC",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mt: 2.5,
                borderRadius: "12px",
                bgcolor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#DC2626",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 5, fontSize: "0.78rem", color: "#94A3B8" }}
          >
            Protected by CareSync+ HIPAA Security &amp; End-to-End Encryption
          </Typography>
        </Box>
      </Box>

      {/* ── Patient Selection Dialog ────────────────── */}
      <Dialog
        open={patientlistpopup}
        onClose={() => setPatientlistpopup(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
            color: "white",
            pr: 6,
            py: 2.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Select Your Profile
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", mt: 0.5 }}>
            {popupmessage}
          </Typography>
          <IconButton
            onClick={() => setPatientlistpopup(false)}
            sx={{ position: "absolute", right: 12, top: 14, color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 2 }}>
          {patientdetails.length > 0 ? (
            <Box>
              {patientdetails.map((patientDetail, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    m: 1,
                    cursor: "pointer",
                    borderRadius: "14px",
                    borderColor:
                      selectedPatient === patientDetail
                        ? "#0284C7"
                        : "#E2E8F0",
                    boxShadow:
                      selectedPatient === patientDetail
                        ? "0 0 0 2px #0284C7, 0 4px 12px rgba(2, 132, 199, 0.15)"
                        : "none",
                    background:
                      selectedPatient === patientDetail
                        ? "#F0F9FF"
                        : "#FFFFFF",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "#0284C7",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    },
                  }}
                  onClick={() => setSelectedPatient(patientDetail)}
                >
                  <CardContent sx={{ py: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedPatient === patientDetail}
                          onChange={() =>
                            setSelectedPatient(
                              selectedPatient === patientDetail
                                ? null
                                : patientDetail
                            )
                          }
                          sx={{
                            color: "#0A6E7C",
                            "&.Mui-checked": { color: "#0284C7" },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                            {patientDetail.MPD_PATIENT_NAME}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#64748B" }}>
                            {patientDetail.MPD_MOBILE_NO}
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ p: 3, color: "#64748B" }}>
              No patient records found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setPatientlistpopup(false)}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              borderColor: "#E2E8F0",
              color: "#475569",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={proceedWithLogin}
            variant="contained"
            disabled={!selectedPatient || isLoading}
            sx={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
              },
            }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : "Proceed to Portal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
