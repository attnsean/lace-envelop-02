'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { LACE_ASSETS } from '../../lib/laceAssets';
import { supabase } from '../../lib/supabase';
import { formatPersonName } from '../../lib/format';

interface RightSidebarProps {
  guestName: string;
  guest?: any;
  project?: any;
  events?: any[];
  wishes?: any[];
  stats?: any;
  existingRsvp?: any;
}

export default function RightSidebar({
  guestName,
  guest,
  project,
  events,
  wishes: initialWishes = [],
  stats,
  existingRsvp,
}: RightSidebarProps) {
  // Opening Envelope State
  const [isOpen, setIsOpen] = useState(false);
  const [isOpeningFlap, setIsOpeningFlap] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState(guestName !== 'Guest Name' && guestName !== 'Special Guest' ? guestName : '');
  const [rsvpPhone, setRsvpPhone] = useState(guest?.phone || '');
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'not_attending'>('attending');
  const [rsvpGuestsCount, setRsvpGuestsCount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(Boolean(existingRsvp));
  const [wishesList, setWishesList] = useState<any[]>(initialWishes);

  // Copy Feedback State
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Lightbox Modal State
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const weddingDateStr = project?.wedding_date || '2026-06-21T08:00:00';

  useEffect(() => {
    const target = new Date(weddingDateStr).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [weddingDateStr]);

  // Audio setup
  const musicUrl = project?.music_url || '/audio/bgm.mp3';

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const handleOpenInvitation = () => {
    setIsOpeningFlap(true);

    // Audio play
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }

    // Golden confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e6c88b', '#f5e4bc', '#d4af37', '#ffffff', '#800020'],
    });

    setTimeout(() => {
      setIsOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setIsSubmittingRsvp(true);

    try {
      const projectId = project?.id || 'f93ad18d-cba2-4de0-a86b-b1fadf2783a8';
      const { error } = await supabase.from('rsvps').insert([
        {
          project_id: projectId,
          guest_name: rsvpName,
          phone: rsvpPhone || null,
          status: rsvpStatus,
          guests_count: rsvpStatus === 'attending' ? rsvpGuestsCount : 0,
          message: rsvpMessage || null,
        },
      ]);

      if (!error) {
        setRsvpSuccess(true);
        if (rsvpMessage.trim()) {
          setWishesList((prev) => [
            {
              id: Date.now().toString(),
              guest_name: rsvpName,
              message: rsvpMessage,
              status: rsvpStatus,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#e6c88b', '#ffffff', '#800020'],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const brideName = formatPersonName(project?.bride_nickname) || 'Andrea';
  const groomName = formatPersonName(project?.groom_nickname) || 'Daniel';
  const brideFull = formatPersonName(project?.bride_name) || 'Andrea Stefani';
  const groomFull = formatPersonName(project?.groom_name) || 'Daniel Sianipar';

  // Sample or dynamic gallery images
  const galleryPhotos = project?.photo_urls?.length
    ? project.photo_urls
    : [
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80',
      ];

  return (
    <div className="relative w-full md:w-[42%] lg:w-[38%] min-h-[100dvh] bg-[#220710] text-[#fdfaf6] flex flex-col items-center overflow-y-auto overflow-x-hidden selection:bg-[#7d233e] selection:text-white shadow-2xl">
      {/* Background Audio */}
      <audio ref={audioRef} loop src={musicUrl} preload="auto" />

      {/* Floating Music Toggle (when open) */}
      {isOpen && (
        <button
          type="button"
          onClick={toggleMusic}
          className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center border border-[#e6c88b]/40 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            isPlayingMusic ? 'bg-[#5c182d]/90 text-[#f5e4bc] animate-spin-slow' : 'bg-black/60 text-neutral-400'
          }`}
          title={isPlayingMusic ? 'Mute Musik' : 'Putar Musik'}
        >
          {isPlayingMusic ? (
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l4.27 4.27c-.4.26-.85.46-1.34.46-2.21 0-4-1.79-4-4s1.79-4 4-4c.49 0 .94.2 1.34.46L19.73 21 21 19.73 4.27 3zM14 7h4V3h-6v5.18l2 2V7z" />
            </svg>
          )}
        </button>
      )}

      {/* ========================================================================= */}
      {/* 1. ENVELOPE COVER (Click to Open with 3D Flap & Lace Border)               */}
      {/* ========================================================================= */}
      {!isOpen && (
        <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-between p-6 sm:p-8 bg-[#1e060e] overflow-hidden z-40">
          {/* Burgundy Texture Background */}
          <div
            className="absolute inset-0 opacity-40 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${LACE_ASSETS.burgundyBg})` }}
          />

          {/* Golden Ambient Lights */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#e6c88b]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#e6c88b]/10 blur-3xl pointer-events-none" />

          {/* Top Label */}
          <div className="relative z-10 text-center pt-8">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom font-semibold">
              The Wedding Invitation
            </span>
          </div>

          {/* Central Burgundy Envelope Box */}
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[370px] flex flex-col items-center my-auto perspective-1000">
            {/* 3D Envelope Wrapper */}
            <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#3b0d1b] to-[#250711] border border-[#e6c88b]/30 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden">
              {/* Subtle Lace Corner Motifs */}
              <div className="absolute top-0 left-0 w-20 h-20 opacity-30 pointer-events-none">
                <img src={LACE_ASSETS.heroLaceCorner} alt="Lace corner" className="w-full h-full object-contain" />
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 opacity-30 pointer-events-none rotate-90">
                <img src={LACE_ASSETS.heroLaceCorner} alt="Lace corner" className="w-full h-full object-contain" />
              </div>

              {/* Monogram Seal / Medallion */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4 flex items-center justify-center">
                <img
                  src={LACE_ASSETS.envelopeSeal}
                  alt="Lace Wax Seal"
                  className={`w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-transform duration-700 ${
                    isOpeningFlap ? 'scale-125 opacity-0' : 'animate-shimmer-lace'
                  }`}
                />
              </div>

              {/* Couple Names */}
              <h1 className="font-script text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#fdfaf6] via-[#f5e4bc] to-[#e6c88b] leading-tight mb-1">
                {brideName} &amp; {groomName}
              </h1>

              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#e6c88b] to-transparent my-3" />

              {/* Wedding Date */}
              <p className="text-xs tracking-[0.25em] text-[#e6c88b]/90 uppercase font-serif-custom mb-6">
                21 . 06 . 2026
              </p>

              {/* Guest Card Badge */}
              <div className="w-full bg-[#1b040b]/80 border border-[#e6c88b]/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-serif-custom mb-1">
                  Kepada Yth. Bpk/Ibu/Saudara/i:
                </p>
                <p className="text-base sm:text-lg font-serif-custom font-bold text-[#fdfaf6] capitalize tracking-wide">
                  {guestName}
                </p>
                <p className="text-[9px] text-[#e6c88b]/70 italic mt-0.5 font-serif-custom">
                  *Mohon maaf bila ada kesalahan penulisan nama/gelar
                </p>
              </div>

              {/* Open Button */}
              <button
                type="button"
                onClick={handleOpenInvitation}
                disabled={isOpeningFlap}
                className="group relative px-6 py-3 rounded-full bg-gradient-to-r from-[#801431] via-[#9e1c3e] to-[#801431] hover:brightness-110 text-white font-serif-custom text-xs font-bold uppercase tracking-[0.2em] shadow-[0_8px_20px_rgba(158,28,62,0.45)] border border-[#e6c88b]/50 transition-all duration-300 transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-[#e6c88b] transition-transform duration-300 group-hover:rotate-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{isOpeningFlap ? 'Membuka...' : 'Buka Undangan'}</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 text-center pb-4">
            <p className="text-[10px] tracking-widest text-neutral-500 uppercase font-serif-custom">
              SeraStory Luxury Burgundy Lace Edition
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN INVITATION CONTENT (Revealed After Envelope Opened)               */}
      {/* ========================================================================= */}
      {isOpen && (
        <main className="relative w-full flex flex-col items-center bg-[#250711] text-[#fdfaf6] animate-fadeIn transition-opacity duration-700">
          {/* Subtle Continuous Burgundy Texture Wallpaper */}
          <div
            className="absolute inset-0 opacity-25 bg-repeat pointer-events-none"
            style={{ backgroundImage: `url(${LACE_ASSETS.burgundyBg})`, backgroundSize: '400px' }}
          />

          {/* Floating Lace Particles in Background */}
          <div className="absolute top-20 right-4 w-32 h-32 opacity-15 pointer-events-none animate-float-slow">
            <img src={LACE_ASSETS.heroLaceMedallion} alt="Lace medallion" className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-[45%] left-2 w-36 h-36 opacity-10 pointer-events-none animate-float-slow" style={{ animationDelay: '3s' }}>
            <img src={LACE_ASSETS.heroLaceMedallion} alt="Lace medallion" className="w-full h-full object-contain" />
          </div>

          {/* ===================================================================== */}
          {/* HERO SECTION: SAVE THE DATE                                           */}
          {/* ===================================================================== */}
          <section className="relative w-full min-h-[92dvh] flex flex-col items-center justify-center p-6 text-center border-b border-[#e6c88b]/15">
            {/* Top Lace Banner */}
            <div className="w-48 sm:w-56 mb-4 opacity-90">
              <img src={LACE_ASSETS.heroLaceBanner} alt="Lace Banner" className="w-full h-auto object-contain" />
            </div>

            <span className="text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom font-semibold mb-2">
              Save The Date
            </span>

            {/* Couple Script Names */}
            <h1 className="font-script text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#fdfaf6] via-[#f5e4bc] to-[#e6c88b] leading-tight my-2">
              {brideName}
            </h1>
            <span className="font-script text-3xl sm:text-4xl text-[#e6c88b] my-1">&amp;</span>
            <h1 className="font-script text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#fdfaf6] via-[#f5e4bc] to-[#e6c88b] leading-tight mb-4">
              {groomName}
            </h1>

            {/* Couple Portrait with Lace Arch Frame */}
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 my-6 flex items-center justify-center">
              {/* Photo */}
              <div className="absolute inset-4 rounded-t-full overflow-hidden border border-[#e6c88b]/30 shadow-2xl">
                <Image
                  src={galleryPhotos[0]}
                  alt="Couple Prewedding"
                  fill
                  className="object-cover object-center brightness-[0.88] hover:scale-105 transition-transform duration-700"
                  priority
                />
              </div>
              {/* Lace Cutout Frame Overlay */}
              <img
                src={LACE_ASSETS.heroLaceFrame}
                alt="Lace Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              />
            </div>

            <p className="text-xs sm:text-sm tracking-[0.25em] text-[#e6c88b] uppercase font-serif-custom font-medium mt-2">
              Minggu, 21 Juni 2026
            </p>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 2: BIBLICAL VERSE / QUOTE                                     */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15 bg-gradient-to-b from-transparent via-[#1d050c]/50 to-transparent">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] p-8 sm:p-10 rounded-2xl bg-[#330b17]/80 border border-[#e6c88b]/25 shadow-xl flex flex-col items-center">
              {/* Decorative Lace Header */}
              <div className="w-16 h-16 mb-4 opacity-70">
                <img src={LACE_ASSETS.heroLaceMedallion} alt="Medallion" className="w-full h-full object-contain" />
              </div>

              <blockquote className="font-serif-custom italic text-xs sm:text-sm text-neutral-200 leading-relaxed mb-4">
                &ldquo;Berdua lebih baik dari pada seorang diri, karena mereka menerima upah yang baik dalam jeri lelah mereka. Karena kalau mereka jatuh, yang seorang mengangkat temannya... Dan tali tiga lembar tak mudah putus.&rdquo;
              </blockquote>

              <cite className="font-serif-custom not-italic text-[11px] uppercase tracking-widest text-[#e6c88b] font-bold">
                Pengkhotbah 4 : 9-12 (TB)
              </cite>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 3: BRIDE & GROOM PROFILE                                      */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Pasangan Pengantin
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-10">
              Mempelai Kami
            </h2>

            <div className="w-full max-w-md space-y-12">
              {/* Groom Profile */}
              <div className="flex flex-col items-center">
                <div className="relative w-44 h-56 sm:w-48 sm:h-64 rounded-full overflow-hidden border-2 border-[#e6c88b]/40 shadow-2xl mb-4">
                  <Image
                    src={project?.groom_photo_url || galleryPhotos[1]}
                    alt="Daniel Sianipar"
                    fill
                    className="object-cover object-top brightness-90"
                  />
                </div>
                <h3 className="font-script text-3xl sm:text-4xl text-[#fdfaf6] mb-1">
                  {groomFull}
                </h3>
                <p className="font-serif-custom text-xs text-[#e6c88b] tracking-wider uppercase mb-1">
                  — Mempelai Pria —
                </p>
                <p className="font-serif-custom text-xs text-neutral-300 max-w-xs leading-relaxed">
                  Putra tercinta dari: <br />
                  <strong className="text-white">Bapak Simon Sianipar</strong> &amp; <strong className="text-white">Ibu Silvia br. Pasaribu</strong>
                </p>
              </div>

              {/* Decorative Divider */}
              <div className="flex items-center justify-center gap-3 w-40 mx-auto">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#e6c88b]/50" />
                <span className="font-script text-2xl text-[#e6c88b]">&amp;</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#e6c88b]/50" />
              </div>

              {/* Bride Profile */}
              <div className="flex flex-col items-center">
                <div className="relative w-44 h-56 sm:w-48 sm:h-64 rounded-full overflow-hidden border-2 border-[#e6c88b]/40 shadow-2xl mb-4">
                  <Image
                    src={project?.bride_photo_url || galleryPhotos[2]}
                    alt="Andrea Stefani"
                    fill
                    className="object-cover object-top brightness-90"
                  />
                </div>
                <h3 className="font-script text-3xl sm:text-4xl text-[#fdfaf6] mb-1">
                  {brideFull}
                </h3>
                <p className="font-serif-custom text-xs text-[#e6c88b] tracking-wider uppercase mb-1">
                  — Mempelai Wanita —
                </p>
                <p className="font-serif-custom text-xs text-neutral-300 max-w-xs leading-relaxed">
                  Putri tercinta dari: <br />
                  <strong className="text-white">Bapak Samuel Stefani</strong> &amp; <strong className="text-white">Ibu Ruth br. Hutabarat</strong>
                </p>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 4: OUR LOVE STORY                                             */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15 bg-[#1f060d]">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Kisah Cinta Kami
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-6">
              Our Love Story
            </h2>

            <div className="relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-2xl bg-[#330b17]/90 border border-[#e6c88b]/20 shadow-xl">
              <p className="font-serif-custom text-xs sm:text-sm text-neutral-200 leading-relaxed mb-6 text-justify">
                Berawal dari perkenalan sederhana di sebuah tempat kopi pada tahun 2020, takdir perlahan menuntun langkah kami untuk saling mengenal lebih dekat. Lewat tawa, beda pendapat, dan dukungan yang tak pernah surut di setiap musim kehidupan, kami yakin untuk melangkah bersama dan merajut masa depan dalam ikatan suci pernikahan.
              </p>

              <div className="space-y-4 text-left border-l-2 border-[#e6c88b]/30 pl-4 my-4">
                <div>
                  <span className="text-xs font-bold text-[#e6c88b] font-serif-custom">2020 • Pertemuan Pertama</span>
                  <p className="text-[11px] text-neutral-300 font-serif-custom">Pertama kali menyapa dalam hangatnya aroma kopi di Bandung.</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#e6c88b] font-serif-custom">2022 • Mengikat Komitmen</span>
                  <p className="text-[11px] text-neutral-300 font-serif-custom">Memutuskan untuk saling mendampingi dan bertumbuh bersama.</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#e6c88b] font-serif-custom">2025 • Lamaran Resmi</span>
                  <p className="text-[11px] text-neutral-300 font-serif-custom">Dua keluarga besar bersatu dalam sukacita pertunangan.</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#e6c88b] font-serif-custom">2026 • Ikatan Suci Pernikahan</span>
                  <p className="text-[11px] text-neutral-300 font-serif-custom">Memulai babak baru kehidupan dalam berkat Tuhan Yang Maha Kuasa.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 5: COUNTDOWN TIMER                                            */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Menghitung Hari
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-6">
              Make Our Day Special
            </h2>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs sm:max-w-sm w-full mb-6">
              {[
                { label: 'Hari', value: timeLeft.days },
                { label: 'Jam', value: timeLeft.hours },
                { label: 'Menit', value: timeLeft.minutes },
                { label: 'Detik', value: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#380e1b] border border-[#e6c88b]/30 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-serif-custom font-bold text-[#f5e4bc]">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#e6c88b]/80 font-serif-custom mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Wedding+of+Andrea+%26+Daniel&dates=20260621T010000Z/20260621T060000Z&details=Pernikahan+Andrea+dan+Daniel&location=Gereja+HKBP+Bandung+Barat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e060e] border border-[#e6c88b]/40 text-xs font-serif-custom font-semibold text-[#f5e4bc] hover:bg-[#380e1b] transition-colors shadow-md"
            >
              <svg className="w-4 h-4 text-[#e6c88b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Simpan ke Google Calendar</span>
            </a>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 6: EVENT DETAILS (AKAD & RESEPSI)                             */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15 bg-[#1e060d]">
            {/* Lace Banner */}
            <div className="w-44 mb-3 opacity-90">
              <img src={LACE_ASSETS.eventBanner11} alt="Event Lace Header" className="w-full h-auto object-contain" />
            </div>

            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Rangkaian Acara
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-10">
              The Detail
            </h2>

            <div className="w-full max-w-sm sm:max-w-md space-y-8">
              {/* Card 1: Pemberkatan / Akad */}
              <div className="relative p-6 sm:p-8 rounded-2xl bg-[#330b17] border border-[#e6c88b]/25 shadow-xl flex flex-col items-center">
                <span className="px-3 py-1 rounded-full bg-[#5c182d] text-[#e6c88b] text-[10px] font-bold uppercase tracking-widest font-serif-custom mb-3">
                  Pemberkatan Kudus
                </span>
                <h3 className="font-serif-custom font-bold text-xl text-[#fdfaf6] mb-2">
                  Minggu, 21 Juni 2026
                </h3>
                <p className="text-xs text-[#e6c88b] font-serif-custom font-medium mb-3">
                  Pukul 08.00 - 10.00 WIB
                </p>
                <div className="h-[1px] w-16 bg-[#e6c88b]/30 my-2" />
                <p className="text-xs font-serif-custom text-neutral-200 font-bold">
                  Gereja HKBP Bandung Barat
                </p>
                <p className="text-[11px] font-serif-custom text-neutral-400 mt-1">
                  Jl. Surya Sumantri No. 45, Sukawarna, Sukajadi, Kota Bandung
                </p>
              </div>

              {/* Card 2: Resepsi */}
              <div className="relative p-6 sm:p-8 rounded-2xl bg-[#330b17] border border-[#e6c88b]/25 shadow-xl flex flex-col items-center">
                <span className="px-3 py-1 rounded-full bg-[#5c182d] text-[#e6c88b] text-[10px] font-bold uppercase tracking-widest font-serif-custom mb-3">
                  Resepsi Pernikahan
                </span>
                <h3 className="font-serif-custom font-bold text-xl text-[#fdfaf6] mb-2">
                  Minggu, 21 Juni 2026
                </h3>
                <p className="text-xs text-[#e6c88b] font-serif-custom font-medium mb-3">
                  Pukul 11.00 WIB - Selesai
                </p>
                <div className="h-[1px] w-16 bg-[#e6c88b]/30 my-2" />
                <p className="text-xs font-serif-custom text-neutral-200 font-bold">
                  Manten Ballroom Bandung
                </p>
                <p className="text-[11px] font-serif-custom text-neutral-400 mt-1">
                  Jl. Dr. Setiabudi No. 130, Gegerkalong, Kota Bandung
                </p>
              </div>

              {/* Google Maps Button */}
              <a
                href="https://maps.google.com/?q=Gereja+HKBP+Bandung"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#801431] to-[#9e1c3e] hover:brightness-110 text-white font-serif-custom text-xs font-bold uppercase tracking-widest shadow-lg border border-[#e6c88b]/40 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#e6c88b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Petunjuk Arah Google Maps</span>
              </a>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 7: DRESS CODE                                                 */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Panduan Busana
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-6">
              Dress Code: Nude Formal
            </h2>

            <div className="relative w-full max-w-sm p-6 rounded-2xl bg-[#330b17]/80 border border-[#e6c88b]/20 shadow-xl flex flex-col items-center">
              {/* Palette Color Circles */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#f4ebe1] border-2 border-white/40 shadow-md" />
                  <span className="text-[9px] text-neutral-300 font-serif-custom">Champagne</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#d8bfa6] border-2 border-white/40 shadow-md" />
                  <span className="text-[9px] text-neutral-300 font-serif-custom">Soft Nude</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#b59379] border-2 border-white/40 shadow-md" />
                  <span className="text-[9px] text-neutral-300 font-serif-custom">Mocha</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#5c182d] border-2 border-[#e6c88b]/60 shadow-md" />
                  <span className="text-[9px] text-neutral-300 font-serif-custom">Burgundy</span>
                </div>
              </div>

              <p className="font-serif-custom text-xs text-neutral-300 leading-relaxed">
                Kami sangat mengapresiasi apabila para tamu mengenakan pakaian bernuansa formal dengan palet warna Nude atau Burgundy untuk keserasian momen istimewa kami.
              </p>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 8: ATTENDANCE & RSVP                                          */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15 bg-[#1d050c]">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Konfirmasi Kehadiran
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-6">
              RSVP &amp; Doa Restu
            </h2>

            <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-2xl bg-[#330b17] border border-[#e6c88b]/25 shadow-xl text-left">
              {rsvpSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <h3 className="font-serif-custom font-bold text-lg text-white">
                    Terima Kasih Atas Konfirmasinya!
                  </h3>
                  <p className="font-serif-custom text-xs text-neutral-300">
                    Konfirmasi dan ucapan Anda telah tersimpan dengan aman di buku tamu kami.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-serif-custom text-[#e6c88b] mb-1 font-semibold">
                      Nama Lengkap Tamu
                    </label>
                    <input
                      type="text"
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1e060e] border border-[#e6c88b]/30 text-white text-xs font-serif-custom focus:outline-none focus:border-[#e6c88b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif-custom text-[#e6c88b] mb-1 font-semibold">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1e060e] border border-[#e6c88b]/30 text-white text-xs font-serif-custom focus:outline-none focus:border-[#e6c88b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif-custom text-[#e6c88b] mb-1 font-semibold">
                      Konfirmasi Kehadiran
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRsvpStatus('attending')}
                        className={`py-2 px-3 rounded-xl border text-xs font-serif-custom font-semibold transition-all cursor-pointer ${
                          rsvpStatus === 'attending'
                            ? 'bg-[#5c182d] border-[#e6c88b] text-white'
                            : 'bg-[#1e060e] border-white/10 text-neutral-400 hover:border-white/30'
                        }`}
                      >
                        ✓ Hadir
                      </button>
                      <button
                        type="button"
                        onClick={() => setRsvpStatus('not_attending')}
                        className={`py-2 px-3 rounded-xl border text-xs font-serif-custom font-semibold transition-all cursor-pointer ${
                          rsvpStatus === 'not_attending'
                            ? 'bg-[#5c182d] border-[#e6c88b] text-white'
                            : 'bg-[#1e060e] border-white/10 text-neutral-400 hover:border-white/30'
                        }`}
                      >
                        ✕ Berhalangan
                      </button>
                    </div>
                  </div>

                  {rsvpStatus === 'attending' && (
                    <div>
                      <label className="block text-xs font-serif-custom text-[#e6c88b] mb-1 font-semibold">
                        Jumlah Tamu yang Hadir
                      </label>
                      <select
                        value={rsvpGuestsCount}
                        onChange={(e) => setRsvpGuestsCount(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1e060e] border border-[#e6c88b]/30 text-white text-xs font-serif-custom focus:outline-none focus:border-[#e6c88b]"
                      >
                        <option value={1}>1 Orang</option>
                        <option value={2}>2 Orang</option>
                        <option value={3}>3 Orang</option>
                        <option value={4}>4 Orang</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-serif-custom text-[#e6c88b] mb-1 font-semibold">
                      Pesan &amp; Doa Restu
                    </label>
                    <textarea
                      rows={3}
                      value={rsvpMessage}
                      onChange={(e) => setRsvpMessage(e.target.value)}
                      placeholder="Tuliskan ucapan dan doa terbaik Anda..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1e060e] border border-[#e6c88b]/30 text-white text-xs font-serif-custom focus:outline-none focus:border-[#e6c88b]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#801431] to-[#9e1c3e] hover:brightness-110 text-white font-serif-custom text-xs font-bold uppercase tracking-widest shadow-lg border border-[#e6c88b]/40 transition-all cursor-pointer"
                  >
                    {isSubmittingRsvp ? 'Mengirim...' : 'Kirim Konfirmasi'}
                  </button>
                </form>
              )}

              {/* Guest Wishes List */}
              {wishesList.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#e6c88b]/20">
                  <h4 className="text-xs font-serif-custom font-bold uppercase tracking-wider text-[#e6c88b] mb-4">
                    Ucapan &amp; Doa ({wishesList.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {wishesList.map((w, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#1e060e]/80 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif-custom font-bold text-xs text-[#f5e4bc]">
                            {w.guest_name || 'Tamu'}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                            w.status === 'attending' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {w.status === 'attending' ? 'Hadir' : 'Berhalangan'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 font-serif-custom italic">
                          &ldquo;{w.message}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 9: WEDDING GIFT / TANDA KASIH                                 */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Tanda Kasih
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-6">
              Wedding Gift
            </h2>

            <p className="font-serif-custom text-xs text-neutral-300 max-w-sm mb-8 leading-relaxed">
              Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun apabila Anda berkenan memberikan tanda kasih, dapat melalui nomor rekening berikut:
            </p>

            <div className="w-full max-w-sm space-y-4">
              {/* Account 1 */}
              <div className="p-6 rounded-2xl bg-[#330b17] border border-[#e6c88b]/25 shadow-xl flex flex-col items-center">
                <span className="text-xs font-serif-custom uppercase tracking-widest text-[#e6c88b] font-bold mb-1">
                  Bank BCA
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest mb-1">
                  7776510
                </span>
                <span className="text-xs font-serif-custom text-neutral-300 mb-4">
                  a.n. Andreas Stefani
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('7776510', 'bca-andreas')}
                  className="px-5 py-2 rounded-full bg-[#1e060e] hover:bg-[#5c182d] border border-[#e6c88b]/40 text-xs font-serif-custom font-semibold text-[#f5e4bc] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {copiedAccount === 'bca-andreas' ? (
                    <>
                      <span className="text-emerald-400">✓</span>
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#e6c88b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Salin No. Rekening</span>
                    </>
                  )}
                </button>
              </div>

              {/* Account 2 */}
              <div className="p-6 rounded-2xl bg-[#330b17] border border-[#e6c88b]/25 shadow-xl flex flex-col items-center">
                <span className="text-xs font-serif-custom uppercase tracking-widest text-[#e6c88b] font-bold mb-1">
                  Bank BCA
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest mb-1">
                  7775419
                </span>
                <span className="text-xs font-serif-custom text-neutral-300 mb-4">
                  a.n. Daniel Sianipar
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('7775419', 'bca-daniel')}
                  className="px-5 py-2 rounded-full bg-[#1e060e] hover:bg-[#5c182d] border border-[#e6c88b]/40 text-xs font-serif-custom font-semibold text-[#f5e4bc] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {copiedAccount === 'bca-daniel' ? (
                    <>
                      <span className="text-emerald-400">✓</span>
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#e6c88b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Salin No. Rekening</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 10: PHOTO GALLERY                                             */}
          {/* ===================================================================== */}
          <section className="relative w-full py-16 px-6 sm:px-8 flex flex-col items-center text-center border-b border-[#e6c88b]/15 bg-[#1d050c]">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#e6c88b] font-serif-custom mb-2">
              Galeri Momen
            </span>
            <h2 className="font-script text-4xl sm:text-5xl text-[#f5e4bc] mb-8">
              Prewedding Gallery
            </h2>

            <div className="grid grid-cols-2 gap-3 max-w-sm sm:max-w-md w-full">
              {galleryPhotos.map((photo: string, i: number) => (
                <div
                  key={i}
                  onClick={() => setActivePhoto(photo)}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#e6c88b]/20 shadow-md cursor-pointer group"
                >
                  <Image
                    src={photo}
                    alt={`Prewedding ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
            </div>
          </section>

          {/* Lightbox Modal */}
          {activePhoto && (
            <div
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setActivePhoto(null)}
            >
              <div className="relative max-w-lg max-h-[85vh] w-full h-full flex items-center justify-center">
                <Image
                  src={activePhoto}
                  alt="Enlarged photo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SECTION 11: CLOSING / THANK YOU                                       */}
          {/* ===================================================================== */}
          <section className="relative w-full py-20 px-6 sm:px-8 flex flex-col items-center text-center">
            {/* Lace Medallion Top */}
            <div className="w-20 mb-4 opacity-80">
              <img src={LACE_ASSETS.heroLaceMedallion} alt="Lace medallion" className="w-full h-auto object-contain" />
            </div>

            <p className="font-serif-custom text-xs sm:text-sm text-neutral-200 max-w-sm leading-relaxed mb-6">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.
            </p>

            <p className="font-serif-custom text-xs text-[#e6c88b] uppercase tracking-widest mb-4">
              Kami yang berbahagia,
            </p>

            <h2 className="font-script text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#fdfaf6] via-[#f5e4bc] to-[#e6c88b] leading-tight mb-6">
              {brideName} &amp; {groomName}
            </h2>

            {/* Lace Bottom Border */}
            <div className="w-40 mb-8 opacity-70">
              <img src={LACE_ASSETS.closingBorder21} alt="Lace Border" className="w-full h-auto object-contain" />
            </div>

            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-serif-custom">
              Created with love by SeraStory
            </p>
          </section>
        </main>
      )}
    </div>
  );
}
