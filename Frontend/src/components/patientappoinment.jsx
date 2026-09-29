// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../styles/patientappoinment.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Corrected import
// import { faUserMd } from "@fortawesome/free-solid-svg-icons"; // Corrected import

// export default function PatientAppointment({ onClose }) {
//   const [query, setQuery] = useState("");
//   const [userid, setUserid] = useState(""); //adding state for the user id
//   const [suggestions, setSuggestions] = useState([]);
//   const [selectedDoctor, setSelectedDoctor] = useState("");
//   const [selecteduserid, setSelectedUserid] = useState("");
//   const [doctor, setDoctor] = useState("");
//   const [specialization, setSpecialization] = useState("OPD");
//   const [currentScreen, setCurrentScreen] = useState(0);
//   const [appointmentDetails, setAppointmentDetails] = useState([]);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [MAD_FULL_NAME, setFullName] = useState("");
//   const [MAD_CONTACT, setContact] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [errormeassage, setErrormessage] = useState("");
//   const patientid = localStorage.getItem("PatientCode");

//   useEffect(() => {
//     // Check if the user is already logged in by checking localStorage
//     const isLoggedIn = localStorage.getItem("isLoggedIn");
//     if (isLoggedIn) {
//       setCurrentScreen(1); // Skip the login screen if logged in
//     }
//   }, []);

//   const name = localStorage.getItem("Name");
//   const contact = localStorage.getItem("Contact");

//   const handleLogin = async () => {
//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/Login`,
//         {
//           email: email,
//           password: password,
//         }
//       );

//       console.log(response.data);
//       alert("Login successful");

//       // Store login status in localStorage
//       localStorage.setItem("isLoggedIn", true);

//       // Proceed to the next screen
//       setCurrentScreen(1);
//     } catch (error) {
//       console.error(error);
//       alert("Login failed. Please try again.");
//     }
//   };

//   // const handleSearch = async (e) => {
//   //   const searchValue = e.target.value;
//   //   setQuery(searchValue);

//   //   if (searchValue.length > 2) {
//   //     try {
//   //       const response = await axios.get(
//   //         `${process.env.REACT_APP_API_BASE_URL}/User/suggest?query=${searchValue}`
//   //       );
//   //       setSuggestions(response.data);
//   //     } catch (error) {
//   //       console.error("Error fetching suggestions:", error);
//   //       setSuggestions([]);
//   //     }
//   //   } else {
//   //     setSuggestions([]);
//   //   }
//   // };
//   const handleSearch = async (e) => {
//     const searchValue = e.target.value;
//     setQuery(searchValue);

//     if (searchValue.length > 2) {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_BASE_URL}/User/suggest/doctor?query=${searchValue}`
//         );
//         setSuggestions(response.data); // Assuming response is an array of objects with UserName property
//       } catch (error) {
//         console.error("Error fetching suggestions:", error);
//         setSuggestions([]);
//       }
//     } else {
//       setSuggestions([]);
//     }
//   };

//   useEffect(() => {
//     //fetch appoinment based on the doctor
//     const fetchAppointments = async () => {
//       if (userid) {
//         try {
//           const response = await axios.get(
//             `${process.env.REACT_APP_API_BASE_URL}/Timeslot/Doctorid/${userid}`
//           );
//           setAppointmentDetails(response.data);
//         } catch (error) {
//           console.error("Error fetching appointments:", error);
//           setAppointmentDetails([]);
//         }
//       }
//     };

//     fetchAppointments();
//   }, [userid]);

//   const handleSuggestionClick = (doctorName, userId) => {
//     setSelectedDoctor(doctorName);
//     setSelectedUserid(userId);
//     setQuery(doctorName);
//     setSuggestions([]);
//   };
//   const handleConfirm = async () => {
//     try {
//       await submitAppointment();
//       await handleUpdate();
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const handleSearchClick = async () => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_API_BASE_URL}/User/doctorid/specialization`,
//         {
//           params: {
//             userId: selecteduserid,
//             specialization: specialization,
//           },
//         }
//       );

//       if (response.data.length > 0) {
//         setDoctor(response.data); // Assuming `response.data` is an array of doctor names
//         setSelectedDoctor(response.data[0].MUD_USER_NAME); // Set the first doctor from the result as the selected doctor
//         // console.log(selectedDoctor);
//         setUserid(response.data.MUD_USER_ID);
//         console.log(userid);
//         setCurrentScreen(2); // Move to the second screen
//         setErrormessage(null);
//       } else {
//         setDoctor([]); // No doctors found
//       }
//     } catch (error) {
//       if (error.response && error.response.data) {
//         console.error("Error:", error.response.data);
//         setErrormessage(error.response.data);
//       } else {
//         console.error("Error:", error.message);
//       }
//     }
//   };

//   const handleBackClick = () => {
//     setCurrentScreen((prevScreen) => (prevScreen > 0 ? prevScreen - 1 : 0));
//   };

//   const handleChannelClick = (selectedDoc) => {
//     setSelectedDoctor(selectedDoc.MUD_USER_NAME); // Set the selected doctor's name
//     setUserid(selectedDoc.MUD_USER_ID); // Set the selected doctor's user ID
//     console.log(
//       `Selected Doctor: ${selectedDoc.MUD_USER_NAME}, ID: ${selectedDoc.MUD_USER_ID}`
//     );
//     setCurrentScreen(3); // Navigate to screen 3
//   };

//   const handleBookNowClick = (appointment) => {
//     setSelectedAppointment(appointment);
//     setCurrentScreen(4);
//   };

//   const handleUpdate = async () => {
//     try {
//       await axios.patch(
//         `${process.env.REACT_APP_API_BASE_URL}/Timeslot/${selectedAppointment.MT_SLOT_ID}/incrementSeat`
//       );
//     } catch (error) {
//       console.error(
//         "Failed to update time slot",
//         error.response?.data || error.message
//       );
//     }
//   };

//   const email1 = localStorage.getItem("Email");
//   const PatientCode = localStorage.getItem("PatientCode");
//   console.log("PatientCode from localStorage:", PatientCode);

//   const submitAppointment = async () => {
//     try {
//       // Check if email is retrieved correctly
//       if (!email1) {
//         alert("Email not found. Please log in again.");
//         return;
//       }

//       // Validate the selectedAppointment fields before proceeding
//       if (!selectedAppointment) {
//         alert("No appointment selected. Please choose a time slot.");
//         return;
//       }

//       const appointmentData = {
//         MAD_FULL_NAME: name, // Make sure MAD_FULL_NAME and MAD_CONTACT are defined in the component
//         MAD_CONTACT: contact,
//         MAD_PATIENT_NO: selectedAppointment.MT_PATIENT_NO + 1,
//         MAD_APPOINMENT_DATE: selectedAppointment.MT_SLOT_DATE,
//         MAD_START_TIME: selectedAppointment.MT_START_TIME,
//         MAD_END_TIME: selectedAppointment.MT_END_TIME,
//         MAD_DOCTOR: selectedAppointment.MT_DOCTOR,
//         MAD_ALLOCATED_TIME: selectedAppointment.MT_ALLOCATED_TIME,
//         MAD_EMAIL: "", // Use retrieved email from localStorage
//         MAD_PATIENT_CODE: PatientCode,
//         MAD_SLOT_ID: selectedAppointment.MT_SLOT_ID,
//         MAD_USER_ID: selectedAppointment.MT_USER_ID,
//       };

//       // Post the appointment data
//       await axios.post(
//         `${process.env.REACT_APP_API_BASE_URL}/Appointment`,
//         appointmentData
//       );

//       // alert("Appointment submitted successfully");
//       setCurrentScreen(5); // Navigate to the desired screen after successful submission
//     } catch (error) {
//       console.error("Error booking appointment:", error);
//       alert("Failed to submit the appointment. Please try again.");
//     }
//   };

//   return (
//     <div className="appoinment-screen-container">
//       <div className="mobile-frame">
//         <div
//           className={`screen login-screen ${
//             currentScreen === 0 ? "active" : ""
//           }`}
//         >
//           <h1>Login</h1>
//           <label>Email</label>
//           <input
//             type="text"
//             placeholder="please enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <label>Password</label>
//           <input
//             type="password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//           <button onClick={handleLogin}>Login</button>
//           <p>
//             Don't have an account? <a href="/register-user">Create One</a>
//           </p>
//         </div>
//         {/* <div className={`screen1 ${currentScreen === 1 ? 'active' : ''}`}>
//           <h1>Find a doctor and book an appointment</h1>
//           <label>Doctor name</label>
//           <input
//             type="search"
//             placeholder="Enter doctor name"
//             value={query}
//             onChange={handleSearch}
//           />
//           {suggestions.length > 0 && (
//             <ul className="doctor-suggestions">
//               {suggestions.map((doctorName, index) => (
//                 <li key={index} onClick={() => handleSuggestionClick(doctorName)}>
//                   {doctorName}
//                 </li>
//               ))}
//             </ul>
//           )}
//           <label>Specialization</label>
//           <select
//             value={specialization}
//             onChange={(e) => setSpecialization(e.target.value)}
//           >
//             <option value="no">search based on specialization</option>
//             <option value="psychiatrist">Psychiatrist</option>
//             <option value="Dentist">Dentist</option>
//             <option value="cardiologist">Cardiologist</option>
//             <option value="gynecologist">Gynecologist</option>
//             <option value="pediatrician">Pediatrician</option>
//             <option value="immunologist">Immunologist</option>
//             <option value="general_practitioner">General Practitioner</option>
//           </select>
//           <p>Search doctor using name or specialization</p>
//           <button className="btn-search-appointment" onClick={handleSearchClick}>Search</button>

//           {errormeassage && (
//             <div className="error-message">
//               {errormeassage}
//             </div>
//           )}
//         </div> */}

//         {/*modal 1 When patient clciked Book Appointment it popup this modal */}

//         <div className={`screen1 ${currentScreen === 1 ? "active" : ""}`}>
//           <h1>Find a doctor and book an appointment</h1>
//           <label>Doctor name</label>
//           <input
//             type="search"
//             placeholder="Enter doctor name"
//             value={query}
//             onChange={handleSearch}
//           />
//           {suggestions.length > 0 && (
//             <ul className="doctor-suggestions">
//               {suggestions.map((doctor, index) => (
//                 <li
//                   key={index}
//                   onClick={() =>
//                     handleSuggestionClick(doctor.UserName, doctor.UserId)
//                   }
//                 >
//                   {doctor.UserName}
//                 </li>
//               ))}
//             </ul>
//           )}
//           <label>Specialization</label>
//           <select
//             value={specialization}
//             onChange={(e) => setSpecialization(e.target.value)}
//           >
//             <option value="no">Search based on specialization</option>
//             <option value="psychiatrist">Psychiatrist</option>
//             <option value="Dentist">Dentist</option>
//             <option value="cardiologist">Cardiologist</option>
//             <option value="gynecologist">Gynecologist</option>
//             <option value="pediatrician">Pediatrician</option>
//             <option value="immunologist">Immunologist</option>
//             <option value="general_practitioner">General Practitioner</option>
//           </select>
//           <p>Search doctor using name or specialization</p>
//           <button
//             className="btn-search-appointment"
//             onClick={handleSearchClick}
//           >
//             Search
//           </button>

//           {/* Display the error message if there is one */}
//           {errormeassage && (
//             <div className="error-message">{errormeassage}</div>
//           )}
//         </div>

//         {/*modal 2 Doctor filtering section, after clicked Noo an appointment it opens this modal */}
//         <div className={`screen2 ${currentScreen === 2 ? "active" : ""}`}>
//           <button onClick={handleBackClick}>Back</button>
//           {doctor.length > 0 ? (
//             <ul className="doctor-list">
//               {doctor.map((doc, index) => (
//                 <li key={index} className="doctor-item">
//                   <div className="doctor-details">
//                     <span>{doc.MUD_USER_NAME}</span>
//                     <p>{doc.MUD_SPECIALIZATION}</p>
//                   </div>
//                   <span
//                     className="channel-icon"
//                     onClick={() => handleChannelClick(doc)}
//                     style={{ cursor: "pointer" }}
//                   >
//                     <FontAwesomeIcon icon={faUserMd} />
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p>No doctors available.</p>
//           )}
//         </div>

//           {/*modal 3 After the selecting the doctor it opens this modal */}
//         <div className={`screen3 ${currentScreen === 3 ? "active" : ""}`}>
//           <button onClick={handleBackClick} className="back-button">
//             Back
//           </button>
//           <div>
//             {appointmentDetails.length > 0 ? (
//               <ul className="appoinments-lists">
//                 {appointmentDetails.map((appointment, index) => {
//                   const appointmentDate = new Date(appointment.MT_SLOT_DATE);
//                   const formattedDate = appointmentDate.toLocaleDateString();
//                   const startTime = new Date(
//                     `1970-01-01T${appointment.MT_START_TIME}`
//                   ).toLocaleTimeString("en-LK", {
//                     timeZone: "Asia/Colombo",
//                     hour: "numeric",
//                     minute: "numeric",
//                     hour12: true,
//                   });
//                   const endTime = new Date(
//                     `1970-01-01T${appointment.MT_END_TIME}`
//                   ).toLocaleTimeString("en-LK", {
//                     timeZone: "Asia/Colombo",
//                     hour: "numeric",
//                     minute: "numeric",
//                     hour12: true,
//                   });

//                   // Convert the end time into a Date object for comparison
//                   const endDate = new Date(`${formattedDate} ${endTime}`);
//                   const currentTime = new Date();

//                   // Check if the appointment date and time has passed
//                   const isPastDate =
//                     appointmentDate < new Date().setHours(0, 0, 0, 0);
//                   const isBookingClosed = currentTime > endDate; // Check if current time exceeds the end time

//                   return (
//                     <li key={index}>
//                       <p>
//                         Appointment Date:{" "}
//                         {appointment.MT_SLOT_DATE.split("T")[0]}
//                       </p>
//                       <p>
//                         Time Duration: {startTime} - {endTime}
//                       </p>
//                       {isPastDate ? (
//                         <p style={{ color: "red" }}>
//                           Sorry, the appointment time has passed.
//                         </p>
//                       ) : isBookingClosed ? (
//                         <p style={{ color: "red" }}>
//                           Bookings are closed for this appointment.
//                         </p>
//                       ) : appointment.MT_PATIENT_NO >=
//                         appointment.MT_MAXIMUM_PATIENTS ? (
//                         <p style={{ color: "red" }}>Bookings are filled</p>
//                       ) : (
//                         <button onClick={() => handleBookNowClick(appointment)}>
//                           Book Now
//                         </button>
//                       )}
//                     </li>
//                   );
//                 })}
//               </ul>
//             ) : (
//               <p>No appointments available.</p>
//             )}
//           </div>
//         </div>

//         {/* modal 4: Appointment Confirmation */}
//         <div className={`screen4 ${currentScreen === 4 ? "active" : ""}`}>
//           {selectedAppointment && (
//             <div className="appointment-card">
//               <h2>Appointment details</h2>

//               <div className="appointment-details">
//                 <p>
//                   <strong>Name:</strong> {name}
//                 </p>
//                 <p>
//                   <strong>Patient Number:</strong>{" "}
//                   {selectedAppointment.MT_PATIENT_NO + 1}
//                 </p>
//                 <p>
//                   <strong>Time:</strong>{" "}
//                   {new Date(
//                     `1970-01-01T${selectedAppointment.MT_ALLOCATED_TIME}`
//                   ).toLocaleTimeString("en-LK", {
//                     timeZone: "Asia/Colombo",
//                     hour: "numeric",
//                     minute: "numeric",
//                     hour12: true,
//                   })}
//                 </p>
//                 <p>
//                   <strong>Appointment Date:</strong>{" "}
//                   {selectedAppointment.MT_SLOT_DATE.split("T")[0]}
//                 </p>
//                 <p>
//                   <strong>Doctor Available Time:</strong>{" "}
//                   {new Date(
//                     `1970-01-01T${selectedAppointment.MT_START_TIME}`
//                   ).toLocaleTimeString("en-LK", {
//                     timeZone: "Asia/Colombo",
//                     hour: "numeric",
//                     minute: "numeric",
//                     hour12: true,
//                   })}{" "}
//                   -{" "}
//                   {new Date(
//                     `1970-01-01T${selectedAppointment.MT_END_TIME}`
//                   ).toLocaleTimeString("en-LK", {
//                     timeZone: "Asia/Colombo",
//                     hour: "numeric",
//                     minute: "numeric",
//                     hour12: true,
//                   })}
//                 </p>
//               </div>

//               <div className="button-group">
//                 <button className="btn-confirm" onClick={handleConfirm}>
//                   confirm
//                 </button>
//                 <button className="btn-back" onClick={handleBackClick}>
//                   Back
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Screen 5: Confirmation Message */}
//         <div className={`screen5 ${currentScreen === 5 ? "active" : ""}`}>
//           <h1>Thank you for your booking!</h1>
//           <p>Your appointment has been successfully booked.</p>

//           {/* <button onClick={handleBackClick} >Back</button> */}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserMd,
  faArrowLeft,
  faSearch,
  faCalendarAlt,
  faClock,
  faUser,
  faIdBadge,
} from "@fortawesome/free-solid-svg-icons";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  Badge,
  Container,
  CardHeader,
  CardActionArea,
  CardMedia,
  CardActions,
  Fade,
  Grow,
  Zoom,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { green, blue, red, orange, purple } from "@mui/material/colors";
import { motion } from "framer-motion";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: 16,
  boxShadow: theme.shadows[4],
  overflow: "hidden",
  backgroundColor: theme.palette.background.paper,
}));

const DoctorCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows[8],
  },
}));

const BookButton = styled(Button)(({ theme }) => ({
  backgroundColor: green[600],
  color: "white",
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  borderRadius: 8,
  "&:hover": {
    backgroundColor: green[800],
    boxShadow: theme.shadows[4],
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 8,
  padding: theme.spacing(1, 2),
}));

const SpecializationChip = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: purple[100],
  color: purple[800],
  fontWeight: 500,
}));

const steps = ["Login", "Find Doctor", "Select Time", "Confirm"];

export default function PatientAppointment({ onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [query, setQuery] = useState("");
  const [userid, setUserid] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selecteduserid, setSelectedUserid] = useState("");
  const [doctor, setDoctor] = useState("");
  const [specialization, setSpecialization] = useState("OPD");
  const [currentScreen, setCurrentScreen] = useState(0);
  const [appointmentDetails, setAppointmentDetails] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [MAD_FULL_NAME, setFullName] = useState("");
  const [MAD_CONTACT, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errormeassage, setErrormessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const patientid = localStorage.getItem("PatientCode");
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      setCurrentScreen(1);
      setActiveStep(1);
    }
  }, []);

  const name = localStorage.getItem("Name");
  const contact = localStorage.getItem("Contact");

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/Login`,
        {
          email: email,
          password: password,
        }
      );

      localStorage.setItem("isLoggedIn", true);
      setCurrentScreen(1);
      setActiveStep(1);
      setOpenSuccess(true);
    } catch (error) {
      console.error(error);
      setErrormessage(
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const searchValue = e.target.value;
    setQuery(searchValue);

    if (searchValue.length > 2) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/User/suggest/doctor?query=${searchValue}`
        );
        setSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (userid) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/Timeslot/Doctorid/${userid}`
          );
          setAppointmentDetails(response.data);
        } catch (error) {
          console.error("Error fetching appointments:", error);
          setAppointmentDetails([]);
        }
      }
    };

    fetchAppointments();
  }, [userid]);

  // const handleSuggestionClick = (doctorName, userId) => {
  //   setSelectedDoctor(doctorName);
  //   setSelectedUserid(userId);
  //   setQuery(doctorName);
  //   setSuggestions([]);
  // };
  const handleSuggestionClick = (doctorName, userId) => {
    setSelectedDoctor(doctorName);
    setSelectedUserid(userId);
    setQuery(doctorName);
    setSuggestions([]);
  };
  const handleConfirm = async () => {
    try {
      await submitAppointment();
      await handleUpdate();
      setActiveStep(3);
    } catch (error) {
      console.error(error);
    }
  };

  // const handleSearchClick = async () => {
  //   try {
  //     const response = await axios.get(
  //       `${process.env.REACT_APP_API_BASE_URL}/User/doctorid/specialization`,
  //       {
  //         params: {
  //           userId: selecteduserid,
  //           specialization: specialization,
  //         },
  //       }
  //     );

  //     if (response.data.length > 0) {
  //       setDoctor(response.data);
  //       setSelectedDoctor(response.data[0].MUD_USER_NAME);
  //       setUserid(response.data.MUD_USER_ID);
  //       setCurrentScreen(2);
  //       setActiveStep(2);
  //       setErrormessage(null);
  //     } else {
  //       setDoctor([]);
  //       setErrormessage("No doctors found with the selected criteria.");
  //     }
  //   } catch (error) {
  //     if (error.response && error.response.data) {
  //       console.error("Error:", error.response.data);
  //       setErrormessage(error.response.data.message || "An error occurred");
  //     } else {
  //       console.error("Error:", error.message);
  //       setErrormessage("Failed to search. Please try again.");
  //     }
  //   }
  // };


  //MOdify this function, patient search the docotrs by using name it directly navigate to avaiable timeslots screen and filter by specialization then it goes avaible docotos avaible time slots
  const handleSearchClick = async () => {
    try {
      if (query && selecteduserid) {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/Timeslot/Doctorid/${selecteduserid}`
        );
        setAppointmentDetails(response.data);
        setCurrentScreen(3);
        setActiveStep(2);
      } else if (specialization && specialization !== "OPD") {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/User/doctorid/specialization`,
          {
            params: {
              specialization: specialization,
            },
          }
        );

        if (response.data.length > 0) {
          setDoctor(response.data);
          setCurrentScreen(2);
          setActiveStep(2);
        } else {
          setDoctor([]);
          setErrormessage("No doctors found with the selected criteria.");
        }
      } else {
        setErrormessage("Please select a doctor or specialization");
      }
    } catch (error) {
      console.error("Search error:", error);
      setErrormessage("Failed to search. Please try again.");
    }
  };

  // const handleBackClick = () => {
  //   if (currentScreen > 0) {
  //     setCurrentScreen(currentScreen - 1);
  //     setActiveStep(activeStep - 1);
  //   }
  // };

  //MOdify this back function, patient search the docotrs by using name it directly navigate to avaiable timeslots screen and filter by specialization then it goes avaible docotos avaible time slots
  const handleBackClick = () => {
    if (currentScreen === 3) {
      if (query && selecteduserid) {
        setCurrentScreen(1);
        setActiveStep(1);
      } else {
        setCurrentScreen(2);
        setActiveStep(2);
      }
    } else if (currentScreen === 2) {
      setCurrentScreen(1);
      setActiveStep(1);
    } else if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
      setActiveStep(activeStep - 1);
    }
  };

  const handleChannelClick = (selectedDoc) => {
    setSelectedDoctor(selectedDoc.MUD_USER_NAME);
    setUserid(selectedDoc.MUD_USER_ID);
    setCurrentScreen(3);
    setActiveStep(2);
  };

  const handleBookNowClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentScreen(4);
  };

  const handleUpdate = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/Timeslot/${selectedAppointment.MT_SLOT_ID}/incrementSeat`
      );
    } catch (error) {
      console.error(
        "Failed to update time slot",
        error.response?.data || error.message
      );
    }
  };

  const email1 = localStorage.getItem("Email");
  const PatientCode = localStorage.getItem("PatientCode");

  const submitAppointment = async () => {
    try {
      if (!email1) {
        setErrormessage("Session expired. Please log in again.");
        return;
      }

      if (!selectedAppointment) {
        setErrormessage("No appointment selected. Please choose a time slot.");
        return;
      }

      const appointmentData = {
        MAD_FULL_NAME: name,
        MAD_CONTACT: contact,
        MAD_PATIENT_NO: selectedAppointment.MT_PATIENT_NO + 1,
        MAD_APPOINMENT_DATE: selectedAppointment.MT_SLOT_DATE,
        MAD_START_TIME: selectedAppointment.MT_START_TIME,
        MAD_END_TIME: selectedAppointment.MT_END_TIME,
        MAD_DOCTOR: selectedAppointment.MT_DOCTOR,
        MAD_ALLOCATED_TIME: selectedAppointment.MT_ALLOCATED_TIME,
        MAD_EMAIL: "",
        MAD_PATIENT_CODE: PatientCode,
        MAD_SLOT_ID: selectedAppointment.MT_SLOT_ID,
        MAD_USER_ID: selectedAppointment.MT_USER_ID,
      };

      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/Appointment`,
        appointmentData
      );

      setCurrentScreen(5);
    } catch (error) {
      console.error("Error booking appointment:", error);
      setErrormessage("Failed to submit the appointment. Please try again.");
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSuccess(false);
    setErrormessage("");
  };

  const renderScreen0 = () => (
    <Fade in={true} timeout={500}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                color="primary"
                fontWeight="bold"
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to book your next appointment
              </Typography>
            </Box>
            <Box component="form" sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                margin="normal"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FontAwesomeIcon icon={faUser} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                margin="normal"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FontAwesomeIcon icon={faIdBadge} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 2, py: 1.5, borderRadius: 2 }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>
              <Typography
                variant="body2"
                align="center"
                sx={{ mt: 3, color: "text.secondary" }}
              >
                Don't have an account?{" "}
                <Button
                  color="primary"
                  href="/register-user"
                  sx={{ textTransform: "none" }}
                >
                  Create One
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </StyledCard>
      </Container>
    </Fade>
  );

  const renderScreen1 = () => (
    <Grow in={true} timeout={500}>
      <Container maxWidth="xl">
        <Box sx={{ mt: -2 }}>
          <CardContent>
            <Box textAlign="center" mb={4}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                color="primary"
                fontWeight="bold"
              >
                Find Your Doctor
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Search by name or specialization to book an appointment
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  sx={{ width: 350 }}
                  label="Search Doctor by Name"
                  variant="outlined"
                  margin="normal"
                  placeholder="E.g. Dr. Rosa"
                  value={query}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FontAwesomeIcon icon={faSearch} />
                      </InputAdornment>
                    ),
                  }}
                />
                {suggestions.length > 0 && (
                  <Paper
                    elevation={3}
                    sx={{ maxHeight: 200, overflow: "auto", mt: 1 }}
                  >
                    <List>
                      {suggestions.map((doctor, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() =>
                            handleSuggestionClick(
                              doctor.UserName,
                              doctor.UserId
                            )
                          }
                          sx={{
                            "&:hover": {
                              backgroundColor: "action.hover",
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{ bgcolor: blue[100], color: blue[600] }}
                            >
                              {doctor.UserName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={doctor.UserName}
                            secondary={
                              doctor.Specialization || "General Practitioner"
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  sx={{ width: 350 }}
                  select
                  label="Search by Specialization"
                  variant="outlined"
                  margin="normal"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FontAwesomeIcon icon={faUserMd} />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="OPD">Search by Specialization</MenuItem>
                  <MenuItem value="psychiatrist">Psychiatrist</MenuItem>
                  <MenuItem value="Dentist">Dentist</MenuItem>
                  <MenuItem value="cardiologist">Cardiologist</MenuItem>
                  <MenuItem value="gynecologist">Gynecologist</MenuItem>
                  <MenuItem value="pediatrician">Pediatrician</MenuItem>
                  <MenuItem value="immunologist">Immunologist</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box textAlign="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  px: 6,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                }}
                onClick={handleSearchClick}
                disabled={!query && specialization === "OPD"}
              >
                Search
              </Button>
            </Box>

            {errormeassage && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {errormeassage}
              </Alert>
            )}
          </CardContent>
        </Box>
      </Container>
    </Grow>
  );

  const renderScreen2 = () => (
    <Zoom in={true} timeout={500}>
      <Container maxWidth="xl">
        <Box sx={{ mt: -2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <BackButton
                startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                onClick={handleBackClick}
                variant="outlined"
                sx={{ mr: 2 }}
              >
                Back
              </BackButton>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                color="primary"
                fontWeight="bold"
                sx={{ textAlign: "center", width: "100%", mb: 2 }}
              >
                Available Doctors
              </Typography>
            </Box>

            {doctor.length > 0 ? (
              <Grid container spacing={3}>
                {doctor.map((doc, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <DoctorCard>
                      <CardActionArea onClick={() => handleChannelClick(doc)}>
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar
                              sx={{
                                bgcolor: blue[500],
                                width: 56,
                                height: 56,
                                mr: 2,
                              }}
                            >
                              {doc.MUD_USER_NAME.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {doc.MUD_USER_NAME}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {doc.MUD_SPECIALIZATION}
                              </Typography>
                            </Box>
                          </Box>
                          <Box mt={1}>
                            {doc.MUD_SPECIALIZATION && (
                              <SpecializationChip
                                label={doc.MUD_SPECIALIZATION}
                                size="small"
                              />
                            )}
                          </Box>
                          <Box mt={2} display="flex" justifyContent="flex-end">
                            <Button
                              endIcon={<FontAwesomeIcon icon={faUserMd} />}
                              color="primary"
                              size="small"
                            >
                              View Availability
                            </Button>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </DoctorCard>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="200px"
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No doctors available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria
                </Typography>
              </Box>
            )}
          </CardContent>
        </Box>
      </Container>
    </Zoom>
  );

  //Without date filtering process
  // const renderScreen3 = () => (
  //   <Slide direction="up" in={true} mountOnEnter unmountOnExit>
  //     <Container maxWidth="xl">
  //       <Box sx={{ mt: -2 }}>
  //         <CardContent>
  //           <Box display="flex" alignItems="center" mb={4}>
  //             <BackButton
  //               startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
  //               onClick={handleBackClick}
  //               variant="outlined"
  //               sx={{ mr: 2 }}
  //             >
  //               Back
  //             </BackButton>
  //             <Typography
  //               variant="h4"
  //               component="h1"
  //               gutterBottom
  //               color="primary"
  //               fontWeight="bold"
  //               sx={{ textAlign: "center", width: "100%", mb: 2 }}
  //             >
  //               Available Time Slots
  //             </Typography>
  //           </Box>

  //           {appointmentDetails.length > 0 ? (
  //             <Grid container spacing={2}>
  //               {appointmentDetails.map((appointment, index) => {
  //                 const appointmentDate = new Date(appointment.MT_SLOT_DATE);
  //                 const formattedDate = appointmentDate.toLocaleDateString(
  //                   "en-US",
  //                   {
  //                     weekday: "long",
  //                     year: "numeric",
  //                     month: "long",
  //                     day: "numeric",
  //                   }
  //                 );
  //                 const startTime = new Date(
  //                   `1970-01-01T${appointment.MT_START_TIME}`
  //                 ).toLocaleTimeString("en-US", {
  //                   hour: "numeric",
  //                   minute: "numeric",
  //                   hour12: true,
  //                 });
  //                 const endTime = new Date(
  //                   `1970-01-01T${appointment.MT_END_TIME}`
  //                 ).toLocaleTimeString("en-US", {
  //                   hour: "numeric",
  //                   minute: "numeric",
  //                   hour12: true,
  //                 });

  //                 const endDate = new Date(`${formattedDate} ${endTime}`);
  //                 const currentTime = new Date();

  //                 const isPastDate =
  //                   appointmentDate < new Date().setHours(0, 0, 0, 0);
  //                 const isBookingClosed = currentTime > endDate;
  //                 const isFullyBooked =
  //                   appointment.MT_PATIENT_NO >= appointment.MT_MAXIMUM_PATIENTS;

  //                 return (
  //                   <Grid item xs={12} sm={6} key={index}>
  //                     <Card
  //                       variant="outlined"
  //                       sx={{
  //                         height: '100%',
  //                         borderLeft: `4px solid ${isPastDate || isBookingClosed || isFullyBooked
  //                           ? red[500]
  //                           : green[500]
  //                           }`,
  //                       }}
  //                     >
  //                       <CardContent>
  //                         <Box display="flex" flexDirection="column" height="100%">
  //                           <Box mb={1}>
  //                             <Box display="flex" alignItems="center">
  //                               <FontAwesomeIcon
  //                                 icon={faCalendarAlt}
  //                                 style={{
  //                                   color: blue[500],
  //                                   marginRight: 8,
  //                                 }}
  //                               />
  //                               <Typography variant="subtitle1">
  //                                 {formattedDate}
  //                               </Typography>
  //                             </Box>
  //                           </Box>
  //                           <Box mb={2}>
  //                             <Box display="flex" alignItems="center">
  //                               <FontAwesomeIcon
  //                                 icon={faClock}
  //                                 style={{
  //                                   color: orange[500],
  //                                   marginRight: 8,
  //                                 }}
  //                               />
  //                               <Typography variant="body1">
  //                                 {startTime} - {endTime}
  //                               </Typography>
  //                             </Box>
  //                           </Box>
  //                           <Box mt="auto">
  //                             <Box
  //                               display="flex"
  //                               justifyContent="flex-start"
  //                             >
  //                               {isPastDate ? (
  //                                 <Chip
  //                                   label="Expired"
  //                                   color="error"
  //                                   size="small"
  //                                   sx={{ px: 1 }}
  //                                 />
  //                               ) : isBookingClosed ? (
  //                                 <Chip
  //                                   label="Closed"
  //                                   color="error"
  //                                   size="small"
  //                                   sx={{ px: 1 }}
  //                                 />
  //                               ) : isFullyBooked ? (
  //                                 <Chip
  //                                   label="Fully Booked"
  //                                   color="error"
  //                                   size="small"
  //                                   sx={{ px: 1 }}
  //                                 />
  //                               ) : (
  //                                 <BookButton
  //                                   variant="contained"
  //                                   size="small"
  //                                   onClick={() => handleBookNowClick(appointment)}

  //                                 >
  //                                   Book Now
  //                                 </BookButton>
  //                               )}
  //                             </Box>
  //                             {!isPastDate &&
  //                               !isBookingClosed &&
  //                               !isFullyBooked && (
  //                                 <Box mt={1}>
  //                                   <Typography
  //                                     variant="caption"
  //                                     color="text.secondary"
  //                                   >
  //                                     {appointment.MT_MAXIMUM_PATIENTS -
  //                                       appointment.MT_PATIENT_NO}{" "}
  //                                     slots remaining
  //                                   </Typography>
  //                                 </Box>
  //                               )}
  //                           </Box>
  //                         </Box>
  //                       </CardContent>
  //                     </Card>
  //                   </Grid>
  //                 );
  //               })}
  //             </Grid>
  //           ) : (
  //             <Box
  //               display="flex"
  //               flexDirection="column"
  //               alignItems="center"
  //               justifyContent="center"
  //               minHeight="200px"
  //             >
  //               <Typography variant="h6" color="text.secondary" gutterBottom>
  //                 No appointments available
  //               </Typography>
  //               <Typography variant="body2" color="text.secondary">
  //                 Please check back later or try another doctor
  //               </Typography>
  //             </Box>
  //           )}
  //         </CardContent>
  //       </Box>
  //     </Container>
  //   </Slide>
  // );


  //With date filtering process
  const renderScreen3 = () => {
    const groupedAppointments = appointmentDetails
      .reduce((groups, appointment) => {
        const date = appointment.MT_SLOT_DATE;
        if (!groups[date]) groups[date] = [];
        groups[date].push(appointment);
        return groups;
      }, {});

    const sortedDates = Object.keys(groupedAppointments)
      .sort((a, b) => new Date(a) - new Date(b));

    return (
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Container maxWidth="xl">
          <Box sx={{ mt: -2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={4}>
                <BackButton
                  startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                  onClick={handleBackClick}
                  variant="outlined"
                  sx={{ mr: 2 }}
                >
                  Back
                </BackButton>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  color="primary"
                  fontWeight="bold"
                  sx={{ textAlign: "center", width: "100%", mb: 2 }}
                >
                  Available Time Slots
                </Typography>
              </Box>

              {appointmentDetails.length > 0 ? (
                <Grid container spacing={2}>
                  {sortedDates.flatMap(date =>
                    groupedAppointments[date].map((appointment, index) => {
                      const appointmentDate = new Date(appointment.MT_SLOT_DATE);
                      const formattedDate = appointmentDate.toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      );
                      const startTime = new Date(
                        `1970-01-01T${appointment.MT_START_TIME}`
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      });
                      const endTime = new Date(
                        `1970-01-01T${appointment.MT_END_TIME}`
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      });

                      const endDate = new Date(`${formattedDate} ${endTime}`);
                      const currentTime = new Date();

                      const isPastDate =
                        appointmentDate < new Date().setHours(0, 0, 0, 0);
                      const isBookingClosed = currentTime > endDate;
                      const isFullyBooked =
                        appointment.MT_PATIENT_NO >= appointment.MT_MAXIMUM_PATIENTS;

                      return (
                        <Grid item xs={12} sm={6} key={`${date}-${index}`}>
                          <Card
                            variant="outlined"
                            sx={{
                              height: '100%',
                              borderLeft: `4px solid ${isPastDate || isBookingClosed || isFullyBooked
                                ? red[500]
                                : green[500]
                                }`,
                            }}
                          >
                            <CardContent>
                              <Box display="flex" flexDirection="column" height="100%">
                                <Box mb={1}>
                                  <Box display="flex" alignItems="center">
                                    <FontAwesomeIcon
                                      icon={faCalendarAlt}
                                      style={{
                                        color: blue[500],
                                        marginRight: 8,
                                      }}
                                    />
                                    <Typography variant="subtitle1">
                                      {formattedDate}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box mb={2}>
                                  <Box display="flex" alignItems="center">
                                    <FontAwesomeIcon
                                      icon={faClock}
                                      style={{
                                        color: orange[500],
                                        marginRight: 8,
                                      }}
                                    />
                                    <Typography variant="body1">
                                      {startTime} - {endTime}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box mt="auto">
                                  <Box
                                    display="flex"
                                    justifyContent="flex-start"
                                  >
                                    {isPastDate ? (
                                      <Chip
                                        label="Expired"
                                        color="error"
                                        size="small"
                                        sx={{ px: 1 }}
                                      />
                                    ) : isBookingClosed ? (
                                      <Chip
                                        label="Closed"
                                        color="error"
                                        size="small"
                                        sx={{ px: 1 }}
                                      />
                                    ) : isFullyBooked ? (
                                      <Chip
                                        label="Fully Booked"
                                        color="error"
                                        size="small"
                                        sx={{ px: 1 }}
                                      />
                                    ) : (
                                      <BookButton
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleBookNowClick(appointment)}
                                      >
                                        Book Now
                                      </BookButton>
                                    )}
                                  </Box>
                                  {!isPastDate &&
                                    !isBookingClosed &&
                                    !isFullyBooked && (
                                      <Box mt={1}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {appointment.MT_MAXIMUM_PATIENTS -
                                            appointment.MT_PATIENT_NO}{" "}
                                          slots remaining
                                        </Typography>
                                      </Box>
                                    )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })
                  )}
                </Grid>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  minHeight="200px"
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No appointments available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please check back later or try another doctor
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Box>
        </Container>
      </Slide>
    );
  };

  const renderScreen4 = () => {
    if (!selectedAppointment) return null;

    const startTime = new Date(
      `1970-01-01T${selectedAppointment.MT_START_TIME}`
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const endTime = new Date(
      `1970-01-01T${selectedAppointment.MT_END_TIME}`
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const allocatedTime = new Date(
      `1970-01-01T${selectedAppointment.MT_ALLOCATED_TIME}`
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const appointmentDate = new Date(selectedAppointment.MT_SLOT_DATE);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <Dialog
        open={true}
        TransitionComponent={Transition}
        keepMounted
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: isMobile ? 0 : 2,
            p: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: "white",
            py: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Confirm Appointment
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Appointment Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Patient Name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Contact Number:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {contact}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Doctor:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedAppointment.MT_DOCTOR}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formattedDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Your Time:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {allocatedTime}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Doctor's Availability:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {startTime} - {endTime}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please arrive 10 minutes before your scheduled appointment time.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleBackClick}
            variant="outlined"
            sx={{ mr: 2, borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            sx={{ borderRadius: 1 }}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderScreen5 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <StyledCard>
          <CardContent
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: green[100],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke={green[600]}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              color="primary"
              fontWeight="bold"
            >
              Appointment Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your appointment with {selectedDoctor} has been successfully
              booked.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We've sent the details to your registered contact information.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => {
                setCurrentScreen(1);
                setActiveStep(1);
              }}
              sx={{ mt: 3, px: 4, py: 1.5, borderRadius: 2 }}
            >
              Book Another Appointment
            </Button>
          </CardContent>
        </StyledCard>
      </Container>
    </motion.div>
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "60vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      {currentScreen > 0 && currentScreen < 4 && (
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Container>
      )}

      {currentScreen === 0 && renderScreen0()}
      {currentScreen === 1 && renderScreen1()}
      {currentScreen === 2 && renderScreen2()}
      {currentScreen === 3 && renderScreen3()}
      {currentScreen === 4 && renderScreen4()}
      {currentScreen === 5 && renderScreen5()}

      <Snackbar
        open={openSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Login successful! You can now book appointments.
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errormeassage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errormeassage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
