import React, { useEffect, useRef } from 'react';

export default function BackgroundGrid({ showNodes = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!showNodes) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes setup
    const nodeCount = Math.min(Math.floor((width * height) / 35000), 40);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 1,
        color: Math.random() > 0.4 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(6, 182, 212, 0.35)',
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${(1 - dist / 130) * 0.12})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showNodes]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Background SVG Grid Pattern */}
      <svg
        className="absolute inset-0 h-full w-full stroke-blue-500/[0.04] [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent_85%)]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="gov-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M.5 40V.5H40" fill="none" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#gov-grid)" />
      </svg>

      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="absolute top-1/3 -right-40 h-[450px] w-[450px] rounded-full bg-cyan-500/08 blur-[120px]" />
      <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />

      {/* Connected Network Nodes Canvas */}
      {showNodes && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full opacity-60"
        />
      )}
    </div>
  );
}
