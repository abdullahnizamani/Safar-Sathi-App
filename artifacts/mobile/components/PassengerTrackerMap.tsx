import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  MAPBOX_ROUTE_COLOR,
  MAPBOX_ROUTE_OPACITY,
  MAPBOX_ROUTE_WIDTH,
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
} from "@/constants/mapbox";

interface PassengerRequest {
  id: string | number;
  rider_name: string;
  rider_initials: string;
  rider_avatar_color: string;
  marker_lat: number | null;
  marker_lng: number | null;
  marker_updated_at: string | null;
}

interface Props {
  originCoords: string;
  destinationCoords: string;
  requests: PassengerRequest[];
  width?: number;
  height?: number;
}

const isPlaceholderToken = MAPBOX_TOKEN.includes("YOUR_MAPBOX_TOKEN");

function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return "Never shared";
  try {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 1) return "just now";
    if (diffMin === 1) return "1m ago";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return "1h ago";
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

export default function PassengerTrackerMap({
  originCoords,
  destinationCoords,
  requests,
  width = 400,
  height = 180,
}: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const acceptedRequests = requests.filter(
    (r) => r.marker_lat != null && r.marker_lng != null
  );

  useEffect(() => {
    if (isPlaceholderToken) {
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;

    async function resolveCoords(input: string): Promise<string | null> {
      const parts = input.split(",");
      if (parts.length === 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lng) && !isNaN(lat)) {
          return `${lng},${lat}`;
        }
      }

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            input
          )}&limit=1&countrycode=PK&lang=en`
        );
        const data = await res.json();
        const coords = data?.features?.[0]?.geometry?.coordinates;
        if (coords && coords.length === 2) {
          return `${coords[0]},${coords[1]}`;
        }
      } catch (err) {
        console.error("Error geocoding fallback name:", input, err);
      }
      return null;
    }

    async function fetchRouteAndBuildMap() {
      try {
        setLoading(true);
        setError(false);

        const resolvedOrigin = await resolveCoords(originCoords);
        const resolvedDest = await resolveCoords(destinationCoords);

        if (cancelled) return;

        if (!resolvedOrigin || !resolvedDest) {
          setError(true);
          setLoading(false);
          return;
        }

        // Fetch directions route geometry
        const directionsUrl =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${resolvedOrigin};${resolvedDest}` +
          `?geometries=polyline&access_token=${MAPBOX_TOKEN}`;

        const res = await fetch(directionsUrl);
        const json = await res.json();

        if (cancelled) return;

        const geometry: string | undefined = json?.routes?.[0]?.geometry;

        const pins: string[] = [];
        // Origin Pin
        pins.push(`pin-s-o+22C55E(${resolvedOrigin})`);
        // Destination Pin
        pins.push(`pin-s-d+EF4444(${resolvedDest})`);

        // Passenger Custom Marker Pins
        acceptedRequests.forEach((req, idx) => {
          const pinColor = (req.rider_avatar_color || "#7C3AED").replace("#", "");
          const label = String(idx + 1);
          pins.push(
            `pin-l-${label}+${pinColor}(${req.marker_lng},${req.marker_lat})`
          );
        });

        const overlaysList: string[] = [];
        if (geometry) {
          const encodedPolyline = encodeURIComponent(geometry);
          overlaysList.push(
            `path-${MAPBOX_ROUTE_WIDTH}+${MAPBOX_ROUTE_COLOR}-${MAPBOX_ROUTE_OPACITY}(${encodedPolyline})`
          );
        }
        pins.forEach((pin) => overlaysList.push(pin));

        const overlays = overlaysList.join(",");
        const staticUrl =
          `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
          `${overlays}/` +
          `auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}&padding=25`;

        setImageUri(staticUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error generating passenger tracker map:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchRouteAndBuildMap();

    return () => {
      cancelled = true;
    };
  }, [originCoords, destinationCoords, requests, width, height]);

  if (loading) {
    return (
      <View style={[styles.mapContainer, { height }]}>
        <ActivityIndicator color="#A855F7" size="small" />
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[styles.mapContainer, styles.placeholder, { height }]}>
        <Feather name="map" size={24} color="#3B1261" />
        <Text style={styles.placeholderText}>
          {isPlaceholderToken
            ? "Mapbox token not configured"
            : "Failed to load tracker map"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrapper, { height }]}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Legend showing riders corresponding to markers */}
      <View style={styles.legendContainer}>
        <View style={styles.legendHeader}>
          <Feather name="users" size={12} color="#A855F7" />
          <Text style={styles.legendTitle}>Rider Map Locations</Text>
        </View>

        {acceptedRequests.length === 0 ? (
          <Text style={styles.noMarkersText}>
            No riders have shared their location marker yet.
          </Text>
        ) : (
          <View style={styles.legendList}>
            {acceptedRequests.map((req, idx) => {
              const label = String(idx + 1);
              return (
                <View key={req.id} style={styles.legendItem}>
                  <View
                    style={[
                      styles.markerBadge,
                      { backgroundColor: req.rider_avatar_color },
                    ]}
                  >
                    <Text style={styles.markerBadgeText}>{label}</Text>
                  </View>
                  <View style={styles.legendTextWrapper}>
                    <Text style={styles.riderName} numberOfLines={1}>
                      {req.rider_name}
                    </Text>
                    <Text style={styles.riderTime}>
                      {formatTimeAgo(req.marker_updated_at)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#18181C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A32",
    overflow: "hidden",
    marginBottom: 16,
  },
  mapContainer: {
    borderRadius: 14,
    backgroundColor: "#111115",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  mapWrapper: {
    width: "100%",
    backgroundColor: "#111115",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    gap: 6,
  },
  placeholderText: {
    color: "#72727A",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  legendContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A32",
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  legendTitle: {
    color: "#A1A1AA",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  noMarkersText: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  legendList: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  markerBadgeText: {
    color: "white",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  legendTextWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riderName: {
    color: "#F1F1F1",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    maxWidth: 160,
  },
  riderTime: {
    color: "#72727A",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
