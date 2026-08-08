import { useNavigate } from "react-router";
import {
  Upload,
  PenLine,
  ArrowRight,
  FileText,
} from "lucide-react";
import { C, F } from "../../constants/tokens";

export default function MyResume() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100%",
        fontFamily: F,
        color: C.text,
        padding: "10px 0 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 12px",
              borderRadius: 999,
              background: C.accent + "12",
              color: C.accent,
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Resume Builder
          </div>

        <h1
  style={{
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: C.text,
  }}
>
  Build Your Resume
</h1>

          <p
            style={{
              margin: "8px auto 0",
              maxWidth: 520,
              fontSize: 14,
              lineHeight: 1.6,
              color: C.textSec,
            }}
          >
            Create a professional resume that showcases your skills,
            experience, and achievements.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 18,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/student/resume/upload")}
            style={{
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: F,
              minHeight: 280,
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.boxShadow =
                "0 14px 30px rgba(15, 23, 42, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: C.accent + "08",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: C.accent + "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Upload size={24} color={C.accent} />
              </div>

              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={17} color={C.textMuted} />
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <h2
                style={{
                  margin: "24px 0 8px",
                  fontSize: 19,
                  fontWeight: 750,
                  color: C.text,
                }}
              >
                Upload Existing CV
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  color: C.textSec,
                  maxWidth: 380,
                }}
              >
                Already have a CV? Upload your PDF or DOCX and let
                CareerBridge extract your information for you.
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 20,
                  color: C.accent,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                Upload your CV
                <ArrowRight size={14} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/resume/create")}
            style={{
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: F,
              minHeight: 280,
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = C.success;
              e.currentTarget.style.boxShadow =
                "0 14px 30px rgba(15, 23, 42, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: C.success + "08",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: C.success + "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PenLine size={24} color={C.success} />
              </div>

              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={17} color={C.textMuted} />
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <h2
                style={{
                  margin: "24px 0 8px",
                  fontSize: 19,
                  fontWeight: 750,
                  color: C.text,
                }}
              >
                Create New Resume
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  color: C.textSec,
                  maxWidth: 380,
                }}
              >
                Start from scratch and build your professional resume
                step by step with our easy-to-use builder.
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 20,
                  color: C.success,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                Start building
                <ArrowRight size={14} />
              </div>
            </div>
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "13px 18px",
            borderRadius: 12,
            background: "#f8fafc",
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: C.textSec,
            fontSize: 12,
          }}
        >
          <FileText size={15} color={C.textMuted} />
          Your resume can be saved, edited, previewed, and downloaded
          as a PDF anytime.
        </div>
      </div>
    </div>
  );
}