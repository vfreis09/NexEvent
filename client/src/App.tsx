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
import UserProfile from "./pages/UserProfile/UserProfile";
import OverviewTab from "./components/OverviewTab/OverviewTab";
import CreatedEventsTab from "./components/CreatedEventsTab/CreatedEventsTab";
import RsvpTab from "./components/RsvpTab/RsvpTab";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword/ResetPassword";
import RequireAdmin from "./auth/RequireAdmin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageEvents from "./pages/Admin/ManageEvents";
import AdminStats from "./pages/Admin/AdminStats";
import ProtectedRoute from "./auth/ProtectedRoute";
import SearchResults from "./pages/SearchResults/SearchResults";

const App: React.FC = () => {
  return (
    <UserProvider>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/search/results" element={<SearchResults />} />
        <Route
          element={
            <>
              <RequireVerifiedUser />
            </>
          }
        >
          <Route element={<ProtectedRoute requireVerified blockBanned />}>
            <Route
              path="/create"
              element={
                <MapProvider>
                  <CreateEvent />
                </MapProvider>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <MapProvider>
                  <EditEvent />
                </MapProvider>
              }
            />
          </Route>
        </Route>
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/event/:id"
          element={
            <MapProvider>
              <EventDetails />
            </MapProvider>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/user/:username" element={<UserProfile />}>
          <Route index element={<OverviewTab />} />
          <Route path="events" element={<CreatedEventsTab />} />
          <Route path="rsvps" element={<RsvpTab />} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/events" element={<ManageEvents />} />
          <Route path="/admin/stats" element={<AdminStats />} />
        </Route>
      </Routes>
    </UserProvider>
  );
};

export default App;
