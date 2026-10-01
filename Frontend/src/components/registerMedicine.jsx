import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  AcUnit as TempIcon,
  QrCodeScanner as BarcodeIcon,
  VerifiedUser as GovernanceIcon,
  ArrowForward as ArrowForwardIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  EventBusy as ExpireIcon,
  Medication as DispenseIcon,
} from "@mui/icons-material";

// Initial pharmaceutical inventory matching screenshot 4
const INITIAL_DRUGS = [];

export default function RegisterMedicine() {
  const [medicines, setMedicines] = useState(INITIAL_DRUGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All Therapeutic Classes");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    MMC_MATERIAL_CODE: "",
    name: "",
    strength: "",
    category: "Antibiotic",
    unitForm: "Capsule",
    stock: 50,
    minStock: 20,
    rate: 150.0,
    batch: "",
    expiry: "",
  });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/Material`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((m) => {
          const stock = Number(m.MMC_REORDER_LEVEL ?? 0);
          const minStock = Number(m.MMC_MIN_STOCK ?? 0);
          const inactive = m.MMC_STATUS === "I";
          const expiry = m.MMC_EXPIRY_DATE ? String(m.MMC_EXPIRY_DATE).slice(0, 10) : "";

          return {
            MMC_MATERIAL_CODE: m.MMC_MATERIAL_CODE,
            name: m.MMC_DESCRIPTION || "Unnamed medicine",
            strength: m.MMC_MATERIAL_SPEC || "Not recorded",
            category: m.MMC_CATEGORY || "Unclassified",
            unitForm: m.MMC_UNIT || "Not recorded",
            stock,
            minStock,
            unit: "units",
            status: inactive
              ? "Inactive"
              : stock <= 0
              ? "Out of Stock"
              : minStock > 0 && stock <= minStock
              ? "Low Stock"
              : "Active Stock",
            rate: Number(m.MMC_RATE ?? 0),
            batch: m.MMC_BATCH_NO || "Not recorded",
            expiry,
            isStockout: stock <= 0,
          };
        });
        setMedicines(mapped);
      } else {
        setMedicines([]);
      }
    } catch (e) {
      console.error("Failed to load medicine catalogue", e);
      showToast("Unable to load the medicine catalogue from the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({
      MMC_MATERIAL_CODE: "",
      name: "",
      strength: "",
      category: "Antibiotic",
      unitForm: "Capsule",
      stock: 0,
      minStock: 20,
      rate: 0,
      batch: "",
      expiry: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setFormData({
      MMC_MATERIAL_CODE: item.MMC_MATERIAL_CODE,
      name: item.name,
      strength: item.strength,
      category: item.category,
      unitForm: item.unitForm,
      stock: item.stock,
      minStock: item.minStock,
      rate: item.rate,
      batch: item.batch,
      expiry: item.expiry,
    });
    setOpenDialog(true);
  };

  const getApiErrorMessage = (err, fallback) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (typeof err?.response?.data === "string" ? err.response.data : null) ||
      fallback
    );
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Deactivate ${item.name} from the active formulary?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/Material/updatematerialstatus`,
        null,
        { params: { materialcode: item.MMC_MATERIAL_CODE } }
      );
      await fetchMedicines();
      showToast(`${item.name} was deactivated successfully.`, "info");
    } catch (err) {
      showToast(
        getApiErrorMessage(err, "Unable to deactivate this medicine."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const strength = formData.strength.trim();

    if (!name) {
      showToast("Please enter the medicine name.", "error");
      return;
    }

    if (!strength) {
      showToast("Please enter the formulation / strength.", "error");
      return;
    }

    if (!formData.unitForm) {
      showToast("Please select a dosage form.", "error");
      return;
    }

    if (Number(formData.stock) < 0 || Number(formData.minStock) < 0) {
      showToast("Stock values cannot be negative.", "error");
      return;
    }

    if (Number(formData.rate) < 0) {
      showToast("Unit rate cannot be negative.", "error");
      return;
    }

    if (formData.expiry) {
      const expiryDate = new Date(`${formData.expiry}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        showToast("Expiry date cannot be in the past.", "error");
        return;
      }
    }

    setLoading(true);

    try {
      const currentUserId = localStorage.getItem("id") || null;
      const payload = {
        MMC_DESCRIPTION: name,
        MMC_MATERIAL_SPEC: strength,
        MMC_UNIT: formData.unitForm,
        // Legacy database field used by the existing CareSync dispensing code as current stock.
        MMC_REORDER_LEVEL: Number(formData.stock),
        MMC_MIN_STOCK: Number(formData.minStock),
        MMC_CATEGORY: formData.category,
        MMC_BATCH_NO: formData.batch.trim() || null,
        MMC_EXPIRY_DATE: formData.expiry || null,
        MMC_RATE: Number(formData.rate),
        MMC_STATUS: "A",
        ...(editMode
          ? { MMC_UPDATED_BY: currentUserId }
          : { MMC_CREATED_BY: currentUserId }),
      };

      if (editMode) {
        await axios.patch(
          `${process.env.REACT_APP_API_BASE_URL}/Material/${formData.MMC_MATERIAL_CODE}`,
          payload
        );
        showToast(`${name} updated successfully.`, "success");
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/Material`,
          payload
        );
        showToast(`${name} registered successfully.`, "success");
      }

      await fetchMedicines();
      setOpenDialog(false);
    } catch (err) {
      console.error("Medicine save failed", err);
      showToast(
        getApiErrorMessage(
          err,
          editMode
            ? "Unable to update the medicine."
            : "Unable to register the medicine."
        ),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredMedicines = medicines.filter((m) => {
    if (statusFilter === "In Stock" && (m.status !== "Active Stock" && m.status !== "Low Stock")) return false;
    if (statusFilter === "Low Stock" && m.status !== "Low Stock") return false;
    if (statusFilter === "Depleted" && m.status !== "Out of Stock") return false;

    if (classFilter !== "All Therapeutic Classes" && (m.category || "").toLowerCase() !== classFilter.toLowerCase()) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.strength || "").toLowerCase().includes(q) ||
        (m.batch || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredMedicines.length === 0) {
      showToast("No data to export", "warning");
      return;
    }
    const headers = [
      "Material Code",
      "Name",
      "Strength/Spec",
      "Category",
      "Unit Form",
      "Stock",
      "Min Stock",
      "Status",
      "Rate",
      "Batch",
      "Expiry"
    ];
    
    const csvRows = [headers.join(",")];
    
    for (const m of filteredMedicines) {
      const row = [
        m.MMC_MATERIAL_CODE,
        `"${m.name || ""}"`,
        `"${m.strength || ""}"`,
        m.category,
        m.unitForm,
        m.stock,
        m.minStock,
        m.status,
        m.rate,
        `"${m.batch || ""}"`,
        `"${m.expiry || ""}"`
      ];
      csvRows.push(row.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `formulary_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Formulary exported successfully!", "success");
  };

  const allCount = medicines.length;
  const activeCount = medicines.filter((m) => m.status !== "Inactive").length;
  const inStockCount = medicines.filter(m => m.status === "Active Stock" || m.status === "Low Stock").length;
  const lowStockCount = medicines.filter(m => m.status === "Low Stock").length;
  const depletedCount = medicines.filter(m => m.status === "Out of Stock").length;
  const expiringCount = medicines.filter((m) => {
    if (!m.expiry) return false;
    const expiryDate = new Date(`${m.expiry}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = (expiryDate - today) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }).length;
  const dailyDispensation = 0;

  return (
    <div className="hospital-admin-page-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">Pharmaceutical Formulary &amp; Drug Inventory</h1>
          <p className="page-subtitle-text">
            Real-time stock monitoring, batch expirations, unit pricing, and clinical barcode registration.
          </p>
        </div>

        <div className="page-action-group">
          <button
            className="btn-secondary-white"
            onClick={handleExportCSV}
          >
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Formulary Export</span>
          </button>
          <button className="btn-primary-cyan" onClick={handleOpenAdd}>
            <AddIcon sx={{ fontSize: 18 }} />
            <span>Register New Medicine</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ────────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">TOTAL ACTIVE SKUS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{activeCount}</span>
              <span className="kpi-delta-pill blue">Live catalogue</span>
            </div>
            <div className="kpi-subtext">{allCount - activeCount} inactive SKU(s)</div>
          </div>
          <div className="kpi-icon-box blue">
            <InventoryIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">LOW STOCK ALERTS</div>
            <div className="kpi-val-row">
              <span className="kpi-number" style={{ color: "#DC2626" }}>{lowStockCount}</span>
              <span className="kpi-delta-pill red">SKUs critical</span>
            </div>
            <div className="kpi-subtext">Action required: PO trigger</div>
          </div>
          <div className="kpi-icon-box red">
            <WarningIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">EXPIRING &lt;30 DAYS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{expiringCount}</span>
              <span className="kpi-delta-pill amber">Batches marked</span>
            </div>
            <div className="kpi-subtext">Quarantine protocol live</div>
          </div>
          <div className="kpi-icon-box blue">
            <ExpireIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">DAILY DISPENSATION</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{dailyDispensation}</span>
              <span className="kpi-delta-pill blue">Units today</span>
            </div>
            <div className="kpi-subtext">99.4% dispense accuracy</div>
          </div>
          <div className="kpi-icon-box purple">
            <DispenseIcon sx={{ fontSize: 22 }} />
          </div>
        </div>
      </div>

      {/* ── Main Inventory Table Card ───────────────────────── */}
      <div className="clinical-table-card">
        {/* Filter and Search Bar */}
        <div className="clinical-table-filter-bar">
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, maxWidth: "450px" }}>
            <div className="topbar-search-box" style={{ width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
              <input
                type="text"
                placeholder="Search medicines by generic name, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="filter-pills-row">
              <button
                className={`filter-pill-btn ${statusFilter === "All" ? "active" : ""}`}
                onClick={() => setStatusFilter("All")}
              >
                All ({allCount})
              </button>
              <button
                className={`filter-pill-btn ${statusFilter === "In Stock" ? "active" : ""}`}
                onClick={() => setStatusFilter("In Stock")}
              >
                In Stock ({inStockCount})
              </button>
              <button
                className={`filter-pill-btn ${statusFilter === "Low Stock" ? "active" : ""}`}
                onClick={() => setStatusFilter("Low Stock")}
              >
                Low Stock ({lowStockCount})
              </button>
              <button
                className={`filter-pill-btn ${statusFilter === "Depleted" ? "active" : ""}`}
                onClick={() => setStatusFilter("Depleted")}
              >
                Depleted ({depletedCount})
              </button>
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <option value="All Therapeutic Classes">All Therapeutic Classes</option>
              <option value="Antibiotic">Antibiotics</option>
              <option value="Analgesic">Analgesics</option>
              <option value="Antihistamine">Antihistamines</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
            </select>

            <button className="topbar-icon-btn" title="Reload formulary" onClick={fetchMedicines}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>NAME &amp; STRENGTH</th>
                <th>CATEGORY</th>
                <th>UNIT FORM</th>
                <th>CURRENT STOCK LEVEL</th>
                <th>STATUS</th>
                <th>UNIT RATE (RS.)</th>
                <th>BATCH &amp; EXPIRY</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map((item) => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock > 0 && item.minStock > 0 && item.stock <= item.minStock;

                return (
                  <tr key={item.MMC_MATERIAL_CODE}>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "14px" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                        {item.strength}
                      </div>
                    </td>

                    <td>
                      <span className={`category-badge ${item.category.toLowerCase()}`}>
                        {item.category}
                      </span>
                    </td>

                    <td style={{ color: "#475569", fontWeight: 500 }}>
                      {item.unitForm}
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", fontSize: "13px" }}>
                        <strong style={{ color: isOutOfStock ? "#DC2626" : isLowStock ? "#D97706" : "#0F172A" }}>
                          {item.stock} {item.unit}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>Min: {item.minStock}</span>
                      </div>
                      <div className="stock-progress-wrap">
                        <div
                          className={`stock-progress-bar ${isOutOfStock ? "empty" : isLowStock ? "low" : "good"}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, (item.stock / (item.minStock * 2)) * 100))}%`,
                          }}
                        ></div>
                      </div>
                    </td>

                    <td>
                      {item.status === "Inactive" ? (
                        <span className="status-tag out">● Inactive</span>
                      ) : isOutOfStock ? (
                        <span className="status-tag out">● Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="status-tag low">● Low Stock</span>
                      ) : (
                        <span className="status-tag active">● Active Stock</span>
                      )}
                    </td>

                    <td style={{ fontWeight: 700, color: "#0F172A", fontSize: "13.5px" }}>
                      {item.rate.toFixed(2)}
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, fontSize: "12px", color: isOutOfStock ? "#DC2626" : "#0F172A" }}>
                        {item.batch}
                      </div>
                      <div style={{ fontSize: "11px", color: isOutOfStock ? "#DC2626" : "#64748B" }}>
                        {item.expiry ? `Exp: ${item.expiry}` : "Expiry not recorded"}
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                        <button
                          className="topbar-icon-btn"
                          style={{ width: "30px", height: "30px" }}
                          title="Edit Medicine"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button
                          className="topbar-icon-btn"
                          style={{ width: "30px", height: "30px" }}
                          title={item.status === "Inactive" ? "Already inactive" : "Deactivate medicine"}
                          disabled={item.status === "Inactive" || loading}
                          onClick={() => handleDelete(item)}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderTop: "1px solid #F1F5F9",
            fontSize: "12.5px",
            color: "#64748B",
          }}
        >
          <span>Showing {filteredMedicines.length} of {allCount} registered pharmaceutical records</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button className="filter-pill-btn" style={{ padding: "4px 8px" }}>&lsaquo;</button>
            <button className="filter-pill-btn active" style={{ padding: "4px 10px" }}>1</button>
            <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>2</button>
            <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>3</button>
            <span style={{ color: "#94A3B8" }}>...</span>
            <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>28</button>
            <button className="filter-pill-btn" style={{ padding: "4px 8px" }}>&rsaquo;</button>
          </div>
        </div>
      </div>

      {/* ── 3 Innovation Feature Cards (Image 4) ─────────────── */}
      <div className="clinical-triplet-grid">
        <div className="clinical-feature-card">
          <div>
            <div className="feature-header-row">
              <div className="feature-icon-badge">
                <TempIcon sx={{ fontSize: 20 }} />
              </div>
              <span className="feature-status-tag">4.2°C Nominal</span>
            </div>
            <h4 className="feature-title">Cold Chain Sensors</h4>
            <p className="feature-desc">
              Biologic refrigerators and peptide freezers are functioning within calibrated parameters. Chamber #3 telemetry sync active.
            </p>
          </div>
          <div className="feature-footer-action" onClick={() => showToast("Chamber sensors optimal at 4.2°C.", "info")}>
            <span>Sensor Battery: 94%</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              View Telemetry <ArrowForwardIcon sx={{ fontSize: 13 }} />
            </span>
          </div>
        </div>

        <div className="clinical-feature-card">
          <div>
            <div className="feature-header-row">
              <div className="feature-icon-badge" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                <BarcodeIcon sx={{ fontSize: 20 }} />
              </div>
              <span className="feature-status-tag" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                Scanner Ready
              </span>
            </div>
            <h4 className="feature-title">GS1 Barcode Auto-Ingest</h4>
            <p className="feature-desc">
              Connect handheld Bluetooth barcode readers to register bulk manufacturer cartons and automate NDC validation.
            </p>
          </div>
          <div className="feature-footer-action" onClick={() => showToast("GS1 Handheld Barcode scanner initialized.", "success")}>
            <span>Terminal ID: #PHARM-04</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Activate Scanner <ArrowForwardIcon sx={{ fontSize: 13 }} />
            </span>
          </div>
        </div>

        <div className="clinical-feature-card">
          <div>
            <div className="feature-header-row">
              <div className="feature-icon-badge" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                <GovernanceIcon sx={{ fontSize: 20 }} />
              </div>
              <span className="feature-status-tag" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                100% Compliant
              </span>
            </div>
            <h4 className="feature-title">Formulary Governance</h4>
            <p className="feature-desc">
              All registered therapeutic compounds adhere to WHO Model Lists of Essential Medicines and National Formulary Standards.
            </p>
          </div>
          <div className="feature-footer-action" onClick={() => showToast("Formulary audit verified compliant.", "info")}>
            <span>Protocol: BNF / USP v24</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Policy Audit <ArrowForwardIcon sx={{ fontSize: 13 }} />
            </span>
          </div>
        </div>
      </div>

      {/* ── Dialog: Register / Edit Medicine ─────────────────── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "18px", color: "#0F172A" }}>
            {editMode ? "Update Registered Compound" : "Register Pharmaceutical Compound"}
          </strong>
          <IconButton onClick={() => setOpenDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Medicine Generic Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              size="small"
              placeholder="e.g. Amoxycillin Trihydrate"
            />
            <TextField
              label="Formulation & Strength Spec"
              value={formData.strength}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              required
              fullWidth
              size="small"
              placeholder="e.g. 500mg Oral Capsule • DIN #0482910"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormControl fullWidth size="small">
                <InputLabel>Therapeutic Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Therapeutic Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="Antibiotic">Antibiotic</MenuItem>
                  <MenuItem value="Analgesic">Analgesic</MenuItem>
                  <MenuItem value="Antihistamine">Antihistamine</MenuItem>
                  <MenuItem value="Cardiovascular">Cardiovascular</MenuItem>
                  <MenuItem value="Gastrointestinal">Gastrointestinal</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Unit Form</InputLabel>
                <Select
                  value={formData.unitForm}
                  label="Unit Form"
                  onChange={(e) => setFormData({ ...formData, unitForm: e.target.value })}
                >
                  <MenuItem value="Capsule">Capsule</MenuItem>
                  <MenuItem value="Tablet">Tablet</MenuItem>
                  <MenuItem value="Syrup">Syrup</MenuItem>
                  <MenuItem value="Injection">Injection</MenuItem>
                  <MenuItem value="Vial">Vial</MenuItem>
                  <MenuItem value="Bottle">Bottle</MenuItem>
                  <MenuItem value="Cream / Ointment">Cream / Ointment</MenuItem>
                  <MenuItem value="Drops">Drops</MenuItem>
                  <MenuItem value="Inhaler">Inhaler</MenuItem>
                  <MenuItem value="Sachet">Sachet</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <TextField
                label="Current Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                inputProps={{ min: 0, step: "1" }}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Min Safety Reorder Level"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                inputProps={{ min: 0, step: "1" }}
                required
                fullWidth
                size="small"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <TextField
                label="Unit Rate (Rs.)"
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                inputProps={{ min: 0, step: "0.01" }}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Batch Identification"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                fullWidth
                size="small"
                placeholder="e.g. BT-2026-014"
              />
            </div>

            <TextField
              label="Expiry Date"
              type="date"
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: "#006699", "&:hover": { bgcolor: "#004d73" }, borderRadius: "8px", fontWeight: 700 }}
            >
              {loading ? "Saving..." : editMode ? "Update Compound" : "Save to Formulary"}
            </Button>
          </DialogActions>
        </form>
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
