import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  MedicalServices as MedicalIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  People as GroupIcon,
  Videocam as VideoIcon,
  LocalHospital as HospitalIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  InfoOutlined as InfoIcon,
  ViewAgenda as CardViewIcon,
  TableRows as TableViewIcon,
} from "@mui/icons-material";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const inputShellStyle = {
  display: "flex",
  alignItems: "center",
  background: "#F8FAFC",
  border: "1px solid #CBD5E1",
  borderRadius: "8px",
  padding: "8px 12px",
  gap: "8px",
};

const inputStyle = {
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "12.5px",
  fontWeight: 600,
  color: "#0F172A",
  width: "100%",
};

const labelStyle = {
  fontSize: "11.5px",
  fontWeight: 700,
  color: "#334155",
  display: "block",
  marginBottom: "4px",
};

const pad = (value) => String(value).padStart(2, "0");

const toLocalDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const todayKey = () => toLocalDateKey(new Date());

const normalizeDateKey = (value) => {
  if (!value) return "";
  return String(value).split("T")[0];
};

const parseTimeToMinutes = (value) => {
  if (!value) return 0;
  const [hour = "0", minute = "0"] = String(value).split(":");
  return Number(hour) * 60 + Number(minute);
};

const formatTime = (value) => {
  if (!value) return "Not recorded";
  const [hour = "0", minute = "0"] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

const looksLikeJwt = (token) =>
  typeof token === "string" && token.split(".").length === 3;

export default function DailyAppointment() {
  const [rawSlots, setRawSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [viewMode, setViewMode] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  const [patientListModal, setPatientListModal] = useState(false);
  const [selectedSlotForPatients, setSelectedSlotForPatients] = useState(null);
  const [slotPatients, setSlotPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const role = localStorage.getItem("Role") || "";
  const loggedInUserId = localStorage.getItem("id") || "";
  const isDoctorLogin = role === "Doc";

  const [doctorSelect, setDoctorSelect] = useState("");
  const [slotDate, setSlotDate] = useState(todayKey());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [maxPatients, setMaxPatients] = useState(20);
  const [clinicRoom, setClinicRoom] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState("Physical");

  const showToast = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleUnauthorized = useCallback(() => {
    // Do not destroy the whole staff session because one protected API call returned 401.
    // A backend JWT configuration mismatch can produce 401 even when the user has just
    // signed in successfully. Keep the current dashboard/session intact and surface the
    // authorization error instead.
    showToast(
      "The API rejected the current staff authorization token. Please restart the backend and sign in once again.",
      "warning"
    );
  }, [showToast]);

  const authConfig = useCallback(() => {
    const token = localStorage.getItem("Token");

    if (!looksLikeJwt(token)) {
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
  }, []);

  const fetchDoctors = useCallback(async () => {
    const config = authConfig();
    if (!config) {
      handleUnauthorized();
      throw new Error("A valid staff JWT is required.");
    }

    const response = await axios.get(`${API_BASE}/User/doctors`, config);
    const list = Array.isArray(response.data) ? response.data : [];

    const permittedDoctors = isDoctorLogin
      ? list.filter((doctor) => doctor.UserId === loggedInUserId)
      : list;

    setDoctors(permittedDoctors);
    return permittedDoctors;
  }, [authConfig, handleUnauthorized, isDoctorLogin, loggedInUserId]);

  const fetchTimeslots = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await axios.get(`${API_BASE}/Timeslot/active-timeslots`);
      setRawSlots(Array.isArray(response.data) ? response.data : []);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  const loadScheduler = useCallback(async () => {
    setLoading(true);
    const [doctorResult, slotResult] = await Promise.allSettled([
      fetchDoctors(),
      axios.get(`${API_BASE}/Timeslot/active-timeslots`),
    ]);

    if (doctorResult.status === "rejected") {
      setDoctors([]);
      showToast(
        getErrorMessage(doctorResult.reason, "Unable to load the active doctor directory."),
        "error"
      );
    }

    if (slotResult.status === "fulfilled") {
      setRawSlots(Array.isArray(slotResult.value.data) ? slotResult.value.data : []);
    } else {
      setRawSlots([]);
      showToast(
        getErrorMessage(slotResult.reason, "Unable to load the live timeslot roster."),
        "error"
      );
    }

    setLoading(false);
  }, [fetchDoctors, showToast]);

  useEffect(() => {
    loadScheduler();
  }, [loadScheduler]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchTimeslots(true).catch(() => {
        // Silent refresh failures do not erase the last confirmed roster.
      });
    }, 30000);

    return () => window.clearInterval(timer);
  }, [fetchTimeslots]);

  useEffect(() => {
    if (!doctors.length) {
      setDoctorSelect("");
      return;
    }

    if (isDoctorLogin) {
      const ownDoctor = doctors.find((doctor) => doctor.UserId === loggedInUserId);
      setDoctorSelect(ownDoctor?.UserId || "");
      return;
    }

    setDoctorSelect((current) =>
      doctors.some((doctor) => doctor.UserId === current)
        ? current
        : doctors[0].UserId
    );
  }, [doctors, isDoctorLogin, loggedInUserId]);

  const doctorById = useMemo(() => {
    return new Map(doctors.map((doctor) => [doctor.UserId, doctor]));
  }, [doctors]);

  const slots = useMemo(() => {
    return rawSlots.map((slot) => {
      let doctor = doctorById.get(slot.MT_USER_ID);

      if (!doctor && slot.MT_DOCTOR) {
        const savedName = String(slot.MT_DOCTOR).trim().toLowerCase();
        doctor = doctors.find((candidate) => {
          const fullName = String(candidate.FullName || "").trim().toLowerCase();
          const userName = String(candidate.UserName || "").trim().toLowerCase();
          return savedName === fullName || savedName === userName;
        });
      }

      const booked = Number(slot.MT_PATIENT_NO ?? 0);
      const max = Number(slot.MT_MAXIMUM_PATIENTS ?? 0);
      const percent = max > 0 ? Math.round((booked / max) * 100) : 0;
      const status = max > 0 && booked >= max
        ? "Full"
        : percent >= 80
        ? "Almost Full"
        : "Available";

      const doctorName = slot.MT_DOCTOR || doctor?.FullName || doctor?.UserName;

      return {
        id: Number(slot.MT_SLOT_ID),
        doctorUserId: slot.MT_USER_ID || doctor?.UserId || "",
        doctor: displayDoctorName(doctorName),
        specialty: doctor?.Specialization || "Specialization not recorded",
        startTime: slot.MT_START_TIME,
        endTime: slot.MT_END_TIME,
        time: `${formatTime(slot.MT_START_TIME)} - ${formatTime(slot.MT_END_TIME)}`,
        room: slot.MT_CLINIC_ROOM || "Room not recorded",
        deliveryChannel: slot.MT_DELIVERY_CHANNEL || "Not recorded",
        booked,
        max,
        status,
        percent,
        date: normalizeDateKey(slot.MT_SLOT_DATE),
        initials: String(doctorName || "D")
          .replace(/^Dr\.?\s*/i, "")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join("") || "DR",
      };
    });
  }, [rawSlots, doctorById, doctors]);

  const dateTabs = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: toLocalDateKey(date),
        label:
          index === 0
            ? "Today"
            : index === 1
            ? "Tomorrow"
            : date.toLocaleDateString("en-US", { weekday: "long" }),
        sub: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "2-digit",
        }),
      };
    });
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.UserId === doctorSelect) || null,
    [doctors, doctorSelect]
  );

  const selectedDateSlots = useMemo(
    () => slots.filter((slot) => slot.date === selectedDate),
    [slots, selectedDate]
  );

  const filteredSlots = useMemo(() => {
    return selectedDateSlots.filter((slot) => {
      if (statusFilter !== "All Statuses" && slot.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        return [slot.doctor, slot.specialty, slot.room, String(slot.id)]
          .some((value) => String(value || "").toLowerCase().includes(query));
      }

      return true;
    });
  }, [selectedDateSlots, statusFilter, searchQuery]);

  const todaySlots = useMemo(
    () => slots.filter((slot) => slot.date === todayKey()),
    [slots]
  );

  const todaysConsultations = todaySlots.reduce((sum, slot) => sum + slot.booked, 0);
  const activeDutyDoctors = new Set(
    todaySlots.map((slot) => slot.doctorUserId || slot.doctor)
  ).size;
  const availableTimeslots = todaySlots.filter((slot) => slot.status !== "Full").length;
  const totalTodayCapacity = todaySlots.reduce((sum, slot) => sum + slot.max, 0);
  const fillRate = totalTodayCapacity > 0
    ? Math.round((todaysConsultations / totalTodayCapacity) * 100)
    : 0;

  const averageAppointmentInterval = useMemo(() => {
    const validIntervals = todaySlots
      .filter((slot) => slot.max > 0)
      .map((slot) => {
        const duration = parseTimeToMinutes(slot.endTime) - parseTimeToMinutes(slot.startTime);
        return duration > 0 ? duration / slot.max : 0;
      })
      .filter((value) => value > 0);

    if (!validIntervals.length) return 0;
    return Math.max(
      1,
      Math.round(validIntervals.reduce((sum, value) => sum + value, 0) / validIntervals.length)
    );
  }, [todaySlots]);

  const handleCreateTimeslot = async (event) => {
    event.preventDefault();

    if (!doctorSelect) {
      showToast("Please select an active doctor.", "warning");
      return;
    }

    if (!clinicRoom.trim()) {
      showToast("Please enter the clinic room or station.", "warning");
      return;
    }

    if (slotDate < todayKey()) {
      showToast("A timeslot cannot be created for a past date.", "warning");
      return;
    }

    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      showToast("End time must be later than start time.", "warning");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        SlotDate: slotDate,
        StartTime: `${startTime}:00`,
        EndTime: `${endTime}:00`,
        MaximumPatients: Number(maxPatients),
        DoctorUserId: doctorSelect,
        ClinicRoom: clinicRoom.trim(),
        DeliveryChannel: deliveryChannel,
      };

      const config = authConfig();
      if (!config) {
        handleUnauthorized();
        return;
      }

      const response = await axios.post(`${API_BASE}/Timeslot`, payload, config);
      const createdId = response.data?.MT_SLOT_ID;

      showToast(
        `Timeslot${createdId ? ` #${createdId}` : ""} created for ${displayDoctorName(
          selectedDoctor?.FullName || selectedDoctor?.UserName
        )}.`,
        "success"
      );

      setSelectedDate(slotDate);
      await fetchTimeslots(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
      } else {
        showToast(
          getErrorMessage(error, "The timeslot could not be created. Please try again."),
          error?.response?.status === 409 ? "warning" : "error"
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleViewPatients = async (slot) => {
    setSelectedSlotForPatients(slot);
    setPatientListModal(true);
    setPatientsLoading(true);
    setSlotPatients([]);

    try {
      const response = await axios.get(`${API_BASE}/Appointment/appointments/${slot.id}`);
      setSlotPatients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (error?.response?.status !== 404) {
        showToast(
          getErrorMessage(error, "Unable to load the patient roster for this timeslot."),
          "error"
        );
      }
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleCancelSlot = async (slot) => {
    if (slot.booked > 0) {
      showToast(
        "This timeslot has booked patients. Reassign or cancel those appointments before deactivating it.",
        "warning"
      );
      return;
    }

    if (!window.confirm(`Deactivate timeslot #${slot.id} for ${slot.doctor}?`)) return;

    try {
      const config = authConfig();
      if (!config) {
        handleUnauthorized();
        return;
      }

      await axios.put(`${API_BASE}/Timeslot/update-status/${slot.id}`, {}, config);
      showToast(`Timeslot #${slot.id} deactivated successfully.`, "success");
      await fetchTimeslots(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
      } else {
        showToast(
          getErrorMessage(error, "Unable to deactivate this timeslot."),
          error?.response?.status === 409 ? "warning" : "error"
        );
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchDoctors(), fetchTimeslots(true)]);
      showToast("Doctor directory and timeslot roster refreshed.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to refresh scheduler data."), "error");
    } finally {
      setRefreshing(false);
    }
  };

  const exportSelectedRoster = () => {
    if (!selectedDateSlots.length) {
      showToast("There are no timeslots on the selected date to export.", "info");
      return;
    }

    const rows = [
      ["Slot ID", "Date", "Doctor", "Specialization", "Start", "End", "Room", "Channel", "Booked", "Capacity", "Status"],
      ...selectedDateSlots.map((slot) => [
        slot.id,
        slot.date,
        slot.doctor,
        slot.specialty,
        formatTime(slot.startTime),
        formatTime(slot.endTime),
        slot.room,
        slot.deliveryChannel,
        slot.booked,
        slot.max,
        slot.status,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `caresync-timeslots-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const renderStatusPill = (slot) => {
    const full = slot.status === "Full";
    const almost = slot.status === "Almost Full";
    return (
      <span
        style={{
          background: full ? "#FEF2F2" : almost ? "#FFF7ED" : "#ECFDF5",
          color: full ? "#DC2626" : almost ? "#C2410C" : "#059669",
          fontSize: "11.5px",
          fontWeight: 800,
          padding: "4px 10px",
          borderRadius: "12px",
          whiteSpace: "nowrap",
        }}
      >
        ● {slot.status}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        className="hospital-admin-page-container"
        style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <CircularProgress size={30} sx={{ color: "#0077A8" }} />
          <div style={{ marginTop: 10, color: "#64748B", fontSize: 13 }}>
            Loading doctor directory and live roster...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-admin-page-container">
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">Clinical Timeslot &amp; Appointment Scheduler</h1>
          <p className="page-subtitle-text">
            Schedule verified CareSync doctors, prevent roster conflicts, and monitor live booking capacity from one workspace.
          </p>
        </div>

        <div className="page-action-group">
          <button className="btn-secondary-white" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <CircularProgress size={15} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
            <span>Refresh Roster</span>
          </button>
          <button className="btn-secondary-white" onClick={exportSelectedRoster}>
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Export Selected Day</span>
          </button>
        </div>
      </div>

      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">TODAY'S BOOKINGS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{todaysConsultations}</span>
              <span className="kpi-delta-pill blue">
                {todaySlots.length} scheduled slot{todaySlots.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="kpi-icon-box blue"><GroupIcon sx={{ fontSize: 22 }} /></div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">ACTIVE DUTY DOCTORS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">
                {activeDutyDoctors}
                <span style={{ fontSize: "16px", color: "#64748B" }}> / {doctors.length} Registered</span>
              </span>
            </div>
            <div className="kpi-subtext">Based on today's active roster</div>
          </div>
          <div className="kpi-icon-box teal"><MedicalIcon sx={{ fontSize: 22 }} /></div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">AVAILABLE TIMESLOTS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">
                {availableTimeslots}
                <span style={{ fontSize: "16px", color: "#64748B" }}> Today</span>
              </span>
              <span className="kpi-delta-pill blue">{fillRate}% Fill Rate</span>
            </div>
          </div>
          <div className="kpi-icon-box purple"><CalendarIcon sx={{ fontSize: 22 }} /></div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">AVG APPOINTMENT INTERVAL</div>
            <div className="kpi-val-row">
              <span className="kpi-number">
                {averageAppointmentInterval || "—"}
                <span style={{ fontSize: "16px", color: "#64748B" }}>
                  {averageAppointmentInterval ? " mins" : ""}
                </span>
              </span>
            </div>
            <div className="kpi-subtext">Derived from today's duration and capacity</div>
          </div>
          <div className="kpi-icon-box blue"><TimeIcon sx={{ fontSize: 22 }} /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(330px, 0.9fr) minmax(520px, 1.6fr)", gap: "24px" }}>
        <div className="clinical-table-card" style={{ padding: "22px", alignSelf: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#E0F2FE", color: "#0284C7", display: "grid", placeItems: "center" }}>
                <AddIcon sx={{ fontSize: 22 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>Add New Timeslot</h3>
                <div style={{ fontSize: "12px", color: "#64748B" }}>Create a validated physician schedule</div>
              </div>
            </div>
            <span style={{ background: "#E0F2FE", color: "#0284C7", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px" }}>
              {isDoctorLogin ? "Own Schedule" : "Shift Admin"}
            </span>
          </div>

          <form onSubmit={handleCreateTimeslot} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={labelStyle}>Attending Physician *</label>
                <span style={{ fontSize: "11px", color: doctors.length ? "#059669" : "#DC2626", fontWeight: 700 }}>
                  {doctors.length ? `${doctors.length} active doctor${doctors.length === 1 ? "" : "s"}` : "No active doctors"}
                </span>
              </div>
              <div style={inputShellStyle}>
                <PersonIcon sx={{ fontSize: 16, color: "#64748B" }} />
                <select
                  style={{ ...inputStyle, cursor: isDoctorLogin ? "not-allowed" : "pointer" }}
                  value={doctorSelect}
                  onChange={(event) => setDoctorSelect(event.target.value)}
                  disabled={isDoctorLogin || doctors.length === 0}
                  required
                >
                  {doctors.length === 0 ? (
                    <option value="">No active doctor accounts found</option>
                  ) : (
                    doctors.map((doctor) => (
                      <option key={doctor.UserId} value={doctor.UserId}>
                        {displayDoctorName(doctor.FullName || doctor.UserName)} — {doctor.Specialization || "Specialization not recorded"}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {selectedDoctor && (
                <div style={{ marginTop: 6, fontSize: 11.5, color: "#64748B" }}>
                  Staff ID: <strong>{selectedDoctor.UserId}</strong> • {selectedDoctor.Specialization || "Specialization not recorded"}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Consultation Date *</label>
              <div style={inputShellStyle}>
                <CalendarIcon sx={{ fontSize: 16, color: "#64748B" }} />
                <input type="date" style={inputStyle} value={slotDate} min={todayKey()} onChange={(event) => setSlotDate(event.target.value)} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Start Time *</label>
                <div style={inputShellStyle}>
                  <TimeIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  <input type="time" style={inputStyle} value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>End Time *</label>
                <div style={inputShellStyle}>
                  <TimeIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  <input type="time" style={inputStyle} value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Maximum Patients *</label>
                <div style={{ ...inputShellStyle, justifyContent: "space-between", padding: "5px 10px" }}>
                  <button type="button" onClick={() => setMaxPatients((value) => Math.max(1, value - 1))} style={{ background: "#FFF", border: "1px solid #CBD5E1", borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 800 }}>−</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800 }}>
                    <GroupIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    {maxPatients} pts
                  </div>
                  <button type="button" onClick={() => setMaxPatients((value) => Math.min(100, value + 1))} style={{ background: "#FFF", border: "1px solid #CBD5E1", borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 800 }}>+</button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Clinic Room / Station *</label>
                <div style={inputShellStyle}>
                  <HospitalIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  <input
                    type="text"
                    style={inputStyle}
                    value={clinicRoom}
                    onChange={(event) => setClinicRoom(event.target.value)}
                    placeholder="e.g. OPD Room 4A"
                    maxLength={100}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: 6 }}>Consultation Delivery Channel *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { value: "Physical", label: "Physical OPD", icon: <HospitalIcon sx={{ fontSize: 16 }} /> },
                  { value: "Telehealth", label: "Telehealth", icon: <VideoIcon sx={{ fontSize: 16 }} /> },
                ].map((option) => {
                  const selected = deliveryChannel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDeliveryChannel(option.value)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: selected ? "2px solid #006699" : "1px solid #CBD5E1", background: selected ? "#E0F2FE" : "#FFF", color: selected ? "#006699" : "#475569", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary-cyan" style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: 4 }} disabled={creating || !doctorSelect || doctors.length === 0}>
              {creating ? <CircularProgress size={18} color="inherit" /> : <AddIcon sx={{ fontSize: 18 }} />}
              <span>{creating ? "Creating..." : "Create Timeslot"}</span>
            </button>

            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 8, fontSize: "11.5px", color: "#1E40AF", lineHeight: 1.5 }}>
              <InfoIcon sx={{ fontSize: 16, flexShrink: 0, mt: 0.2 }} />
              <span>CareSync validates the selected doctor, date, time range, patient capacity, and overlapping doctor schedules before saving.</span>
            </div>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="clinical-table-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: 800, color: "#0F172A" }}>Available Timeslots &amp; Daily Roster</h3>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: 2 }}>Live records saved in MED_TIMESLOT</div>
              </div>

              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 2 }}>
                <button onClick={() => setViewMode("card")} style={{ border: "none", background: viewMode === "card" ? "#FFF" : "transparent", color: viewMode === "card" ? "#0F172A" : "#64748B", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", boxShadow: viewMode === "card" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                  <CardViewIcon sx={{ fontSize: 15 }} /> Card View
                </button>
                <button onClick={() => setViewMode("table")} style={{ border: "none", background: viewMode === "table" ? "#FFF" : "transparent", color: viewMode === "table" ? "#0F172A" : "#64748B", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                  <TableViewIcon sx={{ fontSize: 15 }} /> Compact Table
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 14 }}>
              {dateTabs.map((date) => {
                const active = selectedDate === date.key;
                return (
                  <button key={date.key} onClick={() => setSelectedDate(date.key)} style={{ background: active ? "#0F4C81" : "#FFF", color: active ? "#FFF" : "#334155", border: active ? "1px solid #0F4C81" : "1px solid #E2E8F0", borderRadius: 10, padding: "8px 14px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", minWidth: 100 }}>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{date.label}</span>
                    <span style={{ fontSize: "10.5px", opacity: 0.8 }}>{date.sub}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <div className="topbar-search-box" style={{ flex: "1 1 300px", background: "#F8FAFC", border: "1px solid #E2E8F0", width: "auto" }}>
                <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
                <input type="text" placeholder="Search doctor, specialty, room, or slot ID" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFF", fontSize: "12.5px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                <option value="All Statuses">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Almost Full">Almost Full</option>
                <option value="Full">Full</option>
              </select>
            </div>

            {filteredSlots.length === 0 ? (
              <div style={{ border: "1px dashed #CBD5E1", borderRadius: 12, padding: "34px 20px", textAlign: "center", background: "#F8FAFC" }}>
                <CalendarIcon sx={{ color: "#94A3B8", fontSize: 30 }} />
                <div style={{ marginTop: 6, color: "#334155", fontWeight: 800, fontSize: 14 }}>No matching timeslots</div>
                <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>Create a slot for this date or change the search/filter criteria.</div>
              </div>
            ) : viewMode === "card" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {filteredSlots.map((slot) => (
                  <div key={slot.id} style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E0F2FE", color: "#0284C7", fontWeight: 800, fontSize: 14, display: "grid", placeItems: "center" }}>{slot.initials}</div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "14.5px", color: "#0F172A" }}>{slot.doctor}</strong>
                            <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{slot.specialty}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{slot.time} • {slot.room} • {slot.deliveryChannel}</div>
                        </div>
                      </div>
                      {renderStatusPill(slot)}
                    </div>

                    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#64748B", marginBottom: 5, gap: 10 }}>
                        <span>Slot ID: <strong>#{slot.id}</strong></span>
                        <strong style={{ color: "#0F172A" }}>{slot.booked} / {slot.max || "—"} Patients Booked</strong>
                      </div>
                      <div className="stock-progress-wrap" style={{ width: "100%", height: 6 }}>
                        <div className="stock-progress-bar good" style={{ width: `${Math.min(100, slot.percent)}%`, background: slot.percent >= 90 ? "#0284C7" : "#0D9488" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontSize: "11.5px", color: "#0284C7", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        <CheckCircleIcon sx={{ fontSize: 14 }} />
                        {slot.max > 0 ? `${Math.max(0, slot.max - slot.booked)} seats remaining` : "Capacity not configured"}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-primary-cyan" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleViewPatients(slot)}>View Patients ({slot.booked})</button>
                        <button className="topbar-icon-btn" style={{ width: 30, height: 30 }} title="Deactivate slot" onClick={() => handleCancelSlot(slot)}><CloseIcon sx={{ fontSize: 16 }} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="clinical-table" style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th>SLOT</th><th>DOCTOR</th><th>TIME</th><th>ROOM / CHANNEL</th><th>BOOKINGS</th><th>STATUS</th><th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlots.map((slot) => (
                      <tr key={slot.id}>
                        <td><strong style={{ color: "#0A6E7C" }}>#{slot.id}</strong></td>
                        <td><strong>{slot.doctor}</strong><div style={{ fontSize: 11, color: "#64748B" }}>{slot.specialty}</div></td>
                        <td>{slot.time}</td>
                        <td>{slot.room}<div style={{ fontSize: 11, color: "#64748B" }}>{slot.deliveryChannel}</div></td>
                        <td>{slot.booked} / {slot.max || "—"}</td>
                        <td>{renderStatusPill(slot)}</td>
                        <td>
                          <button className="btn-secondary-white" style={{ padding: "5px 9px", marginRight: 6 }} onClick={() => handleViewPatients(slot)}>Patients</button>
                          <button className="topbar-icon-btn" title="Deactivate slot" onClick={() => handleCancelSlot(slot)}><CloseIcon sx={{ fontSize: 16 }} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#64748B", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="pulse-dot" />
                <span>Auto-refresh every 30s • {selectedDateSlots.length} active slot{selectedDateSlots.length === 1 ? "" : "s"} on selected day</span>
              </div>
              <strong style={{ color: "#0284C7" }}>
                Capacity: {selectedDateSlots.reduce((sum, slot) => sum + slot.booked, 0)} / {selectedDateSlots.reduce((sum, slot) => sum + slot.max, 0)} booked
              </strong>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={patientListModal} onClose={() => setPatientListModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <div>
            <strong style={{ fontSize: "17px", color: "#0F172A" }}>Patient Roster: {selectedSlotForPatients?.doctor}</strong>
            <div style={{ fontSize: "12px", color: "#64748B" }}>Slot #{selectedSlotForPatients?.id} • {selectedSlotForPatients?.room}</div>
          </div>
          <IconButton onClick={() => setPatientListModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {patientsLoading ? (
            <div style={{ padding: 30, textAlign: "center" }}><CircularProgress size={24} /></div>
          ) : slotPatients.length === 0 ? (
            <div style={{ padding: "20px 8px", textAlign: "center", color: "#64748B", fontSize: 13 }}>No patients are currently booked into this timeslot.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {slotPatients.map((patient) => {
                const status = patient.TreatmentStatus
                  ? `Treatment: ${patient.TreatmentStatus}`
                  : patient.MAD_STATUS === "I"
                  ? "Inactive"
                  : "Booked";

                return (
                  <div key={patient.MAD_APPOINMENT_ID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, gap: 12 }}>
                    <div>
                      <strong style={{ color: "#0284C7", fontSize: "12.5px" }}>Token {pad(patient.MAD_PATIENT_NO ?? "-")}</strong>
                      <span style={{ margin: "0 8px", color: "#CBD5E1" }}>|</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{patient.MAD_FULL_NAME || "Patient name not recorded"}</span>
                      <div style={{ marginTop: 3, fontSize: 11, color: "#64748B" }}>{patient.MAD_PATIENT_CODE || "Patient code not recorded"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11.5px", color: "#64748B" }}>{formatTime(patient.MAD_ALLOCATED_TIME)}</div>
                      <span style={{ display: "inline-block", marginTop: 3, background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: 10, fontSize: 10.5, fontWeight: 700 }}>{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPatientListModal(false)}>Close</Button>
          <Button variant="contained" sx={{ bgcolor: "#006699" }} onClick={() => { setPatientListModal(false); navigate("/dashboard/medical-history"); }}>Open Patient Records</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4500} onClose={() => setSnackbar((current) => ({ ...current, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((current) => ({ ...current, open: false }))} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "10px" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
