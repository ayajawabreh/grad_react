import { useEffect, useState } from "react";
import { C, F } from "../../constants/tokens";
import { Btn, SBadge } from "../../components/ui";
import { BadgeCheck, MapPin, Globe, Users, Building2 } from "lucide-react";
import { getCompanyProfile, updateCompanyProfile, getCompanyJobs } from "../../imports/api";

const TABS = ["Overview", "Culture", "Open Roles"] as const;

export default function CompanyProfile() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [editing, setEditing] = useState(false);

  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    company_name: "",
    industry: "",
    description: "",
    website: "",
    phone: "",
    location: "",
    company_size: "",
    stage: "",
    founded_year: "",
  });

  useEffect(() => {
    loadCompany();
    loadJobs();
  }, []);

  const loadCompany = async () => {
    try {
      const data = await getCompanyProfile();

      setCompany(data);

      setForm({
        company_name: data.name || "",
        industry: data.industry || "",
        description: data.about || "",
        website: data.website || "",
        phone: data.phone || "",
        location: data.location || "",
        company_size: data.size || "",
        stage: data.stage || "",
        founded_year: data.founded || "",
      });

    } catch (error) {
      console.log(error);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await getCompanyJobs();
      setJobs(data);

    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const saveProfile = async () => {
    try {
      const response = await updateCompanyProfile(form);

      setCompany(response.company);

      setEditing(false);

    } catch (error) {
      console.log(error);
    }
  };

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: F, color: C.text }}>

      <div style={{
        background: C.surface,
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        marginBottom: 24,
        padding: 24
      }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16
        }}>

          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: C.dark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{
              fontWeight: 800,
              fontSize: 24,
              color: C.accent
            }}>
              {company.name?.substring(0, 1)}
            </span>
          </div>

          <Btn
            v="primary"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </Btn>

        </div>

        <div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4
          }}>

            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0
            }}>
              {company.name}
            </h1>

            <BadgeCheck size={18} color={C.info} />

            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.info,
              background: C.infoBg,
              padding: "2px 8px",
              borderRadius: 99
            }}>
              Verified
            </span>

          </div>

          <p style={{
            color: C.textSec,
            margin: "0 0 10px",
            fontSize: 14
          }}>
            {company.industry} · {company.stage}
          </p>

          <div style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap"
          }}>

            <span style={{
              color: C.textSec,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <MapPin size={13} />
              {company.location}
            </span>

            <span style={{
              color: C.textSec,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <Users size={13} />
              {company.size}
            </span>

            <a
              href={`https://${company.website}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: C.accent,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
                textDecoration: "none"
              }}
            >
              <Globe size={13} />
              {company.website}
            </a>

          </div>

        </div>

      </div>

      {editing && (
        <div style={{
          background: C.surface,
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${C.accent}`,
          marginBottom: 24
        }}>

          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            margin: "0 0 16px"
          }}>
            Edit Company Info
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14
          }}>

            {Object.keys(form).map((key) => (

              <div key={key}>

                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textSec,
                  display: "block",
                  marginBottom: 6
                }}>
                  {key.replaceAll("_", " ")}
                </label>

                <input
                  name={key}
                  value={form[key] || ""}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    fontFamily: F,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: C.bg
                  }}
                />

              </div>

            ))}

          </div>

          <div style={{
            marginTop: 14,
            display: "flex",
            gap: 10
          }}>

            <Btn
              v="primary"
              onClick={saveProfile}
            >
              Save Changes
            </Btn>

            <Btn
              v="outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Btn>

          </div>

        </div>
      )}

      <div style={{
        background: C.surface,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        overflow: "hidden"
      }}>

        <div style={{
          display: "flex",
          gap: 4,
          padding: "16px 20px",
          borderBottom: `1px solid ${C.divider}`
        }}>

          {TABS.map((t) => (

            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 18px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: F,
                cursor: "pointer",
                border: "none",
                background: tab === t ? C.accent : "transparent",
                color: tab === t ? "#fff" : C.textSec
              }}
            >
              {t}
            </button>

          ))}

        </div>

        <div style={{ padding: 24 }}>

          {tab === "Overview" && (

            <div>

              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 10
              }}>
                About
              </h3>

              <p style={{
                color: C.textSec,
                fontSize: 14,
                lineHeight: 1.75,
                marginBottom: 24
              }}>
                {company.about}
              </p>

              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 14
              }}>
                Company Details
              </h3>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 14
              }}>

                {[
                  {
                    icon: Building2,
                    label: "Industry",
                    value: company.industry
                  },
                  {
                    icon: Users,
                    label: "Size",
                    value: company.size
                  },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: company.location
                  },
                  {
                    icon: Globe,
                    label: "Website",
                    value: company.website
                  },
                  {
                    icon: BadgeCheck,
                    label: "Stage",
                    value: company.stage
                  },
                  {
                    icon: Building2,
                    label: "Founded",
                    value: company.founded
                  },

                ].map(({ icon: Icon, label, value }) => (

                  <div
                    key={label}
                    style={{
                      padding: 16,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12
                    }}
                  >

                    <div style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 4
                    }}>

                      <Icon size={13} color={C.textSec} />

                      <span style={{
                        fontSize: 11,
                        color: C.textMuted,
                        fontWeight: 600
                      }}>
                        {label}
                      </span>

                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      {value}
                    </p>

                  </div>

                ))}

              </div>

            </div>

          )}

          {tab === "Culture" && (

            <div>

              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 12
              }}>
                Our Values
              </h3>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 24
              }}>

                {(company.values || []).map((v: string) => (

                  <div
                    key={v}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: C.textSec
                    }}
                  >

                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: C.accent,
                      flexShrink: 0
                    }} />

                    {v}

                  </div>

                ))}

              </div>

              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 12
              }}>
                Benefits
              </h3>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}>

                {(company.benefits || []).map((b: string) => (

                  <div
                    key={b}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: C.textSec
                    }}
                  >

                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: C.accent,
                      flexShrink: 0
                    }} />

                    {b}

                  </div>

                ))}

              </div>

            </div>

          )}

          {tab === "Open Roles" && (

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}>

              {jobs.map((job: any) => (

                <div
                  key={job.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 16,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14
                  }}
                >

                  <div>

                    <p style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {job.title}
                    </p>

                    <p style={{
                      margin: 0,
                      fontSize: 12,
                      color: C.textSec
                    }}>
                      {job.location} · {job.type} · {job.mode}
                    </p>

                  </div>

                  <div style={{
                    marginLeft: "auto",
                    display: "flex",
                    gap: 10,
                    alignItems: "center"
                  }}>

                    <SBadge s={job.status} />

                    <span style={{
                      fontSize: 12,
                      color: C.textSec
                    }}>
                      {job.applicants} applicants
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}