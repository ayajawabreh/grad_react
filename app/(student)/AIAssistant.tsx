import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AppState,
} from "react-native";
import * as Network from "expo-network";

import {
  Bot,
  CheckCircle2,
  FileSearch,
  Lightbulb,
  Sparkles,
  X,
  XCircle,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";

import {
  reviewCV,
  generateInterviewQuestions,
  getSavedJobs,
  submitInterviewAnswers,
  retakeInterviewQuiz,
  getInterviewAttempts,
} from "../../imports/api";
import { checkJobSaved, saveJob } from "../../imports/jobs";
import { useSyncRefresh } from "../../context/SyncContext";

interface CVResult {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missing_sections?: string[];
  skills?: string[];
  recommendations?: string[];
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
  difficulty?: string;
  skill?: string;
}

interface InterviewResult {
  attempt_id: number;
  job_id: number;
  job_title: string;
  status: "open" | "completed";
  started_at?: string;
  questions: InterviewQuestion[];
  metadata?: { attempt_source?: string; from_cache?: boolean };
}

interface QuestionResult extends InterviewQuestion {
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

interface SubmissionResult {
  attempt_id: number;
  job_id: number;
  score: number;
  percentage: number;
  correct_count: number;
  total_questions: number;
  results: QuestionResult[];
}

interface AttemptHistory {
  attempt_id: number;
  status: "open" | "completed" | "abandoned";
  score: number | null;
  percentage: number | null;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
}

type AssistantPhase = "idle" | "checking_saved_job" | "generating_questions" |
  "quiz_open" | "submitting" | "completed" | "retaking" | "loading_history" | "error";

function assistantErrorMessage(error: any, fallback: string) {
  if (error?.response?.status === 503) {
    return "The AI service is temporarily unavailable. Please try again in a moment.";
  }

  if (!error?.response && error?.request) {
    return "Could not reach the server. Check your connection and try again.";
  }

  return error?.response?.data?.message || error?.message || fallback;
}

const TOOLS = [
  {
    type: "cv",
    title: "CV Review",
    description:
      "Analyze your resume with AI and get strengths, weaknesses and suggestions.",
    action: "Review My CV",
    color: C.accent as string,
    bg: C.accentLight as string,
  },
  {
    type: "interview",
    title: "AI Interview",
    description:
      "Practice interviews with AI-generated questions tailored to the selected job.",
    action: "Start Interview",
    color: C.success as string,
    bg: C.successBg as string,
  },
];

function ScoreRing({ score }: { score: number }) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  const color: string =
    safeScore >= 80
      ? C.success
      : safeScore >= 50
      ? C.warning
      : C.danger;

  return (
    <View style={styles.scoreRing}>
      <View
        style={[
          styles.scoreRingInner,
          {
            borderColor: color,
          },
        ]}
      >
        <Text style={styles.scoreNumber}>
          {safeScore}
        </Text>

        <Text style={styles.scoreLabel}>
          / 100
        </Text>
      </View>
    </View>
  );
}

function ResultList({
  items,
  type,
}: {
  items: string[];
  type: "success" | "danger" | "warning";
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const color: string =
    type === "success"
      ? C.success
      : type === "danger"
      ? C.danger
      : C.warning;

  return (
    <View style={styles.resultList}>
      {items.map((item, index) => (
        <View
          key={index}
          style={styles.resultItem}
        >
          {type === "success" && (
            <CheckCircle2
              size={17}
              color={color}
            />
          )}

          {type === "danger" && (
            <XCircle
              size={17}
              color={color}
            />
          )}

          {type === "warning" && (
            <Lightbulb
              size={17}
              color={color}
            />
          )}

          <Text style={styles.resultText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "outline",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "outline" | "primary";
}) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "primary"
          ? styles.primaryButton
          : styles.outlineButton,
        pressed && styles.pressed,
        isDisabled && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary"
              ? "#FFFFFF"
              : C.accent
          }
        />
      ) : (
        <Text
          style={[
            styles.actionButtonText,
            variant === "primary"
              ? styles.primaryButtonText
              : styles.outlineButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export default function AIAssistant() {
  const [loading, setLoading] =
    useState(false);

  const [active, setActive] =
    useState("");

  const [error, setError] =
    useState("");

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

  const [score, setScore] =
    useState(0);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [history, setHistory] = useState<AttemptHistory[]>([]);
  const [phase, setPhase] = useState<AssistantPhase>("idle");
  const networkState = Network.useNetworkState();

  const loadHistory = async (jobId: number) => {
    setPhase((current) => current === "quiz_open" || current === "completed" ? current : "loading_history");
    try {
      const response: any = await getInterviewAttempts(jobId);
      setHistory(Array.isArray(response?.attempts) ? response.attempts : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load quiz history.");
    } finally {
      setPhase((current) => current === "loading_history" ? "idle" : current);
    }
  };

  useSyncRefresh("interviews", async () => {
    const jobId = interview?.job_id ?? selectedJob?.job_id ?? selectedJob?.id;
    if (jobId) await loadHistory(Number(jobId));
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      const jobId = interview?.job_id ?? selectedJob?.job_id ?? selectedJob?.id;
      if (state === "active" && jobId) void loadHistory(Number(jobId));
    });
    return () => subscription.remove();
  }, [interview?.job_id, selectedJob]);

  useEffect(() => {
    const jobId = interview?.job_id ?? selectedJob?.job_id ?? selectedJob?.id;
    if (networkState.isConnected && networkState.isInternetReachable !== false && jobId) {
      void loadHistory(Number(jobId));
    }
  }, [
    interview?.job_id,
    networkState.isConnected,
    networkState.isInternetReachable,
    selectedJob?.id,
    selectedJob?.job_id,
  ]);

  const handleAction = async (
    type: string
  ) => {
    try {
      setLoading(true);
      setActive(type);
      setError("");

      if (type === "cv") {
        setCV(null);

        const response: any =
          await reviewCV();

        setCV(response);
      }

      if (type === "interview") {
        setInterview(null);
        setSelectedJob(null);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setSubmission(null);
        setHistory([]);
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

        const availableJobs: Job[] =
          data.map((item: any) => {
            const job =
              item.job ?? item;

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
                typeof job.company ===
                "object"
                  ? job.company
                      ?.company_name ?? ""
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
                typeof job.match ===
                "number"
                  ? job.match
                  : undefined,
            };
          });

        setJobs(availableJobs);

        if (
          availableJobs.length === 0
        ) {
          setError(
            "You don't have any saved jobs available for an AI interview."
          );

          return;
        }

        setShowJobSelection(true);
      }
    } catch (err: any) {
      setError(assistantErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (
    job: Job
  ) => {
    try {
      setLoading(true);
      setActive("interview");
      setError("");

      setSelectedJob(job);
      setShowJobSelection(false);
      setInterview(null);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      setSubmission(null);

      const jobId =
        job.job_id ?? job.id;

      if (!jobId) {
        throw new Error(
          "Invalid job ID."
        );
      }

      setPhase("checking_saved_job");
      const isSaved = await checkJobSaved(jobId);
      if (!isSaved) await saveJob(jobId);

      setPhase("generating_questions");
      const response: any =
        await generateInterviewQuestions(
          jobId
        );

      setInterview(response);
      setPhase("quiz_open");
      void loadHistory(jobId);
    } catch (err: any) {
      setError(assistantErrorMessage(err, "Failed to generate interview questions."));

      setShowJobSelection(true);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    questionId: number,
    answer: string
  ) => {
    if (showResults) {
      return;
    }

    setSelectedAnswers(
      (previous) => ({
        ...previous,
        [questionId]: answer,
      })
    );
  };

  const closeInterview = () => {
    setInterview(null);
    setSelectedJob(null);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleSubmit = async () => {
    if (!interview) {
      return;
    }

    const unansweredCount = interview.questions.filter(
      (question) => !selectedAnswers[question.id]
    ).length;

    if (unansweredCount > 0) {
      setError(
        `Please answer all questions before submitting. ${unansweredCount} ${
          unansweredCount === 1 ? "question remains" : "questions remain"
        }.`
      );
      return;
    }

    try {
      setLoading(true);
      setPhase("submitting");
      setError("");
      const answers = Object.fromEntries(
        Object.entries(selectedAnswers).map(([questionId, answer]) => [String(questionId), answer]),
      );
      const response: any = await submitInterviewAnswers({
        attempt_id: interview.attempt_id,
        answers,
      });
      setSubmission(response);
      setScore(Number(response.correct_count ?? response.score ?? 0));
      setShowResults(true);
      setPhase("completed");
      setInterview((current) => current ? { ...current, status: "completed" } : current);
      await loadHistory(interview.job_id);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit interview answers.");
      setPhase(err?.response?.status === 422 ? "completed" : "quiz_open");
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = async () => {
    if (!interview || loading) return;
    try {
      setLoading(true);
      setPhase("retaking");
      setError("");
      const response: any = await retakeInterviewQuiz(interview.job_id);
      setInterview(response);
      setSelectedAnswers({});
      setSubmission(null);
      setShowResults(false);
      setScore(0);
      setPhase("quiz_open");
      await loadHistory(interview.job_id);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to retake quiz.");
      setPhase(showResults ? "completed" : "quiz_open");
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = interview?.questions?.filter(
    (question) => Boolean(selectedAnswers[question.id])
  ).length ?? 0;

  const questionCount =
    interview?.questions?.length || 0;

  const percentage =
    questionCount > 0
      ? (answeredCount /
          questionCount) *
        100
      : 0;

  const resultPercentage = Number(submission?.percentage ?? 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bot
            size={24}
            color={C.accent}
          />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            AI Career Assistant
          </Text>

          <Text style={styles.subtitle}>
            Smart tools to improve your
            career journey
          </Text>
        </View>
      </View>

      <View style={styles.toolsContainer}>
        {TOOLS.map((tool) => (
          <View
            key={tool.type}
            style={styles.toolCard}
          >
            <View
              style={[
                styles.toolIcon,
                {
                  backgroundColor:
                    tool.bg,
                },
              ]}
            >
              {tool.type === "cv" ? (
                <FileSearch
                  size={20}
                  color={tool.color}
                />
              ) : (
                <Bot
                  size={20}
                  color={tool.color}
                />
              )}
            </View>

            <Text style={styles.toolTitle}>
              {tool.title}
            </Text>

            <Text
              style={styles.toolDescription}
            >
              {tool.description}
            </Text>

            <ActionButton
              title={tool.action}
              loading={
                loading &&
                active === tool.type
              }
              disabled={loading}
              onPress={() =>
                handleAction(
                  tool.type
                )
              }
            />
          </View>
        ))}
      </View>

      {error !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      {cv && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.cvHeaderLeft}>
              <ScoreRing
                score={
                  Number(cv.overall_score ?? cv.score ?? cv.percentage ?? 0)
                }
              />

              <View
                style={
                  styles.cvHeaderText
                }
              >
                <View
                  style={
                    styles.analysisTitleRow
                  }
                >
                  <Sparkles
                    size={17}
                    color={C.accent}
                  />

                  <Text
                    style={
                      styles.analysisTitle
                    }
                  >
                    CV Analysis Result
                  </Text>
                </View>

                <Text
                  style={
                    styles.analysisSubtitle
                  }
                >
                  Overall resume score
                  based on AI review
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setCV(null);
                setError("");
              }}
              hitSlop={10}
            >
              <X
                size={20}
                color={C.textSec}
              />
            </Pressable>
          </View>

          <View style={styles.cvColumns}>
            <View style={styles.cvSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: C.success,
                  },
                ]}
              >
                Strengths
              </Text>

              <ResultList
                items={Array.isArray(cv.strengths) ? cv.strengths : []}
                type="success"
              />
            </View>

            <View style={styles.cvSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: C.danger,
                  },
                ]}
              >
                Weaknesses
              </Text>

              <ResultList
                items={Array.isArray(cv.weaknesses) ? cv.weaknesses : []}
                type="danger"
              />
            </View>
          </View>

          <View style={styles.cvSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: C.warning,
                },
              ]}
            >
              Suggestions
            </Text>

              <ResultList
                items={Array.isArray(cv.suggestions) ? cv.suggestions : []}
                type="warning"
              />
          </View>

          <View style={styles.cvColumns}>
            <View style={styles.cvSection}>
              <Text style={styles.sectionTitle}>Missing Sections</Text>
              <ResultList items={cv.missing_sections ?? []} type="danger" />
            </View>
            <View style={styles.cvSection}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <ResultList items={cv.skills ?? []} type="success" />
            </View>
          </View>
          <ResultList items={cv.recommendations ?? []} type="warning" />
        </View>
      )}

      {showJobSelection && (
        <View style={styles.resultCard}>
          <View
            style={
              styles.selectionHeader
            }
          >
            <View
              style={
                styles.selectionHeaderText
              }
            >
              <Text style={styles.cardTitle}>
                Choose a Saved Job
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Select one of your saved
                jobs to practice an AI
                interview.
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setShowJobSelection(
                  false
                )
              }
              hitSlop={10}
            >
              <X
                size={20}
                color={C.textSec}
              />
            </Pressable>
          </View>

          <View style={styles.jobsContainer}>
            {jobs.map((job) => (
              <Pressable
                key={
                  job.job_id ??
                  job.id
                }
                onPress={() =>
                  startInterview(job)
                }
                disabled={loading}
                style={({ pressed }) => [
                  styles.jobCard,
                  pressed &&
                    styles.pressed,
                  loading &&
                    styles.disabledButton,
                ]}
              >
                <Text
                  style={styles.jobTitle}
                  numberOfLines={2}
                >
                  {job.title}
                </Text>

                {!!job.company && (
                  <Text
                    style={
                      styles.jobCompany
                    }
                  >
                    {job.company}
                  </Text>
                )}

                {!!job.location && (
                  <Text
                    style={
                      styles.jobLocation
                    }
                  >
                    {job.location}
                  </Text>
                )}

                {typeof job.match ===
                  "number" && (
                  <Text
                    style={
                      styles.matchText
                    }
                  >
                    {job.match}% Match
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {interview && (
        <View style={styles.resultCard}>
          <View
            style={styles.interviewHeader}
          >
            <View style={styles.interviewHeaderContent}>
              <View
                style={
                  styles.interviewTitleRow
                }
              >
                <Bot
                  size={19}
                  color={C.success}
                />

                <Text
                  style={
                    styles.interviewTitle
                  }
                >
                  AI Interview
                </Text>
              </View>

              <Text
                style={
                  styles.interviewJobTitle
                }
              >
                {interview.job_title}
              </Text>
            </View>

            <Pressable
              onPress={
                closeInterview
              }
              hitSlop={10}
            >
              <X
                size={20}
                color={C.textSec}
              />
            </Pressable>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={
                styles.progressBackground
              }
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={styles.progressText}
            >
              {answeredCount} of{" "}
              {questionCount} answered
            </Text>
          </View>

          <View
            style={styles.questionsContainer}
          >
            {interview.questions?.map(
              (
                question,
                index
              ) => (
                <View
                  key={
                    question.id
                  }
                  style={
                    styles.questionCard
                  }
                >
                  <Text
                    style={
                      styles.questionNumber
                    }
                  >
                    Question{" "}
                    {index + 1}
                  </Text>

                  <Text
                    style={
                      styles.questionText
                    }
                  >
                    {
                      question.question
                    }
                  </Text>

                  <View
                    style={
                      styles.optionsContainer
                    }
                  >
                    {(
                      Object.entries(
                        question.options
                      ) as [
                        string,
                        string
                      ][]
                    ).map(
                      ([
                        letter,
                        text,
                      ]) => {
                        const selected =
                          selectedAnswers[
                            question.id
                          ] ===
                          letter;

                        const result = submission?.results?.find(
                          (item) => Number(item.id) === Number(question.id),
                        );

                        const isCorrect =
                          showResults &&
                          letter ===
                            result?.correct_answer;

                        const isWrong =
                          showResults &&
                          selected &&
                          letter !==
                            result?.correct_answer;

                        let backgroundColor: string =
                          C.bg;

                        let borderColor: string =
                          C.border;

                        if (showResults) {
                          if (isCorrect) {
                            backgroundColor =
                              C.successBg;
                            borderColor =
                              C.success;
                          } else if (isWrong) {
                            backgroundColor =
                              C.dangerBg;
                            borderColor =
                              C.danger;
                          }
                        } else if (selected) {
                          backgroundColor =
                            C.accentLight;
                          borderColor =
                            C.accent;
                        }

                        return (
                          <Pressable
                            key={
                              letter
                            }
                            onPress={() =>
                              handleAnswer(
                                question.id,
                                letter
                              )
                            }
                            disabled={
                              showResults
                            }
                            style={({ pressed }) => [
                              styles.option,
                              {
                                backgroundColor:
                                  backgroundColor,
                                borderColor:
                                  borderColor,
                              },
                              pressed &&
                                !showResults &&
                                styles.pressed,
                            ]}
                          >
                            <Text
                              style={
                                styles.optionText
                              }
                            >
                              <Text
                                style={
                                  styles.optionLetter
                                }
                              >
                                {letter}.
                              </Text>{" "}
                              {text}
                            </Text>

                            {showResults &&
                              isCorrect && (
                                <Text
                                  style={[
                                    styles.answerIcon,
                                    {
                                      color:
                                        C.success,
                                    },
                                  ]}
                                >
                                  ✓
                                </Text>
                              )}

                            {showResults &&
                              isWrong && (
                                <Text
                                  style={[
                                    styles.answerIcon,
                                    {
                                      color:
                                        C.danger,
                                    },
                                  ]}
                                >
                                  ✗
                                </Text>
                              )}
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                  {showResults && submission?.results?.find(
                    (item) => Number(item.id) === Number(question.id),
                  ) && (
                    <Text style={styles.progressText}>
                      Your answer: {submission.results.find((item) => Number(item.id) === Number(question.id))?.student_answer || "—"}
                      {"  •  "}Correct: {submission.results.find((item) => Number(item.id) === Number(question.id))?.correct_answer}
                    </Text>
                  )}
                </View>
              )
            )}
          </View>

          <View
            style={
              styles.interviewButtons
            }
          >
            {!showResults ? (
              <ActionButton
                title="Submit Answers"
                variant="primary"
                onPress={
                  handleSubmit
                }
                loading={phase === "submitting"}
                disabled={
                  loading
                }
              />
            ) : (
              <>
                <ActionButton
                  title="Retake Quiz"
                  onPress={
                    handleRetake
                  }
                  loading={phase === "retaking"}
                />

                <ActionButton
                  title="Close Interview"
                  variant="primary"
                  onPress={
                    closeInterview
                  }
                  disabled={loading}
                />
              </>
            )}
          </View>

          {showResults && (
            <View
              style={[
                styles.scoreResult,
                {
                  backgroundColor:
                    resultPercentage >=
                    70
                      ? C.successBg
                      : C.dangerBg,
                  borderColor:
                    resultPercentage >=
                    70
                      ? C.success
                      : C.danger,
                },
              ]}
            >
              <View>
                <Text
                  style={
                    styles.finalScore
                  }
                >
                  {score}/
                  {submission?.total_questions ?? questionCount}
                </Text>

                <Text
                  style={
                    styles.finalMessage
                  }
                >
                  {resultPercentage >=
                  70
                    ? "🎉 Excellent work!"
                    : "💪 Keep practicing!"}
                </Text>
              </View>

              <View
                style={[
                  styles.percentageBadge,
                  {
                    backgroundColor:
                      resultPercentage >=
                      70
                        ? C.success
                        : C.danger,
                  },
                ]}
              >
                <Text
                  style={
                    styles.percentageText
                  }
                >
                  {Math.round(
                    resultPercentage
                  )}
                  %
                </Text>
              </View>
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.cvSection}>
              <Text style={styles.sectionTitle}>Attempt History</Text>
              {history.map((attempt) => (
                <View key={attempt.attempt_id} style={styles.resultItem}>
                  <Text style={styles.resultText}>
                    #{attempt.attempt_id} · {attempt.status === "open" ? "In Progress" : attempt.status === "completed" ? "Completed" : "Abandoned"}
                    {attempt.percentage == null ? "" : ` · ${attempt.percentage}%`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontFamily: F,
    fontSize: 23,
    fontWeight: "900",
    color: C.text,
  },

  subtitle: {
    marginTop: 4,
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
  },

  toolsContainer: {
    flexDirection: "row",
    gap: 12,
  },

  toolCard: {
    flex: 1,
    minHeight: 220,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 15,
  },

  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  toolTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 7,
  },

  toolDescription: {
    fontFamily: F,
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
    flex: 1,
    minHeight: 48,
    marginBottom: 12,
  },

  actionButton: {
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: C.accent,
    backgroundColor: C.surface,
  },

  primaryButton: {
    backgroundColor: C.accent,
  },

  actionButtonText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
  },

  outlineButtonText: {
    color: C.accent,
  },

  primaryButtonText: {
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.75,
  },

  disabledButton: {
    opacity: 0.55,
  },

  errorBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.danger,
  },

  errorText: {
    fontFamily: F,
    color: C.danger,
    fontSize: 13,
    lineHeight: 19,
  },

  resultCard: {
    marginTop: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 20,
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  cvHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  cvHeaderText: {
    flex: 1,
    marginLeft: 16,
  },

  analysisTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  analysisTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  analysisSubtitle: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 5,
    lineHeight: 17,
  },

  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  scoreRingInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  scoreNumber: {
    fontFamily: F,
    fontSize: 21,
    fontWeight: "800",
    color: C.text,
  },

  scoreLabel: {
    fontFamily: F,
    fontSize: 9,
    color: C.textSec,
  },

  cvColumns: {
    gap: 22,
    marginBottom: 22,
  },

  cvSection: {
    marginBottom: 5,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },

  resultList: {
    gap: 10,
  },

  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  resultText: {
    flex: 1,
    fontFamily: F,
    fontSize: 13,
    lineHeight: 19,
    color: C.text,
  },

  selectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  selectionHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  cardTitle: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },

  cardSubtitle: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 5,
    lineHeight: 18,
  },

  jobsContainer: {
    gap: 12,
  },

  jobCard: {
    padding: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },

  jobTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    lineHeight: 20,
  },

  jobCompany: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 5,
  },

  jobLocation: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 7,
  },

  matchText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.success,
    marginTop: 10,
  },

  interviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  interviewHeaderContent: {
    flex: 1,
    paddingRight: 12,
  },

  interviewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  interviewTitle: {
    fontFamily: F,
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },

  interviewJobTitle: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    marginTop: 6,
  },

  progressContainer: {
    marginBottom: 20,
  },

  progressBackground: {
    height: 7,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 4,
  },

  progressText: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
    marginTop: 5,
  },

  questionsContainer: {
    gap: 18,
  },

  questionCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 17,
  },

  questionNumber: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
    fontWeight: "600",
    marginBottom: 8,
  },

  questionText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    color: C.text,
    marginBottom: 16,
  },

  optionsContainer: {
    gap: 10,
  },

  option: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  optionText: {
    flex: 1,
    fontFamily: F,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },

  optionLetter: {
    fontWeight: "800",
  },

  answerIcon: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 8,
  },

  interviewButtons: {
    marginTop: 24,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },

  scoreResult: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  finalScore: {
    fontFamily: F,
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
  },

  finalMessage: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 4,
  },

  percentageBadge: {
    marginLeft: "auto",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  percentageText: {
    fontFamily: F,
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
