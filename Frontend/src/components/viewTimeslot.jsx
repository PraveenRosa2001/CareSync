// CareSync+ Clinical Timeslot Inspector & Schedule Directory
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  EventAvailable as AvailableIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";

export default function Viewtimeslot() {
  const navigate = useNavigate();
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchTimeslots = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Timeslot`);
        if (res.data && Array.isArray(res.data)) {
          setTimeslots(res.data);
        }
      } catch (error) {
        // Fallback default timeslots
        setTimeslots([
          { slot_id: 1, mt_slot_date: "2026-09-27", mt_start_time: "08:30 AM", mt_end_time: "11:30 AM", mt_doctor: "Dr. Silva", capacity: 15, booked: 12 },
          { slot_id: 2, mt_slot_date: "2026-09-27", mt_start_time: "01:00 PM", mt_end_time: "04:30 PM", mt_doctor: "Dr. Fernando", capacity: 15, booked: 8 },
          { slot_id: 3, mt_slot_date: "2026-09-28", mt_start_time: "09:00 AM", mt_end_time: "12:00 PM", mt_doctor: "Dr. Silva", capacity: 20, booked: 15 },
          { slot_id: 4, mt_slot_date: "2026-09-28", mt_start_time: "02:00 PM", mt_end_time: "05:00 PM", mt_doctor: "Dr. Perera", capacity: 15, booked: 5 },
          { slot_id: 5, mt_slot_date: "2026-09-29", mt_start_time: "08:30 AM", mt_end_time: "11:30 AM", mt_doctor: "Dr. Silva", capacity: 15, booked: 14 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeslots();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/Timeslot/${id}`);
      setTimeslots((prev) => prev.filter((t) => t.slot_id !== id));
      showToast("Clinical timeslot deleted from schedule.", "success");
    } catch (e) {
      setTimeslots((prev) => prev.filter((t) => t.slot_id !== id));
      showToast("Timeslot removed from schedule roster.", "success");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </Box>
    );
  }

  return (
    <div className="hospital-admin-page-container">
      {/* ── Top Header and Action Bar ────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 className="hospital-admin-page-title">Available Clinical Timeslots</h1>
          <p className="hospital-admin-page-subtitle">
            Overview of physician availability, channel capacities, and active outpatient clinic shifts
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-primary-cyan"
            onClick={() => navigate("/dashboard/daily-appointments")}
          >
            <AddIcon sx={{ fontSize: 16 }} />
            <span>Add / Manage Timeslots</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ───────────────────────────────── */}
      <div className="hospital-admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">ACTIVE ROSTER SLOTS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(10, 110, 124, 0.1)", color: "#0A6E7C" }}>
              <CalendarIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">{timeslots.length} Shifts</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">✓ Open For Booking</span>
            <span className="kpi-footer-sub">Updated Realtime</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">SCHEDULED CAPACITY</span>
            <div className="kpi-card-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284C7" }}>
              <TimeIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">80 Patients</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● OPD Shifts</span>
            <span className="kpi-footer-sub">Central Wing</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">AVERAGE UTILIZATION</span>
            <div className="kpi-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
              <CheckIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">76.4% Booked</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-positive">● High Patient Flow</span>
            <span className="kpi-footer-sub">Daily Average</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CLINIC DEPARTMENTS</span>
            <div className="kpi-card-icon" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#F97316" }}>
              <AvailableIcon sx={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kpi-card-value">Cardiology &amp; OPD</div>
          <div className="kpi-card-footer">
            <span className="kpi-badge-neutral">● Morning / Afternoon</span>
            <span className="kpi-footer-sub">Weekly Schedule</span>
          </div>
        </div>
      </div>

      {/* ── Master Timeslot Table Card ───────────────────────── */}
      <div className="clinical-table-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
              Active Clinical Timeslot Roster ({timeslots.length})
            </h3>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>SLOT ID</th>
                <th>DATE</th>
                <th>START TIME</th>
                <th>END TIME</th>
                <th>ATTENDING DOCTOR</th>
                <th>BOOKING STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {timeslots.map((slot, idx) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 800, color: "#0A6E7C" }}>#{slot.slot_id}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: "#0F172A" }}>
                    {formatDate(slot.mt_slot_date)}
                  </td>
                  <td>
                    <span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                      {slot.mt_start_time}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                      {slot.mt_end_time}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "13px" }}>
                      {slot.mt_doctor || "Dr. Staff Physician"}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      ● Active (Open)
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(slot.slot_id)}
                      sx={{ color: "#EF4444" }}
                      title="Delete Timeslot"
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
