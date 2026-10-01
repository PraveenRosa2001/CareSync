import React from 'react';
import '../styles/footer.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <p>© 2025 CareSync Hospitals PLC. All rights reserved.</p>
        </div>

        <div className="footer-center">
          <h2 style={{ fontSize: "16px", color: "white" }}>Follow us</h2>
          <div className="footer-icons">
            <ul>
              {/* <li><a href="https://dockyardsoftware.com/" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a></li> */}
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a></li>
              {/* <li><a href="https://www.tiktok.com/@dockyard.software?_t=ZS-8yVMoDxdoSg&_r=1" target="_blank" rel="noopener noreferrer"><i className="fab fa-tiktok"></i></a></li> */}
            </ul>
          </div>
        </div>

        
      </div>
    </footer>
  );
};

export default Footer;
