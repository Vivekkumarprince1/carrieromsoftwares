import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/JobsList';
import JobForm from './pages/JobDashboard';
import Apply from './pages/Apply';
import MyApplications from './pages/MyApplications';
import Dashboard from './pages/Dashboard';
import Certificates from './pages/Certificates';
// import OfferLetters from './pages/OfferLetters';
import VerifyCertificate from './pages/VerifyCertificate';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ApplicationDetail from './pages/ApplicationDetail';
import './index.css';
// import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              {/* <Route 
                path="/offer-letters" 
                element={
                  <AdminRoute>
                    <OfferLetters />
                  </AdminRoute>
                } 
              /> */}
              {/* Public certificate verification routes */}
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/verify/:id" element={<VerifyCertificate />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
