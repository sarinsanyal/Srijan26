"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ReactLenis } from "lenis/react";
import NotificationCard from "@/components/Notifications/NotificationCard";
import WavyGradient from "@/components/WavyGradient";
import Loading from "@/components/Loading";
import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { NOTIFICATIONS_DATA } from "@/components/Notifications/constants/notifications";

// Register ScrollTrigger so GSAP can use it
gsap.registerPlugin(ScrollTrigger);

export default function NotificationsPage() {
  const { status } = useSession();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [localNotes, setLocalNotes] = useState<any[]>([]);

  // Ref to scope GSAP animations specifically to this container
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate local notifications from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("local_notifications") || "[]");
    setLocalNotes(stored);
  }, []);

  // Combine local and static mock notifications
  const allNotifications = [...localNotes, ...NOTIFICATIONS_DATA];

  // GSAP Animation Logic
  useGSAP(
    () => {
      // 1. Header Animations (Timeline ensures they play in sequence)
      const headerTl = gsap.timeline({ delay: 0.1 });

      headerTl.from(".header-rule", {
        scaleX: 0,
        transformOrigin: "center",
        duration: 0.7,
        ease: "power4.out",
      });

      headerTl.from(
        ".header-title",
        {
          y: 80,
          opacity: 0,
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 1,
          ease: "expo.out",
        },
        "-=0.3" // Starts slightly before the previous animation finishes
      );

      headerTl.from(
        ".header-subtitle",
        {
          y: 24,
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      );

      headerTl.from(
        ".header-badge",
        {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(2.5)",
        },
        "-=0.3"
      );

      headerTl.from(
        ".section-divider",
        {
          scaleX: 0,
          transformOrigin: "left",
          duration: 0.9,
          ease: "power4.inOut",
        },
        "-=0.2"
      );

      // 2. Individual Notification Card Animations
      const cards = gsap.utils.toArray<HTMLElement>(".notification-anim");

      cards.forEach((card, i) => {
        const isEven = i % 2 === 0;

        // Slide in from alternating sides as they scroll into view
        gsap.fromTo(
          card,
          {
            x: isEven ? -70 : 70,
            y: 50,
            opacity: 0,
            scale: 0.8,
            filter: "blur(8px)",
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.7,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 55%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Add a subtle parallax scrolling effect based on index
        gsap.to(card, {
          yPercent: i % 3 === 0 ? -5 : i % 3 === 1 ? -3 : -7,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      });

      // 3. Container fade-in
      gsap.from(".notifications-list", {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".notifications-list",
          start: "top 92%",
          toggleActions: "play none none none",
        },
      });

      // 4. Scroll Progress Bar at the top of the page
      gsap.to(".scroll-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3, // Ties animation smoothly to scrollbar
        },
      });

      // 5. Empty State Animations (if no notifications exist)
      if (allNotifications.length === 0) {
        gsap.fromTo(
          ".empty-state-anim",
          { scale: 0.88, opacity: 0, filter: "blur(12px)" },
          {
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1,
            ease: "expo.out",
            delay: 0.6,
          }
        );

        // Floating loop for the icon
        gsap.to(".empty-icon", {
          y: -10,
          duration: 1.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    },
    { scope: containerRef, dependencies: [allNotifications.length, status] }
  );

  // --- Auth Guards ---
  if (status === "loading") return <Loading />;

  if (status === "unauthenticated") {
    return (
      <>
        {/* Background gradient for unauthenticated view */}
        <div className="fixed inset-0 -z-10">
          <WavyGradient
            color1="#bc6116"
            color2="#8f0c03"
            color3="#1A0000"
            direction={20}
            speed={1.5}
            waveHeight={0.45}
            noiseIntensity={5}
            waveAmplitude={1}
          />
        </div>
        <main className="full-bleed min-h-screen relative text-white">
          <Suspense fallback={<Loading />}>
            {/* Note: Consider redirecting to /login instead of rendering inline */}
            {authMode === "login" ? <LoginPage /> : <SignupPage />}
          </Suspense>
        </main>
      </>
    );
  }

  // --- Main Authenticated View ---
  return (
    <>
      {/* Persistent Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <WavyGradient
          color1="#bc6116"
          color2="#8f0c03"
          color3="#1A0000"
          direction={20}
          speed={1.5}
          waveHeight={0.45}
          noiseIntensity={5}
          waveAmplitude={1}
        />
      </div>

      <ReactLenis root>
        {/* Top Scroll Progress Bar */}
        <div
          className="scroll-progress fixed top-0 left-0 right-0 h-[2px] z-50 origin-left scale-x-0"
          style={{
            background: "linear-gradient(90deg, #EBD87D, #bc6116)",
            transformOrigin: "left center",
          }}
        />

        <main
          ref={containerRef}
          className="full-bleed min-h-screen relative text-white"
        >
          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 flex flex-col gap-10 sm:gap-12">

            {/* Header Section */}
            <header className="flex flex-col items-center text-center gap-3 sm:gap-4 px-3">
              <div
                className="header-rule w-16 h-[1px] mb-1"
                style={{
                  background: "linear-gradient(90deg, transparent, #EBD87D, transparent)",
                }}
              />

              <div className="overflow-hidden pb-1">
                <h1 className="header-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-elnath text-[#EBD87D] drop-shadow-lg leading-tight">
                  NOTIFICATIONS
                </h1>
              </div>

              <p className="header-subtitle text-base sm:text-lg md:text-xl text-white/70 font-euclid max-w-md sm:max-w-lg">
                Stay updated with the latest announcements from Srijan&nbsp;'26.
              </p>

              {/* Notification Counter Badge */}
              {allNotifications.length > 0 && (
                <span
                  className="header-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-euclid font-medium tracking-widest uppercase"
                  style={{
                    background: "rgba(235,216,125,0.10)",
                    border: "1px solid rgba(235,216,125,0.28)",
                    color: "#EBD87D",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EBD87D] animate-pulse" />
                  {allNotifications.length} update{allNotifications.length !== 1 ? "s" : ""}
                </span>
              )}

              <div
                className="section-divider w-full max-w-3xl h-[1px] mt-4"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(235,216,125,0.25), transparent)",
                }}
              />
            </header>

            {/* Notification Cards Container */}
            <div className="notifications-list flex flex-col gap-6 w-full min-h-[250px] sm:min-h-[300px]">
              {allNotifications.length > 0 ? (
                // Render List
                allNotifications.map((note) => (
                  <div key={note.id} className="notification-anim">
                    <NotificationCard
                      title={note.title}
                      message={note.description}
                      date={
                        note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString()
                          : "New Update"
                      }
                      isNew={note.isNew}
                      color={note.color}
                      registerLink={note.link}
                      moreInfoLink={note.slug ? `/events/${note.slug}` : undefined}
                    />
                  </div>
                ))
              ) : (
                // Render Empty State
                <div className="empty-state-anim flex flex-col items-center justify-center py-16 sm:py-24 gap-4 sm:gap-6 text-center border border-white/10 rounded-xl bg-white/5 backdrop-blur-md mx-3">
                  <div className="empty-icon w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 sm:h-8 w-6 sm:w-8 text-[#EBD87D]/80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2 sm:space-y-3 px-4">
                    <h3 className="text-lg sm:text-2xl font-futura text-[#EBD87D] tracking-wide uppercase">
                      All Caught Up
                    </h3>
                    <p className="text-white/50 font-euclid text-sm sm:text-base max-w-xs sm:max-w-sm mx-auto">
                      We don't have any new updates right now. Check back closer to the event!
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </ReactLenis>
    </>
  );
}
