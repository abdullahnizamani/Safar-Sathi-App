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

interface Props {
  originCoords: string;
  destinationCoords: string;
  width?: number;
  height?: number;
}

const isPlaceholderToken = MAPBOX_TOKEN.includes("YOUR_MAPBOX_TOKEN");

export default function StaticRouteMap({
  originCoords,
  destinationCoords,
  width = 400,
  height = 140,
}: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isPlaceholderToken) {
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;

    async function fetchRoute() {
      try {
        const directionsUrl =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${originCoords};${destinationCoords}` +
          `?geometries=polyline&access_token=${MAPBOX_TOKEN}`;

        const res = await fetch(directionsUrl);
        const json = await res.json();

        if (cancelled) return;

        const geometry: string | undefined =
          json?.routes?.[0]?.geometry;

        if (!geometry) {
          setError(true);
          setLoading(false);
          return;
        }

        const encodedPolyline = encodeURIComponent(geometry);
        const staticUrl =
          `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
          `path-${MAPBOX_ROUTE_WIDTH}+${MAPBOX_ROUTE_COLOR}-${MAPBOX_ROUTE_OPACITY}(${encodedPolyline})/` +
          `auto/${width}x${height}?access_token=${MAPBOX_TOKEN}&padding=20`;

        setImageUri(staticUrl);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [originCoords, destinationCoords, width, height]);

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator color="#7C3AED" size="small" />
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[styles.container, styles.placeholder, { height }]}>
        <Feather name="map" size={20} color="#3B1261" />
        {isPlaceholderToken && (
          <Text style={styles.placeholderText}>Add Mapbox token</Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={[styles.image, { height }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#1a1020",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholder: {
    gap: 4,
  },
  placeholderText: {
    color: "#3B1261",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  image: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
});
