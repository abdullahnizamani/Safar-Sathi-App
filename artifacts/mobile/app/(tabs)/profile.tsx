import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!user) return null;

  // Generate consistent color for the avatar based on username
  const colors = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];
  const colorIndex = user.id % colors.length;
  const avatarColor = colors[colorIndex];
  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : "U";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  const profileDetails = [
    { label: "Username", value: user.username, icon: "user" },
    { label: "Email", value: user.email, icon: "mail" },
    { label: "Phone Number", value: user.phone_number || "Not provided", icon: "phone" },
    { label: "University", value: user.university || "Not specified", icon: "book-open" },
    { label: "Gender", value: user.gender || "Not specified", icon: "smile" },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
      >
        {/* Avatar Area */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + "33", borderColor: avatarColor + "66" }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
          </View>
          <Text style={styles.usernameText}>{user.username}</Text>
          <Text style={styles.joinText}>Member since {new Date(user.created_at).toLocaleDateString()}</Text>
        </View>

        {/* User Info Fields */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.detailsCard}>
            {profileDetails.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.detailRow,
                  index < profileDetails.length - 1 && styles.detailRowBorder,
                ]}
              >
                <View style={styles.detailIconWrapper}>
                  <Feather name={item.icon as any} size={16} color="#A855F7" />
                </View>
                <View style={styles.detailTextWrapper}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color="#FCA5A5" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  headerTitle: {
    color: "#F1F1F1",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  content: {
    padding: 16,
    gap: 24,
  },
  avatarCard: {
    alignItems: "center",
    backgroundColor: "#18181C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  usernameText: {
    color: "#F1F1F1",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  joinText: {
    color: "#52525A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  detailsSection: {
    gap: 10,
  },
  sectionTitle: {
    color: "#F1F1F1",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    paddingLeft: 4,
  },
  detailsCard: {
    backgroundColor: "#18181C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A32",
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#3B126133",
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextWrapper: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    color: "#52525A",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    color: "#E4E4E7",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444433",
    borderRadius: 12,
    height: 48,
    gap: 8,
    marginTop: 8,
  },
  logoutBtnText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
