import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  AddRounded,
  CalendarMonthRounded,
  EventAvailableRounded,
  GroupsRounded,
  LocalHospitalRounded,
  MailOutlineRounded,
  PersonRounded,
  RefreshRounded,
  ScheduleRounded,
  VideoCallRounded,
  MeetingRoomRounded,
  BlockRounded,
} from "@mui/icons-material";
import "../styles/DailyAppoinment.css";

const API = process.env.REACT_APP_API_BASE_URL;

const normalizeRole = (value) => String(value || "").trim().toUpperCase();
const isAdminRole = (value) => ["ADMIN", "ADMINISTRATOR", "SUPER ADMIN", "SUPERADMIN"].includes(normalizeRole(value));

const dateToInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-LK", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatTime = (value) => {
  if (!value) return "--:--";
  const [hours = "0", minutes = "0"] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getError = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  (typeof error?.response?.data === "string" ? error.response.data : null) ||
  fallback;

export default function DailyAppointment() {
  const role = localStorage.getItem("Role");
  const currentUserId = localStorage.getItem("id");
  const currentUserName = localStorage.getItem("Name");
  const admin = isAdminRole(role);

  const [doctors, setDoctors] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("ALL");
  const [notice, setNotice] = useState({ open: false, severity: "success", message: "" });

  const [form, setForm] = useState({
    doctorUserId: "",
    slotDate: dateToInput(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    maximumPatients: 20,
    clinicRoom: "",
    deliveryChannel: "Physical",
  });

  const showNotice = (severity, message) =>
    setNotice({ open: true, severity, message });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [doctorResponse, slotResponse] = await Promise.all([
        axios.get(`${API}/DoctorDirectory`),
        axios.get(`${API}/Timeslot/active-timeslots`),
      ]);

      const doctorData = Array.isArray(doctorResponse.data) ? doctorResponse.data : [];
      const slotData = Array.isArray(slotResponse.data) ? slotResponse.data : [];
      setDoctors(doctorData);
      setTimeslots(slotData);

      if (admin && !form.doctorUserId && doctorData.length > 0) {
        setForm((current) => ({ ...current, doctorUserId: doctorData[0].UserId }));
      }
    } catch (error) {
      showNotice("error", getError(error, "Unable to load the clinical schedule."));
    } finally {
      setLoading(false);
    }
  }, [API, admin, form.doctorUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const doctorMap = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.UserId, doctor])),
    [doctors]
  );

  const visibleSlots = useMemo(() => {
    const text = search.trim().toLowerCase();
    return timeslots.filter((slot) => {
      if (!admin && currentUserId && slot.MT_USER_ID !== currentUserId) return false;
      if (filterDoctor !== "ALL" && slot.MT_USER_ID !== filterDoctor) return false;
      if (!text) return true;

      const doctor = doctorMap.get(slot.MT_USER_ID);
      const haystack = [
        slot.MT_DOCTOR,
        doctor?.FullName,
        doctor?.Specialization,
        slot.MT_CLINIC_ROOM,
        slot.MT_DELIVERY_CHANNEL,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(text);
    });
  }, [timeslots, search, filterDoctor, doctorMap, admin, currentUserId]);

  const stats = useMemo(() => {
    const today = dateToInput(new Date());
    const todaySlots = timeslots.filter((slot) => String(slot.MT_SLOT_DATE || "").startsWith(today));
    const totalCapacity = timeslots.reduce((sum, slot) => sum + Number(slot.MT_MAXIMUM_PATIENTS || 0), 0);
    const totalBooked = timeslots.reduce((sum, slot) => sum + Number(slot.MT_PATIENT_NO || 0), 0);
    return {
      doctors: doctors.length,
      todaySlots: todaySlots.length,
      activeSlots: timeslots.length,
      utilization: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
    };
  }, [doctors, timeslots]);

  const updateForm = (field) => (event) => {
    const value = field === "maximumPatients" ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createTimeslot = async (event) => {
    event.preventDefault();

    if (!admin) {
      showNotice("warning", "Only an administrator can create clinical timeslots.");
      return;
    }

    if (!currentUserId && !currentUserName) {
      showNotice("error", "Administrator identity is missing from the current session. Please sign in again.");
      return;
    }

    if (!form.doctorUserId) {
      showNotice("warning", "Select an attending doctor.");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/Timeslot`,
        {
          SlotDate: form.slotDate,
          StartTime: `${form.startTime}:00`,
          EndTime: `${form.endTime}:00`,
          MaximumPatients: Number(form.maximumPatients),
          DoctorUserId: form.doctorUserId,
          AdminUserId: currentUserId || null,
          AdminUserName: currentUserName || null,
          ClinicRoom: form.clinicRoom.trim() || null,
          DeliveryChannel: form.deliveryChannel,
        }
      );

      showNotice(
        "success",
        "Timeslot created. CareSync will email the doctor one day before the channel date."
      );
      setForm((current) => ({
        ...current,
        clinicRoom: "",
      }));
      await loadData();
    } catch (error) {
      if (error?.response?.status === 403) {
        showNotice(
          "error",
          getError(error, "The current Admin session could not be matched to the staff directory.")
        );
      } else {
        showNotice("error", getError(error, "Unable to create this timeslot."));
      }
    } finally {
      setSaving(false);
    }
  };

  const deactivateSlot = async (slotId) => {
    if (!admin) return;
    try {
      const params = new URLSearchParams();
      if (currentUserId) params.set("adminUserId", currentUserId);
      if (currentUserName) params.set("adminUserName", currentUserName);

      await axios.put(
        `${API}/Timeslot/update-status/${slotId}?${params.toString()}`,
        null
      );
      showNotice("success", "Timeslot deactivated.");
      await loadData();
    } catch (error) {
      showNotice("error", getError(error, "Unable to deactivate this timeslot."));
    }
  };

  return (
    <div className="cs-scheduler-page">
      <section className="cs-scheduler-hero">
        <div>
          <div className="cs-eyebrow">CLINICAL OPERATIONS • MANUAL SCHEDULING</div>
          <h1>Appointments & Timeslots</h1>
          <p>
            {admin
              ? "Create doctor schedules deliberately, monitor capacity, and keep channel reminders coordinated."
              : "Review your administrator-assigned clinical sessions and patient capacity."}
          </p>
        </div>
        <div className="cs-hero-actions">
          <Chip
            icon={admin ? <LocalHospitalRounded /> : <PersonRounded />}
            label={admin ? "Administrator scheduling" : "Doctor read-only schedule"}
            className="cs-role-chip"
          />
          <Tooltip title="Refresh schedule">
            <Button className="cs-icon-button" onClick={loadData} disabled={loading}>
              <RefreshRounded />
            </Button>
          </Tooltip>
        </div>
      </section>

      <section className="cs-scheduler-kpis">
        <div className="cs-kpi-card">
          <div className="cs-kpi-icon teal"><LocalHospitalRounded /></div>
          <div><span>Active doctors</span><strong>{stats.doctors}</strong><small>Live staff directory</small></div>
        </div>
        <div className="cs-kpi-card">
          <div className="cs-kpi-icon blue"><CalendarMonthRounded /></div>
          <div><span>Today's sessions</span><strong>{stats.todaySlots}</strong><small>Administrator-provisioned</small></div>
        </div>
        <div className="cs-kpi-card">
          <div className="cs-kpi-icon indigo"><EventAvailableRounded /></div>
          <div><span>Upcoming timeslots</span><strong>{stats.activeSlots}</strong><small>No automatic cloning</small></div>
        </div>
        <div className="cs-kpi-card">
          <div className="cs-kpi-icon amber"><GroupsRounded /></div>
          <div><span>Capacity utilization</span><strong>{stats.utilization}%</strong><small>Across active sessions</small></div>
        </div>
      </section>

      <div className={`cs-scheduler-grid ${admin ? "with-form" : "read-only"}`}>
        {admin && (
          <section className="cs-panel cs-create-panel">
            <div className="cs-panel-title">
              <div className="cs-title-icon"><AddRounded /></div>
              <div>
                <h2>Create doctor timeslot</h2>
                <p>Only administrators can provision a new channel.</p>
              </div>
            </div>

            <form onSubmit={createTimeslot} className="cs-timeslot-form">
              <FormControl fullWidth size="small">
                <InputLabel>Attending doctor</InputLabel>
                <Select
                  label="Attending doctor"
                  value={form.doctorUserId}
                  onChange={updateForm("doctorUserId")}
                  required
                >
                  {doctors.map((doctor) => (
                    <MenuItem value={doctor.UserId} key={doctor.UserId}>
                      {doctor.FullName || doctor.UserName} • {doctor.Specialization || "General"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Consultation date"
                value={form.slotDate}
                onChange={updateForm("slotDate")}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: dateToInput(new Date()) }}
                size="small"
                required
                fullWidth
              />

              <div className="cs-form-row">
                <TextField
                  type="time"
                  label="Start time"
                  value={form.startTime}
                  onChange={updateForm("startTime")}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  required
                  fullWidth
                />
                <TextField
                  type="time"
                  label="End time"
                  value={form.endTime}
                  onChange={updateForm("endTime")}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  required
                  fullWidth
                />
              </div>

              <div className="cs-form-row">
                <TextField
                  type="number"
                  label="Patient capacity"
                  value={form.maximumPatients}
                  onChange={updateForm("maximumPatients")}
                  inputProps={{ min: 1, max: 200 }}
                  size="small"
                  required
                  fullWidth
                />
                <TextField
                  label="Clinic room / station"
                  value={form.clinicRoom}
                  onChange={updateForm("clinicRoom")}
                  placeholder="e.g. OPD Room 4A"
                  size="small"
                  fullWidth
                />
              </div>

              <FormControl fullWidth size="small">
                <InputLabel>Delivery channel</InputLabel>
                <Select
                  label="Delivery channel"
                  value={form.deliveryChannel}
                  onChange={updateForm("deliveryChannel")}
                >
                  <MenuItem value="Physical">Physical OPD</MenuItem>
                  <MenuItem value="Telehealth">Telehealth</MenuItem>
                </Select>
              </FormControl>

              <div className="cs-reminder-note">
                <MailOutlineRounded />
                <div>
                  <strong>One-day doctor reminder</strong>
                  <span>CareSync emails the assigned doctor the day before this clinical session using the existing email service.</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="contained"
                className="cs-create-button"
                disabled={saving || doctors.length === 0}
                startIcon={saving ? <CircularProgress size={16} /> : <AddRounded />}
              >
                {saving ? "Creating..." : "Create Timeslot"}
              </Button>
            </form>
          </section>
        )}

        <section className="cs-panel cs-roster-panel">
          <div className="cs-roster-header">
            <div>
              <h2>Upcoming clinical roster</h2>
              <p>Only stored, active timeslots are shown. No future slots are auto-generated.</p>
            </div>
            <div className="cs-roster-filters">
              <TextField
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search doctor, specialty, room..."
              />
              {admin && (
                <FormControl size="small" className="cs-doctor-filter">
                  <InputLabel>Doctor</InputLabel>
                  <Select
                    label="Doctor"
                    value={filterDoctor}
                    onChange={(event) => setFilterDoctor(event.target.value)}
                  >
                    <MenuItem value="ALL">All doctors</MenuItem>
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.UserId} value={doctor.UserId}>
                        {doctor.FullName || doctor.UserName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </div>
          </div>

          {loading ? (
            <div className="cs-loading-state"><CircularProgress size={28} /><span>Loading schedule...</span></div>
          ) : visibleSlots.length === 0 ? (
            <div className="cs-empty-state">
              <CalendarMonthRounded />
              <h3>No matching timeslots</h3>
              <p>An administrator can create a deliberate clinical session when required.</p>
            </div>
          ) : (
            <div className="cs-slot-list">
              {visibleSlots.map((slot) => {
                const doctor = doctorMap.get(slot.MT_USER_ID);
                const booked = Number(slot.MT_PATIENT_NO || 0);
                const capacity = Number(slot.MT_MAXIMUM_PATIENTS || 0);
                const percent = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
                return (
                  <article className="cs-slot-card" key={slot.MT_SLOT_ID}>
                    <div className="cs-slot-date">
                      <CalendarMonthRounded />
                      <div><strong>{formatDate(slot.MT_SLOT_DATE)}</strong><span>Slot #{slot.MT_SLOT_ID}</span></div>
                    </div>
                    <div className="cs-slot-main">
                      <div className="cs-slot-doctor">
                        <div className="cs-avatar">{(slot.MT_DOCTOR || "D").charAt(0).toUpperCase()}</div>
                        <div>
                          <strong>Dr. {slot.MT_DOCTOR || "Not assigned"}</strong>
                          <span>{doctor?.Specialization || "Clinical service"}</span>
                        </div>
                      </div>
                      <div className="cs-slot-meta">
                        <span><ScheduleRounded /> {formatTime(slot.MT_START_TIME)} – {formatTime(slot.MT_END_TIME)}</span>
                        <span><MeetingRoomRounded /> {slot.MT_CLINIC_ROOM || "Room not specified"}</span>
                        <span>{slot.MT_DELIVERY_CHANNEL === "Telehealth" ? <VideoCallRounded /> : <LocalHospitalRounded />} {slot.MT_DELIVERY_CHANNEL || "Physical"}</span>
                      </div>
                    </div>
                    <div className="cs-capacity-block">
                      <div className="cs-capacity-label"><span>Capacity</span><strong>{booked}/{capacity}</strong></div>
                      <div className="cs-progress"><span style={{ width: `${percent}%` }} /></div>
                      <small>{Math.max(0, capacity - booked)} places remaining</small>
                    </div>
                    <div className="cs-slot-actions">
                      <Chip
                        size="small"
                        icon={<MailOutlineRounded />}
                        label={slot.MT_REMINDER_EMAIL_SENT ? "Doctor reminded" : "Reminder pending"}
                        className={slot.MT_REMINDER_EMAIL_SENT ? "cs-reminder-sent" : "cs-reminder-pending"}
                      />
                      {admin && (
                        <Button
                          size="small"
                          startIcon={<BlockRounded />}
                          onClick={() => deactivateSlot(slot.MT_SLOT_ID)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
