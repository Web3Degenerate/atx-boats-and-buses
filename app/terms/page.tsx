import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms and Conditions",
  description:
    "Terms and Conditions for ATX Boats & Buses motorcoach and yacht charters in Austin: deposits, cancellations, weather, fees, alcohol, and guest conduct.",
  path: "/terms"
});

const LAST_UPDATED = "October 13, 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="space-y-3 text-neutral-300">{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-neutral-800 text-white">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-white/10">
              {row.map((cell, i) => (
                <td key={i} className="px-4 py-3 text-neutral-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Legal</p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Terms and Conditions</h1>
        <p className="text-neutral-400">Last updated {LAST_UPDATED}</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
          <a href="#general" className="text-emerald-400 underline">General terms</a>
          <a href="#motorcoach" className="text-emerald-400 underline">Motorcoach charters</a>
          <a href="#yacht" className="text-emerald-400 underline">Yacht charters</a>
          <a href="#waivers" className="text-emerald-400 underline">Waivers and liability</a>
        </nav>
      </div>

      <Section id="general" title="Part 1: General terms for all charters">
        <p className="text-neutral-300">
          These terms apply to every motorcoach and yacht charter booked with ATX Boats &amp; Buses (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; &ldquo;our&rdquo;). The person who makes the booking (&ldquo;you&rdquo; or the &ldquo;Booking
          Party&rdquo;) accepts these terms on behalf of every guest in the group.
        </p>

        <Clause title="1.0 Acceptance of terms">
          <p>
            By paying a deposit or any other amount toward a charter, the Booking Party confirms that they have read,
            understood, and agree to these Terms and Conditions on behalf of themselves and every guest in their group.
            Payment of the deposit constitutes acceptance of these terms in full. The Booking Party is responsible for
            sharing these terms with all guests.
          </p>
        </Clause>

        <Clause title="1.1 Deposit and payment">
          <p>
            A deposit of 20% of the total charter price is due at booking to reserve the date. The remaining 80% balance
            is charged automatically to the card on file 5 days before the charter date. Charters booked within 5 days of
            the charter date are paid in full at booking. If the balance cannot be collected, we may cancel the booking
            under the cancellation terms below.
          </p>
        </Clause>

        <Clause title="1.2 Cancellation and refunds">
          <p>
            Cancellations must be made in writing. Email is accepted. The refund depends on how much notice we receive
            before the scheduled start time.
          </p>
          <Table
            head={["Notice before the charter", "What you receive"]}
            rows={[
              ["30 days or more", "Full refund of all amounts paid, including the deposit"],
              ["14 to 29 days", "Refund of 50% of all amounts paid"],
              ["48 hours to 13 days", "Booking credit for all amounts paid"],
              ["Less than 48 hours", "No refund and no credit"],
              ["Less than 48 hours, cancelled for weather", "Booking credit for all amounts paid"]
            ]}
          />
        </Clause>

        <Clause title="1.3 Booking credits">
          <p>
            Booking credits are valid for 6 months from the original charter date. Credits apply toward a future charter
            of any vehicle or vessel, subject to availability. Credits have no cash value, are not refundable, and expire
            if unused.
          </p>
        </Clause>

        <Clause title="1.4 Weather cancellations">
          <p>
            Guest safety comes first. The captain or driver decides whether conditions are safe. If we cancel for weather
            or unsafe conditions, you receive a booking credit for all amounts paid. Weather cancellations are not
            refunded in cash.
          </p>
        </Clause>

        <Clause title="1.5 No shows">
          <p>
            If your group does not arrive for the scheduled charter and has not cancelled, the full charter price is
            charged. No refund or credit is issued.
          </p>
        </Clause>

        <Clause title="1.6 Overtime">
          <p>
            Charters that run past the booked end time are billed at the same hourly rate as the charter. Overtime is
            billed in full hour increments. Any portion of an hour counts as a full hour.
          </p>
        </Clause>

        <Clause title="1.7 Cleaning and damage fees">
          <p>
            The Booking Party is responsible for the conduct of every guest and for the following charges, billed after
            the charter.
          </p>
          <Table
            head={["Situation", "Charge"]}
            rows={[
              ["Deep cleaning required", "$250"],
              ["Vomit in or on the vehicle or vessel", "$500"],
              ["Damage to the vehicle, vessel, or equipment", "Actual cost of repair or replacement"]
            ]}
          />
        </Clause>

        <Clause title="1.8 Smoking and vaping">
          <p>
            Smoking and vaping of any kind are prohibited on all vehicles and vessels. A violation may result in the deep
            cleaning fee, early termination of the charter with no refund, or both.
          </p>
        </Clause>

        <Clause title="1.9 Guest conduct and safety">
          <p>
            All guests must follow the safety instructions of the captain or driver at all times. The captain or driver
            may end the charter early, with no refund, if any guest behaves in a way that is dangerous, illegal, or
            threatens the safety of others. Guests who drink alcohol must be of legal drinking age.
          </p>
        </Clause>

        <Clause title="1.10 Force majeure">
          <p>
            We are not liable for any failure or delay in providing a charter caused by events beyond our reasonable
            control. These include acts of God, severe weather, flood, fire, natural disaster, war, terrorism, civil
            unrest, government action, road or waterway closure, power or utility failure, labor disputes, and public
            health emergencies. If such an event prevents a charter, we will offer to reschedule or issue a booking credit
            for all amounts paid. No cash refund is issued for a force majeure cancellation.
          </p>
        </Clause>

        <Clause title="1.11 Mechanical breakdown or vehicle unavailability">
          <p>
            If a vehicle or vessel becomes mechanically disabled or otherwise unavailable before or during a charter, we
            will make reasonable efforts to provide a comparable replacement. If we cannot, you may choose to reschedule
            or receive a booking credit. If a breakdown ends a charter after it has begun, the credit is prorated for the
            time not used. Our liability for a breakdown or unavailability is limited to the amount paid for the affected
            charter.
          </p>
        </Clause>
      </Section>

      <Section id="motorcoach" title="Part 2: Motorcoach charter terms">
        <p className="text-neutral-300">These terms apply to motorcoach charters in addition to Part 1.</p>

        <Clause title="2.1 Vehicles, capacity, and rates">
          <p>
            Every motorcoach charter has a 4 hour minimum. Rates are per vehicle, not per passenger. A 20% fuel surcharge
            applies to all billed hours.
          </p>
          <Table
            head={["Vehicle", "Maximum passengers", "Hourly rate", "With 20% fuel surcharge", "Minimum"]}
            rows={[
              ["Executive Shuttle (Freightliner)", "26", "$250", "$300", "4 hours"],
              ["Prevost", "23", "$400", "$480", "4 hours"]
            ]}
          />
          <p>Passenger counts may not exceed the maximum for the vehicle booked.</p>
        </Clause>

        <Clause title="2.2 Driver fee">
          <p>
            A driver fee equal to 20% of the base charter cost is paid directly to the driver on the day of the charter.
          </p>
        </Clause>

        <Clause title="2.3 Alcohol">
          <p>The following rules apply on both motorcoaches:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>No glass containers of any kind</li>
            <li>No red wine</li>
            <li>No dark liquors</li>
          </ul>
          <p>
            The driver may remove prohibited items or end the charter, with no refund, if these rules are not followed.
          </p>
        </Clause>

        <Clause title="2.4 Passenger safety">
          <p>
            Passengers must remain seated while the coach is moving and must follow all safety instructions from the
            driver.
          </p>
        </Clause>

        <Clause title="2.5 Weather and road conditions">
          <p>
            In the rare event of unsafe road or weather conditions, the decision to cancel or end a charter is at the
            driver&rsquo;s discretion. You receive a booking credit for all amounts paid, as described in Part 1.
          </p>
        </Clause>

        <Clause title="2.6 Service area">
          <p>Motorcoach charters operate within the state of Texas only.</p>
        </Clause>
      </Section>

      <Section id="yacht" title="Part 3: Yacht charter terms">
        <p className="text-neutral-300">
          These terms apply to yacht charters in addition to Part 1. Every yacht charter is captained.
        </p>

        <Clause title="3.1 Vessels, capacity, and rates">
          <Table
            head={["Vessel", "Maximum passengers", "Hourly rate", "Weekday minimum", "Weekend minimum"]}
            rows={[
              ["Carver 466", "20", "$750", "3 hours", "4 hours"],
              ["Cobalt CS22", "8", "$275, every day", "3 hours", "4 hours"]
            ]}
          />
          <p>Passenger counts may not exceed the maximum for the vessel booked. These limits are firm safety limits.</p>
          <p>
            Texas sales tax of 8.25% is added to the yacht charter price, after any discount. It is not charged on the
            captain fee.
          </p>
        </Clause>

        <Clause title="3.2 Captain fee">
          <p>
            A captain fee equal to 20% of the base charter cost applies to every yacht charter. At checkout you may
            prepay it with your booking, or agree to pay it directly to the captain on the day of the charter.
          </p>
        </Clause>

        <Clause title="3.3 Alcohol">
          <p>On both vessels, red wine and dark liquors are not permitted.</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong className="text-white">Carver 466:</strong> Glass is permitted only in the galley and other areas
              the captain designates.
            </li>
            <li>
              <strong className="text-white">Cobalt CS22:</strong> No glass of any kind is permitted on board.
            </li>
          </ul>
          <p>
            The captain may remove prohibited items or end the charter, with no refund, if these rules are not followed.
          </p>
        </Clause>

        <Clause title="3.4 Life jackets">
          <p>
            All guests must follow the captain&rsquo;s instructions on life jackets. Children under 13 must wear a U.S.
            Coast Guard approved life jacket while the vessel is underway.
          </p>
        </Clause>

        <Clause title="3.5 Swimming and water activities">
          <p>
            Guests who swim or take part in any water activity do so at their own risk. Guests may enter the water only
            when and where the captain permits.
          </p>
        </Clause>

        <Clause title="3.6 Weather cancellations">
          <p>
            The captain determines whether weather and water conditions are safe. If a charter is cancelled or ended early
            for weather, you receive a booking credit for all amounts paid, as described in Part 1. No cash refund is
            issued.
          </p>
        </Clause>
      </Section>

      <Section id="waivers" title="Part 4: Waivers, liability, and general provisions">
        <Clause title="4.1 Liability waiver">
          <p>
            Every guest must sign our liability waiver before boarding. Guests who do not sign may not board, and no
            refund is issued for guests who decline.
          </p>
        </Clause>

        <Clause title="4.2 Assumption of risk">
          <p>
            Motorcoach and yacht charters involve inherent risks. By booking, the Booking Party acknowledges these risks on
            behalf of the group. The full terms of assumption of risk and release are set out in the signed waiver.
          </p>
        </Clause>

        <Clause title="4.3 Personal property">
          <p>We are not responsible for lost, stolen, or damaged personal property brought on board.</p>
        </Clause>

        <Clause title="4.4 Governing law">
          <p>These terms are governed by the laws of the State of Texas.</p>
        </Clause>

        <Clause title="4.5 Changes to these terms">
          <p>
            We may update these terms from time to time. The terms in effect on the date of booking apply to that booking.
          </p>
        </Clause>

        <Clause title="4.6 Contact">
          <p>
            Questions about these terms: email{" "}
            <a href="mailto:bookings@atxboatsandbuses.com" className="text-emerald-400 underline">
              bookings@atxboatsandbuses.com
            </a>
            , call <a href="tel:+15127103801" className="text-emerald-400 underline">(512) 710-3801</a>, or use our{" "}
            <Link href="/contact" className="text-emerald-400 underline">
              contact form
            </Link>
            .
          </p>
        </Clause>
      </Section>
    </section>
  );
}
