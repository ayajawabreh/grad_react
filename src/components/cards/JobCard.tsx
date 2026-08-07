import { useState } from "react";
import { Briefcase, MapPin, Clock, Heart } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { MatchRing, SBadge, Btn } from "../ui";
import { API } from "../../imports/api";

interface JobCardProps {
  job: any;
  onView: () => void;
  onSave?: (jobId: string, isSavedNow: boolean) => void;
  showMatch?: boolean;
}

export function JobCard({ job, onView, onSave, showMatch = true }: JobCardProps) {
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(job?.saved || job?.is_saved));

  const companyName =
    job?.company?.company_name ||
    job?.company ||
    job?.company_name ||
    "Tech Solutions Co.";

  const title = job?.title || "Untitled Job";

  const location = job?.location || "Amman, Jordan";

  const salary = job?.salary
    ? typeof job.salary === "number" || !isNaN(job.salary)
      ? `$${Number(job.salary).toLocaleString()}`
      : job.salary
    : "Competitive";

  const empType = (
    job?.employment_type ||
    job?.type ||
    "Full-Time"
  )
    .replace("Full-time", "Full-Time")
    .replace("Part-time", "Part-Time");

  const workMode = (
    job?.mode ||
    job?.work_mode ||
    "Hybrid"
  ).replace("On-site", "On-Site");

  const jobColor = job?.color || C.accent || "#7c3aed";

  const jobStatus = job?.status || "Open";

  const matchScore = job?.match ?? 0;

  const postedTime = job?.posted || "Just now";

  const tagsArray = Array.isArray(job?.tags)
    ? job.tags
    : typeof job?.tags === "string"
    ? JSON.parse(job.tags)
    : ["Laravel", "Backend"];

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!job?.id) return;

    const newState = !isSaved;

    setIsSaved(newState);

    try {
      if (newState) {
        await API.post(`/jobs/${job.id}/save`);
      } else {
        await API.delete(`/jobs/${job.id}/save`);
      }

      onSave?.(job.id, newState);

    } catch (error) {
      console.error("Save job error:", error);

      setIsSaved(!newState);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        background: C.surface,
        cursor: "pointer",
        transition: "all 0.15s"
      }}
      onClick={onView}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = jobColor + "40";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 14
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: jobColor + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Briefcase size={20} style={{ color: jobColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
              flexWrap: "wrap"
            }}
          >
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.text,
                margin: 0,
                fontFamily: F
              }}
            >
              {title}
            </p>

            <SBadge s={jobStatus} />
          </div>

          <p
            style={{
              fontSize: 13,
              color: C.textSec,
              margin: 0,
              fontFamily: F
            }}
          >
            {companyName}
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 4,
              flexWrap: "wrap"
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: C.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: F
              }}
            >
              <MapPin size={11} />
              {location}
            </span>

            <span
              style={{
                fontSize: 12,
                color: C.textMuted,
                fontFamily: F
              }}
            >
              {empType} · {workMode}
            </span>
          </div>
        </div>

        {showMatch && (
          <MatchRing
            v={matchScore}
            sz={50}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap"
        }}
      >
        {tagsArray.map((t: string) => (
          <span
            key={t}
            style={{
              padding: "3px 10px",
              borderRadius: 7,
              background: C.divider,
              fontSize: 12,
              color: C.textSec,
              fontFamily: F
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            fontFamily: F
          }}
        >
          {salary}
        </span>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center"
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: C.textMuted,
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontFamily: F
            }}
          >
            <Clock size={11} />
            {postedTime}
          </span>

          {onSave && (
            <button
              onClick={handleToggleSave}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${isSaved ? C.accent : C.border}`,
                background: "transparent",
                cursor: "pointer",
                color: isSaved ? C.accent : C.textSec,
                fontFamily: F,
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease"
              }}
            >
              <Heart 
                size={12} 
                fill={isSaved ? C.accent : "none"} 
                color={isSaved ? C.accent : C.textSec} 
              />
              {isSaved ? "Saved" : "Save"}
            </button>
          )}

          <Btn
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onView();
            }}
          >
            View
          </Btn>
        </div>
      </div>
    </div>
  );
}