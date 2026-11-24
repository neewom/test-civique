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
        // Track sized in rem like its 1rem thumb: with enlarged text the thumb no
        // longer outgrows a track fixed in pixels
        className="data-[size=default]:h-[1.15rem] data-[size=default]:w-8"
        checked={isDark}
        onCheckedChange={toggle}
        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      />
    </div>
  )
}
