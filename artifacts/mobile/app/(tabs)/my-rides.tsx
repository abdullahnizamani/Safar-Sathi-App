import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RideCard from "@/components/RideCard";
import { type Ride } from "@/data/mockRides";
import { useAuth } from "@/src/context/AuthContext";
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

export default function MyRidesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyRides = async () => {
    try {
      setError(null);
      const res = await api.get("/rides");
      const mapped = res.data.map(mapBackendRide);
      // Filter rides to only display those where ride.driverId === user.id
      const filtered = mapped.filter(
        (ride: Ride) => String(ride.provider.id) === String(user?.id)
      );
      setMyRides(filtered);
    } catch (err: any) {
      console.error("Error fetching my rides:", err);
      setError("Failed to load your rides. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRides();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRides();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>My Rides</Text>
        <Text style={styles.headerSub}>{myRides.length} total rides offered</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchMyRides(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myRides}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
              colors={["#7C3AED"]}
            />
          }
          renderItem={({ item }) => (
            <RideCard ride={item} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="navigation" size={40} color="#3B1261" />
              <Text style={styles.emptyTitle}>No rides offered yet</Text>
              <Text style={styles.emptyText}>Create a ride offer in the Offer tab</Text>
            </View>
          }
        />
      )}
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
  list: { padding: 16, gap: 12 },
  empty: {
    alignItems: "center",
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
    textAlign: "center",
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
});
