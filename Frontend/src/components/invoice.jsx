// CareSync+ Institutional Clinical Invoice & Inpatient Billing
import React, { useEffect, useState } from "react";
import LogoOriginal from "../assets/Logo_Original.png";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Avatar,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  LocalHospital,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
  ReceiptLong as InvoiceIcon,
} from "@mui/icons-material";
import html2pdf from "html2pdf.js";

export default function Invoice() {
  const { patientId, serial_no } = useParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState(null);
  const [invoicedetails, setInvoicedetails] = useState(null);
  const [treatmentamount, setTreatmentamount] = useState(3500);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Treatment record
        try {
          const recRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${serial_no}`
          );
          if (recRes.data) {
            setInvoicedetails(recRes.data);
            setTreatmentamount(Number(recRes.data.MTD_AMOUNT || 3500));
          }
        } catch (e) {
          // Demo fallback
          setInvoicedetails({
            MTD_SERIAL_NO: serial_no || "INV-8821",
            MTD_DATE: new Date().toISOString(),
            MTD_DOCTOR: "Dr. Test (Cardiology Unit)",
            MTD_CHANNEL_NO: "04",
            MTD_AMOUNT: 3500.0,
            Drugs: [
              { DrugName: "Atorvastatin 20mg", MDD_RATE: 45.0, MDD_QUANTITY: 30, MDD_AMOUNT: 1350.0 },
              { DrugName: "Amlodipine 5mg", MDD_RATE: 20.0, MDD_QUANTITY: 30, MDD_AMOUNT: 600.0 },
              { DrugName: "Aspirin 75mg", MDD_RATE: 15.0, MDD_QUANTITY: 30, MDD_AMOUNT: 450.0 },
            ],
          });
          setTreatmentamount(3500.0);
        }

        // Patient details
        try {
          const patRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Patient/${patientId}`
          );
          if (patRes.data) {
            setPatients(patRes.data);
          }
        } catch (e) {
          setPatients({
            MPD_PATIENT_CODE: patientId,
            MPD_PATIENT_NAME: "Chenuka Kuruppu",
            MPD_NIC: "200311611379",
            MPD_MOBILE_NO: "0766706951",
            MPD_ADDRESS: "Ward 4A • Bed #12, Central Wing",
            MPD_GENDER: "Male",
            age: 23,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, serial_no]);

  const drugsList = invoicedetails?.Drugs || [
    { DrugName: "Atorvastatin 20mg", MDD_RATE: 45.0, MDD_QUANTITY: 30, MDD_AMOUNT: 1350.0 },
    { DrugName: "Amlodipine 5mg", MDD_RATE: 20.0, MDD_QUANTITY: 30, MDD_AMOUNT: 600.0 },
    { DrugName: "Aspirin 75mg", MDD_RATE: 15.0, MDD_QUANTITY: 30, MDD_AMOUNT: 450.0 },
  ];

  const calculateSubtotal = () => {
    return drugsList.reduce((sum, d) => sum + (Number(d.MDD_AMOUNT) || (Number(d.MDD_RATE || 0) * Number(d.MDD_QUANTITY || 0))), 0);
  };

  const drugSubtotal = calculateSubtotal();
  const rawSubtotal = drugSubtotal + Number(treatmentamount || 0);

  const calculateTotalAmount = () => {
    let finalVal = rawSubtotal;
    const discountNum = Number(discount) || 0;
    if (discountType === "percentage") {
      finalVal -= (rawSubtotal * discountNum) / 100;
    } else {
      finalVal -= discountNum;
    }
    return Math.max(0, finalVal);
  };

  const finalPayable = calculateTotalAmount();

  const printInvoice = () => {
    window.print();
  };

  const downloadInvoice = () => {
    const element = document.getElementById("invoice-content");
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `CareSync_Invoice_${patientId}_${serial_no || 1}.pdf`,
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
  const doctorName = invoicedetails?.MTD_DOCTOR || "Dr. Staff Physician";

  return (
    <div className="hospital-admin-page-container">
      {/* ── Action & Navigation Toolbar (Hidden on Print) ───── */}
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
            Inpatient Billing &rsaquo; <strong>Tax Invoice #{invoicedetails?.MTD_SERIAL_NO || serial_no || "104"}</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary-white" onClick={downloadInvoice}>
            <DownloadIcon sx={{ fontSize: 16 }} />
            <span>Download PDF</span>
          </button>
          <button className="btn-primary-cyan" onClick={printInvoice}>
            <PrintIcon sx={{ fontSize: 16 }} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Master Printable Invoice Sheet ─────────────────── */}
      <div
        id="invoice-content"
        style={{
          padding: "40px",
          background: "#FFFFFF",
          maxWidth: "800px",
          margin: "0 auto",
          color: "#000000",
          fontFamily: "Arial, sans-serif",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={LogoOriginal} alt="CareSync Logo" style={{ height: "50px", objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "1px" }}>
            INVOICE
          </div>
        </div>

        <div style={{ borderBottom: "2px solid #000", marginBottom: "20px" }}></div>

        {/* Invoice Number & Date (Black Box) */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "30px" }}>
          <div style={{ background: "#000", color: "#FFF", padding: "15px 25px", fontSize: "14px", fontWeight: 600 }}>
            <div style={{ marginBottom: "5px" }}>Invoice Number: {invoicedetails?.MTD_SERIAL_NO || serial_no || "INV-0042"}</div>
            <div>Date: {new Date().toLocaleDateString("en-GB")}</div>
          </div>
        </div>

        {/* FROM and TO */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", fontSize: "14px", lineHeight: 1.6 }}>
          <div style={{ width: "45%" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "8px" }}>FROM:</div>
            <div><strong>From:</strong> CareSync+ Hospital</div>
            <div>85/1, Horana Road, Bandaragama</div>
            <div><strong>Phone:</strong> +94 11 234 5678</div>
            <div><strong>Email:</strong> contact@medicare.lk</div>
          </div>
          <div style={{ width: "45%" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "8px" }}>TO:</div>
            <div><strong>To:</strong> {patientName}</div>
            <div><strong>NIC / ID:</strong> {patientId} • {patients?.MPD_NIC || "200311611379"}</div>
            <div><strong>Location:</strong> {patients?.MPD_ADDRESS || "Ward 4A • Bed #12"}</div>
            <div><strong>Attending:</strong> {doctorName}</div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid #CCC", marginBottom: "20px" }}></div>

        <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "15px" }}>
          Description of Medical Services:
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#000", color: "#FFF" }}>
              <th style={{ padding: "10px", textAlign: "center", width: "5%" }}>No</th>
              <th style={{ padding: "10px", textAlign: "left", width: "45%" }}>Service / Medication Description</th>
              <th style={{ padding: "10px", textAlign: "center", width: "15%" }}>Qty</th>
              <th style={{ padding: "10px", textAlign: "right", width: "15%" }}>Rate</th>
              <th style={{ padding: "10px", textAlign: "right", width: "20%" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {drugsList.map((item, index) => {
              const rate = Number(item.MDD_RATE || 0);
              const qty = Number(item.MDD_QUANTITY || 1);
              const lineTotal = Number(item.MDD_AMOUNT || rate * qty);
              return (
                <tr key={index} style={{ borderBottom: "1px solid #EEE" }}>
                  <td style={{ padding: "10px", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ padding: "10px", textAlign: "left" }}>{item.DrugName || item.MMC_DESCRIPTION || "Prescribed Medicine"}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{qty}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>Rs. {rate.toFixed(2)}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>Rs. {lineTotal.toFixed(2)}</td>
                </tr>
              );
            })}
            {Number(treatmentamount) > 0 && (
              <tr style={{ borderBottom: "1px solid #EEE" }}>
                <td style={{ padding: "10px", textAlign: "center" }}>{drugsList.length + 1}</td>
                <td style={{ padding: "10px", textAlign: "left" }}>Specialist Consultation Fee</td>
                <td style={{ padding: "10px", textAlign: "center" }}>1</td>
                <td style={{ padding: "10px", textAlign: "right" }}>Rs. {Number(treatmentamount).toFixed(2)}</td>
                <td style={{ padding: "10px", textAlign: "right" }}>Rs. {Number(treatmentamount).toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "30px", fontSize: "14px" }}>
          <div style={{ width: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontWeight: 800 }}>Sub Total:</span>
              <span>Rs. {rawSubtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontWeight: 800 }}>Discount:</span>
                <span>Rs. {(rawSubtotal - finalPayable).toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderBottom: "2px solid #000", marginBottom: "10px" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 800, fontSize: "16px" }}>Total:</span>
              <span style={{ fontWeight: 800, fontSize: "16px" }}>Rs. {finalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid #CCC", marginBottom: "20px" }}></div>

        <div style={{ fontSize: "14px", marginBottom: "20px" }}>
          Thank you for using our medical consultation services. Please make payment within 15 days.
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ background: "#000", color: "#FFF", padding: "15px 20px", fontSize: "13px", lineHeight: 1.6 }}>
            <div><strong>Payment Method:</strong> Bank Transfer</div>
            <div><strong>Account:</strong> 123-456-789 (CareSync Health)</div>
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.6, textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
               <span>&#9742;</span>
               <span>+94 11 234 5678</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
               <span>&#127760;</span>
               <span>www.caresynchospital.lk</span>
            </div>
          </div>
        </div>

        {/* Admin Controls (Hidden from print) */}
        <div className="no-print" style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #CCC" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "10px" }}>
            Hospital Subsidy &amp; Discounts
          </div>
          <div style={{ marginBottom: "12px" }}>
            <RadioGroup
              row
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <FormControlLabel
                value="percentage"
                control={<Radio size="small" sx={{ color: "#000", "&.Mui-checked": { color: "#000" } }} />}
                label={<span style={{ fontSize: "12px", fontWeight: 600 }}>Percentage (%)</span>}
              />
              <FormControlLabel
                value="fixed"
                control={<Radio size="small" sx={{ color: "#000", "&.Mui-checked": { color: "#000" } }} />}
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
                placeholder="Discount value"
                sx={{ width: "140px", "& .MuiOutlinedInput-root": { borderRadius: "4px", fontSize: "12.5px" } }}
              />
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {discountType === "percentage" ? "% of subtotal deducted" : "Rs. direct concession"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}