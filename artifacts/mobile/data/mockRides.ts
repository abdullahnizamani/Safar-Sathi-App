export interface RideProvider {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  rating: number;
  avatarColor: string;
}

export interface RideStop {
  name: string;
  coords: string;
}

export interface Ride {
  id: string;
  provider: RideProvider;
  from: RideStop;
  to: RideStop;
  fare: number;
  currency: string;
  date: string;
  time: string;
  seats: number;
  transport: string;
  stops: RideStop[];
  notes?: string;
  driverId?: string;
  transportType?: string;
}

export const MOCK_RIDES: Ride[] = [
  {
    id: "1",
    provider: {
      id: "u1",
      name: "Ali Hassan",
      initials: "AH",
      verified: true,
      rating: 4.9,
      avatarColor: "#7C3AED",
    },
    from: {
      name: "FAST National University",
      coords: "67.0643,24.8607",
    },
    to: {
      name: "DHA Phase 8",
      coords: "67.0822,24.7936",
    },
    fare: 250,
    currency: "PKR",
    date: "Mon, Jun 16",
    time: "8:00 AM",
    seats: 4,
    transport: "Car",
    stops: [
      { name: "Shaheed-e-Millat Road", coords: "67.0712,24.8401" },
      { name: "Karsaz", coords: "67.0811,24.8203" },
    ],
  },
  {
    id: "2",
    provider: {
      id: "u2",
      name: "Sara Malik",
      initials: "SM",
      verified: true,
      rating: 4.7,
      avatarColor: "#0EA5E9",
    },
    from: {
      name: "NED University",
      coords: "67.0497,24.9023",
    },
    to: {
      name: "Clifton Block 8",
      coords: "67.0327,24.8103",
    },
    fare: 180,
    currency: "PKR",
    date: "Mon, Jun 16",
    time: "8:30 AM",
    seats: 3,
    transport: "Car",
    stops: [
      { name: "Golimar Chowrangi", coords: "67.0455,24.8712" },
    ],
    notes: "AC car, music off",
  },
  {
    id: "3",
    provider: {
      id: "u3",
      name: "Usman Tariq",
      initials: "UT",
      verified: false,
      rating: 4.4,
      avatarColor: "#10B981",
    },
    from: {
      name: "IBA Main Campus",
      coords: "67.0332,24.8534",
    },
    to: {
      name: "Gulshan-e-Iqbal",
      coords: "67.0932,24.9213",
    },
    fare: 120,
    currency: "PKR",
    date: "Mon, Jun 16",
    time: "9:00 AM",
    seats: 2,
    transport: "Rickshaw",
    stops: [],
  },
  {
    id: "4",
    provider: {
      id: "u4",
      name: "Zainab Rauf",
      initials: "ZR",
      verified: true,
      rating: 5.0,
      avatarColor: "#F59E0B",
    },
    from: {
      name: "Karachi University",
      coords: "67.1052,24.9413",
    },
    to: {
      name: "Defence Phase 5",
      coords: "67.0632,24.7803",
    },
    fare: 300,
    currency: "PKR",
    date: "Mon, Jun 16",
    time: "7:45 AM",
    seats: 4,
    transport: "SUV",
    stops: [
      { name: "Bahadurabad", coords: "67.0641,24.8812" },
      { name: "Tariq Road", coords: "67.0514,24.8611" },
    ],
    notes: "Female only",
  },
  {
    id: "5",
    provider: {
      id: "u5",
      name: "Hamza Khan",
      initials: "HK",
      verified: true,
      rating: 4.6,
      avatarColor: "#EF4444",
    },
    from: {
      name: "SZABIST Campus",
      coords: "67.0712,24.8114",
    },
    to: {
      name: "North Nazimabad",
      coords: "67.0521,24.9534",
    },
    fare: 200,
    currency: "PKR",
    date: "Mon, Jun 16",
    time: "8:15 AM",
    seats: 3,
    transport: "Car",
    stops: [
      { name: "Liaquatabad", coords: "67.0578,24.9123" },
    ],
  },
  {
    id: "6",
    provider: {
      id: "u6",
      name: "Aisha Siddiqui",
      initials: "AS",
      verified: true,
      rating: 4.8,
      avatarColor: "#6366F1",
    },
    from: {
      name: "CBM College",
      coords: "67.0274,24.8423",
    },
    to: {
      name: "Johar More",
      coords: "67.1203,24.9312",
    },
    fare: 150,
    currency: "PKR",
    date: "Mon, Jun 16",
    time: "9:30 AM",
    seats: 2,
    transport: "Car",
    stops: [],
    notes: "No smoking please",
  },
];
