import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import StaticRouteMap from "@/components/StaticRouteMap";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";

interface RideDetails {
  id: number;
  driver_id: number;
  driver_name: string;
  driver_university: string;
  driver_avg_rating: number | null;
  driver_phone: string | null;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  departure_time: string;
  available_seats: number;
  fare: number;
  transport_type: string;
  gender_preference: string;
  status: string;
  request_count: number;
  created_at: string;
}

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { user } = useAuth();

  const [ride, setRide] = useState<any | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null); // "PENDING", "ACCEPTED", "REJECTED" or null
  const [matchedRequest, setMatchedRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePhoneNumber =
    ride?.driver_phone ||
    ride?.driver?.phoneNumber ||
    ride?.driver?.phone_number ||
    ride?.driver?.phone ||
    ride?.driverDetail?.phone ||
    matchedRequest?.driver_phone ||
    matchedRequest?.ride?.driver_phone ||
    matchedRequest?.ride?.driver?.phoneNumber ||
    matchedRequest?.ride?.driver?.phone_number ||
    matchedRequest?.ride?.driver?.phone ||
    matchedRequest?.provider?.phoneNumber ||
    matchedRequest?.driver?.phoneNumber;

  const fetchDetails = async () => {
    try {
      setError(null);
      // Fetch ride details
      const rideRes = await api.get(`/rides/${id}`);
      setRide(rideRes.data);

      // Fetch user's requests to find booking status
      const reqRes = await api.get("/requests/my");
      const matchedReq = reqRes.data.find(
        (req: any) => String(req.ride_id) === String(id)
      );
      if (matchedReq) {
        setBookingStatus(matchedReq.status);
        setMatchedRequest(matchedReq);
      } else {
        setBookingStatus(null);
        setMatchedRequest(null);
      }
    } catch (err: any) {
      console.error("Error fetching ride details:", err);
      setError("Failed to load ride details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleBook = async () => {
    if (!ride) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Confirm Booking",
      `Are you sure you want to book a seat on this ride for PKR ${ride.fare}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setBookingLoading(true);
              await api.post("/requests", { ride_id: Number(ride.id) });
              setBookingStatus("PENDING");
              Alert.alert(
                "Booking Requested",
                "Your request has been sent to the driver for approval."
              );
              // Refresh details to update seats/phone authorization
              fetchDetails();
            } catch (err: any) {
              const msg =
                err?.response?.data?.error || err?.message || "Failed to book ride.";
              Alert.alert("Booking Failed", msg);
            } finally {
              setBookingLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (activePhoneNumber) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${activePhoneNumber}`).catch(() => {
        Alert.alert("Error", "Could not open dialer application.");
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View style={[styles.container, styles.center, { paddingHorizontal: 20 }]}>
        <Feather name="alert-triangle" size={50} color="#EF4444" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error || "Ride not found."}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnRide = user && String(user.id) === String(ride.driver_id);
  const formattedDate = new Date(ride.departure_time).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(ride.departure_time).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const colorsPalette = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];
  const colorIndex = (ride.driver_id || 0) % colorsPalette.length;
  const avatarColor = colorsPalette[colorIndex];
  const initials = ride.driver_name
    ? ride.driver_name.slice(0, 2).toUpperCase()
    : "UN";

  const mapHeight = screenHeight * 0.4;
  const originCoordsStr =
    ride.origin_lng !== null && ride.origin_lat !== null
      ? `${ride.origin_lng},${ride.origin_lat}`
      : ride.origin;
  const destCoordsStr =
    ride.dest_lng !== null && ride.dest_lat !== null
      ? `${ride.dest_lng},${ride.dest_lat}`
      : ride.destination;

  return (
    <View style={styles.container}>
      {/* Dynamic Map Component */}
      <View style={{ width: "100%", height: 320, position: "relative" }}>
        {ride.origin_lng !== null && ride.dest_lng !== null ? (
          <StaticRouteMap
            originCoords={originCoordsStr}
            destinationCoords={destCoordsStr}
            height={320}
          />
        ) : (
          <View style={{ width: "100%", height: 320, backgroundColor: "#1C1C1E", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#A1A1AA" }}>Route map unavailable for this ride.</Text>
          </View>
        )}
        {/* Floating Back Button */}
        <TouchableOpacity
          style={[styles.floatingBack, { top: insets.top + 10 }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Ride Info Panel */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Route Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.dotGreen]} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Origin</Text>
              <Text style={styles.routeText}>{ride.origin}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.dotRed]} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeText}>{ride.destination}</Text>
            </View>
          </View>
        </View>

        {/* Driver Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Driver Info</Text>
          <View style={styles.driverHeader}>
            <View style={[styles.avatar, { backgroundColor: avatarColor + "33", borderColor: avatarColor + "66" }]}>
              <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
            </View>
            <View style={styles.driverMeta}>
              <Text style={styles.driverName}>{ride.driver_name}</Text>
              {ride.driver_university ? (
                <Text style={styles.driverSubtext}>{ride.driver_university}</Text>
              ) : null}
              <View style={styles.ratingRow}>
                <Feather name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingVal}>
                  {(ride.driver_avg_rating || 5.0).toFixed(1)} Rating
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactContainer}>
            {activePhoneNumber ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={15} color="#C084FC" />
                <Text style={styles.callButtonText}>Call Driver ({activePhoneNumber})</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.phonePlaceholder}>
                <Feather name="lock" size={14} color="#72727A" />
                <Text style={styles.phonePlaceholderText}>
                  Phone number hidden until booking is accepted
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.gridItem}>
            <Feather name="calendar" size={16} color="#A855F7" />
            <View>
              <Text style={styles.gridLabel}>Departure Date</Text>
              <Text style={styles.gridValue}>{formattedDate}</Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Feather name="clock" size={16} color="#A855F7" />
            <View>
              <Text style={styles.gridLabel}>Departure Time</Text>
              <Text style={styles.gridValue}>{formattedTime}</Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Feather name="users" size={16} color="#A855F7" />
            <View>
              <Text style={styles.gridLabel}>Seats Available</Text>
              <Text style={styles.gridValue}>{ride.available_seats} Seats</Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            {ride.transport_type.toLowerCase() === "rickshaw" ? (
              <MaterialCommunityIcons name="rickshaw" size={16} color="#A855F7" />
            ) : (
              <Feather name="navigation" size={16} color="#A855F7" />
            )}
            <View>
              <Text style={styles.gridLabel}>Vehicle Type</Text>
              <Text style={styles.gridValue}>{ride.transport_type}</Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Feather name="shield" size={16} color="#A855F7" />
            <View>
              <Text style={styles.gridLabel}>Gender Preference</Text>
              <Text style={styles.gridValue}>{ride.gender_preference}</Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Feather name="dollar-sign" size={16} color="#A855F7" />
            <View>
              <Text style={styles.gridLabel}>Fare Price</Text>
              <Text style={styles.gridValue}>PKR {ride.fare}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button Bar */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isOwnRide ? (
          <View style={styles.ownRideBadge}>
            <Feather name="user" size={15} color="#C084FC" />
            <Text style={styles.ownRideText}>This is Your Offered Ride</Text>
          </View>
        ) : bookingStatus === "ACCEPTED" ? (
          <View style={[styles.statusBadge, styles.statusAccepted]}>
            <Feather name="check-circle" size={15} color="#10B981" />
            <Text style={styles.statusAcceptedText}>Booking Accepted</Text>
          </View>
        ) : bookingStatus === "PENDING" ? (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={styles.statusPendingText}>Booking Request Pending</Text>
          </View>
        ) : bookingStatus === "REJECTED" ? (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <Feather name="x-circle" size={15} color="#EF4444" />
            <Text style={styles.statusRejectedText}>Booking Request Rejected</Text>
          </View>
        ) : ride.available_seats === 0 ? (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <Text style={styles.statusRejectedText}>Ride Full</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBook}
            disabled={bookingLoading}
            activeOpacity={0.8}
          >
            {bookingLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather name="plus-circle" size={16} color="white" />
                <Text style={styles.bookButtonText}>Book a Seat</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#72727A",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: "#3B1261",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6B21A8",
  },
  backBtnText: {
    color: "#C084FC",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  floatingBack: {
    position: "absolute",
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 16,
  },
  sectionTitle: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: "#22C55E",
  },
  dotRed: {
    backgroundColor: "#EF4444",
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    color: "#52525A",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  routeText: {
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  routeLine: {
    width: 1.5,
    height: 24,
    backgroundColor: "#2A2A32",
    marginLeft: 4,
    marginVertical: 4,
  },
  driverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  driverMeta: {
    flex: 1,
  },
  driverName: {
    color: "#F1F1F1",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  driverSubtext: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingVal: {
    color: "#F59E0B",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  contactContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#2A2A32",
    paddingTop: 14,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B126133",
    borderWidth: 1,
    borderColor: "#6B21A855",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  callButtonText: {
    color: "#C084FC",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  phonePlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  phonePlaceholderText: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#18181C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gridLabel: {
    color: "#52525A",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  gridValue: {
    color: "#E4E4E7",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0D0D0F",
    borderTopWidth: 1,
    borderTopColor: "#1E1E24",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bookButton: {
    backgroundColor: "#6B21A8",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bookButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  ownRideBadge: {
    backgroundColor: "#3B126133",
    borderWidth: 1,
    borderColor: "#6B21A855",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ownRideText: {
    color: "#C084FC",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusAccepted: {
    backgroundColor: "#10B9811A",
    borderColor: "#10B98155",
  },
  statusAcceptedText: {
    color: "#10B981",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statusPending: {
    backgroundColor: "#F59E0B1A",
    borderColor: "#F59E0B55",
  },
  statusPendingText: {
    color: "#F59E0B",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statusRejected: {
    backgroundColor: "#EF44441A",
    borderColor: "#EF444455",
  },
  statusRejectedText: {
    color: "#EF4444",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
