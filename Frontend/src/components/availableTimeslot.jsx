import React from "react";
import PatientAppointment from "./patientappoinment";

// The old component contained hardcoded sample timeslots.
// Keep this route compatible while using the same real-data booking experience.
export default function AvailableTimeslots() {
  return <PatientAppointment />;
}
