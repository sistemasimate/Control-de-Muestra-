import React from 'react';

const ICONS: Record<string, string> = {
  dashboard:     'M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z',
  list:          'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  'shield-check':'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-2-8l-2-2 1.4-1.4L10 11.2l3.6-3.6L15 9l-5 5z',
  shield:        'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  truck:         'M1 3h15v13H1zm15 5h4l3 3v5h-7V8zm3 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  clock:         'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-14v4l3 3',
  'trending-up': 'M22 7l-8.5 8.5-5-5L1 17',
  dollar:        'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  search:        'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  bell:          'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zm-4.27 13a2 2 0 0 1-3.46 0',
  plus:          'M12 5v14M5 12h14',
  settings:      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v1m0-10V5m7 7h1M5 12H4m13.657 4.243.707.707M6.343 6.343l-.707-.707M17.657 6.343l-.707.707M6.343 17.657l-.707.707',
  download:      'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload:        'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  calendar:      'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  x:             'M18 6 6 18M6 6l12 12',
  check:         'M20 6 9 17l-5-5',
  filter:        'M22 3H2l8 9.46V19l4 2v-8.54z',
  alert:         'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01',
  info:          'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v-4m0-2h.01',
  paperclip:     'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  send:          'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  'chevron-right':'M9 18l6-6-6-6',
  more:          'M12 5h.01M12 12h.01M12 19h.01',
  user:          'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  crown:         'M12 2 9 9l-7 1 5 5-1.5 7L12 19l6.5 3L17 15l5-5-7-1z',
  'rotate-ccw':  'M1 4v6h6M3.51 15a9 9 0 1 0 .49-3.5',
  lock:          'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-4a4 4 0 0 0-4 4v4h8V7a4 4 0 0 0-4-4z',
  box:           'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 14, className, style }: IconProps) {
  const d = ICONS[name] || ICONS['info'];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg}/>
      ))}
    </svg>
  );
}
