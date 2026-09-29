import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  Container,
  Paper,
  Fade,
  Grow,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  MedicalServices,
  People,
  CalendarToday,
  Medication,
  Receipt,
  HealthAndSafety,
  LocalHospital,
  ArrowForward,
  Shield,
  AdminPanelSettings,
  Person,
  CheckCircle,
  Phone,
  ExpandMore,
  Verified,
  Speed,
  Favorite,
} from "@mui/icons-material";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

import medicalVideo from "../assets/medical-bg.mp4";
import hospitalBg from "../assets/hospital_background.jpg";

// ── Services & Clinical Features Data ────────────────────────
const features = [
  {
    icon: <MedicalServices sx={{ fontSize: 32 }} />,
    title: "Expert Doctors & Specialists",
    description:
      "Access board-certified physicians, surgeons, and healthcare consultants across diverse clinical specialties.",
    gradient: "linear-gradient(135deg, #0284C7, #0A6E7C)",
    accentColor: "#5EEAD4",
  },
  {
    icon: <CalendarToday sx={{ fontSize: 32 }} />,
    title: "Instant Appointment Booking",
    description:
      "Select your preferred specialist and time slot with instant digital confirmation and automated reminders.",
    gradient: "linear-gradient(135deg, #5EEAD4, #0A6E7C)",
    accentColor: "#5EEAD4",
  },
  {
    icon: <Medication sx={{ fontSize: 32 }} />,
    title: "Digital Prescriptions & Pharmacy",
    description:
      "Receive e-prescriptions straight to your phone and collect medications directly from hospital pharmacy dispensing.",
    gradient: "linear-gradient(135deg, #A5B4FC, #6366F1)",
    accentColor: "#A5B4FC",
  },
  {
    icon: <Receipt sx={{ fontSize: 32 }} />,
    title: "Complete Digital Medical Records",
    description:
      "Secure, centralized electronic health records capturing diagnoses, prescriptions, lab results, and clinical notes.",
    gradient: "linear-gradient(135deg, #FDBA74, #F97316)",
    accentColor: "#FDBA74",
  },
  {
    icon: <LocalHospital sx={{ fontSize: 32 }} />,
    title: "24/7 Emergency & Critical Care",
    description:
      "Round-the-clock emergency medical response and intensive care teams equipped for acute healthcare needs.",
    gradient: "linear-gradient(135deg, #F87171, #DC2626)",
    accentColor: "#F87171",
  },
  {
    icon: <HealthAndSafety sx={{ fontSize: 32 }} />,
    title: "Preventive Health & Screenings",
    description:
      "Proactive wellness programs, routine executive health screenings, and preventative care packages.",
    gradient: "linear-gradient(135deg, #34D399, #059669)",
    accentColor: "#34D399",
  },
];

// ── Statistics Data ──────────────────────────────────────────
const stats = [
  {
    number: 50000,
    suffix: "+",
    label: "Patients Protected",
    description: "Registered & served across clinical portals",
  },
  {
    number: 150,
    suffix: "+",
    label: "Specialist Doctors",
    description: "Board-certified healthcare practitioners",
  },
  {
    number: 99.8,
    suffix: "%",
    decimals: 1,
    label: "Service Satisfaction",
    description: "Verified patient care feedback score",
  },
  {
    number: 24,
    suffix: "/7",
    label: "Emergency Support",
    description: "Continuous clinical readiness & assistance",
  },
];

const Welcome = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  const scrollToRoles = () => {
    const el = document.getElementById("roles-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToServices = () => {
    const el = document.getElementById("services-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#0F172A",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO WITH CINEMATIC VIDEO BACKGROUND
      ═══════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        >
          <source src={medicalVideo} type="video/mp4" />
        </video>

        {/* Dynamic Dark Gradient Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.52) 40%, rgba(15, 23, 42, 0.88) 85%, #0F172A 100%)",
            zIndex: 1,
          }}
        />

        {/* Radial Ambient Glow Blobs */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            right: "8%",
            width: { xs: 220, md: 450 },
            height: { xs: 220, md: 450 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(94, 234, 212, 0.15) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: { xs: 180, md: 380 },
            height: { xs: 180, md: 380 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Dot Matrix Texture Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Hero Content */}
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 3,
            py: { xs: 8, md: 10 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Logo Badge */}
          <Grow in={checked} timeout={500}>
            <Box
              sx={{
                width: { xs: 70, md: 84 },
                height: { xs: 70, md: 84 },
                borderRadius: "24px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3.5,
                boxShadow: "0 10px 35px rgba(0,0,0,0.35)",
              }}
            >
              <LocalHospital sx={{ fontSize: { xs: 38, md: 46 }, color: "#5EEAD4" }} />
            </Box>
          </Grow>

          {/* Security Pill */}
          <Fade in={checked} timeout={650}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.2,
                px: 2.8,
                py: 0.9,
                borderRadius: "24px",
                background: "rgba(94, 234, 212, 0.14)",
                border: "1px solid rgba(94, 234, 212, 0.35)",
                color: "#E0F2FE",
                fontSize: { xs: "0.78rem", md: "0.85rem" },
                fontWeight: 700,
                letterSpacing: "0.02em",
                mb: 3,
                boxShadow: "0 4px 15px rgba(10, 110, 124, 0.25)",
              }}
            >
              <Shield sx={{ fontSize: 16, color: "#5EEAD4" }} />
              <span>Next-Gen Healthcare Management • HIPAA Compliant</span>
            </Box>
          </Fade>

          {/* Main Title */}
          <Grow in={checked} timeout={850}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 900,
                color: "#FFFFFF",
                fontSize: { xs: "2.2rem", sm: "3.2rem", md: "4.3rem" },
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                mb: 2.5,
                maxWidth: 950,
              }}
            >
              Welcome to{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #5EEAD4 0%, #0284C7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CareSync
              </Box>
              <Box
                component="sup"
                sx={{
                  color: "#F97316",
                  fontSize: { xs: "1.2rem", sm: "1.8rem", md: "2.3rem" },
                  fontWeight: 900,
                }}
              >
                +
              </Box>
            </Typography>
          </Grow>

          {/* Tagline */}
          <Fade in={checked} timeout={1050}>
            <Typography
              variant="h5"
              sx={{
                color: "rgba(255,255,255,0.85)",
                mb: 5,
                fontWeight: 500,
                fontSize: { xs: "1rem", sm: "1.18rem", md: "1.32rem" },
                lineHeight: 1.65,
                maxWidth: 760,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              Connecting patients with leading medical specialists, digital
              prescriptions, and seamless appointment management in one unified
              hospital ecosystem.
            </Typography>
          </Fade>

          {/* Action Buttons */}
          <Fade in={checked} timeout={1250}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
                mb: 5,
              }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={scrollToRoles}
                sx={{
                  px: 4.5,
                  py: 1.6,
                  borderRadius: "14px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  textTransform: "none",
                  background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                  boxShadow: "0 8px 25px rgba(10, 110, 124, 0.4)",
                  "&:hover": {
                    boxShadow: "0 12px 30px rgba(10, 110, 124, 0.55)",
                    background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.25s ease",
                }}
              >
                Access Portals
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/addusers")}
                sx={{
                  px: 4,
                  py: 1.6,
                  borderRadius: "14px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  textTransform: "none",
                  color: "#FFFFFF",
                  borderColor: "rgba(255,255,255,0.35)",
                  backdropFilter: "blur(10px)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  "&:hover": {
                    borderColor: "#5EEAD4",
                    backgroundColor: "rgba(94, 234, 212, 0.12)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.25s ease",
                }}
              >
                Register as Patient
              </Button>
            </Box>
          </Fade>

          {/* Trust Highlights */}
          <Fade in={checked} timeout={1400}>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 3 },
                flexWrap: "wrap",
                justifyContent: "center",
                pt: 1,
              }}
            >
              {[
                { icon: <Verified sx={{ fontSize: 16, color: "#5EEAD4" }} />, text: "JCI & ISO Certified" },
                { icon: <CheckCircle sx={{ fontSize: 16, color: "#5EEAD4" }} />, text: "Over 50k Patients" },
                { icon: <Speed sx={{ fontSize: 16, color: "#5EEAD4" }} />, text: "Instant Online Booking" },
              ].map((pill, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 0.6,
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {pill.icon}
                  <span>{pill.text}</span>
                </Box>
              ))}
            </Box>
          </Fade>

          {/* Bouncing Scroll Down Prompt */}
          <Box
            onClick={scrollToRoles}
            sx={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
              color: "rgba(255,255,255,0.7)",
              transition: "all 0.2s ease",
              "&:hover": { color: "#5EEAD4" },
              animation: "bounce 2s infinite",
              "@keyframes bounce": {
                "0%, 20%, 50%, 80%, 100%": { transform: "translateX(-50%) translateY(0)" },
                "40%": { transform: "translateX(-50%) translateY(-8px)" },
                "60%": { transform: "translateX(-50%) translateY(-4px)" },
              },
            }}
          >
            <Typography variant="caption" sx={{ fontSize: "0.72rem", letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase" }}>
              Explore Services
            </Typography>
            <ExpandMore sx={{ fontSize: 22 }} />
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════
          SECTIONS BELOW HERO — WRAPPED WITH SCROLLABLE HOSPITAL BG
      ═══════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          position: "relative",
          backgroundImage: `linear-gradient(180deg, #0F172A 0%, rgba(15, 23, 42, 0.92) 10%, rgba(15, 23, 42, 0.89) 85%, #0B1120 100%), url(${hospitalBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll", // Smoothly scrolls down along with user scrolling (non-strict)
          py: { xs: 8, md: 12 },
        }}
      >
        {/* Ambient Subtle Grid */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
          }}
        />

        {/* ── SECTION 2 — ROLE SELECTION PORTAL CARDS ───────────── */}
        <Container maxWidth="lg" id="roles-section" sx={{ position: "relative", zIndex: 1, mb: { xs: 10, md: 16 } }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip
              label="PORTAL ACCESS"
              size="small"
              sx={{
                mb: 2,
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                bgcolor: "rgba(94, 234, 212, 0.12)",
                color: "#5EEAD4",
                border: "1px solid rgba(94, 234, 212, 0.3)",
              }}
            />
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                color: "#FFFFFF",
                fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
                letterSpacing: "-0.02em",
                mb: 1.5,
              }}
            >
              Choose Your Portal
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.7)",
                maxWidth: 600,
                mx: "auto",
                fontSize: "1rem",
              }}
            >
              Select your role below to access dedicated healthcare services or administrative tools.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 3, md: 4 },
              maxWidth: 950,
              mx: "auto",
              alignItems: "stretch",
            }}
          >
            {/* Role 1 — Patient Portal */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  p: { xs: 3, sm: 4, md: 4.5 },
                  borderRadius: "24px",
                  background: "rgba(30, 41, 59, 0.65)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(94, 234, 212, 0.25)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    borderColor: "rgba(94, 234, 212, 0.6)",
                    boxShadow: "0 20px 50px rgba(10, 110, 124, 0.35)",
                  },
                }}
              >
                {/* Top Accent Gradient Bar */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "linear-gradient(90deg, #5EEAD4, #0A6E7C)",
                  }}
                />

                {/* Role Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: { xs: 54, md: 64 },
                      height: { xs: 54, md: 64 },
                      borderRadius: "18px",
                      background: "rgba(94, 234, 212, 0.15)",
                      border: "1px solid rgba(94, 234, 212, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#5EEAD4",
                      flexShrink: 0,
                    }}
                  >
                    <Person sx={{ fontSize: { xs: 28, md: 34 } }} />
                  </Box>
                  <Box>
                    <Chip
                      label="PATIENT ACCESS"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        bgcolor: "rgba(94, 234, 212, 0.15)",
                        color: "#5EEAD4",
                        mb: 0.5,
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
                      Patient Portal
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.75)", mb: 3.5, lineHeight: 1.7, fontSize: { xs: "0.85rem", md: "0.95rem" } }}
                >
                  Manage your personal and family medical journey. Easily schedule appointments,
                  receive electronic prescriptions, check lab test results, and maintain your complete medical history.
                </Typography>

                {/* Features List */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 4, flexGrow: 1 }}>
                  {[
                    "Book Specialist Appointments & Check Slots",
                    "View Digital Prescriptions & Past Records",
                    "Secure One-Time Password (OTP) Verification",
                    "Track Medical Progress & Consultations",
                  ].map((feat, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircle sx={{ fontSize: 18, color: "#5EEAD4", flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontSize: { xs: "0.8rem", md: "0.88rem" }, fontWeight: 500 }}>
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: "auto" }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate("/patient-login")}
                    sx={{
                      py: 1.5,
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      borderRadius: "12px",
                      textTransform: "none",
                      background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                      boxShadow: "0 6px 20px rgba(10, 110, 124, 0.3)",
                      "&:hover": {
                        boxShadow: "0 8px 25px rgba(10, 110, 124, 0.45)",
                        background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                      },
                    }}
                  >
                    Enter Patient Portal
                  </Button>

                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={() => navigate("/addusers")}
                    sx={{
                      color: "#5EEAD4",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: { xs: "0.75rem", md: "0.85rem" },
                      "&:hover": {
                        backgroundColor: "rgba(94, 234, 212, 0.08)",
                      },
                    }}
                  >
                    New Patient? Register for an Account &rarr;
                  </Button>
                </Box>
              </Paper>
            </Box>

            {/* Role 2 — Admin / Doctor Console */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  p: { xs: 3, sm: 4, md: 4.5 },
                  borderRadius: "24px",
                  background: "rgba(30, 41, 59, 0.65)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(2, 132, 199, 0.25)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    borderColor: "rgba(2, 132, 199, 0.6)",
                    boxShadow: "0 20px 50px rgba(2, 132, 199, 0.35)",
                  },
                }}
              >
                {/* Top Accent Gradient Bar */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "linear-gradient(90deg, #0284C7, #6366F1)",
                  }}
                />

                {/* Role Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: { xs: 54, md: 64 },
                      height: { xs: 54, md: 64 },
                      borderRadius: "18px",
                      background: "rgba(2, 132, 199, 0.15)",
                      border: "1px solid rgba(2, 132, 199, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#A5B4FC",
                      flexShrink: 0,
                    }}
                  >
                    <AdminPanelSettings sx={{ fontSize: { xs: 28, md: 34 } }} />
                  </Box>
                  <Box>
                    <Chip
                      label="STAFF & CLINICAL ACCESS"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        bgcolor: "rgba(2, 132, 199, 0.15)",
                        color: "#93C5FD",
                        mb: 0.5,
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
                      Provider Console
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.75)", mb: 3.5, lineHeight: 1.7, fontSize: { xs: "0.85rem", md: "0.95rem" } }}
                >
                  Centralized operational command for healthcare professionals. Manage daily appointment queues,
                  record patient diagnoses, issue electronic prescriptions, and handle pharmacy drug allocation.
                </Typography>

                {/* Features List */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 4, flexGrow: 1 }}>
                  {[
                    "Daily Appointment Queue & Patient Triage",
                    "Diagnostic Records & Treatment Allocation",
                    "Pharmacy Medicine Dispensation & Billing",
                    "Operational Analytics & Provider Schedules",
                  ].map((feat, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircle sx={{ fontSize: 18, color: "#93C5FD", flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontSize: { xs: "0.8rem", md: "0.88rem" }, fontWeight: 500 }}>
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: "auto" }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate("/admin")}
                    sx={{
                      py: 1.5,
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      borderRadius: "12px",
                      textTransform: "none",
                      background: "linear-gradient(135deg, #1E3A5F 0%, #0284C7 100%)",
                      boxShadow: "0 6px 20px rgba(2, 132, 199, 0.3)",
                      "&:hover": {
                        boxShadow: "0 8px 25px rgba(2, 132, 199, 0.45)",
                        background: "linear-gradient(135deg, #1E293B 0%, #0369A1 100%)",
                      },
                    }}
                  >
                    Enter Provider Console
                  </Button>

                  <Typography
                    variant="caption"
                    align="center"
                    sx={{ color: "rgba(255,255,255,0.5)", py: 0.5, fontSize: "0.78rem" }}
                  >
                    Secured by Multi-Role Hospital Credentials
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>

        {/* ── SECTION 3 — CLINICAL SERVICES & CAPABILITIES ────── */}
        <Box id="services-section" sx={{ position: "relative", zIndex: 1, mb: { xs: 10, md: 16 }, width: "100%" }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Chip
                label="CLINICAL SERVICES"
                size="small"
                sx={{
                  mb: 2,
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  bgcolor: "rgba(2, 132, 199, 0.15)",
                  color: "#93C5FD",
                  border: "1px solid rgba(2, 132, 199, 0.3)",
                }}
              />
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
                  letterSpacing: "-0.02em",
                  mb: 1.5,
                }}
              >
                Comprehensive Clinical Capabilities
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  maxWidth: 620,
                  mx: "auto",
                  fontSize: "1rem",
                }}
              >
                Advanced digital healthcare infrastructure designed for patient safety, speed, and clinical precision.
              </Typography>
            </Box>
          </Container>

          <Box
            sx={{
              display: "flex",
              overflow: "hidden",
              width: "100%",
              position: "relative",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: 0,
                width: { xs: "40px", md: "80px" },
                height: "100%",
                zIndex: 2,
                pointerEvents: "none",
              },
              "&::before": {
                left: 0,
                background: "linear-gradient(to right, #0F172A, transparent)",
              },
              "&::after": {
                right: 0,
                background: "linear-gradient(to left, #0F172A, transparent)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 3,
                width: "max-content",
                animation: "marqueeRightToLeft 30s linear infinite",
                "&:hover": {
                  animationPlayState: "paused",
                },
                "@keyframes marqueeRightToLeft": {
                  "0%": { transform: "translateX(0)" },
                  "100%": { transform: "translateX(-50%)" },
                },
                "@keyframes marqueeLeftToRight": {
                  "0%": { transform: "translateX(-50%)" },
                  "100%": { transform: "translateX(0)" },
                },
              }}
            >
              {/* Duplicate features array to create a seamless loop */}
              {[...features, ...features].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: { xs: 280, sm: 320, md: 360 },
                    flexShrink: 0,
                    py: 1, // Padding for hover shadow expansion
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      height: "100%",
                      p: { xs: 3, md: 3.5 },
                      borderRadius: "20px",
                      background: "rgba(30, 41, 59, 0.6)",
                      backdropFilter: "blur(14px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-6px) scale(1.02)",
                        borderColor: item.accentColor || "rgba(94, 234, 212, 0.35)",
                        background: "rgba(30, 41, 59, 0.8)",
                        boxShadow: `0 16px 35px ${item.accentColor ? item.accentColor + '40' : 'rgba(0,0,0,0.35)'}`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 58,
                        height: 58,
                        borderRadius: "16px",
                        background: item.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        mb: 2.5,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 1.2, fontSize: { xs: "1rem", md: "1.08rem" } }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.65, fontSize: "0.9rem" }}>
                      {item.description}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── SECTION 4 — KEY METRICS & IMPACT ────────────────── */}
        <Container maxWidth="lg" ref={statsRef} sx={{ position: "relative", zIndex: 1, mb: { xs: 10, md: 14 } }}>
          <Box
            sx={{
              p: { xs: 4, sm: 6 },
              borderRadius: "28px",
              background: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(94, 234, 212, 0.2)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
            }}
          >
            <Grid container spacing={4} alignItems="center">
              {stats.map((s, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: "2rem", sm: "2.6rem", md: "3.2rem" },
                        background:
                          index % 2 === 0
                            ? "linear-gradient(135deg, #5EEAD4 0%, #0284C7 100%)"
                            : "linear-gradient(135deg, #0284C7 0%, #6366F1 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 0.5,
                      }}
                    >
                      {statsInView ? (
                        <CountUp
                          end={s.number}
                          duration={2.5}
                          decimals={s.decimals || 0}
                          separator=","
                        />
                      ) : (
                        "0"
                      )}
                      {s.suffix}
                    </Typography>

                    <Typography
                      variant="subtitle1"
                      sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: { xs: "0.9rem", md: "1rem" }, mb: 0.5 }}
                    >
                      {s.label}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}
                    >
                      {s.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* ── SECTION 5 — EMERGENCY ASSISTANCE BANNER ─────────── */}
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, mb: { xs: 8, md: 10 } }}>
          <Box
            sx={{
              p: { xs: 3.5, sm: 5 },
              borderRadius: "24px",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: "16px",
                  bgcolor: "rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F87171",
                  flexShrink: 0,
                }}
              >
                <LocalHospital sx={{ fontSize: 34 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 800, mb: 0.5 }}>
                  Immediate Clinical Assistance Required?
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  24/7 Triage &amp; Emergency Helpline: <strong>+94 11 234 5678</strong> • National Ambulance: <strong>1990</strong>
                </Typography>
              </Box>
            </Box>

            {/* <Button
              variant="outlined"
              size="large"
              startIcon={<Phone />}
              onClick={() => navigate("/available-time")}
              sx={{
                borderColor: "#F87171",
                color: "#FCA5A5",
                fontWeight: 700,
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                textTransform: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "#EF4444",
                  bgcolor: "rgba(239, 68, 68, 0.1)",
                },
              }}
            >
              View Available Doctors
            </Button> */}
          </Box>
        </Container>

        {/* ── SECTION 6 — HOSPITAL FOOTER ─────────────────────── */}
        <Box
          component="footer"
          sx={{
            pt: 6,
            pb: 4,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} sx={{ mb: 4 }}>
              {/* Brand Col */}
              <Grid item xs={12} md={5}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      bgcolor: "rgba(94, 234, 212, 0.15)",
                      border: "1px solid rgba(94, 234, 212, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LocalHospital sx={{ fontSize: 22, color: "#5EEAD4" }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                    CareSync
                    <Box component="sup" sx={{ color: "#F97316", fontWeight: 900 }}>
                      +
                    </Box>
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 380, mb: 2 }}>
                  Transforming hospital care with integrated patient records, automated
                  prescription management, and intelligent doctor appointment scheduling.
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Chip label="ISO 27001 Certified" size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", fontSize: "0.72rem" }} />
                  <Chip label="HIPAA Compliant" size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", fontSize: "0.72rem" }} />
                </Box>
              </Grid>

              {/* Quick Links */}
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 2, textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.05em" }}>
                  Patient Services
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                  <Link to="/patient-login" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem" }}>
                    Patient Sign In
                  </Link>
                  <Link to="/addusers" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem" }}>
                    Create Patient Account
                  </Link>
                  <Link to="/available-time" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem" }}>
                    Doctor Timetables
                  </Link>
                  <Link to="/about-us" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem" }}>
                    About CareSync+
                  </Link>
                </Box>
              </Grid>

              {/* Hospital Staff Links */}
              <Grid item xs={6} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 2, textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.05em" }}>
                  Clinical Administration
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                  <Link to="/admin" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem" }}>
                    Staff &amp; Doctor Login
                  </Link>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                    Authorized personnel only. Access requires multi-level credentials.
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Bottom Copyright */}
            <Box
              sx={{
                pt: 3,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <span>&copy; {new Date().getFullYear()} CareSync+ Hospital Management System. All rights reserved.</span>
              <span>Encrypted 256-Bit SSL • High-Availability Healthcare Infrastructure</span>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Welcome;
