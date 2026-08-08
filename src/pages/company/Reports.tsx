import { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getJobsReport,
  getMonthlyApplicationsReport,
  getOverviewReport,
  getPipelineReport,
} from "../../imports/reports";

type Overview = {
  total_jobs: number;
  applications: number;
  interviews: number;
  hired_candidates: number;
};

type Job = {
  job_title: string;
  applications: number;
};

type MonthlyItem = {
  month: string;
  applications: number;
};

export default function Reports() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [monthly, setMonthly] = useState<MonthlyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverviewReport(),
      getJobsReport(),
      getPipelineReport(),
      getMonthlyApplicationsReport(),
    ])
      .then(([overviewData, jobsData, pipelineData, monthlyData]) => {
        setOverview(overviewData);
        setJobs(jobsData);
        setPipeline(pipelineData);
        setMonthly(monthlyData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-slate-600 font-semibold text-base">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  const cards = overview
    ? [
        {
          title: "Total Jobs",
          value: overview.total_jobs,
          icon: Briefcase,
          color: "bg-blue-50 text-blue-700",
        },
        {
          title: "Applications",
          value: overview.applications,
          icon: Users,
          color: "bg-indigo-50 text-indigo-700",
        },
        {
          title: "Interviews",
          value: overview.interviews,
          icon: Calendar,
          color: "bg-amber-50 text-amber-700",
        },
        {
          title: "Hired Candidates",
          value: overview.hired_candidates,
          icon: UserCheck,
          color: "bg-emerald-50 text-emerald-700",
        },
      ]
    : [];

  const pipelineConfig = [
    {
      key: "Accepted",
      label: "Accepted",
      color: "bg-emerald-600",
      textColor: "text-emerald-800",
      bgColor: "bg-emerald-100/70",
      icon: CheckCircle2,
    },
    {
      key: "Shortlisted",
      label: "Shortlisted",
      color: "bg-indigo-600",
      textColor: "text-indigo-800",
      bgColor: "bg-indigo-100/70",
      icon: Clock,
    },
    {
      key: "Rejected",
      label: "Rejected",
      color: "bg-rose-600",
      textColor: "text-rose-800",
      bgColor: "bg-rose-100/70",
      icon: XCircle,
    },
  ];

  const pipelineValues = pipelineConfig.map((item) => pipeline[item.key] || 0);
  const pipelineMax = Math.max(...pipelineValues, 1);
  const monthlyMax = Math.max(...monthly.map((m) => m.applications), 1);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-6 md:px-10 md:pb-10 space-y-10 bg-slate-50 min-h-screen text-slate-900 leading-normal">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track hiring performance and key metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {card.title}
                </span>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-4 text-slate-900 group-hover:text-indigo-600 transition-colors">
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Applications Per Job
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Overview of candidate volume by job title
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {jobs.length} Jobs
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm font-normal">
                No jobs available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-medium text-xs">
                      <th className="pb-3 px-3">Job Title</th>
                      <th className="pb-3 px-3 text-right">Applications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => (
                      <tr
                        key={job.job_title}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-normal text-slate-700">
                          {job.job_title}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="inline-block bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-medium">
                            {job.applications} applications
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 mb-0.5">
            Application Status
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Candidate progression across hiring stages
          </p>

          <div className="space-y-6">
            {pipelineConfig.map((item) => {
              const value = pipeline[item.key] || 0;
              const percentage = Math.round((value / pipelineMax) * 100);
              const StatusIcon = item.icon;

              return (
                <div key={item.key} className="space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${item.textColor}`} />
                      </div>
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {value.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Applications by Month
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Monthly trends in candidate submissions
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-slate-400" />
        </div>

        {monthly.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm font-normal">
            No monthly data available.
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3 md:gap-6 h-52 pt-8 px-2 border-b border-slate-200">
            {monthly.map((item) => {
              const heightPercent = Math.round(
                (item.applications / monthlyMax) * 100
              );
              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center h-full justify-end group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-medium text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                    {item.applications}
                  </span>

                  <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t-xl transition-all duration-500 ease-out"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span className="text-xs font-normal text-slate-500 mt-3 truncate w-full text-center">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}