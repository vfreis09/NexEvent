import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Globe } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background w-full">
      {/* Changed layout to w-full px-12 to align directly with the header elements */}
      <div className="w-full px-12 py-12 flex flex-col gap-10 md:flex-row md:justify-between items-start">
        
        {/* BRAND IDENTITY */}
        <div>
          <Link
            to="/"
            className="font-serif text-xl font-black tracking-tight text-foreground hover:text-primary transition-colors no-underline"
          >
            NexEvent
          </Link>
        </div>

        {/* NAVIGATION SECTION */}
        <div>
          <h4 className="mb-3 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            // Navigation
          </h4>
          <ul className="space-y-2 p-0 m-0 list-none">
            <li>
              <Link
                to="/"
                className="text-xs font-mono text-muted-foreground no-underline hover:text-foreground transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/search/results"
                className="text-xs font-mono text-muted-foreground no-underline hover:text-foreground transition-colors"
              >
                Explore events
              </Link>
            </li>
            <li>
              <Link
                to="/signup"
                className="text-xs font-mono text-muted-foreground no-underline hover:text-foreground transition-colors"
              >
                Get started
              </Link>
            </li>
          </ul>
        </div>

        {/* CONNECT SECTION */}
        <div>
          <h4 className="mb-3 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            // Connect
          </h4>
          <div className="flex gap-4 items-center">
            <a
              href="https://github.com/vfreis09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <FaGithub size={18} />
            </a>

            <a
              href="https://www.linkedin.com/in/vicente-fernandes-339005155/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={18} />
            </a>

            <a
              href="https://vfreis09.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Personal website"
            >
              <Globe size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-border/60 mx-12 py-6 text-left text-[11px] font-mono text-muted-foreground">
        © {currentYear} NexEvent. Created by Vicente Fernandes
      </div>
    </footer>
  );
};

export default Footer;