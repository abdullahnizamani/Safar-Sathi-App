import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PERIODS = ["This Week", "This Month", "All Time"];

const WEEKLY_RIDES = [
  { day: "Mon", rides: 3, height: 80 },
  { day: "Tue", rides: 1, height: 27 },
  { day: "Wed", rides: 5, height: 100 },
  { day: "Thu", rides: 2, height: 53 },
  { day: "Fri", rides: 4, height: 87 },
  { day: "Sat", rides: 0, height: 0 },
  { day: "Sun", rides: 1, height: 27 },
];

const TOP_ROUTES = [
  { from: "FAST University", to: "DHA Phase 8", count: 12, pct: 1 },
  { from: "NED University", to: "Clifton Block 8", count: 8, pct: 0.67 },
  { from: "IBA Campus", to: "Gulshan", count: 5, pct: 0.42 },
];

const STAT_CARDS = [
  { label: "Total Rides", value: "28", icon: "navigation", color: "#7C3AED" },
  { label: "Money Saved", value: "PKR 3,200", icon: "trending-down", color: "#22C55E" },
  { label: "CO₂ Saved", value: "14.2 kg", icon: "wind", color: "#0EA5E9" },
  { label: "Avg Rating", value: "4.8", icon: "star", color: "#F59E0B" },
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [period, setPeriod] = useState("This Week");

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + "22" }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Rides Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rides Per Day</Text>
          <View style={styles.chart}>
            <View style={styles.chartBars}>
              {WEEKLY_RIDES.map((item) => (
                <View key={item.day} style={styles.barWrapper}>
                  <Text style={styles.barCount}>{item.rides > 0 ? item.rides : ""}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(item.height, 4),
                        backgroundColor: item.rides > 0 ? "#6B21A8" : "#1E1E24",
                        opacity: item.rides > 0 ? 1 : 0.4,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Routes</Text>
          <View style={styles.card}>
            {TOP_ROUTES.map((route, i) => (
              <View key={i} style={[styles.routeRow, i < TOP_ROUTES.length - 1 && styles.routeRowBorder]}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeFrom} numberOfLines={1}>{route.from}</Text>
                  <View style={styles.routeArrow}>
                    <Feather name="arrow-right" size={10} color="#52525A" />
                  </View>
                  <Text style={styles.routeTo} numberOfLines={1}>{route.to}</Text>
                </View>
                <View style={styles.routeMeta}>
                  <Text style={styles.routeCount}>{route.count}</Text>
                  <View style={styles.routeBar}>
                    <View style={[styles.routeBarFill, { width: `${route.pct * 100}%` as any }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Impact Card */}
        <View style={[styles.impactCard]}>
          <View style={styles.impactLeft}>
            <Feather name="globe" size={28} color="#22C55E" />
          </View>
          <View style={styles.impactRight}>
            <Text style={styles.impactTitle}>Environmental Impact</Text>
            <Text style={styles.impactText}>
              By carpooling, you've helped reduce 14.2 kg of CO₂ emissions this month. That's equivalent to planting 1 tree.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  headerTitle: {
    color: "#F1F1F1",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  periodRow: { gap: 8 },
  periodChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#18181C",
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  periodChipActive: {
    backgroundColor: "#3B1261",
    borderColor: "#6B21A8",
  },
  periodText: {
    color: "#72727A",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  periodTextActive: {
    color: "#C084FC",
    fontFamily: "Inter_600SemiBold",
  },
  content: { padding: 16, gap: 20 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#F1F1F1",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  statLabel: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: { gap: 10 },
  sectionTitle: {
    color: "#F1F1F1",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  chart: {
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 16,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 130,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  barCount: {
    color: "#72727A",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    height: 14,
  },
  bar: {
    width: "60%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: "#52525A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  card: {
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    padding: 14,
  },
  routeRow: {
    paddingVertical: 10,
    gap: 6,
  },
  routeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A32",
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  routeFrom: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  routeArrow: {},
  routeTo: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textAlign: "right",
  },
  routeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeCount: {
    color: "#A855F7",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    minWidth: 20,
  },
  routeBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#2A2A32",
    borderRadius: 2,
  },
  routeBarFill: {
    height: 4,
    backgroundColor: "#6B21A8",
    borderRadius: 2,
  },
  impactCard: {
    flexDirection: "row",
    backgroundColor: "#0A2010",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#166534",
    padding: 16,
    gap: 14,
    alignItems: "flex-start",
  },
  impactLeft: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0F2A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  impactRight: { flex: 1, gap: 4 },
  impactTitle: {
    color: "#22C55E",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  impactText: {
    color: "#6EE7B7",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
