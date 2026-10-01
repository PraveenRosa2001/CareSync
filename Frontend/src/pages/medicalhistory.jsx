// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   IconButton,
//   Paper,
//   Snackbar,
//   Alert,
//   TextField,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   CircularProgress,
// } from "@mui/material";
// import {
//   Search as SearchIcon,
//   Add as AddIcon,
//   Sync as SyncIcon,
//   FileDownload as DownloadIcon,
//   FilterList as FilterIcon,
//   Shield as ShieldIcon,
//   InfoOutlined as InfoIcon,
//   Close as CloseIcon,
//   MedicalServices as MedicalIcon,
//   Fingerprint as BioIcon,
//   LocalPharmacy as PharmacyIcon,
//   MonitorHeart as TelemetryIcon,
//   CheckCircle as CheckCircleIcon,
//   ArrowForward as ArrowForwardIcon,
//   Person as PersonIcon,
//   Phone as PhoneIcon,
//   Visibility as VisibilityIcon,
// } from "@mui/icons-material";
// import Addpatient from "../components/addPatients";

// // Default clinical dossiers matching screenshot 3
// const INITIAL_PATIENTS = [];

// export default function MedicalHistory() {
//   const navigate = useNavigate();
//   const [patients, setPatients] = useState(INITIAL_PATIENTS);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedPhysician, setSelectedPhysician] = useState("All Doctors");
//   const [activeTab, setActiveTab] = useState("All Patients");
//   const [loading, setLoading] = useState(false);
//   const [openAdmissionModal, setOpenAdmissionModal] = useState(false);
//   const [openTreatmentsModal, setOpenTreatmentsModal] = useState(false);
//   const [selectedPatientForView, setSelectedPatientForView] = useState(null);
//   const [treatmentsList, setTreatmentsList] = useState([]);
//   const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

//   const showToast = (message, severity = "success") => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const fetchPatients = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Patient`);
//       if (res.data && Array.isArray(res.data) && res.data.length > 0) {
//         const liveMapped = res.data.map((p, idx) => ({
//           MPD_PATIENT_CODE: p.MPD_PATIENT_CODE || `PA000${idx + 1}`,
//           MPD_PATIENT_NAME: p.MPD_PATIENT_NAME || "Patient",
//           ward: p.MPD_ADDRESS || "Ward 4A • Bed #12",
//           MPD_MOBILE_NO: p.MPD_MOBILE_NO || "0771234567",
//           verifiedType: "Verified SMS",
//           MPD_NIC_NO: p.MPD_NIC_NO || "200311611379",
//           age: p.MPD_DOB ? new Date().getFullYear() - new Date(p.MPD_DOB).getFullYear() : 28,
//           sex: p.MPD_GENDER === "M" ? "Male" : "Female",
//           blood: p.MPD_BLOOD_GROUP || "O+",
//           physician: p.DoctorName || "Dr. Test",
//           department: "Cardiology Unit",
//           status: idx % 3 === 0 ? "Active Inpatient" : idx % 3 === 1 ? "Follow-up Slot" : "RX Dispense Ready",
//           statusColor: idx % 3 === 0 ? "active" : idx % 3 === 1 ? "followup" : "rxready",
//         }));
//         setPatients(liveMapped);
//       }
//     } catch (e) {
//       console.log("Using cached patient dossiers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPatients();
//   }, []);

//   const handleViewPatientTreatments = async (patient) => {
//     setSelectedPatientForView(patient);
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/${patient.MPD_PATIENT_CODE}`
//       );
//       if (res.data && Array.isArray(res.data) && res.data.length > 0) {
//         setTreatmentsList(res.data);
//       } else {
//         setTreatmentsList([
//           {
//             MTD_SERIAL_NO: 1,
//             MTD_CREATED_DATE: new Date().toISOString(),
//             MTD_COMPLAIN: "Acute retrosternal discomfort and elevated blood pressure.",
//             DoctorName: patient.physician,
//           },
//         ]);
//       }
//     } catch (err) {
//       setTreatmentsList([
//         {
//           MTD_SERIAL_NO: 1,
//           MTD_CREATED_DATE: new Date().toISOString(),
//           MTD_COMPLAIN: "Clinical checkup and prescription refill review.",
//           DoctorName: patient.physician,
//         },
//       ]);
//     } finally {
//       setLoading(false);
//       setOpenTreatmentsModal(true);
//     }
//   };

//   const filteredPatients = patients.filter((p) => {
//     if (activeTab === "In-Treatment" && p.status !== "Active Inpatient") return false;
//     if (activeTab === "Follow-up" && p.status !== "Follow-up Slot") return false;
//     if (activeTab === "Pending Pharmacy" && p.status !== "RX Dispense Ready") return false;
//     if (activeTab === "Discharged" && p.status !== "Discharged") return false;

//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       const match =
//         p.MPD_PATIENT_NAME.toLowerCase().includes(q) ||
//         p.MPD_PATIENT_CODE.toLowerCase().includes(q) ||
//         p.MPD_NIC_NO.includes(q) ||
//         p.MPD_MOBILE_NO.includes(q);
//       if (!match) return false;
//     }

//     if (selectedPhysician !== "All Doctors") {
//       if (!p.physician.includes(selectedPhysician)) return false;
//     }

//     return true;
//   });

//   const handleExportCSV = () => {
//     if (filteredPatients.length === 0) {
//       showToast("No data to export", "warning");
//       return;
//     }
//     const headers = [
//       "Patient Code",
//       "Patient Name",
//       "Ward/Address",
//       "Mobile No",
//       "NIC",
//       "Age",
//       "Sex",
//       "Blood",
//       "Physician",
//       "Department",
//       "Status"
//     ];
    
//     const csvRows = [headers.join(",")];
    
//     for (const p of filteredPatients) {
//       const row = [
//         p.MPD_PATIENT_CODE,
//         `"${p.MPD_PATIENT_NAME || ""}"`,
//         `"${p.ward || ""}"`,
//         p.MPD_MOBILE_NO,
//         p.MPD_NIC_NO,
//         p.age,
//         p.sex,
//         p.blood,
//         `"${p.physician || ""}"`,
//         `"${p.department || ""}"`,
//         p.status
//       ];
//       csvRows.push(row.join(","));
//     }
    
//     const csvString = csvRows.join("\n");
//     const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.setAttribute("download", `patients_export_${new Date().getTime()}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     showToast("Export successful!", "success");
//   };

//   const allPatientsCount = patients.length;
//   const inTreatmentCount = patients.filter(p => p.status === "Active Inpatient").length;
//   const followUpCount = patients.filter(p => p.status === "Follow-up Slot").length;
//   const pendingPharmacyCount = patients.filter(p => p.status === "RX Dispense Ready").length;
//   const dischargedCount = patients.filter(p => p.status === "Discharged").length;

//   return (
//     <div className="hospital-admin-page-container">
//       {/* ── Page Header ────────────────────────────────────── */}
//       <div className="page-title-row">
//         <div>
//           <h1 className="page-title-heading">Search Patient Records &amp; Clinical Dossiers</h1>
//           <p className="page-subtitle-text">
//             Manage confidential medical files, add new admissions, and trigger immediate prescription lookup across active hospital wings.
//           </p>
//         </div>

//         <div className="page-action-group">
//           {/* <button className="btn-secondary-white" onClick={fetchPatients}>
//             <SyncIcon sx={{ fontSize: 16 }} />
//             <span>Sync EHR</span>
//           </button> */}
//           <button
//             className="btn-secondary-white"
//             onClick={handleExportCSV}
//           >
//             <DownloadIcon sx={{ fontSize: 16 }} />
//             <span>Export CSV</span>
//           </button>
//           <button className="btn-primary-cyan" onClick={() => setOpenAdmissionModal(true)}>
//             <AddIcon sx={{ fontSize: 18 }} />
//             <span>Add New Patient Admission</span>
//           </button>
//         </div>
//       </div>

//       {/* ── Global Search Bar & Filters ─────────────────────── */}
//       <div
//         className="clinical-table-card"
//         style={{
//           padding: "16px 20px",
//           display: "flex",
//           alignItems: "center",
//           gap: "14px",
//           marginBottom: "16px",
//           flexWrap: "wrap",
//         }}
//       >
//         <div
//           className="topbar-search-box"
//           style={{
//             flex: 1,
//             minWidth: "300px",
//             background: "#F8FAFC",
//             border: "1px solid #E2E8F0",
//             position: "relative",
//           }}
//         >
//           <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
//           <input
//             type="text"
//             placeholder="Search by Patient Name, National Identity (NIC), Patient Code (e.g. PA...)"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//           <span
//             style={{
//               fontSize: "11px",
//               fontWeight: 700,
//               color: "#94A3B8",
//               background: "#E2E8F0",
//               padding: "2px 6px",
//               borderRadius: "4px",
//             }}
//           >
//             ⌘K
//           </span>
//         </div>

//         <select
//           value={selectedPhysician}
//           onChange={(e) => setSelectedPhysician(e.target.value)}
//           style={{
//             padding: "8px 14px",
//             borderRadius: "8px",
//             border: "1px solid #E2E8F0",
//             background: "#FFFFFF",
//             fontSize: "13px",
//             fontWeight: 600,
//             color: "#334155",
//             cursor: "pointer",
//           }}
//         >
//           <option value="All Doctors">Specialist: All Doctors</option>
//           <option value="Dr. Test">Dr. Test (Cardiology / ENT)</option>
//           <option value="Dr. Bennett">Dr. Bennett (General Med)</option>
//           <option value="Dr. Adams">Dr. Adams (Pediatrics)</option>
//           <option value="Dr. Vance">Dr. Vance (Orthopedics)</option>
//           <option value="Dr. Watson">Dr. Watson (Neuroscience)</option>
//         </select>

//         <button className="btn-secondary-white" onClick={() => showToast("Filters dialog opened", "info")}>
//           <FilterIcon sx={{ fontSize: 16 }} />
//           <span>Filters</span>
//         </button>
//       </div>

//       {/* ── Filter Tabs & HIPAA Badge ───────────────────────── */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "16px",
//           flexWrap: "wrap",
//           gap: "10px",
//         }}
//       >
//         <div className="filter-pills-row">
//           <button
//             className={`filter-pill-btn ${activeTab === "All Patients" ? "active" : ""}`}
//             onClick={() => setActiveTab("All Patients")}
//           >
//             All Patients ({allPatientsCount})
//           </button>
//           <button
//             className={`filter-pill-btn ${activeTab === "In-Treatment" ? "active" : ""}`}
//             onClick={() => setActiveTab("In-Treatment")}
//           >
//             In-Treatment ({inTreatmentCount})
//           </button>
//           <button
//             className={`filter-pill-btn ${activeTab === "Follow-up" ? "active" : ""}`}
//             onClick={() => setActiveTab("Follow-up")}
//           >
//             Follow-up ({followUpCount})
//           </button>
//           <button
//             className={`filter-pill-btn ${activeTab === "Pending Pharmacy" ? "active" : ""}`}
//             onClick={() => setActiveTab("Pending Pharmacy")}
//           >
//             Pending Pharmacy ({pendingPharmacyCount})
//           </button>
//           <button
//             className={`filter-pill-btn ${activeTab === "Discharged" ? "active" : ""}`}
//             onClick={() => setActiveTab("Discharged")}
//           >
//             Discharged ({dischargedCount})
//           </button>
//         </div>

//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "6px",
//             background: "#EFF6FF",
//             color: "#1D4ED8",
//             fontSize: "11.5px",
//             fontWeight: 700,
//             padding: "5px 12px",
//             borderRadius: "20px",
//             border: "1px solid rgba(29, 78, 216, 0.15)",
//           }}
//         >
//           <ShieldIcon sx={{ fontSize: 14 }} />
//           <span>HIPAA Certified Vault • End-to-End Encrypted</span>
//         </div>
//       </div>

//       {/* ── Patient Records Clinical Table ──────────────────── */}
//       <div className="clinical-table-card">
//         <div style={{ overflowX: "auto" }}>
//           <table className="clinical-table">
//             <thead>
//               <tr>
//                 <th>PATIENT CODE</th>
//                 <th>PATIENT IDENTITY</th>
//                 <th>CONTACT &amp; VERIFICATION</th>
//                 <th>NATIONAL ID (NIC)</th>
//                 <th>AGE / SEX</th>
//                 <th>ASSIGNED PHYSICIAN</th>
//                 <th>CLINICAL STATUS</th>
//                 <th style={{ textAlign: "center" }}>ACTIONS</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredPatients.map((p) => {
//                 const initials = p.MPD_PATIENT_NAME.split(" ")
//                   .map((w) => w[0])
//                   .join("")
//                   .slice(0, 2)
//                   .toUpperCase();

//                 const getStatusPill = (status) => {
//                   if (status === "Active Inpatient") {
//                     return (
//                       <span
//                         style={{
//                           background: "#E0F2FE",
//                           color: "#0284C7",
//                           padding: "3px 10px",
//                           borderRadius: "12px",
//                           fontSize: "11px",
//                           fontWeight: 700,
//                         }}
//                       >
//                         ● Active Inpatient
//                       </span>
//                     );
//                   }
//                   if (status === "Follow-up Slot") {
//                     return (
//                       <span
//                         style={{
//                           background: "#EFF6FF",
//                           color: "#2563EB",
//                           padding: "3px 10px",
//                           borderRadius: "12px",
//                           fontSize: "11px",
//                           fontWeight: 700,
//                         }}
//                       >
//                         ● Follow-up Slot
//                       </span>
//                     );
//                   }
//                   if (status === "RX Dispense Ready") {
//                     return (
//                       <span
//                         style={{
//                           background: "#DBEAFE",
//                           color: "#1D4ED8",
//                           padding: "3px 10px",
//                           borderRadius: "12px",
//                           fontSize: "11px",
//                           fontWeight: 700,
//                         }}
//                       >
//                         ● RX Dispense Ready
//                       </span>
//                     );
//                   }
//                   if (status === "Doctor Review") {
//                     return (
//                       <span
//                         style={{
//                           background: "#EDE9FE",
//                           color: "#7C3AED",
//                           padding: "3px 10px",
//                           borderRadius: "12px",
//                           fontSize: "11px",
//                           fontWeight: 700,
//                         }}
//                       >
//                         ● Doctor Review
//                       </span>
//                     );
//                   }
//                   return (
//                     <span
//                       style={{
//                         background: "#F1F5F9",
//                         color: "#64748B",
//                         padding: "3px 10px",
//                         borderRadius: "12px",
//                         fontSize: "11px",
//                         fontWeight: 700,
//                       }}
//                     >
//                       ● Discharged
//                     </span>
//                   );
//                 };

//                 return (
//                   <tr key={p.MPD_PATIENT_CODE}>
//                     <td>
//                       <span
//                         style={{
//                           background: "#E0F2FE",
//                           color: "#0284C7",
//                           fontSize: "11.5px",
//                           fontWeight: 800,
//                           padding: "3px 8px",
//                           borderRadius: "6px",
//                         }}
//                       >
//                         {p.MPD_PATIENT_CODE}
//                       </span>
//                     </td>

//                     <td>
//                       <div className="user-identity-cell">
//                         <div className="table-user-avatar" style={{ background: "#0284C7" }}>
//                           {initials}
//                         </div>
//                         <div>
//                           <div className="table-user-name">{p.MPD_PATIENT_NAME}</div>
//                           <div className="table-user-handle">{p.ward}</div>
//                         </div>
//                       </div>
//                     </td>

//                     <td>
//                       <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "12.5px" }}>
//                         {p.MPD_MOBILE_NO}
//                       </div>
//                       <div style={{ fontSize: "11px", color: "#0284C7", display: "flex", alignItems: "center", gap: "3px" }}>
//                         <CheckCircleIcon sx={{ fontSize: 12 }} />
//                         <span>{p.verifiedType}</span>
//                       </div>
//                     </td>

//                     <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
//                       {p.MPD_NIC_NO}
//                     </td>

//                     <td>
//                       <div style={{ fontSize: "12.5px", color: "#1E293B", fontWeight: 600 }}>
//                         {p.age} Yrs • {p.sex}
//                       </div>
//                       <div style={{ fontSize: "11px", color: "#64748B" }}>Blood: {p.blood}</div>
//                     </td>

//                     <td>
//                       <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                         <MedicalIcon sx={{ fontSize: 15, color: "#0284C7" }} />
//                         <div>
//                           <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0F172A" }}>
//                             {p.physician}
//                           </div>
//                           <div style={{ fontSize: "11px", color: "#64748B" }}>{p.department}</div>
//                         </div>
//                       </div>
//                     </td>

//                     <td>{getStatusPill(p.status)}</td>

//                     <td style={{ textAlign: "center" }}>
//                       <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
//                         <button
//                           className="topbar-icon-btn"
//                           style={{ width: "30px", height: "30px" }}
//                           title="View Clinical Dossier"
//                           onClick={() => handleViewPatientTreatments(p)}
//                         >
//                           <InfoIcon sx={{ fontSize: 16 }} />
//                         </button>
//                         <button
//                           className="topbar-icon-btn"
//                           style={{ width: "30px", height: "30px" }}
//                           title="Add Treatment"
//                           onClick={() => navigate(`/dashboard/addrecord/${p.MPD_PATIENT_CODE}`)}
//                         >
//                           <AddIcon sx={{ fontSize: 16 }} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Bar */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             padding: "14px 20px",
//             borderTop: "1px solid #F1F5F9",
//             fontSize: "12.5px",
//             color: "#64748B",
//             flexWrap: "wrap",
//             gap: "10px",
//           }}
//         >
//           <span>Showing 1 - 6 of 1,248 Patient Records</span>

//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <span>Show</span>
//             <select
//               style={{
//                 padding: "3px 8px",
//                 borderRadius: "6px",
//                 border: "1px solid #CBD5E1",
//                 fontSize: "12px",
//                 background: "#FFFFFF",
//               }}
//             >
//               <option>10 per page</option>
//               <option>25 per page</option>
//               <option>50 per page</option>
//             </select>
//           </div>

//           <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
//             <button className="filter-pill-btn" style={{ padding: "4px 8px" }}>
//               &lsaquo;
//             </button>
//             <button className="filter-pill-btn active" style={{ padding: "4px 10px" }}>
//               1
//             </button>
//             <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>
//               2
//             </button>
//             <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>
//               3
//             </button>
//             <span style={{ color: "#94A3B8" }}>...</span>
//             <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>
//               125
//             </button>
//             <button className="filter-pill-btn" style={{ padding: "4px 8px" }}>
//               &rsaquo;
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ── 3 Bottom Innovation Cards (Image 3) ─────────────── */}
//       <div className="clinical-triplet-grid">
//         <div className="clinical-feature-card">
//           <div>
//             <div className="feature-header-row">
//               <div className="feature-icon-badge">
//                 <BioIcon sx={{ fontSize: 20 }} />
//               </div>
//               <span className="feature-status-tag">BIO-VALIDATED</span>
//             </div>
//             <h4 className="feature-title">Synchronized NIC &amp; Bio-ID</h4>
//             <p className="feature-desc">
//               Dual-factor patient identification linking national registration cards with real-time biometric scanning and instant ward check-ins.
//             </p>
//           </div>
//           <div className="feature-footer-action" onClick={() => showToast("Bio-ID Scanner module calibrated.", "info")}>
//             <span>● 99.98% Accuracy</span>
//             <ArrowForwardIcon sx={{ fontSize: 14 }} />
//           </div>
//         </div>

//         <div className="clinical-feature-card">
//           <div>
//             <div className="feature-header-row">
//               <div className="feature-icon-badge" style={{ background: "#EFF6FF", color: "#2563EB" }}>
//                 <PharmacyIcon sx={{ fontSize: 20 }} />
//               </div>
//               <span className="feature-status-tag" style={{ background: "#EFF6FF", color: "#2563EB" }}>
//                 AUTO-ROUTING
//               </span>
//             </div>
//             <h4 className="feature-title">Smart Pharmacy Dispatch</h4>
//             <p className="feature-desc">
//               Physician prescriptions automatically feed the automated dispensary carousels, cross-checking allergy alerts and narcotics thresholds.
//             </p>
//           </div>
//           <div className="feature-footer-action" onClick={() => navigate("/dashboard/pharmacy")}>
//             <span>● Zero Cross-Contamination</span>
//             <ArrowForwardIcon sx={{ fontSize: 14 }} />
//           </div>
//         </div>

//         <div className="clinical-feature-card">
//           <div>
//             <div className="feature-header-row">
//               <div className="feature-icon-badge" style={{ background: "#EFF6FF", color: "#0284C7" }}>
//                 <TelemetryIcon sx={{ fontSize: 20 }} />
//               </div>
//               <span className="feature-status-tag" style={{ background: "#EFF6FF", color: "#0284C7" }}>
//                 ICU TELEMETRY
//               </span>
//             </div>
//             <h4 className="feature-title">Telemetry Integration</h4>
//             <p className="feature-desc">
//               Continuous streaming of SpO2, heart rhythm, and arterial line pressures straight into patient files with automated clinician escalations.
//             </p>
//           </div>
//           <div className="feature-footer-action" onClick={() => showToast("Telemetry mesh synchronized.", "info")}>
//             <span>● 24/7 Surveillance</span>
//             <ArrowForwardIcon sx={{ fontSize: 14 }} />
//           </div>
//         </div>
//       </div>

//       {/* ── Dialog: Add New Patient Admission ───────────────── */}
//       <Dialog
//         open={openAdmissionModal}
//         onClose={() => setOpenAdmissionModal(false)}
//         maxWidth="md"
//         fullWidth
//         PaperProps={{ sx: { borderRadius: "16px" } }}
//       >
//         <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <strong style={{ fontSize: "18px", color: "#0F172A" }}>New Clinical Inpatient Admission</strong>
//           <IconButton onClick={() => setOpenAdmissionModal(false)}>
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent dividers>
//           <Addpatient onClose={() => setOpenAdmissionModal(false)} onAdded={fetchPatients} />
//         </DialogContent>
//       </Dialog>

//       {/* ── Dialog: View Treatment Details & Dossier ────────── */}
//       <Dialog
//         open={openTreatmentsModal}
//         onClose={() => setOpenTreatmentsModal(false)}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{ sx: { borderRadius: "16px" } }}
//       >
//         <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <div>
//             <strong style={{ fontSize: "17px", color: "#0F172A" }}>
//               Clinical Dossier: {selectedPatientForView?.MPD_PATIENT_NAME}
//             </strong>
//             <div style={{ fontSize: "12px", color: "#64748B" }}>
//               Code: {selectedPatientForView?.MPD_PATIENT_CODE} • NIC: {selectedPatientForView?.MPD_NIC}
//             </div>
//           </div>
//           <IconButton onClick={() => setOpenTreatmentsModal(false)}>
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent dividers>
//           {treatmentsList.length > 0 ? (
//             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//               {treatmentsList.map((t, idx) => (
//                 <div
//                   key={idx}
//                   style={{
//                     padding: "14px",
//                     background: "#F8FAFC",
//                     border: "1px solid #E2E8F0",
//                     borderRadius: "10px",
//                   }}
//                 >
//                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
//                     <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>
//                       Visit Encounter #{treatmentsList.length - idx}
//                     </strong>
//                     <span style={{ fontSize: "12px", color: "#64748B" }}>
//                       {new Date(t.MTD_CREATED_DATE).toLocaleDateString()}
//                     </span>
//                   </div>
//                   <div style={{ fontSize: "13px", color: "#334155", marginBottom: "10px" }}>
//                     <strong>Clinical Complain:</strong> {t.MTD_COMPLAIN}
//                   </div>
//                   <Button
//                     size="small"
//                     variant="outlined"
//                     startIcon={<VisibilityIcon />}
//                     onClick={() => {
//                       setOpenTreatmentsModal(false);
//                       navigate(
//                         `/dashboard/view-record/${selectedPatientForView.MPD_PATIENT_CODE}/${t.MTD_SERIAL_NO || 1}`,
//                         { state: { message: "Medical History" } }
//                       );
//                     }}
//                   >
//                     View Full Medical Record
//                   </Button>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div style={{ textAlign: "center", padding: "20px", color: "#64748B" }}>
//               No treatment records registered for this patient yet.
//             </div>
//           )}
//         </DialogContent>
//         <DialogActions sx={{ p: 2 }}>
//           <Button
//             variant="contained"
//             sx={{ bgcolor: "#006699" }}
//             onClick={() => {
//               setOpenTreatmentsModal(false);
//               navigate(`/dashboard/addrecord/${selectedPatientForView.MPD_PATIENT_CODE}`);
//             }}
//           >
//             Add New Treatment Visit
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar feedback */}
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={4000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//         anchorOrigin={{ vertical: "top", horizontal: "right" }}
//       >
//         <Alert
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//           severity={snackbar.severity}
//           sx={{ width: "100%", borderRadius: "10px" }}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </div>
//   );
// }


import React, { useEffect, useMemo, useState } from "react";
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
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  EditOutlined as EditIcon,
  FileDownload as DownloadIcon,
  InfoOutlined as InfoIcon,
  LocalPharmacy as PharmacyIcon,
  MedicalServices as MedicalIcon,
  MonitorHeart as RecordsIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  Visibility as VisibilityIcon,
  Fingerprint as IdentityIcon,
} from "@mui/icons-material";
import Addpatient from "../components/addPatients";

const STATUS_META = {
  IN_TREATMENT: {
    label: "In Treatment",
    background: "#E0F2FE",
    color: "#0284C7",
  },
  FOLLOW_UP: {
    label: "Follow-up Scheduled",
    background: "#EFF6FF",
    color: "#2563EB",
  },
  PENDING_PHARMACY: {
    label: "Pending Pharmacy",
    background: "#FEF3C7",
    color: "#B45309",
  },
  DISCHARGED: {
    label: "Discharged / Inactive",
    background: "#F1F5F9",
    color: "#64748B",
  },
  COMPLETED: {
    label: "Encounter Completed",
    background: "#ECFDF5",
    color: "#059669",
  },
  REGISTERED: {
    label: "Registered",
    background: "#F8FAFC",
    color: "#475569",
  },
};

const safeText = (value, fallback = "Not recorded") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
};

const formatDate = (value, fallback = "Not recorded") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
};

const csvEscape = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export default function MedicalHistory() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhysician, setSelectedPhysician] = useState("All Doctors");
  const [activeTab, setActiveTab] = useState("All Patients");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAdmissionModal, setOpenAdmissionModal] = useState(false);
  const [editingPatientCode, setEditingPatientCode] = useState(null);

  const [openTreatmentsModal, setOpenTreatmentsModal] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState(null);
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/Patient/records`
      );

      const rows = Array.isArray(response.data) ? response.data : [];
      setPatients(rows);
    } catch (error) {
      console.error("Failed to load patient records:", error);
      setPatients([]);
      showToast(
        error.response?.data?.error ||
          "Unable to load patient records from the server.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const physicianOptions = useMemo(() => {
    return Array.from(
      new Set(
        patients
          .map((patient) => patient.AssignedPhysicianName)
          .filter((name) => name && String(name).trim())
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [patients]);

  useEffect(() => {
    if (
      selectedPhysician !== "All Doctors" &&
      !physicianOptions.includes(selectedPhysician)
    ) {
      setSelectedPhysician("All Doctors");
    }
  }, [physicianOptions, selectedPhysician]);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return patients.filter((patient) => {
      if (
        activeTab === "In-Treatment" &&
        patient.ClinicalStatusCode !== "IN_TREATMENT"
      ) {
        return false;
      }
      if (
        activeTab === "Follow-up" &&
        patient.ClinicalStatusCode !== "FOLLOW_UP"
      ) {
        return false;
      }
      if (
        activeTab === "Pending Pharmacy" &&
        patient.ClinicalStatusCode !== "PENDING_PHARMACY"
      ) {
        return false;
      }
      if (
        activeTab === "Discharged" &&
        patient.ClinicalStatusCode !== "DISCHARGED"
      ) {
        return false;
      }

      if (selectedPhysician !== "All Doctors") {
        if (patient.AssignedPhysicianName !== selectedPhysician) return false;
      }

      if (!normalizedQuery) return true;

      const searchableValues = [
        patient.PatientCode,
        patient.PatientName,
        patient.MobileNo,
        patient.Email,
        patient.NicNo,
        patient.PatientType,
        patient.City,
        patient.AssignedPhysicianName,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [patients, activeTab, searchQuery, selectedPhysician]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedPhysician, rowsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / rowsPerPage)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedPatients = filteredPatients.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const allPatientsCount = patients.length;
  const inTreatmentCount = patients.filter(
    (patient) => patient.ClinicalStatusCode === "IN_TREATMENT"
  ).length;
  const followUpCount = patients.filter(
    (patient) => patient.ClinicalStatusCode === "FOLLOW_UP"
  ).length;
  const pendingPharmacyCount = patients.filter(
    (patient) => patient.ClinicalStatusCode === "PENDING_PHARMACY"
  ).length;
  const dischargedCount = patients.filter(
    (patient) => patient.ClinicalStatusCode === "DISCHARGED"
  ).length;

  const openNewAdmission = () => {
    setEditingPatientCode(null);
    setOpenAdmissionModal(true);
  };

  const openEditPatient = (patient) => {
    setEditingPatientCode(patient.PatientCode);
    setOpenAdmissionModal(true);
  };

  const closeAdmissionModal = () => {
    setOpenAdmissionModal(false);
    setEditingPatientCode(null);
  };

  const handlePatientSaved = async () => {
    closeAdmissionModal();
    await fetchPatients();
    showToast(
      editingPatientCode
        ? "Patient record updated successfully."
        : "Patient registered successfully.",
      "success"
    );
  };

  const handleViewPatientTreatments = async (patient) => {
    setSelectedPatientForView(patient);
    setTreatmentsList([]);
    setOpenTreatmentsModal(true);

    try {
      setTreatmentsLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/${patient.PatientCode}`
      );

      setTreatmentsList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (error.response?.status === 404) {
        setTreatmentsList([]);
      } else {
        console.error("Failed to load treatment history:", error);
        showToast("Unable to load this patient's treatment history.", "error");
      }
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredPatients.length === 0) {
      showToast("No patient records are available to export.", "warning");
      return;
    }

    const headers = [
      "Patient Code",
      "Patient Name",
      "Patient Type",
      "Mobile No",
      "Email",
      "NIC",
      "Date of Birth",
      "Age",
      "Gender",
      "Blood Group",
      "Address",
      "City",
      "Assigned Physician",
      "Specialization",
      "Clinical Status",
      "Last Encounter",
      "Next Appointment",
    ];

    const rows = filteredPatients.map((patient) => [
      patient.PatientCode,
      patient.PatientName,
      patient.PatientType,
      patient.MobileNo,
      patient.Email,
      patient.NicNo,
      patient.DateOfBirth ? formatDate(patient.DateOfBirth, "") : "",
      patient.Age ?? "",
      patient.Gender,
      patient.BloodGroup,
      patient.Address,
      patient.City,
      patient.AssignedPhysicianName,
      patient.Specialization,
      patient.ClinicalStatus,
      patient.LastEncounterDate ? formatDate(patient.LastEncounterDate, "") : "",
      patient.NextAppointmentDate
        ? formatDate(patient.NextAppointmentDate, "")
        : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `patient_records_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Patient records exported successfully.", "success");
  };

  const renderStatusPill = (patient) => {
    const meta = STATUS_META[patient.ClinicalStatusCode] || {
      label: safeText(patient.ClinicalStatus, "Status not recorded"),
      background: "#F8FAFC",
      color: "#64748B",
    };

    return (
      <span
        style={{
          background: meta.background,
          color: meta.color,
          padding: "3px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        ● {patient.ClinicalStatus || meta.label}
      </span>
    );
  };

  return (
    <div className="hospital-admin-page-container">
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">
            Search Patient Records &amp; Clinical Dossiers
          </h1>
          <p className="page-subtitle-text">
            Review database-backed patient demographics, current clinical state,
            assigned physician context, and treatment history.
          </p>
        </div>

        <div className="page-action-group">
          <button className="btn-secondary-white" onClick={handleExportCSV}>
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Export CSV</span>
          </button>
          <button className="btn-primary-cyan" onClick={openNewAdmission}>
            <AddIcon sx={{ fontSize: 18 }} />
            <span>Add New Patient Admission</span>
          </button>
        </div>
      </div>

      <div
        className="clinical-table-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="topbar-search-box"
          style={{
            flex: 1,
            minWidth: "300px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            position: "relative",
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
          <input
            type="text"
            placeholder="Search by name, NIC, patient code, phone, email or doctor"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <select
          value={selectedPhysician}
          onChange={(event) => setSelectedPhysician(event.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <option value="All Doctors">Specialist: All Doctors</option>
          {physicianOptions.map((physician) => (
            <option key={physician} value={physician}>
              {physician}
            </option>
          ))}
        </select>

        <button
          className="btn-secondary-white"
          onClick={fetchPatients}
          disabled={loading}
        >
          <SyncIcon sx={{ fontSize: 16 }} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div className="filter-pills-row">
          <button
            className={`filter-pill-btn ${
              activeTab === "All Patients" ? "active" : ""
            }`}
            onClick={() => setActiveTab("All Patients")}
          >
            All Patients ({allPatientsCount})
          </button>
          <button
            className={`filter-pill-btn ${
              activeTab === "In-Treatment" ? "active" : ""
            }`}
            onClick={() => setActiveTab("In-Treatment")}
          >
            In-Treatment ({inTreatmentCount})
          </button>
          <button
            className={`filter-pill-btn ${
              activeTab === "Follow-up" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Follow-up")}
          >
            Follow-up ({followUpCount})
          </button>
          <button
            className={`filter-pill-btn ${
              activeTab === "Pending Pharmacy" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Pending Pharmacy")}
          >
            Pending Pharmacy ({pendingPharmacyCount})
          </button>
          <button
            className={`filter-pill-btn ${
              activeTab === "Discharged" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Discharged")}
          >
            Discharged ({dischargedCount})
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#ECFDF5",
            color: "#047857",
            fontSize: "11.5px",
            fontWeight: 700,
            padding: "5px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(4, 120, 87, 0.15)",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 14 }} />
          <span>Database-backed records • No placeholder clinical values</span>
        </div>
      </div>

      <div className="clinical-table-card">
        <div style={{ overflowX: "auto" }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>PATIENT CODE</th>
                <th>PATIENT IDENTITY</th>
                <th>CONTACT</th>
                <th>NATIONAL ID (NIC)</th>
                <th>AGE / SEX</th>
                <th>ASSIGNED PHYSICIAN</th>
                <th>CLINICAL STATUS</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 34 }}>
                    <CircularProgress size={24} />
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      color: "#64748B",
                    }}
                  >
                    No patient records match the current search or filter.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const name = safeText(patient.PatientName, "Name not recorded");
                  const initials = name
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const locationText = [patient.PatientType, patient.City]
                    .filter(Boolean)
                    .join(" • ");

                  const ageSex = [
                    patient.Age !== null && patient.Age !== undefined
                      ? `${patient.Age} Yrs`
                      : null,
                    patient.Gender,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <tr key={patient.PatientCode}>
                      <td>
                        <span
                          style={{
                            background: "#E0F2FE",
                            color: "#0284C7",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {safeText(patient.PatientCode, "—")}
                        </span>
                      </td>

                      <td>
                        <div className="user-identity-cell">
                          <div
                            className="table-user-avatar"
                            style={{ background: "#0284C7" }}
                          >
                            {initials || "PT"}
                          </div>
                          <div>
                            <div className="table-user-name">{name}</div>
                            <div className="table-user-handle">
                              {locationText || "Patient category not recorded"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0F172A",
                            fontSize: "12.5px",
                          }}
                        >
                          {safeText(patient.MobileNo)}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: patient.Email ? "#0284C7" : "#94A3B8",
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={patient.Email || "Email not recorded"}
                        >
                          {safeText(patient.Email, "Email not recorded")}
                        </div>
                      </td>

                      <td
                        style={{
                            fontWeight: 700,
                            color: "#0F172A",
                            fontSize: "12.5px",
                          }}
                      >
                        {safeText(patient.NicNo)}
                      </td>

                      <td>
                        <div
                          style={{
                            fontSize: "12.5px",
                            color: "#1E293B",
                            fontWeight: 600,
                          }}
                        >
                          {ageSex || "Age / sex not recorded"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>
                          Blood: {safeText(patient.BloodGroup)}
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <MedicalIcon sx={{ fontSize: 15, color: "#0284C7" }} />
                          <div>
                            <div
                              style={{
                                fontSize: "12.5px",
                                fontWeight: 700,
                                color: patient.AssignedPhysicianName
                                  ? "#0F172A"
                                  : "#64748B",
                              }}
                            >
                              {safeText(
                                patient.AssignedPhysicianName,
                                "Not assigned"
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>
                              {patient.Specialization
                                ? patient.Specialization
                                : patient.NextAppointmentDate
                                  ? `Next: ${formatDate(patient.NextAppointmentDate)}`
                                  : "Specialization not recorded"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{renderStatusPill(patient)}</td>

                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <button
                            className="topbar-icon-btn"
                            style={{ width: "30px", height: "30px" }}
                            title="View Clinical Dossier"
                            onClick={() => handleViewPatientTreatments(patient)}
                          >
                            <InfoIcon sx={{ fontSize: 16 }} />
                          </button>
                          <button
                            className="topbar-icon-btn"
                            style={{ width: "30px", height: "30px" }}
                            title="Edit Patient Demographics"
                            onClick={() => openEditPatient(patient)}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </button>
                          <button
                            className="topbar-icon-btn"
                            style={{ width: "30px", height: "30px" }}
                            title="Add Treatment"
                            onClick={() =>
                              navigate(`/dashboard/addrecord/${patient.PatientCode}`)
                            }
                          >
                            <AddIcon sx={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderTop: "1px solid #F1F5F9",
            fontSize: "12.5px",
            color: "#64748B",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <span>
            {filteredPatients.length === 0
              ? "Showing 0 Patient Records"
              : `Showing ${startIndex + 1} - ${Math.min(
                  startIndex + rowsPerPage,
                  filteredPatients.length
                )} of ${filteredPatients.length} Patient Records`}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                fontSize: "12px",
                background: "#FFFFFF",
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              className="filter-pill-btn"
              style={{ padding: "4px 8px" }}
              disabled={currentPage <= 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            >
              &lsaquo;
            </button>
            <span style={{ minWidth: 90, textAlign: "center" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="filter-pill-btn"
              style={{ padding: "4px 8px" }}
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((previous) => Math.min(totalPages, previous + 1))
              }
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </div>

      <div className="clinical-triplet-grid">
        <div className="clinical-feature-card">
          <div>
            <div className="feature-header-row">
              <div className="feature-icon-badge">
                <IdentityIcon sx={{ fontSize: 20 }} />
              </div>
              <span className="feature-status-tag">DATA QUALITY</span>
            </div>
            <h4 className="feature-title">Patient Identity Completeness</h4>
            <p className="feature-desc">
              Missing demographic values are displayed as “Not recorded” instead of
              being replaced with made-up age, gender, NIC, address, or blood-group data.
            </p>
          </div>
          <div className="feature-footer-action" onClick={fetchPatients}>
            <span>Refresh patient data</span>
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </div>
        </div>

        <div className="clinical-feature-card">
          <div>
            <div className="feature-header-row">
              <div
                className="feature-icon-badge"
                style={{ background: "#EFF6FF", color: "#2563EB" }}
              >
                <PharmacyIcon sx={{ fontSize: 20 }} />
              </div>
              <span
                className="feature-status-tag"
                style={{ background: "#EFF6FF", color: "#2563EB" }}
              >
                LIVE STATUS
              </span>
            </div>
            <h4 className="feature-title">Prescription-aware Status</h4>
            <p className="feature-desc">
              Pending Pharmacy is derived from actual prescribed versus dispensed
              quantities in MED_DRUGS_DETAILS instead of a row-index placeholder.
            </p>
          </div>
          <div
            className="feature-footer-action"
            onClick={() => navigate("/dashboard/pharmacy")}
          >
            <span>Open pharmacy</span>
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </div>
        </div>

        <div className="clinical-feature-card">
          <div>
            <div className="feature-header-row">
              <div
                className="feature-icon-badge"
                style={{ background: "#EFF6FF", color: "#0284C7" }}
              >
                <RecordsIcon sx={{ fontSize: 20 }} />
              </div>
              <span
                className="feature-status-tag"
                style={{ background: "#EFF6FF", color: "#0284C7" }}
              >
                LINKED RECORDS
              </span>
            </div>
            <h4 className="feature-title">Appointment &amp; Treatment Context</h4>
            <p className="feature-desc">
              Assigned physician, next appointment, and encounter state are resolved
              from CareSync appointment, treatment, user, and prescription records.
            </p>
          </div>
          <div className="feature-footer-action" onClick={fetchPatients}>
            <span>Synchronize table</span>
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </div>
        </div>
      </div>

      <Dialog
        open={openAdmissionModal}
        onClose={closeAdmissionModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong style={{ fontSize: "18px", color: "#0F172A" }}>
            {editingPatientCode
              ? `Edit Patient Record: ${editingPatientCode}`
              : "New Patient Admission"}
          </strong>
          <IconButton onClick={closeAdmissionModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Addpatient
            patientCode={editingPatientCode || undefined}
            handleClose={closeAdmissionModal}
            onSuccess={handlePatientSaved}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openTreatmentsModal}
        onClose={() => setOpenTreatmentsModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <div>
            <strong style={{ fontSize: "17px", color: "#0F172A" }}>
              Clinical Dossier: {selectedPatientForView?.PatientName}
            </strong>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: 3 }}>
              Code: {safeText(selectedPatientForView?.PatientCode, "—")} • NIC:{" "}
              {safeText(selectedPatientForView?.NicNo)}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: 2 }}>
              DOB: {formatDate(selectedPatientForView?.DateOfBirth)} • Blood:{" "}
              {safeText(selectedPatientForView?.BloodGroup)} • Physician:{" "}
              {safeText(selectedPatientForView?.AssignedPhysicianName, "Not assigned")}
            </div>
          </div>
          <IconButton onClick={() => setOpenTreatmentsModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {treatmentsLoading ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <CircularProgress size={24} />
            </div>
          ) : treatmentsList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {treatmentsList.map((treatment, index) => (
                <div
                  key={`${treatment.MTD_SERIAL_NO || "record"}-${index}`}
                  style={{
                    padding: "14px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: "6px",
                    }}
                  >
                    <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>
                      Visit Encounter #{treatment.MTD_SERIAL_NO || index + 1}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      {formatDate(
                        treatment.MTD_DATE || treatment.MTD_CREATED_DATE,
                        "Date not recorded"
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#475569",
                      marginBottom: 6,
                    }}
                  >
                    Physician: {safeText(treatment.MTD_DOCTOR, "Not recorded")}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#334155",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>Clinical Complaint:</strong>{" "}
                    {safeText(treatment.MTD_COMPLAIN, "Not recorded")}
                  </div>

                  {treatment.MTD_SERIAL_NO && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        setOpenTreatmentsModal(false);
                        navigate(
                          `/dashboard/view-record/${selectedPatientForView.PatientCode}/${treatment.MTD_SERIAL_NO}`,
                          { state: { message: "Medical History" } }
                        );
                      }}
                    >
                      View Full Medical Record
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#64748B" }}
            >
              No treatment records are stored for this patient yet.
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            sx={{ bgcolor: "#006699" }}
            disabled={!selectedPatientForView?.PatientCode}
            onClick={() => {
              setOpenTreatmentsModal(false);
              navigate(
                `/dashboard/addrecord/${selectedPatientForView.PatientCode}`
              );
            }}
          >
            Add New Treatment Visit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() =>
            setSnackbar((previous) => ({ ...previous, open: false }))
          }
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: "10px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
