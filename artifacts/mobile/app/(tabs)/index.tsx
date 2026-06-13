import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RideCard from "@/components/RideCard";
import { type Ride } from "@/data/mockRides";
import { api } from "@/src/lib/api";

function mapBackendRide(r: any): Ride {
  let dateStr = "";
  let timeStr = "";
  try {
    const depDate = new Date(r.departure_time);
    dateStr = depDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    timeStr = depDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (err) {
    console.error("Error formatting date:", err);
  }

  const colors = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];
  const colorIndex = (r.driver_id || 0) % colors.length;
  const avatarColor = colors[colorIndex];

  const initials = r.driver_name
    ? r.driver_name.slice(0, 2).toUpperCase()
    : "UN";

  return {
    id: String(r.id),
    driverId: String(r.driver_id),
    transportType: r.transport_type || "Car",
    provider: {
      id: String(r.driver_id),
      name: r.driver_name || "Unknown",
      initials,
      verified: true,
      rating: r.driver_avg_rating !== null && r.driver_avg_rating !== undefined ? Number(r.driver_avg_rating) : 5.0,
      avatarColor,
    },
    from: {
      name: r.origin || "",
      coords: `${r.origin_lng || 0},${r.origin_lat || 0}`,
    },
    to: {
      name: r.destination || "",
      coords: `${r.dest_lng || 0},${r.dest_lat || 0}`,
    },
    fare: Number(r.fare || 0),
    currency: "PKR",
    date: dateStr,
    time: timeStr,
    seats: Number(r.available_seats || 0),
    transport: r.transport_type || "Car",
    stops: [],
    notes: r.gender_preference && r.gender_preference !== "ANY" ? `Gender preference: ${r.gender_preference}` : undefined,
  };
}

export default function FindScreen() {
  const insets = useSafeAreaInsets();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>("ANY");

  // Triggers to prevent refetching when selecting suggestions
  const [shouldFetchFrom, setShouldFetchFrom] = useState(true);
  const [shouldFetchTo, setShouldFetchTo] = useState(true);

  const [activeFilter, setActiveFilter] = useState("All");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = async (searchParams?: {
    origin?: string;
    destination?: string;
    gender_preference?: string;
    origin_lat?: number;
    origin_lng?: number;
    dest_lat?: number;
    dest_lng?: number;
  }) => {
    try {
      setError(null);
      const queryParams: any = {};
      if (searchParams?.origin) queryParams.origin = searchParams.origin;
      if (searchParams?.destination) queryParams.destination = searchParams.destination;
      if (searchParams?.gender_preference && searchParams.gender_preference !== "ANY") {
        queryParams.gender_preference = searchParams.gender_preference;
      }
      if (searchParams?.origin_lat) queryParams.origin_lat = searchParams.origin_lat;
      if (searchParams?.origin_lng) queryParams.origin_lng = searchParams.origin_lng;
      if (searchParams?.dest_lat) queryParams.dest_lat = searchParams.dest_lat;
      if (searchParams?.dest_lng) queryParams.dest_lng = searchParams.dest_lng;

      const res = await api.get("/rides", { params: queryParams });
      const mapped = res.data.map(mapBackendRide);
      setRides(mapped);
    } catch (err: any) {
      console.error("Error fetching rides:", err);
      setError("Failed to load rides. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  // Debounced Photon fetch for From input
  useEffect(() => {
    if (!shouldFetchFrom) return;
    if (from.trim().length < 3) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(from)}&limit=4&countrycode=PK`);
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
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(to)}&limit=4&countrycode=PK`);
        const data = await res.json();
        setToSuggestions(data.features || []);
      } catch (err) {
        console.error("Photon to geocoding error:", err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [to, shouldFetchTo]);

  const handleSearch = () => {
    fetchRides({
      origin: from,
      destination: to,
      gender_preference: genderFilter,
      origin_lat: fromCoords?.lat,
      origin_lng: fromCoords?.lng,
      dest_lat: toCoords?.lat,
      dest_lng: toCoords?.lng
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides({
      origin: from,
      destination: to,
      gender_preference: genderFilter,
      origin_lat: fromCoords?.lat,
      origin_lng: fromCoords?.lng,
      dest_lat: toCoords?.lat,
      dest_lng: toCoords?.lng
    });
    setRefreshing(false);
  };

  const handleBook = (ride: Ride) => {
    Alert.alert(
      "Confirm Booking",
      `Book a seat with ${ride.provider.name} for ${ride.currency} ${ride.fare}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await api.post("/requests", { ride_id: Number(ride.id) });
              Alert.alert("Success", "Your booking request has been submitted successfully!");
            } catch (err: any) {
              const msg = err?.response?.data?.error || err?.message || "Failed to book ride.";
              Alert.alert("Booking Failed", msg);
            }
          },
        },
      ]
    );
  };

  const displayedRides = activeFilter === "All"
    ? rides
    : rides.filter(r => r.transportType?.toLowerCase() === activeFilter.toLowerCase());

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.headerTitle}>Find a Ride</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="sliders" size={18} color="#A855F7" />
          </TouchableOpacity>
        </View>

        {/* Route Inputs Card */}
        <View style={styles.inputsCard}>
          {/* From Input */}
          <View style={{ position: "relative", zIndex: 1000 }}>
            <View style={styles.inputGroup}>
              <Feather name="map-pin" size={15} color="#22C55E" />
              <TextInput
                style={styles.searchInput}
                placeholder="Starting point (From)..."
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
              <Feather name="map-pin" size={15} color="#EF4444" />
              <TextInput
                style={styles.searchInput}
                placeholder="Destination (To)..."
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

        {/* Gender Preference Filter Chips */}
        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>Gender preference:</Text>
          <View style={styles.genderChips}>
            {[
              { label: "Any", value: "ANY" },
              { label: "Male Only", value: "MALE" },
              { label: "Female Only", value: "FEMALE" }
            ].map((chip) => (
              <TouchableOpacity
                key={chip.value}
                style={[
                  styles.genderChip,
                  genderFilter === chip.value && styles.genderChipActive
                ]}
                onPress={() => setGenderFilter(chip.value)}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    genderFilter === chip.value && styles.genderChipTextActive
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
          <Feather name="search" size={15} color="white" />
          <Text style={styles.searchBtnText}>Search Rides</Text>
        </TouchableOpacity>

        {/* Category Filter chips */}
        <FlatList
          horizontal
          data={["All", "Car", "SUV", "Rickshaw"]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Ride Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchRides(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedRides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RideCard ride={item} onBook={handleBook} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
          ]}
          scrollEnabled={displayedRides.length > 0}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
              colors={["#7C3AED"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="map-pin" size={40} color="#3B1261" />
              <Text style={styles.emptyTitle}>No rides found</Text>
              <Text style={styles.emptyText}>Try adjusting your search</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {displayedRides.length} ride{displayedRides.length !== 1 ? "s" : ""} available
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
  },
  header: {
    backgroundColor: "#0D0D0F",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  greeting: {
    color: "#52525A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  headerTitle: {
    color: "#F1F1F1",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#18181C",
    borderWidth: 1,
    borderColor: "#2A2A32",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  feedContent: {
    paddingTop: 12,
  },
  resultsCount: {
    color: "#52525A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    color: "#F1F1F1",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    color: "#72727A",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  errorText: {
    color: "#72727A",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#3B1261",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6B21A8",
  },
  retryBtnText: {
    color: "#C084FC",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filtersContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#18181C",
    borderWidth: 1,
    borderColor: "#2A2A32",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#3B1261",
    borderColor: "#6B21A8",
  },
  filterChipText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterChipTextActive: {
    color: "#C084FC",
    fontFamily: "Inter_600SemiBold",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
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
  inputsCard: {
    backgroundColor: "#18181C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A32",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 36,
  },
  inputDivider: {
    height: 1,
    backgroundColor: "#2A2A32",
    marginVertical: 10,
    marginLeft: 18,
  },
  genderContainer: {
    marginBottom: 10,
    gap: 6,
  },
  genderLabel: {
    color: "#52525A",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  genderChips: {
    flexDirection: "row",
    gap: 8,
  },
  genderChip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#18181C",
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  genderChipActive: {
    backgroundColor: "#1C1040",
    borderColor: "#6B21A8",
  },
  genderChipText: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  genderChipTextActive: {
    color: "#C084FC",
    fontFamily: "Inter_600SemiBold",
  },
  searchBtn: {
    backgroundColor: "#6B21A8",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  searchBtnText: {
    color: "white",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
