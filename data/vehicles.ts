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
    fuelChargePercent: 20,
    optionalChargeLabel: "Fuel Charge"
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
    fuelChargePercent: 20,
    optionalChargeLabel: "Fuel Charge"
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
    fuelChargePercent: 0,
    optionalChargeLabel: "Fuel Charge"
  },
  {
    id: "v4",
    name: "22 Foot Cobalt Boat",
    slug: "cobalt-boat",
    type: "party-boat",
    description:
      "Our 22-foot Cobalt Boat is perfect for intimate outings on Lake Austin with up to 10 guests. Known for its deep-V hull design that delivers a smooth, stable ride, ideal for cruising, celebrations, and watersports.",
    capacity: 10,
    pricePerHour: 350,
    images: ["/images/cobalt-boat/cobalt1.png", "/images/cobalt-boat/cobalt2.jpg"],
    features: ["10 Guest Capacity", "Deep-V Hull Design", "Smooth Stable Ride", "Swim Platform", "Bluetooth Audio"],
    minimumHours: 4,
    maximumHours: 6,
    fuelChargePercent: 0,
    optionalChargeLabel: "Fuel Charge"
  }
];
