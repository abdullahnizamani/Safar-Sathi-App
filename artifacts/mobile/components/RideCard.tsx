import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import StaticRouteMap from "@/components/StaticRouteMap";
import { useColors } from "@/hooks/useColors";
import { type Ride } from "@/data/mockRides";
import { useAuth } from "@/src/context/AuthContext";

interface Props {
  ride: Ride;
}

function ProviderAvatar({
  initials,
  color,
}: {
  initials: string;
  color: string;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor: color + "33", borderColor: color + "66" }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  );
}

function TransportIcon({ transport }: { transport: string }) {
  const lower = transport.toLowerCase();
  if (lower === "suv" || lower === "car") {
    return <Feather name="navigation" size={13} color="#72727A" />;
  }
  if (lower === "rickshaw") {
    return <MaterialCommunityIcons name="rickshaw" size={13} color="#72727A" />;
  }
  return <Feather name="truck" size={13} color="#72727A" />;
}

export default function RideCard({ ride }: Props) {
  const colors = useColors();
  const { user } = useAuth();

  const isOwnRide = user && String(user.id) === String(ride.provider.id);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ProviderAvatar
            initials={ride.provider.initials}
            color={ride.provider.avatarColor}
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName} numberOfLines={1}>
                {ride.provider.name}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Feather name="star" size={10} color="#F59E0B" />
              <Text style={styles.rating}>{ride.provider.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.fareBadge}>
          <Text style={styles.fareText}>
            {ride.currency} {ride.fare}
          </Text>
        </View>
      </View>

      {/* Route Section */}
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={styles.routeDotWrapper}>
            <View style={[styles.routeDot, styles.dotGreen]} />
          </View>
          <View style={styles.routeTextWrapper}>
            <Text style={styles.routeLabel}>FROM</Text>
            <Text style={styles.routePlace} numberOfLines={1}>
              {ride.from.name}
            </Text>
          </View>
        </View>

        <View style={styles.dottedLine}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.dottedSegment} />
          ))}
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeDotWrapper}>
            <View style={[styles.routeDot, styles.dotRed]} />
          </View>
          <View style={styles.routeTextWrapper}>
            <Text style={styles.routeLabel}>TO</Text>
            <Text style={styles.routePlace} numberOfLines={1}>
              {ride.to.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Map Preview */}
      <View style={styles.mapWrapper}>
        <StaticRouteMap
          originCoords={ride.from.coords}
          destinationCoords={ride.to.coords}
          height={130}
        />
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={13} color="#72727A" />
          <Text style={styles.detailText}>
            {ride.date} · {ride.time}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="users" size={13} color="#72727A" />
          <Text style={styles.detailText}>Seats: {ride.seats}</Text>
        </View>
        <View style={styles.detailItem}>
          <TransportIcon transport={ride.transport} />
          <Text style={styles.detailText}>{ride.transport}</Text>
        </View>
        {ride.notes && (
          <View style={styles.detailItem}>
            <Feather name="info" size={13} color="#72727A" />
            <Text style={styles.detailText} numberOfLines={1}>{ride.notes}</Text>
          </View>
        )}
      </View>

      {/* Action Row */}
      {isOwnRide && (
        <View style={styles.actions}>
          <View style={styles.ownRideBadge}>
            <Feather name="user" size={13} color="#C084FC" />
            <Text style={styles.ownRideText}>Your Ride</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    overflow: "hidden",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  providerName: {
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  verifiedIcon: {
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  rating: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  fareBadge: {
    backgroundColor: "#3B1261",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#6B21A8",
  },
  fareText: {
    color: "#C084FC",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },

  // Route
  route: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDotWrapper: {
    width: 20,
    alignItems: "center",
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: "#22C55E",
  },
  dotRed: {
    backgroundColor: "#EF4444",
  },
  routeTextWrapper: {
    flex: 1,
    paddingLeft: 8,
  },
  routeLabel: {
    color: "#72727A",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  routePlace: {
    color: "#E4E4E7",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  dottedLine: {
    marginLeft: 9,
    paddingVertical: 3,
    gap: 3,
  },
  dottedSegment: {
    width: 1.5,
    height: 4,
    backgroundColor: "#3A3A46",
    borderRadius: 1,
  },

  // Map
  mapWrapper: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
  },

  // Details Grid
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1E1E24",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  detailText: {
    color: "#A1A1AA",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#3B1261",
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#A855F7",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#6B21A8",
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  ownRideBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    backgroundColor: "#3B126133",
    borderWidth: 1.5,
    borderColor: "#6B21A855",
    paddingVertical: 11,
  },
  ownRideText: {
    color: "#C084FC",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
