import React, { useState } from "react";
import {
  Shield as ShieldIcon,
  Security as SecurityIcon,
  Tune as SettingsIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  Storage as DbIcon,
  CloudDone as CloudIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { Snackbar, Alert, TextField, Switch, FormControlLabel } from "@mui/material";

export default function SettingsAudit() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [settings, setSettings] = useState({
    hospitalName: "CareSync+ Colombo Central Hospital",
    licenseNo: "MOH/REG/2024-8841-B",
    hipaaStrict: true,
    mfaEnforced: true,
    telemetrySyncInterval: "30 seconds",
    backupSchedule: "Every 4 Hours",
    auditRetention: "7 Years (HIPAA Standard)",
  });

  const showToast = (message) => {
    setSnackbar({ open: true, message, severity: "success" });
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast("Hospital enterprise governance settings saved successfully.");
  };

  return (
    <div className="hospital-admin-page-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title-heading">Hospital System Settings &amp; HIPAA Audit Vault</h1>
          <p className="page-subtitle-text">
            Configure institutional clinical security thresholds, role-based access controls (RBAC), FIDO2 MFA policies, and review unalterable audit trails.
          </p>
        </div>

        <div className="page-action-group">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#E0F2FE",
              color: "#0284C7",
              padding: "6px 14px",
              borderRadius: "20px",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            <ShieldIcon sx={{ fontSize: 16 }} />
            <span>FIDO2 / JCI Audit Mode Active</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "24px" }}>
        {/* Institutional Settings Card */}
        <div className="clinical-table-card" style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
            Hospital Institutional Governance
          </h3>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <TextField
              label="Hospital Name & Facility ID"
              value={settings.hospitalName}
              onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
              fullWidth
              size="small"
            />

            <TextField
              label="Ministry of Health / JCI License Number"
              value={settings.licenseNo}
              onChange={(e) => setSettings({ ...settings, licenseNo: e.target.value })}
              fullWidth
              size="small"
            />

            <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#0F172A", marginBottom: "8px" }}>
                Security &amp; Encryption Controls
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.hipaaStrict}
                      onChange={(e) => setSettings({ ...settings, hipaaStrict: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<span style={{ fontSize: "12.5px", fontWeight: 600 }}>Enforce Strict HIPAA v4.2 Field Encryption</span>}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.mfaEnforced}
                      onChange={(e) => setSettings({ ...settings, mfaEnforced: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<span style={{ fontSize: "12.5px", fontWeight: 600 }}>Mandate Hardware FIDO2 MFA for Privileged Admins</span>}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <TextField
                label="Telemetry Sync"
                value={settings.telemetrySyncInterval}
                disabled
                size="small"
              />
              <TextField
                label="Backup Retention"
                value={settings.auditRetention}
                disabled
                size="small"
              />
            </div>

            <button type="submit" className="btn-primary-cyan" style={{ justifyContent: "center", padding: "10px" }}>
              <SaveIcon sx={{ fontSize: 16 }} />
              <span>Save System Policies</span>
            </button>
          </form>
        </div>

        {/* Immutable Audit Log Table */}
        <div className="clinical-table-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
              Immutable Clinical Audit Log
            </h3>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>● Real-time SHA-256 Chain</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>ACTOR</th>
                  <th>EVENT CLASSIFICATION</th>
                  <th>IP / TERMINAL</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: "2026-09-28 10:14:22", actor: "AdminTest", event: "User Profile Updated: kuruppu", ip: "192.168.1.104" },
                  { time: "2026-09-28 10:05:01", actor: "Pharm. Test", event: "Dispensed Rx INV-2025-0509-88", ip: "192.168.2.14" },
                  { time: "2026-09-28 09:44:18", actor: "Dr. Test", event: "Prescription Signed: PA0020", ip: "192.168.1.55" },
                  { time: "2026-09-28 09:12:00", actor: "AdminTest", event: "Timeslot Activated: #TS-9021", ip: "192.168.1.104" },
                  { time: "2026-09-28 08:30:15", actor: "System Daemon", event: "Cold Chain Telemetry Check (4.2°C)", ip: "Internal Mesh" },
                ].map((log, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: "monospace", fontSize: "11.5px", color: "#64748B" }}>{log.time}</td>
                    <td><strong>{log.actor}</strong></td>
                    <td style={{ fontSize: "12px", color: "#0F172A" }}>{log.event}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "11.5px", color: "#64748B" }}>{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
