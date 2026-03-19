"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageCarouselAnimatedProps = {
    images: string[];
    alt: string;
};

export default function ImageCarouselAnimated({ images, alt }: ImageCarouselAnimatedProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    if (!isMounted || images.length === 0) return null;

    const imgObjects = images.map((src, i) => ({ id: `img-${i}-${src}`, src }));

    const sideCount = Math.min(4, Math.floor((imgObjects.length - 1) / 2));

    const leftImages = [];
    for (let i = sideCount; i > 0; i--) {
        leftImages.push(imgObjects[((currentIndex - i) % imgObjects.length + imgObjects.length) % imgObjects.length]);
    }

    const activeImage = imgObjects[currentIndex];

    const rightImages = [];
    for (let i = 1; i <= sideCount; i++) {
        rightImages.push(imgObjects[(currentIndex + i) % imgObjects.length]);
    }

    return (
        <div className="relative w-full flex flex-col items-center overflow-hidden py-8 bg-neutral-900 rounded-xl">
            <div className="flex w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] items-center justify-center relative">

                {/* Left side images */}
                <div className="flex-1 flex justify-end items-center gap-4 pr-4 h-full">
                    <AnimatePresence mode="popLayout">
                        {leftImages.map((img) => (
                            <motion.img
                                key={img.id}
                                layoutId={img.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.4, scale: 0.85 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                                src={img.src}
                                alt={alt}
                                className="h-[70%] w-auto object-contain rounded-2xl shrink-0 cursor-pointer shadow-lg"
                                onClick={() => setCurrentIndex(imgObjects.findIndex((i) => i.id === img.id))}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Center active image */}
                <div className="shrink-0 z-10 h-full flex items-center">
                    <AnimatePresence mode="popLayout">
                        <motion.img
                            key={activeImage.id}
                            layoutId={activeImage.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                            src={activeImage.src}
                            alt={`${alt} - active`}
                            className="h-full max-w-[70vw] md:max-w-[60vw] w-auto object-contain rounded-2xl shadow-2xl ring-4 ring-white/10"
                        />
                    </AnimatePresence>
                </div>

                {/* Right side images */}
                <div className="flex-1 flex justify-start items-center gap-4 pl-4 h-full">
                    <AnimatePresence mode="popLayout">
                        {rightImages.map((img) => (
                            <motion.img
                                key={img.id}
                                layoutId={img.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.4, scale: 0.85 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                                src={img.src}
                                alt={alt}
                                className="h-[70%] w-auto object-contain rounded-2xl shrink-0 cursor-pointer shadow-lg"
                                onClick={() => setCurrentIndex(imgObjects.findIndex((i) => i.id === img.id))}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Prev/Next controls */}
            <div className="flex gap-6 mt-8">
                <button
                    onClick={prev}
                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-white border border-white/20"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={next}
                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-white border border-white/20"
                    aria-label="Next image"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
