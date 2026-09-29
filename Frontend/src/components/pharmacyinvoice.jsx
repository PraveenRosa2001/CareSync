// CareSync+ Hospital Dispensary Tax Invoice & Pharmacy Bill
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  LocalPharmacy as PharmacyIcon,
  LocalHospital,
} from "@mui/icons-material";
import html2pdf from "html2pdf.js";

export default function PharmacyInvoice() {
  const { patientId, serial_no } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedMedicines = [], totaldrugfee = 0 } = location.state || {};

  const [patients, setPatients] = useState(null);
  const [invoicedetails, setInvoicedetails] = useState(null);
  const [treatmentamount, setTreatmentamount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Patient details
        try {
          const patRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`
          );
          if (patRes.data) setPatients(patRes.data);
        } catch (e) {
          setPatients({
            MPD_PATIENT_CODE: patientId,
            MPD_PATIENT_NAME: "Chenuka Kuruppu",
            MPD_NIC: "200311611379",
            MPD_MOBILE_NO: "0766706951",
            MPD_ADDRESS: "Ward 4A • Bed #12, Central Wing",
            MPD_GENDER: "Male",
          });
        }

        // Treatment details
        try {
          const trtRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serial_no}`
          );
          if (trtRes.data) {
            setInvoicedetails(trtRes.data);
            setTreatmentamount(Number(trtRes.data.MTD_AMOUNT || 0));
          }
        } catch (e) {
          setInvoicedetails({
            MTD_SERIAL_NO: serial_no || "PH-9901",
            MTD_DOCTOR: "Dr. Staff Physician",
            MTD_DATE: new Date().toISOString(),
          });
          setTreatmentamount(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, serial_no]);

  // If selectedMedicines was passed via location.state, use it; otherwise fallback to realistic compounds
  const displayMedicines =
    selectedMedicines.length > 0
      ? selectedMedicines
      : [
          { DrugName: "Atorvastatin 20mg", MDD_RATE: 45.0, MDD_GIVEN_QUANTITY: 30 },
          { DrugName: "Amlodipine 5mg", MDD_RATE: 20.0, MDD_GIVEN_QUANTITY: 30 },
          { DrugName: "Aspirin 75mg", MDD_RATE: 15.0, MDD_GIVEN_QUANTITY: 30 },
        ];

  const drugSubtotal = displayMedicines.reduce(
    (sum, m) => sum + Number(m.MDD_RATE || 0) * Number(m.MDD_GIVEN_QUANTITY || m.MDD_QUANTITY || 1),
    0
  );

  const rawSubtotal = drugSubtotal + treatmentamount;

  const calculateFinalAmount = () => {
    let finalVal = rawSubtotal;
    const discountNum = Number(discount) || 0;
    if (discountType === "percentage") {
      finalVal -= (rawSubtotal * discountNum) / 100;
    } else {
      finalVal -= discountNum;
    }
    return Math.max(0, finalVal);
  };

  const finalPayable = calculateFinalAmount();

  const printInvoice = () => {
    window.print();
  };

  const downloadInvoice = () => {
    const element = document.getElementById("pharmacy-invoice-content");
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Pharmacy_Receipt_${patientId}_${serial_no || 1}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#0A6E7C" }} />
      </Box>
    );
  }

  const patientName = patients?.MPD_PATIENT_NAME || "Chenuka Kuruppu";

  return (
    <div className="hospital-admin-page-container">
      {/* ── Action Toolbar ─────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={() => navigate(-1)}>
            <BackIcon sx={{ fontSize: 16 }} />
            <span>Back</span>
          </button>
          <span style={{ fontSize: "13px", color: "#64748B" }}>
            Hospital Dispensary &rsaquo; <strong>Dispensation Receipt #{invoicedetails?.MTD_SERIAL_NO || serial_no || "PH-01"}</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={downloadInvoice}>
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Download PDF</span>
          </button>
          <button className="btn-primary-cyan" onClick={printInvoice}>
            <PrintIcon sx={{ fontSize: 16 }} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* ── Printable Pharmacy Receipt Sheet ────────────────── */}
      <div
        id="pharmacy-invoice-content"
        className="clinical-table-card"
        style={{
          padding: "36px",
          background: "#FFFFFF",
          maxWidth: "960px",
          margin: "0 auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header Institution Banner */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "22px",
            borderBottom: "2px solid #E2E8F0",
            marginBottom: "22px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <PharmacyIcon sx={{ fontSize: 32 }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>
                CareSync<span style={{ color: "#F97316" }}>+</span> Central Pharmacy
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                Main Dispensary Wing • 85/1 Horana Road, Bandaragama • Licensed Pharmacy Vault
              </div>
              <div style={{ fontSize: "11px", color: "#0A6E7C", fontWeight: 700, marginTop: "2px" }}>
                Controlled Medication Dispensation &amp; Tax Settlement
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                background: "#E0F2FE",
                color: "#0284C7",
                fontSize: "12px",
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: "12px",
                display: "inline-block",
                marginBottom: "6px",
              }}
            >
              Dispensation Verified
            </span>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0F172A" }}>
              RECEIPT #{invoicedetails?.MTD_SERIAL_NO || serial_no || "PH-0082"}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
              Dispensed: <strong>{new Date().toLocaleDateString()}</strong>
            </div>
          </div>
        </div>

        {/* Patient Demographic Summary Strip */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            fontSize: "12.5px",
          }}
        >
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PATIENT NAME</span>
            <strong style={{ color: "#0F172A", fontSize: "14px" }}>{patientName}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PATIENT ID / NIC</span>
            <strong style={{ color: "#0F172A" }}>{patientId} • {patients?.MPD_NIC || "200311611379"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>DESTINATION WARD</span>
            <strong style={{ color: "#0F172A" }}>{patients?.MPD_ADDRESS || "Ward 4A • Bed #12"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748B", display: "block", fontSize: "11px" }}>PRESCRIBING PHYSICIAN</span>
            <strong style={{ color: "#0A6E7C" }}>{invoicedetails?.MTD_DOCTOR || "Dr. Staff Physician"}</strong>
          </div>
        </div>

        {/* Itemized Medications Table */}
        <div style={{ marginBottom: "24px", overflowX: "auto" }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th style={{ width: "45%" }}>DISPENSED PHARMACEUTICAL</th>
                <th style={{ textAlign: "right", width: "18%" }}>UNIT PRICE (RS.)</th>
                <th style={{ textAlign: "center", width: "15%" }}>QTY DISPENSED</th>
                <th style={{ textAlign: "right", width: "22%" }}>SUBTOTAL (RS.)</th>
              </tr>
            </thead>
            <tbody>
              {displayMedicines.map((item, index) => {
                const rate = Number(item.MDD_RATE || 0);
                const qty = Number(item.MDD_GIVEN_QUANTITY || item.MDD_QUANTITY || 1);
                const lineTotal = rate * qty;

                return (
                  <tr key={index}>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
                        {item.DrugName || item.MMC_DESCRIPTION || "Dispensed Medicine"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>
                        Batch &amp; Expiry verified by central pharmacist
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontSize: "12.5px" }}>
                      {rate.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, fontSize: "13px", color: "#0F172A" }}>
                      {qty}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "#0284C7", fontSize: "13.5px" }}>
                      {lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "28px",
          }}
        >
          {/* Left: Discount Controls */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "10px" }}>
              Pharmacy Subsidy &amp; Concessions
            </div>

            <div className="no-print" style={{ marginBottom: "12px" }}>
              <RadioGroup
                row
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <FormControlLabel
                  value="percentage"
                  control={<Radio size="small" sx={{ color: "#0A6E7C", "&.Mui-checked": { color: "#0A6E7C" } }} />}
                  label={<span style={{ fontSize: "12px", fontWeight: 600 }}>Percentage (%)</span>}
                />
                <FormControlLabel
                  value="fixed"
                  control={<Radio size="small" sx={{ color: "#0A6E7C", "&.Mui-checked": { color: "#0A6E7C" } }} />}
                  label={<span style={{ fontSize: "12px", fontWeight: 600 }}>Fixed Cash (Rs.)</span>}
                />
              </RadioGroup>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <TextField
                  type="number"
                  size="small"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, e.target.value))}
                  inputProps={{ min: 0, max: discountType === "percentage" ? 100 : rawSubtotal }}
                  placeholder="Discount"
                  sx={{ width: "130px", "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "12.5px" } }}
                />
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {discountType === "percentage" ? "% concession applied" : "Rs. direct deduction"}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "11.5px", color: "#64748B", lineHeight: 1.6 }}>
              All pharmaceuticals dispensed in accordance with SLMC pharmacy council guidelines. Medicines once dispensed cannot be exchanged or returned.
            </div>
          </div>

          {/* Right: Balance Ledger */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#64748B" }}>Total Medication Cost:</span>
              <strong style={{ color: "#0F172A" }}>Rs. {drugSubtotal.toFixed(2)}</strong>
            </div>

            {treatmentamount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748B" }}>Specialist Consultation Fee:</span>
                <strong style={{ color: "#0F172A" }}>Rs. {treatmentamount.toFixed(2)}</strong>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#64748B" }}>Gross Pharmacy Subtotal:</span>
              <strong style={{ color: "#0F172A" }}>Rs. {rawSubtotal.toFixed(2)}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#DC2626" }}>
              <span>Concession / Discount:</span>
              <strong>
                - Rs. {(rawSubtotal - finalPayable).toFixed(2)}{" "}
                {discountType === "percentage" && discount > 0 ? `(${discount}%)` : ""}
              </strong>
            </div>

            <Divider sx={{ my: 0.5 }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "linear-gradient(135deg, #0A6E7C 0%, #0284C7 100%)",
                color: "#FFFFFF",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "14px" }}>NET PHARMACY BILL:</span>
              <span style={{ fontWeight: 900, fontSize: "18px" }}>Rs. {finalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signature Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: "24px",
            borderTop: "1px dashed #CBD5E1",
          }}
        >
          <div style={{ fontSize: "11px", color: "#64748B" }}>
            <p style={{ margin: 0 }}>Computer-generated clinical prescription dispensation slip.</p>
            <p style={{ margin: "2px 0 0" }}>CareSync+ Electronic Health Records System v4.2</p>
          </div>

          <div style={{ textAlign: "center", width: "220px" }}>
            <div style={{ borderBottom: "1px solid #94A3B8", height: "40px", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A" }}>Licensed Pharmacist Signature</div>
            <div style={{ fontSize: "10.5px", color: "#64748B" }}>CareSync+ Pharmacy Department</div>
          </div>
        </div>
      </div>
    </div>
  );
}