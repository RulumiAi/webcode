import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ExpandableDescriptionProps {
  description?: string;
  emptyLabel: string;
  viewMoreLabel: string;
  collapseLabel: string;
  textClassName: string;
  surfaceClassName: string;
}

export function hasDescriptionOverflow(scrollHeight: number, clientHeight: number) {
  return clientHeight > 0 && scrollHeight > clientHeight + 1;
}

export const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  description,
  emptyLabel,
  viewMoreLabel,
  collapseLabel,
  textClassName,
  surfaceClassName,
}) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const content = description || emptyLabel;

  useEffect(() => {
    setIsExpanded(false);
  }, [description]);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text || !description || isExpanded) {
      if (!description) setIsOverflowing(false);
      return;
    }

    const measureOverflow = () => {
      const collapsedHeight = text.clientHeight;
      const previousDisplay = text.style.display;
      const previousOverflow = text.style.overflow;
      const previousLineClamp = text.style.webkitLineClamp;
      const previousBoxOrient = text.style.webkitBoxOrient;

      // Measure the unclamped content while preserving the collapsed height.
      // Browsers differ on whether scrollHeight includes content hidden by line-clamp.
      text.style.display = 'block';
      text.style.overflow = 'visible';
      text.style.webkitLineClamp = 'unset';
      text.style.webkitBoxOrient = 'unset';
      const fullHeight = text.scrollHeight;

      text.style.display = previousDisplay;
      text.style.overflow = previousOverflow;
      text.style.webkitLineClamp = previousLineClamp;
      text.style.webkitBoxOrient = previousBoxOrient;

      setIsOverflowing(hasDescriptionOverflow(fullHeight, collapsedHeight));
    };
    const frameId = window.requestAnimationFrame(measureOverflow);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureOverflow);
    observer?.observe(text);
    window.addEventListener('resize', measureOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [description, isExpanded]);

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={`${textClassName} ${!isExpanded && description ? 'line-clamp-2' : ''}`}
      >
        {content}
      </p>

      {description && isOverflowing && !isExpanded && (
        <span className={`absolute bottom-0 right-0 pl-5 ${surfaceClassName}`}>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs font-semibold text-pink-400 transition-colors hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/80"
            aria-expanded="false"
          >
            {viewMoreLabel}
          </button>
        </span>
      )}

      {description && isOverflowing && isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="mt-1 text-xs font-semibold text-pink-400 transition-colors hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/80"
          aria-expanded="true"
        >
          {collapseLabel}
        </button>
      )}
    </div>
  );
};
