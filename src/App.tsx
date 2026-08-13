import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { checkAuth, checkGoogleAvailability } from './store/authSlice';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Me } from './pages/Me';
import { ActivityLog } from './pages/ActivityLog';
import { JobPipeline } from './pages/JobPipeline';
import { HRDetails } from './pages/HRDetails';
import { LeetCode } from './pages/LeetCode';
import { LinkedIn } from './pages/LinkedIn';
import { Performance } from './pages/Performance';
import { Brain } from './pages/Brain';
import { AiQuery } from './pages/AiQuery';
import { AppUsage } from './pages/AppUsage';
import { Placeholder } from './pages/Placeholder';
import { Login } from './pages/Login';

export const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(checkAuth());
    dispatch(checkGoogleAvailability());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route
            path="me"
            element={
              <ProtectedRoute>
                <Me />
              </ProtectedRoute>
            }
          />
          <Route
            path="activity-log"
            element={
              <ProtectedRoute>
                <ActivityLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="job-pipeline"
            element={
              <ProtectedRoute>
                <JobPipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="hr-details"
            element={
              <ProtectedRoute>
                <HRDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="leetcode"
            element={
              <ProtectedRoute>
                <LeetCode />
              </ProtectedRoute>
            }
          />
          <Route
            path="linkedin"
            element={
              <ProtectedRoute>
                <LinkedIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="performance"
            element={
              <ProtectedRoute>
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route
            path="brain"
            element={
              <ProtectedRoute>
                <Brain />
              </ProtectedRoute>
            }
          />
          <Route
            path="ai-query"
            element={
              <ProtectedRoute>
                <AiQuery />
              </ProtectedRoute>
            }
          />
          <Route
            path="app-usage"
            element={
              <ProtectedRoute>
                <AppUsage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Placeholder />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
