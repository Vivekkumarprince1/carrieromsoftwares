import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalLoader from './components/common/GlobalLoader';
import { systemService } from './services/api';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import Jobs from './pages/JobsList';
import JobForm from './pages/JobDashboard';
import Apply from './pages/Apply';
import MyApplications from './pages/MyApplications';
import Dashboard from './pages/Dashboard';
import Certificates from './pages/Certificates';
import OfferLetters from './pages/OfferLetters';
import VerifyCertificate from './pages/VerifyCertificate';
import Contact from './pages/Contact';
import SubmitReview from './pages/SubmitReview';
import AdminReviewManagement from './components/reviews/AdminReviewManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import RecommendationManagement from './pages/admin/RecommendationManagement';
import EmployeeProfile from './pages/EmployeeProfile';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ApplicationDetail from './pages/ApplicationDetail';
import OfferAcceptance from './pages/OfferAcceptance';
import NotificationsPage from './pages/NotificationsPage';

import './index.css';

const STARTUP_LOADER_MIN_MS = 300;
const HEALTH_RETRY_DELAY_MS = 700;

const AppContent = () => {
  const location = useLocation();

  // List of routes where the footer should be hidden
  const hideFooterRoutes = ['/login', '/register', '/apply'];

  // Check if current path matches any of the hideFooterRoutes
  const shouldHideFooter = hideFooterRoutes.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return (
    <div className="app-container flex flex-col min-h-screen">
      <GlobalLoader />
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/create" element={
            <AdminRoute>
              <JobForm />
            </AdminRoute>
          } />
          <Route path="/jobs/edit/:id" element={
            <AdminRoute>
              <JobForm />
            </AdminRoute>
          } />
          <Route
            path="/applications/:id"
            element={
              <PrivateRoute>
                <ApplicationDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/apply/:jobId"
            element={
              <PrivateRoute>
                <Apply />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <PrivateRoute>
                <MyApplications />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <AdminRoute>
                <Certificates />
              </AdminRoute>
            }
          />
          <Route
            path="/offer-letters"
            element={
              <AdminRoute>
                <OfferLetters />
              </AdminRoute>
            }
          />
          {/* Public certificate verification routes */}
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/verify/:id" element={<VerifyCertificate />} />

          {/* Contact page */}
          <Route path="/contact" element={<Contact />} />

          {/* Review routes */}
          <Route
            path="/reviews/submit"
            element={
              <PrivateRoute>
                <SubmitReview />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviewManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <AdminRoute>
                <EmployeeManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/recommendations"
            element={
              <AdminRoute>
                <RecommendationManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <PrivateRoute>
                <EmployeeProfile />
              </PrivateRoute>
            }
          />

          {/* Public offer acceptance route */}
          <Route path="/offer/accept/:token" element={<OfferAcceptance />} />

        </Routes>
      </main>

      {!shouldHideFooter && <Footer />}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

function App() {
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout;
    let readyTimeout;
    const startedAt = Date.now();

    const checkBackendHealth = async () => {
      try {
        await systemService.checkHealth();

        if (isMounted) {
          const elapsed = Date.now() - startedAt;
          const remainingDelay = Math.max(0, STARTUP_LOADER_MIN_MS - elapsed);

          readyTimeout = window.setTimeout(() => {
            if (isMounted) {
              setBackendReady(true);
            }
          }, remainingDelay);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        retryTimeout = window.setTimeout(checkBackendHealth, HEALTH_RETRY_DELAY_MS);
      }
    };

    checkBackendHealth();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
      if (readyTimeout) {
        window.clearTimeout(readyTimeout);
      }
    };
  }, []);

  if (!backendReady) {
    return (
      <GlobalLoader
        forceVisible
        message="Starting backend"
        subMessage="Please wait. The app will appear as soon as the server is ready."
        backdropClassName="bg-black"
      />
    );
  }

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
