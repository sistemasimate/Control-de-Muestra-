import React from 'react';

interface CardProps {
  title?: string;
  action?: React.ReactNode;
  pad?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ title, action, pad = true, children, style }: CardProps) {
  return (
    <div className="card" style={style}>
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
          {action && <div className="right">{action}</div>}
        </div>
      )}
      <div className={pad ? 'card-pad' : ''}>{children}</div>
    </div>
  );
}
