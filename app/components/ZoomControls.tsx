'use client';

type ZoomControlsProps = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocationClick?: () => void;
};

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  onLocationClick,
}: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-10">
      {/* Zoom Controls */}
      <div className="flex flex-col gap-0.5 shadow-lg">
        <button
          onClick={onZoomIn}
          className="flex size-10 items-center justify-center rounded-t-lg bg-[#1c2127]/80 backdrop-blur-sm hover:bg-[#1c2127] transition-colors"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          onClick={onZoomOut}
          className="flex size-10 items-center justify-center rounded-b-lg bg-[#1c2127]/80 backdrop-blur-sm hover:bg-[#1c2127] transition-colors"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      {/* Location Button */}
      <button
        onClick={onLocationClick}
        className="flex size-10 items-center justify-center rounded-lg bg-[#1c2127]/80 backdrop-blur-sm shadow-lg hover:bg-[#1c2127] transition-colors"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
}

