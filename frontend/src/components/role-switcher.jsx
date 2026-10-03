import { ShieldCheck, User } from 'lucide-react'
import { Select } from '@/components/ui/select'

export function RoleSwitcher({ value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium">
      {value === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />}
      <span className="hidden sm:inline">Role</span>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-[130px] bg-[hsl(var(--card))]"
        aria-label="Role switcher"
      >
        <option value="viewer">Viewer</option>
        <option value="admin">Admin</option>
      </Select>
    </label>
  )
}
