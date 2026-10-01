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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  MedicalServices as MedicalIcon,
  LocalPharmacy as PharmacyIcon,
  AdminPanelSettings as AdminShieldIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Laptop as LaptopIcon,
  TabletMac as TabletIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";

// Initial mock data matching screenshot 1 accurately for seamless fallback & instant fidelity
const INITIAL_STAFF = [];

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (value === "doc" || value.includes("doctor")) return "Doc";
  if (value === "phuser" || value.includes("pharm")) return "Phuser";
  if (value === "admin" || value.includes("administrator")) return "Admin";
  return String(role || "Unknown").trim();
};

const formatMemberSince = (dateValue) => {
  if (!dateValue) return "Not recorded";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString("en-GB");
};

const extractApiError = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.error) return data.error;
  if (data?.title) return data.title;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat().find(Boolean);
    if (first) return first;
  }
  return "Unable to create the user. Please check the entered details and try again.";
};

export default function AddUser() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(INITIAL_STAFF);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [roleTab, setRoleTab] = useState("All Users");
  const [openDialog, setOpenDialog] = useState(false);

  // Inspector / Right Panel selected user
  const [selectedUser, setSelectedUser] = useState({
    username: "",
    userType: "",
    fullName: "",
    email: "",
    nic: "",
    hotline: "",
    password: "••••••••••••••••••••",
    memberSince: "Not recorded",
  });

  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      device: "Admin Console (Colombo)",
      sub: "Current Session • TLS 1.3",
      isLive: true,
      icon: <LaptopIcon sx={{ fontSize: 18, color: "#0284C7" }} />,
    },
    {
      id: 2,
      device: "Pharmacy Gateway iPad",
      sub: "Ward 4 • 2 hrs ago",
      isLive: false,
      icon: <TabletIcon sx={{ fontSize: 18, color: "#64748B" }} />,
    },
  ]);

  // Form for "+ Add New User"
  const [formData, setFormData] = useState({
    MUD_USER_NAME: "",
    MUD_PASSWORD: "",
    MUD_USER_TYPE: "Doc",
    MUD_STATUS: "A",
    MUD_SPECIALIZATION: "Cardiologist",
    MUD_FULL_NAME: "",
    MUD_EMAIL: "",
    MUD_NIC_NO: "",
    MUD_CONTACT: "",
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/User`);
      const apiUsers = Array.isArray(response.data) ? response.data : [];

      const mapped = apiUsers.map((u) => ({
        MUD_USER_ID: u.MUD_USER_ID || "",
        MUD_USER_NAME: u.MUD_USER_NAME || "",
        MUD_FULL_NAME: u.MUD_FULL_NAME || u.MUD_USER_NAME || "Not recorded",
        MUD_EMAIL: u.MUD_EMAIL || "Not recorded",
        MUD_USER_TYPE: normalizeRole(u.MUD_USER_TYPE),
        MUD_SPECIALIZATION: u.MUD_SPECIALIZATION || "Not assigned",
        MUD_NIC_NO: u.MUD_NIC_NO || "",
        MUD_CONTACT: u.MUD_CONTACT || "",
        created: formatMemberSince(u.MUD_CREATED_DATE),
        status: String(u.MUD_STATUS || "A").toUpperCase() === "A" ? "Active" : "Suspended",
      }));

      setUsers(mapped);

      if (mapped.length > 0) {
        const firstUser = mapped[0];
        setSelectedUser({
          username: firstUser.MUD_USER_NAME,
          userType: firstUser.MUD_USER_TYPE,
          fullName: firstUser.MUD_FULL_NAME,
          email: firstUser.MUD_EMAIL,
          nic: firstUser.MUD_NIC_NO || "Not recorded",
          hotline: firstUser.MUD_CONTACT || "Not recorded",
          password: "••••••••••••••••••••",
          memberSince: firstUser.created,
        });
      }
    } catch (err) {
      setUsers([]);
      showToast("Unable to load staff accounts from the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectRow = (u) => {
    setSelectedUser({
      username: u.MUD_USER_NAME || "",
      userType: normalizeRole(u.MUD_USER_TYPE),
      fullName: u.MUD_FULL_NAME || "Not recorded",
      email: u.MUD_EMAIL || "Not recorded",
      nic: u.MUD_NIC_NO || "Not recorded",
      hotline: u.MUD_CONTACT || "Not recorded",
      password: "••••••••••••••••••••",
      memberSince: u.created || "Not recorded",
    });
  };

  const handleSaveInspector = (e) => {
    e.preventDefault();
    showToast(`Profile changes saved for ${selectedUser.username}!`, "success");
  };

  const handleRevokeSession = (sessionId) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast("Session revoked successfully.", "info");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name !== "MUD_USER_TYPE") {
        return { ...prev, [name]: value };
      }

      const defaultSpecialization =
        value === "Doc"
          ? "Cardiologist"
          : value === "Phuser"
          ? "Clinical Pharmacist"
          : "Systems Director";

      return {
        ...prev,
        MUD_USER_TYPE: value,
        MUD_SPECIALIZATION: defaultSpecialization,
      };
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (
      !formData.MUD_USER_NAME.trim() ||
      !formData.MUD_FULL_NAME.trim() ||
      !formData.MUD_EMAIL.trim() ||
      !formData.MUD_PASSWORD ||
      !formData.MUD_USER_TYPE
    ) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (formData.MUD_USER_TYPE === "Doc" && !formData.MUD_SPECIALIZATION) {
      showToast("Please select a specialization for the doctor.", "error");
      return;
    }

    if (formData.MUD_CONTACT && !/^[0-9+\- ]{7,20}$/.test(formData.MUD_CONTACT)) {
      showToast("Please enter a valid contact number.", "error");
      return;
    }

    setLoading(true);
    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, typeof value === "string" ? value.trim() : value);
      });

      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/User`, formPayload);

      showToast(`User ${formData.MUD_USER_NAME} created successfully!`, "success");
      setOpenDialog(false);
      setFormData({
        MUD_USER_NAME: "",
        MUD_PASSWORD: "",
        MUD_USER_TYPE: "Doc",
        MUD_STATUS: "A",
        MUD_SPECIALIZATION: "Cardiologist",
        MUD_FULL_NAME: "",
        MUD_EMAIL: "",
        MUD_NIC_NO: "",
        MUD_CONTACT: "",
      });

      await fetchUsers();
    } catch (err) {
      // Never create a fake local user when the database insert fails.
      // Show the real backend validation/database message and keep the form open.
      showToast(extractApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const totalStaff = users.length;
  const totalDoctors = users.filter((u) => u.MUD_USER_TYPE === "Doc").length;
  const totalPharmacists = users.filter((u) => u.MUD_USER_TYPE === "Phuser").length;
  const totalAdmins = users.filter((u) => u.MUD_USER_TYPE === "Admin").length;
  const totalSuspended = users.filter((u) => u.status === "Suspended").length;

  // Filtered list
  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleTab === "Doctors" && u.MUD_USER_TYPE !== "Doc") return false;
    if (roleTab === "Pharmacists" && u.MUD_USER_TYPE !== "Phuser") return false;
    if (roleTab === "Admins" && u.MUD_USER_TYPE !== "Admin") return false;
    if (roleTab === "Suspended" && u.status !== "Suspended") return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        u.MUD_FULL_NAME?.toLowerCase().includes(q) ||
        u.MUD_USER_NAME?.toLowerCase().includes(q) ||
        u.MUD_EMAIL?.toLowerCase().includes(q) ||
        u.MUD_SPECIALIZATION?.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Department filter
    if (departmentFilter !== "All Departments") {
      if (u.MUD_SPECIALIZATION?.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="hospital-admin-page-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">Hospital Staff &amp; User Access Governance</h1>
          <p className="page-subtitle-text">
            Manage role-based system permissions, clinical credentials, and directory provisioning for Doctors, Pharmacists, and
            Administrators under strict HIPAA RBAC controls.
          </p>
        </div>
        <div className="page-action-group">
          <button className="btn-primary-cyan" onClick={() => setOpenDialog(true)}>
            <AddIcon sx={{ fontSize: 18 }} />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">TOTAL STAFF ACCOUNTS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{totalStaff}</span>
              <span className="kpi-delta-pill blue">+3 today</span>
            </div>
            <div className="kpi-subtext">Directory synced</div>
          </div>
          <div className="kpi-icon-box blue">
            <PersonIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">ATTENDING DOCTORS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{totalDoctors}</span>
              <span className="kpi-delta-pill blue">100% Active</span>
            </div>
            <div className="kpi-subtext">14 Clinical Specialties</div>
          </div>
          <div className="kpi-icon-box teal">
            <MedicalIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">LICENSED PHARMACISTS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{totalPharmacists}</span>
              <span className="kpi-delta-pill blue">Rx Privileges</span>
            </div>
            <div className="kpi-subtext">Dispensary Level III</div>
          </div>
          <div className="kpi-icon-box purple">
            <PharmacyIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">PRIVILEGED ADMINS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">{totalAdmins}</span>
              <span className="kpi-delta-pill red">FIDO2 MFA</span>
            </div>
            <div className="kpi-subtext">Super Admin Audit On</div>
          </div>
          <div className="kpi-icon-box red">
            <AdminShieldIcon sx={{ fontSize: 22 }} />
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Split (Table + Inspector) ────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "22px" }}>
        {/* Left Column: Staff Directory Table */}
        <div>
          <div className="clinical-table-card">
            {/* Search and Filter Row */}
            <div className="clinical-table-filter-bar">
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, maxWidth: "420px" }}>
                <div className="topbar-search-box" style={{ width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />
                  <input
                    type="text"
                    placeholder="Search staff by legal name, username, em..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Cardiologist">Cardiology</option>
                  <option value="Neurologist">Neurology</option>
                  <option value="Psychiatrist">Psychiatry</option>
                  <option value="Pediatrician">Pediatrics</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="topbar-icon-btn"
                  title="Export Staff Directory"
                  onClick={() => showToast("Exporting Staff Directory...", "info")}
                >
                  <DownloadIcon sx={{ fontSize: 18 }} />
                </button>
                <button className="topbar-icon-btn" title="Sync Directory" onClick={fetchUsers}>
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            {/* Filter Pills Tabs */}
            <div style={{ padding: "10px 18px", background: "#FAFAFC", borderBottom: "1px solid #F1F5F9" }}>
              <div className="filter-pills-row">
                <button
                  className={`filter-pill-btn ${roleTab === "All Users" ? "active" : ""}`}
                  onClick={() => setRoleTab("All Users")}
                >
                  All Users ({totalStaff})
                </button>
                <button
                  className={`filter-pill-btn ${roleTab === "Doctors" ? "active" : ""}`}
                  onClick={() => setRoleTab("Doctors")}
                >
                  Doctors ({totalDoctors})
                </button>
                <button
                  className={`filter-pill-btn ${roleTab === "Pharmacists" ? "active" : ""}`}
                  onClick={() => setRoleTab("Pharmacists")}
                >
                  Pharmacists ({totalPharmacists})
                </button>
                <button
                  className={`filter-pill-btn ${roleTab === "Admins" ? "active" : ""}`}
                  onClick={() => setRoleTab("Admins")}
                >
                  Admins ({totalAdmins})
                </button>
                <button
                  className={`filter-pill-btn ${roleTab === "Suspended" ? "active" : ""}`}
                  onClick={() => setRoleTab("Suspended")}
                >
                  Suspended ({totalSuspended})
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>USER IDENTITY</th>
                    <th>EMAIL</th>
                    <th>CATEGORY</th>
                    <th>SPECIALIZATION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 7).map((u, idx) => {
                    const isSelected = selectedUser.username === u.MUD_USER_NAME;
                    const isDoc = u.MUD_USER_TYPE === "Doc";
                    const isAdmin = u.MUD_USER_TYPE === "Admin";
                    const initial = u.MUD_FULL_NAME ? u.MUD_FULL_NAME.charAt(0).toUpperCase() : "U";

                    return (
                      <tr
                        key={u.MUD_USER_ID || idx}
                        className={isSelected ? "selected-row" : ""}
                        onClick={() => handleSelectRow(u)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div className="user-identity-cell">
                            <div
                              className="table-user-avatar"
                              style={{
                                background: isAdmin ? "#0284C7" : isDoc ? "#0284C7" : "#6366F1",
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <div className="table-user-name">{u.MUD_FULL_NAME}</div>
                              <div className="table-user-handle">@{u.MUD_USER_NAME}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#334155", fontFamily: "monospace", fontSize: "12.5px" }}>
                          {u.MUD_EMAIL}
                        </td>
                        <td>
                          {isAdmin && <span className="category-badge admin">Admin</span>}
                          {isDoc && <span className="category-badge doctor">Doctor</span>}
                          {!isAdmin && !isDoc && <span className="category-badge pharmacist">Pharmacist</span>}
                        </td>
                        <td style={{ color: "#475569", fontWeight: 500 }}>
                          {u.MUD_SPECIALIZATION || "Not assigned"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 18px",
                borderTop: "1px solid #F1F5F9",
                fontSize: "12.5px",
                color: "#64748B",
              }}
            >
              <span>Showing 1 to 7 of {totalStaff} credentialed users</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button className="filter-pill-btn" style={{ padding: "4px 8px" }}>
                  &lsaquo;
                </button>
                <button className="filter-pill-btn active" style={{ padding: "4px 10px" }}>
                  1
                </button>
                <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>
                  2
                </button>
                <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>
                  3
                </button>
                <span style={{ color: "#94A3B8" }}>...</span>
                <button className="filter-pill-btn" style={{ padding: "4px 10px" }}>
                  12
                </button>
                <button className="filter-pill-btn" style={{ padding: "4px 8px" }}>
                  &rsaquo;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Detail & Profile Editor Inspector */}
        <div>
          <div
            className="clinical-table-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* User Profile Header Card */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#0284C7",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    background: "#FFFFFF",
                    borderRadius: "50%",
                    padding: "3px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    display: "flex",
                  }}
                >
                  <EditIcon sx={{ fontSize: 13, color: "#64748B" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
                    {selectedUser.username}
                  </h3>
                  <VerifiedIcon sx={{ fontSize: 16, color: "#0284C7" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  <AdminShieldIcon sx={{ fontSize: 13, color: "#0284C7" }} />
                  <span>
                    {selectedUser.userType === "Admin"
                      ? "Super Administrator"
                      : selectedUser.userType === "Doc"
                      ? "Attending Doctor"
                      : "Licensed Pharmacist"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                  Member since: {selectedUser.memberSince}
                </div>
              </div>
            </div>

            {/* Editable Inspector Form */}
            <form onSubmit={handleSaveInspector} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                    USERNAME
                  </label>
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    <input
                      style={{ border: "none", background: "transparent", outline: "none", fontSize: "12.5px", width: "100%", fontWeight: 600, color: "#0F172A" }}
                      value={selectedUser.username}
                      onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                    USER TYPE
                  </label>
                  <div
                    style={{
                      background: "#EFF6FF",
                      border: "1px solid #DBEAFE",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <AdminShieldIcon sx={{ fontSize: 15, color: "#0284C7" }} />
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0284C7" }}>{selectedUser.userType}</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                  FULL LEGAL NAME
                </label>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <BadgeIcon sx={{ fontSize: 15, color: "#64748B" }} />
                  <input
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: "12.5px", width: "100%", color: "#0F172A" }}
                    value={selectedUser.fullName}
                    onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                  OFFICIAL EMAIL
                </label>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <EmailIcon sx={{ fontSize: 15, color: "#64748B" }} />
                  <input
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: "12.5px", width: "100%", color: "#0F172A" }}
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                    NIC / STAFF ID
                  </label>
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <BadgeIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    <input
                      style={{ border: "none", background: "transparent", outline: "none", fontSize: "12.5px", width: "100%", color: "#0F172A" }}
                      value={selectedUser.nic}
                      onChange={(e) => setSelectedUser({ ...selectedUser, nic: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                    CONTACT HOTLINE
                  </label>
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    <input
                      style={{ border: "none", background: "transparent", outline: "none", fontSize: "12.5px", width: "100%", color: "#0F172A" }}
                      value={selectedUser.hotline}
                      onChange={(e) => setSelectedUser({ ...selectedUser, hotline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                    MASTER PASSWORD
                  </label>
                  <span
                    style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7", cursor: "pointer" }}
                    onClick={() => showToast("Password reset ticket created and OTP sent.", "info")}
                  >
                    Change Key
                  </span>
                </div>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <LockIcon sx={{ fontSize: 15, color: "#64748B" }} />
                  <input
                    type="password"
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: "12.5px", width: "100%", color: "#0F172A" }}
                    value={selectedUser.password}
                    readOnly
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary-cyan"
                style={{ width: "100%", justifyContent: "center", marginTop: "6px" }}
              >
                <SaveIcon sx={{ fontSize: 16 }} />
                <span>Save Profile Changes</span>
              </button>
            </form>

            {/* Active Session Log */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                  ACTIVE SESSION LOG
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>● {activeSessions.length} Active</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {session.icon}
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{session.device}</div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>{session.sub}</div>
                      </div>
                    </div>

                    {session.isLive ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          background: "#E0F2FE",
                          color: "#0284C7",
                          padding: "3px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        Live
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#EF4444",
                          cursor: "pointer",
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog: Add New User ────────────────────────────── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#0F172A" }}>Provision New Hospital User</div>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleCreateUser}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Username"
              name="MUD_USER_NAME"
              value={formData.MUD_USER_NAME}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
              placeholder="e.g. jdoe_cardio"
            />
            <TextField
              label="Full Legal Name"
              name="MUD_FULL_NAME"
              value={formData.MUD_FULL_NAME}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
              placeholder="e.g. Dr. Johnathan Doe"
            />
            <TextField
              label="Official Email"
              name="MUD_EMAIL"
              type="email"
              value={formData.MUD_EMAIL}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
              placeholder="jdoe@medicare.lk"
            />
            <TextField
              label="Temporary Password"
              name="MUD_PASSWORD"
              type="password"
              value={formData.MUD_PASSWORD}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormControl fullWidth size="small">
                <InputLabel>Role / Access Level</InputLabel>
                <Select
                  name="MUD_USER_TYPE"
                  value={formData.MUD_USER_TYPE}
                  label="Role / Access Level"
                  onChange={handleFormChange}
                >
                  <MenuItem value="Doc">Attending Doctor</MenuItem>
                  <MenuItem value="Phuser">Licensed Pharmacist</MenuItem>
                  <MenuItem value="Admin">System Administrator</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Specialization</InputLabel>
                <Select
                  name="MUD_SPECIALIZATION"
                  value={formData.MUD_SPECIALIZATION}
                  label="Specialization"
                  onChange={handleFormChange}
                >
                  <MenuItem value="Cardiologist">Cardiologist</MenuItem>
                  <MenuItem value="Neurologist">Neurologist</MenuItem>
                  <MenuItem value="Psychiatrist">Psychiatrist</MenuItem>
                  <MenuItem value="Pediatrician">Pediatrician</MenuItem>
                  <MenuItem value="Systems Director">Systems Director</MenuItem>
                  <MenuItem value="Clinical Pharmacist">Clinical Pharmacist</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <TextField
                label="National Identity (NIC)"
                name="MUD_NIC_NO"
                value={formData.MUD_NIC_NO}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="199512345678"
              />
              <TextField
                label="Emergency Hotline / Contact"
                name="MUD_CONTACT"
                value={formData.MUD_CONTACT}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="0771234567"
              />
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: "#006699", "&:hover": { bgcolor: "#004d73" }, borderRadius: "8px", fontWeight: 700 }}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            >
              {loading ? "Provisioning..." : "Create User Credentials"}
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
