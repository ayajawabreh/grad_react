import { useEffect, useState } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import {
  Bot,
  FileSearch,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";

import {
  reviewCV,
  generateInterviewQuestions,
  getSavedJobs,
  submitInterviewAnswers,
  retakeInterviewQuiz,
  getInterviewAttempts,
} from "../../imports/api";
import { checkJobSaved, saveJob } from "../../imports/jobs";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

interface CVResult {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missing_sections?: string[];
  skills?: string[];
  recommendations?: string[];
  section_scores?: Record<string, number>;
  ats_score?: number;
  level?: string;
  [key: string]: unknown;
}

interface Job {
  id?: number;
  job_id?: number;
  title: string;
  company?: string;
  location?: string;
  salary?: string | number;
  employment_type?: string;
  work_mode?: string;
  match?: number;
}

interface InterviewQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer?: string;
  student_answer?: string;
  is_correct?: boolean;
  difficulty?: string;
  skill?: string;
}

interface InterviewResult {
  attempt_id: number;
  job_id: number;
  job_title: string;
  questions: InterviewQuestion[];
  status: "open" | "completed" | "abandoned";
  metadata?: { attempt_source?: string; from_cache?: boolean };
}

interface AttemptSummary { attempt_id: number; status: string; percentage: number | null; score: number | null; total_questions: number; started_at: string; completed_at: string | null; }

type AIState = "idle" | "checking_saved_job" | "generating_questions" | "quiz_open" | "submitting" | "completed" | "retaking" | "loading_history" | "error";

function getAIErrorMessage(err: any, fallback: string) {
  if (err?.response?.status === 503) {
    return "The AI service is temporarily unavailable. Please try again in a moment.";
  }

  return err?.response?.data?.message || err?.message || fallback;
}

const TOOLS = [
  {
    icon: FileSearch,
    color: C.purple,
    bg: C.purpleBg,
    title: "CV Review",
    desc: "Analyze your resume with AI and get strengths, weaknesses and suggestions.",
    action: "Review My CV",
  },
  {
    icon: Bot,
    color: C.success,
    bg: C.successBg,
    title: "AI Interview",
    desc: "Practice interviews with AI-generated questions tailored to the selected job.",
    action: "Start Interview",
  },
];

function ScoreRing({ score }: { score: number }) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  const offset =
    circumference -
    (safeScore / 100) * circumference;

  const color =
    safeScore >= 80
      ? C.success
      : safeScore >= 50
      ? C.warning
      : C.danger;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: "rotate(-90deg)",
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={C.divider as any}
          strokeWidth={stroke}
          fill="none"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color as any}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 22,
            color: C.text as any,
          }}
        >
          {safeScore}
        </span>

        <span
          style={{
            fontSize: 10,
            color: C.textSec as any,
          }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

function ResultList({
  items,
  icon: Icon,
  color,
}: {
  items: string[];
  icon: any;
  color: string;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13,
            color: C.text as any,
            lineHeight: 1.6,
          }}
        >
          <Icon
            size={16}
            color={color as any}
            style={{
              marginTop: 2,
              flexShrink: 0,
            }}
          />

          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const interviewSyncVersion = useSyncResourceVersion("interview");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState("");
  const [error, setError] = useState("");

  const [cv, setCV] =
    useState<CVResult | null>(null);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [interview, setInterview] =
    useState<InterviewResult | null>(null);

  const [showJobSelection, setShowJobSelection] =
    useState(false);

  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);

  const [selectedAnswers, setSelectedAnswers] =
    useState<Record<number, string>>({});

  const [showResults, setShowResults] =
    useState(false);

  const [score, setScore] = useState(0);
  const [aiState, setAiState] = useState<AIState>("idle");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [percentage, setPercentage] = useState(0);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const strengths = cv?.strengths ?? [];
  const weaknesses = cv?.weaknesses ?? [];
  const missingSections = cv?.missing_sections ?? [];
  const recommendations = cv?.recommendations ?? cv?.suggestions ?? [];
  const sectionScores = cv?.section_scores ?? {};
  const overallScore = cv?.overall_score ?? 0;
  const atsScore = cv?.ats_score ?? 0;

  const loadHistory = async (jobId: number) => {
    try {
      setAiState((current) => current === "idle" ? "loading_history" : current);
      const response: any = await getInterviewAttempts(jobId);
      setAttempts(response?.attempts ?? response?.data?.attempts ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not load quiz history.");
    } finally {
      setAiState((current) => current === "loading_history" ? "idle" : current);
    }
  };

  useEffect(() => {
    const refresh = () => {
      const jobId = selectedJob?.job_id ?? selectedJob?.id;
      if (jobId) void loadHistory(jobId);
    };
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    const visible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", visible);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", visible); };
  }, [selectedJob]);

  useEffect(() => {
    const jobId = selectedJob?.job_id ?? selectedJob?.id;
    if (jobId && interviewSyncVersion > 0) void loadHistory(jobId);
  }, [interviewSyncVersion, selectedJob]);

  const handleAction = async (title: string) => {
    try {
      setLoading(true);
      setActive(title);
      setError("");

      if (title === "CV Review") {
        setCV(null);

        const res: any = await reviewCV();

        setCV(res?.data ?? res);
      }

      if (title === "AI Interview") {
        setInterview(null);
        setSelectedJob(null);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setJobs([]);

        const response: any =
          await getSavedJobs();

        console.log(
          "Saved jobs response:",
          response
        );

        const data = Array.isArray(response)
          ? response
          : response?.jobs || [];

        console.log(
          "Saved jobs data:",
          data
        );

        const availableJobs: Job[] =
          data.map((item: any) => {
            const job = item.job ?? item;

            return {
              ...job,

              job_id:
                job.job_id ??
                job.id ??
                item.job_id ??
                item.id,

              title:
                job.title ??
                job.job_title ??
                "Untitled Job",

              company:
                typeof job.company === "object"
                  ? job.company?.company_name ?? ""
                  : job.company ?? "",

              location:
                job.location ?? "",

              salary:
                job.salary ?? "",

              employment_type:
                job.employment_type ?? "",

              work_mode:
                job.work_mode ?? "",

              match:
                typeof job.match === "number"
                  ? job.match
                  : undefined,
            };
          });

        console.log(
          "Mapped saved jobs:",
          availableJobs
        );

        setJobs(availableJobs);

        if (availableJobs.length === 0) {
          setError(
            "You don't have any saved jobs available for an AI interview."
          );

          return;
        }

        setShowJobSelection(true);
      }
    } catch (err: any) {
      setError(getAIErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (job: Job) => {
    try {
      if (["checking_saved_job", "generating_questions", "submitting", "retaking"].includes(aiState)) return;
      setLoading(true);
      setAiState("checking_saved_job");
      setActive("AI Interview");
      setError("");

      setSelectedJob(job);
      setShowJobSelection(false);
      setInterview(null);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);

      const jobId =
        job.job_id ?? job.id;

      if (!jobId) {
        throw new Error("Invalid job ID.");
      }

      const saved = await checkJobSaved(jobId);
      if (!saved) {
        await saveJob(jobId);
      }

      setAiState("generating_questions");

      const res: any =
        await generateInterviewQuestions(
          jobId
        );

      const quiz = res?.data ?? res;
      setAttemptId(Number(quiz.attempt_id));
      setInterview(quiz);
      setAiState("quiz_open");
      await loadHistory(jobId);
    } catch (err: any) {
      setError(getAIErrorMessage(err, "Failed to generate interview questions."));

      setShowJobSelection(true);
      setAiState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    questionId: number,
    answer: string
  ) => {
    setError("");
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const closeInterview = () => {
    setInterview(null);
    setSelectedJob(null);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setAttemptId(null);
    setPercentage(0);
    setAiState("idle");
  };

  const handleSubmit = async () => {
    if (!interview || !attemptId || aiState === "submitting" || showResults) return;
    const unansweredCount = interview.questions.filter(
      (question) => !selectedAnswers[question.id]
    ).length;
    if (unansweredCount > 0) {
      setError(`Please answer all questions before submitting. ${unansweredCount} question${unansweredCount === 1 ? " is" : "s are"} still unanswered.`);
      return;
    }
    try {
      setAiState("submitting"); setError("");
      const response: any = await submitInterviewAnswers({ attempt_id: attemptId, answers: Object.fromEntries(Object.entries(selectedAnswers).map(([id, answer]) => [String(id), answer])) });
      const result = response?.data ?? response;
      setScore(Number(result.correct_count ?? result.score ?? 0));
      setPercentage(Number(result.percentage ?? result.score ?? 0));
      setInterview((current) => current ? { ...current, status: "completed", questions: result.results ?? current.questions } : current);
      setShowResults(true); setAiState("completed");
      await loadHistory(interview.job_id);
    } catch (err: any) { setError(err?.response?.data?.message || "Failed to submit interview answers."); setAiState("error"); }
  };

  const resetInterview = async () => {
    if (!interview || aiState === "retaking") return;
    try {
      setAiState("retaking"); setError("");
      const response: any = await retakeInterviewQuiz(interview.job_id);
      const quiz = response?.data ?? response;
      setInterview(quiz); setAttemptId(Number(quiz.attempt_id)); setSelectedAnswers({}); setShowResults(false); setScore(0); setPercentage(0); setAiState("quiz_open");
      await loadHistory(interview.job_id);
    } catch (err: any) { setError(err?.response?.data?.message || "Could not start a new quiz attempt."); setAiState("error"); }
  };

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text as any,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: C.purpleBg as any,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot
            color={C.purple as any}
            size={23}
          />
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            AI Career Assistant
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              color: C.textSec as any,
              fontSize: 14,
            }}
          >
            Smart tools to improve your career
            journey
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {TOOLS.map((tool) => (
          <div
            key={tool.title}
            style={{
              background: C.surface as any,
              border: `1px solid ${C.border as any}`,
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: tool.bg as any,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <tool.icon
                size={18}
                color={tool.color as any}
              />
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {tool.title}
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: C.textSec as any,
                lineHeight: 1.5,
                minHeight: 36,
              }}
            >
              {tool.desc}
            </p>

            <Btn
              v="outline"
              size="sm"
              disabled={
                loading &&
                active === tool.title
              }
              onClick={() =>
                handleAction(tool.title)
              }
            >
              {loading &&
              active === tool.title
                ? "Loading..."
                : tool.action}
            </Btn>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: "14px 18px",
            background: C.dangerBg as any,
            border: `1px solid ${C.danger as any}`,
            color: C.danger as any,
            borderRadius: 12,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {cv && (
        <div
          style={{
            marginTop: 24,
            background: C.surface as any,
            border: `1px solid ${C.border as any}`,
            borderRadius: 20,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "center",
              }}
            >
              <ScoreRing
                score={overallScore}
              />

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Sparkles
                    size={17}
                    color={C.purple as any}
                  />

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                    }}
                  >
                    CV Analysis Result
                  </h3>
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: C.textSec as any,
                    fontSize: 13,
                  }}
                >
                  Overall resume score based on AI
                  review
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}><span style={{ padding: "4px 8px", borderRadius: 8, background: C.bg, fontSize: 11 }}>ATS score: {atsScore}</span>{cv.level && <span style={{ padding: "4px 8px", borderRadius: 8, background: C.bg, fontSize: 11 }}>{cv.level}</span>}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCV(null);
                setError("");
              }}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: C.textSec as any,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <div>
              <h4
                style={{
                  color: C.success as any,
                  margin: "0 0 12px",
                  fontSize: 14,
                }}
              >
                Strengths
              </h4>

              <ResultList
                items={strengths}
                icon={CheckCircle2}
                color={C.success}
              />
            </div>

            <div>
              <h4
                style={{
                  color: C.danger as any,
                  margin: "0 0 12px",
                  fontSize: 14,
                }}
              >
                Weaknesses
              </h4>

              <ResultList
                items={weaknesses}
                icon={XCircle}
                color={C.danger}
              />
            </div>
          </div>

          <div>
            <h4
              style={{
                color: C.warning as any,
                margin: "0 0 12px",
                fontSize: 14,
              }}
            >
              Suggestions
            </h4>

            <ResultList
                items={recommendations}
              icon={Lightbulb}
              color={C.warning}
            />
          </div>
          {missingSections.length > 0 && <div style={{ marginTop: 20 }}><h4 style={{ color: C.danger, margin: "0 0 12px", fontSize: 14 }}>Missing Sections</h4><ResultList items={missingSections} icon={XCircle} color={C.danger}/></div>}
          {Object.keys(sectionScores).length > 0 && <div style={{ marginTop: 20 }}><h4 style={{ margin: "0 0 12px", fontSize: 14 }}>Section Scores</h4><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{Object.entries(sectionScores).map(([section, value]) => <span key={section} style={{ padding: "6px 9px", borderRadius: 8, background: C.bg, fontSize: 11 }}>{section}: <b>{value}</b></span>)}</div></div>}
        </div>
      )}

      {showJobSelection && (
        <div
          style={{
            marginTop: 24,
            background: C.surface as any,
            border: `1px solid ${C.border as any}`,
            borderRadius: 20,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                }}
              >
                Choose a Saved Job
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  color: C.textSec as any,
                  fontSize: 13,
                }}
              >
                Select one of your saved jobs
                to practice an AI interview.
              </p>
            </div>

            <button
              onClick={() =>
                setShowJobSelection(false)
              }
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: C.textSec as any,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {jobs.map((job) => (
              <button
                key={
                  job.job_id ??
                  job.id
                }
                onClick={() =>
                  startInterview(job)
                }
                disabled={loading}
                style={{
                  textAlign: "left",
                  padding: 18,
                  borderRadius: 14,
                  border: `1px solid ${C.border as any}`,
                  background: C.bg as any,
                  cursor: loading
                    ? "default"
                    : "pointer",
                  fontFamily: F,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: C.text as any,
                  }}
                >
                  {job.title}
                </div>

                {job.company && (
                  <div
                    style={{
                      marginTop: 5,
                      color: C.textSec as any,
                      fontSize: 12,
                    }}
                  >
                    {job.company}
                  </div>
                )}

                {job.location && (
                  <div
                    style={{
                      marginTop: 8,
                      color: C.textSec as any,
                      fontSize: 12,
                    }}
                  >
                    {job.location}
                  </div>
                )}

                {typeof job.match ===
                  "number" && (
                  <div
                    style={{
                      marginTop: 10,
                      color: C.success as any,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {job.match}% Match
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {interview && (
        <div
          style={{
            marginTop: 24,
            background: C.surface as any,
            border: `1px solid ${C.border as any}`,
            padding: 28,
            borderRadius: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Bot
                  size={18}
                  color={C.success as any}
                />

                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                  }}
                >
                  AI Interview
                </h3>
              </div>

              <p
                style={{
                  margin: "6px 0 0",
                  color: C.textSec as any,
                  fontSize: 13,
                }}
              >
                {interview.job_title}
              </p>
            </div>

            <button
              onClick={closeInterview}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: C.textSec as any,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            style={{
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: 6,
                background: C.border as any,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${
                    interview.questions.length
                      ? (Object.keys(
                          selectedAnswers
                        ).length /
                          interview.questions
                            .length) *
                        100
                      : 0
                  }%`,
                  height: "100%",
                  background: C.purple as any,
                  transition:
                    "width 0.3s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.textSec as any,
                marginTop: 4,
              }}
            >
              {
                Object.keys(
                  selectedAnswers
                ).length
              }{" "}
              of{" "}
              {interview.questions.length}{" "}
              answered
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {interview.questions?.map(
              (question, index) => (
                <div
                  key={question.id}
                  style={{
                    border: `1px solid ${C.border as any}`,
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: C.textSec as any,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Question {index + 1}{question.skill ? ` · ${question.skill}` : ""}{question.difficulty ? ` · ${question.difficulty}` : ""}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    {question.question}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {(
                      Object.entries(
                        question.options
                      ) as [
                        string,
                        string
                      ][]
                    ).map(
                      ([letter, text]) => {
                        const selected =
                          selectedAnswers[
                            question.id
                          ] === letter;

                        const isCorrect =
                          showResults &&
                          letter ===
                            question.correct_answer;

                        const isWrong =
                          showResults &&
                          selected &&
                          letter !==
                            question.correct_answer;

                        let borderColor =
                          C.border as any;

                        let bgColor =
                          C.bg as any;

                        if (showResults) {
                          if (isCorrect) {
                            borderColor =
                              C.success as any;

                            bgColor =
                              C.successBg as any;
                          } else if (isWrong) {
                            borderColor =
                              C.danger as any;

                            bgColor =
                              C.dangerBg as any;
                          }
                        } else if (selected) {
                          borderColor =
                            C.purple as any;

                          bgColor =
                            C.purpleBg as any;
                        }

                        return (
                          <button
                            key={letter}
                            onClick={() =>
                              !showResults &&
                              handleAnswer(
                                question.id,
                                letter
                              )
                            }
                            disabled={
                              showResults
                            }
                            style={{
                              textAlign: "left",
                              padding:
                                "12px 14px",
                              borderRadius: 12,
                              border: `1px solid ${borderColor}`,
                              background:
                                bgColor,
                              color:
                                C.text as any,
                              cursor:
                                showResults
                                  ? "default"
                                  : "pointer",
                              fontFamily: F,
                              fontSize: 13,
                              opacity:
                                showResults &&
                                !isCorrect &&
                                !isWrong
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            <strong>
                              {letter}.
                            </strong>{" "}
                            {text}

                            {showResults &&
                              isCorrect && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    color:
                                      C.success as any,
                                  }}
                                >
                                  ✓
                                </span>
                              )}

                            {showResults &&
                              isWrong && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    color:
                                      C.danger as any,
                                  }}
                                >
                                  ✗
                                </span>
                              )}
                          </button>
                        );
                      }
                    )}
                  </div>
                  {showResults && <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}><span style={{ color: question.is_correct ? C.success : C.danger }}>Your answer: <b>{question.student_answer ?? selectedAnswers[question.id] ?? "—"}</b></span><span style={{ color: C.success }}>Correct answer: <b>{question.correct_answer ?? "—"}</b></span></div>}
                </div>
              )
            )}
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            {!showResults ? (
              <Btn
                v="primary"
                size="md"
                onClick={handleSubmit}
                disabled={
                  aiState === "submitting"
                }
              >
                {aiState === "submitting" ? "Submitting..." : "Submit Answers"}
              </Btn>
            ) : (
              <>
                <Btn
                  v="outline"
                  size="md"
                  onClick={resetInterview}
                  disabled={aiState === "retaking"}
                >
                  {aiState === "retaking" ? "Preparing new quiz..." : "Retake Quiz"}
                </Btn>

                <Btn
                  v="primary"
                  size="md"
                  onClick={closeInterview}
                >
                  Close Interview
                </Btn>
              </>
            )}
          </div>

          {showResults && (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 14,
                background:
                  score /
                    interview.questions.length >=
                  0.7
                    ? C.successBg
                    : C.dangerBg,
                border: `1px solid ${
                  score /
                    interview.questions.length >=
                  0.7
                    ? C.success
                    : C.danger
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                    }}
                  >
                    {score}/
                    {
                      interview.questions
                        .length
                    }
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: C.textSec as any,
                    }}
                  >
                    {score /
                      interview.questions
                        .length >=
                    0.7
                      ? "🎉 Excellent work!"
                      : "💪 Keep practicing!"}
                  </div>
                </div>

                <div
                  style={{
                    marginLeft: "auto",
                    padding: "6px 16px",
                    borderRadius: 20,
                    background:
                      score /
                        interview.questions
                          .length >=
                      0.7
                        ? C.success
                        : C.danger,
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {percentage}%
                </div>
              </div>
            </div>
          )}

          {attempts.length > 0 && <div style={{ marginTop: 22, borderTop: `1px solid ${C.divider}`, paddingTop: 18 }}><h4 style={{ margin: "0 0 12px", fontSize: 14 }}>Attempt History</h4><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{attempts.map((attempt) => <div key={attempt.attempt_id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "10px 12px", borderRadius: 10, background: C.bg, fontSize: 12, alignItems: "center" }}><span>{new Date(attempt.started_at).toLocaleString()}</span><b>{attempt.status === "open" ? "In Progress" : attempt.status === "completed" ? "Completed" : "Abandoned"}</b><span style={{ color: C.textSec }}>{attempt.percentage == null ? "—" : `${attempt.percentage}%`}</span></div>)}</div></div>}
        </div>
      )}
    </div>
  );
}
