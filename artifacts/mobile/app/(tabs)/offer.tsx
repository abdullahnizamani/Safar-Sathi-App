import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRANSPORTS = ["Car", "SUV", "Rickshaw", "Van"];

export default function OfferScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("4");
  const [fare, setFare] = useState("");
  const [transport, setTransport] = useState("Car");
  const [notes, setNotes] = useState("");

  const handlePost = () => {
    if (!from || !to || !date || !time || !fare) {
      Alert.alert("Incomplete", "Please fill in all required fields.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Ride Posted!", "Your ride offer is now live. Students can start booking.", [
      { text: "Great!", onPress: () => {
        setFrom(""); setTo(""); setDate(""); setTime(""); setFare(""); setNotes("");
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Offer a Ride</Text>
        <Text style={styles.headerSub}>Help a fellow student get to campus</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Route</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
              <TextInput
                style={styles.input}
                placeholder="Starting point..."
                placeholderTextColor="#52525A"
                value={from}
                onChangeText={setFrom}
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputGroup}>
              <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
              <TextInput
                style={styles.input}
                placeholder="Destination..."
                placeholderTextColor="#52525A"
                value={to}
                onChangeText={setTo}
              />
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule</Text>
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.inputGroup}>
                <Feather name="calendar" size={15} color="#72727A" />
                <TextInput
                  style={styles.input}
                  placeholder="Date (e.g. Jun 16)"
                  placeholderTextColor="#52525A"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.inputGroup}>
                <Feather name="clock" size={15} color="#72727A" />
                <TextInput
                  style={styles.input}
                  placeholder="Time (e.g. 8:00 AM)"
                  placeholderTextColor="#52525A"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Transport Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transport Type</Text>
          <View style={styles.transportGrid}>
            {TRANSPORTS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.transportOption,
                  transport === t && styles.transportOptionActive,
                ]}
                onPress={() => setTransport(t)}
              >
                <Feather
                  name={t === "Van" ? "truck" : "navigation"}
                  size={16}
                  color={transport === t ? "#C084FC" : "#72727A"}
                />
                <Text
                  style={[
                    styles.transportText,
                    transport === t && styles.transportTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seats & Fare */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.inputGroup}>
                <Feather name="users" size={15} color="#72727A" />
                <TextInput
                  style={styles.input}
                  placeholder="Seats"
                  placeholderTextColor="#52525A"
                  value={seats}
                  onChangeText={setSeats}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.inputGroup}>
                <Text style={styles.currencyLabel}>PKR</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Fare"
                  placeholderTextColor="#52525A"
                  value={fare}
                  onChangeText={setFare}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <View style={styles.card}>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="e.g. AC car, female only, no smoking..."
              placeholderTextColor="#52525A"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </View>

        {/* Post Button */}
        <TouchableOpacity style={styles.postBtn} onPress={handlePost} activeOpacity={0.8}>
          <Feather name="plus-circle" size={18} color="white" />
          <Text style={styles.postBtnText}>Post Ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  headerTitle: {
    color: "#F1F1F1",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    color: "#52525A",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  content: { padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionLabel: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#18181C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  halfCard: { flex: 1 },
  row: { flexDirection: "row", gap: 10 },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  input: {
    flex: 1,
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  inputDivider: {
    height: 1,
    backgroundColor: "#2A2A32",
    marginVertical: 10,
    marginLeft: 18,
  },
  currencyLabel: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  transportGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  transportOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#18181C",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  transportOptionActive: {
    backgroundColor: "#3B1261",
    borderColor: "#6B21A8",
  },
  transportText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  transportTextActive: {
    color: "#C084FC",
    fontFamily: "Inter_600SemiBold",
  },
  postBtn: {
    backgroundColor: "#6B21A8",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  postBtnText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
