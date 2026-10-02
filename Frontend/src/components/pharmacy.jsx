import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
  Inventory2 as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  ReceiptLong as ReceiptIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { ROLES, normalizeRole } from "../utils/roleAccess";
import "../styles/pharmacy.css";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5155/api";

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "Not recorded";
  const parts = String(value).split(":");
  if (parts.length < 2) return String(value);
  const d = new Date();
  d.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }
  return data?.message || data?.error || fallback;
};

export default function Pharmacy() {
  const navigate = useNavigate();
  const role = normalizeRole(localStorage.getItem("Role"));

  const [queue, setQueue] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [encounter, setEncounter] = useState(null);
  const [dispenseLines, setDispenseLines] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [queueLoading, setQueueLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [lastDispenseResult, setLastDispenseResult] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const loadQueue = async (preferredKey = null) => {
    try {
      setQueueLoading(true);
      const response = await axios.get(`${API_BASE}/Pharmacy/queue`);
      const rows = Array.isArray(response.data) ? response.data : [];
      setQueue(rows);

      const currentKey = preferredKey ||
        (selectedSummary
          ? `${selectedSummary.PatientCode}|${selectedSummary.SerialNo}`
          : null);

      const nextSelected =
        rows.find(
          (row) => `${row.PatientCode}|${row.SerialNo}` === currentKey
        ) || rows[0] || null;

      setSelectedSummary(nextSelected);
      if (!nextSelected) {
        setEncounter(null);
        setDispenseLines([]);
      }
    } catch (error) {
      setQueue([]);
      setSelectedSummary(null);
      setEncounter(null);
      setDispenseLines([]);
      showToast(
        getErrorMessage(error, "Unable to load the pharmacy prescription queue."),
        "error"
      );
    } finally {
      setQueueLoading(false);
    }
  };

  const loadEncounter = async (summary) => {
    if (!summary) return;

    try {
      setDetailLoading(true);
      const response = await axios.get(
        `${API_BASE}/Pharmacy/encounter/${encodeURIComponent(
          summary.PatientCode
        )}/${summary.SerialNo}`
      );

      const data = response.data;
      setEncounter(data);
      setLastDispenseResult(null);

      const lines = (data?.Drugs || []).map((drug) => {
        const remaining = Number(drug.RemainingQty || 0);
        const stock = Number(drug.Stock || 0);
        const canDispense = remaining > 0 && stock > 0;
        return {
          ...drug,
          Selected: canDispense,
          DispenseNow: canDispense ? Math.min(remaining, stock) : 0,
        };
      });

      setDispenseLines(lines);
    } catch (error) {
      setEncounter(null);
      setDispenseLines([]);
      showToast(
        getErrorMessage(error, "Unable to load the selected prescription."),
        "error"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSummary) {
      loadEncounter(selectedSummary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSummary?.PatientCode, selectedSummary?.SerialNo]);

  const counts = useMemo(
    () => ({
      all: queue.length,
      pending: queue.filter((row) => row.Status === "Pending").length,
      fulfilled: queue.filter((row) => row.Status === "Fulfilled").length,
    }),
    [queue]
  );

  const filteredQueue = useMemo(() => {
    const query = search.trim().toLowerCase();
    return queue.filter((row) => {
      if (filter !== "All" && row.Status !== filter) return false;
      if (!query) return true;
      return [row.PatientName, row.PatientCode, row.MobileNo, row.DoctorName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [queue, filter, search]);

  const selectedDispenseTotal = useMemo(
    () =>
      dispenseLines
        .filter((line) => line.Selected && Number(line.DispenseNow) > 0)
        .reduce(
          (sum, line) =>
            sum + Number(line.DispenseNow || 0) * Number(line.Rate || 0),
          0
        ),
    [dispenseLines]
  );

  const selectedCount = dispenseLines.filter(
    (line) => line.Selected && Number(line.DispenseNow) > 0
  ).length;

  const updateLine = (materialCode, patch) => {
    setDispenseLines((current) =>
      current.map((line) =>
        line.MaterialCode === materialCode ? { ...line, ...patch } : line
      )
    );
  };

  const changeQuantity = (line, delta) => {
    const maxAllowed = Math.min(
      Number(line.RemainingQty || 0),
      Number(line.Stock || 0)
    );
    const next = Math.max(
      0,
      Math.min(maxAllowed, Number(line.DispenseNow || 0) + delta)
    );
    updateLine(line.MaterialCode, {
      DispenseNow: next,
      Selected: next > 0,
    });
  };

  const toggleAll = () => {
    const eligible = dispenseLines.filter(
      (line) => Number(line.RemainingQty) > 0 && Number(line.Stock) > 0
    );
    const allSelected =
      eligible.length > 0 && eligible.every((line) => line.Selected);

    setDispenseLines((current) =>
      current.map((line) => {
        const canDispense =
          Number(line.RemainingQty) > 0 && Number(line.Stock) > 0;
        if (!canDispense) return { ...line, Selected: false, DispenseNow: 0 };
        return {
          ...line,
          Selected: !allSelected,
          DispenseNow: !allSelected
            ? Math.min(Number(line.RemainingQty), Number(line.Stock))
            : 0,
        };
      })
    );
  };

  const handleDispense = async () => {
    if (!encounter) return;

    const lines = dispenseLines
      .filter((line) => line.Selected && Number(line.DispenseNow) > 0)
      .map((line) => ({
        MaterialCode: line.MaterialCode,
        Quantity: Number(line.DispenseNow),
      }));

    if (lines.length === 0) {
      showToast("Select at least one pending medicine to dispense.", "warning");
      return;
    }

    try {
      setDispensing(true);
      const patientCode = encounter.Patient.Code;
      const serialNo = encounter.Treatment.SerialNo;

      const response = await axios.post(
        `${API_BASE}/Pharmacy/dispense/${encodeURIComponent(
          patientCode
        )}/${serialNo}`,
        {
          DispenserUserId: localStorage.getItem("id") || null,
          Lines: lines,
        }
      );

      const updatedEncounter = response.data?.Encounter;
      if (updatedEncounter) {
        setEncounter(updatedEncounter);
        setDispenseLines(
          (updatedEncounter.Drugs || []).map((drug) => {
            const remaining = Number(drug.RemainingQty || 0);
            const stock = Number(drug.Stock || 0);
            const canDispense = remaining > 0 && stock > 0;
            return {
              ...drug,
              Selected: canDispense,
              DispenseNow: canDispense ? Math.min(remaining, stock) : 0,
            };
          })
        );
      }

      setLastDispenseResult(response.data);
      showToast(response.data?.message || "Medicines dispensed successfully.");
      await loadQueue(`${patientCode}|${serialNo}`);
    } catch (error) {
      showToast(
        getErrorMessage(error, "The selected medicines could not be dispensed."),
        "error"
      );
    } finally {
      setDispensing(false);
    }
  };

  const openReceipt = () => {
    if (!encounter) return;
    navigate(
      `/dashboard/pharmacy-invoice/${encounter.Patient.Code}/${encounter.Treatment.SerialNo}`,
      { state: { dispenseResult: lastDispenseResult } }
    );
  };

  const patientLocation = encounter
    ? [encounter.Patient.Address, encounter.Patient.City]
        .filter(Boolean)
        .join(", ") || "Not recorded"
    : "";

  return (
    <div className="pharm-page">
      <section className="pharm-page-header">
        <div>
          <div className="pharm-eyebrow">Clinical Operations / Central Pharmacy</div>
          <h1>Pharmacy Dispensing</h1>
          <p>
            Review the physician's actual prescription, validate live stock and
            record exactly what is dispensed to the patient.
          </p>
        </div>
        <button className="pharm-secondary-btn" onClick={() => loadQueue()}>
          <RefreshIcon fontSize="small" /> Refresh queue
        </button>
      </section>

      <section className="pharm-kpis">
        <article>
          <div className="pharm-kpi-icon blue"><MedicalIcon /></div>
          <div><span>Prescription encounters</span><strong>{counts.all}</strong></div>
        </article>
        <article>
          <div className="pharm-kpi-icon amber"><WarningIcon /></div>
          <div><span>Awaiting pharmacy</span><strong>{counts.pending}</strong></div>
        </article>
        <article>
          <div className="pharm-kpi-icon green"><CheckCircleIcon /></div>
          <div><span>Fully dispensed</span><strong>{counts.fulfilled}</strong></div>
        </article>
      </section>

      <section className="pharm-workspace">
        <aside className="pharm-queue-panel">
          <div className="pharm-panel-heading">
            <div>
              <h2>Prescription Queue</h2>
              <span>Real treatment records from the clinical encounter</span>
            </div>
            <span className="pharm-count-badge">{filteredQueue.length}</span>
          </div>

          <div className="pharm-search">
            <SearchIcon fontSize="small" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, code, phone or doctor"
            />
          </div>

          <div className="pharm-tabs">
            {[
              ["All", counts.all],
              ["Pending", counts.pending],
              ["Fulfilled", counts.fulfilled],
            ].map(([name, count]) => (
              <button
                key={name}
                className={filter === name ? "active" : ""}
                onClick={() => setFilter(name)}
              >
                {name} <span>{count}</span>
              </button>
            ))}
          </div>

          <div className="pharm-queue-list">
            {queueLoading ? (
              <div className="pharm-centered-state"><CircularProgress size={26} /></div>
            ) : filteredQueue.length === 0 ? (
              <div className="pharm-empty-state">
                <PharmacyIcon />
                <strong>No prescriptions found</strong>
                <span>No records match the selected queue filter.</span>
              </div>
            ) : (
              filteredQueue.map((row) => {
                const active =
                  selectedSummary?.PatientCode === row.PatientCode &&
                  selectedSummary?.SerialNo === row.SerialNo;
                return (
                  <button
                    key={`${row.PatientCode}-${row.SerialNo}`}
                    className={`pharm-queue-card ${active ? "active" : ""}`}
                    onClick={() => setSelectedSummary(row)}
                  >
                    <div className="pharm-avatar">
                      {(row.PatientName || "P").trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="pharm-queue-copy">
                      <div className="pharm-queue-name-row">
                        <strong>{row.PatientName || "Unnamed patient"}</strong>
                        <span className={`pharm-status ${row.Status.toLowerCase()}`}>
                          {row.Status}
                        </span>
                      </div>
                      <span>{row.PatientCode} · Encounter #{row.SerialNo}</span>
                      <span>{row.DoctorName || "Doctor not recorded"}</span>
                      <div className="pharm-queue-meta">
                        <span>{formatDate(row.EncounterDate)}</span>
                        <span>{row.PendingDrugCount} pending</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="pharm-detail-panel">
          {!selectedSummary ? (
            <div className="pharm-empty-detail">
              <PharmacyIcon />
              <h2>Select a prescription encounter</h2>
              <p>The physician-prescribed medicines will appear here.</p>
            </div>
          ) : detailLoading ? (
            <div className="pharm-centered-state detail"><CircularProgress /></div>
          ) : !encounter ? (
            <div className="pharm-empty-detail">
              <WarningIcon />
              <h2>Prescription details unavailable</h2>
              <p>Refresh the queue and select the record again.</p>
            </div>
          ) : (
            <>
              <div className="pharm-encounter-header">
                <div className="pharm-patient-title">
                  <div className="pharm-large-avatar">
                    {(encounter.Patient.Name || "P").trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="pharm-title-line">
                      <h2>{encounter.Patient.Name || "Unnamed patient"}</h2>
                      <span>{encounter.Patient.Code}</span>
                      <span className={`pharm-status ${encounter.PharmacyStatus.toLowerCase()}`}>
                        {encounter.PharmacyStatus === "Pending" ? "Awaiting pharmacy" : "Fulfilled"}
                      </span>
                    </div>
                    <p>
                      Encounter #{encounter.Treatment.SerialNo} · Prescribed by {encounter.Doctor.Name}
                      {encounter.Doctor.Specialization
                        ? ` (${encounter.Doctor.Specialization})`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="pharm-header-actions">
                  <button className="pharm-icon-btn" onClick={() => window.print()} title="Print">
                    <ReceiptIcon fontSize="small" />
                  </button>
                  {role !== ROLES.PHARMACIST && (
                    <button
                      className="pharm-icon-btn"
                      onClick={() => navigate("/dashboard/medical-history")}
                      title="Patient records"
                    >
                      <HistoryIcon fontSize="small" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pharm-demographics">
                <div><span>NIC</span><strong>{encounter.Patient.Nic || "Not recorded"}</strong></div>
                <div><span>Contact</span><strong>{encounter.Patient.Mobile || "Not recorded"}</strong></div>
                <div>
                  <span>Age / Sex</span>
                  <strong>
                    {encounter.Patient.Age != null ? `${encounter.Patient.Age} yrs` : "Age not recorded"}
                    {encounter.Patient.Gender ? ` / ${encounter.Patient.Gender}` : ""}
                  </strong>
                </div>
                <div><span>Blood group</span><strong>{encounter.Patient.BloodGroup || "Not recorded"}</strong></div>
                <div><span>Location</span><strong>{patientLocation}</strong></div>
                <div><span>Appointment</span><strong>{encounter.Appointment ? `${formatDate(encounter.Appointment.Date)} · ${formatTime(encounter.Appointment.Time)}` : "Not linked"}</strong></div>
              </div>

              <div className="pharm-section-heading">
                <div>
                  <h3>Physician Prescription</h3>
                  <p>Quantities, rates and stock below are loaded from the database.</p>
                </div>
                <button className="pharm-text-btn" onClick={toggleAll}>Select / clear pending</button>
              </div>

              <div className="pharm-table-wrap">
                <table className="pharm-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Medicine</th>
                      <th>Schedule</th>
                      <th>Prescribed</th>
                      <th>Already dispensed</th>
                      <th>Dispense now</th>
                      <th>Stock</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispenseLines.map((line) => {
                      const pending = Number(line.RemainingQty) > 0;
                      const outOfStock = Number(line.Stock) <= 0;
                      return (
                        <tr key={line.MaterialCode} className={!pending ? "fulfilled-row" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={Boolean(line.Selected)}
                              disabled={!pending || outOfStock}
                              onChange={(event) =>
                                updateLine(line.MaterialCode, {
                                  Selected: event.target.checked,
                                  DispenseNow: event.target.checked
                                    ? Math.min(Number(line.RemainingQty), Number(line.Stock))
                                    : 0,
                                })
                              }
                            />
                          </td>
                          <td>
                            <strong>{line.MedicineName || line.MaterialCode}</strong>
                            <span>
                              {[line.Specification, line.Unit, line.MaterialCode]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </td>
                          <td>{line.Schedule || "Not recorded"}</td>
                          <td>{Number(line.PrescribedQty).toLocaleString()}</td>
                          <td>{Number(line.DispensedQty).toLocaleString()}</td>
                          <td>
                            {pending ? (
                              <div className="pharm-qty-control">
                                <button onClick={() => changeQuantity(line, -1)} disabled={!line.Selected}>−</button>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={line.DispenseNow}
                                  disabled={!line.Selected}
                                  onChange={(event) => {
                                    const max = Math.min(Number(line.RemainingQty), Number(line.Stock));
                                    const value = Math.max(0, Math.min(max, Number(event.target.value || 0)));
                                    updateLine(line.MaterialCode, { DispenseNow: value, Selected: value > 0 });
                                  }}
                                />
                                <button onClick={() => changeQuantity(line, 1)} disabled={!line.Selected}>+</button>
                              </div>
                            ) : (
                              <span className="pharm-fulfilled-label"><CheckCircleIcon fontSize="inherit" /> Complete</span>
                            )}
                          </td>
                          <td>
                            <strong className={outOfStock && pending ? "danger-text" : ""}>
                              {Number(line.Stock).toLocaleString()}
                            </strong>
                            {outOfStock && pending && <span className="stock-note">Out of stock</span>}
                          </td>
                          <td>{money(line.Rate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pharm-bottom-grid">
                <section className="pharm-summary-card">
                  <div className="pharm-card-title"><InventoryIcon fontSize="small" /><strong>Prescription Financial Summary</strong></div>
                  <div className="pharm-summary-row"><span>Full prescribed medicine value</span><strong>{money(encounter.Summary.PrescriptionTotal)}</strong></div>
                  <div className="pharm-summary-row"><span>Already dispensed value</span><strong>{money(encounter.Summary.DispensedValue)}</strong></div>
                  <div className="pharm-summary-row"><span>Remaining prescription value</span><strong>{money(encounter.Summary.PendingValue)}</strong></div>
                  <div className="pharm-summary-row highlight"><span>Selected for this dispense</span><strong>{money(selectedDispenseTotal)}</strong></div>
                  <p>No handling fee, subsidy or tax is invented here; only values stored on the prescription are shown.</p>
                </section>

                <section className="pharm-action-card">
                  <div>
                    <span className="pharm-action-label">Ready to dispense</span>
                    <strong>{selectedCount} medicine{selectedCount === 1 ? "" : "s"}</strong>
                    <p>Inventory is deducted only after the database transaction succeeds.</p>
                  </div>
                  <button
                    className="pharm-primary-btn"
                    onClick={handleDispense}
                    disabled={dispensing || selectedCount === 0}
                  >
                    {dispensing ? <CircularProgress size={18} color="inherit" /> : <PharmacyIcon fontSize="small" />}
                    {dispensing ? "Dispensing..." : "Dispense selected medicines"}
                  </button>
                  <button
                    className="pharm-secondary-btn full"
                    onClick={openReceipt}
                    disabled={!encounter}
                  >
                    <ReceiptIcon fontSize="small" /> Open dispensing summary
                  </button>
                </section>
              </div>
            </>
          )}
        </main>
      </section>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
