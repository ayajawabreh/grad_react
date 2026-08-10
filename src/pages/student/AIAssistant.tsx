import { useState } from "react";
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
} from "../../imports/api";

interface CVResult {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
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
  correct_answer: string;
}

interface InterviewResult {
  job_id: number;
  job_title: string;
  questions: InterviewQuestion[];
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

  const handleAction = async (title: string) => {
    try {
      setLoading(true);
      setActive(title);
      setError("");

      if (title === "CV Review") {
        setCV(null);

        const res: any = await reviewCV();

        setCV(res);
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
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (job: Job) => {
    try {
      setLoading(true);
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

      const res: any =
        await generateInterviewQuestions(
          jobId
        );

      setInterview(res);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate interview questions."
      );

      setShowJobSelection(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    questionId: number,
    answer: string
  ) => {
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
  };

  const calculateScore = () => {
    if (!interview) {
      return 0;
    }

    let correct = 0;

    interview.questions.forEach(
      (question) => {
        if (
          selectedAnswers[question.id] ===
          question.correct_answer
        ) {
          correct++;
        }
      }
    );

    return correct;
  };

  const handleSubmit = () => {
    const correctAnswers =
      calculateScore();

    setScore(correctAnswers);
    setShowResults(true);
  };

  const resetInterview = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
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
                score={cv.overall_score}
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
                items={cv.strengths}
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
                items={cv.weaknesses}
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
              items={cv.suggestions}
              icon={Lightbulb}
              color={C.warning}
            />
          </div>
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
                    Question {index + 1}
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
                  Object.keys(
                    selectedAnswers
                  ).length !==
                  interview.questions.length
                }
              >
                Submit Answers
              </Btn>
            ) : (
              <>
                <Btn
                  v="outline"
                  size="md"
                  onClick={resetInterview}
                >
                  Retry
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
                  {Math.round(
                    (score /
                      interview.questions
                        .length) *
                      100
                  )}
                  %
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
