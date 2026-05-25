import React from 'react';
import Icon from './Icon';

interface BtnProps {
  variant?: 'default' | 'primary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: string;
  iconRight?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export default function Btn({
  variant = 'default', size, icon, iconRight, disabled, onClick, children, title, style, type = 'button',
}: BtnProps) {
  const cls = ['btn', variant, size ?? ''].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick} title={title} style={style}>
      {icon && <Icon name={icon} size={12} className="icon"/>}
      {children}
      {iconRight && <Icon name={iconRight} size={12} className="icon"/>}
    </button>
  );
}
