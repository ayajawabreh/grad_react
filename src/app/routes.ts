import { createBrowserRouter, redirect } from "react-router";

import StudentLayout from "../layouts/StudentLayout";
import CompanyLayout from "../layouts/CompanyLayout";
import AdminLayout from "../layouts/AdminLayout";

import Landing from "../pages/public/Landing";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import ForgotPassword from "../pages/public/ForgotPassword";
import VerifyEmail from "../pages/public/VerifyEmail";

import StudentDashboard from "../pages/student/Dashboard";
import StudentProfile from "../pages/student/Profile";
import StudentResume from "../pages/student/MyResume";
import StudentResumeView from "../pages/student/ResumeView";
import JobDiscovery from "../pages/student/JobDiscovery";
import StudentJobDetails from "../pages/student/JobDetails";
import Applications from "../pages/student/Applications";
import SavedJobs from "../pages/student/SavedJobs";
import RecommendedJobs from "../pages/student/Recommended";
import StudentMessages from "../pages/student/Messages";
import StudentNotifications from "../pages/student/Notifications";
import StudentSettings from "../pages/student/Settings";
import AIAssistant from "../pages/student/AIAssistant";

import CompanyDashboard from "../pages/company/Dashboard";
import CompanyProfile from "../pages/company/Profile";
import CreateJob from "../pages/company/CreateJob";
import EditJob from "../pages/company/EditJob";
import ManageJobs from "../pages/company/ManageJobs";
import CompanyJobDetails from "../pages/company/JobDetails";
import Applicants from "../pages/company/Applicants";
import CandidateDetails from "../pages/company/CandidateDetails";
import RecommendedCandidates from "../pages/company/RecommendedCandidates";
import Interviews from "../pages/company/Interviews";
import CompanyMessages from "../pages/company/Messages";
import CompanyNotifications from "../pages/company/Notifications";
import CompanySettings from "../pages/company/Settings";

import AdminDashboard from "../pages/admin/Dashboard";import AdminStudents from "../pages/admin/Students";
import AdminCompanies from "../pages/admin/Companies";
import AdminJobs from "../pages/admin/Jobs";
import AdminApplications from "../pages/admin/Applications";
import AdminAnalytics from "../pages/admin/Analytics";
import AdminReports from "../pages/admin/Reports";
import AdminNotifications from "../pages/admin/Notifications";
import AdminSettings from "../pages/admin/Settings";
import AdminCategories from "../pages/admin/Categories";
import AdminSystemLogs from "../pages/admin/SystemLogs";
import AdminSkills from "../pages/admin/Skills";
import Shortlisted from "../pages/company/Shortlisted";
import Reports from "../pages/company/Reports";
import MyResume from "../pages/student/MyResume";
import ResumeUpload from "../pages/student/ResumeUpload";
import ResumeBuilder from "../pages/student/Resume";
import RouteErrorBoundary from "./RouteErrorBoundary";


export const router = createBrowserRouter([
  { path: "/", Component: Landing, ErrorBoundary: RouteErrorBoundary },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/verify-email", Component: VerifyEmail },

  
{
  path: "/student",
  Component: StudentLayout,
  ErrorBoundary: RouteErrorBoundary,
  children: [
    { index: true, loader: () => redirect("/student/dashboard") },
    { path: "dashboard", Component: StudentDashboard },
    { path: "profile", Component: StudentProfile },

    { path: "resume", Component: StudentResume },
    { path: "resume/create", Component: ResumeBuilder },
    { path: "resume/upload", Component: ResumeUpload },
    { path: "resume/view", Component: StudentResumeView },

    { path: "jobs", Component: JobDiscovery },
    { path: "jobs/:id", Component: StudentJobDetails },
    { path: "applications", Component: Applications },
    { path: "saved", Component: SavedJobs },
    { path: "recommended", Component: RecommendedJobs },
    { path: "messages", Component: StudentMessages },
    { path: "notifications", Component: StudentNotifications },
    { path: "settings", Component: StudentSettings },
    { path: "ai", Component: AIAssistant },
  ],
},
  {
    path: "/company",
    Component: CompanyLayout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, loader: () => redirect("/company/dashboard") },
      { path: "dashboard", Component: CompanyDashboard },
      { path: "profile", Component: CompanyProfile },
      { path: "jobs", Component: ManageJobs },
      { path: "jobs/create", Component: CreateJob },
      { path: "jobs/edit/:id", Component: EditJob },
      { path: "jobs/:id", Component: CompanyJobDetails },
      { path: "applicants", Component: Applicants },
      { path: "shortlisted", Component: Shortlisted },
      { path: "applicants/:id", Component: CandidateDetails },
      { path: "recommended", Component: RecommendedCandidates },
      { path: "interviews", Component: Interviews },
      { path: "reports", Component: Reports },
      { path: "messages", Component: CompanyMessages },
      { path: "notifications", Component: CompanyNotifications },
      { path: "settings", Component: CompanySettings },
     { path: "jobs/:id/shortlisted", Component: Shortlisted },
     
    ],
  },

  {
    
  path: "/admin",
  Component: AdminLayout,
  ErrorBoundary: RouteErrorBoundary,
  children: [
    { index: true, loader: () => redirect("/admin/dashboard") },
{ path: "dashboard", Component: AdminDashboard },    { path: "students", Component: AdminStudents },
    { path: "companies", Component: AdminCompanies },
    { path: "categories", Component: AdminCategories },
    { path: "skills", Component: AdminSkills },
    { path: "jobs", Component: AdminJobs },
    { path: "applications", Component: AdminApplications },
    { path: "analytics", Component: AdminAnalytics },
    { path: "system-logs", Component: AdminSystemLogs },
    { path: "reports", Component: AdminReports },
    { path: "notifications", Component: AdminNotifications },
    { path: "settings", Component: AdminSettings },
  ],
  },

  { path: "*", loader: () => redirect("/") },
]);
