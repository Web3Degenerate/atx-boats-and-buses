import { Vehicle } from "@/types";

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    name: "45 Foot Prevost Tour Bus",
    slug: "prevost-tour-bus",
    type: "party-bus",
    description:
      "Our flagship 45-foot Prevost Tour Bus comfortably seats 23 guests and comes equipped with a private bathroom. Perfect for bachelor/bachelorette parties, corporate events, and Austin city tours.",
    capacity: 23,
    pricePerHour: 400,
    images: ["/images/bus-1.jpg", "/images/bus-2.jpg"],
    features: [
      "Private Bathroom",
      "23 Guest Capacity",
      "Premium Sound System",
      "LED Party Lighting",
      "Climate Controlled"
    ],
    minimumHours: 3,
    maximumHours: 48,
    fuelChargePercent: 20
  },
  {
    id: "v2",
    name: "36 Foot Executive Shuttle",
    slug: "executive-shuttle",
    type: "party-bus",
    description:
      "Our 36-foot Executive Shuttle seats up to 25 guests with a private bathroom. Ideal for group transportation, weddings, and special events around Austin.",
    capacity: 25,
    pricePerHour: 250,
    images: ["/images/bus-1.jpg", "/images/bus-2.jpg"],
    features: ["Private Bathroom", "25 Guest Capacity", "Comfortable Seating", "Climate Controlled"],
    minimumHours: 3,
    maximumHours: 48,
    fuelChargePercent: 20
  },
  {
    id: "v3",
    name: "50 Foot Carver Yacht",
    slug: "carver-yacht",
    type: "party-boat",
    description:
      "Our stunning 50-foot Carver Yacht accommodates up to 20 guests on Lake Travis. The ultimate luxury experience for parties, celebrations, and sunset cruises.",
    capacity: 20,
    pricePerHour: 700,
    images: ["/images/boat-1.jpg", "/images/boat-2.jpg"],
    features: ["20 Guest Capacity", "Full Sun Deck", "Premium Sound System", "Swim Platform"],
    minimumHours: 3,
    maximumHours: 4,
    fuelChargePercent: 0
  },
  {
    id: "v4",
    name: "38 Foot Cruiser Yacht",
    slug: "cruiser-yacht",
    type: "party-boat",
    description:
      "Our 38-foot Cruiser Yacht is perfect for intimate gatherings of up to 20 guests on Lake Travis. Great for sunset cruises, birthday parties, and corporate outings.",
    capacity: 20,
    pricePerHour: 350,
    images: ["/images/boat-1.jpg", "/images/boat-2.jpg"],
    features: ["20 Guest Capacity", "Open Deck Layout", "Bluetooth Audio", "Swim Platform"],
    minimumHours: 3,
    maximumHours: 4,
    fuelChargePercent: 0
  }
];
