import React from 'react';

/**
 * Editorial minimalist background layer.
 * Warm off-white / ivory canvas with very subtle civic architectural accents.
 */
export default function BackgroundGrid() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 bg-[#F8F7F2]"
      aria-hidden="true"
    >
      {/* Very faint fine line grid for architectural structure */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #202522 1px, transparent 1px),
            linear-gradient(to bottom, #202522 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
