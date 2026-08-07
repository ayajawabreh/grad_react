import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { Bot, FileSearch, FileEdit, Briefcase, Mail, Lightbulb, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { reviewCV } from "../../imports/api";
import { useState } from "react";

const TOOLS = [
  { icon: FileSearch, color: C.purple, bg: C.purpleBg, title: "CV Review", desc: "Get detailed feedback on your resume with actionable suggestions to stand out to recruiters.", action: "Review My CV" },
  { icon: FileEdit, color: C.accent, bg: C.accentLight, title: "Resume Improver", desc: "AI-powered rewrites for your bullet points, summary, and role descriptions to maximize impact.", action: "Improve Resume" },
  { icon: Briefcase, color: C.info, bg: C.infoBg, title: "Job Recommendations", desc: "Discover curated job matches based on your skills, experience, and career preferences.", action: "Get Matches" },
  { icon: Mail, color: C.success, bg: C.successBg, title: "Cover Letter Generator", desc: "Generate personalized, compelling cover letters tailored to specific job descriptions in seconds.", action: "Generate Letter" },
  { icon: Lightbulb, color: C.warning, bg: C.warningBg, title: "Career Tips", desc: "Receive personalized career advice, interview prep tips, and salary negotiation strategies.", action: "Get Advice" },
];

interface CVReviewResult {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

function ScoreRing({ score }: { score: number }) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? C.success : score >= 50 ? C.warning : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={C.divider} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, width: size, height: size,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column"
      }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{score}</span>
        <span style={{ fontSize: 10, color: C.textSec, fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
}

function ResultList({ items, icon: Icon, color }: { items: string[]; icon: any; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Icon size={16} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CVReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReviewCV = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewCV();

      setResult(response);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to review CV. Please try again.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={22} color={C.purple} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>AI Career Assistant</h1>
          <p style={{ color: C.textSec, fontSize: 14, margin: 0 }}>Supercharge your job search with intelligent tools</p>
        </div>
      </div>

      <div style={{ height: 1, background: C.divider, margin: "24px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {TOOLS.map(tool => (
          <div key={tool.title} style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.boxShadow = `0 4px 20px ${tool.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: tool.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <tool.icon size={20} color={tool.color} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{tool.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>{tool.desc}</p>
            </div>
            <Btn
              v="outline"
              size="sm"
              onClick={tool.title === "CV Review" ? handleReviewCV : undefined}
              disabled={tool.title === "CV Review" && loading}
              style={{ alignSelf: "flex-start" }}
            >
              {
                tool.title === "CV Review" && loading
                ? "Reviewing..."
                : tool.action
              }
            </Btn>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 24,
          background: "#fef2f2",
          borderRadius: 16,
          padding: "16px 20px",
          border: "1px solid #fca5a5",
          color: "#991b1b",
          fontSize: 13.5,
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 24,
          background: C.surface,
          borderRadius: 20,
          padding: 32,
          border: `1px solid ${C.border}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
            <ScoreRing score={result.overall_score} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color={C.purple} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>CV Analysis Result</h3>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textSec }}>
                Overall resume score based on AI review
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: C.success }}>Strengths</h4>
              <ResultList items={result.strengths} icon={CheckCircle2} color={C.success} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#ef4444" }}>Weaknesses</h4>
              <ResultList items={result.weaknesses} icon={XCircle} color="#ef4444" />
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: C.warning }}>Suggestions</h4>
            <ResultList items={result.suggestions} icon={Lightbulb} color={C.warning} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>Ask anything</h2>
        <p style={{ fontSize: 13, color: C.textSec, margin: "0 0 16px" }}>Get instant answers to career questions, company research, or interview preparation</p>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="e.g. How do I negotiate a higher salary at a startup?" style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, background: C.bg, outline: "none" }} />
          <Btn v="primary" onClick={() => {}}>Ask</Btn>
        </div>
      </div>
    </div>
  );
}