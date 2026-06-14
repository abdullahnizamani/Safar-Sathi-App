import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { api } from "@/src/lib/api";


const TABS = ["Upcoming", "Past"];

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Past">("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review modal states
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [updatingLocationId, setUpdatingLocationId] = useState<string | null>(null);

  const handleShareLocation = async (id: string, isUpdate: boolean) => {
    setUpdatingLocationId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Permission to access location is required to share your marker.");
        return;
      }

      let location = await Location.getLastKnownPositionAsync();
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (!location || (Date.now() - location.timestamp) > FIVE_MINUTES) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = location.coords;
      await api.post(`/requests/${id}/marker`, {
        lat: latitude,
        lng: longitude,
      });

      Alert.alert(
        "Location Shared",
        isUpdate
          ? "Your location marker has been updated successfully!"
          : "Your location marker has been shared with the driver!"
      );
      await fetchBookings();
    } catch (err: any) {
      console.error("Error sharing location:", err);
      const msg = err?.response?.data?.error || err?.message || "Failed to share location marker.";
      Alert.alert("Error", msg);
    } finally {
      setUpdatingLocationId(null);
    }
  };


  const fetchBookings = async () => {
    try {
      setError(null);
      const res = await api.get("/requests/my");
      setBookings(res.data);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleCancel = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel Booking",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/requests/${id}`, { status: "CANCELLED" });
            Alert.alert("Cancelled", "Your booking has been cancelled.");
            await fetchBookings();
          } catch (err: any) {
            console.error("Error cancelling booking:", err);
            const msg = err?.response?.data?.error || err?.message || "Failed to cancel booking.";
            Alert.alert("Error", msg);
          }
        }
      },
    ]);
  };

  const handleSubmitReview = async () => {
    if (!selectedDriverId || !selectedRideId) return;
    setSubmittingReview(true);
    try {
      const payload: any = {
        driver_id: Number(selectedDriverId),
        ride_id: Number(selectedRideId),
        rating,
      };
      if (comment.trim()) {
        payload.comment = comment.trim();
      }
      await api.post("/reviews", payload);
      Alert.alert("Review Submitted", "Thank you for rating your ride!");
      setReviewModalVisible(false);
      setSelectedDriverId(null);
      setSelectedRideId(null);
      setRating(5);
      setComment("");
      await fetchBookings();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      const msg = err?.response?.data?.error || err?.message || "Failed to submit review.";
      Alert.alert("Review Failed", msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLeaveReview = (driverId: number, rideId: number) => {
    setSelectedDriverId(driverId);
    setSelectedRideId(rideId);
    setRating(5);
    setComment("");
    setReviewModalVisible(true);
  };

  const mappedBookings = bookings.map((req) => {
    const ride = req.ride || {};
    let dateStr = "";
    let timeStr = "";
    let isPast = false;
    try {
      const depDate = new Date(ride.departure_time);
      isPast = depDate < new Date() || ride.status === "COMPLETED" || req.status === "CANCELLED" || req.status === "REJECTED";
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
      console.error(err);
    }

    const colors = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];
    const colorIndex = (ride.driver_id || 0) % colors.length;
    const driverColor = colors[colorIndex];
    const driverInitials = ride.driver_name
      ? ride.driver_name.slice(0, 2).toUpperCase()
      : "UN";

    return {
      id: String(req.id),
      ride_id: req.ride_id,
      driver_id: ride.driver_id,
      from: ride.origin || "Unknown",
      to: ride.destination || "Unknown",
      driver: ride.driver_name || "Unknown",
      driverInitials,
      driverColor,
      date: dateStr,
      time: timeStr,
      fare: ride.fare || 0,
      seats: req.requested_seats || 1,
      status: isPast ? ("past" as const) : ("upcoming" as const),
      passengerCount: ride.request_count || 1,
      reqStatus: req.status || "PENDING",
      booking: req,
      reviewed: !!req.reviewed,
    };
  });

  const filtered = mappedBookings.filter((b) =>
    activeTab === "Upcoming" ? b.status === "upcoming" : b.status === "past"
  );

  // If showing Past bookings, sort non-reviewed ones to the top
  if (activeTab === "Past") {
    filtered.sort((a, b) => {
      if (!a.reviewed && b.reviewed) return -1;
      if (a.reviewed && !b.reviewed) return 1;
      return 0;
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab as "Upcoming" | "Past")}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
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
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchBookings(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          extraData={bookings}
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
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/ride-details/${item.ride_id}`)}
            >
              {/* Driver */}
              <View style={styles.driverRow}>
                <View style={[styles.driverAvatar, { backgroundColor: item.driverColor + "33", borderColor: item.driverColor + "66" }]}>
                  <Text style={[styles.driverInitials, { color: item.driverColor }]}>{item.driverInitials}</Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{item.driver}</Text>
                  <View style={styles.passengerRow}>
                    <Feather
                      name={item.reqStatus === "ACCEPTED" ? "check-circle" : item.reqStatus === "PENDING" ? "clock" : "x-circle"}
                      size={11}
                      color={item.reqStatus === "ACCEPTED" ? "#22C55E" : item.reqStatus === "PENDING" ? "#F59E0B" : "#EF4444"}
                    />
                    <Text style={[styles.passengerCount, { color: item.reqStatus === "ACCEPTED" ? "#22C55E" : item.reqStatus === "PENDING" ? "#F59E0B" : "#EF4444" }]}>
                      {item.reqStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.farePill}>
                  <Text style={styles.fareText}>PKR {item.fare}</Text>
                </View>
              </View>

              {/* Route */}
              <View style={styles.route}>
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{item.from}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{item.to}</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={12} color="#52525A" />
                  <Text style={styles.metaText}>{item.date} · {item.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="user" size={12} color="#52525A" />
                  <Text style={styles.metaText}>{item.seats} seat{item.seats !== 1 ? "s" : ""} booked</Text>
                </View>
              </View>

              {item.status === "upcoming" && item.reqStatus === "ACCEPTED" && (
                <View style={{ marginBottom: 4 }}>
                  {item.booking?.marker_lat != null && (
                    <Text style={styles.markerTimestamp}>
                      Marker: {item.booking.marker_lat.toFixed(4)}, {item.booking.marker_lng.toFixed(4)}
                      {item.booking.marker_updated_at ? ` (Updated ${new Date(item.booking.marker_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.locationBtn}
                    disabled={updatingLocationId === item.id}
                    onPress={() => handleShareLocation(item.id, item.booking?.marker_lat != null)}
                  >
                    {updatingLocationId === item.id ? (
                      <ActivityIndicator size="small" color="#D1FAE5" />
                    ) : (
                      <>
                        <Feather name="map-pin" size={14} color="#D1FAE5" />
                        <Text style={styles.locationBtnText}>
                          {item.booking?.marker_lat != null ? "Update Location Marker" : "Share Location Marker"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {item.status === "upcoming" && (item.reqStatus === "ACCEPTED" || item.reqStatus === "PENDING") && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => {
                      const phone =
                        item.booking?.driver_phone ||
                        item.booking?.ride?.driver_phone ||
                        item.booking?.ride?.driver?.phoneNumber ||
                        item.booking?.ride?.driver?.phone_number ||
                        item.booking?.ride?.driver?.phone ||
                        item.booking?.provider?.phoneNumber ||
                        item.booking?.driver?.phoneNumber;

                      Alert.alert(
                        "Contact Driver",
                        `Driver: ${item.driver}\nPhone: ${phone ?? "Phone number not provided"}`
                      );
                    }}
                  >
                    <Feather name="message-square" size={14} color="#A855F7" />
                    <Text style={styles.contactBtnText}>Contact</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item.id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === "past" && (
                item.reviewed ? (
                  <View style={[styles.reviewBtn, { backgroundColor: "#18181C", borderColor: "#2A2A32" }]}>
                    <Feather name="check" size={14} color="#72727A" />
                    <Text style={[styles.reviewBtnText, { color: "#72727A" }]}>Reviewed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleLeaveReview(item.driver_id, item.ride_id)}
                  >
                    <Feather name="star" size={14} color="#F59E0B" />
                    <Text style={styles.reviewBtnText}>Leave a Review</Text>
                  </TouchableOpacity>
                )
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bookmark" size={40} color="#3B1261" />
              <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
              <Text style={styles.emptyText}>
                {activeTab === "Upcoming" ? "Book a ride from the Find tab" : "Your past bookings will appear here"}
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                >
                  <FontAwesome
                    name={star <= rating ? "star" : "star-o"}
                    size={32}
                    color={star <= rating ? "#F59E0B" : "#52525B"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Leave a comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Tell us about your ride..."
              placeholderTextColor="#52525A"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewModalVisible(false)}
                disabled={submittingReview}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  headerTitle: {
    color: "#F1F1F1",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  tabRow: {
    flexDirection: "row",
    gap: 0,
    borderBottomWidth: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#7C3AED",
  },
  tabText: {
    color: "#72727A",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  tabTextActive: {
    color: "#A855F7",
    fontFamily: "Inter_600SemiBold",
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 14,
    gap: 12,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitials: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  driverInfo: { flex: 1 },
  driverName: {
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  passengerCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  farePill: {
    backgroundColor: "#3B1261",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fareText: {
    color: "#C084FC",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  route: { gap: 4 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  routeText: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  routeLine: {
    width: 1.5,
    height: 8,
    backgroundColor: "#3A3A46",
    marginLeft: 3,
  },
  meta: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A2A32",
    paddingTop: 10,
    marginTop: -2,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1C1040",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#3B1261",
  },
  contactBtnText: {
    color: "#A855F7",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1C1608",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#78350F",
    marginTop: -2,
  },
  reviewBtnText: {
    color: "#F59E0B",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#18181C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: "#F1F1F1",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  starTouch: {
    padding: 4,
  },
  modalLabel: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commentInput: {
    backgroundColor: "#0D0D0F",
    color: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#2A2A32",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 88,
    textAlignVertical: "top",
    fontFamily: "Inter_400Regular",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  modalCancelBtnText: {
    color: "#72727A",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: "#6B21A8",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
  },
  modalSubmitBtnText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#065F46",
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#059669",
    marginBottom: 8,
    marginTop: 4,
  },
  locationBtnText: {
    color: "#D1FAE5",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  markerTimestamp: {
    color: "#A1A1AA",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginBottom: 6,
    marginTop: 2,
  },
});

