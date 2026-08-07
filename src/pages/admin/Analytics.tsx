import { C, F } from "../../constants/tokens";
import { trendData } from "../../constants/data";
import { StatCard } from "../../components/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, TrendingUp, Briefcase, Target } from "lucide-react";

const groupedData = trendData.map(d => ({ month: d.month, students: d.v * 6, companies: d.v }));
const pieData = [
  { name: "Students", value: 52480, color: C.info },
  { name: "Companies", value: 512, color: C.accent },
  { name: "Admins", value: 24, color: C.purple },
];

export default function AdminAnalytics() {
  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Analytics</h1>
        <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>Platform-wide metrics and engagement insights</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="DAU" value="8,420" trend="+12%" icon={Activity} color={C.info} />
        <StatCard label="Applications/Day" value="342" trend="+8%" icon={TrendingUp} color={C.accent} />
        <StatCard label="Jobs/Week" value="186" trend="-3%" icon={Briefcase} color={C.purple} />
        <StatCard label="Hire Rate" value="18.4%" trend="+5%" icon={Target} color={C.success} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Grouped Bar Chart */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Monthly Activity — Students vs Companies</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={groupedData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: C.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: F }} />
              <Bar dataKey="students" fill={C.info} radius={[4, 4, 0, 0]} name="Students" />
              <Bar dataKey="companies" fill={C.accent} radius={[4, 4, 0, 0]} name="Companies" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>User Breakdown</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F }} formatter={(v: number) => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 13, color: C.textSec }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
