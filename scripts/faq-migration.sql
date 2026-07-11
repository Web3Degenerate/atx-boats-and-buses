-- FAQ System Migration
-- DB-backed FAQ pages with per-question SEO landing URLs (/faq/<slug>)

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  answer_html TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('boats', 'buses', 'general')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with the FAQs previously hardcoded in app/boats/page.tsx and app/buses/page.tsx.
-- The pricing/capacity FAQs are intentionally NOT seeded — they stay computed from live
-- vehicle data in code so they never go stale.
INSERT INTO faqs (slug, question, answer_html, category, sort_order) VALUES
  (
    'where-can-i-charter-a-boat-for-a-corporate-event-in-austin',
    'Where can I charter a boat for a corporate event in Austin?',
    '<p>ATX Boats &amp; Buses offers private boat charter options for Austin corporate outings, including trips on Lake Austin and Lake Travis depending on the selected vessel and event details.</p>',
    'boats',
    10
  ),
  (
    'what-boat-charter-options-are-available',
    'What boat charter options are available?',
    '<p>The current fleet includes a Cobalt boat for smaller groups and a Carver yacht for larger private lake events, with capacity and minimum hours listed on each vehicle page.</p>',
    'boats',
    20
  ),
  (
    'what-events-are-private-boat-charters-best-for',
    'What events are private boat charters best for?',
    '<p>Private boat charters are well suited for corporate offsites, client appreciation events, executive team outings, and business development days on the water around Austin.</p>',
    'boats',
    30
  ),
  (
    'what-bus-rentals-are-available-in-austin',
    'What bus rentals are available in Austin?',
    '<p>ATX Boats &amp; Buses offers premium executive group transportation including a Prevost motorcoach and an executive shuttle for Austin corporate events that need comfortable, private transportation.</p>',
    'buses',
    10
  ),
  (
    'what-events-are-executive-bus-rentals-best-for',
    'What events are executive bus rentals best for?',
    '<p>Executive bus rentals work well for corporate offsites, client appreciation events, executive retreats, business conferences, and downtown Austin corporate transportation.</p>',
    'buses',
    20
  ),
  (
    'can-the-executive-bus-travel-outside-austin',
    'Can the executive bus travel outside Austin?',
    '<p>Yes. Both the Prevost motorcoach and Executive Shuttle are available for statewide corporate travel, including conferences and business trips to Dallas, Fort Worth, San Antonio, and Houston, as well as Hill Country visits.</p>',
    'buses',
    30
  ),
  (
    'how-do-deposits-and-payment-work',
    'How do deposits and payment work?',
    '<p>A 20% deposit confirms your booking, and the remaining balance is automatically charged to your card on file two days before the trip. Bookings made within two days of the trip are paid in full at checkout.</p>',
    'general',
    10
  ),
  (
    'do-guests-need-to-sign-a-waiver',
    'Do guests need to sign a waiver?',
    '<p>Yes. Every guest signs a digital waiver before the trip. You receive a shareable waiver link with your booking confirmation, plus reminders as your trip date approaches.</p>',
    'general',
    20
  )
ON CONFLICT (slug) DO NOTHING;
