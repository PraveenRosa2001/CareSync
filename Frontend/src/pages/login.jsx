// CareSync+ Hospital Administration & Clinical Provider Login
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Close,
  Lock,
  Person,
  Email,
  MedicalServices,
  AdminPanelSettings,
  LocalPharmacy,
  LocalHospital,
  Shield,
  CheckCircle,
} from '@mui/icons-material';
import logoSymbol from '../assets/Logo_Original_Symbol.png';
import { ROLES, getDefaultDashboardPath, normalizeRole } from '../utils/roleAccess';



const clearStaffSession = () => {
  ['Token', 'Role', 'Name', 'id'].forEach((key) => localStorage.removeItem(key));
};

export default function Login() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStage, setDialogStage] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);
  const navigate = useNavigate();

  const checkUserExists = async (email) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/User/checkuserexists?email=${email}`);
      return response.data;
    } catch (error) {
      setDialogMessage("The given email is not registered in the hospital directory.");
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/Login/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errText = await response.text();
        setErrorMessage(
          errText.includes("Invalid username")
            ? "Invalid clinical username. Please check your credentials."
            : errText.includes("Invalid password")
            ? "Invalid master password. Please verify and try again."
            : `Authentication failed: ${errText}`
        );
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const userRole = normalizeRole(data.Role || data.role || data.userType);
      const token = data.Token || data.token;

      if (![ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST].includes(userRole)) {
        setErrorMessage("Your account does not have a supported CareSync staff role.");
        return;
      }


      // Replace any legacy/stale session atomically with the newly-issued JWT.
      clearStaffSession();
      localStorage.setItem('Token', token);
      localStorage.setItem('Role', userRole);
      localStorage.setItem('Name', data.Name || data.name || form.username);
      localStorage.setItem('id', data.id || data.userId || '');

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", form.username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
      // Never persist a staff password in localStorage.
      localStorage.removeItem("rememberedPassword");

      navigate(getDefaultDashboardPath(userRole), { replace: true });
    } catch (error) {
      console.error('Staff login failed:', error);
      setErrorMessage(
        "Unable to connect to the CareSync authentication service. Please make sure the backend is running and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const sendOTP = async () => {
    setDialogLoading(true);
    const userExists = await checkUserExists(email);
    if (!userExists) {
      setDialogLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/User/request-password-reset-otp`,
        { Email: email }
      );
      setDialogMessage(response.data?.message || 'OTP sent to your clinical email. Please check your inbox.');
      setDialogStage(2);
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data ||
        "Unable to send the password reset OTP. Please contact the system administrator if the problem continues.";
      setDialogMessage(typeof message === 'string' ? message : "Unable to send the password reset OTP.");
    } finally {
      setDialogLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp || !newPassword) {
      setDialogMessage('Please enter the OTP and a new password.');
      return;
    }

    setDialogLoading(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/User/update-password`, {
        Email: email,
        NewPassword: newPassword,
        Otp: otp,
      });
      setDialogMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        setOpenDialog(false);
        setDialogStage(1);
        setEmail('');
        setOtp('');
        setNewPassword('');
        setDialogMessage('');
      }, 2000);
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data ||
        'Password reset failed. Please verify the OTP and try again.';
      setDialogMessage(typeof message === 'string' ? message : 'Password reset failed. Please try again.');
    } finally {
      setDialogLoading(false);
    }
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setForm((current) => ({ ...current, username: savedUsername }));
      setRememberMe(true);
    }

    // Clean up passwords and fake tokens saved by older builds.
    localStorage.removeItem("rememberedPassword");

    const existingToken = localStorage.getItem("Token");
    if (existingToken === "demo-token-active") {
      clearStaffSession();
    }
  }, []);

  const fillDemoCredentials = (roleType) => {
    if (roleType === "doctor") {
      setForm({ username: "Dr. Silva", password: "doctorpassword123" });
    } else if (roleType === "phuser") {
      setForm({ username: "PharmacistPerera", password: "pharmacypassword123" });
    } else {
      setForm({ username: "AdminTest", password: "adminpassword123" });
    }
  };

  const roleBadges = [
    { id: "doctor", icon: <MedicalServices sx={{ fontSize: 16 }} />, label: "Doctor Demo", color: "#5EEAD4", bg: "rgba(94, 234, 212, 0.12)" },
    { id: "phuser", icon: <LocalPharmacy sx={{ fontSize: 16 }} />, label: "Pharmacy Demo", color: "#A5B4FC", bg: "rgba(165, 180, 252, 0.12)" },
    { id: "admin", icon: <AdminPanelSettings sx={{ fontSize: 16 }} />, label: "Admin Demo", color: "#FDBA74", bg: "rgba(253, 186, 116, 0.12)" },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      bgcolor: '#0F172A',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* ── LEFT PANEL — High-Tech Clinical Brand Showcase ────────── */}
      <Box sx={{
        width: isMobile ? '100%' : '50%',
        minHeight: isMobile ? '38vh' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0A6E7C 100%)",
        p: { xs: 3, md: 6 },
      }}>
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
            background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
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

        <Box sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          maxWidth: 460,
        }}>
          {/* Logo Badge */}
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: "20px",
              // background: "rgba(255,255,255,0.08)",
              // backdropFilter: "blur(12px)",
              // border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // mb: 3,
              // boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <img src={logoSymbol} alt="CareSync Logo" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
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
            Admin Portal
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.6,
              borderRadius: "20px",
              background: "rgba(2, 132, 199, 0.2)",
              border: "1px solid rgba(2, 132, 199, 0.4)",
              color: "#E0F2FE",
              fontSize: "0.8rem",
              fontWeight: 700,
              mb: 3,
            }}
          >
            <Shield sx={{ fontSize: 14, color: "#5EEAD4" }} />
            <span>HIPAA Encrypted v4.2 • JCI Accredited</span>
          </Box>

          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.75)", mb: 4, lineHeight: 1.7, fontSize: "0.95rem" }}>
            Institutional gateway for Attending Physicians, Licensed Pharmacists, and Systems Administrators to govern patient records, telemetry, and dispensary operations.
          </Typography>

          {/* Role Badges — Clickable for Demo Credentials */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", mb: 4 }}>
            {roleBadges.map((r, i) => (
              <Box
                key={i}
                onClick={() => fillDemoCredentials(r.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: "12px",
                  background: r.bg,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    background: "rgba(255,255,255,0.18)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                  },
                }}
              >
                <Box sx={{ color: r.color, display: "flex" }}>
                  {r.icon}
                </Box>
                <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.82rem" }}>
                  {r.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Live Telemetry Pill Bar */}
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
              <span>Directory Sync: Active</span>
            </span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span className="pulse-dot" style={{ backgroundColor: "#5EEAD4" }}></span>
              <span>ICU Telemetry: Live</span>
            </span>
          </Box>
        </Box>
      </Box>

      {/* ── RIGHT PANEL — Provider Login Form Console ───────────── */}
      <Box
        sx={{
          width: isMobile ? '100%' : '50%',
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
            label="HOSPITAL PROVIDER LOGIN"
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
            sx={{ fontWeight: 800, mb: 1, fontSize: { xs: "1.6rem", md: "2.1rem" }, color: "#0F172A", letterSpacing: "-0.02em" }}
          >
            Sign In
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mb: 2.5, fontSize: "0.92rem" }}>
            Enter your clinical administration credentials to access your workspace.
          </Typography>

          {/* Quick Demo Pre-fill Row */}
          <Box sx={{ mb: 3, p: 1.5, background: "#F1F5F9", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
            <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem" }}>
              Quick Fill Demo Credentials:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label="👨‍⚕️ Doctor (Dr. Silva)"
                size="small"
                onClick={() => fillDemoCredentials("doctor")}
                clickable
                sx={{ bgcolor: "#FFFFFF", fontWeight: 700, fontSize: "0.74rem", border: "1px solid #CBD5E1", "&:hover": { bgcolor: "#E0F2FE", color: "#0284C7" } }}
              />
              <Chip
                label="💊 Pharmacy"
                size="small"
                onClick={() => fillDemoCredentials("phuser")}
                clickable
                sx={{ bgcolor: "#FFFFFF", fontWeight: 700, fontSize: "0.74rem", border: "1px solid #CBD5E1", "&:hover": { bgcolor: "#EEF2FF", color: "#4F46E5" } }}
              />
              <Chip
                label="⚙️ SuperAdmin"
                size="small"
                onClick={() => fillDemoCredentials("admin")}
                clickable
                sx={{ bgcolor: "#FFFFFF", fontWeight: 700, fontSize: "0.74rem", border: "1px solid #CBD5E1", "&:hover": { bgcolor: "#FFF7ED", color: "#EA580C" } }}
              />
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="e.g. AdminTest or Doctor username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#0A6E7C" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                }
              }}
            />

            <TextField
              fullWidth
              label="Master Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="Enter password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#0A6E7C" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                }
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: "#0A6E7C",
                      "&.Mui-checked": { color: "#0A6E7C" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.85rem", fontWeight: 600 }}>
                    Remember me
                  </Typography>
                }
              />
              <Button
                onClick={() => setOpenDialog(true)}
                size="small"
                sx={{
                  color: "#0284C7",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  textTransform: "none",
                  "&:hover": { background: "rgba(2, 132, 199, 0.08)" },
                }}
              >
                Forgot password?
              </Button>
            </Box>

            {errorMessage && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
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

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
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
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Clinical Console'}
            </Button>
          </Box>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 5, fontSize: "0.78rem", color: "#94A3B8" }}
          >
            Protected by CareSync+ HIPAA RBAC Security &amp; End-to-End Encryption
          </Typography>
        </Box>
      </Box>

      {/* ── Password Reset Dialog (Step 1 & 2) ────────────────── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{ sx: { borderRadius: "18px", maxWidth: 440, width: "100%" } }}
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
            Provider Password Recovery
          </Typography>
          <IconButton
            onClick={() => {
              setOpenDialog(false);
              setDialogStage(1);
              setDialogMessage('');
            }}
            sx={{ position: 'absolute', right: 12, top: 14, color: "white" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          {dialogStage === 1 && (
            <Box>
              <Typography variant="body2" sx={{ color: "#64748B", mb: 2, fontSize: "0.88rem" }}>
                Enter your registered hospital email address to receive an authentication OTP code.
              </Typography>
              <TextField
                fullWidth
                label="Hospital Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                placeholder="doctor@medicare.lk"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "#0A6E7C" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />

              {dialogMessage && (
                <Alert
                  severity={dialogMessage.toLowerCase().includes('sent') || dialogMessage.toLowerCase().includes('dispatched') ? 'success' : 'error'}
                  sx={{ mt: 2, borderRadius: "10px", fontSize: "0.85rem" }}
                >
                  {dialogMessage}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={sendOTP}
                disabled={dialogLoading || !email}
                sx={{
                  mt: 3,
                  py: 1.4,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {dialogLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Verification OTP'}
              </Button>
            </Box>
          )}

          {dialogStage === 2 && (
            <Box>
              <Typography variant="body2" sx={{ color: "#64748B", mb: 2, fontSize: "0.88rem" }}>
                Enter the OTP code received on your email along with your new password.
              </Typography>
              <TextField
                fullWidth
                label="OTP Verification Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                margin="normal"
                placeholder="Enter 6-digit OTP"
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth
                label="New Master Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                placeholder="Enter strong password"
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />

              {dialogMessage && (
                <Alert
                  severity={dialogMessage.toLowerCase().includes('success') ? 'success' : 'error'}
                  sx={{ mt: 1, borderRadius: "10px", fontSize: "0.85rem" }}
                >
                  {dialogMessage}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={resetPassword}
                disabled={dialogLoading || !otp || !newPassword}
                sx={{
                  mt: 3,
                  py: 1.4,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {dialogLoading ? <CircularProgress size={20} color="inherit" /> : 'Verify OTP & Reset Password'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
