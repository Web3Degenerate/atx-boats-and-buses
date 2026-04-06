UPDATE vehicles SET
  name = '22 Foot Cobalt Boat',
  slug = 'cobalt-boat',
  description = 'Our 22-foot Cobalt Boat is perfect for intimate outings on Lake Travis with up to 10 guests. Known for its deep-V hull design that delivers a smooth, stable ride, ideal for cruising, celebrations, and watersports.',
  capacity = 10,
  price_per_hour = 35000,
  minimum_hours = 4,
  maximum_hours = 6,
  features = '["10 Guest Capacity", "Deep-V Hull Design", "Smooth Stable Ride", "Swim Platform", "Bluetooth Audio"]'::json,
  images = '["/images/cobalt-boat/cobalt1.png", "/images/cobalt-boat/cobalt2.jpg"]'::json
WHERE slug = 'cruiser-yacht';
