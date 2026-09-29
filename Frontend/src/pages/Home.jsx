// Home.jsx - Patient Home Dashboard with modern aesthetics, centered navbar, and rich interactive sections

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientAppointment from "../components/patientappoinment";
import PatientNavbar from "../components/PatientNavbar";

// MUI Components
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Modal,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  Backdrop,
  Avatar,
  Chip,
} from "@mui/material";
import {
  CalendarToday,
  MedicalServices,
  LocalPharmacy,
  History,
  Person,
  Shield,
  Verified,
  ArrowForward,
  Close,
  HealthAndSafety,
  PhoneInTalk,
  CheckCircle,
  Favorite,
  Security,
  Speed,
  WorkspacePremium,
} from "@mui/icons-material";

import doctor_consultation from "../assets/hdoctor_consultation.jpeg";
import image4 from "../assets/online-medical.png";
import image5 from "../assets/pharmacy_new.png";
import image6 from "../assets/medical-prescription.png";
import medicare_modern_bg from "../assets/medicare_modern_bg.jpg";
import CountUp from "react-countup";

export default function Home() {
  const [popup, setPopup] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const userName = localStorage.getItem("Name") || "Patient";
  const patientCode = localStorage.getItem("PatientCode") || "PA-001";

  // Check URL query parameters for ?book=true
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("book") === "true") {
      setPopup(true);
    }
  }, []);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Patient Services Hub
  const services = [
    {
      icon: <CalendarToday sx={{ fontSize: 30 }} />,
      title: "Online Doctor Appointments",
      tag: "INSTANT CONFIRMATION",
      description:
        "Book doctor consultations with guaranteed timeslots. Choose from cardiologists, pediatricians, physicians, and surgeons.",
      image: image4,
      gradient: "linear-gradient(135deg, #0284C7, #0A6E7C)",
      features: ["Real-time doctor schedule", "SMS & email alerts", "Easy rescheduling"],
      action: () => setPopup(true),
    },
    {
      icon: <MedicalServices sx={{ fontSize: 30 }} />,
      title: "Clinical Medical Records",
      tag: "HIPAA COMPLIANT",
      description:
        "Access your complete treatment reports, doctor clinical observations, diagnostic findings, and prescriptions anytime.",
      image: image6,
      gradient: "linear-gradient(135deg, #0A6E7C, #14B8A6)",
      features: ["Diagnostic summaries", "Doctor remarks", "Historical logs"],
      action: () => navigate("/medical-history"),
    },
    
    {
      icon: <PhoneInTalk sx={{ fontSize: 30 }} />,
      title: "Emergency Care",
      tag: "24/7 HOTLINE",
      description:
        "Rapid ambulance dispatch & urgent triage hotline. Fast response for all medical emergencies.",
      image: null,
      gradient: "linear-gradient(135deg, #DC2626, #EA580C)",
      features: ["Immediate dispatch", "Triage support", "Priority routing"],
      action: () => window.open("tel:1990"),
    },
  ];

  // Health highlights / trust features
  const trustFeatures = [
    {
      icon: <Verified sx={{ color: "#0A6E7C", fontSize: 28 }} />,
      title: "Certified Specialists",
      desc: "Licensed, highly vetted medical professionals dedicated to your health.",
    },
    {
      icon: <Security sx={{ color: "#0284C7", fontSize: 28 }} />,
      title: "Bank-Grade Encryption",
      desc: "Your medical files and personal details are encrypted and HIPAA protected.",
    },
    {
      icon: <Speed sx={{ color: "#10B981", fontSize: 28 }} />,
      title: "Zero Waiting Times",
      desc: "Pre-allocated appointment slots ensure you get attended to on time.",
    },
    {
      icon: <WorkspacePremium sx={{ color: "#F59E0B", fontSize: 28 }} />,
      title: "JCI Accredited Facility",
      desc: "Meeting top global standards in healthcare quality and clinical safety.",
    },
  ];

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
          1. ACCURATELY CENTERED PATIENT NAVBAR
      ───────────────────────────────────────────────────────────── */}
      <PatientNavbar
        activePage="home"
        onBookAppointment={() => setPopup(true)}
        breadcrumbSubtitle="Home Dashboard"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. UPGRADED HIGH-IMPACT HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <Box
        id="home-section"
        sx={{
          position: "relative",
          minHeight: { xs: "580px", sm: "600px", md: "660px" },
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Static Background Image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        >
          <Box
            component="img"
            src={doctor_consultation}
            alt="Medical Hero Background"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1.02)",
            }}
          />
        </Box>

        {/* Rich Modern Gradient Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(10, 37, 64, 0.90) 0%, rgba(10, 110, 124, 0.85) 55%, rgba(2, 132, 199, 0.78) 100%)",
            zIndex: 1,
            backdropFilter: "blur(2px)",
          }}
        />

        {/* Hero Content */}
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 3,
            py: { xs: 8, md: 10 },
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Badge */}
          {/* <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2.2,
              py: 0.8,
              borderRadius: "30px",
              background: "rgba(94, 234, 212, 0.16)",
              border: "1px solid rgba(94, 234, 212, 0.35)",
              backdropFilter: "blur(8px)",
              color: "#5EEAD4",
              fontWeight: 800,
              fontSize: { xs: "0.72rem", md: "0.78rem" },
              letterSpacing: "0.1em",
              mb: 2.5,
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
            }}
          >
            <HealthAndSafety sx={{ fontSize: 16 }} />
            <span>EXCELLENCE IN PATIENT CARE</span>
          </Box> */}

          {/* Heading */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2.1rem", sm: "2.8rem", md: "3.6rem" },
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              color: "#FFFFFF",
              maxWidth: 820,
              mb: 2.5,
            }}
          >
            Your Health Journey,{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #5EEAD4 0%, #38BDF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: { xs: "block", sm: "inline" },
              }}
            >
              Digitally Empowered
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "0.98rem", md: "1.15rem" },
              lineHeight: 1.65,
              color: "rgba(255, 255, 255, 0.88)",
              maxWidth: 680,
              mb: 4,
              fontWeight: 400,
            }}
          >
            Experience seamless healthcare management. Schedule specialist doctor appointments, access real-time clinical notes, and manage digital prescriptions with ease.
          </Typography>

          {/* Dual Action Buttons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 5,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => setPopup(true)}
              startIcon={<CalendarToday sx={{ fontSize: 19 }} />}
              endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
              sx={{
                px: 3.5,
                py: 1.5,
                borderRadius: "14px",
                fontSize: "0.98rem",
                fontWeight: 800,
                textTransform: "none",
                background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                boxShadow: "0 8px 24px rgba(10, 110, 124, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: "0 12px 30px rgba(10, 110, 124, 0.6)",
                  transform: "translateY(-2px)",
                  background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                },
              }}
            >
              Book Doctor Appointment
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/medical-history")}
              startIcon={<History sx={{ fontSize: 20 }} />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: "14px",
                fontSize: "0.98rem",
                fontWeight: 700,
                textTransform: "none",
                color: "#FFFFFF",
                borderColor: "rgba(255, 255, 255, 0.4)",
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(10px)",
                transition: "all 0.25s ease",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.2)",
                  borderColor: "#FFFFFF",
                  transform: "translateY(-2px)",
                },
              }}
            >
              View Medical History
            </Button>
          </Box>

          {/* Floating Key Stats Bar */}
          <Paper
            elevation={4}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: { xs: 2, sm: 3 },
              py: 2,
              px: { xs: 2, sm: 4 },
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              maxWidth: 820,
              width: "100%",
            }}
          >
            <Box sx={{ textAlign: "center", minWidth: 100 }}>
              <Typography sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" }, fontWeight: 800, color: "#5EEAD4" }}>
                <CountUp end={15} duration={2.5} />+
              </Typography>
              <Typography sx={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                Specialist Doctors
              </Typography>
            </Box>

            <Box sx={{ height: 32, width: "1px", bgcolor: "rgba(255,255,255,0.15)", display: { xs: "none", sm: "block" } }} />

            <Box sx={{ textAlign: "center", minWidth: 100 }}>
              <Typography sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" }, fontWeight: 800, color: "#38BDF8" }}>
                <CountUp end={24} duration={2.5} /> / 7
              </Typography>
              <Typography sx={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                Emergency Support
              </Typography>
            </Box>

            <Box sx={{ height: 32, width: "1px", bgcolor: "rgba(255,255,255,0.15)", display: { xs: "none", sm: "block" } }} />

            <Box sx={{ textAlign: "center", minWidth: 100 }}>
              <Typography sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" }, fontWeight: 800, color: "#A7F3D0" }}>
                <CountUp end={100} duration={2.5} />%
              </Typography>
              <Typography sx={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                HIPAA Protected
              </Typography>
            </Box>

            <Box sx={{ height: 32, width: "1px", bgcolor: "rgba(255,255,255,0.15)", display: { xs: "none", sm: "block" } }} />

            <Box sx={{ textAlign: "center", minWidth: 100 }}>
              <Typography sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" }, fontWeight: 800, color: "#FDE047" }}>
                <CountUp end={4.9} decimals={1} duration={2.5} /> ★
              </Typography>
              <Typography sx={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                Patient Satisfaction
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          3. PERSONALIZED PATIENT WELCOME & QUICK HUB BAR
      ───────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: -3, position: "relative", zIndex: 10, mb: 6 }}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: "18px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: "#0284C7",
                fontSize: "18px",
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
              }}
            >
              {userName.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                  {getGreeting()}, {userName}
                </Typography>
                <Chip
                  label={`ID: ${patientCode}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "11px",
                    bgcolor: "#E0F2FE",
                    color: "#0369A1",
                    height: 22,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.2 }}>
                Welcome to your patient portal. Manage your clinical care and doctor bookings seamlessly.
              </Typography>
            </Box>
          </Box>

        </Paper>
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          4. PATIENT SERVICES HUB (REVAMPED CLINICAL SERVICES)
      ───────────────────────────────────────────────────────────── */}
      <Box
        id="services-section"
        sx={{
          py: { xs: 7, md: 9 },
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.4)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.4)",
        }}
      >
        <Container maxWidth="lg">
          {/* Section Header */}
          <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.6,
                borderRadius: "20px",
                background: "rgba(10, 110, 124, 0.08)",
                border: "1px solid rgba(10, 110, 124, 0.16)",
                color: "#0A6E7C",
                fontSize: "0.75rem",
                fontWeight: 800,
                mb: 1.5,
                letterSpacing: "0.08em",
              }}
            >
              <HealthAndSafety sx={{ fontSize: 16 }} />
              <span>COMPREHENSIVE CLINICAL CARE</span>
            </Box>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 800,
                color: "#0F172A",
                fontSize: { xs: "1.5rem", md: "2.1rem" },
                letterSpacing: "-0.02em",
                mb: 1,
              }}
            >
              What We Offer You
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748B",
                maxWidth: 620,
                mx: "auto",
                fontSize: "0.95rem",
              }}
            >
              Complete integrated hospital solutions engineered for patient satisfaction, precision diagnosis, and fast recovery.
            </Typography>
          </Box>

          {/* Service Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 3.5,
              width: "100%",
            }}
          >
            {services.map((service, index) => (
              <Box key={index} sx={{ height: "100%" }}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    background: "rgba(250, 250, 250, 0.7)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 22px 45px rgba(15, 23, 42, 0.08)",
                      borderColor: "#0284C7",
                      background: "rgba(255, 255, 255, 0.95)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3.5, flexGrow: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          background: service.gradient,
                          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                          color: "#FFFFFF",
                        }}
                      >
                        {service.icon}
                      </Avatar>
                      <Chip
                        label={service.tag}
                        size="small"
                        sx={{
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          bgcolor: "rgba(2, 132, 199, 0.08)",
                          color: "#0284C7",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 800,
                        color: "#0F172A",
                        mb: 1.2,
                        fontSize: "1.15rem",
                      }}
                    >
                      {service.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748B",
                        lineHeight: 1.6,
                        fontSize: "0.88rem",
                        mb: 2.5,
                      }}
                    >
                      {service.description}
                    </Typography>

                    {/* Features list */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 2 }}>
                      {service.features.map((feat, fIdx) => (
                        <Box key={fIdx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: "#10B981" }} />
                          <Typography sx={{ fontSize: "12.5px", color: "#334155", fontWeight: 600 }}>
                            {feat}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>

                  {/* Card bottom illustration & CTA */}
                  <Box
                    sx={{
                      p: 2.5,
                      background: "#F1F5F9",
                      borderTop: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {service.image ? (
                      <Box
                        component="img"
                        src={service.image}
                        alt={service.title}
                        sx={{
                          height: 55,
                          width: "auto",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Box sx={{ flexGrow: 1 }} />
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={service.action}
                      endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "12px",
                        background: service.gradient,
                        px: 2,
                        py: 0.7,
                      }}
                    >
                      Access
                    </Button>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          6. TRUST & SAFETY PILLARS
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 5, md: 7 },
          background: "rgba(248, 250, 252, 0.65)",
          backdropFilter: "blur(8px)",
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Fade gradients for smooth entering/exiting effect */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: { xs: "40px", md: "120px" },
            background: "linear-gradient(to right, rgba(248, 250, 252, 0.8), transparent)",
            zIndex: 2,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: { xs: "40px", md: "120px" },
            background: "linear-gradient(to left, rgba(248, 250, 252, 0.8), transparent)",
            zIndex: 2,
          }}
        />

        <Box
          sx={{
            display: "flex",
            width: "max-content",
            "@keyframes scrollMarquee": {
              "0%": { transform: "translateX(0)" },
              "100%": { transform: "translateX(-50%)" },
            },
            animation: "scrollMarquee 35s linear infinite",
            "&:hover": {
              animationPlayState: "paused",
            },
          }}
        >
          {[...trustFeatures, ...trustFeatures, ...trustFeatures, ...trustFeatures].map((feat, idx) => (
            <Box
              key={idx}
              sx={{
                width: { xs: "280px", sm: "320px", md: "350px" },
                mx: { xs: 1.5, md: 2 },
                p: 3,
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                flexDirection: "column",
                gap: 1.2,
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                  borderColor: "#CBD5E1",
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Box sx={{ mb: 0.5 }}>{feat.icon}</Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>
                {feat.title}
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.5 }}>
                {feat.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          7. HEALTH & WELLNESS BANNER
      ───────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4.5 },
            borderRadius: "22px",
            background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 3,
            boxShadow: "0 16px 36px rgba(10, 110, 124, 0.25)",
          }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.4,
                borderRadius: "20px",
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#5EEAD4",
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: "0.06em",
                mb: 1.5,
              }}
            >
              <Favorite sx={{ fontSize: 14 }} />
              <span>PREVENTATIVE HEALTH PROTOCOL</span>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: "1.3rem", md: "1.6rem" } }}>
              Prioritize Regular Health Checkups
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6 }}>
              Early detection is the cornerstone of proactive well-being. Schedule periodic screenings, monitor your blood pressure, and keep your electronic medical records current.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setPopup(true)}
            sx={{
              background: "#FFFFFF",
              color: "#0A6E7C",
              fontWeight: 800,
              fontSize: "0.95rem",
              px: 3.5,
              py: 1.4,
              borderRadius: "12px",
              textTransform: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              "&:hover": {
                background: "#F0FDFA",
                color: "#085B67",
              },
            }}
          >
            Book Checkup Now
          </Button>
        </Paper>
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          8. APPOINTMENT MODAL (PRESERVED & STYLED)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        open={popup}
        onClose={() => setPopup(false)}
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
        <Fade in={popup} timeout={300}>
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
            {/* Modal Header */}
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
                onClick={() => setPopup(false)}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { background: "rgba(255,255,255,0.25)" },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Modal Content */}
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

            {/* Modal Footer */}
            <Box
              sx={{
                p: 1.6,
                textAlign: "center",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.78rem" }}>
                Need urgent assistance? Call our 24/7 hospital helpdesk at 1990 • CareSync+ Health Systems
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          9. FOOTER
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
            © {new Date().getFullYear()} CareSync+ Health Systems. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
