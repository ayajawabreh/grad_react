import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { CandidateCard } from "../../components/cards/CandidateCard";
import { ArrowLeft, TrendingUp, Eye, Users, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getJobDetails, getJobApplicants } from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

export default function CompanyJobDetails() {
  const applicationsSyncVersion = useSyncResourceVersion("applications");
  const jobsSyncVersion = useSyncResourceVersion("jobs");
  const nav = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id) {
          const jobData = await getJobDetails(Number(id));
          setJob(jobData);

          try {
            const applicantsData = await getJobApplicants(Number(id));
            setApplicants(applicantsData || []);
          } catch (err) {
            console.error("Error fetching applicants:", err);
            setApplicants([]);
          }
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, applicationsSyncVersion, jobsSyncVersion]);

  if (loading) {
    return (
      <div style={{ fontFamily: F, color: C.text, padding: 40 }}>
        Loading...
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ fontFamily: F, color: C.text, padding: 40 }}>
        Job not found
      </div>
    );
  }

  const weeklyData = job.weekly_data ?? [];
  const recentApplicantsList = job.recent_applicants ?? applicants;

  const totalApplicantsCount =
    job.stats?.applicants ??
    job.applicants_count ??
    (applicants.length > 0 ? applicants.length : 0);

  const stats = {
    applied: job.stats?.applicants ?? totalApplicantsCount,
    interview: job.stats?.interview ?? applicants.filter((a: any) => a.status === "Interview").length ?? 0,
    shortlisted: job.stats?.shortlisted ?? applicants.filter((a: any) => a.status === "Shortlisted" || a.is_shortlisted).length ?? 0,
    hired: job.stats?.hired ?? applicants.filter((a: any) => a.status === "Hired").length ?? 0,
  };

  const pipelineCards = [
    { title: "Applied", value: stats.applied, color: C.info },
    { title: "Interview", value: stats.interview, color: C.purple },
    { title: "Shortlisted", value: stats.shortlisted, color: C.accent },
    { title: "Hired", value: stats.hired, color: "#2A6B54" },
  ];

  const companyLetter = job.company?.company_name?.[0] ?? job.title?.[0] ?? "C";

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <Btn
        v="ghost"
        icon={ArrowLeft}
        onClick={() => nav("/company/jobs")}
        style={{ marginBottom: 20 }}
      >
        Back to Jobs
      </Btn>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${C.border}`,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flex: 1, minWidth: 300 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: `${C.accent}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `1px solid ${C.accent}33`,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>
                {companyLetter}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                  {job.title}
                </h1>
                <span
                  style={{
                    padding: "4px 12px",
                    background: `${C.success}15`,
                    color: C.success,
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Open
                </span>
              </div>

              <p
                style={{
                  color: C.textSec,
                  margin: "0 0 12px 0",
                  fontSize: 14,
                }}
              >
                {[job.location, job.employment_type].filter(Boolean).join(" · ")}
              </p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(job.skills ?? []).map((skill: any) => (
                  <span
                    key={skill.id ?? skill.name ?? skill}
                    style={{
                      padding: "4px 10px",
                      background: C.accentLight,
                      color: C.accentHover,
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {skill.name ?? skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn
              v="primary"
              icon={UserCheck}
              onClick={() => nav(`/company/jobs/${job.id}/shortlisted`)}
              style={{ background: C.accent, color: "#fff" }}
            >
              View Shortlisted Candidates
            </Btn>

            <Btn
              v="outline"
              onClick={() => nav(`/company/jobs/edit/${job.id}`)}
            >
              Edit Job
            </Btn>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
          Application Pipeline
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {pipelineCards.map((item) => (
            <div
              key={item.title}
              style={{
                background: C.surface,
                borderRadius: 16,
                padding: "20px 16px",
                border: `1px solid ${C.border}`,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
          Job Performance
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {[
            {
              icon: Eye,
              title: "Total Views",
              value: job.views ?? 0,
              color: C.info,
            },
            {
              icon: Users,
              title: "Applicants",
              value: totalApplicantsCount,
              color: C.accent,
            },
            {
              icon: TrendingUp,
              title: "Conversion",
              value:
                job.views > 0
                  ? `${Math.round((totalApplicantsCount / job.views) * 100)}%`
                  : "0%",
              color: C.success,
            },
          ].map(({ icon: Icon, title, value, color }) => (
            <div
              key={title}
              style={{
                background: C.surface,
                borderRadius: 16,
                padding: 16,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: `${color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>
                  {title}
                </p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {weeklyData.length > 0 && (
          <div
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${C.border}`,
            }}
          >
            <h4 style={{ fontSize: 14, margin: "0 0 16px 0", color: C.textSec }}>
              Weekly Applications Overview
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="apps" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
          Recent Applicants
        </h3>

        {recentApplicantsList.length === 0 ? (
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              padding: 32,
              border: `1px solid ${C.border}`,
              textAlign: "center",
              color: C.textSec,
            }}
          >
            No applicants yet for this job.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {recentApplicantsList.map((c: any) => {
              const formattedCandidate = {
                ...c,
                name: c.name ?? c.student?.user?.name ?? c.user?.name ?? "Applicant",
                headline: c.headline ?? c.student?.headline ?? c.role ?? "",
                match: c.match ?? c.match_score ?? c.pivot?.match_score ?? 0,
                avatar: c.avatar ?? c.student?.user?.avatar ?? c.profile_photo_url ?? null,
              };

              return (
                <CandidateCard
                  key={c.id}
                  c={formattedCandidate}
                  onView={() => nav(`/company/applicants/${c.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
