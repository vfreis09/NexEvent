import React from "react";
import { Route, Routes } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import HomePage from "./pages/Home/Home";
import SignupPage from "./pages/Signup/Signup";
import LoginPage from "./pages/Login/Login";
import CreateEvent from "./pages/CreateEvent/CreateEvent";
import Settings from "./pages/Settings/Settings";
import EventDetails from "./pages/EventDetails/EventDetails";
import EditEvent from "./pages/EditEvent/EditEvent";
import MapProvider from "./context/MapProvider";
import RequireVerifiedUser from "./auth/RequireVerifiedUser";
import Header from "./components/Header/Header";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";

const App: React.FC = () => {
  return (
    <UserProvider>
      <MapProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <>
                <RequireVerifiedUser />
              </>
            }
          >
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/edit/:id" element={<EditEvent />} />
          </Route>
          <Route path="/settings" element={<Settings />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MapProvider>
    </UserProvider>
  );
};

export default App;
