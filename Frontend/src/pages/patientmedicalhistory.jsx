// patientmedicalhistory.jsx - Redesigned Medical History Page matching the modern CareSync+ portal

import React, { useEffect, useState } from "react";
import axios from "axios";
import PatientNavbar from "../components/PatientNavbar";
import PatientAppointment from "../components/patientappoinment";

import {
  Avatar,
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Chip,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  TextField,
  Tooltip,
  Fade,
  Modal,
  Backdrop,
} from "@mui/material";
import medical_bg from "../assets/hospital_background.jpg";
import medicare_modern_bg from "../assets/medicare_modern_bg.jpg";
import {
  Close,
  Visibility,
  LocalHospital,
  Medication,
  Notes,
  Search,
  CheckCircle,
  AccessTime,
  CalendarToday,
  Print,
  Refresh,
  MedicalServices,
  Shield,
  Verified,
  ReceiptLong,
  InfoOutlined,
  FilterList,
} from "@mui/icons-material";

export default function Pmedicalhistory() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [details, setDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecordHeader, setSelectedRecordHeader] = useState(null);
  const [appointmentPopup, setAppointmentPopup] = useState(false);

  const patientid = localStorage.getItem("PatientCode");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch past medical records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/${patientid}`
      );
      const sortedRecords = (response.data || []).sort(
        (a, b) => new Date(b.MTD_CREATED_DATE) - new Date(a.MTD_CREATED_DATE)
      );
      setRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
      setError(null);
    } catch (err) {
      console.error("Error fetching medical records:", err);
      setError("No past medical treatment records found for this account.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientid]);

  // Handle Search and Filter
  useEffect(() => {
    let result = [...records];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (rec, index) =>
          (rec.MTD_DOCTOR && rec.MTD_DOCTOR.toLowerCase().includes(term)) ||
          `treatment ${records.length - index}`.toLowerCase().includes(term) ||
          (rec.MTD_SERIAL_NO && String(rec.MTD_SERIAL_NO).includes(term))
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((rec) => rec.MTD_TREATMENT_STATUS === statusFilter);
    }

    setFilteredRecords(result);
  }, [searchTerm, statusFilter, records]);

  // View Record Details
  const viewdetails = async (patientId, serial_no, displayIndex, doctor, date, status) => {
    setSelectedRecordHeader({
      treatmentNo: displayIndex,
      doctor: doctor,
      date: date,
      status: status,
    });
    try {
      setDetailsLoading(true);
      setIsModalOpen(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serial_no}`
      );
      setDetails(response.data);
    } catch (err) {
      console.error("Error fetching record details:", err);
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDetails(null);
    setSelectedRecordHeader(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "C":
        return (
          <Chip
            icon={<CheckCircle sx={{ fontSize: "14px !important", color: "#059669 !important" }} />}
            label="Completed"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "11.5px",
              bgcolor: "#ECFDF5",
              color: "#059669",
              border: "1px solid #A7F3D0",
            }}
          />
        );
      case "P":
        return (
          <Chip
            icon={<AccessTime sx={{ fontSize: "14px !important", color: "#D97706 !important" }} />}
            label="Prep Complete"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "11.5px",
              bgcolor: "#FFFBEB",
              color: "#D97706",
              border: "1px solid #FDE68A",
            }}
          />
        );
      default:
        return (
          <Chip
            label="Under Review"
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "11.5px",
              bgcolor: "#F1F5F9",
              color: "#475569",
            }}
          />
        );
    }
  };

  // Stats counters
  const totalCount = records.length;
  const completedCount = records.filter((r) => r.MTD_TREATMENT_STATUS === "C").length;
  const pendingCount = records.filter((r) => r.MTD_TREATMENT_STATUS === "P").length;
  const latestDate = records[0]?.MTD_CREATED_DATE ? formatDate(records[0]?.MTD_CREATED_DATE) : "None";

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
        activePage="medical-history"
        onBookAppointment={() => setAppointmentPopup(true)}
        breadcrumbSubtitle="Medical History & Clinical Archive"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. FULL WIDTH PAGE HERO BANNER
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: "320px", md: "380px" },
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
            src={medical_bg}
            alt="Medical History Background"
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
            <Box sx={{ maxWidth: 650 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  bgcolor: "rgba(94, 234, 212, 0.15)",
                  color: "#5EEAD4",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  mb: 2,
                  border: "1px solid rgba(94, 234, 212, 0.3)",
                }}
              >
                <MedicalServices sx={{ fontSize: 14 }} />
                <span>CLINICAL TREATMENT RECORDS</span>
              </Box>

              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2rem", md: "2.8rem" },
                  letterSpacing: "-0.02em",
                  mb: 1.5,
                  lineHeight: 1.1,
                }}
              >
                Patient Medical History
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.88)",
                  fontSize: "1.05rem",
                  lineHeight: 1.6,
                }}
              >
                Your encrypted clinical record archive. Review your past doctor consultations, verified diagnostics, pharmaceutical prescriptions, and treatment notes.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={() => setAppointmentPopup(true)}
                startIcon={<CalendarToday sx={{ fontSize: 18 }} />}
                sx={{
                  background: "#FFFFFF",
                  color: "#0A6E7C",
                  fontWeight: 800,
                  fontSize: "14px",
                  borderRadius: "14px",
                  px: 3,
                  py: 1.2,
                  textTransform: "none",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  "&:hover": {
                    background: "#F0FDFA",
                    color: "#085B67",
                  },
                }}
              >
                New Appointment
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content Container */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, pb: 4, mt: { xs: -5, md: -8 }, position: "relative", zIndex: 4 }}>

        {/* ─────────────────────────────────────────────────────────────
            3. KEY STATS CARDS
        ───────────────────────────────────────────────────────────── */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "12px",
                  bgcolor: "#E0F2FE",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ReceiptLong />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                  {totalCount}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                  Total Visits
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "12px",
                  bgcolor: "#ECFDF5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                  {completedCount}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                  Completed
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "12px",
                  bgcolor: "#FFFBEB",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccessTime />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                  {pendingCount}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                  In Preparation
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "12px",
                  bgcolor: "#F1F5F9",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarToday />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                  {latestDate}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                  Last Consultation
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* ─────────────────────────────────────────────────────────────
            4. SEARCH & FILTER TOOLBAR
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(12px)",
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {/* Search bar */}
          <TextField
            size="small"
            placeholder="Search by doctor name or treatment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#94A3B8", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "#F8FAFC",
              },
            }}
          />

          {/* Filter Chips */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#64748B", mr: 1 }}>
              <FilterList sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>Filter:</Typography>
            </Box>

            {["ALL", "C", "P"].map((status) => (
              <Chip
                key={status}
                label={status === "ALL" ? "All Treatments" : status === "C" ? "Completed" : "In Prep"}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700,
                  fontSize: "12px",
                  borderRadius: "10px",
                  bgcolor: statusFilter === status ? "#0284C7" : "transparent",
                  color: statusFilter === status ? "#FFFFFF" : "#64748B",
                  borderColor: statusFilter === status ? "#0284C7" : "#CBD5E1",
                  "&:hover": {
                    bgcolor: statusFilter === status ? "#0369A1" : "#F1F5F9",
                  },
                }}
              />
            ))}

            <Tooltip title="Refresh Records">
              <IconButton onClick={fetchRecords} size="small" sx={{ color: "#64748B" }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            5. MEDICAL RECORDS LIST / TABLE
        ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
            <CircularProgress sx={{ color: "#0A6E7C" }} />
          </Box>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: "18px",
              textAlign: "center",
              bgcolor: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <InfoOutlined sx={{ fontSize: 48, color: "#94A3B8", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
              No Medical History Records
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", maxWidth: 450, mx: "auto", mb: 2 }}>
              {error}
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
              Book Your First Appointment
            </Button>
          </Paper>
        ) : filteredRecords.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: "18px",
              textAlign: "center",
              bgcolor: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <Search sx={{ fontSize: 44, color: "#94A3B8", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
              No matching records found
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
              Try clearing the search query or changing the status filter.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              sx={{ borderRadius: "10px", textTransform: "none" }}
            >
              Reset Filters
            </Button>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "18px",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: "rgba(248, 250, 252, 0.5)", borderBottom: "2px solid rgba(226, 232, 240, 0.5)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12.5px" }}>
                    TREATMENT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12.5px" }}>
                    CONSULTATION DATE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12.5px" }}>
                    ATTENDING DOCTOR
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#334155", fontSize: "12.5px" }}>
                    STATUS
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#334155", fontSize: "12.5px" }}>
                    ACTION
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record, index) => {
                  const treatmentNumber = records.length - records.indexOf(record);
                  return (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        transition: "background 0.15s ease",
                        "&:hover": { bgcolor: "#F0F9FF" },
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      {/* Treatment Number */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: "10px",
                              bgcolor: "rgba(2, 132, 199, 0.08)",
                              color: "#0284C7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "12px",
                            }}
                          >
                            #{treatmentNumber}
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "13.5px", color: "#0F172A" }}>
                              Treatment {treatmentNumber}
                            </Typography>
                            <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                              Ref: SN-{record.MTD_SERIAL_NO}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 15, color: "#0284C7" }} />
                          <Typography sx={{ fontSize: "13.5px", color: "#334155", fontWeight: 600 }}>
                            {formatDate(record.MTD_CREATED_DATE)}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Doctor */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              bgcolor: "#E0F2FE",
                              color: "#0369A1",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {record.MTD_DOCTOR ? record.MTD_DOCTOR.charAt(0) : "D"}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "13.5px", color: "#0F172A" }}>
                              Dr. {record.MTD_DOCTOR}
                            </Typography>
                            <Typography sx={{ fontSize: "11px", color: "#0A6E7C", fontWeight: 600 }}>
                              Consulting Specialist
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusChip(record.MTD_TREATMENT_STATUS)}</TableCell>

                      {/* Action Button */}
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility sx={{ fontSize: 16 }} />}
                          onClick={() =>
                            viewdetails(
                              record.MTD_PATIENT_CODE,
                              record.MTD_SERIAL_NO,
                              treatmentNumber,
                              record.MTD_DOCTOR,
                              record.MTD_CREATED_DATE,
                              record.MTD_TREATMENT_STATUS
                            )
                          }
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "12.5px",
                            color: "#0284C7",
                            borderColor: "#BAE6FD",
                            px: 1.8,
                            py: 0.6,
                            "&:hover": {
                              bgcolor: "#0284C7",
                              color: "#FFFFFF",
                              borderColor: "#0284C7",
                            },
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          6. TREATMENT DETAILS MODAL (PREMIUM REDESIGN)
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : "20px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(15, 23, 42, 0.25)",
          },
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
            color: "#FFFFFF",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LocalHospital sx={{ color: "#FFFFFF", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.2 }}>
                Treatment #{selectedRecordHeader?.treatmentNo} Details
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.85)" }}>
                Dr. {selectedRecordHeader?.doctor} • {formatDate(selectedRecordHeader?.date)}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={closeModal}
            sx={{
              color: "#FFFFFF",
              bgcolor: "rgba(255, 255, 255, 0.15)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: "#F8FAFC" }}>
          {detailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
              <CircularProgress sx={{ color: "#0A6E7C" }} />
            </Box>
          ) : details ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Header Info Chips */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                    Patient ID:
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                    {patientid}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                    Status:
                  </Typography>
                  {getStatusChip(selectedRecordHeader?.status)}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                    Doctor:
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                    Dr. {selectedRecordHeader?.doctor}
                  </Typography>
                </Box>
              </Paper>

              {/* 1. Chief Complaint */}
              <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Notes sx={{ fontSize: 18, color: "#0284C7" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0F172A" }}>
                    PATIENT COMPLAINT
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography sx={{ fontSize: "14px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {details.MTD_COMPLAIN || "No specific complaint recorded."}
                  </Typography>
                </CardContent>
              </Card>

              {/* 2. Diagnostics */}
              <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <MedicalServices sx={{ fontSize: 18, color: "#0A6E7C" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0F172A" }}>
                    CLINICAL DIAGNOSTICS & FINDINGS
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography sx={{ fontSize: "14px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {details.MTD_DIAGNOSTICS || "No clinical diagnostic records attached."}
                  </Typography>
                </CardContent>
              </Card>

              {/* 3. Prescribed Medications */}
              <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Medication sx={{ fontSize: 18, color: "#6366F1" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0F172A" }}>
                    PRESCRIBED MEDICATIONS & ALLOCATIONS
                  </Typography>
                </Box>

                {details.Drugs && details.Drugs.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#F1F5F9" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                            Drug Name
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                            Quantity
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                            Dosage & Schedule
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {details.Drugs.map((drug, dIndex) => (
                          <TableRow key={dIndex} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Medication sx={{ fontSize: 16, color: "#0284C7" }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "13px", color: "#0F172A" }}>
                                  {drug.DrugName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${drug.MDD_QUANTITY} units`}
                                size="small"
                                sx={{
                                  bgcolor: "#E0F2FE",
                                  color: "#0369A1",
                                  fontWeight: 700,
                                  fontSize: "11px",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={drug.MDD_TAKES}
                                size="small"
                                sx={{
                                  bgcolor: "#F1F5F9",
                                  color: "#334155",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 3, textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                    No specific drugs allocated for this consultation.
                  </Box>
                )}
              </Card>

              {/* 4. Doctor Remarks */}
              <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Notes sx={{ fontSize: 18, color: "#0A6E7C" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0F172A" }}>
                    DOCTOR'S CLINICAL REMARKS & ADVICE
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography sx={{ fontSize: "14px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {details.MTD_REMARKS || "No special physician remarks noted."}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="error">Failed to load detailed record.</Typography>
            </Box>
          )}
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ p: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <Button
            onClick={() => window.print()}
            startIcon={<Print />}
            sx={{ textTransform: "none", color: "#64748B", fontWeight: 700 }}
          >
            Print Summary
          </Button>
          <Button
            onClick={closeModal}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #0A6E7C, #0284C7)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            Close Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          7. APPOINTMENT BOOKING MODAL
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
          8. FOOTER
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
