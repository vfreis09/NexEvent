import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Globe } from "lucide-react";
import { useUser } from "../../context/UserContext";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const { user } = useUser();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="grid w-full grid-cols-1 gap-8 px-12 py-9 sm:grid-cols-[1.6fr_1fr] sm:items-start sm:gap-6">
        <div>
          <Link
            to="/"
            onClick={handleLogoClick}
            className="font-mono text-lg font-medium text-foreground no-underline hover:text-primary transition-colors"
          >
            NexEvent
          </Link>
          <p className="mt-2.5 max-w-[280px] text-xs text-muted-foreground">
            Find, create, and RSVP to events that fit your interests.
          </p>
          {user ? (
            <Link to="/create" className="mt-4 inline-block text-xs font-mono text-primary no-underline hover:underline">
            Get started →
          </Link>
          ) : (
          <Link to="/signup" className="mt-4 inline-block text-xs font-mono text-primary no-underline hover:underline">
            Get started →
          </Link>
          )}
        </div>

        <div>
          <h4 className="mb-3 text-[10px] font-mono tracking-wider text-primary uppercase">
            Connect
          </h4>
          <div className="flex items-center gap-4">
            <a href="https://github.com/vfreis09" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
              <FaGithub size={18} />
            </a>
            <a href="https://www.linkedin.com/in/vicente-fernandes-339005155/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
              <FaLinkedin size={18} />
            </a>
            <a href="https://vfreis09.github.io/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Personal website">
              <Globe size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-12 py-5 text-left text-[11px] font-mono text-muted-foreground">
        © {currentYear} NexEvent. Created by Vicente Fernandes
      </div>
    </footer>
  );
};

export default Footer;