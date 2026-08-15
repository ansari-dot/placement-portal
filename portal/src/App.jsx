import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import DashboardPage from "./pages/DashboardPage";
import MyStudentsPage from "./pages/MyStudentsPage";
import AddNewStudentPage from "./pages/AddNewStudentPage";
import WorkflowPage from "./pages/WorkflowPage";
import TheRTOPage from "./pages/TheRTOPage";
import IndustryPage from "./pages/IndustryPage";
import JobPage from "./pages/JobPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/my-students" element={<MyStudentsPage />} />
        <Route path="/add-student" element={<AddNewStudentPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/rto" element={<TheRTOPage />} />
        <Route path="/industry" element={<IndustryPage />} />
        <Route path="/jobs" element={<JobPage />} />
      </Routes>
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
  );
};

export default App;
