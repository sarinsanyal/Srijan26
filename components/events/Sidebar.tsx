"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { Category } from "@/components/events/types/events";
import { CLIP_PATH } from "./constants/events";
import CustomScrollArea from "./CustomScrollArea";
import { useLenis } from "lenis/react";

interface SidebarProps {
  categories: Category[];
  activeCategory: Category;
  setActiveCategory: (category: Category) => void;
  statuses: string[];
  activeStatus: string;
  setActiveStatus: (status: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  statuses,
  activeStatus,
  setActiveStatus,
}) => {
  const lenis = useLenis();
  // Independent states for each dropdown
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isStatusOpen, setIsStatusOpen] = useState(true);

  // Refs for GSAP animations
  const statusRef = useRef<HTMLDivElement>(null);

  // Animate Categories Dropdown
  useEffect(() => {
    const el = ".categoriesClass";
    if (!el) return;

    if (isCategoriesOpen) {
      gsap.to(el, {
        height: "auto",
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  }, [isCategoriesOpen]);

  // Animate Status Dropdown
  useEffect(() => {
    const el = statusRef.current;
    if (!el) return;

    if (isStatusOpen) {
      gsap.to(el, {
        height: "auto",
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  }, [isStatusOpen]);

  return (
    <aside
      className="hidden lg:block w-75 shrink-0 sticky top-24 self-start h-[calc(100vh-12rem)] overflow-hidden"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="space-y-4 h-full overflow-y-auto overscroll-y-contain pr-2">
        {/* Categories Section */}
        <div>
          <button
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className="cursor-pointer w-full font-elnath text-lg mb-2 pb-2 flex items-center justify-between text-yellow-200 border-b border-white/20 hover:text-yellow-100 transition-colors"
          >
            <span>Categories</span>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${
                isCategoriesOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <CustomScrollArea className="categoriesClass relative overflow-y-auto max-h-[30vh] mask-[linear-gradient(to_bottom,black_calc(100%-40px),transparent_100%)]">
            <div className="flex flex-col gap-1 pt-2 pb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    lenis?.scrollTo("top", {
                      immediate: true,
                      lock: true,
                    });
                  }}
                  style={{ clipPath: CLIP_PATH }}
                  className={`cursor-pointer font-euclid text-left pl-10 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                    activeCategory === cat
                      ? "bg-red-500 text-white font-medium"
                      : "text-white hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </CustomScrollArea>
        </div>

        {/* Status Section */}
        <div>
          <button
            onClick={() => {
              setIsStatusOpen(!isStatusOpen);
            }}
            className="cursor-pointer w-full font-elnath text-lg mb-2 pb-2 flex items-center justify-between text-yellow-200 border-b border-white/20 hover:text-yellow-100 transition-colors"
          >
            <span>Status</span>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${
                isStatusOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div ref={statusRef} className="pr-3 overflow-hidden">
            <div className="flex flex-col gap-1 pt-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatus(status);
                    lenis?.scrollTo("top", {
                      immediate: true,
                      lock: true,
                    });
                  }}
                  style={{ clipPath: CLIP_PATH }}
                  className={`cursor-pointer font-euclid text-left pl-10 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                    activeStatus === status
                      ? "bg-red-500 text-white font-medium"
                      : "text-white hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
