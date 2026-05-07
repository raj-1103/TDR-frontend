import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  variant?: 'default' | 'glass' | 'outline' | 'flat'
  style?: React.CSSProperties
}

export function Card({ 
  children, 
  className = '', 
  onClick, 
  hoverable = false,
  variant = 'default',
  style = {}
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300 overflow-hidden'
  
  const variants = {
    default: 'bg-white border border-slate-300 shadow-sm shadow-slate-200/50',
    glass: 'bg-white/70 backdrop-blur-md border border-slate-300 shadow-xl shadow-slate-200/40',
    outline: 'bg-transparent border-2 border-slate-300 hover:border-blue-500/30',
    flat: 'bg-slate-50 border-none'
  }

  const hoverStyles = hoverable 
    ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 hover:border-blue-500/20' 
    : ''

  const clickableStyles = onClick ? 'cursor-pointer active:scale-[0.98]' : ''

  return (
    <div 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${clickableStyles} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-6 py-4 border-bottom border-slate-100 flex items-center justify-between ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-6 py-4 bg-slate-50/50 border-top border-slate-100 ${className}`}>
      {children}
    </div>
  )
}
