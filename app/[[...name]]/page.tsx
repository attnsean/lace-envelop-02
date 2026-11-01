import React from "react";
import Image from "next/image";
import RightSidebar from "../components/RightSidebar";
import { headers } from "next/headers";
import { resolveProjectData } from "../../lib/resolveProject";
import { formatPersonName } from "../../lib/format";
import { LACE_ASSETS } from "../../lib/laceAssets";
import type { Metadata } from "next";

export const revalidate = 0;

type Props = {
  params: Promise<{ name?: string[] }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

const formatFallbackGuestName = (raw: string): string => {
  let name = raw;
  try {
    name = decodeURIComponent(raw);
  } catch {}
  name = name
    .replace(/%20/g, " ")
    .replace(/%25/g, " ")
    .replace(/%/g, " ")
    .replace(/\+/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return name
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  let guestName = "Special Guest";
  const slug = resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[0] : undefined;

  const queryGuest = resolvedSearchParams?.to || resolvedSearchParams?.guest || resolvedSearchParams?.u || resolvedSearchParams?.n;
  if (queryGuest) {
    guestName = formatFallbackGuestName(queryGuest);
  } else if (resolvedParams?.name && resolvedParams.name.length > 0) {
    guestName = formatFallbackGuestName(resolvedParams.name.join(" "));
  }

  const headersList = await headers();
  const host = headersList.get('host') || undefined;

  const dbData = await resolveProjectData(slug, host);

  if (dbData.guest) {
    guestName = dbData.guest.name;
  }

  const brideName = formatPersonName(dbData.project?.bride_nickname) || "Andrea";
  const groomName = formatPersonName(dbData.project?.groom_nickname) || "Daniel";
  const brideFull = formatPersonName(dbData.project?.bride_name) || "Andrea Stefani";
  const groomFull = formatPersonName(dbData.project?.groom_name) || "Daniel Sianipar";

  const title = `Wedding Invitation for ${guestName} | ${brideName} & ${groomName}`;
  const description = `We cordially invite ${guestName} to celebrate the wedding of ${brideFull} & ${groomFull}.`;
  const coverUrl = dbData.project?.cover_photo_url || dbData.project?.opening_photo_url || LACE_ASSETS.coverBg;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: `${brideName} & ${groomName} Wedding`,
      images: [
        {
          url: coverUrl,
          width: 1200,
          height: 630,
          alt: `${brideName} & ${groomName} Wedding Invitation`,
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverUrl],
    }
  };
}

export default async function Home({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  let guestName = "Tamu Undangan";
  const slug = resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[0] : undefined;

  const queryGuest = resolvedSearchParams?.to || resolvedSearchParams?.guest || resolvedSearchParams?.u || resolvedSearchParams?.n;
  if (queryGuest) {
    guestName = formatFallbackGuestName(queryGuest);
  } else if (resolvedParams?.name && resolvedParams.name.length > 0) {
    guestName = formatFallbackGuestName(resolvedParams.name.join(" "));
  }

  const headersList = await headers();
  const host = headersList.get('host') || undefined;

  const dbData = await resolveProjectData(slug, host);

  if (dbData.guest) {
    guestName = dbData.guest.name;
  }

  const brideName = formatPersonName(dbData.project?.bride_nickname) || "Andrea";
  const groomName = formatPersonName(dbData.project?.groom_nickname) || "Daniel";
  const brideFull = formatPersonName(dbData.project?.bride_name) || "Andrea Stefani";
  const groomFull = formatPersonName(dbData.project?.groom_name) || "Daniel Sianipar";

  const weddingDateRaw = dbData.events?.[0]?.event_date || dbData.project?.wedding_date;
  const formatDateDot = (dateStr?: string | null) => {
    if (!dateStr) return "21 . 06 . 2026";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "21 . 06 . 2026";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} . ${month} . ${year}`;
  };
  const formattedDate = formatDateDot(weddingDateRaw);

  const heroPhoto = dbData.project?.cover_photo_url || 
    dbData.project?.opening_photo_url || 
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';

  return (
    <main className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-[#1b040b] text-[#fdfaf6] overflow-hidden relative">
      {/* ========================================================================= */}
      {/* DESKTOP AMBIENT HERO DISPLAY (Hidden on mobile)                           */}
      {/* ========================================================================= */}
      <div className="hidden md:flex relative md:w-[58%] lg:w-[62%] md:h-[100dvh] items-center justify-center overflow-hidden bg-[#160309] border-r border-[#e6c88b]/20">
        {/* Background Photo */}
        <Image
          src={heroPhoto}
          alt={`Wedding ${brideName} & ${groomName}`}
          fill
          sizes="(max-width: 768px) 0vw, 62vw"
          className="object-cover object-center brightness-[0.7] select-none"
          priority
        />
        {/* Burgundy & Gold Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b040b] via-[#1b040b]/40 to-transparent" />
        <div className="absolute inset-0 bg-[#2b0713]/40 backdrop-blur-[1px]" />

        {/* Floating Ambient Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#e6c88b]/15 blur-3xl pointer-events-none" />

        {/* Center Card / Typography Showcase */}
        <div className="relative z-10 text-center px-10 py-12 rounded-3xl bg-[#250711]/85 backdrop-blur-md border border-[#e6c88b]/40 shadow-2xl max-w-lg mx-6 flex flex-col items-center">
          {/* Wax Seal Medallion */}
          <div className="w-16 h-16 mb-4 filter drop-shadow-md">
            <img src={LACE_ASSETS.envelopeSeal} alt="Seal" className="w-full h-full object-contain" />
          </div>

          <p className="text-xs uppercase font-serif-custom font-semibold tracking-[0.35em] text-[#e6c88b] mb-3">
            The Wedding Celebration Of
          </p>

          <h1 className="font-script text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-[#fdfaf6] via-[#f5e4bc] to-[#e6c88b] leading-tight mb-2">
            {brideName} <br />
            <span className="text-[#e6c88b] text-4xl lg:text-5xl">&amp;</span> <br />
            {groomName}
          </h1>

          <p className="font-serif-custom text-sm text-neutral-300 tracking-wider mb-4">
            {brideFull} &amp; {groomFull}
          </p>

          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#e6c88b] to-transparent my-2" />

          <p className="text-sm font-serif-custom tracking-[0.3em] text-[#e6c88b] uppercase font-bold mt-2">
            {formattedDate}
          </p>

          <p className="text-xs text-neutral-400 font-serif-custom italic mt-6">
            Silakan buka undangan di panel sebelah kanan untuk melihat detail acara.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE / RIGHT SIDEBAR: INTERACTIVE LACE ENVELOPE & INVITATION            */}
      {/* ========================================================================= */}
      <RightSidebar
        guestName={guestName}
        guest={dbData.guest}
        project={dbData.project}
        events={dbData.events || []}
        wishes={dbData.wishes || []}
        stats={dbData.stats}
      />
    </main>
  );
}
