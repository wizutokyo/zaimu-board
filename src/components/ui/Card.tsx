import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card p-4 ${className} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  accent?: 'blue' | 'green' | 'red' | 'purple'
  note?: string
}

const accentMap = {
  blue:   'text-brand-blue',
  green:  'text-emerald-500',
  red:    'text-red-500',
  purple: 'text-brand-purple',
}

export function KpiCard({ label, value, sub, accent = 'blue', note }: KpiCardProps) {
  return (
    <Card>
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</p>
      {sub  && <p className="text-xs text-brand-muted mt-0.5">{sub}</p>}
      {note && <p className="text-xs text-brand-muted mt-1 leading-relaxed">{note}</p>}
    </Card>
  )
}

interface SectionHeaderProps {
  title: string
  sub?: string
}

export function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-brand-text">{title}</h2>
      {sub && <p className="text-xs text-brand-muted mt-0.5">{sub}</p>}
    </div>
  )
}
