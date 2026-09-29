import React, { useState, useEffect } from 'react';
import '../styles/availableTimeslots.css'; // External CSS

const AvailableTimeslots = () => {
  const [timeslots, setTimeslots] = useState([
    { id: 1, time: '10:00 AM - 10:15 AM', available: true },
    { id: 2, time: '10:15 AM - 10:30 AM', available: false },
    { id: 3, time: '10:30 AM - 10:45 AM', available: true },
    { id: 4, time: '10:45 AM - 11:00 AM', available: true },
    // Add more timeslots
  ]);

  
  useEffect(() => {
    // You can fetch timeslots from an API here and update the state
  }, []);

  const handleSelect = (slot) => {
    if (slot.available) {
      alert(`You have selected: ${slot.time}`);
      // Add additional logic for booking the timeslot
    }
  };

  return (
    <div className="timeslot-container">
      <h2 className="timeslot-title">Available Timeslots</h2>
      <div className="timeslot-grid">
        {timeslots.map((slot) => (
          <div
            key={slot.id}
            className={`timeslot-card ${slot.available ? 'available' : 'unavailable'}`}
            onClick={() => handleSelect(slot)}
          >
            <p className="timeslot-time">{slot.time}</p>
            
            {slot.available ? (
              <button className="timeslot-button">Select</button>
            ) : (
              <p className="timeslot-unavailable-text">Unavailable</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableTimeslots;
