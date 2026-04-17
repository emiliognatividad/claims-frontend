import { useEffect, useState } from 'react';

export default function Landing({ onEnter }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(40deg, rgb(0, 10, 60), rgb(10, 0, 80))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes moveVertical {
          0% { transform: translateY(-50%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-50%); }
        }
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveHorizontal {
          0% { transform: translateX(-50%) translateY(-10%); }
          50% { transform: translateX(50%) translateY(10%); }
          100% { transform: translateX(-50%) translateY(-10%); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .gradient-1 {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle at center, rgba(18, 113, 255, 0.8) 0, rgba(18, 113, 255, 0) 50%) no-repeat;
          mix-blend-mode: hard-light;
          animation: moveVertical 30s ease infinite;
        }
        .gradient-2 {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle at center, rgba(221, 74, 255, 0.8) 0, rgba(221, 74, 255, 0) 50%) no-repeat;
          mix-blend-mode: hard-light;
          animation: moveInCircle 20s reverse infinite;
          transform-origin: calc(50% - 400px);
        }
        .gradient-3 {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle at center, rgba(100, 220, 255, 0.8) 0, rgba(100, 220, 255, 0) 50%) no-repeat;
          mix-blend-mode: hard-light;
          animation: moveInCircle 40s linear infinite;
          transform-origin: calc(50% + 400px);
        }
        .gradient-4 {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle at center, rgba(200, 50, 50, 0.8) 0, rgba(200, 50, 50, 0) 50%) no-repeat;
          mix-blend-mode: hard-light;
          animation: moveHorizontal 40s ease infinite;
          transform-origin: calc(50% - 200px);
          opacity: 0.7;
        }
        .gradient-5 {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle at center, rgba(180, 180, 50, 0.8) 0, rgba(180, 180, 50, 0) 50%) no-repeat;
          mix-blend-mode: hard-light;
          animation: moveInCircle 20s ease infinite;
          transform-origin: calc(50% - 800px) calc(50% + 800px);
        }
        .content {
          animation: fadeUp 1s ease forwards;
          opacity: 0;
        }
        .enter-btn {
          transition: all 0.2s ease;
        }
        .enter-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
        }
        .stat-item {
          animation: fadeUp 1s ease forwards;
          opacity: 0;
        }
      `}</style>

      {/* Animated gradient blobs */}
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(40px)' }}>
        <div className="gradient-1" />
        <div className="gradient-2" />
        <div className="gradient-3" />
        <div className="gradient-4" />
        <div className="gradient-5" />
      </div>

      {/* Content */}
      <div className="content" style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '0 20px',
        animationDelay: '0.2s'
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 16px',
          fontSize: 12, color: 'rgba(255,255,255,0.8)',
          marginBottom: 24, letterSpacing: 1
        }}>
          LOGISTICS OPERATIONS PLATFORM
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 72px)',
          fontWeight: 800,
          color: 'white',
          marginBottom: 16,
          lineHeight: 1.1,
          textShadow: '0 2px 20px rgba(0,0,0,0.3)'
        }}>
          Claims<br />
          <span style={{
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Platform</span>
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 2vw, 18px)',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 40,
          maxWidth: 480,
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          End-to-end logistics claims management. Track, escalate, and resolve claims with full audit trail and SLA monitoring.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <button className="enter-btn" onClick={onEnter} style={{
            background: 'white',
            color: '#1e293b',
            border: 'none',
            padding: '14px 32px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            Get started →
          </button>
          <button className="enter-btn" onClick={onEnter} style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '14px 32px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Try demo
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: '7', label: 'Industries' },
            { value: '21', label: 'Clients' },
            { value: '100%', label: 'Audit trail' },
            { value: 'Live', label: 'on AWS' },
          ].map((stat, i) => (
            <div className="stat-item" key={i} style={{
              textAlign: 'center',
              animationDelay: `${0.4 + i * 0.1}s`
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>{stat.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}