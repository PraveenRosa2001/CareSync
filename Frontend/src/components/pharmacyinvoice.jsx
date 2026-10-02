import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  LocalPharmacy as PharmacyIcon,
  ReceiptLong as ReceiptIcon,
} from "@mui/icons-material";
import "../styles/pharmacy.css";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5155/api";

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PharmacyInvoice() {
  const { patientId, serial_no } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispenseResult = location.state?.dispenseResult || null;

  const [encounter, setEncounter] = useState(
    dispenseResult?.Encounter || null
  );
  const [loading, setLoading] = useState(!dispenseResult?.Encounter);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE}/Pharmacy/encounter/${encodeURIComponent(
            patientId
          )}/${serial_no}`
        );
        setEncounter(response.data);
        setError("");
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Unable to load the pharmacy dispensing summary."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!encounter) load();
  }, [encounter, patientId, serial_no]);

  const receiptLines = useMemo(() => {
    if (Array.isArray(dispenseResult?.DispensedLines) && dispenseResult.DispensedLines.length) {
      return dispenseResult.DispensedLines.map((line) => ({
        code: line.MaterialCode,
        name: line.MedicineName,
        specification: line.Specification,
        unit: line.Unit,
        quantity: Number(line.DispensedNow || 0),
        rate: Number(line.Rate || 0),
        amount: Number(line.Amount || 0),
      }));
    }

    return (encounter?.Drugs || [])
      .filter((line) => Number(line.DispensedQty || 0) > 0)
      .map((line) => ({
        code: line.MaterialCode,
        name: line.MedicineName,
        specification: line.Specification,
        unit: line.Unit,
        quantity: Number(line.DispensedQty || 0),
        rate: Number(line.Rate || 0),
        amount:
          Number(line.DispensedQty || 0) * Number(line.Rate || 0),
      }));
  }, [dispenseResult, encounter]);

  const pharmacyTotal = receiptLines.reduce(
    (sum, line) => sum + Number(line.amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="pharm-receipt-state">
        <CircularProgress />
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="pharm-receipt-state">
        <ReceiptIcon />
        <h2>Dispensing summary unavailable</h2>
        <p>{error || "The requested encounter could not be loaded."}</p>
        <button className="pharm-secondary-btn" onClick={() => navigate(-1)}>
          <BackIcon fontSize="small" /> Back
        </button>
      </div>
    );
  }

  const isSingleDispense = Boolean(dispenseResult?.DispensedLines?.length);

  return (
    <div className="pharm-receipt-page">
      <div className="pharm-receipt-toolbar no-print">
        <button className="pharm-secondary-btn" onClick={() => navigate(-1)}>
          <BackIcon fontSize="small" /> Back to pharmacy
        </button>
        <button className="pharm-primary-btn receipt-print" onClick={() => window.print()}>
          <PrintIcon fontSize="small" /> Print summary
        </button>
      </div>

      <section className="pharm-receipt-sheet">
        <header className="pharm-receipt-header">
          <div className="pharm-receipt-brand">
            <div className="pharm-receipt-logo"><PharmacyIcon /></div>
            <div>
              <strong>CareSync Hospital</strong>
              <span>Central Pharmacy</span>
            </div>
          </div>
          <div className="pharm-receipt-title">
            <span>{isSingleDispense ? "Dispensing receipt" : "Dispensing summary"}</span>
            <strong>Encounter #{encounter.Treatment.SerialNo}</strong>
          </div>
        </header>

        <div className="pharm-receipt-meta">
          <div><span>Patient</span><strong>{encounter.Patient.Name || "Not recorded"}</strong></div>
          <div><span>Patient code</span><strong>{encounter.Patient.Code}</strong></div>
          <div><span>NIC</span><strong>{encounter.Patient.Nic || "Not recorded"}</strong></div>
          <div><span>Contact</span><strong>{encounter.Patient.Mobile || "Not recorded"}</strong></div>
          <div><span>Prescribing doctor</span><strong>{encounter.Doctor.Name || "Not recorded"}</strong></div>
          <div><span>Specialization</span><strong>{encounter.Doctor.Specialization || "Not recorded"}</strong></div>
          <div><span>Encounter date</span><strong>{formatDateTime(encounter.Treatment.EncounterDate)}</strong></div>
          <div>
            <span>{isSingleDispense ? "Dispensed at" : "Pharmacy status"}</span>
            <strong>{isSingleDispense ? formatDateTime(dispenseResult.DispensedAt) : encounter.PharmacyStatus}</strong>
          </div>
        </div>

        <div className="pharm-receipt-section-title">
          <div>
            <h2>{isSingleDispense ? "Medicines dispensed in this transaction" : "Medicines dispensed for this prescription"}</h2>
            <p>Amounts below are calculated from the stored prescription rate and recorded dispensed quantity.</p>
          </div>
        </div>

        <div className="pharm-receipt-table-wrap">
          <table className="pharm-receipt-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Material code</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {receiptLines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="pharm-no-lines">No medicine has been dispensed for this encounter.</td>
                </tr>
              ) : (
                receiptLines.map((line, index) => (
                  <tr key={`${line.code}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{line.name || line.code}</strong>
                      <span>{[line.specification, line.unit].filter(Boolean).join(" · ") || ""}</span>
                    </td>
                    <td>{line.code}</td>
                    <td>{line.quantity.toLocaleString()}</td>
                    <td>{money(line.rate)}</td>
                    <td><strong>{money(line.amount)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pharm-receipt-totals">
          <div><span>Pharmacy value shown</span><strong>{money(pharmacyTotal)}</strong></div>
          <div><span>Full prescription value</span><strong>{money(encounter.Summary.PrescriptionTotal)}</strong></div>
          <div><span>Still pending value</span><strong>{money(encounter.Summary.PendingValue)}</strong></div>
        </div>

        <footer className="pharm-receipt-footer">
          <div>
            <strong>Clinical reference</strong>
            <span>
              Consultation/facility fee recorded on encounter: {money(encounter.Treatment.ConsultationFee)}
            </span>
          </div>
          <p>
            This page is generated from the CareSync treatment, prescription and inventory records.
            It does not add unrecorded taxes, handling fees, subsidies or payment claims.
          </p>
        </footer>
      </section>
    </div>
  );
}
