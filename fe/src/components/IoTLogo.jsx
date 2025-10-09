import React from 'react';

const IoTLogo = ({ size = 'normal' }) => {
  
  const sizes = {
    small: { 
      width: 32, 
      height: 32, 
      fontSize: '14px',
      iconSize: 28,
      dotSize: 3
    },
    normal: { 
      width: 48, 
      height: 48, 
      fontSize: '16px',
      iconSize: 42,
      dotSize: 4
    },
    large: { 
      width: 64, 
      height: 64, 
      fontSize: '20px',
      iconSize: 56,
      dotSize: 5
    }
  };
  
  const currentSize = sizes[size];
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px'
    }}>
      {/* Icon với gradient và animation */}
      <div style={{
        position: 'relative',
        width: currentSize.width,
        height: currentSize.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Gradient background circle */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          opacity: 0.15,
          filter: 'blur(8px)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        
        {/* Main icon container */}
        <div style={{
          position: 'relative',
          width: currentSize.iconSize,
          height: currentSize.iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Center circle */}
          <div style={{
            position: 'absolute',
            width: currentSize.dotSize * 3,
            height: currentSize.dotSize * 3,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
            zIndex: 2
          }} />
          
          {/* Orbiting dots */}
          {[0, 120, 240].map((angle, i) => {
            const radius = currentSize.iconSize / 2.5;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: currentSize.dotSize * 2,
                  height: currentSize.dotSize * 2,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transform: `translate(${x}px, ${y}px)`,
                  boxShadow: '0 1px 4px rgba(102, 126, 234, 0.3)',
                  animation: `orbit${i} 4s linear infinite`,
                  zIndex: 1
                }}
              />
            );
          })}
          
          {/* Connection lines */}
          {[0, 120, 240].map((angle, i) => {
            const radius = currentSize.iconSize / 2.5;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <div
                key={`line-${i}`}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: `${radius}px`,
                  background: 'linear-gradient(to bottom, rgba(102, 126, 234, 0.3), transparent)',
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'bottom center',
                  opacity: 0.6
                }}
              />
            );
          })}
        </div>
      </div>
      
      {/* Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2px'
      }}>
        <div style={{
          fontSize: currentSize.fontSize,
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          letterSpacing: '-0.5px'
        }}>
          IoT Hub
        </div>
        <div style={{
          fontSize: '10px',
          color: '#555',
          fontWeight: '500',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          opacity: 0.8
        }}>
          Smart Control
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
        
        @keyframes orbit0 {
          0% { transform: translate(${Math.cos(0 * Math.PI / 180) * currentSize.iconSize / 2.5}px, ${Math.sin(0 * Math.PI / 180) * currentSize.iconSize / 2.5}px); }
          100% { transform: translate(${Math.cos(360 * Math.PI / 180) * currentSize.iconSize / 2.5}px, ${Math.sin(360 * Math.PI / 180) * currentSize.iconSize / 2.5}px); }
        }
        
        @keyframes orbit1 {
          0% { transform: translate(${Math.cos(120 * Math.PI / 180) * currentSize.iconSize / 2.5}px, ${Math.sin(120 * Math.PI / 180) * currentSize.iconSize / 2.5}px); }
          100% { transform: translate(${Math.cos(480 * Math.PI / 180) * currentSize.iconSize / 2.5}px, ${Math.sin(480 * Math.PI / 180) * currentSize.iconSize / 2.5}px); }
        }
        
        @keyframes orbit2 {
          0% { transform: translate(${Math.cos(240 * Math.PI / 180) * currentSize.iconSize / 2.5}px, ${Math.sin(240 * Math.PI / 180) * currentSize.iconSize / 2.5}px); }
          100% { transform: translate(${Math.cos(600 * Math.PI / 180) * currentSize.iconSize / 2.5}px, ${Math.sin(600 * Math.PI / 180) * currentSize.iconSize / 2.5}px); }
        }
      `}</style>
    </div>
  );
};

export default IoTLogo;