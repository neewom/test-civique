import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/lib/theme-context'

export function ThemeSwitch() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground select-none" aria-hidden>
        {isDark ? '🌙' : '☀️'}
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={toggle}
        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      />
    </div>
  )
}
