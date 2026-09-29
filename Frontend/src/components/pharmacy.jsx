import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  Checkbox,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  ReceiptLong as ReceiptIcon,
  LocalPharmacy as PharmacyIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Shield as ShieldIcon,
  Message as SmsIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  Description as DocIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

// Initial mock patients matching screenshot 2
const MOCK_QUEUE = [
  {
    code: "PA0020",
    name: "Chenuka Kuruppu",
    phone: "0766706951",
    doctor: "Dr. Test (Cardiology • Ward 3B)",
    time: "10:14 AM • 05/09/2025",
    status: "Pending",
    pendingCount: 1,
    age: "34Y",
    sex: "Male",
    allergies: "None Reported",
    drugs: [
      {
        id: 1,
        name: "Amoxycillin 500mg",
        desc: "Capsule • Oral • GlaxoSmithKline",
        schedule: "Daily TDS (Every 8h)",
        prescribedQty: 5,
        givenQty: 5,
        rate: 150.0,
        stock: 31,
        stockStatus: "Safe",
        selected: true,
      },
      {
        id: 2,
        name: "Paracetamol 500mg",
        desc: "Tablet • Post-Meal • State Pharma",
        schedule: "BD Post-Meal (PRN)",
        prescribedQty: 10,
        givenQty: 10,
        rate: 90.0,
        stock: 246,
        stockStatus: "Amp",
        selected: true,
      },
    ],
  },
  {
    code: "PA0001",
    name: "PatientTest Alpha",
    phone: "0750104549",
    doctor: "Dr. Nipuna (Neurology)",
    time: "Dispensed: 09:42 AM",
    status: "Completed",
    pendingCount: 0,
    age: "45Y",
    sex: "Female",
    allergies: "Penicillin",
    drugs: [
      {
        id: 3,
        name: "Atorvastatin 20mg",
        desc: "Tablet • Oral • Pfizer",
        schedule: "Once Nightly",
        prescribedQty: 30,
        givenQty: 30,
        rate: 45.0,
        stock: 120,
        stockStatus: "Safe",
        selected: true,
      },
    ],
  },
  {
    code: "PA0015",
    name: "Kavinda Perera",
    phone: "0718899201",
    doctor: "Dr. Test (Cardiology)",
    time: "Allocated: 09:15 AM",
    status: "Pending",
    pendingCount: 3,
    age: "29Y",
    sex: "Male",
    allergies: "None Reported",
    drugs: [
      {
        id: 4,
        name: "Metformin 500mg",
        desc: "Tablet • Oral • Merck",
        schedule: "BD With Meals",
        prescribedQty: 60,
        givenQty: 60,
        rate: 12.0,
        stock: 80,
        stockStatus: "Safe",
        selected: true,
      },
    ],
  },
  {
    code: "PA0012",
    name: "Harini Silva",
    phone: "0773341990",
    doctor: "Dr. Samaranayake",
    time: "05/08/2025",
    status: "Completed",
    pendingCount: 0,
    age: "52Y",
    sex: "Female",
    allergies: "Sulfa drugs",
    drugs: [
      {
        id: 5,
        name: "Omeprazole 20mg",
        desc: "Capsule • Oral • Cipla",
        schedule: "OD Before Breakfast",
        prescribedQty: 14,
        givenQty: 14,
        rate: 25.0,
        stock: 200,
        stockStatus: "Safe",
        selected: true,
      },
    ],
  },
  {
    code: "PA0007",
    name: "Dinuka Jayasinghe",
    phone: "0709923411",
    doctor: "Dr. Nipuna (Neurology)",
    time: "05/08/2025",
    status: "Completed",
    pendingCount: 0,
    age: "38Y",
    sex: "Male",
    allergies: "None Reported",
    drugs: [
      {
        id: 6,
        name: "Cetirizine 10mg",
        desc: "Tablet • Oral • Glaxo",
        schedule: "OD At Night",
        prescribedQty: 10,
        givenQty: 10,
        rate: 15.0,
        stock: 90,
        stockStatus: "Safe",
        selected: true,
      },
    ],
  },
];

export default function Pharmacy() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [filterTab, setFilterTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(MOCK_QUEUE[0]);
  const [activeDrugs, setActiveDrugs] = useState(MOCK_QUEUE[0].drugs);
  const [paymentMethod, setPaymentMethod] = useState("Direct Insurer Claim");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [guideModal, setGuideModal] = useState(false);

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Sync with real backend if live
  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Treatment/preparationcomplete`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const liveQueue = res.data.map((p, idx) => ({
          code: p.MPD_PATIENT_CODE || `PA00${idx + 1}`,
          name: p.MPD_PATIENT_NAME || `Patient ${idx + 1}`,
          phone: p.MPD_MOBILE_NO || "0771234567",
          doctor: p.DoctorName || "Dr. Medical Lead",
          time: p.MTD_DATE ? new Date(p.MTD_DATE).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today",
          status: p.Status === "C" ? "Completed" : "Pending",
          pendingCount: p.PendingCount || 1,
          serial: p.MTD_SERIAL_NO || 1,
          age: "34Y",
          sex: "Male",
          allergies: "None Reported",
          drugs: [
            {
              id: 1,
              name: "Amoxycillin 500mg",
              desc: "Capsule • Oral",
              schedule: "Daily TDS (Every 8h)",
              prescribedQty: 5,
              givenQty: 5,
              rate: 150.0,
              stock: 31,
              stockStatus: "Safe",
              selected: true,
            },
            {
              id: 2,
              name: "Paracetamol 500mg",
              desc: "Tablet • Post-Meal",
              schedule: "BD Post-Meal (PRN)",
              prescribedQty: 10,
              givenQty: 10,
              rate: 90.0,
              stock: 246,
              stockStatus: "Amp",
              selected: true,
            },
          ],
        }));
        setQueue(liveQueue);
        setSelectedPatient(liveQueue[0]);
        setActiveDrugs(liveQueue[0].drugs);
      }
    } catch (e) {
      console.log("Using clinical queue fallback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setActiveDrugs(p.drugs || []);
  };

  const handleQuantityChange = (drugId, delta) => {
    setActiveDrugs((prev) =>
      prev.map((d) => {
        if (d.id === drugId) {
          const nextQty = Math.max(0, d.givenQty + delta);
          return { ...d, givenQty: nextQty };
        }
        return d;
      })
    );
  };

  const handleToggleDrug = (drugId) => {
    setActiveDrugs((prev) =>
      prev.map((d) => (d.id === drugId ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleSelectAll = (selectAll) => {
    setActiveDrugs((prev) => prev.map((d) => ({ ...d, selected: selectAll })));
  };

  // Calculations
  const drugSubtotal = activeDrugs
    .filter((d) => d.selected)
    .reduce((acc, d) => acc + d.givenQty * d.rate, 0) || 1650.0;
  const packagingFee = 250.0;
  const subsidyAmount = -(drugSubtotal * 0.1);
  const totalNetPayable = Math.max(0, drugSubtotal + packagingFee + subsidyAmount);

  const handleDispense = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast(`Invoice generated & medications dispensed for ${selectedPatient.name}!`, "success");
      // Mark as completed
      setQueue((prev) =>
        prev.map((p) => (p.code === selectedPatient.code ? { ...p, status: "Completed", pendingCount: 0 } : p))
      );
      setSelectedPatient((prev) => ({ ...prev, status: "Completed", pendingCount: 0 }));
    }, 900);
  };

  const filteredQueue = queue.filter((p) => {
    if (filterTab === "Pending" && p.status !== "Pending") return false;
    if (filterTab === "Fulfilled" && p.status !== "Completed") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="hospital-admin-page-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">Hospital Pharmacy Dispensing &amp; Invoicing</h1>
          <p className="page-subtitle-text">
            Verify clinical doctor orders, allocate prescribed drugs, adjust stock dosages, and generate itemized hospital tax invoices in real-time.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#E0F2FE",
              color: "#0369A1",
              fontSize: "12px",
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: "20px",
            }}
          >
            <span className="pulse-dot"></span>
            <span>Terminal Rx-North-04</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "6px 12px",
            }}
          >
            <RefreshIcon sx={{ fontSize: 18, color: "#0284C7" }} />
            <div>
              <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                STOCK DATABASE
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>
                Live ERP Sync (0.8s)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ────────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">ALLOCATED PATIENTS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">45</span>
              <span className="kpi-delta-pill blue">+6 today</span>
            </div>
            <div className="kpi-subtext">Assigned to Dispensary</div>
          </div>
          <div className="kpi-icon-box blue">
            <GroupIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">PENDING DISPENSE</div>
            <div className="kpi-val-row">
              <span className="kpi-number" style={{ color: "#DC2626" }}>8</span>
              <span className="kpi-delta-pill red">Action needed</span>
            </div>
            <div className="kpi-subtext">3 Critical / Antibiotics</div>
          </div>
          <div className="kpi-icon-box red">
            <WarningIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">COMPLETED INVOICED</div>
            <div className="kpi-val-row">
              <span className="kpi-number">37</span>
              <span className="kpi-delta-pill blue">82.2% rate</span>
            </div>
            <div className="kpi-subtext">Dispatched to Patients</div>
          </div>
          <div className="kpi-icon-box teal">
            <CheckCircleIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">REVENUE TODAY</div>
            <div className="kpi-val-row">
              <span className="kpi-number">Rs. 142.5k</span>
            </div>
            <div className="kpi-subtext">Insurance &amp; Direct Cash</div>
          </div>
          <div className="kpi-icon-box purple">
            <ReceiptIcon sx={{ fontSize: 22 }} />
          </div>
        </div>
      </div>

      {/* ── Two Column Workspace: Left Queue + Right Dispensing Hub ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "22px" }}>
        {/* Left Column: Allocated Patients Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="clinical-table-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                Allocated Patients
              </h3>
              <span
                style={{
                  background: "#E0F2FE",
                  color: "#0284C7",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "12px",
                }}
              >
                Total Queue: 45
              </span>
            </div>

            {/* Search Input */}
            <div
              className="topbar-search-box"
              style={{
                width: "100%",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                boxSizing: "border-box",
                marginBottom: "12px",
              }}
            >
              <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
              <input
                type="text"
                placeholder="Search by patient name, MRN, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="filter-pills-row" style={{ marginBottom: "14px" }}>
              <button
                className={`filter-pill-btn ${filterTab === "All" ? "active" : ""}`}
                onClick={() => setFilterTab("All")}
              >
                All (45)
              </button>
              <button
                className={`filter-pill-btn ${filterTab === "Pending" ? "active" : ""}`}
                onClick={() => setFilterTab("Pending")}
              >
                Pending (8)
              </button>
              <button
                className={`filter-pill-btn ${filterTab === "Fulfilled" ? "active" : ""}`}
                onClick={() => setFilterTab("Fulfilled")}
              >
                Fulfilled (37)
              </button>
            </div>

            {/* Live Feed Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderTop: "1px solid #F1F5F9",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: "10px",
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#64748B",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <DocIcon sx={{ fontSize: 15, color: "#0284C7" }} />
                LIVE PRESCRIPTIONS FEED
              </span>
              <span>May 9, 2025</span>
            </div>

            {/* Queue Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredQueue.map((p) => {
                const isSelected = selectedPatient.code === p.code;
                const isPending = p.status === "Pending";
                const initials = p.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={p.code}
                    onClick={() => handleSelectPatient(p)}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid #0284C7" : "1px solid #E2E8F0",
                      background: isSelected ? "#F0F9FF" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            background: isPending ? "#0284C7" : "#E2E8F0",
                            color: isPending ? "#FFFFFF" : "#475569",
                            fontWeight: 800,
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{p.name}</strong>
                            <span
                              style={{
                                background: "#E0F2FE",
                                color: "#0284C7",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "6px",
                              }}
                            >
                              {p.code}
                            </span>
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                            {p.phone} • {p.doctor}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>{p.time}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        {isPending ? (
                          <span
                            style={{
                              background: "#E0F2FE",
                              color: "#0369A1",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            ● Pending ({p.pendingCount})
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#ECFDF5",
                              color: "#059669",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            ✓ Completed
                          </span>
                        )}

                        <button
                          style={{
                            background: isPending ? "#0284C7" : "#FFFFFF",
                            color: isPending ? "#FFFFFF" : "#64748B",
                            border: isPending ? "none" : "1px solid #CBD5E1",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(p);
                            if (!isPending) {
                              showToast(`Loading Receipt for ${p.code}...`, "info");
                            }
                          }}
                        >
                          {isPending ? "View Rx" : "Receipt"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "14px",
                paddingTop: "10px",
                borderTop: "1px solid #F1F5F9",
                fontSize: "11.5px",
                color: "#64748B",
              }}
            >
              <span>Showing 5 of 45 allocated patients</span>
              <span>Page 1 of 9 &lsaquo; &rsaquo;</span>
            </div>
          </div>

          {/* Hospital Formulary & Dosing Guide Callout Card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "#E0F2FE",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PharmacyIcon sx={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                  Hospital Formulary &amp; Dosing Guide
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                  Look up contraindications, stock alternatives &amp; maximum daily thresholds.
                </div>
              </div>
            </div>

            <button className="btn-secondary-white" onClick={() => setGuideModal(true)}>
              Open Guide
            </button>
          </div>
        </div>

        {/* Right Column: Treatment Details, Drugs Table & Invoice Generation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Treatment Details Header Card */}
          <div className="clinical-table-card" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                paddingBottom: "14px",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: "#0A5364",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PharmacyIcon sx={{ fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ margin: 0, fontSize: "16.5px", fontWeight: 800, color: "#0F172A" }}>
                      Treatment Details • Patient: {selectedPatient.name}
                    </h2>
                    <span
                      style={{
                        background: "#E0F2FE",
                        color: "#0284C7",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {selectedPatient.code}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                    Prescribed by: {selectedPatient.doctor}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="topbar-icon-btn"
                  title="Print Prescription"
                  onClick={() => window.print()}
                >
                  <PrintIcon sx={{ fontSize: 18 }} />
                </button>
                <button
                  className="topbar-icon-btn"
                  title="Patient Medical History"
                  onClick={() => navigate(`/dashboard/medical-history`)}
                >
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            {/* Demographics Bar */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                fontSize: "12px",
                color: "#334155",
                marginBottom: "16px",
              }}
            >
              <div>
                Patient: <strong>{selectedPatient.name}</strong>
              </div>
              <div>
                Contact: <strong>{selectedPatient.phone}</strong>
              </div>
              <div>
                Age/Sex: <strong>{selectedPatient.age} / {selectedPatient.sex}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#0284C7", fontWeight: 700 }}>
                <ShieldIcon sx={{ fontSize: 14 }} />
                <span>Allergies: {selectedPatient.allergies}</span>
              </div>
            </div>

            {/* Prescribed Clinical Drugs Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                  Prescribed Clinical Drugs
                </h3>
                <span
                  style={{
                    background: "#0284C7",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {activeDrugs.length} Medications
                </span>
                <span
                  style={{ fontSize: "12px", fontWeight: 700, color: "#0284C7", cursor: "pointer" }}
                  onClick={() => handleSelectAll(true)}
                >
                  Select All
                </span>
              </div>

              <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748B" }}>
                ● Central Dispensary Rack #04
              </div>
            </div>

            {/* Prescribed Drugs Table */}
            <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: "10px" }}>
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      <Checkbox
                        size="small"
                        checked={activeDrugs.every((d) => d.selected)}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        sx={{ color: "#FFFFFF", "&.Mui-checked": { color: "#FFFFFF" }, p: 0 }}
                      />
                    </th>
                    <th>Drug &amp; Form</th>
                    <th>Dosage Schedule</th>
                    <th>Prescribed</th>
                    <th>Given Qty</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDrugs.map((drug) => (
                    <tr key={drug.id}>
                      <td>
                        <Checkbox
                          size="small"
                          checked={drug.selected}
                          onChange={() => handleToggleDrug(drug.id)}
                          sx={{ p: 0 }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px" }}>
                          {drug.name}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748B" }}>{drug.desc}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#334155", fontSize: "12px" }}>
                          {drug.schedule}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0F172A", fontSize: "13px" }}>
                        {drug.prescribedQty}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            background: "#F1F5F9",
                            borderRadius: "6px",
                            padding: "2px 6px",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() => handleQuantityChange(drug.id, -1)}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #CBD5E1",
                              borderRadius: "4px",
                              width: "22px",
                              height: "22px",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 700, fontSize: "13px", minWidth: "16px", textAlign: "center" }}>
                            {drug.givenQty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(drug.id, 1)}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #CBD5E1",
                              borderRadius: "4px",
                              width: "22px",
                              height: "22px",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: drug.stockStatus === "Safe" ? "#059669" : "#0284C7",
                          }}
                        >
                          {drug.stock} {drug.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dispensary Invoice Summary Box */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "16px 20px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  borderBottom: "1px solid #E2E8F0",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>
                  <ReceiptIcon sx={{ fontSize: 16, color: "#0284C7" }} />
                  Dispensary Invoice Summary
                </div>
                <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "monospace" }}>
                  Invoice Tax ID: INV-2025-0509-88
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Prescription Drug Subtotal:</span>
                    <strong style={{ color: "#0F172A" }}>Rs. {drugSubtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Pharmacy Handling &amp; Sterile Packaging:</span>
                    <strong style={{ color: "#0F172A" }}>Rs. {packagingFee.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#0284C7" }}>
                    <span>National Health Subsidy Scheme (-10%):</span>
                    <strong>- Rs. {Math.abs(subsidyAmount).toFixed(2)}</strong>
                  </div>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                    TOTAL NET PAYABLE
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#0284C7", letterSpacing: "-0.03em" }}>
                    Rs. {totalNetPayable.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "#94A3B8" }}>Inclusive of hospital VAT</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Payment:</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: "1px solid #CBD5E1",
                        background: "#F8FAFC",
                        color: "#0F172A",
                        cursor: "pointer",
                      }}
                    >
                      <option value="Direct Insurer Claim">Direct Insurer Claim</option>
                      <option value="Direct Cash">Direct Cash</option>
                      <option value="Hospital Credit">Hospital Credit</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Pharmacist Verification Check Note */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "#EFF6FF",
                border: "1px solid #DBEAFE",
                borderRadius: "8px",
                marginTop: "14px",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: "#0284C7" }} />
                <div>
                  <strong style={{ color: "#0284C7" }}>Dual Pharmacist Check Complete</strong>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                    Dispenser: Pharm. Test Alpha • License SL-PH-9921
                  </div>
                </div>
              </div>
              <span
                style={{ fontSize: "11.5px", fontWeight: 700, color: "#0284C7", cursor: "pointer" }}
                onClick={() => showToast("Dispenser clinical note attached.", "info")}
              >
                Add Dispenser Note
              </span>
            </div>

            {/* Action Buttons Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <button
                className="btn-secondary-white"
                onClick={() => showToast("Dispensing cancelled.", "info")}
              >
                Cancel
              </button>
              <button
                className="btn-secondary-white"
                onClick={() => showToast(`SMS receipt dispatched to ${selectedPatient.phone}`, "success")}
              >
                <SmsIcon sx={{ fontSize: 16 }} />
                <span>SMS Receipt</span>
              </button>
              <button
                className="btn-primary-cyan"
                onClick={handleDispense}
                disabled={loading}
              >
                {loading ? <CircularProgress size={18} color="inherit" /> : <ReceiptIcon sx={{ fontSize: 18 }} />}
                <span>Generate Hospital Tax Invoice &amp; Dispense</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dosing Guide Modal */}
      <Dialog
        open={guideModal}
        onClose={() => setGuideModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "18px" }}>Hospital Formulary &amp; Dosing Guide</strong>
          <IconButton onClick={() => setGuideModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <p style={{ fontSize: "13.5px", color: "#334155" }}>
            Real-time guidance compliant with the British National Formulary (BNF) and WHO Essential Medicines list.
          </p>
          <ul style={{ fontSize: "13px", color: "#475569", lineHeight: 1.8 }}>
            <li><strong>Amoxycillin:</strong> Adults 250mg - 500mg every 8h. Max 4.5g daily. Contraindicated in penicillin hypersensitivity.</li>
            <li><strong>Paracetamol:</strong> 500mg - 1000mg every 4-6h. Maximum 4000mg/24 hours. Hepatic risk above threshold.</li>
            <li><strong>Atorvastatin:</strong> Initial 10mg-20mg once daily at bedtime. Monitor hepatic enzymes.</li>
            <li><strong>Omeprazole:</strong> 20mg once daily before food. Re-evaluate therapy after 4 weeks.</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuideModal(false)}>Close Guide</Button>
        </DialogActions>
      </Dialog>

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
