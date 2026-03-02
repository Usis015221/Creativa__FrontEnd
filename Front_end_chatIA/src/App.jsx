import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx'
import ViewCampaignsMarketing from './layouts/ViewCampaignsMarketing/ViewCampaignsMarketing.jsx';
import ViewAssignmentsDesigner from './layouts/ViewAssignmentsDesigner/ViewAssignmentsDesigner.jsx';
import CampaignWorkspace from './layouts/CampaignWorkspace/CampaignWorkspace.jsx';
import ChatPage from './pages/ChatPage';
import Login from './components/Login/login.jsx';
import RecoverAccount from './pages/RecoverAccount.jsx'
import ResetPassword from './pages/ResetPassword.jsx';
import './App.css'
import { AuthProvider } from "./context/AuthContext.jsx"
import PrivateRoute from './components/Guards/PrivateRoute.jsx';
import RoleRoute from './components/Guards/RoleRoute.jsx';
import PublicRoute from './components/Guards/PublicRoute.jsx';
import { CampaignProvider } from './context/CampaignContext.jsx';
import SessionProvider from './context/SessionContext.jsx';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/animations/PageTransition.jsx';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import RequestsMailbox from './components/Admin/RequestsMailbox.jsx';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        {/* <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />
        <Route path="/recover" element={
          <PageTransition>
            <RecoverAccount />
          </PageTransition>
        } /> */}

        <Route element={<PublicRoute />}>
          <Route path="/login" element={
            <PageTransition>
              <Login />
            </PageTransition>
          } />
          <Route path="/recover" element={
            <PageTransition className="public-page">
              <RecoverAccount />
            </PageTransition>
          } />
        </Route>

        {/* Ruta libre — accesible con o sin sesión activa */}
        <Route path="/reset-password" element={
          <PageTransition className="public-page">
            <ResetPassword />
          </PageTransition>
        } />
      
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>

          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['admin', 'marketing']} />}>
            <Route path="/admin" element={
              <PageTransition className="admin-page">
                <Navbar role='Admin' />
                <AdminPanel />
              </PageTransition>
            } />
            <Route path="/requests" element={
              <PageTransition className="admin-page">
                <Navbar role='Admin' />
                <RequestsMailbox />
              </PageTransition>
            } />
          </Route>

          {/* Marketing Routes */}
          <Route element={<RoleRoute allowedRoles={['marketing']} />}>
            <Route path='/' element={
              <PageTransition className="main-layout">
                <Navbar role='Marketing' />
                <ViewCampaignsMarketing />
              </PageTransition>
            } />
            <Route path="/chat/:draftId?" element={
              <PageTransition>
                <ChatPage />
              </PageTransition>
            } />
          </Route>

          {/* Designer Routes */}
          <Route element={<RoleRoute allowedRoles={['designer']} />}>
            <Route path="/designer" element={
              <PageTransition>
                <Navbar role='Diseñador' />
                <ViewAssignmentsDesigner />
              </PageTransition>
            } />
            <Route path="/designer/workspace/:campaignId" element={
              <PageTransition>
                <Navbar role='Diseñador' />
                <CampaignWorkspace />
              </PageTransition>
            } />
          </Route>

        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <CampaignProvider>
        <SessionProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              style: {
                background: 'var(--color-bg-panel)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '0.9rem',
              },
              success: {
                iconTheme: {
                  primary: 'var(--color-success)',
                  secondary: 'var(--color-white)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--color-error)',
                  secondary: 'var(--color-white)',
                },
              },
            }}
          />
          <Router>
            <AnimatedRoutes />
          </Router>
        </SessionProvider>
      </CampaignProvider>
    </AuthProvider >
  )
}

export default App
