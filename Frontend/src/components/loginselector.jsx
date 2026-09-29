import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/loginselector.css'; 
import patientImage from '../assets/patient icon.png';
import doctorImage from '../assets/doctor icon.png';

const LoginSelector = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState(null);

  const handleSelection = (userType) => {
    setSelectedUserType(userType);
  };

  const handleContinue = () => {
    if (selectedUserType === 'doctor') {
      navigate('/login'); // Navigate to doctor login
    } else if (selectedUserType === 'patient') {
      navigate('/patient-login'); // Navigate to patient login
    }
  };

  return (
    <div className="login-selector-container">
        <h1 className="selector-title"><span className="underline">SE</span>LECT USER TYPE</h1>
       
      <div className="login-selector">
    
     
        <div className="button-container">
          <div
            className={`card ${selectedUserType === 'patient' ? 'selected' : ''}`}
            onClick={() => handleSelection('patient')}
          >
            <img src={patientImage} alt="Patient"  />
            <p className="card-text"style={{fontSize:"25px"}}>Patient</p>
          </div>
          <div
            className={`card ${selectedUserType === 'doctor' ? 'selected' : ''}`}
            onClick={() => handleSelection('doctor')}
          >
            <img src={doctorImage} alt="Doctor" />
            <p className="card-text" style={{color:"",  fontSize:"25px"}}>Healthcare providers</p>
          </div>
        </div>
        <div className="actions">
         
          <button
            className="continue-button"
            disabled={!selectedUserType}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;
