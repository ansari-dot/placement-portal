import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import store from "./redux/store";
import { checkAuthThunk } from "./redux/authSlice";

import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import MyStudentsPage from "./pages/MyStudentsPage";
import AddNewStudentPage from "./pages/AddNewStudentPage";
import StudentViewEditPage from "./pages/StudentViewEditPage";
import WorkflowPage from "./pages/WorkflowPage";
import TheRTOPage from "./pages/TheRTOPage";
import IndustryPage from "./pages/IndustryPage";
import JobPage from "./pages/JobPage";
import UsersPage from "./pages/UsersPage";

const AppRoutes = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-students"
        element={
          <ProtectedRoute>
            <MyStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-student"
        element={
          <ProtectedRoute>
            <AddNewStudentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id/:mode"
        element={
          <ProtectedRoute>
            <StudentViewEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflow"
        element={
          <ProtectedRoute>
            <WorkflowPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rto"
        element={
          <ProtectedRoute>
            <TheRTOPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/industry"
        element={
          <ProtectedRoute>
            <IndustryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <JobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
