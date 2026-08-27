import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Upload,
  FileText,
  Briefcase,
  Sparkles,
  PenLine,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";

interface ExistingResume {
  id: number;
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
}

export default function ResumeUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const resumeReturnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ||
    sessionStorage.getItem("cb_resume_return_to");

  const returnAfterResume = () => {
    if (resumeReturnTo) {
      sessionStorage.removeItem("cb_resume_return_to");
      navigate(resumeReturnTo);
      return;
    }
    navigate("/student/resume");
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [existingResume, setExistingResume] =
    useState<ExistingResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingResume, setLoadingResume] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<any>(null);
  const [uploadServiceUnavailable, setUploadServiceUnavailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResume = async () => {
      try {
        setLoadingResume(true);

        const response = await API.get("/student/resume");

        console.log("Existing resume:", response.data);

        if (response.data?.file_path) {
          setExistingResume(response.data);
        } else {
          setExistingResume(null);
        }
      } catch (err) {
        console.error("Failed to load resume:", err);
        setExistingResume(null);
      } finally {
        setLoadingResume(false);
      }
    };

    loadResume();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF or DOCX file.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx"].includes(extension)) {
      setError("Please select a PDF or DOCX file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The CV must not be larger than 5 MB.");
      return;
    }

    setLoading(true);
    setError("");
    setUploadServiceUnavailable(false);

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

      if (response.data?.resume) {
        setUploadedResume(response.data.resume);
        setExistingResume({
          ...response.data.resume,
          file_path: response.data.file_path,
          file_url: response.data.file_url,
          file_name:
            response.data.file_name || file.name,
        });
      }

      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setUploaded(true);
    } catch (err: any) {
      console.error("Upload CV error:", err);
      const status = err?.response?.status;
      const fileErrors = err?.response?.data?.errors?.file;
      setUploadServiceUnavailable(status === 503);
      setError(
        status === 503
          ? "Resume parsing is temporarily unavailable. Please try again."
          : (Array.isArray(fileErrors) ? fileErrors.join(" ") : fileErrors) ||
            err?.response?.data?.message ||
            "Could not upload the CV."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingResume?.id) return;

    try {
      setDeleting(true);
      setError("");

      await API.delete(
        `/student/resume/${existingResume.id}`
      );

      setExistingResume(null);
      setFile(null);
      setUploaded(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Delete CV error:", err);

      setError(
        err?.response?.data?.message ||
          "Could not delete the CV."
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * =========================
   * Upload Success Screen
   * =========================
   */

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
        {/* Back to Resume */}
        <button
          type="button"
          onClick={returnAfterResume}
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
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          {resumeReturnTo ? "Back to Job" : "Back to My Resume"}
        </button>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "42px 32px",
            textAlign: "center",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          {/* Success Icon */}
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
            Your CV has been uploaded and your
            information has been extracted successfully.
            You can now explore available jobs or view
            jobs matched to your skills.
          </p>

          {/* Action Buttons */}
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
              onClick={returnAfterResume}
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
              {resumeReturnTo ? "Back to Job" : "Browse Jobs"}
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

          {/* Edit Resume */}
          <button
            type="button"
            onClick={() =>
                navigate("/student/resume/create", { state: { returnTo: resumeReturnTo, uploadedResume } })
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

  /*
   * =========================
   * Upload Screen
   * =========================
   */

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        fontFamily: F,
        padding: "20px 0 50px",
      }}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={() =>
          navigate("/student/resume")
        }
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
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Page Title */}
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
        Upload your existing CV and CareerBridge will
        extract your information automatically.
      </p>

      {/* Upload Area */}
      <div
        onClick={() =>
          fileInputRef.current?.click()
        }
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

      {/* Loading Existing Resume */}
      {loadingResume && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: C.textSec,
            fontSize: 13,
          }}
        >
          <Loader2
            size={18}
            style={{
              animation:
                "spin 1s linear infinite",
            }}
          />

          Loading uploaded CV...
        </div>
      )}

      {/* Existing Resume */}
      {existingResume && !loadingResume && (
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
          <FileText
            size={22}
            color={C.accent}
          />

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {existingResume.file_name ||
                existingResume.file_path
                  ?.split("/")
                  .pop() ||
                "Uploaded CV"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: C.textSec,
                marginTop: 3,
              }}
            >
              Uploaded CV
            </div>
          </div>

          {/* View */}
          {existingResume.file_url && (
            <button
              type="button"
              onClick={() =>
                window.open(
                  existingResume.file_url!,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.text,
                cursor: "pointer",
                fontFamily: F,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              View
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#fee2e2",
              color: "#dc2626",
              cursor: deleting
                ? "not-allowed"
                : "pointer",
              fontFamily: F,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {deleting ? (
              <Loader2 size={15} />
            ) : (
              <Trash2 size={15} />
            )}

            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      )}

      {/* Selected File */}
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
          <FileText
            size={22}
            color={C.accent}
          />

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

      {/* Error */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span>{error}</span>
            {uploadServiceUnavailable && (
              <button type="button" onClick={handleUpload} disabled={loading} style={{ border: `1px solid ${C.error}`, background: "#fff", color: C.error, borderRadius: 8, padding: "6px 10px", fontFamily: F, fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
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
            !file || loading
              ? C.textMuted
              : C.accent,
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
