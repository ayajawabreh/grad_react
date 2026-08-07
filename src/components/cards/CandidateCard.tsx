import { MapPin, Calendar, UserCheck, UserX } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { MatchRing, SBadge, Btn } from "../ui";

interface CandidateCardProps {
  c: any;
  onView: () => void;
  onShortlist?: () => void;
  onInterview?: () => void;
  onReject?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function CandidateCard({
  c,
  onView,
  onShortlist,
  onInterview,
  onReject,
  selected,
  onToggleSelect
}: CandidateCardProps) {
  const name = c.name || c.student?.name || "Applicant";
  const title = c.title || c.student?.title || "";
  const university = c.university || c.student?.university || "";
  const location = c.location || c.student?.location || "";
  const avatar = c.avatar || c.student?.avatar || "/avatar.png";
  const status = c.status || "Applied";
  const match = c.match ?? c.match_score ?? 0;
  const skills = c.skills || c.student?.skills || [];

  const isShortlisted = status === "Shortlisted";
  const isFinished = status === "Accepted" || status === "Rejected";

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: `1px solid ${selected ? C.accent : C.border}`,
        background: C.surface,
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.06)";
        if (!selected) {
          e.currentTarget.style.borderColor = C.accent + "50";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = selected ? C.accent : C.border;
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 14
          }}
        >
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              onClick={e => e.stopPropagation()}
              style={{
                width: 16,
                height: 16,
                marginTop: 4,
                flexShrink: 0,
                cursor: "pointer",
                accentColor: C.accent
              }}
            />
          )}

          <img
            src={avatar}
            alt={name}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              objectFit: "cover",
              flexShrink: 0
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 2,
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
                {name}
              </p>

              <SBadge s={status} />
            </div>

            <p
              style={{
                fontSize: 12,
                color: C.textSec,
                margin: 0,
                fontFamily: F,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {title}{title && university ? " · " : ""}{university}
            </p>

            {location && (
              <p
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  margin: "3px 0 0",
                  fontFamily: F,
                  display: "flex",
                  alignItems: "center",
                  gap: 3
                }}
              >
                <MapPin size={11} />
                {location}
              </p>
            )}
          </div>

          <MatchRing
            v={Number(match)}
            sz={46}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap"
          }}
        >
          {skills.slice(0, 3).map((skill: any) => {
            const skillName = typeof skill === "string" ? skill : skill.name;
            return (
              <span
                key={skillName}
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  background: C.divider || "#f3f4f6",
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.textSec,
                  fontFamily: F
                }}
              >
                {skillName}
              </span>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
      >
        <Btn
          size="sm"
          onClick={onView}
          style={{
            fontSize: 12,
            padding: "0 12px",
            height: 34,
            whiteSpace: "nowrap"
          }}
        >
          View
        </Btn>

        <button
          onClick={() => {
            console.log("Schedule clicked");
            console.log(c);
            onInterview?.();
          }}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: "#f3f4f6",
            color: C.text,
            border: "1px solid #e5e7eb",
            cursor: "pointer",
            fontFamily: F,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            whiteSpace: "nowrap",
            padding: "0 8px"
          }}
        >
          <Calendar size={13} />
          <span>Schedule</span>
        </button>

        <button
          onClick={onShortlist || undefined}
          disabled={isShortlisted || isFinished}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: isShortlisted ? "#ecfdf5" : "#ffffff",
            color: isShortlisted ? "#059669" : C.text,
            border: `1px solid ${isShortlisted ? "#a7f3d0" : "#e5e7eb"}`,
            cursor: onShortlist && !isShortlisted && !isFinished ? "pointer" : "default",
            fontFamily: F,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            whiteSpace: "nowrap",
            padding: "0 8px"
          }}
        >
          <UserCheck size={13} />
          <span>
  {
    isFinished
      ? status
      : isShortlisted
      ? "Shortlisted"
      : "Shortlist"
  }
</span>
        </button>

        <button
          onClick={onReject || undefined}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: 8,
            background: "#ffffff",
            color: "#ef4444",
            border: "1px solid #fee2e2",
            cursor: onReject ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: onReject ? 1 : 0.5
          }}
        >
          <UserX size={13} />
        </button>
      </div>
    </div>
  );
}