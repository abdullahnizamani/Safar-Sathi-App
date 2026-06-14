import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

interface RegisterProps {
  onToggleLogin: () => void;
}

export default function RegisterScreen({ onToggleLogin }: RegisterProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [university, setUniversity] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (
      !username.trim() ||
      !email.trim() ||
      !password ||
      !phoneNumber.trim() ||
      !university.trim() ||
      !gender.trim()
    ) {
      Alert.alert("Registration Failed", "Please fill in all fields");
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload = {
      username: username.trim(),
      email: email.trim(),
      password,
      phone_number: phoneNumber.trim(),
      university: university.trim(),
      gender: gender.trim(),
    };

    try {
      await register(payload);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to register account";
      setError(msg);
      Alert.alert("Registration Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Icon Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="car-outline" size={32} color="#A855F7" />
          </View>
          <Text style={styles.title}>Join SafarSathi</Text>
          <Text style={styles.subtitle}>Create your account to start carpooling</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={15} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#52525A"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={15} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#52525A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={15} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#52525A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Feather name="phone" size={15} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#52525A"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>University</Text>
          <View style={styles.inputContainer}>
            <Feather name="book-open" size={15} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. FAST, NED, IBA"
              placeholderTextColor="#52525A"
              value={university}
              onChangeText={setUniversity}
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {[
              { key: "M", label: "Male", icon: "user" as const },
              { key: "F", label: "Female", icon: "user" as const },
              { key: "O", label: "Other", icon: "smile" as const },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.genderChip,
                  gender === option.key && styles.genderChipActive,
                ]}
                onPress={() => {
                  if (!submitting) {
                    setGender(option.key);
                  }
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name={option.icon}
                  size={14}
                  color={gender === option.key ? "#C084FC" : "#72727A"}
                />
                <Text
                  style={[
                    styles.genderChipText,
                    gender === option.key && styles.genderChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={onToggleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 64 : 40,
    paddingBottom: 40,
    gap: 24,
  },
  logoContainer: {
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#3B126133",
    borderWidth: 1.5,
    borderColor: "#6B21A855",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    color: "#F1F1F1",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  form: {
    gap: 14,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  genderChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#18181C",
    borderWidth: 1,
    borderColor: "#2A2A32",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    height: 48,
  },
  genderChipActive: {
    backgroundColor: "#3B126133",
    borderColor: "#6B21A8",
  },
  genderChipText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  genderChipTextActive: {
    color: "#C084FC",
  },
  label: {
    color: "#E4E4E7",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: -6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EF444415",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF444433",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  button: {
    backgroundColor: "#6B21A8",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#6B21A8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#4c1a75",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  loginButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  loginText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loginHighlight: {
    color: "#A855F7",
    fontFamily: "Inter_600SemiBold",
  },
});
