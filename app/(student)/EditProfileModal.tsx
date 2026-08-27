import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  AlertCircle,
  Book,
  Briefcase,
  Calendar,
  GraduationCap,
  Link,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";

import { C } from "../../constants/tokens";

interface Skill {
  id: number;
  name: string;
}

interface Experience {
  id?: number | string;
  position: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface StudentData {
  id?: number;
  name: string;
  email: string;
  headline?: string | null;
  bio?: string | null;
  univ?: string | null;
  major?: string | null;
  graduation?: string | null;
  gpa?: string | number | null;
  location?: string | null;
  portfolio?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
  avatar?: string | null;
  skills?: Skill[];
  experiences?: Experience[];
  completion?: number;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData;
  save: (data: any) => Promise<void> | void;
  saving?: boolean;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  student,
  save,
  saving = false,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    headline: "",
    bio: "",
    univ: "",
    major: "",
    graduation: "",
    gpa: "",
    location: "",
    portfolio: "",
    phone: "",
    linkedin: "",
    github: "",
    avatar: "",
    skills: [] as Skill[],
    experiences: [] as Experience[],
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [localSaving, setLocalSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        headline: student.headline || "",
        bio: student.bio || "",
        univ: student.univ || "",
        major: student.major || "",
        graduation: student.graduation || "",
        gpa:
          student.gpa !== null && student.gpa !== undefined
            ? String(student.gpa)
            : "",
        location: student.location || "",
        portfolio: student.portfolio || "",
        phone: student.phone || "",
        linkedin: student.linkedin || "",
        github: student.github || "",
        avatar: student.avatar || "",
        skills: student.skills ?? [],
        experiences: student.experiences ?? [],
      });

      setAvatarPreview(student.avatar || "");
      setLocalError(null);
      setLocalSuccess(false);
    }
  }, [isOpen, student]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const uri = result.assets[0].uri;

      setAvatarPreview(uri);

      setFormData((prev) => ({
        ...prev,
        avatar: uri,
      }));
    } catch {
      Alert.alert(
        "Error",
        "Unable to select the profile picture. Please try again."
      );
    }
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          id: Date.now(),
          name: "",
        },
      ],
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill, i) =>
        i === index
          ? {
              ...skill,
              name: value,
            }
          : skill
      ),
    }));
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: Date.now(),
          position: "",
          company: "",
          start_date: "",
          end_date: "",
          description: "",
        },
      ],
    }));
  };

  const updateExperience = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((experience, i) =>
        i === index
          ? {
              ...experience,
              [field]: value,
            }
          : experience
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setLocalSaving(true);
    setLocalError(null);
    setLocalSuccess(false);

    try {
      const formattedSkills = formData.skills
        .map((skill) => skill.name.trim())
        .filter(Boolean);

      const formattedExperiences = formData.experiences
        .filter(
          (experience) =>
            experience.position.trim() ||
            experience.company.trim() ||
            experience.description.trim()
        )
        .map((experience) => ({
          id: experience.id,
          position: experience.position.trim(),
          company: experience.company.trim(),
          start_date: experience.start_date.trim(),
          end_date: experience.end_date.trim(),
          description: experience.description.trim(),
        }));

      await save({
        ...formData,
        gpa: formData.gpa === "" ? null : Number(formData.gpa),
        skills: formattedSkills,
        experiences: formattedExperiences,
      });

      setLocalSuccess(true);

      setTimeout(() => {
        onClose();
      }, 600);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.email?.[0] ||
        error?.message ||
        "Failed to save changes. Please try again.";

      setLocalError(message);
    } finally {
      setLocalSaving(false);
    }
  };

  const isButtonDisabled = saving || localSaving;

  const avatarUrl =
    avatarPreview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      formData.name || "User"
    )}&background=6366f1&color=fff&size=200`;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isButtonDisabled) {
          onClose();
        }
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Edit Profile</Text>

              <Text style={styles.subtitle}>
                Update your personal and academic information
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isButtonDisabled}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && !isButtonDisabled && styles.pressed,
                isButtonDisabled && styles.disabled,
              ]}
            >
              <X size={20} color={C.textSec} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {localError && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color="#dc2626" />
                <Text style={styles.errorText}>{localError}</Text>
              </View>
            )}

            {localSuccess && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  Profile updated successfully!
                </Text>
              </View>
            )}

            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />

                {!isButtonDisabled && (
                  <Pressable
                    onPress={handleAvatarChange}
                    style={({ pressed }) => [
                      styles.uploadButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Upload size={15} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>

              <View>
                <Text style={styles.avatarName}>
                  {formData.name || "Your Name"}
                </Text>

                <Text style={styles.avatarHint}>
                  Tap the upload button to change
                </Text>
              </View>
            </View>

            <View style={styles.formGrid}>
              <View style={styles.fullWidth}>
                <Text style={styles.label}>Full Name</Text>

                <TextInput
                  value={formData.name}
                  onChangeText={(value) => handleChange("name", value)}
                  editable={!isButtonDisabled}
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.fullWidth}>
                <Text style={styles.label}>Email</Text>

                <TextInput
                  value={formData.email}
                  onChangeText={(value) => handleChange("email", value)}
                  editable={!isButtonDisabled}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.fullWidth}>
                <View style={styles.labelRow}>
                  <Briefcase size={15} color={C.textSec} />
                  <Text style={styles.label}>Headline / Title</Text>
                </View>

                <TextInput
                  value={formData.headline}
                  onChangeText={(value) =>
                    handleChange("headline", value)
                  }
                  editable={!isButtonDisabled}
                  style={styles.input}
                  placeholder="e.g. Software Engineering Student"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <GraduationCap size={15} color={C.textSec} />
                  <Text style={styles.label}>University</Text>
                </View>

                <TextInput
                  value={formData.univ}
                  onChangeText={(value) => handleChange("univ", value)}
                  editable={!isButtonDisabled}
                  style={styles.input}
                  placeholder="e.g. An-Najah National University"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Book size={15} color={C.textSec} />
                  <Text style={styles.label}>Major</Text>
                </View>

                <TextInput
                  value={formData.major}
                  onChangeText={(value) => handleChange("major", value)}
                  editable={!isButtonDisabled}
                  style={styles.input}
                  placeholder="e.g. Software Engineering"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Calendar size={15} color={C.textSec} />
                  <Text style={styles.label}>Graduation Year</Text>
                </View>

                <TextInput
                  value={formData.graduation}
                  onChangeText={(value) =>
                    handleChange("graduation", value)
                  }
                  editable={!isButtonDisabled}
                  style={styles.input}
                  placeholder="e.g. 2027"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>GPA</Text>

                <TextInput
                  value={formData.gpa}
                  onChangeText={(value) => handleChange("gpa", value)}
                  editable={!isButtonDisabled}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholder="e.g. 4.00"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <MapPin size={15} color={C.textSec} />
                  <Text style={styles.label}>Location</Text>
                </View>

                <TextInput
                  value={formData.location}
                  onChangeText={(value) =>
                    handleChange("location", value)
                  }
                  editable={!isButtonDisabled}
                  style={styles.input}
                  placeholder="e.g. Nablus"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Phone size={15} color={C.textSec} />
                  <Text style={styles.label}>Phone</Text>
                </View>

                <TextInput
                  value={formData.phone}
                  onChangeText={(value) => handleChange("phone", value)}
                  editable={!isButtonDisabled}
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholder="e.g. 0594061600"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.fullWidth}>
                <View style={styles.labelRow}>
                  <Link size={15} color={C.textSec} />
                  <Text style={styles.label}>Portfolio URL</Text>
                </View>

                <TextInput
                  value={formData.portfolio}
                  onChangeText={(value) =>
                    handleChange("portfolio", value)
                  }
                  editable={!isButtonDisabled}
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="e.g. myportfolio.com"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Link size={15} color={C.textSec} />
                  <Text style={styles.label}>LinkedIn</Text>
                </View>

                <TextInput
                  value={formData.linkedin}
                  onChangeText={(value) =>
                    handleChange("linkedin", value)
                  }
                  editable={!isButtonDisabled}
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="linkedin.com/in/username"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Link size={15} color={C.textSec} />
                  <Text style={styles.label}>GitHub</Text>
                </View>

                <TextInput
                  value={formData.github}
                  onChangeText={(value) =>
                    handleChange("github", value)
                  }
                  editable={!isButtonDisabled}
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="github.com/username"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.fullWidth}>
                <Text style={styles.label}>Bio / About</Text>

                <TextInput
                  value={formData.bio}
                  onChangeText={(value) => handleChange("bio", value)}
                  editable={!isButtonDisabled}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Skills</Text>

                  <Text style={styles.sectionDescription}>
                    Add your professional and technical skills
                  </Text>
                </View>

                <Pressable
                  onPress={addSkill}
                  disabled={isButtonDisabled}
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed && !isButtonDisabled && styles.pressed,
                    isButtonDisabled && styles.disabled,
                  ]}
                >
                  <Plus size={16} color={C.text} />

                  <Text style={styles.outlineButtonText}>
                    Add Skill
                  </Text>
                </Pressable>
              </View>

              {formData.skills.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    No skills added yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {formData.skills.map((skill, index) => (
                    <View style={styles.skillRow} key={skill.id ?? index}>
                      <TextInput
                        value={skill.name}
                        editable={!isButtonDisabled}
                        onChangeText={(value) =>
                          updateSkill(index, value)
                        }
                        placeholder="e.g. React"
                        placeholderTextColor={C.textMuted}
                        style={[styles.input, styles.skillInput]}
                      />

                      <Pressable
                        onPress={() => removeSkill(index)}
                        disabled={isButtonDisabled}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed &&
                            !isButtonDisabled &&
                            styles.pressed,
                          isButtonDisabled && styles.disabled,
                        ]}
                      >
                        <Trash2 size={17} color="#dc2626" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Experience</Text>

                  <Text style={styles.sectionDescription}>
                    Add your work and practical experience
                  </Text>
                </View>

                <Pressable
                  onPress={addExperience}
                  disabled={isButtonDisabled}
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed && !isButtonDisabled && styles.pressed,
                    isButtonDisabled && styles.disabled,
                  ]}
                >
                  <Plus size={16} color={C.text} />

                  <Text style={styles.outlineButtonText}>
                    Add Experience
                  </Text>
                </Pressable>
              </View>

              {formData.experiences.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    No experience added yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {formData.experiences.map((experience, index) => (
                    <View
                      key={experience.id ?? index}
                      style={styles.experienceCard}
                    >
                      <View style={styles.experienceHeader}>
                        <View style={styles.experienceTitleRow}>
                          <Briefcase
                            size={18}
                            color={C.accent}
                          />

                          <Text style={styles.experienceTitle}>
                            Experience {index + 1}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => removeExperience(index)}
                          disabled={isButtonDisabled}
                          style={({ pressed }) => [
                            styles.smallDeleteButton,
                            pressed &&
                              !isButtonDisabled &&
                              styles.pressed,
                            isButtonDisabled && styles.disabled,
                          ]}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </Pressable>
                      </View>

                      <View style={styles.experienceGrid}>
                        <View style={styles.halfWidth}>
                          <Text style={styles.label}>Job Title</Text>

                          <TextInput
                            value={experience.position}
                            editable={!isButtonDisabled}
                            onChangeText={(value) =>
                              updateExperience(
                                index,
                                "position",
                                value
                              )
                            }
                            placeholder="e.g. Frontend Developer"
                            placeholderTextColor={C.textMuted}
                            style={styles.input}
                          />
                        </View>

                        <View style={styles.halfWidth}>
                          <Text style={styles.label}>Company</Text>

                          <TextInput
                            value={experience.company}
                            editable={!isButtonDisabled}
                            onChangeText={(value) =>
                              updateExperience(
                                index,
                                "company",
                                value
                              )
                            }
                            placeholder="e.g. ABC Company"
                            placeholderTextColor={C.textMuted}
                            style={styles.input}
                          />
                        </View>

                        <View style={styles.halfWidth}>
                          <Text style={styles.label}>Start Date</Text>

                          <TextInput
                            value={experience.start_date}
                            editable={!isButtonDisabled}
                            onChangeText={(value) =>
                              updateExperience(
                                index,
                                "start_date",
                                value
                              )
                            }
                            placeholder="e.g. Jan 2025"
                            placeholderTextColor={C.textMuted}
                            style={styles.input}
                          />
                        </View>

                        <View style={styles.halfWidth}>
                          <Text style={styles.label}>End Date</Text>

                          <TextInput
                            value={experience.end_date}
                            editable={!isButtonDisabled}
                            onChangeText={(value) =>
                              updateExperience(
                                index,
                                "end_date",
                                value
                              )
                            }
                            placeholder="e.g. Jan 2026 or Present"
                            placeholderTextColor={C.textMuted}
                            style={styles.input}
                          />
                        </View>

                        <View style={styles.fullWidth}>
                          <Text style={styles.label}>Description</Text>

                          <TextInput
                            value={experience.description}
                            editable={!isButtonDisabled}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            onChangeText={(value) =>
                              updateExperience(
                                index,
                                "description",
                                value
                              )
                            }
                            placeholder="Describe your responsibilities, achievements, and technologies used..."
                            placeholderTextColor={C.textMuted}
                            style={[
                              styles.input,
                              styles.experienceDescription,
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={onClose}
                disabled={isButtonDisabled}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && !isButtonDisabled && styles.pressed,
                  isButtonDisabled && styles.disabled,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={isButtonDisabled}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && !isButtonDisabled && styles.pressed,
                  isButtonDisabled && styles.disabled,
                ]}
              >
                <Text style={styles.saveButtonText}>
                  {isButtonDisabled ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 16,
  },

  modal: {
    width: "100%",
    maxHeight: "94%",
    backgroundColor: C.surface,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
  },

  subtitle: {
    fontSize: 12,
    color: C.textSec,
    marginTop: 4,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(220,38,38,0.1)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.35)",
    marginBottom: 18,
  },

  errorText: {
    flex: 1,
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },

  successBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(22,163,74,0.1)",
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.35)",
    marginBottom: 18,
  },

  successText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "600",
  },

  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 26,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.accent,
  },

  uploadButton: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarName: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },

  avatarHint: {
    fontSize: 12,
    color: C.textSec,
    marginTop: 4,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },

  fullWidth: {
    width: "100%",
  },

  halfWidth: {
    width: "48%",
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    marginBottom: 6,
  },

  input: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    color: C.text,
    fontSize: 14,
  },

  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  section: {
    marginTop: 30,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  sectionDescription: {
    marginTop: 4,
    fontSize: 12,
    color: C.textSec,
  },

  outlineButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  outlineButtonText: {
    color: C.text,
    fontSize: 12,
    fontWeight: "600",
  },

  emptyBox: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.border,
    alignItems: "center",
  },

  emptyText: {
    color: C.textSec,
    fontSize: 13,
  },

  list: {
    gap: 10,
  },

  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  skillInput: {
    flex: 1,
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  experienceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  experienceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  experienceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  experienceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  smallDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  experienceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },

  experienceDescription: {
    minHeight: 110,
    paddingTop: 12,
  },

  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },

  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },
});

