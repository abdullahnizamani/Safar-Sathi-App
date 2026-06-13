import { Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

function CenterFAB({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Feather name="plus" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#A855F7",
        tabBarInactiveTintColor: "#52525A",
        tabBarStyle: {
          backgroundColor: "#111115",
          borderTopWidth: 1,
          borderTopColor: "#1E1E24",
          height: Platform.OS === "web" ? 84 : 64,
          paddingBottom: Platform.OS === "web" ? 20 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Find",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: "My Rides",
          tabBarIcon: ({ color, size }) => (
            <Feather name="navigation" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <View style={styles.fabWrapper}>
              <CenterFAB onPress={props.onPress ?? undefined} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bookmark" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-line"
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6B21A8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "web" ? 10 : 16,
    shadowColor: "#6B21A8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
});
