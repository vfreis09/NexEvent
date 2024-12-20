import React from "react";
import { Route, Routes } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import HomePage from "./pages/Home/Home";
import SignupPage from "./pages/Signup/Signup";
import LoginPage from "./pages/Login/Login";
import CreateEvent from "./pages/CreateEvent/CreateEvent";
import Dashboard from "./pages/Dashboard/Dashboard";
import EventDetails from "./pages/EventDetails/EventDetails";
import EditEvent from "./pages/EditEvent/EditEvent";
import MapProvider from "./context/MapProvider";

const App: React.FC = () => {
  return (
    <UserProvider>
      <MapProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create" element={<CreateEvent />} />
          <Route path="/edit/:id" element={<EditEvent />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/event/:id" element={<EventDetails />} />
        </Routes>
      </MapProvider>
    </UserProvider>
  );
};

export default App;
