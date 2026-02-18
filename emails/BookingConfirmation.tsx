type BookingConfirmationProps = {
  customerName: string;
  vehicleName: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalPrice: number;
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0];
}

export function getPlainText(props: BookingConfirmationProps): string {
  return [
    `Hi ${getFirstName(props.customerName)},`,
    "",
    "Your booking is confirmed!",
    "",
    `Vehicle: ${props.vehicleName}`,
    `Date: ${props.date}`,
    `Time: ${props.startTime} - ${props.endTime}`,
    `Guest count: ${props.guestCount}`,
    `Total: ${formatPrice(props.totalPrice)}`,
    "",
    "Thank you for booking with ATX Boats and Buses."
  ].join("\n");
}

export default function BookingConfirmation(props: BookingConfirmationProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#1f2937", lineHeight: "1.5" }}>
      <p style={{ margin: "0 0 16px" }}>Hi {getFirstName(props.customerName)},</p>
      <h1 style={{ color: "#1E3A5F", fontSize: "24px", margin: "0 0 16px" }}>Your booking is confirmed!</h1>
      <ul style={{ margin: "0 0 16px", paddingLeft: "20px" }}>
        <li>Vehicle: {props.vehicleName}</li>
        <li>Date: {props.date}</li>
        <li>
          Time: {props.startTime} - {props.endTime}
        </li>
        <li>Guest count: {props.guestCount}</li>
        <li>Total: {formatPrice(props.totalPrice)}</li>
      </ul>
      <p style={{ margin: 0 }}>Thank you for booking with ATX Boats and Buses.</p>
    </div>
  );
}
