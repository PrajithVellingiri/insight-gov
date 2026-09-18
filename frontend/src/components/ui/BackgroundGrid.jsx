import React from 'react';

/**
 * Minimalist background canvas.
 * Warm off-white (#F7F6F2) with faint architectural grid lines (#181817 at 3%).
 */
export default function BackgroundGrid() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 bg-[#F7F6F2]"
      aria-hidden="true"
    >
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #181817 1px, transparent 1px),
            linear-gradient(to bottom, #181817 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
