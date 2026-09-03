import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { bulkScheduleInterviews } from "../../imports/interviews";

interface Props {
  applicationIds: number[];
  onClose: () => void;
  onSuccess?: () => void;
}

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
  errorLight: "#FEF2F2",
};

export default function BulkScheduleModal({
  applicationIds,
  onClose,
  onSuccess,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);

  const [startTime, setStartTime] =
    useState("");

  const [duration, setDuration] =
    useState("30");

  const [type, setType] =
    useState<"Online" | "Onsite">("Online");

  const [location, setLocation] =
    useState("");

  const [meetingLink, setMeetingLink] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showTimePicker, setShowTimePicker] =
    useState(false);

  // --------------------------------------------------
  // Date
  // --------------------------------------------------

  const handleDateChange = (
    event: any,
    date?: Date
  ) => {
    setShowDatePicker(false);

    if (event.type === "dismissed") {
      return;
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  // --------------------------------------------------
  // Time
  // --------------------------------------------------

  const handleTimeChange = (
    event: any,
    date?: Date
  ) => {
    setShowTimePicker(false);

    if (event.type === "dismissed") {
      return;
    }

    if (date) {
      const hours = String(
        date.getHours()
      ).padStart(2, "0");

      const minutes = String(
        date.getMinutes()
      ).padStart(2, "0");

      setStartTime(
        `${hours}:${minutes}`
      );
    }
  };

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // --------------------------------------------------
  // Format displayed date
  // --------------------------------------------------

  const displayDate = selectedDate
    ? formatDate(selectedDate)
    : "Select Date";

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleSubmit = async () => {
    if (!selectedDate) {
      setErrorMsg(
        "Please select an interview date."
      );
      return;
    }

    if (!startTime) {
      setErrorMsg(
        "Please select a start time."
      );
      return;
    }

    if (Number(duration) < 5) {
      setErrorMsg(
        "Duration must be at least 5 minutes."
      );
      return;
    }

    if (
      type === "Online" &&
      !meetingLink.trim()
    ) {
      setErrorMsg(
        "Please enter a meeting link."
      );
      return;
    }

    if (
      type === "Onsite" &&
      !location.trim()
    ) {
      setErrorMsg(
        "Please enter the interview location."
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const formattedDate =
        formatDate(selectedDate);

      await bulkScheduleInterviews({
        application_ids: applicationIds,
        interview_date: formattedDate,
        start_time: startTime,
        duration: Number(duration),
        type,
        location:
          type === "Onsite"
            ? location.trim()
            : "",
        meeting_link:
          type === "Online"
            ? meetingLink.trim()
            : "",
      });

      onSuccess?.();
      onClose();

    } catch (error: any) {
      console.log(
        "FULL ERROR:",
        error?.response?.data
      );

      setErrorMsg(
        error?.response?.data?.message ||
          "Failed to schedule interviews."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  const isFormValid =
    selectedDate !== null &&
    startTime.length > 0 &&
    Number(duration) >= 5 &&
    (type === "Online"
      ? meetingLink.trim().length > 0
      : location.trim().length > 0);

  // --------------------------------------------------
  // Time picker initial value
  // --------------------------------------------------

  const getTimePickerValue = () => {
    const date = new Date();

    if (startTime) {
      const [hours, minutes] =
        startTime.split(":");

      date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );
    }

    return date;
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              contentContainerStyle={styles.scrollContent}
            >

          {/* --------------------------------------- */}
          {/* Header */}
          {/* --------------------------------------- */}

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                Schedule Interviews
              </Text>

              <View style={styles.candidateCount}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={COLORS.textSec}
                />

                <Text
                  style={styles.candidateCountText}
                >
                  {applicationIds.length}{" "}
                  candidate
                  {applicationIds.length > 1
                    ? "s"
                    : ""}{" "}
                  selected
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={20}
                color={COLORS.textSec}
              />
            </Pressable>
          </View>

          {/* --------------------------------------- */}
          {/* Error */}
          {/* --------------------------------------- */}

          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={COLORS.error}
              />

              <Text style={styles.errorText}>
                {errorMsg}
              </Text>

              <Pressable
                onPress={() =>
                  setErrorMsg(null)
                }
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={COLORS.error}
                />
              </Pressable>
            </View>
          )}

          {/* --------------------------------------- */}
          {/* Date */}
          {/* --------------------------------------- */}

          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.textSec}
              />{" "}
              Start Date
            </Text>

            <Pressable
              style={styles.inputButton}
              onPress={() =>
                setShowDatePicker(true)
              }
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.textMuted}
              />

              <Text
                style={[
                  styles.inputButtonText,
                  !selectedDate &&
                    styles.placeholderText,
                ]}
              >
                {displayDate}
              </Text>
            </Pressable>
          </View>

          {/* --------------------------------------- */}
          {/* Time */}
          {/* --------------------------------------- */}

          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textSec}
              />{" "}
              Start Time
            </Text>

            <Pressable
              style={styles.inputButton}
              onPress={() =>
                setShowTimePicker(true)
              }
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={COLORS.textMuted}
              />

              <Text
                style={[
                  styles.inputButtonText,
                  !startTime &&
                    styles.placeholderText,
                ]}
              >
                {startTime ||
                  "Select Time"}
              </Text>
            </Pressable>
          </View>

          {/* --------------------------------------- */}
          {/* Date Picker */}
          {/* --------------------------------------- */}

          {showDatePicker && (
            <DateTimePicker
              value={
                selectedDate ||
                new Date()
              }
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              minimumDate={new Date()}
              onChange={
                handleDateChange
              }
            />
          )}

          {/* --------------------------------------- */}
          {/* Time Picker */}
          {/* --------------------------------------- */}

          {showTimePicker && (
            <DateTimePicker
              value={getTimePickerValue()}
              mode="time"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={
                handleTimeChange
              }
            />
          )}

          {/* --------------------------------------- */}
          {/* Duration */}
          {/* --------------------------------------- */}

          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textSec}
              />{" "}
              Duration per Interview
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={
                  COLORS.textMuted
                }
                style={styles.textInput}
              />

              <Text style={styles.unit}>
                minutes
              </Text>
            </View>

            <Text style={styles.helperText}>
              Each interview starts this many
              minutes after the previous one.
            </Text>
          </View>

          {/* --------------------------------------- */}
          {/* Interview Type */}
          {/* --------------------------------------- */}

          <View style={styles.field}>
            <Text style={styles.label}>
              Interview Type
            </Text>

            <View style={styles.typeContainer}>

              <Pressable
                onPress={() =>
                  setType("Online")
                }
                style={[
                  styles.typeButton,
                  type === "Online" &&
                    styles.activeTypeButton,
                ]}
              >
                <Ionicons
                  name="videocam-outline"
                  size={17}
                  color={
                    type === "Online"
                      ? COLORS.text
                      : COLORS.textSec
                  }
                />

                <Text
                  style={[
                    styles.typeText,
                    type === "Online" &&
                      styles.activeTypeText,
                  ]}
                >
                  Online
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setType("Onsite")
                }
                style={[
                  styles.typeButton,
                  type === "Onsite" &&
                    styles.activeTypeButton,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={17}
                  color={
                    type === "Onsite"
                      ? COLORS.text
                      : COLORS.textSec
                  }
                />

                <Text
                  style={[
                    styles.typeText,
                    type === "Onsite" &&
                      styles.activeTypeText,
                  ]}
                >
                  Onsite
                </Text>
              </Pressable>

            </View>
          </View>

          {/* --------------------------------------- */}
          {/* Meeting Link / Location */}
          {/* --------------------------------------- */}

          <View style={styles.field}>

            {type === "Online" ? (
              <>
                <Text style={styles.label}>
                  <Ionicons
                    name="link-outline"
                    size={14}
                    color={COLORS.textSec}
                  />{" "}
                  Meeting Link
                </Text>

                <TextInput
                  value={meetingLink}
                  onChangeText={
                    setMeetingLink
                  }
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor={
                    COLORS.textMuted
                  }
                  autoCapitalize="none"
                  keyboardType="url"
                  style={styles.textInputFull}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={COLORS.textSec}
                  />{" "}
                  Location / Address
                </Text>

                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. HQ Office, Room 402"
                  placeholderTextColor={
                    COLORS.textMuted
                  }
                  style={styles.textInputFull}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
                />
              </>
            )}

          </View>

          {/* --------------------------------------- */}
          {/* Buttons */}
          {/* --------------------------------------- */}

          <View style={styles.buttons}>

            <Pressable
              onPress={onClose}
              disabled={loading}
              style={[
                styles.cancelButton,
                loading &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={
                loading || !isFormValid
              }
              style={[
                styles.confirmButton,
                (!isFormValid ||
                  loading) &&
                  styles.confirmDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="sparkles-outline"
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.confirmText
                    }
                  >
                    Confirm Schedule
                  </Text>
                </>
              )}
            </Pressable>

          </View>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ======================================================
// Styles
// ======================================================

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor:
      "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  modal: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "92%",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  candidateCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },

  candidateCountText: {
    fontSize: 13,
    color: COLORS.textSec,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.errorLight,
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#991B1B",
    fontWeight: "500",
  },

  field: {
    marginBottom: 16,
  },

  label: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 7,
  },

  inputButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  inputButtonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  placeholderText: {
    color: COLORS.textMuted,
  },

  inputWrapper: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingRight: 12,
  },

  textInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
  },

  unit: {
    fontSize: 12,
    color: COLORS.textSec,
    fontWeight: "600",
  },

  textInputFull: {
    width: "100%",
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    color: COLORS.text,
  },

  helperText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textMuted,
  },

  typeContainer: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typeButton: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 9,
  },

  activeTypeButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSec,
  },

  activeTypeText: {
    color: COLORS.text,
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSec,
  },

  confirmButton: {
    flex: 1.5,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },

  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  confirmDisabled: {
    opacity: 0.55,
  },

  disabledButton: {
    opacity: 0.5,
  },
});
