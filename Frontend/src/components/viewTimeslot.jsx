import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  CircularProgress,
  IconButton,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  DeleteOutline as DeleteIcon,
  EventAvailable as AvailableIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const normalizeDateKey = (value) => (value ? String(value).split("T")[0] : "");

const formatDate = (value) => {
  if (!value) return "Not recorded";
  const key = normalizeDateKey(value);
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
};

const formatTime = (value) => {
  if (!value) return "Not recorded";
  const [hour = "0", minute = "0"] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const displayDoctorName = (name) => {
  const clean = String(name || "").trim();
  if (!clean) return "Doctor name not recorded";
  return /^dr\.?\s/i.test(clean) ? clean : `Dr. ${clean}`;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  return data?.error || data?.message || fallback;
};

export default function Viewtimeslot() {
  const navigate = useNavigate();
  const [timeslots, setTimeslots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const authConfig = () => {
    const token = localStorage.getItem("Token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotResponse, doctorResponse] = await Promise.all([
        axios.get(`${API_BASE}/Timeslot/active-timeslots`),
        axios.get(`${API_BASE}/User/doctors`, authConfig()),
      ]);

      setTimeslots(Array.isArray(slotResponse.data) ? slotResponse.data : []);
      setDoctors(Array.isArray(doctorResponse.data) ? doctorResponse.data : []);
    } catch (error) {
      setTimeslots([]);
      showToast(getErrorMessage(error, "Unable to load the timeslot directory."), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const doctorMap = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.UserId, doctor])),
    [doctors]
  );

  const rows = useMemo(() => {
    return timeslots.map((slot) => {
      const doctor = doctorMap.get(slot.MT_USER_ID);
      const booked = Number(slot.MT_PATIENT_NO ?? 0);
      const maximum = Number(slot.MT_MAXIMUM_PATIENTS ?? 0);
      const fill = maximum > 0 ? Math.round((booked / maximum) * 100) : 0;

      return {
        ...slot,
        doctorName: displayDoctorName(slot.MT_DOCTOR || doctor?.FullName || doctor?.UserName),
        specialization: doctor?.Specialization || "Specialization not recorded",
        booked,
        maximum,
        fill,
        status: maximum > 0 && booked >= maximum ? "Full" : fill >= 80 ? "Almost Full" : "Available",
      };
    });
  }, [timeslots, doctorMap]);

  const totalCapacity = rows.reduce((sum, slot) => sum + slot.maximum, 0);
  const totalBooked = rows.reduce((sum, slot) => sum + slot.booked, 0);
  const utilization = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
  const departmentCount = new Set(
    rows.map((slot) => slot.specialization).filter((value) => value && value !== "Specialization not recorded")
  ).size;

  const handleDeactivate = async (slot) => {
    if (slot.booked > 0) {
      showToast("This slot has booked patients and cannot be deactivated until those appointments are handled.", "warning");
      return;
    }

    if (!window.confirm(`Deactivate timeslot #${slot.MT_SLOT_ID} for ${slot.doctorName}?`)) return;

    try {
      await axios.put(`${API_BASE}/Timeslot/update-status/${slot.MT_SLOT_ID}`, {}, authConfig());
      showToast("Timeslot deactivated successfully.", "success");
      await loadData();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to deactivate the timeslot."), "error");
    }
  };

  if (loading) {
    return (
      <div className="hospital-admin-page-container" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </div>
    );
  }

  return (
    <div className="hospital-admin-page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="hospital-admin-page-title">Available Clinical Timeslots</h1>
          <p className="hospital-admin-page-subtitle">Live physician availability and booking capacity from the CareSync database.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary-white" onClick={loadData}>
            <RefreshIcon sx={{ fontSize: 16 }} /> Refresh
          </button>
          <button className="btn-primary-cyan" onClick={() => navigate("/dashboard/daily-appointments")}>
            <AddIcon sx={{ fontSize: 16 }} /> Manage Timeslots
          </button>
        </div>
      </div>

      <div className="hospital-admin-kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-metric-card">
          <div className="kpi-card-header"><span className="kpi-card-title">ACTIVE ROSTER SLOTS</span><div className="kpi-card-icon"><CalendarIcon sx={{ fontSize: 19 }} /></div></div>
          <div className="kpi-card-value">{rows.length} Shifts</div>
          <div className="kpi-card-footer"><span className="kpi-badge-positive">Live Database</span></div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header"><span className="kpi-card-title">SCHEDULED CAPACITY</span><div className="kpi-card-icon"><TimeIcon sx={{ fontSize: 19 }} /></div></div>
          <div className="kpi-card-value">{totalCapacity} Patients</div>
          <div className="kpi-card-footer"><span className="kpi-badge-neutral">{totalBooked} booked</span></div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header"><span className="kpi-card-title">CURRENT UTILIZATION</span><div className="kpi-card-icon"><CheckIcon sx={{ fontSize: 19 }} /></div></div>
          <div className="kpi-card-value">{utilization}% Booked</div>
          <div className="kpi-card-footer"><span className="kpi-badge-positive">Calculated from live slots</span></div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-header"><span className="kpi-card-title">CLINICAL SPECIALTIES</span><div className="kpi-card-icon"><AvailableIcon sx={{ fontSize: 19 }} /></div></div>
          <div className="kpi-card-value">{departmentCount || "—"}</div>
          <div className="kpi-card-footer"><span className="kpi-badge-neutral">Active roster coverage</span></div>
        </div>
      </div>

      <div className="clinical-table-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <CalendarIcon sx={{ fontSize: 18, color: "#0A6E7C" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Active Clinical Timeslot Roster ({rows.length})</h3>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 35, border: "1px dashed #CBD5E1", borderRadius: 12, textAlign: "center", color: "#64748B" }}>
            No active upcoming timeslots are recorded.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>SLOT</th><th>DATE</th><th>TIME</th><th>ATTENDING DOCTOR</th><th>ROOM / CHANNEL</th><th>CAPACITY</th><th>STATUS</th><th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((slot) => (
                  <tr key={slot.MT_SLOT_ID}>
                    <td><strong style={{ color: "#0A6E7C" }}>#{slot.MT_SLOT_ID}</strong></td>
                    <td style={{ fontWeight: 700 }}>{formatDate(slot.MT_SLOT_DATE)}</td>
                    <td>{formatTime(slot.MT_START_TIME)} - {formatTime(slot.MT_END_TIME)}</td>
                    <td><strong>{slot.doctorName}</strong><div style={{ color: "#64748B", fontSize: 11 }}>{slot.specialization}</div></td>
                    <td>{slot.MT_CLINIC_ROOM || "Not recorded"}<div style={{ color: "#64748B", fontSize: 11 }}>{slot.MT_DELIVERY_CHANNEL || "Not recorded"}</div></td>
                    <td>{slot.booked} / {slot.maximum || "—"}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 800, color: slot.status === "Full" ? "#DC2626" : slot.status === "Almost Full" ? "#C2410C" : "#059669" }}>● {slot.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <IconButton size="small" onClick={() => handleDeactivate(slot)} sx={{ color: "#EF4444" }} title="Deactivate Timeslot"><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={4500} onClose={() => setSnackbar((current) => ({ ...current, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((current) => ({ ...current, open: false }))} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "10px" }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
