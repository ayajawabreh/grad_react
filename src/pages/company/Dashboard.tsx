import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn, StatCard } from "../../components/ui";
import { CandidateCard } from "../../components/cards/CandidateCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Users, CalendarCheck, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCompanyDashboard } from "../../imports/api";

export default function CompanyDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();

  const companyName = user?.name || localStorage.getItem("user_name") || "Company";

  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getCompanyDashboard();
        setDashboard(data);
      } catch (error) {
        console.log(error);
      }
    };

    loadDashboard();
  }, []);

  const activityData = dashboard?.activity?.length
    ? dashboard.activity.map((item: any) => ({
        month: item.month,
        v: Number(item.value),
      }))
    : [
        { month: "2026-05", v: 0 },
        { month: "2026-06", v: 0 },
        { month: "2026-07", v: 0 },
      ];

  const pipelineData = dashboard?.pipeline || [];

  return (
    <div style={{ fontFamily: F, color: C.text }}>

      <div style={{ marginBottom: 28 }}>
       <h1
  style={{
    fontSize: 24,
    fontWeight: 900,
    margin: 0,
    color: C.text,
    fontFamily: F,
  }}
>
  Good morning, {companyName} 👋
</h1>

        <p style={{ color: C.textSec, marginTop: 6, fontSize: 14 }}>
          Here's your hiring overview for today.
        </p>
      </div>


      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard
          label="Total Applications"
          value={String(dashboard?.stats?.total_applications ?? 0)}
          trend="+18%"
          icon={FileText}
          color={C.info}
        />

        <StatCard
          label="Active Jobs"
          value={String(dashboard?.stats?.active_jobs ?? 0)}
          icon={Users}
          color={C.accent}
        />

        <StatCard
          label="Interviews"
          value={String(dashboard?.stats?.interviews ?? 0)}
          trend="+33%"
          icon={CalendarCheck}
          color={C.purple}
        />

        <StatCard
          label="Hired"
          value={String(dashboard?.stats?.hired ?? 0)}
          trend="+20%"
          icon={UserCheck}
          color={C.success}
        />
      </div>


      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 20,
        marginBottom: 24
      }}>

        <div style={{
          background: C.surface,
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${C.border}`
        }}>

          <h2 style={{
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 20
          }}>
            Applications Over Time
          </h2>


          <ResponsiveContainer width="100%" height={200}>

            <AreaChart data={activityData}>

              <defs>
                <linearGradient id="compGrad">
                  <stop offset="5%" stopColor={C.info} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={C.info} stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={C.divider}/>

              <XAxis
                dataKey="month"
                tick={{fontSize:12}}
              />

              <YAxis
                allowDecimals={false}
                tick={{fontSize:12}}
              />

              <Tooltip/>

              <Area
                type="monotone"
                dataKey="v"
                stroke={C.info}
                strokeWidth={2}
                fill="url(#compGrad)"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>



        <div style={{
          background:C.surface,
          borderRadius:20,
          padding:24,
          border:`1px solid ${C.border}`
        }}>

          <h2 style={{
            fontSize:15,
            fontWeight:700
          }}>
            Hiring Pipeline
          </h2>


          <ResponsiveContainer width="100%" height={150}>

            <PieChart>

              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
              >

                {pipelineData.map((entry:any,index:number)=>(
                  <Cell
                    key={index}
                    fill={entry.color || C.accent}
                  />
                ))}

              </Pie>

              <Tooltip/>

            </PieChart>

          </ResponsiveContainer>


          {pipelineData.map((p:any)=>(
            <div
              key={p.name}
              style={{
                display:"flex",
                justifyContent:"space-between",
                marginBottom:6
              }}
            >

              <span>{p.name}</span>

              <b>{p.value}</b>

            </div>
          ))}

        </div>

      </div>



      <div style={{marginBottom:24}}>

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          marginBottom:16
        }}>

          <h2 style={{
            fontSize:15,
            fontWeight:700
          }}>
            Recent Applicants
          </h2>


          <Btn
            v="ghost"
            size="sm"
            onClick={()=>nav("/company/applicants")}
          >
            View all →
          </Btn>

        </div>


        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(2,1fr)",
          gap:16
        }}>

          {dashboard?.recent_applicants?.map((c:any)=>(
            <CandidateCard
              key={c.id}
              c={c}
              onView={()=>nav(`/company/applicants/${c.id}`)}
            />
          ))}

        </div>

      </div>



      <div style={{
        background:C.surface,
        borderRadius:20,
        padding:24,
        border:`1px solid ${C.border}`
      }}>

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          marginBottom:16
        }}>

          <h2 style={{
            fontSize:15,
            fontWeight:700
          }}>
            Active Jobs
          </h2>


          <Btn
            v="ghost"
            size="sm"
            onClick={()=>nav("/company/jobs")}
          >
            Manage →
          </Btn>

        </div>



        {dashboard?.active_jobs?.map((job:any)=>(
          <div
            key={job.id}
            style={{
              display:"flex",
              alignItems:"center",
              gap:14,
              padding:"14px 0"
            }}
          >

            <div style={{
              width:36,
              height:36,
              borderRadius:10,
              background:C.accent+"18",
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            }}>
              {companyName[0]}
            </div>


            <div style={{flex:1}}>

              <p style={{
                margin:0,
                fontWeight:600
              }}>
                {job.title}
              </p>

              <p style={{
                margin:0,
                fontSize:12,
                color:C.textSec
              }}>
                {job.applicants} applicants · {job.posted}
              </p>

            </div>


            <span style={{
              color:C.success,
              background:C.successBg,
              padding:"4px 10px",
              borderRadius:99
            }}>
              {job.status}
            </span>


          </div>
        ))}


      </div>


    </div>
  );
}