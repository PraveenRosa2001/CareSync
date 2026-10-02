import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  TextField,
} from "@mui/material";
import {
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  EmailRounded,
  LocalHospitalRounded,
  MedicalServicesRounded,
  PersonSearchRounded,
  ScheduleRounded,
  SearchRounded,
  VideoCallRounded,
  MeetingRoomRounded,
} from "@mui/icons-material";
import "../styles/patientappoinment.css";

const API = process.env.REACT_APP_API_BASE_URL;
const steps = ["Find Doctor", "Select Time", "Confirm"];

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return date.toLocaleDateString("en-LK", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-LK", {
    weekday: "short",
    day: "2-digit",
    month: "short",
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

const slotClosed = (slot) => {
  const datePart = String(slot.MT_SLOT_DATE || "").split("T")[0];
  const endTime = String(slot.MT_END_TIME || "00:00:00");
  const end = new Date(`${datePart}T${endTime}`);
  return !Number.isNaN(end.getTime()) && end <= new Date();
};

const getError = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  (typeof error?.response?.data === "string" ? error.response.data : null) ||
  fallback;

export default function PatientAppointment() {
  const navigate = useNavigate();
  const patientCode = localStorage.getItem("PatientCode");
  const patientName = localStorage.getItem("Name") || "Patient";
  const patientEmail = localStorage.getItem("Email") || "";

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [notice, setNotice] = useState({ open: false, severity: "success", message: "" });

  const showNotice = (severity, message) =>
    setNotice({ open: true, severity, message });

  useEffect(() => {
    const loadDirectory = async () => {
      setLoadingDoctors(true);
      try {
        const [doctorResponse, specialtyResponse] = await Promise.all([
          axios.get(`${API}/DoctorDirectory`),
          axios.get(`${API}/DoctorDirectory/specializations`),
        ]);
        setDoctors(Array.isArray(doctorResponse.data) ? doctorResponse.data : []);
        setSpecializations(Array.isArray(specialtyResponse.data) ? specialtyResponse.data : []);
      } catch (error) {
        showNotice("error", getError(error, "Unable to load the doctor directory."));
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDirectory();
  }, []);

  const filteredDoctors = useMemo(() => {
    const text = search.trim().toLowerCase();
    return doctors.filter((doctor) => {
      if (
        selectedSpecialization !== "All" &&
        doctor.Specialization !== selectedSpecialization
      ) {
        return false;
      }
      if (!text) return true;
      return [doctor.FullName, doctor.UserName, doctor.Specialization]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(text);
    });
  }, [doctors, search, selectedSpecialization]);

  const selectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setBookingResult(null);
    setActiveStep(1);
    setLoadingSlots(true);

    try {
      const response = await axios.get(`${API}/Timeslot/Doctorid/${doctor.UserId}`);
      setSlots(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setSlots([]);
      showNotice("error", getError(error, "Unable to load this doctor's availability."));
    } finally {
      setLoadingSlots(false);
    }
  };

  const openConfirm = (slot) => {
    setSelectedSlot(slot);
    setActiveStep(2);
  };

  const closeConfirm = () => {
    setSelectedSlot(null);
    if (!bookingResult) setActiveStep(1);
  };

  const bookAppointment = async () => {
    if (!patientCode) {
      showNotice("error", "Patient details are missing from the current session. Please sign in again.");
      return;
    }
    if (!selectedSlot) return;

    setBooking(true);
    try {
      const response = await axios.post(
        `${API}/AppointmentBooking/book`,
        {
          PatientCode: patientCode,
          SlotId: selectedSlot.MT_SLOT_ID,
        }
      );

      setBookingResult(response.data);
      showNotice("success", "Appointment booked successfully.");

      // Refresh only the selected doctor's stored slots after the atomic booking.
      const slotResponse = await axios.get(
        `${API}/Timeslot/Doctorid/${selectedDoctor.UserId}`
      );
      setSlots(Array.isArray(slotResponse.data) ? slotResponse.data : []);
    } catch (error) {
      showNotice("error", getError(error, "Unable to book this appointment."));
    } finally {
      setBooking(false);
    }
  };

  const groupedSlots = useMemo(() => {
    return slots.reduce((groups, slot) => {
      const date = String(slot.MT_SLOT_DATE || "").split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
      return groups;
    }, {});
  }, [slots]);

  if (!patientCode) {
    return (
      <div className="cs-booking-page">
        <div className="cs-session-card">
          <LocalHospitalRounded />
          <h2>Patient sign-in required</h2>
          <p>Please sign in to your CareSync patient account before booking an appointment.</p>
          <Button variant="contained" onClick={() => navigate("/patient-login")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-booking-page">
      <section className="cs-booking-shell">
        <div className="cs-booking-topbar">
          <Button
            className="cs-back-button"
            startIcon={<ArrowBackRounded />}
            onClick={() => {
              if (activeStep === 2) closeConfirm();
              else if (activeStep === 1) {
                setSelectedDoctor(null);
                setSlots([]);
                setActiveStep(0);
              } else navigate(-1);
            }}
          >
            Back
          </Button>
          <div className="cs-patient-context">
            <span>{patientName}</span>
            <Chip size="small" label={patientCode} />
          </div>
        </div>

        <Stepper activeStep={activeStep} alternativeLabel className="cs-booking-stepper">
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <section className="cs-doctor-section">
            <div className="cs-booking-heading">
              <div>
                <div className="cs-booking-eyebrow">CARE TEAM DIRECTORY</div>
                <h1>Find an available doctor</h1>
                <p>Select a real active doctor from the hospital directory, then view only administrator-created timeslots.</p>
              </div>
              <div className="cs-safe-booking-note"><EmailRounded /><span>Appointment email reminder is sent one day before your visit.</span></div>
            </div>

            <div className="cs-doctor-toolbar">
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search doctor or specialty"
                size="small"
                fullWidth
                InputProps={{ startAdornment: <SearchRounded className="cs-search-icon" /> }}
              />
              <FormControl size="small" className="cs-specialty-filter">
                <InputLabel>Specialty</InputLabel>
                <Select
                  label="Specialty"
                  value={selectedSpecialization}
                  onChange={(event) => setSelectedSpecialization(event.target.value)}
                >
                  <MenuItem value="All">All specialties</MenuItem>
                  {specializations.map((specialty) => (
                    <MenuItem key={specialty} value={specialty}>{specialty}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {loadingDoctors ? (
              <div className="cs-booking-loading"><CircularProgress size={30} /><span>Loading doctors...</span></div>
            ) : filteredDoctors.length === 0 ? (
              <div className="cs-booking-empty"><PersonSearchRounded /><h3>No doctors found</h3><p>Try another name or specialty.</p></div>
            ) : (
              <div className="cs-doctor-grid">
                {filteredDoctors.map((doctor) => (
                  <article className="cs-doctor-card" key={doctor.UserId}>
                    <div className="cs-doctor-card-head">
                      <Avatar className="cs-doctor-avatar">
                        {(doctor.FullName || doctor.UserName || "D").charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <h3>Dr. {doctor.FullName || doctor.UserName}</h3>
                        <span>{doctor.Specialization || "General Medicine"}</span>
                      </div>
                    </div>
                    <div className="cs-doctor-status"><span /><strong>Active clinical account</strong></div>
                    <Button
                      fullWidth
                      variant="outlined"
                      endIcon={<CalendarMonthRounded />}
                      onClick={() => selectDoctor(doctor)}
                    >
                      View Availability
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeStep >= 1 && selectedDoctor && !bookingResult && (
          <section className="cs-slot-section">
            <div className="cs-selected-doctor-bar">
              <Avatar className="cs-doctor-avatar">
                {(selectedDoctor.FullName || selectedDoctor.UserName || "D").charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <span>Selected physician</span>
                <h2>Dr. {selectedDoctor.FullName || selectedDoctor.UserName}</h2>
                <p>{selectedDoctor.Specialization || "General Medicine"}</p>
              </div>
              <Button onClick={() => { setActiveStep(0); setSelectedDoctor(null); setSlots([]); }}>
                Change Doctor
              </Button>
            </div>

            <div className="cs-slot-heading">
              <div><h1>Available timeslots</h1><p>These sessions were created manually by hospital administration.</p></div>
              <Chip icon={<CalendarMonthRounded />} label={`${slots.length} upcoming session${slots.length === 1 ? "" : "s"}`} />
            </div>

            {loadingSlots ? (
              <div className="cs-booking-loading"><CircularProgress size={30} /><span>Loading availability...</span></div>
            ) : slots.length === 0 ? (
              <div className="cs-booking-empty"><CalendarMonthRounded /><h3>No upcoming timeslots</h3><p>The administrator has not published an active session for this doctor yet.</p></div>
            ) : (
              <div className="cs-date-groups">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div className="cs-date-group" key={date}>
                    <div className="cs-date-label"><CalendarMonthRounded /><div><strong>{formatDate(date)}</strong><span>{dateSlots.length} session{dateSlots.length === 1 ? "" : "s"}</span></div></div>
                    <div className="cs-patient-slot-grid">
                      {dateSlots.map((slot) => {
                        const capacity = Number(slot.MT_MAXIMUM_PATIENTS || 0);
                        const booked = Number(slot.MT_PATIENT_NO || 0);
                        const remaining = Math.max(0, capacity - booked);
                        const closed = slotClosed(slot);
                        const full = capacity > 0 && booked >= capacity;
                        const unavailable = closed || full;
                        return (
                          <article className={`cs-patient-slot-card ${unavailable ? "closed" : ""}`} key={slot.MT_SLOT_ID}>
                            <div className="cs-slot-time-row"><ScheduleRounded /><strong>{formatTime(slot.MT_START_TIME)} – {formatTime(slot.MT_END_TIME)}</strong></div>
                            <div className="cs-slot-detail-row">
                              <span><MeetingRoomRounded />{slot.MT_CLINIC_ROOM || "Room to be confirmed"}</span>
                              <span>{slot.MT_DELIVERY_CHANNEL === "Telehealth" ? <VideoCallRounded /> : <LocalHospitalRounded />}{slot.MT_DELIVERY_CHANNEL || "Physical"}</span>
                            </div>
                            <div className="cs-slot-availability">
                              <div><span>Availability</span><strong>{remaining} / {capacity}</strong></div>
                              <div className="cs-patient-progress"><span style={{ width: `${capacity > 0 ? Math.min(100, (booked / capacity) * 100) : 100}%` }} /></div>
                            </div>
                            <Button
                              variant="contained"
                              disabled={unavailable}
                              onClick={() => openConfirm(slot)}
                            >
                              {closed ? "Closed" : full ? "Fully Booked" : "Book Appointment"}
                            </Button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {bookingResult && (
          <section className="cs-booking-success">
            <div className="cs-success-icon"><CheckCircleRounded /></div>
            <div className="cs-booking-eyebrow">BOOKING CONFIRMED</div>
            <h1>Your appointment is reserved</h1>
            <p>CareSync stored the appointment and updated the selected timeslot capacity together.</p>
            <div className="cs-confirmation-grid">
              <div><span>Appointment</span><strong>#{bookingResult.MAD_APPOINMENT_ID}</strong></div>
              <div><span>Date</span><strong>{formatShortDate(bookingResult.MAD_APPOINMENT_DATE)}</strong></div>
              <div><span>Time</span><strong>{formatTime(bookingResult.MAD_ALLOCATED_TIME)}</strong></div>
              <div><span>Doctor</span><strong>Dr. {bookingResult.MAD_DOCTOR}</strong></div>
            </div>
            <div className="cs-email-confirmation"><EmailRounded /><span>A reminder will be emailed to <strong>{bookingResult.MAD_EMAIL || patientEmail || "your registered email"}</strong> one day before the appointment.</span></div>
            <div className="cs-success-actions">
              <Button variant="outlined" onClick={() => navigate("/appoinment-history")}>View Appointment History</Button>
              <Button variant="contained" onClick={() => { setBookingResult(null); setSelectedSlot(null); setActiveStep(0); setSelectedDoctor(null); }}>Book Another</Button>
            </div>
          </section>
        )}
      </section>

      <Dialog open={Boolean(selectedSlot) && !bookingResult} onClose={booking ? undefined : closeConfirm} maxWidth="sm" fullWidth>
        <DialogTitle className="cs-confirm-title">Confirm appointment</DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <div className="cs-confirm-dialog">
              <div className="cs-confirm-doctor"><Avatar>{(selectedDoctor?.FullName || "D").charAt(0)}</Avatar><div><span>Physician</span><strong>Dr. {selectedDoctor?.FullName || selectedDoctor?.UserName}</strong><small>{selectedDoctor?.Specialization || "General Medicine"}</small></div></div>
              <div className="cs-confirm-details">
                <div><CalendarMonthRounded /><span><small>Date</small><strong>{formatDate(selectedSlot.MT_SLOT_DATE)}</strong></span></div>
                <div><ScheduleRounded /><span><small>Session</small><strong>{formatTime(selectedSlot.MT_START_TIME)} – {formatTime(selectedSlot.MT_END_TIME)}</strong></span></div>
                <div><MedicalServicesRounded /><span><small>Channel</small><strong>{selectedSlot.MT_DELIVERY_CHANNEL || "Physical"}</strong></span></div>
                <div><MeetingRoomRounded /><span><small>Location</small><strong>{selectedSlot.MT_CLINIC_ROOM || "To be confirmed"}</strong></span></div>
              </div>
              <Alert severity="info" icon={<EmailRounded />}>
                Your registered email will be used for the reminder one day before the appointment.
              </Alert>
            </div>
          )}
        </DialogContent>
        <DialogActions className="cs-confirm-actions">
          <Button onClick={closeConfirm} disabled={booking}>Cancel</Button>
          <Button variant="contained" onClick={bookAppointment} disabled={booking}>
            {booking ? <><CircularProgress size={16} />&nbsp; Booking...</> : "Confirm Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          variant="filled"
          severity={notice.severity}
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
