import { MapPin, Calendar, UserCheck, UserX } from "lucide-react";
import { C, F } from "../../../constants/tokens";
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
  onToggleSelect,
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

  const rejectColor = "#ef4444";
  const rejectBorder = "#fee2e2";
  const buttonBackground = "#ffffff";
  const secondaryBackground = "#f3f4f6";
  const secondaryBorder = "#e5e7eb";
  const shortlistedBackground = "#ecfdf5";
  const shortlistedColor = "#059669";
  const shortlistedBorder = "#a7f3d0";

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
        justifyContent: "space-between",
      }}
      onClick={onView}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.boxShadow =
          "0 8px 20px rgba(0, 0, 0, 0.06)";

        if (!selected) {
          e.currentTarget.style.borderColor = C.accent + "50";
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = selected
          ? C.accent
          : C.border;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            onClick={(e: React.MouseEvent<HTMLInputElement>) =>
              e.stopPropagation()
            }
            style={{
              width: 16,
              height: 16,
              marginTop: 4,
              flexShrink: 0,
              cursor: "pointer",
              accentColor: C.accent,
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
            flexShrink: 0,
          }}
        />

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 2,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.text,
                margin: 0,
                fontFamily: F,
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
              textOverflow: "ellipsis",
            }}
          >
            {title}
            {title && university ? " · " : ""}
            {university}
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
                gap: 3,
              }}
            >
              <MapPin size={11} />
              {location}
            </p>
          )}
        </div>

        <MatchRing v={Number(match)} sz={46} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {skills.slice(0, 3).map((skill: any, index: number) => {
          const skillName =
            typeof skill === "string" ? skill : skill.name;

          return (
            <span
              key={`${skillName}-${index}`}
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                background: C.divider || "#f3f4f6",
                fontSize: 11,
                fontWeight: 500,
                color: C.textSec,
                fontFamily: F,
              }}
            >
              {skillName}
            </span>
          );
        })}

        {skills.length > 3 && (
          <span
            style={{
              padding: "3px 9px",
              borderRadius: 6,
              background: C.divider || "#f3f4f6",
              fontSize: 11,
              fontWeight: 600,
              color: C.textSec,
              fontFamily: F,
            }}
          >
            +{skills.length - 3}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Btn
          size="sm"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onView();
          }}
          style={{
            fontSize: 12,
            padding: "0 12px",
            height: 34,
            whiteSpace: "nowrap",
          }}
        >
          View
        </Btn>

        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onInterview?.();
          }}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: secondaryBackground,
            color: C.text,
            border: `1px solid ${secondaryBorder}`,
            cursor: "pointer",
            fontFamily: F,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            whiteSpace: "nowrap",
            padding: "0 8px",
          }}
        >
          <Calendar size={13} />
          <span>Schedule</span>
        </button>

        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onShortlist?.();
          }}
          disabled={isShortlisted || isFinished}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: isShortlisted
              ? shortlistedBackground
              : buttonBackground,
            color: isShortlisted
              ? shortlistedColor
              : C.text,
            border: `1px solid ${
              isShortlisted
                ? shortlistedBorder
                : secondaryBorder
            }`,
            cursor:
              onShortlist && !isShortlisted && !isFinished
                ? "pointer"
                : "default",
            fontFamily: F,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            whiteSpace: "nowrap",
            padding: "0 8px",
          }}
        >
          <UserCheck size={13} />
          <span>
            {isFinished
              ? status
              : isShortlisted
              ? "Shortlisted"
              : "Shortlist"}
          </span>
        </button>

        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onReject?.();
          }}
          disabled={!onReject}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: 8,
            background: buttonBackground,
            color: rejectColor,
            border: `1px solid ${rejectBorder}`,
            cursor: onReject ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: onReject ? 1 : 0.5,
          }}
        >
          <UserX size={13} />
        </button>
      </div>
    </div>
  );
}