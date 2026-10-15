import React from 'react';

/**
 * Belluh's presence: a small glowing sphere in the brand blue and pink that slowly turns and breathes,
 * and spins faster while Belluh is thinking. Styles live in index.html (.belluh-orb).
 */
const BelluhOrb: React.FC<{ size?: number; thinking?: boolean; className?: string }> = ({ size = 24, thinking = false, className = '' }) => (
  <span className={`belluh-orb ${thinking ? 'is-thinking' : ''} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <span className="belluh-orb-glow" />
    <span className="belluh-orb-core" />
    <span className="belluh-orb-shine" />
  </span>
);

export default BelluhOrb;
