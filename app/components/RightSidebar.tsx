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
  // Envelope & Audio State
  const [isOpen, setIsOpen] = useState(false);
  const [isOpeningFlap, setIsOpeningFlap] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form State
  const [rsvpName, setRsvpName] = useState(guestName !== 'Guest Name' && guestName !== 'Tamu Undangan' ? guestName : '');
  const [rsvpPhone, setRsvpPhone] = useState(guest?.phone || '');
  const [rsvpEmail, setRsvpEmail] = useState(guest?.email || '');
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'not_attending'>('attending');
  const [rsvpGuestsCount, setRsvpGuestsCount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(Boolean(existingRsvp));
  const [wishesList, setWishesList] = useState<any[]>(initialWishes);

  // Toast / Copy Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lightbox Modal State
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Target Wedding Date (26 Juni 2026 / Project Target)
  useEffect(() => {
    const targetDate = new Date('2026-06-26T08:00:00+07:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Open Invitation Handler
  const handleOpenInvitation = () => {
    setIsOpeningFlap(true);

    // Audio Playback
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch((e) => {
        console.log('Audio autoplay prevented:', e);
      });
    }

    // Festive Confetti Burst
    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#e6c88b', '#ffffff', '#b87d89', '#f5e4bc'],
      });
    } catch {}

    setTimeout(() => {
      setIsOpen(true);
    }, 650);
  };

  // Toggle Audio Playback
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {});
    }
  };

  // Copy to Clipboard with Toast
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`${label} berhasil disalin!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // RSVP Submission Handler
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) {
      alert('Mohon isi nama Anda');
      return;
    }

    setIsSubmittingRsvp(true);
    try {
      const payload: any = {
        name: rsvpName,
        phone: rsvpPhone,
        email: rsvpEmail,
        status: rsvpStatus,
        pax: rsvpGuestsCount,
        notes: rsvpMessage,
      };

      if (project?.id) {
        payload.project_id = project.id;
      }
      if (guest?.id) {
        payload.guest_id = guest.id;
      }

      const { data, error } = await supabase.from('rsvps').insert([payload]).select();

      if (error) {
        console.error('RSVP insert error:', error);
      }

      setRsvpSuccess(true);
      setToastMessage('Konfirmasi kehadiran berhasil dikirim! Terima kasih.');

      if (rsvpMessage.trim()) {
        setWishesList((prev) => [
          {
            id: Date.now().toString(),
            name: rsvpName,
            notes: rsvpMessage,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Error submitting RSVP:', err);
    } finally {
      setIsSubmittingRsvp(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Dynamic Gallery Photos (From Supabase project with fallback to R2 high-res prewedding assets)
  const dbGallery: string[] = (project?.gallery_photos && Array.isArray(project.gallery_photos) && project.gallery_photos.length > 0)
    ? project.gallery_photos.map((p: any) => (typeof p === 'string' ? p : p?.url || p?.public_url || '')).filter(Boolean)
    : [];

  const activeGalleryUrls: string[] = dbGallery.length > 0 ? dbGallery : LACE_ASSETS.defaultGallery;

  const galleryItems: Array<{ src: string; title: string }> = activeGalleryUrls.map((url: string, index: number) => ({
    src: url,
    title: `Our Moment ${index + 1}`,
  }));

  // High-Resolution Authentic Photos from R2 (Zero Screenshots)
  const brideImg = project?.bride_photo_url || LACE_ASSETS.bridePhoto;
  const groomImg = project?.groom_photo_url || LACE_ASSETS.groomPhoto;
  const storyImg = project?.opening_photo_url || project?.cover_photo_url || LACE_ASSETS.ourStoryPhoto;
  const locketLeftImg = project?.cover_photo_url || LACE_ASSETS.locketLeft;
  const locketRightImg = project?.opening_photo_url || LACE_ASSETS.locketRight;

  return (
    <div className="relative w-full md:w-[42%] lg:w-[38%] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#22050c] text-white select-none scroll-smooth">
      {/* Background Audio Element */}
      <audio ref={audioRef} src="/audio/bgm.mp3" loop preload="auto" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#350711]/95 text-[#fdfaf7] px-6 py-2.5 rounded-full border border-[#e6c88b]/70 shadow-2xl backdrop-blur-md font-britannic text-xs sm:text-sm tracking-wide transition-all animate-bounce">
          ✨ {toastMessage}
        </div>
      )}

      {/* Floating Audio Play / Pause Button */}
      {isOpen && (
        <button
          onClick={toggleMusic}
          aria-label="Toggle background audio"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#350711]/90 border border-[#e6c88b] text-[#e6c88b] flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
        >
          {isPlayingMusic ? (
            <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          )}
        </button>
      )}

      {/* ========================================================================= */}
      {/* COVER SCREEN: 01 LACE - BURGUNDY - COVER CLICK TO OPEN                   */}
      {/* ========================================================================= */}
      {!isOpen ? (
        <section
          className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between py-10 px-6 bg-cover bg-center text-center overflow-hidden"
          style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
        >
          {/* Top Lace Pattern Strip */}
          <div className="lace-pattern-top" />

          {/* Top Spacing */}
          <div className="pt-2" />

          {/* Interactive Envelope with Doily & Wax Seal */}
          <div className="relative w-full max-w-[340px] flex flex-col items-center">
            {/* Heart Lace Doily peeking out from envelope */}
            <div
              className={`relative z-10 w-[240px] h-[220px] -mb-16 transition-all duration-700 ease-out ${
                isOpeningFlap ? '-translate-y-16 scale-105' : 'translate-y-0'
              }`}
            >
              <img
                src={LACE_ASSETS.coverHeartDoily}
                alt="Heart Lace Doily"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
              {/* Text on Heart Doily */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 text-[#3c0915] pointer-events-none">
                <span className="font-abigail text-2xl sm:text-3xl leading-tight">Save The Date</span>
                <span className="font-britannic text-sm sm:text-base font-bold tracking-wider mt-0.5">26.06.26</span>
              </div>
            </div>

            {/* Cream Envelope with Wax Seal & Flower */}
            <div className="relative z-20 w-full max-w-[320px] filter drop-shadow-2xl cursor-pointer" onClick={handleOpenInvitation}>
              <img
                src={LACE_ASSETS.coverEnvelope}
                alt="Cover Envelope"
                className="w-full h-auto object-contain"
              />
              {/* "Click to open" script on envelope flap */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                <span className="font-abigail text-2xl sm:text-3xl text-[#3c0915] tracking-wide">
                  Click to open
                </span>
              </div>
            </div>
          </div>

          {/* Guest Identity & Action Trigger */}
          <div className="relative z-30 flex flex-col items-center max-w-xs w-full pb-4">
            <p className="font-britannic text-xs text-neutral-200 tracking-wider uppercase mb-1">
              Kepada Yth. Bapak/Ibu/Saudara/i:
            </p>
            <div className="px-6 py-2 rounded-full bg-[#350711]/85 border border-[#e6c88b]/60 shadow-lg backdrop-blur-sm mb-4">
              <h2 className="font-abigail text-2xl sm:text-3xl text-[#fdfaf7] leading-none">
                {guestName}
              </h2>
            </div>

            <button
              onClick={handleOpenInvitation}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#e6c88b] via-[#f5e4bc] to-[#e6c88b] text-[#3c0915] font-britannic font-bold text-xs uppercase tracking-[0.25em] shadow-xl hover:scale-105 active:scale-95 transition-all animate-pulse-subtle"
            >
              Buka Undangan
            </button>
          </div>

          {/* Bottom Lace Pattern Strip */}
          <div className="lace-pattern-bottom" />
        </section>
      ) : (
        /* ========================================================================= */
        /* INVITATION CONTENT: ALL 10 PAGES IDENTICAL TO 01 LACE - BURGUNDY.PDF      */
        /* ========================================================================= */
        <div className="relative w-full flex flex-col">

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 1: SAVE THE DATE (HERO COMPOSITION)                               */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            {/* Silver Oval Serving Platter / Tray */}
            <div className="relative w-full max-w-[340px] aspect-[3378/4937] flex items-center justify-center filter drop-shadow-2xl">
              <img
                src={LACE_ASSETS.silverTrayHal1}
                alt="Silver Platter"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Angled Mountain Envelope (Upper Center) */}
              <div className="absolute top-[14%] left-[10%] w-[58%] -rotate-[12deg] z-10 filter drop-shadow-md">
                <img
                  src={LACE_ASSETS.mountainCardHal1}
                  alt="Save The Date Watercolor"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Heart Silver Locket (Upper Right) with Couple Photos */}
              <div className="absolute top-[28%] right-[4%] w-[52%] z-20 filter drop-shadow-lg">
                <div className="relative w-full">
                  <img
                    src={LACE_ASSETS.heartLocketHal1}
                    alt="Silver Locket"
                    className="w-full h-auto object-contain relative z-20 pointer-events-none"
                  />
                  {/* Photo in Left Heart */}
                  <div className="absolute top-[18%] left-[11%] w-[38%] h-[68%] rounded-full overflow-hidden z-10">
                    <img src={locketLeftImg} alt="Couple" className="w-full h-full object-cover" />
                  </div>
                  {/* Photo in Right Heart */}
                  <div className="absolute top-[26%] right-[10%] w-[38%] h-[68%] rounded-full overflow-hidden z-10">
                    <img src={locketRightImg} alt="Couple" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Heart Lace Mesh Doily (Center) with Andrea & Daniel */}
              <div className="absolute bottom-[24%] left-[12%] w-[76%] z-15 filter drop-shadow-md">
                <div className="relative w-full">
                  <img
                    src={LACE_ASSETS.heartMeshHal1}
                    alt="Heart Doily"
                    className="w-full h-auto object-contain"
                  />
                  {/* Couple Names */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3c0915] pointer-events-none pt-2">
                    <h1 className="font-abigail text-3xl sm:text-4xl leading-tight">Andrea</h1>
                    <span className="font-abigail text-xl sm:text-2xl leading-none">&amp;</span>
                    <h1 className="font-abigail text-3xl sm:text-4xl leading-tight">Daniel</h1>
                  </div>
                </div>
              </div>

              {/* Three White Roses Bouquet (Bottom Left) */}
              <div className="absolute -bottom-[2%] left-[10%] w-[48%] z-30 filter drop-shadow-lg">
                <img
                  src={LACE_ASSETS.whiteRosesHal1}
                  alt="White Roses Bouquet"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Subtle Scroll Down Prompt */}
            <div className="mt-4 flex flex-col items-center opacity-70 animate-bounce">
              <span className="font-britannic text-[11px] tracking-widest uppercase text-neutral-300">Scroll Down</span>
              <svg className="w-4 h-4 text-neutral-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 2: SCRIPTURE QUOTE (BIBLE VERSE)                                  */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            {/* White Decorative Lace Card */}
            <div className="relative w-full max-w-[340px] aspect-[3536/4514] flex items-center justify-center filter drop-shadow-2xl">
              <img
                src={LACE_ASSETS.laceFrameHal2}
                alt="Lace Border Frame"
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Scripture Text inside Frame */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-12 sm:px-14 text-center text-[#3c0915]">
                <p className="font-britannic text-xs sm:text-sm leading-relaxed sm:leading-loose tracking-wide">
                  &ldquo;Berdua lebih baik dari pada seorang diri, karena mereka menerima upah yang baik dalam jeri lelah mereka. Karena kalau mereka jatuh, yang seorang mengangkat temannya... Dan tali tiga lembar tak mudah putus.&rdquo;
                </p>
                <div className="w-12 h-[1px] bg-[#3c0915]/40 my-3" />
                <p className="font-britannic text-xs sm:text-sm font-bold tracking-wider">
                  Pengkhotbah 12 -4:9 (TB)
                </p>
              </div>
            </div>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 3: THE COUPLE (ANDREA & DANIEL)                                    */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center py-12 px-6 bg-cover bg-center overflow-hidden space-y-8"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            {/* Andrea (Bride) Row */}
            <div className="w-full max-w-sm flex items-center justify-start space-x-4">
              <div className="relative w-36 sm:w-40 aspect-[2173/2767] shrink-0 filter drop-shadow-xl">
                <img
                  src={LACE_ASSETS.baroqueGoldFrameHal3}
                  alt="Gold Frame"
                  className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                />
                <div className="absolute inset-[15%] rounded-full overflow-hidden z-10">
                  <img src={brideImg} alt="Andrea" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <h2 className="font-abigail text-4xl sm:text-5xl text-white leading-tight">Andrea</h2>
                <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest mt-1">
                  Putri dari Bapak Samuel
                </p>
                <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest">
                  &amp; Ibu Ruth
                </p>
              </div>
            </div>

            {/* Daniel (Groom) Row */}
            <div className="w-full max-w-sm flex items-center justify-end space-x-4">
              <div className="flex flex-col text-right">
                <h2 className="font-abigail text-4xl sm:text-5xl text-white leading-tight">Daniel</h2>
                <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest mt-1">
                  Putra dari Bapak Simon
                </p>
                <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest">
                  &amp; Ibu Silvia
                </p>
              </div>
              <div className="relative w-36 sm:w-40 aspect-[2173/2767] shrink-0 filter drop-shadow-xl">
                <img
                  src={LACE_ASSETS.baroqueGoldFrameHal3}
                  alt="Gold Frame"
                  className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                />
                <div className="absolute inset-[15%] rounded-full overflow-hidden z-10">
                  <img src={groomImg} alt="Daniel" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 4: OUR STORY                                                      */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            {/* Rose-Embossed Gold Frame with Veil Photo */}
            <div className="relative w-44 sm:w-48 aspect-[3124/3669] filter drop-shadow-2xl mb-4">
              <img
                src={LACE_ASSETS.floralGoldFrameHal4}
                alt="Rose Gold Frame"
                className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
              />
              <div className="absolute inset-[16%] rounded-full overflow-hidden z-10">
                <img src={storyImg} alt="Our Story" className="w-full h-full object-cover" />
              </div>
            </div>

            <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-3">Our Story</h2>

            <p className="font-britannic text-xs sm:text-sm text-neutral-200 leading-relaxed sm:leading-loose max-w-sm px-4">
              Berawal dari perkenalan sederhana di sebuah tempat kopi pada tahun 2020, takdir perlahan menuntun langkah kami untuk saling mengenal lebih dekat. Lewat tawa, beda pendapat, dan dukungan yang tak pernah surut di setiap musim kehidupan, kami yakin untuk melangkah bersama dan merajut masa depan dalam ikatan suci pernikahan.
            </p>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 5: MAKE OUR DAY SPECIAL (COUNTDOWN & FAST RSVP)                   */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            {/* Double Heart Silver Locket */}
            <div className="relative w-48 sm:w-56 filter drop-shadow-xl mb-3">
              <img
                src={LACE_ASSETS.silverLocketHal5}
                alt="Silver Locket"
                className="w-full h-auto object-contain relative z-20 pointer-events-none"
              />
              <div className="absolute top-[18%] left-[11%] w-[38%] h-[68%] rounded-full overflow-hidden z-10">
                <img src={locketLeftImg} alt="Couple" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-[26%] right-[10%] w-[38%] h-[68%] rounded-full overflow-hidden z-10">
                <img src={locketRightImg} alt="Couple" className="w-full h-full object-cover" />
              </div>
            </div>

            <h3 className="font-serif-custom text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-200">
              MAKE OUR DAY SPECIAL
            </h3>
            <h2 className="font-britannic text-4xl sm:text-5xl text-white font-bold my-1">
              26.06.26
            </h2>

            {/* Countdown Clock */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 my-3">
              {[
                { label: 'Hari', val: timeLeft.days },
                { label: 'Jam', val: timeLeft.hours },
                { label: 'Menit', val: timeLeft.minutes },
                { label: 'Detik', val: timeLeft.seconds },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-[#350711]/90 border border-[#e6c88b]/40 min-w-[54px]">
                  <span className="font-britannic text-base sm:text-lg font-bold text-[#fdfaf7]">{item.val}</span>
                  <span className="font-serif-custom text-[9px] uppercase tracking-wider text-[#e6c88b]">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="font-britannic text-xs text-neutral-200 max-w-xs mb-4">
              Let us know if you can celebrate this unforgettable moment with us.
            </p>

            {/* Quick RSVP Form with Original Pill Elements */}
            <form onSubmit={handleRsvpSubmit} className="w-full max-w-xs space-y-2.5 text-left">
              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Your Name</label>
                <input
                  type="text"
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Tamu Undangan"
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                />
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Whatsapp/ No. Hp</label>
                <input
                  type="tel"
                  value={rsvpPhone}
                  onChange={(e) => setRsvpPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                />
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Email</label>
                <input
                  type="email"
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                />
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Are you coming?</label>
                <div className="flex space-x-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('attending')}
                    className={`flex-1 py-2 px-2 rounded-full font-britannic text-[11px] tracking-wide transition-all ${
                      rsvpStatus === 'attending'
                        ? 'bg-[#e6c88b] text-[#3c0915] font-bold shadow-md'
                        : 'bg-[#350711]/85 border border-white/20 text-neutral-300'
                    }`}
                  >
                    Absolutely, wouldn&quot;t miss it!
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('not_attending')}
                    className={`flex-1 py-2 px-2 rounded-full font-britannic text-[11px] tracking-wide transition-all ${
                      rsvpStatus === 'not_attending'
                        ? 'bg-[#e6c88b] text-[#3c0915] font-bold shadow-md'
                        : 'bg-[#350711]/85 border border-white/20 text-neutral-300'
                    }`}
                  >
                    Sadly, cannot make it
                  </button>
                </div>
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Jumlah Tamu, Pax Yang Hadir</label>
                <select
                  value={rsvpGuestsCount}
                  onChange={(e) => setRsvpGuestsCount(Number(e.target.value))}
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                >
                  <option value={1} className="bg-[#22050c]">1 orang</option>
                  <option value={2} className="bg-[#22050c]">2 orang</option>
                  <option value={3} className="bg-[#22050c]">3 orang</option>
                  <option value={4} className="bg-[#22050c]">4 orang</option>
                </select>
              </div>

              {/* RSVP NOW Button using authentic graphic */}
              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmittingRsvp}
                  className="relative w-48 hover:scale-105 active:scale-95 transition-transform"
                >
                  <img src={LACE_ASSETS.rsvpNowBtn} alt="RSVP NOW" className="w-full h-auto object-contain filter drop-shadow-lg" />
                </button>
              </div>
            </form>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 6: THE DETAIL (AKAD & RESEPSI SCHEDULE)                           */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-4">The Detail</h2>

            {/* Silver Oval Mirror with White Satin Lace Bows */}
            <div className="relative w-full max-w-[340px] aspect-[3378/4937] flex items-center justify-center filter drop-shadow-2xl">
              <img
                src={LACE_ASSETS.silverTrayHal6}
                alt="Silver Mirror"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Top-Left Ribbon Bow */}
              <div className="absolute -top-[2%] -left-[4%] w-24 sm:w-28 z-30 filter drop-shadow-lg">
                <img src={LACE_ASSETS.whiteBowHal6A} alt="Bow" className="w-full h-auto object-contain" />
              </div>

              {/* Bottom-Right Ribbon Bow */}
              <div className="absolute -bottom-[2%] -right-[4%] w-24 sm:w-28 z-30 filter drop-shadow-lg">
                <img src={LACE_ASSETS.whiteBowHal6B} alt="Bow" className="w-full h-auto object-contain" />
              </div>

              {/* Event Content Inside Mirror */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-[#3c0915] text-center">
                <h3 className="font-abigail text-3xl sm:text-4xl leading-tight">Akad</h3>
                <p className="font-britannic text-xs font-bold mt-1">Minggu, 21 Juni 2025</p>
                <p className="font-britannic text-xs">Pukul 10.00 - 08.00 WIB</p>
                <p className="font-baskerville text-xs font-semibold text-[#5c182d]">Gereja HKBP Bandung Barat</p>

                <div className="w-16 h-[1px] bg-[#3c0915]/30 my-4" />

                <h3 className="font-abigail text-3xl sm:text-4xl leading-tight">Resepsi</h3>
                <p className="font-britannic text-xs font-bold mt-1">Minggu, 21 Juni 2025</p>
                <p className="font-britannic text-xs">Pukul 10.00 - selesai</p>
                <p className="font-baskerville text-xs font-semibold text-[#5c182d]">Manten Ballroom</p>

                {/* Google Maps Button */}
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 px-6 py-1.5 rounded-full bg-[#fdfaf7] border border-[#3c0915]/50 text-[#3c0915] font-britannic text-xs font-bold tracking-widest shadow-md hover:bg-[#3c0915] hover:text-white transition-all uppercase"
                >
                  GOOGLE MAPS
                </a>
              </div>
            </div>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 7: DRESS CODE                                                     */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-6">Dress Code</h2>

            {/* Groom & Bride Line Art Illustration */}
            <div className="relative w-48 sm:w-56 aspect-[2287/3130] filter drop-shadow-xl mb-6">
              <img
                src={LACE_ASSETS.dressCodeLineArtHal7}
                alt="Dress Code Illustration"
                className="w-full h-full object-contain filter invert"
              />
            </div>

            {/* Three Color Swatches */}
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#c9919d] shadow-lg border-2 border-white/40" />
              <div className="w-10 h-10 rounded-full bg-[#8a6771] shadow-lg border-2 border-white/40" />
              <div className="w-10 h-10 rounded-full bg-[#c79f94] shadow-lg border-2 border-white/40" />
            </div>

            <p className="font-serif-custom text-base text-white tracking-widest uppercase">
              Nude Formal
            </p>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 8: ATTENDANCE CONFIRMATION & BLESSINGS FORM                        */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-3">Attendance</h2>

            {/* Cream Floral Envelope Graphic with Couple Photo */}
            <div className="relative w-52 sm:w-60 aspect-[2496/2623] filter drop-shadow-2xl mb-4">
              <img
                src={LACE_ASSETS.daffodilEnvelopeHal8}
                alt="Envelope with Daffodils"
                className="w-full h-full object-contain relative z-20 pointer-events-none"
              />
              {/* Inserted Oval Lace Frame & Photo */}
              <div className="absolute top-[16%] left-[24%] w-[52%] aspect-[1676/2378] z-10">
                <img
                  src={LACE_ASSETS.ovalLaceFrameHal8}
                  alt="Oval Lace"
                  className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                />
                <div className="absolute inset-[15%] rounded-full overflow-hidden z-10">
                  <img src={storyImg} alt="Couple" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Attendance Form */}
            <form onSubmit={handleRsvpSubmit} className="w-full max-w-xs space-y-2.5 text-left">
              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Guest Identity</label>
                <input
                  type="text"
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Guest Name"
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                />
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Email Adress</label>
                <input
                  type="email"
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                />
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Whatsapp Number</label>
                <input
                  type="tel"
                  value={rsvpPhone}
                  onChange={(e) => setRsvpPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                />
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Confirmation</label>
                <div className="flex space-x-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('attending')}
                    className={`flex-1 py-2 px-2 rounded-full font-britannic text-[11px] tracking-wide transition-all ${
                      rsvpStatus === 'attending'
                        ? 'bg-[#e6c88b] text-[#3c0915] font-bold shadow-md'
                        : 'bg-[#350711]/85 border border-white/20 text-neutral-300'
                    }`}
                  >
                    Absolutely, wouldn&quot;t miss it!
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('not_attending')}
                    className={`flex-1 py-2 px-2 rounded-full font-britannic text-[11px] tracking-wide transition-all ${
                      rsvpStatus === 'not_attending'
                        ? 'bg-[#e6c88b] text-[#3c0915] font-bold shadow-md'
                        : 'bg-[#350711]/85 border border-white/20 text-neutral-300'
                    }`}
                  >
                    Sadly, cannot make it
                  </button>
                </div>
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Total Person</label>
                <select
                  value={rsvpGuestsCount}
                  onChange={(e) => setRsvpGuestsCount(Number(e.target.value))}
                  className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white font-britannic text-xs focus:outline-none focus:border-[#e6c88b]"
                >
                  <option value={1} className="bg-[#22050c]">1 orang</option>
                  <option value={2} className="bg-[#22050c]">2 orang</option>
                  <option value={3} className="bg-[#22050c]">3 orang</option>
                  <option value={4} className="bg-[#22050c]">4 orang</option>
                </select>
              </div>

              <div>
                <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Doa &amp; Ucapan</label>
                <textarea
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  rows={2}
                  placeholder="Tulis ucapan dan doa untuk kedua mempelai..."
                  className="w-full px-4 py-2 rounded-2xl bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] resize-none"
                />
              </div>

              {/* CONFIRM PRESENCE Button using authentic graphic */}
              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmittingRsvp}
                  className="relative w-56 hover:scale-105 active:scale-95 transition-transform"
                >
                  <img
                    src={LACE_ASSETS.confirmPresenceBtn}
                    alt="CONFIRM PRESENCE"
                    className="w-full h-auto object-contain filter drop-shadow-lg"
                  />
                </button>
              </div>
            </form>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 9: WEDDING GIFT (TWO HEART DOILIES WITH COPY BUTTONS)              */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <div className="lace-pattern-top" />

            <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-2">Wedding Gift</h2>

            <p className="font-britannic text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-sm mb-6 px-4">
              Your presence is the greatest gift of all. However, if you areunable to attend and would like to send us your wishes in the form of a gift, please use the account details below:
            </p>

            {/* Bank Card 1: Andreas Stefani */}
            <div className="relative w-64 sm:w-72 aspect-[3274/2743] filter drop-shadow-2xl mb-4">
              <img
                src={LACE_ASSETS.heartDoilyHal9}
                alt="Heart Lace Doily"
                className="w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3c0915] pt-2">
                <span className="font-britannic text-sm sm:text-base font-bold">BCA</span>
                <span className="font-britannic text-xs sm:text-sm">Andreas Stefani</span>
                <span className="font-britannic text-lg sm:text-xl font-bold tracking-wider my-0.5">7776510</span>
                <button
                  onClick={() => handleCopyText('7776510', 'Rekening BCA Andreas')}
                  className="px-4 py-0.5 mt-1 rounded-full bg-[#3c0915] text-[#fdfaf7] font-britannic text-[11px] font-bold uppercase tracking-wider hover:bg-[#5c182d] active:scale-95 transition"
                >
                  copy
                </button>
              </div>
            </div>

            {/* Bank Card 2: Daniel Sianipar */}
            <div className="relative w-64 sm:w-72 aspect-[3274/2743] filter drop-shadow-2xl mb-4">
              <img
                src={LACE_ASSETS.heartDoilyHal9}
                alt="Heart Lace Doily"
                className="w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3c0915] pt-2">
                <span className="font-britannic text-sm sm:text-base font-bold">BCA</span>
                <span className="font-britannic text-xs sm:text-sm">Daniel Sianipar</span>
                <span className="font-britannic text-lg sm:text-xl font-bold tracking-wider my-0.5">7775419</span>
                <button
                  onClick={() => handleCopyText('7775419', 'Rekening BCA Daniel')}
                  className="px-4 py-0.5 mt-1 rounded-full bg-[#3c0915] text-[#fdfaf7] font-britannic text-[11px] font-bold uppercase tracking-wider hover:bg-[#5c182d] active:scale-95 transition"
                >
                  copy
                </button>
              </div>
            </div>

            {/* Footnote */}
            <div className="text-[10px] text-neutral-300 font-britannic max-w-xs text-left space-y-0.5 mt-2 px-4">
              <p className="font-bold">*Note:</p>
              <p>Before making Transfer/Shipment, please note:</p>
              <p>- Bank Name, Recipient Name are already in accordance with the couple&apos;s names</p>
              <p>- Confirm the gift shipment via personal chat to the couple</p>
            </div>

            <div className="lace-pattern-bottom" />
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PAGE 10: GALLERY (5 GOLD ORNATE FRAMES) & WISHES WALL                  */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className="relative w-full flex flex-col items-center justify-start p-6 bg-cover bg-top text-center overflow-hidden py-16"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgTallGallery})` }}
          >
            <div className="lace-pattern-top" />

            <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-8">Our Moments</h2>

            {/* 5 Stacked Ornate Gold Frames */}
            <div className="w-full max-w-xs sm:max-w-sm space-y-6">
              {galleryItems.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setActivePhoto(item.src)}
                  className="relative w-full aspect-[2935/2515] filter drop-shadow-2xl cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                  {/* Prewedding Photo inside Frame (Placed neatly behind the ornate frame) */}
                  <div className="absolute top-[21%] bottom-[21%] left-[15%] right-[15%] overflow-hidden z-10 bg-neutral-900">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Ornate Gold Frame Border (On top of photo) */}
                  <img
                    src={LACE_ASSETS.goldRectFrameHal10}
                    alt="Gold Frame"
                    className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                  />
                </div>
              ))}
            </div>

            {/* Wishes & Prayers Wall */}
            <div className="w-full max-w-sm mt-12 text-left">
              <h3 className="font-abigail text-3xl sm:text-4xl text-white text-center mb-4">
                Doa &amp; Ucapan
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {wishesList.length > 0 ? (
                  wishesList.map((wish: any, idx: number) => (
                    <div
                      key={wish.id || idx}
                      className="p-4 rounded-2xl bg-[#350711]/90 border border-[#e6c88b]/40 backdrop-blur-sm shadow-md"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-britannic text-xs font-bold text-[#fdfaf7]">{wish.name}</span>
                        <span className="font-serif-custom text-[9px] text-[#e6c88b]">
                          {wish.created_at ? new Date(wish.created_at).toLocaleDateString('id-ID') : 'Hari ini'}
                        </span>
                      </div>
                      <p className="font-britannic text-xs text-neutral-200 leading-relaxed">
                        {wish.notes || wish.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center font-britannic text-xs text-neutral-300 italic">
                    Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                  </p>
                )}
              </div>
            </div>

            {/* Closing & Footer */}
            <div className="mt-14 mb-6 flex flex-col items-center text-center">
              <h3 className="font-abigail text-4xl sm:text-5xl text-white mb-1">Thank You</h3>
              <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest mb-4">
                Andrea &amp; Daniel
              </p>
              <div className="w-20 h-[1px] bg-[#e6c88b]/40 mb-3" />
              <p className="font-serif-custom text-[10px] text-[#e6c88b] tracking-wider uppercase">
                Sera Story - Digital Wedding Invitation
              </p>
            </div>

            <div className="lace-pattern-bottom" />
          </section>

        </div>
      )}

      {/* Lightbox Modal for Gallery */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full max-h-[85vh] aspect-square flex items-center justify-center">
            <img
              src={activePhoto}
              alt="Zoomed Photo"
              className="max-w-full max-h-full object-contain rounded-2xl border border-[#e6c88b]/50 shadow-2xl"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
