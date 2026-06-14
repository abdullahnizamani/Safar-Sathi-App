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

    async function resolveCoords(input: string): Promise<string | null> {
      // Check if it's already a coord pair (e.g. "lng,lat" or "lat,lng")
      const parts = input.split(",");
      if (parts.length === 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lng) && !isNaN(lat)) {
          return `${lng},${lat}`;
        }
      }

      // If it's a name, geocode it via Photon
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=1&countrycode=PK`);
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

    async function fetchRoute() {
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

        const directionsUrl =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${resolvedOrigin};${resolvedDest}` +
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
          `auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}&padding=20`;

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
      <View style={[styles.container, { width: "100%", height }]}>
        <ActivityIndicator color="#7C3AED" size="small" />
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[styles.container, styles.placeholder, { width: "100%", height }]}>
        <Feather name="map" size={20} color="#3B1261" />
        {isPlaceholderToken && (
          <Text style={styles.placeholderText}>Add Mapbox token</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: "100%", height }]}>
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { width: "100%", height: "100%" }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    borderRadius: 10,
    overflow: "hidden",
  },
});
