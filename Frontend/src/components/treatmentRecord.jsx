import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/treatmentRecord.css";

export default function TreatmentRecords() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { patientId } = useParams();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/${patientId}`
        );
        setRecords(response.data);
        setError(null);
      } catch (error) {
        setError("Failed to fetch records. Please try again later.");
        console.error(error);
      }
    };
    fetchRecords();
  }, [patientId]);

  const handleRecordClick = async (record) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/Treatment/patient/record/${patientId}/${record.MTD_SERIAL_NO}`
      );
      setSelectedRecord(response.data);
      setError(null);
    } catch (error) {
      setError("Failed to fetch record details. Please try again later.");
      console.error(error);
    }
  };

  return (
    <div className="treatment-records-container">
      <div className="record-list">
        <h2>Patient Records</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : records.length > 0 ? (
          <ul>
            {records.map((record) => (
              <li
                key={record.MTD_SERIAL_NO}
                className="record-item"
                onClick={() => handleRecordClick(record)}
              >
                <p className="record-date">
                  {new Date(record.MTD_CREATED_DATE).toLocaleDateString()}
                </p>
                <p className="record-number">
                  Treatment Number: {record.MTD_SERIAL_NO}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No records available.</p>
        )}
      </div>
      <div className="record-details">
        {selectedRecord ? (
          <div className="details-content">
            <header className="details-header">
              <h3>Treatment Details</h3>
              <p className="record-date">
                <strong>Date:</strong>{" "}
                {new Date(selectedRecord.MTD_CREATED_DATE).toLocaleDateString()}
              </p>
            </header>
            <section className="general-info">
              <p>
                <strong>Doctor:</strong> {selectedRecord.MTD_DOCTOR}
              </p>
            </section>
            <section className="details-section">
              <p>
                <strong>Complaint:</strong> {selectedRecord.MTD_COMPLAIN}
              </p>
              <p>
                <strong>Diagnostics:</strong> {selectedRecord.MTD_DIAGNOSTICS}
              </p>
              <p>
                <strong>Remarks:</strong> {selectedRecord.MTD_REMARKS}
              </p>
            </section>
            <section className="prescribed-drugs">
              <h4>Prescribed Drugs</h4>
              <ul>
                {selectedRecord.Drugs.map((drug, index) => (
                  <li key={index} className="drug-item">
                    <p>
                      <strong>Drug Name:</strong> {drug.DrugName}
                    </p>
                    <p>
                      <strong>Dosage:</strong> {drug.MDD_DOSAGE}
                    </p>
                    <p>
                      <strong>Duration:</strong> {drug.MDD_DURATION}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : (
          <p>Select a record to view details.</p>
        )}
      </div>
    </div>
  );
}
