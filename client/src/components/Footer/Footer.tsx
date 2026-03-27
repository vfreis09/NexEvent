import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { FaGithub, FaLinkedin, FaGlobe } from "react-icons/fa";
import "./Footer.css";

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`main-footer ${theme === "dark" ? "dark-mode" : ""}`}>
      <div className="footer-content">
        <div className="footer-section brand">
          <Link to="/" className="footer-logo">
            NexEvent
          </Link>
        </div>
        <div className="footer-section links">
          <h4>Navigation</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/search/results">Explore Events</Link>
            </li>
            <li>
              <Link to="/signup">Get Started</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section social">
          <h4>Connect</h4>
          <div className="social-icons">
            <a
              href="github.com/vfreis09"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub />
            </a>
            <a
              href="https://www.linkedin.com/in/vicente-fernandes-339005155/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://vfreis09.github.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGlobe />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} NexEvent. Created by Vicente Fernandes</p>
      </div>
    </footer>
  );
};

export default Footer;
