import React from 'react';

export default function StickyActions({ children, className = '' }) {
  return (
    <div className={`mobile-sticky-actions ${className}`}>
      {children}
    </div>
  );
}
