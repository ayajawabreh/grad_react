import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";

interface ShortlistedApplicant {
  id: number;
  status: string;
  student: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    headline?: string;
    university?: string;
    major?: string;
    gpa?: number;
    location?: string;
  };
  skills: string[];
}

export default function Shortlisted() {

  const { id } = useParams();

  const [applicants, setApplicants] = useState<ShortlistedApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/company/jobs/${id}/shortlisted`)
      .then((res) => {
        setApplicants(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);


  if (loading) {
    return <p>Loading...</p>;
  }


  return (
    <div style={{ fontFamily: F, color: C.text }}>

      <h1
        style={{
          fontSize: 30,
          fontWeight: 700,
          marginBottom: 28,
        }}
      >
        Shortlisted Candidates
      </h1>


      {applicants.length === 0 ? (

        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 35,
            color: C.textSec,
            textAlign: "center"
          }}
        >
          No shortlisted candidates yet.
        </div>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(350px,1fr))",
            gap: 24
          }}
        >

          {applicants.map((applicant) => (

            <div
              key={applicant.id}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 22,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
              }}
            >

              <div
                style={{
                  display:"flex",
                  alignItems:"center",
                  gap:16,
                  marginBottom:20
                }}
              >

                <div
                  style={{
                    width:65,
                    height:65,
                    borderRadius:"50%",
                    background:C.accentLight,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    fontSize:26,
                    fontWeight:700,
                    color:C.accentHover,
                    overflow:"hidden"
                  }}
                >
                  {applicant.student.avatar ? (
                    <img
                      src={applicant.student.avatar}
                      style={{
                        width:"100%",
                        height:"100%",
                        objectFit:"cover"
                      }}
                    />
                  ) : (
                    applicant.student.name.charAt(0)
                  )}
                </div>


                <div>

                  <h3
                    style={{
                      margin:0,
                      fontSize:20,
                      fontWeight:700
                    }}
                  >
                    {applicant.student.name}
                  </h3>

                  <p
                    style={{
                      margin:"5px 0 0",
                      color:C.textSec,
                      fontSize:14
                    }}
                  >
                    {applicant.student.headline || "Software Developer"}
                  </p>

                </div>

              </div>


              <div
                style={{
                  display:"flex",
                  flexDirection:"column",
                  gap:10,
                  marginBottom:20,
                  color:C.textSec,
                  fontSize:14
                }}
              >

                <div>
                  ✉ {applicant.student.email}
                </div>

                {applicant.student.major && (
                  <div>
                    🎓 {applicant.student.major}
                  </div>
                )}

                {applicant.student.university && (
                  <div>
                    🏫 {applicant.student.university}
                  </div>
                )}

                {applicant.student.location && (
                  <div>
                    📍 {applicant.student.location}
                  </div>
                )}

                {applicant.student.gpa && (
                  <div>
                    ⭐ GPA: {applicant.student.gpa}
                  </div>
                )}

              </div>


              {applicant.skills?.length > 0 && (

                <div
                  style={{
                    marginBottom:20
                  }}
                >

                  <p
                    style={{
                      margin:"0 0 10px",
                      fontWeight:600,
                      fontSize:14
                    }}
                  >
                    Skills
                  </p>


                  <div
                    style={{
                      display:"flex",
                      flexWrap:"wrap",
                      gap:8
                    }}
                  >

                    {applicant.skills.map((skill,index)=>(

                      <span
                        key={index}
                        style={{
                          background:C.accentLight,
                          color:C.accentHover,
                          padding:"6px 12px",
                          borderRadius:20,
                          fontSize:12,
                          fontWeight:600
                        }}
                      >
                        {skill}
                      </span>

                    ))}

                  </div>

                </div>

              )}


              <div
                style={{
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center"
                }}
              >

                <span
                  style={{
                    background:"#DCFCE7",
                    color:"#15803D",
                    padding:"7px 15px",
                    borderRadius:20,
                    fontSize:13,
                    fontWeight:600
                  }}
                >
                  ✓ Shortlisted
                </span>


                <button
                  style={{
                    background:C.accent,
                    color:"white",
                    border:"none",
                    padding:"10px 22px",
                    borderRadius:12,
                    cursor:"pointer",
                    fontWeight:600
                  }}
                >
                  View Profile
                </button>

              </div>


            </div>

          ))}

        </div>

      )}

    </div>
  );
}