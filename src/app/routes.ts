import { createBrowserRouter, redirect } from "react-router";
import type { ComponentType } from "react";
import RouteErrorBoundary from "./RouteErrorBoundary";

const lazyRoute = (load: () => Promise<{ default: ComponentType<any> }>) =>
  async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  { path: "/", lazy: lazyRoute(() => import("../pages/public/Landing")), ErrorBoundary: RouteErrorBoundary },
  { path: "/login", lazy: lazyRoute(() => import("../pages/public/Login")) },
  { path: "/register", lazy: lazyRoute(() => import("../pages/public/Register")) },
  { path: "/forgot-password", lazy: lazyRoute(() => import("../pages/public/ForgotPassword")) },
  { path: "/verify-email", lazy: lazyRoute(() => import("../pages/public/VerifyEmail")) },

  
{
  path: "/student",
  lazy: lazyRoute(() => import("../layouts/StudentLayout")),
  ErrorBoundary: RouteErrorBoundary,
  children: [
    { index: true, loader: () => redirect("/student/dashboard") },
    { path: "dashboard", lazy: lazyRoute(() => import("../pages/student/Dashboard")) },
    { path: "profile", lazy: lazyRoute(() => import("../pages/student/Profile")) },

    { path: "resume", lazy: lazyRoute(() => import("../pages/student/MyResume")) },
    { path: "resume/create", lazy: lazyRoute(() => import("../pages/student/Resume")) },
    { path: "resume/upload", lazy: lazyRoute(() => import("../pages/student/ResumeUpload")) },
    { path: "resume/view", lazy: lazyRoute(() => import("../pages/student/ResumeView")) },

    { path: "jobs", lazy: lazyRoute(() => import("../pages/student/JobDiscovery")) },
    { path: "jobs/:id", lazy: lazyRoute(() => import("../pages/student/JobDetails")) },
    { path: "applications", lazy: lazyRoute(() => import("../pages/student/Applications")) },
    { path: "saved", lazy: lazyRoute(() => import("../pages/student/SavedJobs")) },
    { path: "recommended", lazy: lazyRoute(() => import("../pages/student/Recommended")) },
    { path: "messages", lazy: lazyRoute(() => import("../pages/student/Messages")) },
    { path: "notifications", lazy: lazyRoute(() => import("../pages/student/Notifications")) },
    { path: "settings", lazy: lazyRoute(() => import("../pages/student/Settings")) },
    { path: "ai", lazy: lazyRoute(() => import("../pages/student/AIAssistant")) },
  ],
},
  {
    path: "/company",
    lazy: lazyRoute(() => import("../layouts/CompanyLayout")),
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, loader: () => redirect("/company/dashboard") },
      { path: "dashboard", lazy: lazyRoute(() => import("../pages/company/Dashboard")) },
      { path: "profile", lazy: lazyRoute(() => import("../pages/company/Profile")) },
      { path: "jobs", lazy: lazyRoute(() => import("../pages/company/ManageJobs")) },
      { path: "jobs/create", lazy: lazyRoute(() => import("../pages/company/CreateJob")) },
      { path: "jobs/edit/:id", lazy: lazyRoute(() => import("../pages/company/EditJob")) },
      { path: "jobs/:id", lazy: lazyRoute(() => import("../pages/company/JobDetails")) },
      { path: "applicants", lazy: lazyRoute(() => import("../pages/company/Applicants")) },
      { path: "shortlisted", lazy: lazyRoute(() => import("../pages/company/Shortlisted")) },
      { path: "applicants/:id", lazy: lazyRoute(() => import("../pages/company/CandidateDetails")) },
      { path: "recommended", lazy: lazyRoute(() => import("../pages/company/RecommendedCandidates")) },
      { path: "interviews", lazy: lazyRoute(() => import("../pages/company/Interviews")) },
      { path: "reports", lazy: lazyRoute(() => import("../pages/company/Reports")) },
      { path: "messages", lazy: lazyRoute(() => import("../pages/company/Messages")) },
      { path: "notifications", lazy: lazyRoute(() => import("../pages/company/Notifications")) },
      { path: "settings", lazy: lazyRoute(() => import("../pages/company/Settings")) },
      { path: "jobs/:id/shortlisted", lazy: lazyRoute(() => import("../pages/company/Shortlisted")) },
     
    ],
  },

  {
    
  path: "/admin",
  lazy: lazyRoute(() => import("../layouts/AdminLayout")),
  ErrorBoundary: RouteErrorBoundary,
  children: [
    { index: true, loader: () => redirect("/admin/dashboard") },
    { path: "dashboard", lazy: lazyRoute(() => import("../pages/admin/Dashboard")) },
    { path: "students", lazy: lazyRoute(() => import("../pages/admin/Students")) },
    { path: "companies", lazy: lazyRoute(() => import("../pages/admin/Companies")) },
    { path: "categories", lazy: lazyRoute(() => import("../pages/admin/Categories")) },
    { path: "skills", lazy: lazyRoute(() => import("../pages/admin/Skills")) },
    { path: "jobs", lazy: lazyRoute(() => import("../pages/admin/Jobs")) },
    { path: "applications", lazy: lazyRoute(() => import("../pages/admin/Applications")) },
    { path: "analytics", lazy: lazyRoute(() => import("../pages/admin/Analytics")) },
    { path: "system-logs", lazy: lazyRoute(() => import("../pages/admin/SystemLogs")) },
    { path: "reports", lazy: lazyRoute(() => import("../pages/admin/Reports")) },
    { path: "notifications", lazy: lazyRoute(() => import("../pages/admin/Notifications")) },
    { path: "settings", lazy: lazyRoute(() => import("../pages/admin/Settings")) },
  ],
  },

  { path: "*", loader: () => redirect("/") },
]);
