import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = ["Upcoming", "Past"];

const BOOKINGS = [
  {
    id: "b1",
    from: "FAST National University",
    to: "DHA Phase 8",
    driver: "Ali Hassan",
    driverInitials: "AH",
    driverColor: "#7C3AED",
    date: "Mon, Jun 16",
    time: "8:00 AM",
    fare: 250,
    seats: 1,
    status: "upcoming" as const,
    passengerCount: 3,
  },
  {
    id: "b2",
    from: "Karachi University",
    to: "Defence Phase 5",
    driver: "Zainab Rauf",
    driverInitials: "ZR",
    driverColor: "#F59E0B",
    date: "Tue, Jun 17",
    time: "7:45 AM",
    fare: 300,
    seats: 1,
    status: "upcoming" as const,
    passengerCount: 2,
  },
  {
    id: "b3",
    from: "IBA Main Campus",
    to: "Gulshan-e-Iqbal",
    driver: "Usman Tariq",
    driverInitials: "UT",
    driverColor: "#10B981",
    date: "Sat, Jun 14",
    time: "9:00 AM",
    fare: 120,
    seats: 1,
    status: "past" as const,
    passengerCount: 2,
  },
];

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Past">("Upcoming");

  const filtered = BOOKINGS.filter((b) =>
    activeTab === "Upcoming" ? b.status === "upcoming" : b.status === "past"
  );

  const handleCancel = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel Booking", style: "destructive", onPress: () => {} },
    ]);
  };

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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Driver */}
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: item.driverColor + "33", borderColor: item.driverColor + "66" }]}>
                <Text style={[styles.driverInitials, { color: item.driverColor }]}>{item.driverInitials}</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{item.driver}</Text>
                <View style={styles.passengerRow}>
                  <Feather name="users" size={11} color="#52525A" />
                  <Text style={styles.passengerCount}>{item.passengerCount} passengers</Text>
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
                <Text style={styles.metaText}>{item.seats} seat booked</Text>
              </View>
            </View>

            {item.status === "upcoming" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => Alert.alert("Contact", `Message ${item.driver}`)}
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
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => Alert.alert("Review", "Rate your ride experience")}
              >
                <Feather name="star" size={14} color="#F59E0B" />
                <Text style={styles.reviewBtnText}>Leave a Review</Text>
              </TouchableOpacity>
            )}
          </View>
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
    color: "#52525A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
});
