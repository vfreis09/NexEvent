import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, Search, PlusCircle } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import UserMenu from "../UserMenu/UserMenu";
import SearchBar from "../SearchBar/SearchBar";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  const { user, isLoggedIn, loadUser, isVerified, hasFetchedUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showToast, toastInfo, hideToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !user && !hasFetchedUser) {
      loadUser();
    }
  }, [isLoggedIn, user, hasFetchedUser]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          textColor={toastInfo.textColor}
          onClose={hideToast}
        />
      )}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md w-full">
        {/* ===================== MOBILE HEADER (<640px) ===================== */}
        <div className="flex sm:hidden h-16 items-center justify-between px-4 gap-2 w-full">
          {!mobileSearchOpen ? (
            <Link
              to="/"
              style={{ marginLeft: "16px" }}
              className="font-mono text-lg font-black tracking-tight text-foreground hover:text-primary transition-colors no-underline truncate min-w-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              NexEvent
            </Link>
          ) : (
            <div style={{ marginLeft: "16px" }} className="flex-1 min-w-0 pr-2">
              <SearchBar />
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                setMobileMenuOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground !h-10 !w-10 !rounded-lg"
              aria-label="Toggle search"
            >
              {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMobileMenuOpen((v) => !v);
                setMobileSearchOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground !h-10 !w-10 !rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="sm:hidden fixed inset-0 top-16 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer Content */}
        {mobileMenuOpen && (
          <div 
            className="sm:hidden relative z-50 border-t border-border bg-background px-4 flex flex-col gap-4 shadow-2xl"
            style={{ paddingBottom: "24px" }}
          >
            {user ? (
              /* Centered Logged-In Mobile Drawer Layout */
              <div className="w-full flex justify-center">
                <div className="w-[88%] max-w-[280px] flex flex-col gap-3">
                  {/* 1. Primary Action */}
                  {isVerified && user.role !== "banned" && (
                    <div style={{ paddingTop: "20px" }} className="w-full flex justify-center">
                      <Link
                        to="/create"
                        onClick={() => setMobileMenuOpen(false)}
                        className="no-underline flex justify-center w-full"
                      >
                        <Button className="w-full bg-[#4B4ACF] hover:bg-[#3b3aa8] text-white font-mono text-xs font-bold tracking-wider !h-11 !rounded-lg flex items-center justify-center gap-2 shadow-sm">
                          <PlusCircle size={16} />
                          CREATE EVENT
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* 2. Notifications Container */}
                  <div className="relative w-full border border-border rounded-lg !h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <NotificationDropdown
                      isLoggedIn={isLoggedIn}
                      userId={user.id}
                      label="Notifications"
                    />
                  </div>

                  {/* 3. User Menu Container */}
                  <div 
                    className="relative w-full border border-border rounded-lg !h-11 flex items-center justify-center cursor-pointer select-none text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      const trigger = e.currentTarget.querySelector('button, [role="button"]');
                      if (trigger && e.target !== trigger && !trigger.contains(e.target as Node)) {
                        (trigger as HTMLElement).click();
                      }
                    }}
                  >
                    <UserMenu user={user} />
                  </div>
                </div>
              </div>
            ) : (
              /* Centered Logged-Out Actions */
              <div className="w-full flex justify-center">
                <div className="w-[88%] max-w-[280px] flex flex-col gap-3">
                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    style={{ marginTop: "24px" }}
                    className="w-full font-mono !text-xs tracking-wider font-bold border border-border rounded text-muted-foreground hover:text-foreground !h-11 !rounded-lg flex items-center justify-center gap-2 uppercase"
                  >
                    {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </Button>

                  <Link to="/login" className="no-underline w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full font-mono !text-xs tracking-wider font-bold border border-border rounded text-muted-foreground hover:text-foreground !h-11 !rounded-lg"
                    >
                      LOGIN
                    </Button>
                  </Link>

                  <Link 
                    to="/signup" 
                    className="no-underline w-full block" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono !text-xs font-bold tracking-wider !h-11 !rounded-lg shadow-sm transition-all">
                      START FREE
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== DESKTOP HEADER (>=640px) ===================== */}
        <div className="hidden sm:grid h-20 grid-cols-[48px_1fr_448px_1fr_48px] w-full items-center gap-4">
          <div className="w-12 shrink-0" />

          <div className="flex items-center justify-start">
            <Link
              to="/"
              className="font-mono text-2xl font-black tracking-tight text-foreground hover:text-primary transition-colors no-underline whitespace-nowrap"
            >
              NexEvent
            </Link>
            {user && isVerified && user.role !== "banned" && (
              <div className="flex-1 flex justify-center">
                <Link
                  to="/create"
                  className="hidden lg:inline-flex items-center justify-center text-sm font-mono font-bold tracking-wide text-[#4B4ACF] hover:text-foreground transition-colors no-underline whitespace-nowrap"
                >
                  CREATE EVENT
                </Link>
              </div>
            )}
          </div>

          <div className="w-full justify-self-center">
            <SearchBar />
          </div>

          <div className="flex items-center gap-6 justify-end">
            {!isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground !h-10 !w-10 !rounded-lg"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            )}

            {user && (
              <div className="mr-6">
                <NotificationDropdown isLoggedIn={isLoggedIn} userId={user.id} />
              </div>
            )}

            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/login" className="no-underline">
                  <Button
                    variant="ghost"
                    className="font-mono !text-xs tracking-wider font-bold border border-gray-400 rounded text-muted-foreground hover:text-foreground !h-11 !px-5 !rounded-lg flex items-center justify-center"
                  >
                    LOGIN
                  </Button>
                </Link>
                <Link to="/signup" className="no-underline">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono !text-xs font-bold tracking-wider !h-11 !px-6 !rounded-lg shadow-sm transition-all">
                    START FREE
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="w-12 shrink-0" />
        </div>
      </header>
    </>
  );
};

export default Header;