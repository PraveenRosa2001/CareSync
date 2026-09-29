import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Home as HomeIcon,
  History,
  Person,
  Logout,
  LocalHospital,
  Shield,
  Close,
  NotificationsNone,
  CalendarToday,
  Menu as MenuIcon,
  CheckCircle,
} from "@mui/icons-material";
import LogoOriginal from "../assets/Logo_Original.png";

export default function PatientNavbar({ onBookAppointment, activePage, breadcrumbSubtitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTransparent = ["home", "medical-history", "profile"].includes(activePage) && !scrolled;

  const userName = localStorage.getItem("Name") || "Patient";
  const patientCode = localStorage.getItem("PatientCode") || "PA-001";
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Email");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("PatientCode");
    localStorage.removeItem("Name");
    localStorage.removeItem("Contact");
    localStorage.removeItem("Role");
    navigate("/welcome");
  };

  const navItems = [
    { label: "Home", path: "/home", icon: <HomeIcon sx={{ fontSize: 18 }} /> },
    { label: "Medical History", path: "/medical-history", icon: <History sx={{ fontSize: 18 }} /> },
    { label: "Profile", path: "/profile", icon: <Person sx={{ fontSize: 18 }} /> },
  ];

  const isCurrentActive = (path) => {
    if (activePage) {
      if (activePage === "home" && path === "/home") return true;
      if (activePage === "medical-history" && path === "/medical-history") return true;
      if (activePage === "profile" && path === "/profile") return true;
    }
    return location.pathname === path;
  };

  const getBreadcrumbTitle = () => {
    if (breadcrumbSubtitle) return breadcrumbSubtitle;
    if (location.pathname === "/medical-history" || activePage === "medical-history") {
      return "Medical History & Clinical Records";
    }
    if (location.pathname === "/profile" || activePage === "profile") {
      return "Patient Profile & Appointments";
    }
    return "Home Dashboard";
  };

  const handleBookClick = () => {
    if (onBookAppointment) {
      onBookAppointment();
    } else {
      navigate("/home?book=true");
    }
  };

  return (
    <Box
      component="header"
      sx={{
        background: isTransparent ? "transparent" : "#FFFFFF",
        borderBottom: isTransparent ? "none" : "1px solid #E2E8F0",
        position: ["home", "medical-history", "profile"].includes(activePage) ? "fixed" : "sticky",
        top: 0,
        width: "100%",
        zIndex: 1100,
        boxShadow: isTransparent ? "none" : "0 1px 3px rgba(15, 23, 42, 0.05)",
        transition: "all 0.3s ease",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          PRIMARY TOP BAR (Accurately Centered Layout)
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3, md: 4 },
          height: 64, // Fixed height keeps navbar size constant
          borderBottom: isTransparent ? "none" : "1px solid #F1F5F9",
          position: "relative",
        }}
      >
        {/* LEFT: Brand Logo & Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: { md: 220 } }}>
          {isTablet && (
            <IconButton
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="small"
              sx={{
                color: isTransparent ? "#FFFFFF" : "#334155",
                bgcolor: isTransparent ? "rgba(255,255,255,0.15)" : "#F8FAFC",
                border: isTransparent ? "none" : "1px solid #E2E8F0",
                p: 0.8,
                borderRadius: "8px",
              }}
            >
              {mobileMenuOpen ? <Close fontSize="small" /> : <MenuIcon fontSize="small" />}
            </IconButton>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => navigate("/home")}
          >
            <Box
              component="img"
              src={LogoOriginal}
              alt="CareSync Logo"
              sx={{
                height: 70, // Increased logo size
                maxHeight: 80,
                objectFit: "contain",
                filter: isTransparent ? "brightness(0) invert(1)" : "none",
                transition: "all 0.3s ease",
              }}
            />
            {/* <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "9px",
                    fontWeight: 800,
                    color: isTransparent ? "rgba(255,255,255,0.8)" : "#0A6E7C",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  PATIENT PORTAL
                </Typography>
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "#10B981",
                  }}
                />
              </Box>
            </Box> */}
          </Box>
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            CENTER: ACCURATELY CENTERED NAVIGATION PILL BAR (DESKTOP)
        ───────────────────────────────────────────────────────────── */}
        {!isTablet && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                p: "4px",
                borderRadius: "32px",
                bgcolor: isTransparent ? "rgba(255, 255, 255, 0.15)" : "#F1F5F9",
                border: isTransparent ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #E2E8F0",
                boxShadow: isTransparent ? "none" : "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
                backdropFilter: isTransparent ? "blur(8px)" : "none",
                gap: "4px",
              }}
            >
              {navItems.map((item, i) => {
                const active = isCurrentActive(item.path);
                return (
                  <Button
                    key={i}
                    onClick={() => navigate(item.path)}
                    startIcon={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: active ? "#0284C7" : (isTransparent ? "rgba(255,255,255,0.8)" : "#64748B"),
                        }}
                      >
                        {item.icon}
                      </Box>
                    }
                    sx={{
                      color: active ? "#0F172A" : (isTransparent ? "#FFFFFF" : "#64748B"),
                      fontWeight: active ? 700 : 600,
                      fontSize: "13px",
                      textTransform: "none",
                      borderRadius: "26px",
                      px: 2.2,
                      py: 0.75,
                      bgcolor: active ? "#FFFFFF" : "transparent",
                      boxShadow: active
                        ? "0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)"
                        : "none",
                      transition: "all 0.22s ease-in-out",
                      position: "relative",
                      "&:hover": {
                        bgcolor: active ? "#FFFFFF" : (isTransparent ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.65)"),
                        color: active ? "#0F172A" : (isTransparent ? "#FFFFFF" : "#1E293B"),
                      },
                    }}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: "#0284C7",
                          ml: 1,
                        }}
                      />
                    )}
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}

        {/* RIGHT: Status, CTA & User Capsule */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {!isMobile && (
            <Tooltip title="Your patient session is active and secure">
              {/* <Box
                sx={{
                  display: { xs: "none", lg: "inline-flex" },
                  alignItems: "center",
                  gap: "6px",
                  px: "12px",
                  py: "5px",
                  borderRadius: "20px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  background: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)",
                  }}
                />
                <span>Active Portal</span>
              </Box> */}
            </Tooltip>
          )}

          {/* Book Appointment CTA Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<CalendarToday sx={{ fontSize: 15 }} />}
            onClick={handleBookClick}
            sx={{
              background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "12.5px",
              px: { xs: 1.5, sm: 2 },
              py: 0.85,
              color: "#FFFFFF",
              boxShadow: "0 2px 10px rgba(10, 110, 124, 0.25)",
              display: { xs: "none", sm: "inline-flex" },
              transition: "all 0.2s ease",
              "&:hover": {
                background: "linear-gradient(135deg, #085B67 0%, #0369A1 100%)",
                boxShadow: "0 4px 14px rgba(10, 110, 124, 0.35)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Book Appointment
          </Button>

          {/* Notification Button */}
          <Tooltip title="Notifications">
            <IconButton
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: isTransparent ? "rgba(255,255,255,0.15)" : "#F8FAFC",
                border: isTransparent ? "1px solid rgba(255,255,255,0.2)" : "1px solid #E2E8F0",
                color: isTransparent ? "#FFFFFF" : "#475569",
                position: "relative",
                transition: "all 0.2s ease",
                "&:hover": { background: isTransparent ? "rgba(255,255,255,0.25)" : "#F1F5F9", color: isTransparent ? "#FFFFFF" : "#0F172A" },
              }}
            >
              <NotificationsNone sx={{ fontSize: 19 }} />
              <Box
                sx={{
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#EF4444",
                  border: "1.5px solid #FFFFFF",
                }}
              />
            </IconButton>
          </Tooltip>

          {/* User Profile Capsule */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 1.2,
              borderLeft: "1px solid #E2E8F0",
            }}
          >
            <Tooltip title="View Profile">
              <Box
                onClick={() => navigate("/profile")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  p: "3px 6px 3px 3px",
                  borderRadius: "20px",
                  transition: "background 0.2s ease",
                  "&:hover": { bgcolor: isTransparent ? "rgba(255,255,255,0.1)" : "#F8FAFC" },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: "#0284C7",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                  }}
                >
                  {userInitials}
                </Avatar>
                {!isMobile && (
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: isTransparent ? "#FFFFFF" : "#0F172A",
                        lineHeight: 1.2,
                      }}
                    >
                      {userName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: isTransparent ? "rgba(255,255,255,0.8)" : "#0A6E7C",
                      }}
                    >
                      ID: {patientCode}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>

            {/* Logout Button */}
            <Tooltip title="Sign Out">
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{
                  color: isTransparent ? "#FFFFFF" : "#64748B",
                  p: "6px",
                  borderRadius: "8px",
                  border: "1px solid transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: isTransparent ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                    color: isTransparent ? "#FECACA" : "#EF4444",
                    borderColor: isTransparent ? "rgba(239, 68, 68, 0.5)" : "#FECACA",
                  },
                }}
              >
                <Logout sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          SECONDARY SUB-BAR (Breadcrumbs & Security Credentials)
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: isTransparent ? "none" : "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3, md: 4 },
          py: 0.8,
          fontSize: "12px",
          color: "#64748B",
          background: "#FAFAFA",
        }}
      >
        {/* Left: Breadcrumbs */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            component="span"
            onClick={() => navigate("/home")}
            sx={{
              color: "#0284C7",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Patient Portal
          </Typography>
          <span style={{ color: "#CBD5E1" }}>›</span>
          <Typography
            component="span"
            sx={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}
          >
            {getBreadcrumbTitle()}
          </Typography>
        </Box>

        {/* Right: Security Credentials */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#0284C7",
              }}
            />
            <Typography component="span" sx={{ color: "#0284C7", fontWeight: 700, fontSize: "11.5px" }}>
              Secure SSL
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Shield sx={{ fontSize: 13, color: "#0A6E7C" }} />
            <Typography component="span" sx={{ fontSize: "11.5px", color: "#475569", fontWeight: 600 }}>
              HIPAA Protected
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 13, color: "#10B981" }} />
            <Typography component="span" sx={{ fontSize: "11.5px", color: "#475569" }}>
              Encrypted Records
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE DRAWER / MENU
      ───────────────────────────────────────────────────────────── */}
      {isTablet && mobileMenuOpen && (
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: "1px solid #E2E8F0",
            background: "#FFFFFF",
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          {navItems.map((item, i) => {
            const active = isCurrentActive(item.path);
            return (
              <Button
                key={i}
                fullWidth
                startIcon={item.icon}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                sx={{
                  justifyContent: "flex-start",
                  color: active ? "#0284C7" : "#475569",
                  fontWeight: active ? 700 : 600,
                  fontSize: "14px",
                  textTransform: "none",
                  borderRadius: "10px",
                  py: 1.1,
                  px: 2,
                  mb: 0.6,
                  bgcolor: active ? "rgba(2, 132, 199, 0.08)" : "transparent",
                  "&:hover": { background: "#F1F5F9" },
                }}
              >
                {item.label}
              </Button>
            );
          })}

          <Button
            fullWidth
            startIcon={<CalendarToday />}
            onClick={() => {
              setMobileMenuOpen(false);
              handleBookClick();
            }}
            variant="contained"
            sx={{
              mt: 1.5,
              background: "linear-gradient(135deg, #0A6E7C, #0284C7)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              py: 1.1,
            }}
          >
            Book Appointment
          </Button>
        </Box>
      )}
    </Box>
  );
}
