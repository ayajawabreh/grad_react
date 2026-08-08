import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  ArrowLeft,
  FileText,
  Briefcase,
  Sparkles,
  PenLine,
} from "lucide-react";
import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF or DOCX file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        "/student/resume/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Uploaded Resume:", response.data);

      setUploaded(true);
    } catch (err: any) {
      console.error("Upload CV error:", err);

      setError(
        err?.response?.data?.message ||
          "Could not upload the CV."
      );
    } finally {
      setLoading(false);
    }
  };

  if (uploaded) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          fontFamily: F,
          padding: "20px 0 50px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/student/resume")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            background: "transparent",
            color: C.textSec,
            cursor: "pointer",
            fontFamily: F,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 30,
          }}
        >
          <ArrowLeft size={17} />
          Back to My Resume
        </button>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "42px 32px",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#dcfce7",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            ✓
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: C.text,
            }}
          >
            CV Uploaded Successfully
          </h1>

          <p
            style={{
              margin: "10px auto 30px",
              maxWidth: 560,
              color: C.textSec,
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            Your CV has been uploaded and your information has
            been extracted successfully. You can now explore
            available jobs or view jobs matched to your skills.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/student/jobs")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.text,
                cursor: "pointer",
                fontFamily: F,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Briefcase size={17} />
              Browse Jobs
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/student/recommended")
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                background: C.accent,
                color: "#fff",
                cursor: "pointer",
                fontFamily: F,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Sparkles size={17} />
              Suggested Jobs
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/student/resume/create")
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              marginTop: 18,
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: C.textSec,
              cursor: "pointer",
              fontFamily: F,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <PenLine size={15} />
            Edit Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        fontFamily: F,
        padding: "20px 0 50px",
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/student/resume")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "none",
          background: "transparent",
          color: C.textSec,
          cursor: "pointer",
          fontFamily: F,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <h1
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 800,
          color: C.text,
        }}
      >
        Upload Your CV
      </h1>

      <p
        style={{
          margin: "8px 0 28px",
          color: C.textSec,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Upload your existing CV and CareerBridge will extract
        your information automatically.
      </p>

      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${C.border}`,
          borderRadius: 18,
          padding: "60px 30px",
          textAlign: "center",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        <Upload
          size={42}
          color={C.accent}
          style={{ marginBottom: 16 }}
        />

        <h3
          style={{
            margin: "0 0 8px",
            color: C.text,
            fontSize: 17,
          }}
        >
          Choose your CV
        </h3>

        <p
          style={{
            margin: 0,
            color: C.textSec,
            fontSize: 13,
          }}
        >
          PDF or DOCX • Maximum 5MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          hidden
          onChange={(e) => {
            const selectedFile =
              e.target.files?.[0] || null;

            setFile(selectedFile);
            setError("");
          }}
        />
      </div>

      {file && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FileText size={22} color={C.accent} />

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.text,
              }}
            >
              {file.name}
            </div>

            <div
              style={{
                fontSize: 12,
                color: C.textSec,
                marginTop: 3,
              }}
            >
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: C.error + "15",
            color: C.error,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          width: "100%",
          marginTop: 20,
          padding: 14,
          borderRadius: 14,
          border: "none",
          background:
            !file || loading ? C.textMuted : C.accent,
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor:
            !file || loading
              ? "not-allowed"
              : "pointer",
          fontFamily: F,
        }}
      >
        {loading
          ? "Uploading and analyzing..."
          : "Upload CV"}
      </button>
    </div>
  );
}