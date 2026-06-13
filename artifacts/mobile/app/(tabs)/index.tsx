import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RideCard from "@/components/RideCard";
import { type Ride, MOCK_RIDES } from "@/data/mockRides";

const FILTERS = ["All", "Car", "SUV", "Rickshaw"];

export default function FindScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = MOCK_RIDES.filter((ride) => {
    const matchSearch =
      search === "" ||
      ride.from.name.toLowerCase().includes(search.toLowerCase()) ||
      ride.to.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "All" ||
      ride.transport.toLowerCase() === activeFilter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const handleBook = (ride: Ride) => {
    Alert.alert(
      "Confirm Booking",
      `Book a seat with ${ride.provider.name} for ${ride.currency} ${ride.fare}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => Alert.alert("Booked!", "Your ride has been confirmed.") },
      ]
    );
  };

  const handleViewStops = (ride: Ride) => {
    if (ride.stops.length === 0) {
      Alert.alert("No Stops", "This is a direct ride with no stops.");
      return;
    }
    const stopList = ride.stops.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
    Alert.alert("Stops", stopList);
  };

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

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#72727A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or locations..."
            placeholderTextColor="#52525A"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#72727A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          data={FILTERS}
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
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RideCard ride={item} onBook={handleBook} onViewStops={handleViewStops} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.feedContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
        scrollEnabled={filtered.length > 0}
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
            {filtered.length} ride{filtered.length !== 1 ? "s" : ""} available
          </Text>
        }
      />
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
    paddingBottom: 8,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
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
});
