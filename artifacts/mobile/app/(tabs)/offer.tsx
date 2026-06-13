import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router";
import { api } from "@/src/lib/api";

export default function OfferScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const now = new Date();
  const defaultDate = now.toISOString().split("T")[0];
  const defaultTime = now.toTimeString().split(" ")[0].slice(0, 5);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [seats, setSeats] = useState("4");
  const [fare, setFare] = useState("");
  const [transport, setTransport] = useState("Car");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Autocomplete states
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [shouldFetchFrom, setShouldFetchFrom] = useState(true);
  const [shouldFetchTo, setShouldFetchTo] = useState(true);

  // Debounced Photon fetch for From input
  useEffect(() => {
    if (!shouldFetchFrom) return;
    if (from.trim().length < 3) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(from)}&limit=5&countrycode=PK`);
        const data = await res.json();
        setFromSuggestions(data.features || []);
      } catch (err) {
        console.error("Photon from geocoding error:", err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [from, shouldFetchFrom]);

  // Debounced Photon fetch for To input
  useEffect(() => {
    if (!shouldFetchTo) return;
    if (to.trim().length < 3) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(to)}&limit=5&countrycode=PK`);
        const data = await res.json();
        setToSuggestions(data.features || []);
      } catch (err) {
        console.error("Photon to geocoding error:", err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [to, shouldFetchTo]);

  const handlePost = async () => {
    if (!from.trim() || !to.trim() || !date.trim() || !time.trim() || !fare.trim()) {
      Alert.alert("Incomplete", "Please fill in all required fields.");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!dateRegex.test(date.trim())) {
      Alert.alert("Invalid Format", "Please enter date in YYYY-MM-DD format (e.g. 2026-06-16)");
      return;
    }

    if (!timeRegex.test(time.trim())) {
      Alert.alert("Invalid Format", "Please enter time in HH:MM 24h format (e.g. 08:30 or 17:00)");
      return;
    }

    const seatsNum = parseInt(seats, 10);
    if (isNaN(seatsNum) || seatsNum < 1) {
      Alert.alert("Invalid Seats", "Please enter a valid number of seats (at least 1).");
      return;
    }

    const fareNum = parseFloat(fare);
    if (isNaN(fareNum) || fareNum < 0) {
      Alert.alert("Invalid Fare", "Please enter a valid fare (minimum 0).");
      return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const departureTime = `${date.trim()}T${time.trim()}:00.000Z`;

    const payload = {
      origin: from.trim(),
      destination: to.trim(),
      departure_time: departureTime,
      available_seats: seatsNum,
      fare: fareNum,
      transport_type: transport.trim() || "Car",
      gender_preference: "ANY",
      origin_lat: fromCoords ? fromCoords.lat : null,
      origin_lng: fromCoords ? fromCoords.lng : null,
      dest_lat: toCoords ? toCoords.lat : null,
      dest_lng: toCoords ? toCoords.lng : null,
    };

    try {
      await api.post("/rides", payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Ride posted successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Clear form
            setFrom("");
            setTo("");
            setFromCoords(null);
            setToCoords(null);
            setFromSuggestions([]);
            setToSuggestions([]);
            setDate(defaultDate);
            setTime(defaultTime);
            setSeats("4");
            setFare("");
            setTransport("Car");
            setNotes("");
            // Reset navigation back to feed
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to post ride.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
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
            {/* From Input */}
            <View style={{ position: "relative", zIndex: 1000 }}>
              <View style={styles.inputGroup}>
                <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
                <TextInput
                  style={styles.input}
                  placeholder="Starting point..."
                  placeholderTextColor="#52525A"
                  value={from}
                  onChangeText={(txt) => {
                    setFrom(txt);
                    setShouldFetchFrom(true);
                    if (txt.trim().length === 0) setFromCoords(null);
                  }}
                />
                {from.length > 0 && (
                  <TouchableOpacity onPress={() => { setFrom(""); setFromSuggestions([]); setFromCoords(null); setShouldFetchFrom(true); }}>
                    <Feather name="x" size={15} color="#72727A" />
                  </TouchableOpacity>
                )}
              </View>
              {fromSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {fromSuggestions.map((item, idx) => {
                      const name = item.properties.name || "";
                      const city = item.properties.city || "";
                      const address = city ? `${name}, ${city}` : name;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setShouldFetchFrom(false);
                            setFrom(address);
                            setFromCoords({
                              lat: item.geometry.coordinates[1],
                              lng: item.geometry.coordinates[0]
                            });
                            setFromSuggestions([]);
                          }}
                        >
                          <Feather name="map-pin" size={14} color="#22C55E" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.suggestionName} numberOfLines={1}>
                              {name}
                            </Text>
                            {city ? (
                              <Text style={styles.suggestionCity} numberOfLines={1}>
                                {city}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputDivider} />

            {/* To Input */}
            <View style={{ position: "relative", zIndex: 990 }}>
              <View style={styles.inputGroup}>
                <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                <TextInput
                  style={styles.input}
                  placeholder="Destination..."
                  placeholderTextColor="#52525A"
                  value={to}
                  onChangeText={(txt) => {
                    setTo(txt);
                    setShouldFetchTo(true);
                    if (txt.trim().length === 0) setToCoords(null);
                  }}
                />
                {to.length > 0 && (
                  <TouchableOpacity onPress={() => { setTo(""); setToSuggestions([]); setToCoords(null); setShouldFetchTo(true); }}>
                    <Feather name="x" size={15} color="#72727A" />
                  </TouchableOpacity>
                )}
              </View>
              {toSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {toSuggestions.map((item, idx) => {
                      const name = item.properties.name || "";
                      const city = item.properties.city || "";
                      const address = city ? `${name}, ${city}` : name;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setShouldFetchTo(false);
                            setTo(address);
                            setToCoords({
                              lat: item.geometry.coordinates[1],
                              lng: item.geometry.coordinates[0]
                            });
                            setToSuggestions([]);
                          }}
                        >
                          <Feather name="map-pin" size={14} color="#EF4444" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.suggestionName} numberOfLines={1}>
                              {name}
                            </Text>
                            {city ? (
                              <Text style={styles.suggestionCity} numberOfLines={1}>
                                {city}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule</Text>
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
              <View style={styles.inputGroup}>
                <Feather name="calendar" size={15} color="#72727A" />
                <TextInput
                  style={styles.input}
                  placeholder="2026-06-16"
                  placeholderTextColor="#52525A"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => {
                    const today = new Date();
                    setDate(today.toISOString().split("T")[0]);
                  }}
                >
                  <Text style={styles.presetText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDate(tomorrow.toISOString().split("T")[0]);
                  }}
                >
                  <Text style={styles.presetText}>Tomorrow</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.inputLabel}>Time (24h HH:MM)</Text>
              <View style={styles.inputGroup}>
                <Feather name="clock" size={15} color="#72727A" />
                <TextInput
                  style={styles.input}
                  placeholder="08:30"
                  placeholderTextColor="#52525A"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setTime("08:00")}
                >
                  <Text style={styles.presetText}>8 AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setTime("12:00")}
                >
                  <Text style={styles.presetText}>12 PM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setTime("17:00")}
                >
                  <Text style={styles.presetText}>5 PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Transport Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transport Type</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Feather name="truck" size={15} color="#72727A" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Car, SUV, Rickshaw..."
                placeholderTextColor="#52525A"
                value={transport}
                onChangeText={setTransport}
              />
            </View>
          </View>
        </View>

        {/* Seats & Fare */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.inputLabel}>Available Seats</Text>
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
              <Text style={styles.inputLabel}>Fare (PKR)</Text>
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
        <TouchableOpacity
          style={[styles.postBtn, loading && { opacity: 0.7 }]}
          onPress={handlePost}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Feather name="plus-circle" size={18} color="white" />
              <Text style={styles.postBtnText}>Post Ride</Text>
            </>
          )}
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
  inputLabel: {
    color: "#52525A",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  presetChip: {
    backgroundColor: "#1E1E24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  presetText: {
    color: "#A1A1AA",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
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
  suggestionsContainer: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E24",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A32",
    maxHeight: 180,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A32",
    gap: 8,
  },
  suggestionName: {
    color: "#F1F1F1",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  suggestionCity: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
