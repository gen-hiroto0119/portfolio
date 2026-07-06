"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion } from "motion/react";

import "./decrypted-text.css";

type RevealDirection = "start" | "end" | "center";
type AnimateOn = "view" | "hover" | "inViewHover" | "click";
type ClickMode = "once" | "toggle";
type Direction = "forward" | "reverse";

export type DecryptedTextProps = {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: RevealDirection;
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: AnimateOn;
  clickMode?: ClickMode;
  viewDelay?: number;
};

const WRAPPER_STYLE = {
  display: "inline-block",
  whiteSpace: "pre-wrap" as const,
};

const SR_ONLY_STYLE = {
  position: "absolute" as const,
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden" as const,
  clip: "rect(0,0,0,0)",
  border: 0,
};

function subscribeReducedMotion(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotion(): boolean {
  return false;
}

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  clickMode = "once",
  viewDelay = 0,
}: DecryptedTextProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [isDecrypted, setIsDecrypted] = useState(animateOn !== "click");
  const [direction, setDirection] = useState<Direction>("forward");

  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);
  const viewDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderRef = useRef<number[]>([]);
  const pointerRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");
  }, [useOriginalCharsOnly, text, characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      return originalText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          if (currentRevealed.has(index)) return originalText[index];
          return availableChars[
            Math.floor(Math.random() * availableChars.length)
          ];
        })
        .join("");
    },
    [availableChars],
  );

  const computeOrder = useCallback(
    (len: number) => {
      const order: number[] = [];
      if (len <= 0) return order;
      if (revealDirection === "start") {
        for (let i = 0; i < len; i++) order.push(i);
        return order;
      }
      if (revealDirection === "end") {
        for (let i = len - 1; i >= 0; i--) order.push(i);
        return order;
      }

      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        if (offset % 2 === 0) {
          const idx = middle + offset / 2;
          if (idx >= 0 && idx < len) order.push(idx);
        } else {
          const idx = middle - Math.ceil(offset / 2);
          if (idx >= 0 && idx < len) order.push(idx);
        }
        offset++;
      }
      return order.slice(0, len);
    },
    [revealDirection],
  );

  const fillAllIndices = useCallback(() => {
    const indices = new Set<number>();
    for (let i = 0; i < text.length; i++) indices.add(i);
    return indices;
  }, [text]);

  const removeRandomIndices = useCallback((set: Set<number>, count: number) => {
    const arr = Array.from(set);
    for (let i = 0; i < count && arr.length > 0; i++) {
      const idx = Math.floor(Math.random() * arr.length);
      arr.splice(idx, 1);
    }
    return new Set(arr);
  }, []);

  const encryptInstantly = useCallback(() => {
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    setDisplayText(shuffleText(text, emptySet));
    setIsDecrypted(false);
  }, [text, shuffleText]);

  const triggerDecrypt = useCallback(() => {
    const empty = new Set<number>();
    if (sequential) {
      orderRef.current = computeOrder(text.length);
      pointerRef.current = 0;
      setRevealedIndices(empty);
    } else {
      setRevealedIndices(empty);
    }
    setDirection("forward");
    setIsDecrypted(false);
    setDisplayText(shuffleText(text, empty));
    setIsAnimating(true);
  }, [sequential, computeOrder, text.length, shuffleText, text]);

  const triggerReverse = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length).slice().reverse();
      pointerRef.current = 0;
      setRevealedIndices(fillAllIndices());
      setDisplayText(shuffleText(text, fillAllIndices()));
    } else {
      setRevealedIndices(fillAllIndices());
      setDisplayText(shuffleText(text, fillAllIndices()));
    }
    setDirection("reverse");
    setIsAnimating(true);
  }, [sequential, computeOrder, fillAllIndices, shuffleText, text]);

  useEffect(() => {
    if (!isAnimating) return;

    let currentIteration = 0;

    const getNextIndex = (revealedSet: Set<number>) => {
      const textLength = text.length;
      switch (revealDirection) {
        case "start":
          return revealedSet.size;
        case "end":
          return textLength - 1 - revealedSet.size;
        case "center": {
          const middle = Math.floor(textLength / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex =
            revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

          if (
            nextIndex >= 0 &&
            nextIndex < textLength &&
            !revealedSet.has(nextIndex)
          ) {
            return nextIndex;
          }

          for (let i = 0; i < textLength; i++) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        default:
          return revealedSet.size;
      }
    };

    intervalRef.current = setInterval(() => {
      setRevealedIndices((prevRevealed) => {
        if (sequential) {
          if (direction === "forward") {
            if (prevRevealed.size < text.length) {
              const nextIndex = getNextIndex(prevRevealed);
              const newRevealed = new Set(prevRevealed);
              newRevealed.add(nextIndex);
              setDisplayText(shuffleText(text, newRevealed));
              return newRevealed;
            }

            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsAnimating(false);
            setIsDecrypted(true);
            return prevRevealed;
          }

          if (pointerRef.current < orderRef.current.length) {
            const idxToRemove = orderRef.current[pointerRef.current++];
            const newRevealed = new Set(prevRevealed);
            newRevealed.delete(idxToRemove);
            setDisplayText(shuffleText(text, newRevealed));
            if (newRevealed.size === 0) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setIsAnimating(false);
              setIsDecrypted(false);
            }
            return newRevealed;
          }

          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnimating(false);
          setIsDecrypted(false);
          return prevRevealed;
        }

        if (direction === "forward") {
          setDisplayText(shuffleText(text, prevRevealed));
          currentIteration++;
          if (currentIteration >= maxIterations) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsAnimating(false);
            setDisplayText(text);
            setIsDecrypted(true);
          }
          return prevRevealed;
        }

        let currentSet = prevRevealed;
        if (currentSet.size === 0) {
          currentSet = fillAllIndices();
        }
        const removeCount = Math.max(
          1,
          Math.ceil(text.length / Math.max(1, maxIterations)),
        );
        const nextSet = removeRandomIndices(currentSet, removeCount);
        setDisplayText(shuffleText(text, nextSet));
        currentIteration++;
        if (nextSet.size === 0 || currentIteration >= maxIterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnimating(false);
          setIsDecrypted(false);
          setDisplayText(shuffleText(text, new Set()));
          return new Set<number>();
        }
        return nextSet;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    isAnimating,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    shuffleText,
    direction,
    fillAllIndices,
    removeRandomIndices,
  ]);

  const handleClick = () => {
    if (animateOn !== "click") return;

    if (clickMode === "once") {
      if (isDecrypted) return;
      setDirection("forward");
      triggerDecrypt();
    }

    if (clickMode === "toggle") {
      if (isDecrypted) {
        triggerReverse();
      } else {
        setDirection("forward");
        triggerDecrypt();
      }
    }
  };

  const triggerHoverDecrypt = useCallback(() => {
    if (isAnimating) return;

    setRevealedIndices(new Set());
    setIsDecrypted(false);
    setDisplayText(text);
    setDirection("forward");
    setIsAnimating(true);
  }, [isAnimating, text]);

  const resetToPlainText = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setRevealedIndices(new Set());
    setDisplayText(text);
    setIsDecrypted(true);
    setDirection("forward");
  }, [text]);

  const scheduleViewDecrypt = useCallback(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    if (viewDelayTimerRef.current) {
      clearTimeout(viewDelayTimerRef.current);
    }

    viewDelayTimerRef.current = setTimeout(() => {
      viewDelayTimerRef.current = null;
      triggerDecrypt();
    }, viewDelay);
  }, [triggerDecrypt, viewDelay]);

  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "inViewHover") return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          scheduleViewDecrypt();
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    const currentRef = containerRef.current;
    if (!currentRef) return;

    observer.observe(currentRef);

    const rect = currentRef.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      scheduleViewDecrypt();
    }

    return () => {
      if (viewDelayTimerRef.current) {
        clearTimeout(viewDelayTimerRef.current);
        viewDelayTimerRef.current = null;
      }
      observer.unobserve(currentRef);
    };
  }, [animateOn, scheduleViewDecrypt]);

  useEffect(() => {
    hasAnimatedRef.current = false;
    if (viewDelayTimerRef.current) {
      clearTimeout(viewDelayTimerRef.current);
      viewDelayTimerRef.current = null;
    }

    if (animateOn === "click") {
      encryptInstantly();
    } else {
      setDisplayText(text);
      setIsDecrypted(true);
    }
    setRevealedIndices(new Set());
    setDirection("forward");
  }, [animateOn, text, encryptInstantly]);

  if (prefersReducedMotion) {
    return <span className={parentClassName}>{text}</span>;
  }

  const animateProps =
    animateOn === "hover" || animateOn === "inViewHover"
      ? {
          onMouseEnter: triggerHoverDecrypt,
          onMouseLeave: resetToPlainText,
        }
      : animateOn === "click"
        ? { onClick: handleClick }
        : {};

  return (
    <motion.span
      className={parentClassName}
      ref={containerRef}
      style={WRAPPER_STYLE}
      {...animateProps}
    >
      <span style={SR_ONLY_STYLE}>{displayText}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, index) => {
          const isRevealedOrDone =
            revealedIndices.has(index) || (!isAnimating && isDecrypted);

          return (
            <span
              key={`${char}-${index}`}
              className={isRevealedOrDone ? className : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}

export function DecryptedTextView({
  speed = 52,
  sequential = true,
  useOriginalCharsOnly = true,
  revealDirection = "start",
  viewDelay = 480,
  encryptedClassName = "decrypted-text__encrypted",
  ...props
}: Omit<DecryptedTextProps, "animateOn">) {
  return (
    <DecryptedText
      animateOn="view"
      speed={speed}
      sequential={sequential}
      useOriginalCharsOnly={useOriginalCharsOnly}
      revealDirection={revealDirection}
      viewDelay={viewDelay}
      encryptedClassName={encryptedClassName}
      {...props}
    />
  );
}

export function DecryptedSubtitle({
  viewDelay = 980,
  speed = 46,
  sequential = true,
  useOriginalCharsOnly = true,
  revealDirection = "start",
  encryptedClassName = "decrypted-text__encrypted",
  ...props
}: Omit<DecryptedTextProps, "animateOn">) {
  return (
    <DecryptedTextView
      viewDelay={viewDelay}
      speed={speed}
      sequential={sequential}
      useOriginalCharsOnly={useOriginalCharsOnly}
      revealDirection={revealDirection}
      encryptedClassName={encryptedClassName}
      {...props}
    />
  );
}

export function DecryptedTextHover({
  speed = 35,
  sequential = true,
  useOriginalCharsOnly = true,
  encryptedClassName = "decrypted-text__encrypted",
  ...props
}: Omit<DecryptedTextProps, "animateOn">) {
  return (
    <DecryptedText
      animateOn="hover"
      speed={speed}
      sequential={sequential}
      useOriginalCharsOnly={useOriginalCharsOnly}
      encryptedClassName={encryptedClassName}
      {...props}
    />
  );
}
