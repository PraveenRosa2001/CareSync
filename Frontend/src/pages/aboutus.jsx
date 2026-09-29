import React from 'react';
import '../styles/Aboutus.css';
import image from '../assets/hospital_background.jpg'
import Navbar from '../components/navbar';
import { useNavigate } from 'react-router-dom';
// Import the CSS file

export default function Aboutus() {

 
  return (
    <div className="aboutus-container">
        <Navbar/>
        <br></br>
      <div className="container1">
        <h1>Welcome to MediLink Hospital</h1>
        <p>
          Medihelp Hospitals stands as a prominent healthcare provider in Sri Lanka, recognized for its excellence.
          With a history spanning over four decades, we have significantly expanded our network of medical facilities.
          Our services now encompass inpatient and outpatient care, laboratories and sample collection centers, pharmacies,
          and medical imaging units.
        </p>
        
      </div>

      <div className="introduction">
        <div className="left-container">
          <h2>About Us</h2>
          <p>
          At Medilink, we are driven by a profound commitment to enhancing the health and well-being of our community. Our mission extends beyond merely providing medical services; we aim to create a holistic approach to healthcare that addresses both physical and emotional needs. By integrating advanced medical technology with compassionate patient care, we strive to offer personalized and effective treatments tailored to each individual's unique health profile. Our team of dedicated professionals is committed to maintaining the highest standards of medical excellence while fostering a supportive and empathetic environment. We continuously invest in the latest research and innovations to stay at the forefront of medical science, ensuring that our patients benefit from the most cutting-edge therapies available. Our patient-centric philosophy is rooted in respect, integrity, and the unwavering belief that every person deserves access to exceptional healthcare. Through collaborative efforts with local organizations and ongoing community engagement, we work tirelessly to improve public health and promote wellness across all demographics. Our ultimate goal is to build lasting relationships with our patients, based on trust and mutual respect, and to make a meaningful difference in their lives by delivering care that exceeds expectations and nurtures their overall well-being.
          </p>
        </div>

        <div className="right-container">
          <img src={image}alt="Hospital" />
        </div>
      </div>
    </div>
    
  );
}
