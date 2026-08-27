import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";
const COLORS = {
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F2F4",

  accent: "#C8A46A",
  accentLight: "#F5EDD8",

  success: "#22C55E",
  error: "#EF4444",
};

const TABS = [
  "Overview",
  "Experience",
  "Education",
  "Skills",
] as const;

type Tab = (typeof TABS)[number];

type ExperienceItem = {
  id?: number | string;
  position?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

type SkillItem = {
  id?: number;
  name: string;
};

type Student = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  univ?: string;
  major?: string;
  gpa?: string | number;
  graduation?: string | number;
  skills?: string | string[] | SkillItem[];
  experiences?: ExperienceItem[];
  completion?: number;
  portfolio?: string;
  linkedin?: string;
  github?: string;
};

type Toast = {
  type: "success" | "error";
  message: string;
};

const normalizeSkills = (
  skills: Student["skills"]
): string[] => {
  if (!skills) return [];

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  if (Array.isArray(skills)) {
    return skills
      .map((skill) => {
        if (typeof skill === "string") {
          return skill.trim();
        }

        return skill?.name?.trim() || "";
      })
      .filter(Boolean);
  }

  return [];
};

const normalizeExperiences = (
  experiences: Student["experiences"]
): ExperienceItem[] => {
  if (!Array.isArray(experiences)) {
    return [];
  }

  return experiences.filter(
    (experience) =>
      experience &&
      typeof experience === "object"
  );
};

const normalizeStudent = (data: any): Student => {
  const source =
    data?.data ??
    data?.student ??
    data;

  return {
    id: source?.id,
    name: source?.name ?? "",
    email: source?.email ?? "",
    phone: source?.phone ?? "",
    avatar: source?.avatar ?? "",
    headline: source?.headline ?? "",
    location: source?.location ?? "",
    bio: source?.bio ?? "",
    univ:
      source?.univ ??
      source?.university ??
      "",
    major: source?.major ?? "",
    gpa: source?.gpa ?? "",
    graduation:
      source?.graduation ??
      source?.graduation_year ??
      "",
    skills: source?.skills ?? [],
    experiences: normalizeExperiences(
      source?.experiences ??
        source?.experience
    ),
    completion: Number(
      source?.completion ?? 0
    ),
    portfolio:
      source?.portfolio ?? "",
    linkedin:
      source?.linkedin ?? "",
    github:
      source?.github ?? "",
  };
};

export default function Profile() {
  const [student, setStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [tab, setTab] =
    useState<Tab>("Overview");

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [toast, setToast] =
    useState<Toast | null>(null);

  const fetchProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response =
        await API.get("/student/profile");

      console.log(
        "PROFILE RESPONSE:",
        response.data
      );

      const profileData =
        normalizeStudent(
          response.data
        );

      setStudent(profileData);
    } catch (error: any) {
      console.error(
        "PROFILE GET ERROR:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to load profile data";

      setToast({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  useSyncRefresh("student", () => fetchProfile(false));

  useEffect(() => {
    void fetchProfile(true);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = async (
    formData: Student
  ) => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        skills: normalizeSkills(
          formData.skills
        ),
        experiences:
          normalizeExperiences(
            formData.experiences
          ),
      };

      const response =
        await API.put(
          "/student/profile",
          payload
        );

      console.log(
        "PROFILE UPDATE RESPONSE:",
        response.data
      );

      const updatedProfile =
        normalizeStudent(
          response.data
        );

      setStudent(updatedProfile);

      setShowEditModal(false);

      setToast({
        type: "success",
        message:
          "Changes saved successfully",
      });
    } catch (error: any) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.errors;

      let message =
        "Failed to save changes, please try again";

      if (
        typeof backendMessage ===
        "string"
      ) {
        message = backendMessage;
      } else if (
        backendMessage &&
        typeof backendMessage ===
          "object"
      ) {
        const firstError =
          Object.values(
            backendMessage
          )[0];

        if (Array.isArray(firstError)) {
          message = String(
            firstError[0]
          );
        } else if (firstError) {
          message = String(
            firstError
          );
        }
      }

      setToast({
        type: "error",
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const openLink = async (
    url: string
  ) => {
    if (!url) return;

    const finalUrl =
      url.startsWith("http")
        ? url
        : `https://${url}`;

    try {
      await Linking.openURL(
        finalUrl
      );
    } catch {
      Alert.alert(
        "Unable to open link",
        "The provided link could not be opened."
      );
    }
  };

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={COLORS.accent}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading Profile...
        </Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <View
          style={
            styles.errorIcon
          }
        >
          <Ionicons
            name="person-outline"
            size={30}
            color={COLORS.error}
          />
        </View>

        <Text
          style={
            styles.errorTitle
          }
        >
          Profile not found
        </Text>

        <Text
          style={
            styles.errorDescription
          }
        >
          We couldn&apos;t retrieve your
          profile information at this
          time.
        </Text>

        <Pressable
          onPress={() => void fetchProfile(true)}
          style={
            styles.retryButton
          }
        >
          <Text
            style={
              styles.retryButtonText
            }
          >
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const skillsList =
    normalizeSkills(
      student.skills
    );

  const experiencesList =
    normalizeExperiences(
      student.experiences
    );

  const completion = Math.min(
    100,
    Math.max(
      0,
      Number(
        student.completion ?? 0
      )
    )
  );

  const avatarUrl =
    student.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      student.name || "Student"
    )}&background=6366f1&color=fff&size=176`;

  return (
    <View style={styles.container}>
      {toast && (
        <View
          style={[
            styles.toast,
            toast.type === "success"
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <Ionicons
            name={
              toast.type === "success"
                ? "checkmark-circle-outline"
                : "alert-circle-outline"
            }
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={styles.toastText}
          >
            {toast.message}
          </Text>

          <Pressable
            onPress={() =>
              setToast(null)
            }
          >
            <Ionicons
              name="close"
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.profileCard
          }
        >
          <View
            style={
              styles.profileTop
            }
          >
            <View
              style={
                styles.profileIdentity
              }
            >
              <Image
                source={{
                  uri: avatarUrl,
                }}
                style={
                  styles.avatar
                }
              />

              <View
                style={
                  styles.identityInfo
                }
              >
                <Text
                  style={
                    styles.profileName
                  }
                >
                  {student.name ||
                    "Student"}
                </Text>

                {student.headline ? (
                  <Text
                    style={
                      styles.headline
                    }
                  >
                    {
                      student.headline
                    }
                  </Text>
                ) : null}

                {student.location ? (
                  <View
                    style={
                      styles.locationRow
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={
                        COLORS.textSec
                      }
                    />

                    <Text
                      style={
                        styles.locationText
                      }
                    >
                      {
                        student.location
                      }
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Pressable
              onPress={() =>
                setShowEditModal(
                  true
                )
              }
              style={
                styles.editButton
              }
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={
                  COLORS.accent
                }
              />

              <Text
                style={
                  styles.editButtonText
                }
              >
                Edit
              </Text>
            </Pressable>
          </View>

          {student.bio ? (
            <Text
              style={styles.bio}
            >
              {student.bio}
            </Text>
          ) : null}

          {student.portfolio ||
          student.linkedin ||
          student.github ? (
            <View
              style={
                styles.linksContainer
              }
            >
              {student.portfolio ? (
                <Pressable
                  onPress={() =>
                    openLink(
                      student.portfolio!
                    )
                  }
                  style={
                    styles.linkButton
                  }
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={
                      COLORS.accent
                    }
                  />

                  <Text
                    style={
                      styles.linkText
                    }
                  >
                    Portfolio
                  </Text>

                  <Ionicons
                    name="open-outline"
                    size={12}
                    color={
                      COLORS.textMuted
                    }
                  />
                </Pressable>
              ) : null}

              {student.linkedin ? (
                <Pressable
                  onPress={() =>
                    openLink(
                      student.linkedin!
                    )
                  }
                  style={
                    styles.linkButton
                  }
                >
                  <Ionicons
                    name="logo-linkedin"
                    size={16}
                    color="#0A66C2"
                  />

                  <Text
                    style={
                      styles.linkText
                    }
                  >
                    LinkedIn
                  </Text>

                  <Ionicons
                    name="open-outline"
                    size={12}
                    color={
                      COLORS.textMuted
                    }
                  />
                </Pressable>
              ) : null}

              {student.github ? (
                <Pressable
                  onPress={() =>
                    openLink(
                      student.github!
                    )
                  }
                  style={
                    styles.linkButton
                  }
                >
                  <Ionicons
                    name="logo-github"
                    size={16}
                    color={
                      COLORS.text
                    }
                  />

                  <Text
                    style={
                      styles.linkText
                    }
                  >
                    GitHub
                  </Text>

                  <Ionicons
                    name="open-outline"
                    size={12}
                    color={
                      COLORS.textMuted
                    }
                  />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View
          style={
            styles.completionCard
          }
        >
          <View
            style={
              styles.completionHeader
            }
          >
            <View
              style={
                styles.completionTitleRow
              }
            >
              <View
                style={
                  styles.sparkleIcon
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={
                    COLORS.accent
                  }
                />
              </View>

              <Text
                style={
                  styles.completionTitle
                }
              >
                Profile Completion
              </Text>
            </View>

            <Text
              style={
                styles.completionValue
              }
            >
              {completion}%
            </Text>
          </View>

          <View
            style={
              styles.progressTrack
            }
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${completion}%`,
                },
              ]}
            />
          </View>
        </View>

        <View
          style={styles.tabsCard}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.tabsContainer
            }
          >
            {TABS.map(
              (item) => {
                const active =
                  tab === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setTab(
                        item
                      )
                    }
                    style={[
                      styles.tabButton,
                      active &&
                        styles.activeTabButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        active &&
                          styles.activeTabText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          <View
            style={
              styles.tabContent
            }
          >
            {tab ===
              "Overview" && (
              <OverviewTab
                student={
                  student
                }
              />
            )}

            {tab ===
              "Experience" && (
              <ExperienceTab
                experiences={
                  experiencesList
                }
              />
            )}

            {tab ===
              "Education" && (
              <EducationTab
                student={
                  student
                }
              />
            )}

            {tab ===
              "Skills" && (
              <SkillsTab
                skills={
                  skillsList
                }
              />
            )}
          </View>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={
          showEditModal
        }
        student={student}
        saving={saving}
        onClose={() =>
          setShowEditModal(
            false
          )
        }
        onSave={
          handleSave
        }
      />
    </View>
  );
}

function OverviewTab({
  student,
}: {
  student: Student;
}) {
  return (
    <View>
      <Text
        style={
          styles.tabHeading
        }
      >
        Contact Details
      </Text>

      <View
        style={
          styles.contactGrid
        }
      >
        <ContactCard
          icon="mail-outline"
          label="Email Address"
          value={
            student.email ||
            "—"
          }
        />

        <ContactCard
          icon="call-outline"
          label="Phone Number"
          value={
            student.phone ||
            "—"
          }
        />
      </View>
    </View>
  );
}

function ContactCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.contactCard
      }
    >
      <View
        style={
          styles.contactIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            COLORS.accent
          }
        />
      </View>

      <View
        style={
          styles.contactInfo
        }
      >
        <Text
          style={
            styles.contactLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.contactValue
          }
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ExperienceTab({
  experiences,
}: {
  experiences: ExperienceItem[];
}) {
  return (
    <View>
      <Text
        style={
          styles.tabHeading
        }
      >
        Work Experience
      </Text>

      {experiences.length >
      0 ? (
        <View
          style={
            styles.experienceList
          }
        >
          {experiences.map(
            (
              experience,
              index
            ) => (
              <View
                key={
                  experience.id ??
                  index
                }
                style={
                  styles.experienceCard
                }
              >
                <View
                  style={
                    styles.experienceIcon
                  }
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color={
                      COLORS.accent
                    }
                  />
                </View>

                <View
                  style={
                    styles.experienceContent
                  }
                >
                  <Text
                    style={
                      styles.experiencePosition
                    }
                  >
                    {experience.position ||
                      "Experience"}
                  </Text>

                  {experience.company ? (
                    <Text
                      style={
                        styles.experienceCompany
                      }
                    >
                      {
                        experience.company
                      }
                    </Text>
                  ) : null}

                  {experience.start_date ||
                  experience.end_date ? (
                    <Text
                      style={
                        styles.experienceDate
                      }
                    >
                      {experience.start_date ||
                        ""}

                      {experience.start_date &&
                      experience.end_date
                        ? " – "
                        : ""}

                      {experience.end_date ||
                        "Present"}
                    </Text>
                  ) : null}

                  {experience.description ? (
                    <Text
                      style={
                        styles.experienceDescription
                      }
                    >
                      {
                        experience.description
                      }
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          )}
        </View>
      ) : (
        <EmptyState
          icon="briefcase-outline"
          text="No experiences listed yet."
        />
      )}
    </View>
  );
}

function EducationTab({
  student,
}: {
  student: Student;
}) {
  const hasEducation =
    !!(
      student.univ ||
      student.major ||
      student.gpa ||
      student.graduation
    );

  return (
    <View>
      <Text
        style={
          styles.tabHeading
        }
      >
        Education History
      </Text>

      {hasEducation ? (
        <View
          style={
            styles.educationCard
          }
        >
          <View
            style={
              styles.educationIcon
            }
          >
            <Ionicons
              name="school-outline"
              size={24}
              color={
                COLORS.accent
              }
            />
          </View>

          <View
            style={
              styles.educationContent
            }
          >
            <Text
              style={
                styles.universityName
              }
            >
              {student.univ ||
                "University"}
            </Text>

            {student.major ? (
              <Text
                style={
                  styles.majorText
                }
              >
                B.S. in{" "}
                {student.major}
              </Text>
            ) : null}

            {student.gpa ||
            student.graduation ? (
              <Text
                style={
                  styles.educationMeta
                }
              >
                {student.gpa
                  ? `GPA: ${student.gpa}`
                  : ""}

                {student.gpa &&
                student.graduation
                  ? " • "
                  : ""}

                {student.graduation
                  ? `Class of ${student.graduation}`
                  : ""}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <EmptyState
          icon="school-outline"
          text="No education info listed yet."
        />
      )}
    </View>
  );
}

function SkillsTab({
  skills,
}: {
  skills: string[];
}) {
  return (
    <View>
      <Text
        style={
          styles.tabHeading
        }
      >
        Skills & Technologies
      </Text>

      {skills.length > 0 ? (
        <View
          style={
            styles.skillsContainer
          }
        >
          {skills.map(
            (
              skill,
              index
            ) => (
              <View
                key={`${skill}-${index}`}
                style={
                  styles.skillBadge
                }
              >
                <Text
                  style={
                    styles.skillText
                  }
                >
                  {skill}
                </Text>
              </View>
            )
          )}
        </View>
      ) : (
        <EmptyState
          icon="code-slash-outline"
          text="No skills listed yet."
        />
      )}
    </View>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View
      style={
        styles.emptyState
      }
    >
      <Ionicons
        name={icon}
        size={30}
        color={
          COLORS.textMuted
        }
      />

      <Text
        style={
          styles.emptyStateText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function EditProfileModal({
  visible,
  student,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  student: Student;
  saving: boolean;
  onClose: () => void;
  onSave: (
    data: Student
  ) => Promise<void>;
}) {
  const [name, setName] =
    useState(
      student.name || ""
    );

  const [phone, setPhone] =
    useState(
      student.phone || ""
    );

  const [headline, setHeadline] =
    useState(
      student.headline || ""
    );

  const [location, setLocation] =
    useState(
      student.location || ""
    );

  const [bio, setBio] =
    useState(
      student.bio || ""
    );

  const [univ, setUniv] =
    useState(
      student.univ || ""
    );

  const [major, setMajor] =
    useState(
      student.major || ""
    );

  const [gpa, setGpa] =
    useState(
      String(
        student.gpa || ""
      )
    );

  const [graduation, setGraduation] =
    useState(
      String(
        student.graduation || ""
      )
    );

  const [skills, setSkills] =
    useState(
      normalizeSkills(
        student.skills
      ).join(", ")
    );

  const [portfolio, setPortfolio] =
    useState(
      student.portfolio || ""
    );

  const [linkedin, setLinkedin] =
    useState(
      student.linkedin || ""
    );

  const [github, setGithub] =
    useState(
      student.github || ""
    );

  useEffect(() => {
    if (!visible) return;

    setName(
      student.name || ""
    );

    setPhone(
      student.phone || ""
    );

    setHeadline(
      student.headline || ""
    );

    setLocation(
      student.location || ""
    );

    setBio(
      student.bio || ""
    );

    setUniv(
      student.univ || ""
    );

    setMajor(
      student.major || ""
    );

    setGpa(
      String(
        student.gpa || ""
      )
    );

    setGraduation(
      String(
        student.graduation || ""
      )
    );

    setSkills(
      normalizeSkills(
        student.skills
      ).join(", ")
    );

    setPortfolio(
      student.portfolio || ""
    );

    setLinkedin(
      student.linkedin || ""
    );

    setGithub(
      student.github || ""
    );
  }, [visible, student]);

  const submit = async () => {
    await onSave({
      ...student,
      name: name.trim(),
      phone: phone.trim(),
      headline: headline.trim(),
      location: location.trim(),
      bio: bio.trim(),
      univ: univ.trim(),
      major: major.trim(),
      gpa: gpa.trim(),
      graduation:
        graduation.trim(),
      skills,
      portfolio:
        portfolio.trim(),
      linkedin:
        linkedin.trim(),
      github:
        github.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={
        saving
          ? undefined
          : onClose
      }
    >
      <View
        style={
          styles.modalContainer
        }
      >
        <View
          style={
            styles.modalHeader
          }
        >
          <View>
            <Text
              style={
                styles.modalTitle
              }
            >
              Edit Profile
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Update your profile
              information
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            disabled={saving}
            style={
              styles.closeButton
            }
          >
            <Ionicons
              name="close"
              size={22}
              color={
                COLORS.text
              }
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.modalContent
          }
          keyboardShouldPersistTaps="handled"
        >
          <EditField
            label="Full Name"
            value={name}
            onChangeText={
              setName
            }
            placeholder="Your name"
          />

          <EditField
            label="Phone Number"
            value={phone}
            onChangeText={
              setPhone
            }
            placeholder="Your phone number"
            keyboardType="phone-pad"
          />

          <EditField
            label="Headline"
            value={headline}
            onChangeText={
              setHeadline
            }
            placeholder="e.g. Computer Engineering Student"
          />

          <EditField
            label="Location"
            value={location}
            onChangeText={
              setLocation
            }
            placeholder="e.g. Nablus, Palestine"
          />

          <EditField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell employers about yourself"
            multiline
          />

          <EditField
            label="University"
            value={univ}
            onChangeText={
              setUniv
            }
            placeholder="University name"
          />

          <EditField
            label="Major"
            value={major}
            onChangeText={
              setMajor
            }
            placeholder="Your major"
          />

          <View
            style={
              styles.twoColumns
            }
          >
            <View
              style={
                styles.halfField
              }
            >
              <EditField
                label="GPA"
                value={gpa}
                onChangeText={
                  setGpa
                }
                placeholder="GPA"
                keyboardType="decimal-pad"
              />
            </View>

            <View
              style={
                styles.halfField
              }
            >
              <EditField
                label="Graduation"
                value={
                  graduation
                }
                onChangeText={
                  setGraduation
                }
                placeholder="Year"
                keyboardType="numeric"
              />
            </View>
          </View>

          <EditField
            label="Skills"
            value={skills}
            onChangeText={
              setSkills
            }
            placeholder="React, JavaScript, Laravel"
          />

          <Text
            style={
              styles.helperText
            }
          >
            Separate skills with
            commas.
          </Text>

          <EditField
            label="Portfolio"
            value={
              portfolio
            }
            onChangeText={
              setPortfolio
            }
            placeholder="https://yourportfolio.com"
            keyboardType="url"
            autoCapitalize="none"
          />

          <EditField
            label="LinkedIn"
            value={
              linkedin
            }
            onChangeText={
              setLinkedin
            }
            placeholder="https://linkedin.com/in/..."
            keyboardType="url"
            autoCapitalize="none"
          />

          <EditField
            label="GitHub"
            value={
              github
            }
            onChangeText={
              setGithub
            }
            placeholder="https://github.com/..."
            keyboardType="url"
            autoCapitalize="none"
          />

          <Pressable
            onPress={submit}
            disabled={saving}
            style={[
              styles.saveButton,
              saving &&
                styles.saveButtonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={saving}
            style={
              styles.cancelButton
            }
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              Cancel
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?:
    | "none"
    | "sentences"
    | "words"
    | "characters";
}) {
  return (
    <View
      style={
        styles.editField
      }
    >
      <Text
        style={
          styles.editLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          COLORS.textMuted
        }
        multiline={multiline}
        keyboardType={
          keyboardType
        }
        autoCapitalize={
          autoCapitalize
        }
        textAlignVertical={
          multiline
            ? "top"
            : "center"
        }
        style={[
          styles.editInput,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: "600",
  },

  errorContainer: {
    margin: 24,
    marginTop: 80,
    padding: 28,
    backgroundColor:
      COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
  },

  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor:
      "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  errorDescription: {
    marginTop: 8,
    color: COLORS.textSec,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor:
      COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  toast: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 1000,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },

  toastSuccess: {
    backgroundColor:
      "#15803D",
  },

  toastError: {
    backgroundColor:
      "#B91C1C",
  },

  toastText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  profileCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: 20,
    marginBottom: 14,
  },

  profileTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  profileIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.surface,
  },

  identityInfo: {
    flex: 1,
  },

  profileName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },

  headline: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  locationText: {
    color: COLORS.textSec,
    fontSize: 12,
    flexShrink: 1,
  },

  editButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  editButtonText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  bio: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 21,
  },

  linksContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  linkButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor:
      COLORS.accentLight,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  linkText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },

  completionCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: 18,
    marginBottom: 14,
  },

  completionHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  completionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sparkleIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor:
      COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  completionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  completionValue: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "800",
  },

  progressTrack: {
    height: 8,
    backgroundColor:
      "#F5EDD8",
    borderRadius: 99,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor:
      COLORS.accent,
    borderRadius: 99,
  },

  tabsCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    overflow: "hidden",
  },

  tabsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },

  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 11,
  },

  activeTabButton: {
    backgroundColor:
      COLORS.accentLight,
  },

  tabText: {
    color: COLORS.textSec,
    fontSize: 13,
    fontWeight: "600",
  },

  activeTabText: {
    color: COLORS.accent,
    fontWeight: "800",
  },

  tabContent: {
    padding: 20,
  },

  tabHeading: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },

  contactGrid: {
    gap: 12,
  },

  contactCard: {
    minHeight: 82,
    padding: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor:
      COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  contactInfo: {
    flex: 1,
  },

  contactLabel: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },

  contactValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  experienceList: {
    gap: 12,
  },

  experienceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: "row",
    gap: 13,
  },

  experienceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor:
      COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  experienceContent: {
    flex: 1,
  },

  experiencePosition: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  experienceCompany: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },

  experienceDate: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 9,
  },

  experienceDescription: {
    color: COLORS.textSec,
    fontSize: 13,
    lineHeight: 20,
  },

  educationCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: "row",
    gap: 14,
  },

  educationIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor:
      COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  educationContent: {
    flex: 1,
  },

  universityName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  majorText: {
    color: COLORS.textSec,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  educationMeta: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor:
      COLORS.accentLight,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      "#E3DDFE",
  },

  skillText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  emptyStateText: {
    color: COLORS.textSec,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },

  modalContainer: {
    flex: 1,
    backgroundColor:
      COLORS.bg,
  },

  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor:
      COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: COLORS.textSec,
    fontSize: 12,
    marginTop: 3,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      COLORS.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    padding: 20,
    paddingBottom: 50,
  },

  editField: {
    marginBottom: 15,
  },

  editLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },

  editInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    backgroundColor:
      COLORS.surface,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 14,
  },

  multilineInput: {
    minHeight: 100,
    paddingTop: 13,
    paddingBottom: 13,
  },

  helperText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: -8,
    marginBottom: 15,
  },

  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },

  halfField: {
    flex: 1,
  },

  saveButton: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor:
      COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: "700",
  },
});
