import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onToggleRegister: () => void;
}

export default function LoginScreen({ onToggleRegister }: LoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Login Failed", "Please fill in all fields");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Invalid username or password";
      setError(msg);
      Alert.alert("Login Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Icon Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Feather name="navigation" size={32} color="#A855F7" />
          </View>
          <Text style={styles.title}>Safar Sathi</Text>
          <Text style={styles.subtitle}>Asset Carpooling Manager</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={16} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#52525A"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={16} color="#72727A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#52525A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={onToggleRegister}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupHighlight}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 28,
    gap: 32,
  },
  logoContainer: {
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#3B126133",
    borderWidth: 1.5,
    borderColor: "#6B21A855",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    color: "#F1F1F1",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: "#72727A",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  form: {
    gap: 16,
  },
  label: {
    color: "#E4E4E7",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: -8,
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
  signupButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  signupText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  signupHighlight: {
    color: "#A855F7",
    fontFamily: "Inter_600SemiBold",
  },
});
