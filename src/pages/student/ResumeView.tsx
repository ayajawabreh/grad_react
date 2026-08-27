import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import {
  ArrowLeft,
  Download,
  Share2,
  Mail,
  Phone,
  MapPin,
  Check,
  ExternalLink,
} from "lucide-react";
import { API } from "../../imports/api";
import ClassicResumeTemplate from "../../components/resume/ClassicResumeTemplate";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "2px",
          color: "#111",
          textTransform: "uppercase",
          borderBottom: "1px solid #eaeaea",
          paddingBottom: 6,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ResumeView() {
  const nav = useNavigate();
  const [resume, setResume] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    try {
      const response = await API.get("/student/resume");
      console.log(response.data);
      setResume(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
  };

  const handleDownloadPdf = async () => {
    if (!resume?.id) {
      showToast("Please save your resume from the editor first.");
      return;
    }

    setDownloadingPdf(true);

    try {
      const response = await API.get(`/student/resume/${resume.id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${(resume.full_name || "resume").replace(
        /\s+/g,
        "_"
      )}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showToast("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    const shareData = {
      title: `${resume?.full_name || "My"} Resume`,
      text: "Check out my resume on HireMatch",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!resume) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          fontFamily: F,
          color: C.textSec,
        }}
      >
        Loading Resume...
      </div>
    );
  }

  const parseArrayData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const education = parseArrayData(resume.education);
  const experience = parseArrayData(resume.experience);
  const skills = parseArrayData(resume.skills);
  const languages = parseArrayData(resume.languages);
  const certificates = parseArrayData(resume.certificates);
  const projects = parseArrayData(resume.projects);

  const educationData =
    education.length > 0
      ? education
      : [
          {
            degree: "Bachelor's Degree",
            field_of_study: resume.major,
            university: resume.university,
            end_date: resume.graduation_year,
          },
        ];

  const splitFullName = (name: string) => {
    if (!name) {
      return { first: "", last: "" };
    }

    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return {
        first: parts[0],
        last: "",
      };
    }

    const first = parts[0];
    const last = parts.slice(1).join(" ");

    return {
      first,
      last,
    };
  };

  const { first, last } = splitFullName(resume.full_name || "");
  const avatar = resume.avatar || null;

  return (
    <div
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#1a1a1a",
        padding: "30px 0",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Check size={16} />
          {toast.message}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 850,
          margin: "0 auto 24px auto",
          padding: "0 15px",
        }}
      >
        <Btn
          v="ghost"
          icon={ArrowLeft}
          onClick={() => nav("/student/resume/create")}
        >
          Back to Editor
        </Btn>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn v="outline" icon={Share2} onClick={handleShare}>
            Share
          </Btn>

          <Btn
            v="primary"
            icon={Download}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? "Preparing..." : "Download PDF"}
          </Btn>
        </div>
      </div>

      <ClassicResumeTemplate resume={resume} />

      <div
        style={{
          display: "none",
          maxWidth: 850,
          margin: "0 auto",
          background: "#fff",
          padding: "55px 50px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          borderRadius: "4px",
          minHeight: "1120px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 50,
          }}
        >
          <div>
            <div
              style={{
                width: "2px",
                height: "45px",
                background: "#1a1a1a",
                marginBottom: 12,
              }}
            />

            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 300,
                letterSpacing: "8px",
                color: "#666",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              {first}
            </h1>

            <h1
              style={{
                margin: "4px 0 0 0",
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: "10px",
                color: "#111",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {last}
            </h1>

            <p
              style={{
                margin: "16px 0 0 0",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "4px",
                color: "#555",
                textTransform: "uppercase",
              }}
            >
              {resume.professional_title}
            </p>
          </div>

          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid #eaeaea",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={resume.full_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  resume.full_name || "User"
                )}&size=120&background=f1f3f5&color=1a1a1a`}
                alt="default avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: "50px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 35,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                fontSize: 12,
                color: "#444",
              }}
            >
              {resume.location && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <MapPin size={14} style={{ color: "#222" }} />
                  {resume.location}
                </span>
              )}

              {resume.phone && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Phone size={14} style={{ color: "#222" }} />
                  {resume.phone}
                </span>
              )}

              {resume.email && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Mail size={14} style={{ color: "#222" }} />
                  <span style={{ wordBreak: "break-all" }}>
                    {resume.email}
                  </span>
                </span>
              )}

              {resume.linkedin && (
                <span
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 12,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#111" }}>
                    LinkedIn:
                  </span>
                  <span style={{ color: "#555" }}>
                    {resume.linkedin}
                  </span>
                </span>
              )}

              {resume.github && (
                <span
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 12,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#111" }}>
                    GitHub:
                  </span>
                  <span style={{ color: "#555" }}>
                    {resume.github}
                  </span>
                </span>
              )}

              {resume.portfolio && (
                <span
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 12,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#111" }}>
                    Portfolio:
                  </span>
                  <span style={{ color: "#555" }}>
                    {resume.portfolio}
                  </span>
                </span>
              )}
            </div>

            {skills.length > 0 && (
              <Section title="SKILLS">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      margin: "0 0 5px 0",
                      color: "#111",
                    }}
                  >
                    PROFESSIONAL
                  </p>

                  {skills.map((s: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12,
                        color: "#444",
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          border: "1px solid #111",
                          background: "#fff",
                        }}
                      />

                      {typeof s === "object" ? s.name : s}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {educationData.length > 0 && (
              <Section title="EDUCATION">
                {educationData.map((e: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: 15,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          border: "2px solid #111",
                          background: "#fff",
                          zIndex: 2,
                        }}
                      />

                      {index !== educationData.length - 1 && (
                        <div
                          style={{
                            width: "1px",
                            flexGrow: 1,
                            background: "#111",
                            margin: "4px 0",
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        paddingBottom:
                          index !== educationData.length - 1 ? 15 : 0,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#111",
                          textTransform: "uppercase",
                          lineHeight: 1.3,
                          letterSpacing: "0.5px",
                        }}
                      >
                        {e.degree}
                        {e.field_of_study &&
                          ` IN ${e.field_of_study}`}
                      </p>

                      <p
                        style={{
                          margin: "4px 0 2px 0",
                          fontSize: 12,
                          color: "#444",
                        }}
                      >
                        {e.university || e.institution}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "#666",
                        }}
                      >
                        Graduated:{" "}
                        {e.end_date ||
                          resume.graduation_year ||
                          "Present"}
                      </p>

                      {resume.gpa && (
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: 11,
                            color: "#666",
                            fontWeight: 500,
                          }}
                        >
                          GPA: {resume.gpa}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {languages.length > 0 && (
              <Section title="LANGUAGES">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {languages.map((l: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12,
                        color: "#444",
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#444",
                        }}
                      />

                      <span>
                        <strong
                          style={{
                            color: "#111",
                            fontWeight: 600,
                          }}
                        >
                          {l.language || l.name || l}
                        </strong>
                        {l.level && ` — ${l.level}`}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {certificates.length > 0 && (
              <Section title="CERTIFICATES">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {certificates.map((c: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        fontSize: 12,
                      }}
                    >
                      <strong
                        style={{
                          color: "#111",
                          fontWeight: 600,
                        }}
                      >
                        {c.name || c.title || c}
                      </strong>

                      {c.issuer && (
                        <p
                          style={{
                            margin: "2px 0 0 0",
                            color: "#666",
                          }}
                        >
                          {c.issuer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 35,
            }}
          >
            {resume.summary && (
              <Section title="PROFILE">
                <p
                  style={{
                    fontSize: 12,
                    color: "#444",
                    lineHeight: 1.7,
                    margin: 0,
                    textAlign: "justify",
                    letterSpacing: "0.2px",
                  }}
                >
                  {resume.summary}
                </p>
              </Section>
            )}

            {experience.length > 0 && (
              <Section title="EXPERIENCE">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {experience.map((e: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: 18,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            border: "2px solid #111",
                            background: "#fff",
                            zIndex: 2,
                          }}
                        />

                        {index !== experience.length - 1 && (
                          <div
                            style={{
                              width: "1px",
                              flexGrow: 1,
                              background: "#111",
                              margin: "4px 0",
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          flexGrow: 1,
                          paddingBottom:
                            index !== experience.length - 1 ? 20 : 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: 3,
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#111",
                            }}
                          >
                            {typeof e === "string"
                              ? e
                              : e.title ||
                                e.position ||
                                "Experience"}
                          </h4>

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#666",
                            }}
                          >
                            {e.start_date} – {e.end_date || "Present"}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: "0 0 10px 0",
                            fontSize: 11,
                            color: "#555",
                            fontWeight: 600,
                          }}
                        >
                          {typeof e === "object" ? e.company : ""}
                        </p>

                        <p
                          style={{
                            fontSize: 12,
                            color: "#444",
                            lineHeight: 1.6,
                            margin: 0,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {typeof e === "object" ? e.description : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {projects.length > 0 && (
              <Section title="PROJECTS">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                  }}
                >
                  {projects.map((p: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        borderLeft: "2px solid #eaeaea",
                        paddingLeft: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#111",
                          }}
                        >
                          {p.name || p.title}
                        </h4>

                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              color: "#0066cc",
                              textDecoration: "none",
                              fontWeight: 500,
                            }}
                          >
                            <ExternalLink size={12} />
                            View
                          </a>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: 12,
                          color: "#444",
                          lineHeight: 1.6,
                          margin: "6px 0 0 0",
                        }}
                      >
                        {p.description || p.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
