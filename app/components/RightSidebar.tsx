'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
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

// Ambient Floating Sparkles for Luxury Fairytale Feel
const AmbientSparkles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
    {[...Array(14)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full bg-[#fdfaf7] shadow-[0_0_8px_#e6c88b]"
        style={{
          left: `${(i * 17 + 8) % 94}%`,
          top: `${(i * 23 + 12) % 88}%`,
        }}
        animate={{
          y: [-8, -35, -8],
          opacity: [0.15, 0.85, 0.15],
          scale: [0.7, 1.35, 0.7],
        }}
        transition={{
          duration: 3.5 + (i % 3) * 1.5,
          repeat: Infinity,
          delay: i * 0.3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Lightbox Modal State
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Reset scroll to top when invitation opens
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Target Wedding Date (26 Juni 2026 / Project Target)
  useEffect(() => {
    const targetDate = new Date('2026-06-26T09:00:00+07:00').getTime();

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

  // Open Invitation Handler with Realistic Letter Pull-out Animation
  const handleOpenInvitation = () => {
    if (isOpeningFlap) return;
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
        particleCount: 65,
        spread: 70,
        origin: { y: 0.62 },
        colors: ['#e6c88b', '#ffffff', '#b87d89', '#f5e4bc'],
      });
    } catch {}

    // Allow 1.1s for the heart doily to completely glide upwards out of the envelope
    setTimeout(() => {
      setIsOpen(true);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 1150);
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

  // Copy to Clipboard with Visual Badge Feedback
  const handleCopyText = (text: string, label: string, keyId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setToastMessage(`${label} berhasil disalin!`);
      setTimeout(() => {
        setCopiedKey(null);
        setToastMessage(null);
      }, 2500);
    }
  };

  // Submit RSVP & Wishes
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) {
      setToastMessage('Mohon isi nama Anda');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsSubmittingRsvp(true);
    try {
      if (project?.id) {
        await supabase.from('rsvps').insert([
          {
            project_id: project.id,
            guest_id: guest?.id || null,
            name: rsvpName,
            phone: rsvpPhone || null,
            email: rsvpEmail || null,
            status: rsvpStatus,
            guests_count: rsvpGuestsCount,
            notes: rsvpMessage || null,
          },
        ]);
      }

      setRsvpSuccess(true);
      setToastMessage('Terima kasih atas konfirmasi kehadiran Anda!');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

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
    <div
      ref={scrollContainerRef}
      className="relative w-full md:w-[42%] lg:w-[38%] h-[100dvh] overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth no-scrollbar scrollbar-hide snap-container-y bg-[#22050c] text-white select-none"
    >
      {/* Background Audio Element */}
      <audio ref={audioRef} src="/audio/bgm.mp3" loop preload="auto" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-5 left-1/2 z-50 bg-[#350711]/95 text-[#fdfaf7] px-6 py-2.5 rounded-full border border-[#e6c88b]/70 shadow-2xl backdrop-blur-md font-britannic text-xs sm:text-sm tracking-wide"
          >
            ✨ {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Play / Pause Button with Vinyl Groove Effect */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center justify-center">
          {isPlayingMusic && (
            <div className="absolute inset-0 rounded-full bg-[#e6c88b]/30 animate-ping-slow pointer-events-none" />
          )}
          <motion.button
            onClick={toggleMusic}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Toggle background audio"
            className="relative w-12 h-12 rounded-full bg-[#350711]/95 border-2 border-[#e6c88b] text-[#e6c88b] flex items-center justify-center shadow-2xl backdrop-blur-md cursor-pointer"
          >
            {isPlayingMusic ? (
              <svg className="w-5 h-5 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </motion.button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COVER SCREEN: 01 LACE - BURGUNDY - COVER CLICK TO OPEN                   */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.section
            key="cover-screen"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              y: 70,
              scale: 0.98,
              transition: { duration: 0.5, ease: 'easeInOut' },
            }}
            className="relative min-h-[100dvh] h-[100dvh] w-full flex flex-col items-center justify-between py-10 px-6 bg-cover bg-center text-center overflow-hidden snap-start shrink-0 snap-item-start"
            style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
          >
            <AmbientSparkles />

            {/* Top Lace Pattern Strip */}
            <div className="lace-pattern-top" />

            {/* Top Spacing */}
            <div className="pt-2" />

            {/* Interactive Envelope with Doily & Wax Seal */}
            <div className="relative w-full max-w-[320px] flex flex-col items-center">
              {/* Heart Lace Doily: initially hidden inside the envelope, smoothly emerges and is pulled upwards on click */}
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={
                  isOpeningFlap
                    ? {
                        opacity: [0, 0.4, 1],
                        y: [-10, -210],
                        scale: [0.85, 1.05, 1.15],
                        rotate: [0, -1.5],
                        filter: 'drop-shadow(0 25px 30px rgba(0,0,0,0.5))',
                      }
                    : {
                        opacity: 0,
                        y: 50,
                        scale: 0.8,
                        rotate: 0,
                      }
                }
                transition={{
                  duration: 1.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute top-0 z-10 w-[240px] h-[220px] pointer-events-none"
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
              </motion.div>

              {/* Cream Envelope with Wax Seal & Flower */}
              <motion.div
                className="relative z-20 w-full filter drop-shadow-2xl cursor-pointer"
                onClick={handleOpenInvitation}
                animate={isOpeningFlap ? { y: 25, scale: 0.98 } : { y: 0, scale: 1 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={LACE_ASSETS.coverEnvelope}
                  alt="Cover Envelope"
                  className="w-full h-auto object-contain"
                />
                {/* "Click to open" script on envelope flap */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="font-abigail text-2xl sm:text-3xl text-[#3c0915] tracking-wide animate-pulse">
                    Click to open
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Guest Identity & Action Trigger */}
            <motion.div
              className="relative z-30 flex flex-col items-center max-w-xs w-full pb-4"
              animate={isOpeningFlap ? { opacity: 0, y: 25 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="font-britannic text-xs text-neutral-200 tracking-wider uppercase mb-1">
                Kepada Yth. Bapak/Ibu/Saudara/i:
              </p>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="px-6 py-2 rounded-full bg-[#350711]/85 border border-[#e6c88b]/60 shadow-lg backdrop-blur-sm mb-4"
              >
                <h2 className="font-abigail text-2xl sm:text-3xl text-[#fdfaf7] leading-none">
                  {guestName}
                </h2>
              </motion.div>

              <motion.button
                onClick={handleOpenInvitation}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#e6c88b] via-[#f5e4bc] to-[#e6c88b] text-[#3c0915] font-britannic font-bold text-xs uppercase tracking-[0.25em] shadow-xl animate-shimmer-sweep cursor-pointer"
              >
                Buka Undangan
              </motion.button>
            </motion.div>

            {/* Bottom Lace Pattern Strip */}
            <div className="lace-pattern-bottom" />
          </motion.section>
        ) : (
          /* ========================================================================= */
          /* INVITATION CONTENT: ALL 10 PAGES IDENTICAL TO 01 LACE - BURGUNDY.PDF      */
          /* ========================================================================= */
          <motion.div
            key="invitation-content"
            initial={{ y: '-100vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative w-full flex flex-col"
          >
            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 1: SAVE THE DATE (HERO COMPOSITION)                               */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              {/* Silver Oval Serving Platter / Tray */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[340px] aspect-[3378/4937] flex items-center justify-center filter drop-shadow-2xl"
              >
                <img
                  src={LACE_ASSETS.silverTrayHal1}
                  alt="Silver Platter"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Angled Mountain Envelope (Upper Center/Left) - Extends outside platter rim */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.85, delay: 0.15 }}
                  className="absolute top-[0%] left-[-9%] w-[70%] z-10 rotate-[11deg] filter drop-shadow-xl"
                >
                  <img
                    src={LACE_ASSETS.mountainCardHal1}
                    alt="Save The Date Watercolor"
                    className="w-full h-auto object-contain"
                  />
                </motion.div>

                {/* Heart Silver Locket (Upper Right) with Couple Photos - Overlaps doily and sticks out right rim */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  whileInView={{ opacity: 1, scale: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.85, delay: 0.3 }}
                  className="absolute top-[19%] right-[-7.5%] w-[62%] z-25 filter drop-shadow-xl"
                >
                  <div className="relative w-full aspect-[3384/2028]">
                    <img
                      src={LACE_ASSETS.heartLocketHal1}
                      alt="Silver Locket"
                      className="w-full h-full object-contain relative z-20 pointer-events-none"
                    />
                    {/* Photo container masked to the exact inner heart contours */}
                    <div
                      className="absolute inset-0 z-10 overflow-hidden"
                      style={{
                        WebkitMaskImage: `url(${LACE_ASSETS.locketMask})`,
                        maskImage: `url(${LACE_ASSETS.locketMask})`,
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                      }}
                    >
                      <div className="absolute left-0 top-0 w-[50%] h-full">
                        <img src={locketLeftImg} alt="Couple Left" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute left-[50%] top-0 w-[50%] h-full">
                        <img src={locketRightImg} alt="Couple Right" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Heart Lace Mesh Doily (Center) with Andrea & Daniel */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.45 }}
                  className="absolute top-[27.5%] left-[9.5%] w-[81%] z-15 filter drop-shadow-md"
                >
                  <div className="relative w-full">
                    <img
                      src={LACE_ASSETS.heartMeshHal1}
                      alt="Heart Doily"
                      className="w-full h-auto object-contain"
                    />
                    {/* Couple Names - Flowing Cursive Script matching original mockup */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#7a1828] pointer-events-none pt-4 sm:pt-6">
                      <h1 className="font-artisan text-4xl sm:text-5xl text-[#7a1828] leading-tight font-normal tracking-wide">Andrea</h1>
                      <span className="font-artisan text-2xl sm:text-3xl text-[#7a1828] leading-none my-0.5">&amp;</span>
                      <h1 className="font-artisan text-4xl sm:text-5xl text-[#7a1828] leading-tight font-normal tracking-wide">Daniel</h1>
                    </div>
                  </div>
                </motion.div>

                {/* Three White Roses Bouquet (Bottom Left) */}
                <motion.div
                  initial={{ opacity: 0, y: 25, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.55 }}
                  className="absolute top-[72%] left-[4.8%] w-[54%] z-30 filter drop-shadow-xl"
                >
                  <img
                    src={LACE_ASSETS.whiteRosesHal1}
                    alt="White Roses Bouquet"
                    className="w-full h-auto object-contain"
                  />
                </motion.div>
              </motion.div>

              {/* Interactive Scroll Down Prompt */}
              <motion.button
                type="button"
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollBy({ top: scrollContainerRef.current.clientHeight, behavior: 'smooth' });
                  }
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-4 flex flex-col items-center cursor-pointer group select-none"
              >
                <span className="font-britannic text-[11px] tracking-widest uppercase text-neutral-300 group-hover:text-[#e6c88b] transition-colors">Scroll Down</span>
                <svg className="w-4 h-4 text-neutral-300 group-hover:text-[#e6c88b] transition-colors mt-1 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.button>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 2: SCRIPTURE QUOTE (BIBLE VERSE)                                  */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              {/* White Decorative Lace Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[340px] aspect-[3536/4514] flex items-center justify-center filter drop-shadow-2xl"
              >
                <img
                  src={LACE_ASSETS.laceFrameHal2}
                  alt="Lace Border Card"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Holy Matrimony Scripture Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-[#3c0915] text-center">
                  <h3 className="font-abigail text-3xl sm:text-4xl leading-tight mb-4">
                    Holy Matrimony
                  </h3>
                  <p className="font-britannic text-xs sm:text-[13px] leading-relaxed italic text-[#5c182d]">
                    &ldquo;Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.&rdquo;
                  </p>
                  <p className="font-britannic text-xs font-bold uppercase tracking-widest mt-4 text-[#3c0915]">
                    Matius 19:6
                  </p>
                </div>
              </motion.div>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 3: THE COUPLE (ANDREA & DANIEL)                                    */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center py-12 px-6 bg-cover bg-center overflow-hidden space-y-8 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              {/* Andrea (Bride) Row */}
              <motion.div
                initial={{ opacity: 0, x: -45 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm flex items-center justify-start space-x-4"
              >
                <div className="relative w-36 sm:w-40 aspect-[2173/2767] shrink-0 filter drop-shadow-xl group">
                  <img
                    src={LACE_ASSETS.baroqueGoldFrameHal3}
                    alt="Gold Frame"
                    className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                  />
                  <div className="absolute inset-[15%] rounded-full overflow-hidden z-10 bg-neutral-900">
                    <img
                      src={brideImg}
                      alt="Andrea"
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500"
                    />
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
              </motion.div>

              {/* Daniel (Groom) Row */}
              <motion.div
                initial={{ opacity: 0, x: 45 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm flex items-center justify-end space-x-4"
              >
                <div className="flex flex-col text-right">
                  <h2 className="font-abigail text-4xl sm:text-5xl text-white leading-tight">Daniel</h2>
                  <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest mt-1">
                    Putra dari Bapak Simon
                  </p>
                  <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest">
                    &amp; Ibu Silvia
                  </p>
                </div>
                <div className="relative w-36 sm:w-40 aspect-[2173/2767] shrink-0 filter drop-shadow-xl group">
                  <img
                    src={LACE_ASSETS.baroqueGoldFrameHal3}
                    alt="Gold Frame"
                    className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                  />
                  <div className="absolute inset-[15%] rounded-full overflow-hidden z-10 bg-neutral-900">
                    <img
                      src={groomImg}
                      alt="Daniel"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 4: OUR STORY                                                      */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              {/* Rose-Embossed Gold Frame with Veil Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-44 sm:w-48 aspect-[3124/3669] filter drop-shadow-2xl mb-4"
              >
                <img
                  src={LACE_ASSETS.floralGoldFrameHal4}
                  alt="Floral Gold Frame"
                  className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                />
                <div className="absolute inset-[15%] rounded-full overflow-hidden z-10">
                  <img src={storyImg} alt="Our Story" className="w-full h-full object-cover" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <h2 className="font-abigail text-4xl sm:text-5xl text-white mb-2">Our Story</h2>
                <p className="font-britannic text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-sm px-4">
                  Setiap detik yang terlewati adalah anugerah. Dari awal perjumpaan sederhana hingga janji suci yang kami ikat bersama dalam cinta dan kasih yang abadi.
                </p>
              </motion.div>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 5: MAKE OUR DAY SPECIAL & COUNTDOWN & RSVP                         */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              {/* Double Heart Silver Locket */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative w-52 sm:w-60 aspect-[3384/2028] filter drop-shadow-xl mb-3 animate-float-gentle"
              >
                <img
                  src={LACE_ASSETS.silverLocketHal5}
                  alt="Silver Locket"
                  className="w-full h-full object-contain relative z-20 pointer-events-none"
                />
                <div
                  className="absolute inset-0 z-10 overflow-hidden"
                  style={{
                    WebkitMaskImage: `url(${LACE_ASSETS.locketMask})`,
                    maskImage: `url(${LACE_ASSETS.locketMask})`,
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                  }}
                >
                  <div className="absolute left-0 top-0 w-[50%] h-full">
                    <img src={locketLeftImg} alt="Couple Left" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute left-[50%] top-0 w-[50%] h-full">
                    <img src={locketRightImg} alt="Couple Right" className="w-full h-full object-cover" />
                  </div>
                </div>
              </motion.div>

              <h3 className="font-serif-custom text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-200">
                MAKE OUR DAY SPECIAL
              </h3>
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="font-britannic text-4xl sm:text-5xl text-white font-bold my-1"
              >
                26.06.26
              </motion.h2>

              {/* Countdown Clock */}
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 my-3">
                {[
                  { label: 'Hari', val: timeLeft.days },
                  { label: 'Jam', val: timeLeft.hours },
                  { label: 'Menit', val: timeLeft.minutes },
                  { label: 'Detik', val: timeLeft.seconds },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.08 }}
                    className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-[#350711]/90 border border-[#e6c88b]/40 min-w-[54px] shadow-lg"
                  >
                    <span className="font-britannic text-base sm:text-lg font-bold text-[#fdfaf7]">{item.val}</span>
                    <span className="font-serif-custom text-[9px] uppercase tracking-wider text-[#e6c88b]">{item.label}</span>
                  </motion.div>
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
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Whatsapp/ No. Hp</label>
                  <input
                    type="tel"
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
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
                      Hadir
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
                      Tidak Hadir
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Jumlah Tamu</label>
                  <select
                    value={rsvpGuestsCount}
                    onChange={(e) => setRsvpGuestsCount(Number(e.target.value))}
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
                  >
                    <option value={1} className="bg-[#22050c]">1 orang</option>
                    <option value={2} className="bg-[#22050c]">2 orang</option>
                    <option value={3} className="bg-[#22050c]">3 orang</option>
                    <option value={4} className="bg-[#22050c]">4 orang</option>
                  </select>
                </div>

                {/* RSVP NOW Button using authentic graphic */}
                <div className="pt-2 flex justify-center">
                  <motion.button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-52 cursor-pointer"
                  >
                    <img
                      src={LACE_ASSETS.rsvpNowBtn}
                      alt="RSVP NOW"
                      className="w-full h-auto object-contain filter drop-shadow-lg"
                    />
                  </motion.button>
                </div>
              </form>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 6: THE DETAIL (AKAD & RESEPSI SCHEDULE)                           */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-abigail text-4xl sm:text-5xl text-white mb-4"
              >
                The Detail
              </motion.h2>

              {/* Silver Oval Mirror with White Satin Lace Bows */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[340px] aspect-[3378/4937] flex items-center justify-center filter drop-shadow-2xl"
              >
                <img
                  src={LACE_ASSETS.silverTrayHal6}
                  alt="Silver Mirror"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Top-Left Ribbon Bow */}
                <motion.div
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                  className="absolute -top-[2%] -left-[4%] w-24 sm:w-28 z-30 filter drop-shadow-lg"
                >
                  <img src={LACE_ASSETS.whiteBowHal6A} alt="Bow" className="w-full h-auto object-contain" />
                </motion.div>

                {/* Bottom-Right Ribbon Bow */}
                <motion.div
                  animate={{ rotate: [2, -2, 2] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                  className="absolute -bottom-[2%] -right-[4%] w-24 sm:w-28 z-30 filter drop-shadow-lg"
                >
                  <img src={LACE_ASSETS.whiteBowHal6B} alt="Bow" className="w-full h-auto object-contain" />
                </motion.div>

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
                  <motion.a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="mt-5 px-6 py-1.5 rounded-full bg-[#fdfaf7] border border-[#3c0915]/50 text-[#3c0915] font-britannic text-xs font-bold tracking-widest shadow-md hover:bg-[#3c0915] hover:text-white transition-all uppercase"
                  >
                    GOOGLE MAPS
                  </motion.a>
                </div>
              </motion.div>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 7: DRESS CODE                                                     */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-abigail text-4xl sm:text-5xl text-white mb-6"
              >
                Dress Code
              </motion.h2>

              {/* Groom & Bride Line Art Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85 }}
                className="relative w-48 sm:w-56 aspect-[2287/3130] filter drop-shadow-xl mb-6 animate-float-gentle"
              >
                <img
                  src={LACE_ASSETS.dressCodeLineArtHal7}
                  alt="Dress Code Illustration"
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Three Color Swatches */}
              <div className="flex items-center justify-center space-x-4 mb-3">
                {['#c9919d', '#8a6771', '#c79f94'].map((color, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
                    whileHover={{ scale: 1.15 }}
                    className="w-10 h-10 rounded-full shadow-lg border-2 border-white/50"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="font-serif-custom text-base text-white tracking-widest uppercase"
              >
                Nude Formal
              </motion.p>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 8: ATTENDANCE CONFIRMATION & BLESSINGS FORM                        */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-abigail text-4xl sm:text-5xl text-white mb-3"
              >
                Attendance
              </motion.h2>

              {/* Cream Floral Envelope Graphic with Couple Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85 }}
                className="relative w-52 sm:w-60 aspect-[2496/2623] filter drop-shadow-2xl mb-4"
              >
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
              </motion.div>

              {/* Attendance Form */}
              <form onSubmit={handleRsvpSubmit} className="w-full max-w-xs space-y-2.5 text-left">
                <div>
                  <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Guest Identity</label>
                  <input
                    type="text"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Guest Name"
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Email Address</label>
                  <input
                    type="email"
                    value={rsvpEmail}
                    onChange={(e) => setRsvpEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Whatsapp Number</label>
                  <input
                    type="tel"
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
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
                      Hadir
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
                      Tidak Hadir
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-britannic text-[11px] uppercase text-neutral-300 ml-3">Total Person</label>
                  <select
                    value={rsvpGuestsCount}
                    onChange={(e) => setRsvpGuestsCount(Number(e.target.value))}
                    className="w-full h-10 px-4 rounded-full bg-[#350711]/85 border border-[#ffffff]/30 text-white font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors"
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
                    className="w-full px-4 py-2 rounded-2xl bg-[#350711]/85 border border-[#ffffff]/30 text-white placeholder-neutral-400 font-britannic text-xs focus:outline-none focus:border-[#e6c88b] transition-colors resize-none"
                  />
                </div>

                {/* CONFIRM PRESENCE Button using authentic graphic */}
                <div className="pt-2 flex justify-center">
                  <motion.button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-56 cursor-pointer"
                  >
                    <img
                      src={LACE_ASSETS.confirmPresenceBtn}
                      alt="CONFIRM PRESENCE"
                      className="w-full h-auto object-contain filter drop-shadow-lg"
                    />
                  </motion.button>
                </div>
              </form>

              <div className="lace-pattern-bottom" />
            </section>

            {/* ----------------------------------------------------------------------- */}
            {/* PAGE 9: WEDDING GIFT (TWO HEART DOILIES WITH COPY BUTTONS)              */}
            {/* ----------------------------------------------------------------------- */}
            <section
              className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-cover bg-center text-center overflow-hidden py-12 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgStandard})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-abigail text-4xl sm:text-5xl text-white mb-2"
              >
                Wedding Gift
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="font-britannic text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-sm mb-6 px-4"
              >
                Your presence is the greatest gift of all. However, if you are unable to attend and would like to send us your wishes in the form of a gift, please use the account details below:
              </motion.p>

              {/* Bank Card 1: Andreas Stefani */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative w-64 sm:w-72 aspect-[3274/2743] filter drop-shadow-2xl mb-4"
              >
                <img
                  src={LACE_ASSETS.heartDoilyHal9}
                  alt="Heart Lace Doily"
                  className="w-full h-full object-contain pointer-events-none"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3c0915] pt-2">
                  <span className="font-britannic text-sm sm:text-base font-bold">BCA</span>
                  <span className="font-britannic text-xs sm:text-sm">Andreas Stefani</span>
                  <span className="font-britannic text-lg sm:text-xl font-bold tracking-wider my-0.5">7776510</span>
                  <motion.button
                    onClick={() => handleCopyText('7776510', 'Rekening BCA Andreas', 'bca-andreas')}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="px-4 py-0.5 mt-1 rounded-full bg-[#3c0915] text-[#fdfaf7] font-britannic text-[11px] font-bold uppercase tracking-wider hover:bg-[#5c182d] transition cursor-pointer"
                  >
                    {copiedKey === 'bca-andreas' ? 'Tersalin! ✓' : 'Copy'}
                  </motion.button>
                </div>
              </motion.div>

              {/* Bank Card 2: Daniel Sianipar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative w-64 sm:w-72 aspect-[3274/2743] filter drop-shadow-2xl mb-4"
              >
                <img
                  src={LACE_ASSETS.heartDoilyHal9}
                  alt="Heart Lace Doily"
                  className="w-full h-full object-contain pointer-events-none"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3c0915] pt-2">
                  <span className="font-britannic text-sm sm:text-base font-bold">BCA</span>
                  <span className="font-britannic text-xs sm:text-sm">Daniel Sianipar</span>
                  <span className="font-britannic text-lg sm:text-xl font-bold tracking-wider my-0.5">7775419</span>
                  <motion.button
                    onClick={() => handleCopyText('7775419', 'Rekening BCA Daniel', 'bca-daniel')}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="px-4 py-0.5 mt-1 rounded-full bg-[#3c0915] text-[#fdfaf7] font-britannic text-[11px] font-bold uppercase tracking-wider hover:bg-[#5c182d] transition cursor-pointer"
                  >
                    {copiedKey === 'bca-daniel' ? 'Tersalin! ✓' : 'Copy'}
                  </motion.button>
                </div>
              </motion.div>

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
              className="relative min-h-[100dvh] w-full flex flex-col items-center justify-start p-6 bg-cover bg-top text-center overflow-hidden py-16 snap-start snap-always shrink-0 snap-item-start"
              style={{ backgroundImage: `url(${LACE_ASSETS.bgTallGallery})` }}
            >
              <AmbientSparkles />
              <div className="lace-pattern-top" />

              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-abigail text-4xl sm:text-5xl text-white mb-8"
              >
                Our Moments
              </motion.h2>

              {/* 5 Stacked Ornate Gold Frames */}
              <div className="w-full max-w-xs sm:max-w-sm space-y-6">
                {galleryItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActivePhoto(item.src)}
                    className="relative w-full aspect-[2935/2515] filter drop-shadow-2xl cursor-pointer group"
                  >
                    {/* Prewedding Photo inside Frame */}
                    <div className="absolute top-[21%] bottom-[21%] left-[15%] right-[15%] overflow-hidden z-10 bg-neutral-900">
                      <img
                        src={item.src}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                    </div>

                    {/* Ornate Gold Frame Border (On top of photo) */}
                    <img
                      src={LACE_ASSETS.goldRectFrameHal10}
                      alt="Gold Frame"
                      className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Wishes & Prayers Wall */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm mt-12 text-left"
              >
                <h3 className="font-abigail text-3xl sm:text-4xl text-white text-center mb-4">
                  Doa &amp; Ucapan
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {wishesList.length > 0 ? (
                    wishesList.map((wish: any, idx: number) => (
                      <motion.div
                        key={wish.id || idx}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
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
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center font-britannic text-xs text-neutral-300 italic">
                      Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Closing & Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-14 mb-6 flex flex-col items-center text-center"
              >
                <h3 className="font-abigail text-4xl sm:text-5xl text-white mb-1">Thank You</h3>
                <p className="font-britannic text-xs text-neutral-200 uppercase tracking-widest mb-4">
                  Andrea &amp; Daniel
                </p>
                <div className="w-20 h-[1px] bg-[#e6c88b]/40 mb-3" />
                <p className="font-serif-custom text-[10px] text-[#e6c88b] tracking-wider uppercase">
                  Sera Story - Digital Wedding Invitation
                </p>
              </motion.div>

              <div className="lace-pattern-bottom" />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Gallery with Smooth Framer-Motion Backdrop */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-lg w-full max-h-[85vh] aspect-square flex items-center justify-center"
            >
              <img
                src={activePhoto}
                alt="Zoomed Photo"
                className="max-w-full max-h-full object-contain rounded-2xl border border-[#e6c88b]/50 shadow-2xl"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center font-bold text-lg hover:bg-black/90 transition cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
