import React, { useState } from "react";
import {
  Emergency as EmergencyIcon,
  LocalHospital as AmbulanceIcon,
  Bloodtype as BloodIcon,
  MedicalServices as SurgeonIcon,
  NotificationsActive as AlertIcon,
  Shield as ShieldIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { Snackbar, Alert } from "@mui/material";

export default function TraumaEmergency() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const triggerCodeBlue = (bay) => {
    setSnackbar({
      open: true,
      message: `🚨 CODE BLUE Broadcast sent to Trauma Team Alpha for ${bay}!`,
      severity: "error",
    });
  };

  return (
    <div className="hospital-admin-page-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-title-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                background: "#FEE2E2",
                color: "#DC2626",
                fontSize: "11px",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span className="pulse-dot" style={{ backgroundColor: "#DC2626" }}></span>
              LEVEL 1 TRAUMA PROTOCOL ACTIVE
            </span>
          </div>
          <h1 className="page-title-heading">Trauma &amp; Acute Emergency Response Wing</h1>
          <p className="page-subtitle-text">
            Real-time ambulance dispatch telemetry, resuscitation bay monitoring, critical triage scoring, and priority OR routing.
          </p>
        </div>

        <div className="page-action-group">
          <button
            style={{
              background: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
            }}
            onClick={() => triggerCodeBlue("Emergency Bay #01")}
          >
            <AlertIcon sx={{ fontSize: 18 }} />
            <span>DISPATCH CODE BLUE</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ────────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">TRAUMA RESUS BAYS</div>
            <div className="kpi-val-row">
              <span className="kpi-number" style={{ color: "#DC2626" }}>4 / 6</span>
              <span className="kpi-delta-pill red">Occupied</span>
            </div>
            <div className="kpi-subtext">2 Bays Ready for Ingest</div>
          </div>
          <div className="kpi-icon-box red">
            <EmergencyIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">INCOMING AMBULANCES</div>
            <div className="kpi-val-row">
              <span className="kpi-number">2</span>
              <span className="kpi-delta-pill amber">ETA 4 &amp; 7 mins</span>
            </div>
            <div className="kpi-subtext">Telemetry Pre-Registration Live</div>
          </div>
          <div className="kpi-icon-box purple">
            <AmbulanceIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">ON-DUTY TRAUMA SURGEONS</div>
            <div className="kpi-val-row">
              <span className="kpi-number">6</span>
              <span className="kpi-delta-pill blue">100% On-Call</span>
            </div>
            <div className="kpi-subtext">OR Suite #2 &amp; #4 Scrubbed</div>
          </div>
          <div className="kpi-icon-box teal">
            <SurgeonIcon sx={{ fontSize: 22 }} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">O-NEGATIVE BLOOD RESERVE</div>
            <div className="kpi-val-row">
              <span className="kpi-number">18</span>
              <span className="kpi-delta-pill blue">Units Safe</span>
            </div>
            <div className="kpi-subtext">Central Blood Bank Synchronized</div>
          </div>
          <div className="kpi-icon-box red">
            <BloodIcon sx={{ fontSize: 22 }} />
          </div>
        </div>
      </div>

      {/* ── Active Trauma Bays Grid ──────────────────────────── */}
      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "0 0 14px 0" }}>
        Active Resuscitation Bays &amp; Triage Stream
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
        {[
          {
            bay: "Bay #01 (Critical Resus)",
            patient: "Unidentified Male (Approx 40Y)",
            injury: "Polytrauma • Hemorrhagic Shock",
            vitals: "BP 85/55 • HR 135 bpm • SpO2 91%",
            status: "Surgical Stabilization",
            badge: "CRITICAL 1",
            color: "#DC2626",
            bg: "#FEF2F2",
          },
          {
            bay: "Bay #02 (Cardiac Arrest)",
            patient: "Gunawardena S. (68Y / M)",
            injury: "Acute Anterior STEMI • Post-CPR",
            vitals: "Sinus Rhythm restored • Telemetry Active",
            status: "Cath Lab Transfer Prep",
            badge: "PRIORITY 1",
            color: "#D97706",
            bg: "#FFFBEB",
          },
          {
            bay: "Bay #03 (Stroke Protocol)",
            patient: "Perera M. (54Y / F)",
            injury: "Left MCA Ischemic CVA • NIHSS 14",
            vitals: "BP 160/95 • Thrombolysis Infusing",
            status: "CT Angio Scan Complete",
            badge: "PRIORITY 2",
            color: "#0284C7",
            bg: "#EFF6FF",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "#FFFFFF",
              border: `1px solid ${item.color}40`,
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <strong style={{ fontSize: "15px", color: "#0F172A" }}>{item.bay}</strong>
                <span
                  style={{
                    background: item.bg,
                    color: item.color,
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: "12px",
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>
                {item.patient}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "10px" }}>
                {item.injury}
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1E293B",
                  marginBottom: "12px",
                }}
              >
                {item.vitals}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>
                ● {item.status}
              </span>
              <button
                style={{
                  background: item.color,
                  color: "#FFFFFF",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => triggerCodeBlue(item.bay)}
              >
                Code Escalation
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
