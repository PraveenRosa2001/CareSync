import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Addtimeslot from "./components/addTimeslot";
import Home from "./pages/Home";
import Doctordashboard from "./components/doctorDashboard";
import Dailyappoinment from "./components/dailyappoinment";
import Medicalhistory from "./pages/medicalhistory";
import Viewtimeslot from "./components/viewTimeslot";
import Registermedicine from "./components/registerMedicine";
import Addrecord from "./pages/addrecord";
import Addpatient from "./components/addPatients";
import AllocateDrugs from "./components/allocateDrugs";
import Adduser from "./components/adduser";
import ViewRecord from "./components/viewRecord";
import Invoice from "./components/invoice";
import AvailableTimeslots from "./components/availableTimeslot";
import Aboutus from "./pages/aboutus";
import Remarks from "./components/remarks";
import Pharmacy from "./components/pharmacy";
import Pharmacyinvoice from "./components/pharmacyinvoice";
import Userregistration from "./components/userRegistration";
import Pmedicalhistory from "./pages/patientmedicalhistory";
import Patientlogin from "./pages/patientlogin";
import LoginSelector from "./components/loginselector";
import AppoinmentHistory from "./pages/appoinmentHistory";
import PatientAppointment from "./components/patientappoinment";
import Profile from "./pages/profile";
import Doctorprofile from "./components/doctorprofile";
import Patientdetails from "./components/patientDetails";
import Prescription from "./components/prescription";
import Welcome from "./pages/Welcome";
import AdminOverview from "./components/adminOverview";
import TraumaEmergency from "./components/traumaEmergency";
import SettingsAudit from "./components/settingsAudit";
import {
  ACCESS,
  ROLES,
  getDefaultDashboardPath,
  hasAccess,
  normalizeRole,
} from "./utils/roleAccess";

const clearStaffSession = () => {
  ["Token", "Role", "Name", "id"].forEach((key) =>
    localStorage.removeItem(key),
  );
};

const isUsableJwt = (token) => {
  if (!token || typeof token !== "string") return false;
  if (token === "demo-token-active") return false;
  return true;
};

const ProtectedRoute = ({ element: Element, roles, ...rest }) => {
  const token = localStorage.getItem("Token");
  const userRole = normalizeRole(localStorage.getItem("Role"));

  const isStaff = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST].includes(
    userRole,
  );

  if (!token) {
    return <Navigate to={isStaff ? "/admin" : "/welcome"} replace />;
  }

  // Legacy builds stored values such as "demo-token-active". They can make the
  // dashboard look logged-in but ASP.NET correctly rejects them with HTTP 401.
  if (isStaff && !isUsableJwt(token)) {
    clearStaffSession();
    return <Navigate to="/admin" replace />;
  }

  if (!hasAccess(userRole, roles)) {
    return (
      <Navigate
        to={isStaff ? getDefaultDashboardPath(userRole) : "/welcome"}
        replace
      />
    );
  }

  return <Element {...rest} />;
};

const DashboardIndexRedirect = () => {
  const role = normalizeRole(localStorage.getItem("Role"));
  return <Navigate to={getDefaultDashboardPath(role)} replace />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome />} />

          <Route path="/admin" element={<Login />} />
          <Route path="/no" element={<LoginSelector />} />
          <Route
            path="/home"
            element={<ProtectedRoute element={Home} roles={[ROLES.PATIENT]} />}
          />
          <Route path="/patient-login" element={<Patientlogin />} />
          <Route path="/available-time" element={<AvailableTimeslots />} />
          <Route path="/about-us" element={<Aboutus />} />
          <Route
            path="/medical-history"
            element={
              <ProtectedRoute
                element={Pmedicalhistory}
                roles={[ROLES.PATIENT]}
              />
            }
          />
          <Route
            path="/appoinment-history"
            element={
              <ProtectedRoute
                element={AppoinmentHistory}
                roles={[ROLES.PATIENT]}
              />
            }
          />
          <Route
            path="/appoinment"
            element={
              <ProtectedRoute
                element={PatientAppointment}
                roles={[ROLES.PATIENT]}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute element={Profile} roles={[ROLES.PATIENT]} />
            }
          />
          <Route path="/addusers" element={<Userregistration />} />
          <Route path="/patient-register" element={<Userregistration />} />
          <Route path="/register" element={<Userregistration />} />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute
                element={Doctordashboard}
                roles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST]}
              />
            }
          >
            <Route index element={<DashboardIndexRedirect />} />

            {/* Admin + Doctor */}
            <Route
              path="overview"
              element={
                <ProtectedRoute
                  element={AdminOverview}
                  roles={ACCESS.DASHBOARD}
                />
              }
            />
            <Route
              path="medical-history"
              element={
                <ProtectedRoute
                  element={Medicalhistory}
                  roles={ACCESS.PATIENT_RECORDS}
                />
              }
            />
            <Route
              path="patient-records"
              element={
                <ProtectedRoute
                  element={Medicalhistory}
                  roles={ACCESS.PATIENT_RECORDS}
                />
              }
            />
            <Route
              path="daily-appointments"
              element={
                <ProtectedRoute
                  element={Dailyappoinment}
                  roles={ACCESS.APPOINTMENTS}
                />
              }
            />
            <Route
              path="daily-appoinments"
              element={
                <ProtectedRoute
                  element={Dailyappoinment}
                  roles={ACCESS.APPOINTMENTS}
                />
              }
            />
            <Route
              path="view-timeslots"
              element={
                <ProtectedRoute
                  element={Viewtimeslot}
                  roles={ACCESS.APPOINTMENTS}
                />
              }
            />
            <Route
              path="add-timeslot"
              element={
                <ProtectedRoute
                  element={Addtimeslot}
                  roles={ACCESS.APPOINTMENTS}
                />
              }
            />
            <Route
              path="addrecord/:patientId"
              element={
                <ProtectedRoute
                  element={Addrecord}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="add-patient"
              element={
                <ProtectedRoute
                  element={Addpatient}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="allocate-drugs/:patientId/:serialNumber"
              element={
                <ProtectedRoute
                  element={AllocateDrugs}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="view-record/:patientId/:serial_no"
              element={
                <ProtectedRoute
                  element={ViewRecord}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="invoice/:patientId/:serial_no"
              element={
                <ProtectedRoute
                  element={Invoice}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="remark/:patientId/:serial_no"
              element={
                <ProtectedRoute
                  element={Remarks}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="doctor-profile"
              element={
                <ProtectedRoute
                  element={Doctorprofile}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="patientdetails/:patientId"
              element={
                <ProtectedRoute
                  element={Patientdetails}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="prescription/:patientId/:serial_no"
              element={
                <ProtectedRoute
                  element={Prescription}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="emergency"
              element={
                <ProtectedRoute
                  element={TraumaEmergency}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />
            <Route
              path="settings-audit"
              element={
                <ProtectedRoute
                  element={SettingsAudit}
                  roles={ACCESS.CLINICAL_DETAILS}
                />
              }
            />

            {/* Admin + Doctor + Pharmacist */}
            <Route
              path="register-medicines"
              element={
                <ProtectedRoute
                  element={Registermedicine}
                  roles={ACCESS.DRUG_INVENTORY}
                />
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute
                  element={Registermedicine}
                  roles={ACCESS.DRUG_INVENTORY}
                />
              }
            />
            <Route
              path="pharmacy"
              element={
                <ProtectedRoute element={Pharmacy} roles={ACCESS.PHARMACY} />
              }
            />
            <Route
              path="pharmacy-invoice/:patientId/:serial_no"
              element={
                <ProtectedRoute
                  element={Pharmacyinvoice}
                  roles={ACCESS.PHARMACY_DETAILS}
                />
              }
            />

            {/* Admin only */}
            <Route
              path="Add-users"
              element={
                <ProtectedRoute element={Adduser} roles={ACCESS.USER_STAFF} />
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute element={Adduser} roles={ACCESS.USER_STAFF} />
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
