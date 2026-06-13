import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MY_RIDES = [
  {
    id: "r1",
    from: "FAST National University",
    to: "DHA Phase 8",
    date: "Mon, Jun 16 · 8:00 AM",
    driver: "Ali Hassan",
    fare: 250,
    status: "upcoming" as const,
  },
  {
    id: "r2",
    from: "IBA Main Campus",
    to: "Gulshan-e-Iqbal",
    date: "Sat, Jun 14 · 9:00 AM",
    driver: "Usman Tariq",
    fare: 120,
    status: "completed" as const,
  },
  {
    id: "r3",
    from: "NED University",
    to: "Clifton Block 8",
    date: "Fri, Jun 13 · 8:30 AM",
    driver: "Sara Malik",
    fare: 180,
    status: "completed" as const,
  },
];

const STATUS_COLORS = {
  upcoming: { bg: "#1C1040", text: "#A855F7", border: "#3B1261" },
  completed: { bg: "#0F2A1A", text: "#22C55E", border: "#166534" },
  cancelled: { bg: "#2A0F0F", text: "#EF4444", border: "#7F1D1D" },
};

export default function MyRidesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>My Rides</Text>
        <Text style={styles.headerSub}>{MY_RIDES.length} total rides</Text>
      </View>

      <FlatList
        data={MY_RIDES}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.routeInfo}>
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
                    <Text style={styles.routeText} numberOfLines={1}>{item.from}</Text>
                  </View>
                  <View style={styles.routeDivider} />
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                    <Text style={styles.routeText} numberOfLines={1}>{item.to}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={12} color="#52525A" />
                  <Text style={styles.metaText}>{item.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="user" size={12} color="#52525A" />
                  <Text style={styles.metaText}>{item.driver}</Text>
                </View>
                <View style={styles.fareTag}>
                  <Text style={styles.fareText}>PKR {item.fare}</Text>
                </View>
              </View>
              {item.status === "upcoming" && (
                <TouchableOpacity style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel Ride</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="navigation" size={40} color="#3B1261" />
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptyText}>Book your first ride from the Find tab</Text>
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
  card: {
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  routeInfo: { flex: 1, gap: 4 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  routeText: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  routeDivider: {
    width: 1.5,
    height: 10,
    backgroundColor: "#3A3A46",
    marginLeft: 3,
    marginVertical: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  fareTag: {
    marginLeft: "auto",
    backgroundColor: "#3B1261",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fareText: {
    color: "#C084FC",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  cancelBtn: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7F1D1D",
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 12,
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
