import { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Link2,
  Sparkles,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { scheduleInterview } from "../../imports/applicants";

interface Props {
  applicationId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScheduleInterviewModal({
  applicationId,
  onClose,
  onSuccess,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);

  const [time, setTime] = useState("");

  const [type, setType] =
    useState<"Online" | "Onsite">("Online");

  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showTimePicker, setShowTimePicker] =
    useState(false);

  const handleDateChange = (
    event: any,
    date?: Date
  ) => {
    setShowDatePicker(false);

    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (
    event: any,
    date?: Date
  ) => {
    setShowTimePicker(false);

    if (date) {
      const hours = date
        .getHours()
        .toString()
        .padStart(2, "0");

      const minutes = date
        .getMinutes()
        .toString()
        .padStart(2, "0");

      setTime(`${hours}:${minutes}`);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";

    const year = date.getFullYear();

    const month = (date.getMonth() + 1)
      .toString()
      .padStart(2, "0");

    const day = date
      .getDate()
      .toString()
      .padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !time) {
      return;
    }

    if (
      type === "Online" &&
      !meetingLink.trim()
    ) {
      return;
    }

    if (
      type === "Onsite" &&
      !location.trim()
    ) {
      return;
    }

    try {
      setLoading(true);

      const formattedDate =
        formatDate(selectedDate);

      await scheduleInterview(applicationId, {
        interview_date: `${formattedDate} ${time}`,
        type,
        location:
          type === "Onsite"
            ? location.trim()
            : null,
        meeting_link:
          type === "Online"
            ? meetingLink.trim()
            : null,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.log(
        "FULL ERROR:",
        error?.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    !!selectedDate &&
    !!time &&
    (type === "Online"
      ? meetingLink.trim().length > 0
      : location.trim().length > 0);

  return (
    <Modal
      visible={true}
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  Schedule Interview
                </Text>

                <Text style={styles.subtitle}>
                  Set up a date and time with the
                  candidate
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <X
                  size={18}
                  color="#64748B"
                />
              </Pressable>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <Calendar
                  size={14}
                  color="#64748B"
                />{" "}
                Date
              </Text>

              <Pressable
                onPress={() =>
                  setShowDatePicker(true)
                }
                style={styles.inputButton}
              >
                <Calendar
                  size={17}
                  color={
                    selectedDate
                      ? "#0F172A"
                      : "#94A3B8"
                  }
                />

                <Text
                  style={[
                    styles.inputButtonText,
                    !selectedDate &&
                      styles.placeholder,
                  ]}
                >
                  {selectedDate
                    ? formatDate(selectedDate)
                    : "Select Date"}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={
                    selectedDate || new Date()
                  }
                  mode="date"
                  display={
                    Platform.OS === "ios"
                      ? "spinner"
                      : "default"
                  }
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Time */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <Clock
                  size={14}
                  color="#64748B"
                />{" "}
                Time
              </Text>

              <Pressable
                onPress={() =>
                  setShowTimePicker(true)
                }
                style={styles.inputButton}
              >
                <Clock
                  size={17}
                  color={
                    time
                      ? "#0F172A"
                      : "#94A3B8"
                  }
                />

                <Text
                  style={[
                    styles.inputButtonText,
                    !time &&
                      styles.placeholder,
                  ]}
                >
                  {time || "Select Time"}
                </Text>
              </Pressable>

              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour
                  display={
                    Platform.OS === "ios"
                      ? "spinner"
                      : "default"
                  }
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Interview Type */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Interview Type
              </Text>

              <View style={styles.typeContainer}>
                {/* Online */}
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
                  <Video
                    size={16}
                    color={
                      type === "Online"
                        ? "#0F172A"
                        : "#64748B"
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

                {/* Onsite */}
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
                  <MapPin
                    size={16}
                    color={
                      type === "Onsite"
                        ? "#0F172A"
                        : "#64748B"
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

            {/* Online */}
            {type === "Online" && (
              <View style={styles.field}>
                <Text style={styles.label}>
                  <Link2
                    size={14}
                    color="#64748B"
                  />{" "}
                  Meeting Link
                </Text>

                <TextInput
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
                />
              </View>
            )}

            {/* Onsite */}
            {type === "Onsite" && (
              <View style={styles.field}>
                <Text style={styles.label}>
                  <MapPin
                    size={14}
                    color="#64748B"
                  />{" "}
                  Location / Address
                </Text>

                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. HQ Office, Room 402"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
                />
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttons}>
              {/* Cancel */}
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    !loading &&
                    styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>

              {/* Confirm */}
              <Pressable
                onPress={handleSubmit}
                disabled={
                  loading || !isFormValid
                }
                style={({ pressed }) => [
                  styles.confirmButton,
                  (!isFormValid ||
                    loading) &&
                    styles.disabledButton,
                  pressed &&
                    isFormValid &&
                    !loading &&
                    styles.pressed,
                ]}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.confirmText}
                    >
                      Scheduling...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.loadingRow}>
                    <Sparkles
                      size={16}
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.confirmText}
                    >
                      Confirm Schedule
                    </Text>
                  </View>
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

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  modal: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "92%",
    backgroundColor: C?.surface || "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: C?.border || "#E2E8F0",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,

    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontFamily: F,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  subtitle: {
    fontFamily: F,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  field: {
    marginBottom: 18,
  },

  label: {
    flexDirection: "row",
    alignItems: "center",
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 7,
  },

  inputButton: {
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 9,
  },

  inputButtonText: {
    flex: 1,
    fontFamily: F,
    fontSize: 14,
    color: "#0F172A",
  },

  placeholder: {
    color: "#94A3B8",
  },

  input: {
    width: "100%",
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontFamily: F,
    fontSize: 14,
    color: "#0F172A",
  },

  typeContainer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  typeButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  activeTypeButton: {
    backgroundColor: "#FFFFFF",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,

    elevation: 2,
  },

  typeText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  activeTypeText: {
    color: "#0F172A",
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
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },

  confirmButton: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: C?.accent || "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.55,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  confirmText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.75,
  },
});
