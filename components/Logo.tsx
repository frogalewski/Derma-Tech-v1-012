
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 80"
    className={className}
    aria-label="Dermatológica Logo"
    role="img"
    fill="currentColor"
  >
    <style>
      {`
        .cursive {
          font-family: 'Times New Roman', Times, serif;
          font-style: italic;
        }
        .serif-bold {
          font-family: 'Times New Roman', Times, serif;
          font-weight: bold;
        }
      `}
    </style>
    <text x="200" y="40" className="serif-bold" fontSize="38" textAnchor="middle">
      Dermatológica
    </text>
    <text x="200" y="70" className="cursive" fontSize="24" textAnchor="middle">
      farmácia de manipulação
    </text>
  </svg>
);

export default Logo;
