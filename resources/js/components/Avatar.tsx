import React from 'react';

export default function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="av" style={{ width: size, height: size, fontSize: size * 0.48 }}>
      {initials}
    </span>
  );
}
