import { headers } from "next/headers";
import WaiverSigningForm from "@/components/waiver/WaiverSigningForm";

type WaiverPageProps = {
  params: {
    token: string;
  };
};

type WaiverData = {
  body: string;
  booking: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    vehicleType: string;
    vehicleName: string;
  };
  guest_count: number;
  signed_count: number;
};

async function getWaiverData(token: string): Promise<WaiverData | null> {
  const headersList = headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");

  if (!baseUrl) {
    return null;
  }

  const response = await fetch(`${baseUrl}/api/waiver/${token}`, {
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load waiver");
  }

  return (await response.json()) as WaiverData;
}

export default async function WaiverPage({ params }: WaiverPageProps) {
  const waiverData = await getWaiverData(params.token);

  if (!waiverData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-xl">
          <h1 className="text-3xl font-bold text-white">Waiver not found</h1>
          <p className="mt-3 text-neutral-400">
            This waiver link is invalid or is no longer available.
          </p>
        </div>
      </main>
    );
  }

  return <WaiverSigningForm token={params.token} waiver={waiverData} />;
}
