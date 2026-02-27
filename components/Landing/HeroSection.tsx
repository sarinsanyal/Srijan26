"use client";

import { useRef } from "react";
import Image from "next/image";
import { Clickable } from "@/components/Clickable";
import { Countdown } from "@/components/Landing/Countdown";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { KalpanaSVG } from "./KalpanaSVG";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SplitTextMaskProps {
  text: string;
  className?: string;
  itemClass?: string;
}

const SplitTextMask = ({
  text,
  className = "",
  itemClass = "",
}: SplitTextMaskProps) => {
  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {text.split(" ").map((word, index) => (
        <span
          key={index}
          className="overflow-hidden inline-block pb-1 mr-[0.3em]"
        >
          <span className={`${itemClass} inline-block translate-y-[110%]`}>
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

export function HeroSection() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => {
          gsap.to(".hero-title-shimmer", {
            backgroundPosition: "200% center",
            duration: 2.5,
            ease: "none",
            repeat: -1,
          });

          gsap.to(".pulse-btn", {
            boxShadow: "0px 0px 30px 6px rgba(220, 38, 38, 0.5)",
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });

          gsap.to(".kalpana-svg", {
            y: -20,             // Float upwards by 20px
            x: 10,              // Slight horizontal drift
            rotation: 2,        // Tiny rotation for an organic "zero-g" feel
            duration: 3,        // Slow and smooth
            ease: "sine.inOut", // Sine ease is perfect for continuous bobbing
            yoyo: true,         // Reverses the animation (moves back down)
            repeat: -1,         // Loop infinitely
          });
        },
      });

      tl.fromTo(
        ".hero-logo",
        { opacity: 0, scale: 1.05, filter: "blur(8px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.4 },
      )
        .to(
          ".hero-subtitle-word",
          { y: "0%", duration: 1, stagger: 0.04, ease: "power4.out" },
          "-=0.8",
        )
        .to(
          ".hero-title-word",
          { y: "0%", duration: 1.2, ease: "expo.out" },
          "-=0.9",
        )
        .fromTo(
          ".hero-right-lines",
          { borderColor: "rgba(255, 255, 255, 0)" },
          { borderColor: "rgba(255, 255, 255, 0.8)", duration: 1 },
          "-=1",
        )
        .to(
          ".hero-right-word",
          { y: "0%", duration: 1, stagger: 0.03, ease: "power4.out" },
          "-=1",
        )
        .fromTo(
          ".hero-countdown",
          { opacity: 0, scale: 0.95, filter: "blur(4px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1 },
          "-=0.8",
        )
        .fromTo(
          ".pulse-btn-container",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.5)" },
          "-=0.6",
        )
        .fromTo(
          ".kalpana-svg path",
          {
            // Dynamically get the length of each unique path
            strokeDasharray: (index, target) => target.getTotalLength(),
            strokeDashoffset: (index, target) => target.getTotalLength(),
            fill: "rgba(255, 255, 255, 0)", // Hide the fill initially
            stroke: "rgba(255, 255, 255, 0.8)", // Show a white stroke
            strokeWidth: 1,
          },
          {
            strokeDashoffset: 0, // Draw the stroke to full length
            fill: "rgba(255, 255, 255, 1)", // Fade the solid fill in
            duration: 1.5,
            ease: "power2.inOut",
            stagger: {
              each: 0.02, // The delay between each path starting
              from: "start", // You can change this to "random", "center", or "edges"
            },
          },
          "-=1", // Adjust this to overlap properly with your other hero animations
        );
        

      // Wait a tick for the sibling <About /> component to be fully mounted in the DOM
      setTimeout(() => {
        const aboutSrijan = document.querySelector(".about-srijan-wrapper");
        if (aboutSrijan) {
          gsap.to(".hero-video-container", {
            yPercent: -100,
            ease: "none",
            scrollTrigger: {
              trigger: aboutSrijan,
              start: "top bottom", // Start moving when About Srijan hits the bottom of viewport
              end: "top top", // Finish moving when About Srijan top hits top of viewport
              scrub: true,
            },
          });
        }
      }, 0);

      const wavyCanvas = document.querySelector(".wavy-gradient-canvas");

      if (wavyCanvas) {
        gsap.fromTo(
          wavyCanvas,
          {
            opacity: 0.6,
          },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative full-bleed w-full h-[100dvh] pt-40 pb-12 lg:pt-60 lg:pb-16 px-4 sm:px-8 lg:px-6 xl:px-8 flex flex-col justify-center lg:flex-row lg:items-center lg:justify-between overflow-hidden"
    >
      <KalpanaSVG
        width={300}
        className="kalpana-svg absolute z-100 right-50 top-10 opacity-20"
      />
      {/* Background Video */}
      <div
        className="hero-video-container fixed inset-0 z-0 pointer-events-none h-[100dvh]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 85%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
        }}
      >
        <video
          src="/videos/landing/srijan_hero_compressed_1080p_crf32.webm"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
      </div>

      {/* Left section: Logo and Title */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10 w-full pt-20 lg:w-max lg:-mt-90 -mt-40">
        <Image
          src="/images/srijan-wide-icon.svg"
          alt="A wide layout logo for Srijan'26"
          height={200}
          width={460}
          className="hero-logo max-w-[85vw] lg:max-w-full lg:w-[500px] h-auto -ml-2 lg:ml-0"
          priority
        />

        <h2 className="py-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-1 font-light tracking-wide lg:ml-2 flex flex-col items-center lg:items-start">
          <SplitTextMask
            text="The Annual Techno-Management Fest of"
            itemClass="hero-subtitle-word"
          />

          <div className="overflow-hidden py-1 mt-1">
            <div className="hero-title-word translate-y-[110%] hero-title-shimmer font-elnath py-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-wider bg-gradient-to-r from-white via-white via-[45%] via-amber-200/80 via-[50%] to-white to-[55%] bg-clip-text text-transparent bg-[length:250%_auto] drop-shadow-[0_0_6px_rgba(253,230,138,0.4)]">
              Jadavpur University
            </div>
          </div>
        </h2>
      </div>

      <article className="grid py-2 relative z-10 w-full lg:w-max justify-items-center mt-8 lg:mt-56 lg:mr-10 xl:mr-16">
        <h3 className="hero-right-lines w-full py-1 border-t-[1.5px] border-b-[1.5px] border-transparent text-lg md:text-xl lg:text-2xl font-bold text-center tracking-wide overflow-hidden flex justify-center">
          <SplitTextMask text="Time Remaining" itemClass="hero-right-word" />
        </h3>

        <div className="hero-countdown py-2 opacity-0">
          <Countdown targetDate={new Date("2026-04-09T10:00:00").getTime()} />
        </div>

        <p className="text-lg md:text-xl lg:text-2xl font-elnath pb-2 text-center uppercase tracking-widest flex justify-center">
          <SplitTextMask
            text="9 - 12 April, 2026"
            itemClass="hero-right-word"
          />
        </p>

        <div className="pulse-btn-container mt-2 opacity-0">
          <Clickable
            as="a"
            href="/events"
            className="pulse-btn group relative overflow-hidden justify-self-center w-fit! h-[40px]! lg:h-[45px]! px-8! lg:px-10! uppercase bg-red hover:bg-red-500 hover:scale-105 active:scale-95 transition-all duration-300 ease-out font-bold tracking-widest text-base lg:text-lg"
          >
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            <span className="relative z-10">Find events!</span>
          </Clickable>
        </div>
      </article>
    </section>
  );
}
