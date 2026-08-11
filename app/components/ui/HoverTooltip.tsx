"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type HoverTooltipProps = {
  label: string;
  side?: "top" | "right";
  children?: ReactNode;
  className?: string;
};

type TooltipPosition = {
  left: number;
  top: number;
  transform: string;
};

const TOOLTIP_MARGIN = 12;

export function HoverTooltip({
  label,
  side = "top",
  children,
  className = "",
}: HoverTooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
    transform: "translate(-50%, -100%)",
  });

  const getAnchorElement = useCallback(() => {
    if (!anchorRef.current) {
      return null;
    }

    return children ? anchorRef.current : anchorRef.current.parentElement;
  }, [children]);

  const updatePosition = useCallback(() => {
    const anchorElement = getAnchorElement();

    if (!anchorElement) {
      return;
    }

    const anchorRect = anchorElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width ?? 0;
    const viewportWidth = window.innerWidth;

    if (side === "right") {
      const idealLeft = anchorRect.right + TOOLTIP_MARGIN;
      const maxLeft = viewportWidth - tooltipWidth - TOOLTIP_MARGIN;

      setPosition({
        left: Math.max(TOOLTIP_MARGIN, Math.min(idealLeft, maxLeft)),
        top: anchorRect.top + anchorRect.height / 2,
        transform: "translateY(-50%)",
      });
      return;
    }

    const idealLeft = anchorRect.left + anchorRect.width / 2;
    const halfTooltipWidth = tooltipWidth / 2;
    const minLeft = TOOLTIP_MARGIN + halfTooltipWidth;
    const maxLeft = viewportWidth - TOOLTIP_MARGIN - halfTooltipWidth;

    setPosition({
      left: Math.max(minLeft, Math.min(idealLeft, maxLeft)),
      top: anchorRect.top - TOOLTIP_MARGIN,
      transform: "translate(-50%, -100%)",
    });
  }, [getAnchorElement, side]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const anchorElement = getAnchorElement();

    if (!anchorElement) {
      return;
    }

    const show = () => {
      updatePosition();
      setIsVisible(true);
    };
    const hide = () => setIsVisible(false);

    anchorElement.addEventListener("mouseenter", show);
    anchorElement.addEventListener("mouseleave", hide);
    anchorElement.addEventListener("focusin", show);
    anchorElement.addEventListener("focusout", hide);

    return () => {
      anchorElement.removeEventListener("mouseenter", show);
      anchorElement.removeEventListener("mouseleave", hide);
      anchorElement.removeEventListener("focusin", show);
      anchorElement.removeEventListener("focusout", hide);
    };
  }, [getAnchorElement, updatePosition]);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isVisible, updatePosition]);

  return (
    <>
      <span ref={anchorRef} className={children ? "inline-flex" : "contents"}>
        {children}
      </span>

      {isMounted
        ? createPortal(
            <div
              ref={tooltipRef}
              className={`pointer-events-none fixed z-[9999] whitespace-nowrap rounded-full border border-[#dfe8c5] bg-[#171717] px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] text-white shadow-md transition duration-200 ${
                isVisible ? "opacity-100" : "opacity-0"
              } ${className}`}
              style={{
                left: position.left,
                top: position.top,
                transform: position.transform,
              }}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
