import React from "react";
import { Route, Routes } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import HomePage from "./pages/Home/Home";
import SignupPage from "./pages/Signup/Signup";
import LoginPage from "./pages/Login/Login";
import CreateEvent from "./pages/CreateEvent/CreateEvent";

const App: React.FC = () => {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create" element={<CreateEvent />} />
      </Routes>
    </UserProvider>
  );
};

export default App;
