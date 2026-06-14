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
import * as Location from "expo-location";
import { useRouter } from "expo-router";

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
  const router = useRouter();
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

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Geolocation states
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [deviceCoords, setDeviceCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchRides = async (searchParams?: {
    origin?: string;
    destination?: string;
    gender_preference?: string;
    origin_lat?: number;
    origin_lng?: number;
    dest_lat?: number;
    dest_lng?: number;
    user_lat?: number;
    user_lng?: number;
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

      // Extract user coordinates (passed directly or fall back to deviceCoords state)
      const uLat = searchParams?.user_lat !== undefined ? searchParams.user_lat : deviceCoords?.latitude;
      const uLng = searchParams?.user_lng !== undefined ? searchParams.user_lng : deviceCoords?.longitude;
      if (uLat !== undefined && uLat !== null) queryParams.user_lat = uLat;
      if (uLng !== undefined && uLng !== null) queryParams.user_lng = uLng;

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
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);
        if (status === Location.PermissionStatus.GRANTED) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setDeviceCoords(coords);
          fetchRides({
            origin: from,
            destination: to,
            gender_preference: genderFilter,
            origin_lat: fromCoords?.lat,
            origin_lng: fromCoords?.lng,
            dest_lat: toCoords?.lat,
            dest_lng: toCoords?.lng,
            user_lat: coords.latitude,
            user_lng: coords.longitude,
          });
        } else {
          fetchRides();
        }
      } catch (err) {
        console.error("Error obtaining foreground location permission:", err);
        fetchRides();
      }
    })();
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
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(from)}&limit=4&countrycode=PK&lang=en`);
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
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(to)}&limit=4&countrycode=PK&lang=en`);
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
      dest_lng: toCoords?.lng,
      user_lat: deviceCoords?.latitude,
      user_lng: deviceCoords?.longitude,
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
      dest_lng: toCoords?.lng,
      user_lat: deviceCoords?.latitude,
      user_lng: deviceCoords?.longitude,
    });
    setRefreshing(false);
  };


  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return "Good morning";
                if (hour < 18) return "Good afternoon";
                return "Good evening";
              })()}
            </Text>
            <Text style={styles.headerTitle}>Find a Ride</Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => Alert.alert("Coming Soon", "Advanced filtering is under development.")}
          >
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
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
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
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
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
      </View>

      {locationPermission === "denied" && (
        <View style={styles.locationWarningBanner}>
          <Feather name="info" size={14} color="#F59E0B" />
          <Text style={styles.locationWarningText}>
            Location services disabled. Showing global rides.
          </Text>
        </View>
      )}

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
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push(`/ride-details/${item.id}`)}
            >
              <RideCard ride={item} />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
          ]}
          scrollEnabled={rides.length > 0}
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
              {rides.length} ride{rides.length !== 1 ? "s" : ""} available
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
    backgroundColor: "#1E1E24",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A32",
    maxHeight: 180,
    marginTop: 6,
    zIndex: 50,
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
  locationWarningBanner: {
    backgroundColor: "#1C1500",
    borderColor: "#3E2900",
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationWarningText: {
    color: "#F59E0B",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
