import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Home,
  Badge,
  Cake,
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  LocalHospital,
  Shield,
  ArrowForward,
  CalendarToday,
  MedicalServices,
  HealthAndSafety,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

export default function UserRegistration() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    MPD_PATIENT_NAME: "",
    MPD_MOBILE_NO: "",
    MPD_EMAIL: "",
    MPD_PASSWORD: "",
    MPD_NIC_NO: "",
    MPD_ADDRESS: "",
    MPD_BIRTHDAY: "",
  });

  const [formErrors, setFormErrors] = useState({
    name: false,
    email: false,
    contact: false,
    nic: false,
    password: false,
    birthdate: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const validateContactNumber = (contact) => {
    const contactPattern = /^[0-9]{10}$/;
    return contactPattern.test(contact);
  };

  const validateNIC = (nic) => {
    if (!nic || nic.trim() === "") return true;
    const nicPattern = /^[0-9]{9}[vV]$|^[0-9]{12}$/;
    return nicPattern.test(nic);
  };

  const validatePassword = (password) => {
    return password && password.length >= 6;
  };

  const validateBirthdate = (date) => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "MPD_PATIENT_NAME") {
      setFormErrors((prev) => ({ ...prev, name: value.trim() === "" }));
    }
    if (name === "MPD_EMAIL") {
      setFormErrors((prev) => ({
        ...prev,
        email: value.trim() !== "" && !validateEmail(value),
      }));
    }
    if (name === "MPD_MOBILE_NO") {
      setFormErrors((prev) => ({
        ...prev,
        contact: value.trim() !== "" && !validateContactNumber(value),
      }));
    }
    if (name === "MPD_PASSWORD") {
      setFormErrors((prev) => ({
        ...prev,
        password: value.trim() !== "" && !validatePassword(value),
      }));
    }
    if (name === "MPD_NIC_NO") {
      setFormErrors((prev) => ({
        ...prev,
        nic: value.trim() !== "" && !validateNIC(value),
      }));
    }
    if (name === "MPD_BIRTHDAY") {
      setFormErrors((prev) => ({
        ...prev,
        birthdate: value.trim() !== "" && !validateBirthdate(value),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      name: !formData.MPD_PATIENT_NAME.trim(),
      email: !formData.MPD_EMAIL.trim() || !validateEmail(formData.MPD_EMAIL),
      contact:
        !formData.MPD_MOBILE_NO.trim() ||
        !validateContactNumber(formData.MPD_MOBILE_NO),
      nic: !validateNIC(formData.MPD_NIC_NO),
      password: !validatePassword(formData.MPD_PASSWORD),
      birthdate: !validateBirthdate(formData.MPD_BIRTHDAY),
    };

    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) {
      setErrorMessage(
        "Please complete all required fields correctly before submitting.",
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/Patient/patient-registration`,
        formData,
      );

      setSuccessMessage(
        response.data?.message ||
          "Patient account registered successfully! Redirecting to sign in...",
      );
      setFormData({
        MPD_EMAIL: "",
        MPD_NIC_NO: "",
        MPD_MOBILE_NO: "",
        MPD_ADDRESS: "",
        MPD_PASSWORD: "",
        MPD_PATIENT_NAME: "",
        MPD_BIRTHDAY: "",
      });

      setTimeout(() => {
        navigate("/patient-login");
      }, 2000);
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to register account. Please check your details and try again.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      MPD_EMAIL: "",
      MPD_NIC_NO: "",
      MPD_MOBILE_NO: "",
      MPD_ADDRESS: "",
      MPD_PASSWORD: "",
      MPD_PATIENT_NAME: "",
      MPD_BIRTHDAY: "",
    });
    setFormErrors({
      name: false,
      email: false,
      contact: false,
      nic: false,
      password: false,
      birthdate: false,
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const featureHighlights = [
    {
      icon: <CalendarToday sx={{ fontSize: 16 }} />,
      label: "Instant Appointments",
      color: "#5EEAD4",
      bg: "rgba(94, 234, 212, 0.12)",
    },
    {
      icon: <MedicalServices sx={{ fontSize: 16 }} />,
      label: "Digital Records",
      color: "#A5B4FC",
      bg: "rgba(165, 180, 252, 0.12)",
    },
    {
      icon: <HealthAndSafety sx={{ fontSize: 16 }} />,
      label: "HIPAA Protected",
      color: "#FDBA74",
      bg: "rgba(253, 186, 116, 0.12)",
    },
  ];

  const inputSx = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      width: "100%",
      borderRadius: "12px",
      backgroundColor: "#F8FAFC",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#FFFFFF",
      },
      "&.Mui-focused": {
        backgroundColor: "#FFFFFF",
        "& fieldset": {
          borderColor: "#0A6E7C",
          borderWidth: "2px",
        },
      },
    },
    "& .MuiInputBase-root": {
      width: "100%",
    },
    "& .MuiInputBase-input": {
      width: "100%",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#0A6E7C",
      fontWeight: 700,
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
          width: isMobile ? "100%" : "44%",
          minHeight: isMobile ? "auto" : "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
          background:
            "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0A6E7C 100%)",
          p: { xs: 4, md: 6 },
        }}
      >
        {/* Decorative Circles */}
        <Box
          sx={{
            position: "absolute",
            top: "12%",
            right: "-10%",
            width: 340,
            height: 340,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "8%",
            left: "-8%",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(94,234,212,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle Grid Dot Matrix */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
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
              fontSize: { xs: "1.8rem", md: "2.3rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Join CareSync
            <Box
              component="sup"
              sx={{ color: "#F97316", fontSize: "1.2rem", fontWeight: 900 }}
            >
              +
            </Box>
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
            <span>Fast Registration • HIPAA Protected Portal</span>
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: "rgba(255,255,255,0.75)",
              mb: 4,
              lineHeight: 1.7,
              fontSize: "0.95rem",
            }}
          >
            Create your digital patient profile to connect with leading
            specialists, schedule appointments, access laboratory reports, and
            manage prescriptions securely online.
          </Typography>

          {/* Feature Badges */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              justifyContent: "center",
              mb: 4,
            }}
          >
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                  }}
                >
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
              <span
                className="pulse-dot"
                style={{ backgroundColor: "#5EEAD4" }}
              ></span>
              <span>SSL 256-Bit: Active</span>
            </span>
          </Box>

          {/* Sign In Prompt */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              width: "100%",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.6)",
                mb: 1.5,
                fontSize: "0.85rem",
              }}
            >
              Already have an account?
            </Typography>
            <Button
              component={Link}
              to="/patient-login"
              variant="outlined"
              sx={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.3)",
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
                px: 3.5,
                py: 1,
                fontSize: "0.88rem",
                "&:hover": {
                  borderColor: "#5EEAD4",
                  backgroundColor: "rgba(94, 234, 212, 0.1)",
                },
              }}
            >
              Sign In to Patient Portal
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── RIGHT PANEL — Patient Registration Form ───────────── */}
      <Box
        sx={{
          width: isMobile ? "100%" : "56%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          p: { xs: 3, sm: 4, md: 6 },
          overflowY: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 580 }}>
          {/* Tag */}
          <Chip
            label="PATIENT REGISTRATION"
            size="small"
            sx={{
              mb: 1.5,
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
            Create Your Account
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748B", mb: 3.5, fontSize: "0.92rem" }}
          >
            Fill in your details below to activate your digital patient portal
          </Typography>

          {/* Success Alert */}
          {successMessage && (
            <Fade in={!!successMessage}>
              <Alert
                icon={<CheckCircle fontSize="inherit" />}
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  bgcolor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "#065F46",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                }}
              >
                {successMessage}
              </Alert>
            </Fade>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <Fade in={!!errorMessage}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  bgcolor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#DC2626",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                }}
              >
                {errorMessage}
              </Alert>
            </Fade>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2.5,
                width: "100%",
              }}
            >
              {/* Full Name */}
              <TextField
                fullWidth
                label="Full Name"
                name="MPD_PATIENT_NAME"
                value={formData.MPD_PATIENT_NAME}
                onChange={handleChange}
                required
                placeholder="e.g. John Doe"
                error={formErrors.name}
                helperText={formErrors.name ? "Full name is required" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person
                        sx={{
                          color: formErrors.name ? "#DC2626" : "#0A6E7C",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Contact / Mobile Number */}
              <TextField
                fullWidth
                label="Contact Number"
                name="MPD_MOBILE_NO"
                value={formData.MPD_MOBILE_NO}
                onChange={handleChange}
                required
                placeholder="10-digit number (e.g. 0771234567)"
                inputProps={{ maxLength: 10 }}
                error={formErrors.contact}
                helperText={
                  formErrors.contact ? "10-digit mobile number required" : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone
                        sx={{
                          color: formErrors.contact ? "#DC2626" : "#0A6E7C",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Email Address */}
              <TextField
                fullWidth
                label="Email Address"
                name="MPD_EMAIL"
                type="email"
                value={formData.MPD_EMAIL}
                onChange={handleChange}
                required
                placeholder="name@example.com"
                error={formErrors.email}
                helperText={
                  formErrors.email ? "Valid email address required" : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email
                        sx={{
                          color: formErrors.email ? "#DC2626" : "#0A6E7C",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* NIC Number */}
              <TextField
                fullWidth
                label="NIC Number (Optional)"
                name="MPD_NIC_NO"
                value={formData.MPD_NIC_NO}
                onChange={handleChange}
                placeholder="9 digits + V or 12 digits"
                error={formErrors.nic}
                helperText={
                  formErrors.nic
                    ? "Invalid NIC (9 digits + V or 12 digits)"
                    : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge
                        sx={{
                          color: formErrors.nic ? "#DC2626" : "#0A6E7C",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Address */}
              <TextField
                fullWidth
                label="Residential Address"
                name="MPD_ADDRESS"
                value={formData.MPD_ADDRESS}
                onChange={handleChange}
                placeholder="e.g. 123 Main St, Colombo"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home sx={{ color: "#0A6E7C" }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Birthdate */}
              <TextField
                fullWidth
                label="Date of Birth"
                name="MPD_BIRTHDAY"
                type="date"
                value={formData.MPD_BIRTHDAY}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={formErrors.birthdate}
                helperText={
                  formErrors.birthdate ? "Birthdate cannot be in future" : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake
                        sx={{
                          color: formErrors.birthdate ? "#DC2626" : "#0A6E7C",
                        }}
                      />
                    </InputAdornment>
                  ),
                  inputProps: {
                    max: new Date().toISOString().split("T")[0],
                  },
                }}
                sx={inputSx}
              />

              {/* Password */}
              <TextField
                fullWidth
                label="Password"
                name="MPD_PASSWORD"
                type={showPassword ? "text" : "password"}
                value={formData.MPD_PASSWORD}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
                error={formErrors.password}
                helperText={
                  formErrors.password ? "Minimum 6 characters required" : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock
                        sx={{
                          color: formErrors.password ? "#DC2626" : "#0A6E7C",
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ color: "#64748B" }} />
                        ) : (
                          <Visibility sx={{ color: "#64748B" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                mt: 3,
                display: "flex",
                gap: 1.5,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isLoading}
                endIcon={!isLoading && <ArrowForward />}
                sx={{
                  py: 1.6,
                  fontWeight: 800,
                  fontSize: "1rem",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                  boxShadow: "0 6px 20px rgba(10, 110, 124, 0.28)",
                  textTransform: "none",
                  "&:hover": {
                    boxShadow: "0 8px 25px rgba(10, 110, 124, 0.38)",
                    background:
                      "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Complete Registration"
                )}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={handleReset}
                disabled={isLoading}
                startIcon={<RefreshIcon />}
                sx={{
                  py: 1.6,
                  px: 3,
                  fontWeight: 700,
                  borderRadius: "12px",
                  borderColor: "#E2E8F0",
                  color: "#475569",
                  textTransform: "none",
                  minWidth: { sm: 130 },
                  "&:hover": {
                    borderColor: "#CBD5E1",
                    backgroundColor: "#F8FAFC",
                  },
                }}
              >
                Reset
              </Button>
            </Box>
          </form>

          {/* Quick Sign In Prompt */}
          <Box
            sx={{
              mt: 3.5,
              pt: 2.5,
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#64748B", fontSize: "0.88rem" }}
            >
              Already registered?
            </Typography>
            <Link
              to="/patient-login"
              style={{
                color: "#0A6E7C",
                fontWeight: 700,
                fontSize: "0.88rem",
                textDecoration: "none",
              }}
            >
              Sign in to Patient Portal
            </Link>
          </Box>

          {/* Footer Security Note */}
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 3, fontSize: "0.78rem", color: "#94A3B8" }}
          >
            Protected by CareSync+ HIPAA Security &amp; End-to-End Encryption
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
