import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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

export default function MyRidesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [myRides, setMyRides] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Active" | "Completed">("Active");
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyRides = async () => {
    try {
      setError(null);
      const res = await api.get("/rides/my");
      const ridesData = res.data;

      const ridesWithRequests = await Promise.all(
        ridesData.map(async (ride: any) => {
          try {
            const reqRes = await api.get(`/rides/${ride.id}/requests`);
            return {
              ...ride,
              requests: reqRes.data,
            };
          } catch (err) {
            console.error("Error fetching requests for ride:", ride.id, err);
            return {
              ...ride,
              requests: [],
            };
          }
        })
      );
      setMyRides(ridesWithRequests);
    } catch (err: any) {
      console.error("Error fetching my rides:", err);
      setError("Failed to load your rides. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyRides();
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRides();
    setRefreshing(false);
  };

  const handleCompleteRide = async (rideId: number) => {
    Alert.alert(
      "Complete Ride",
      "Are you sure you want to mark this ride as completed? This will close matching.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              await api.patch(`/rides/${rideId}`, { status: "COMPLETED" });
              Alert.alert("Success", "Ride has been marked as completed!");
              fetchMyRides();
            } catch (err: any) {
              console.error("Error completing ride:", err);
              const msg = err?.response?.data?.error || err?.message || "Failed to complete ride.";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
    );
  };

  const handleUpdateRequest = async (requestId: number, status: "ACCEPTED" | "REJECTED") => {
    try {
      await api.patch(`/requests/${requestId}`, { status });
      Alert.alert("Success", `Request has been ${status.toLowerCase()} successfully!`);
      fetchMyRides();
    } catch (err: any) {
      console.error("Error updating request status:", err);
      const msg = err?.response?.data?.error || err?.message || "Failed to update request.";
      Alert.alert("Error", msg);
    }
  };

  const openRides = myRides.filter(r => r.status === "OPEN" || r.status === "FULL");
  const completedRides = myRides.filter(r => r.status === "COMPLETED");
  const displayedRides = activeTab === "Active" ? openRides : completedRides;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>My Rides</Text>
        
        {/* Toggle Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: "Active", label: `Active (${openRides.length})` },
            { key: "Completed", label: `Completed (${completedRides.length})` }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
          data={displayedRides}
          keyExtractor={(item) => String(item.id)}
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
            <View style={styles.cardContainer}>
              {/* Tapping the ride card toggles its expanded state */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setExpandedRideId(prev => prev === item.id ? null : item.id)}
              >
                <RideCard ride={mapBackendRide(item)} />
              </TouchableOpacity>
              
              {/* Mark as Completed Button */}
              {(item.status === "OPEN" || item.status === "FULL") && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => handleCompleteRide(item.id)}
                  activeOpacity={0.8}
                >
                  <Feather name="check-circle" size={14} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.completeBtnText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}

              {/* Lazy Expandable Passenger Requests List */}
              {expandedRideId === item.id && (
                <View style={styles.requestsSection}>
                  <Text style={styles.requestsTitle}>Passenger Requests</Text>
                  {item.requests && item.requests.length > 0 ? (
                    item.requests.map((req: any) => (
                      <View key={req.id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.riderName}>{req.rider_name}</Text>
                            {req.rider_university ? (
                              <Text style={styles.riderUni}>{req.rider_university}</Text>
                            ) : null}
                            <Text style={styles.riderGender}>Gender: {req.rider_gender}</Text>
                          </View>
                          <View style={styles.statusBadge}>
                            <Text style={[
                              styles.statusText,
                              req.status === "ACCEPTED" ? styles.statusTextAccepted :
                              req.status === "REJECTED" ? styles.statusTextRejected :
                              styles.statusTextPending
                            ]}>
                              {req.status}
                            </Text>
                          </View>
                        </View>

                        {/* Passenger Phone Reveal Privacy Guard */}
                        {req?.status === "ACCEPTED" && (req?.rider_phone || req?.rider?.phone || req?.rider?.phone_number || req?.rider?.phoneNumber) ? (
                          <TouchableOpacity
                            style={styles.phoneLink}
                            onPress={() => {
                              const phone = req?.rider_phone || req?.rider?.phone || req?.rider?.phone_number || req?.rider?.phoneNumber;
                              if (phone) Linking.openURL(`tel:${phone}`);
                            }}
                          >
                            <Feather name="phone" size={12} color="#C084FC" style={{ marginRight: 6 }} />
                            <Text style={styles.phoneText}>{req?.rider_phone || req?.rider?.phone || req?.rider?.phone_number || req?.rider?.phoneNumber}</Text>
                          </TouchableOpacity>
                        ) : req?.status === "ACCEPTED" ? (
                          <View style={styles.phonePlaceholder}>
                            <Feather name="phone-off" size={12} color="#52525A" style={{ marginRight: 6 }} />
                            <Text style={styles.phonePlaceholderText}>Phone number not provided</Text>
                          </View>
                        ) : (
                          <View style={styles.phonePlaceholder}>
                            <Feather name="lock" size={12} color="#52525A" style={{ marginRight: 6 }} />
                            <Text style={styles.phonePlaceholderText}>Phone hidden until accepted</Text>
                          </View>
                        )}

                        {/* Pending actions */}
                        {req.status === "PENDING" && (
                          <View style={styles.actionsContainer}>
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.acceptBtn]}
                              onPress={() => handleUpdateRequest(req.id, "ACCEPTED")}
                            >
                              <Text style={styles.acceptText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.declineBtn]}
                              onPress={() => handleUpdateRequest(req.id, "REJECTED")}
                            >
                              <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noRequestsText}>No incoming requests yet</Text>
                  )}
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="navigation" size={40} color="#3B1261" />
              <Text style={styles.emptyTitle}>
                No {activeTab.toLowerCase()} rides
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "Active" ? "Create a ride offer in the Offer tab" : "Completed rides will appear here"}
              </Text>
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
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#18181C",
    borderRadius: 8,
    padding: 4,
    marginTop: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#3B1261",
  },
  tabText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tabTextActive: {
    color: "#C084FC",
  },
  list: { paddingVertical: 16, gap: 16 },
  cardContainer: {
    backgroundColor: "#18181C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A32",
    overflow: "hidden",
  },
  completeBtn: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  completeBtnText: {
    color: "white",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  requestsSection: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A32",
    padding: 16,
    backgroundColor: "#111115",
  },
  requestsTitle: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: "#18181C",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 12,
    marginBottom: 10,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  riderName: {
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  riderUni: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  riderGender: {
    color: "#52525A",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#1E1E24",
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  statusTextAccepted: {
    color: "#10B981",
  },
  statusTextRejected: {
    color: "#EF4444",
  },
  statusTextPending: {
    color: "#F59E0B",
  },
  phoneLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B126133",
    borderWidth: 1,
    borderColor: "#6B21A833",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  phoneText: {
    color: "#C084FC",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  phonePlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  phonePlaceholderText: {
    color: "#52525A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: "#10B981",
  },
  declineBtn: {
    backgroundColor: "#EF4444",
  },
  acceptText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  declineText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  noRequestsText: {
    color: "#52525A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 10,
  },
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
