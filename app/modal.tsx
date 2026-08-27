import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        CareerBridge
      </Text>

      <Text style={styles.text}>
        Modal Screen
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Close
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },

  text: {
    fontSize: 15,
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#C8A46A",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
