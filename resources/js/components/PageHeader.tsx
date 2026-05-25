import React from 'react';

interface PageHeaderProps {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, sub, actions }: PageHeaderProps) {
  return (
    <div className="ph">
      <div>
        <div className="ph-title">{title}</div>
        {sub && <div className="ph-sub">{sub}</div>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}
