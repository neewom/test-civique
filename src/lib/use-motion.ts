import { useSyncExternalStore } from 'react'
import { currentMotion, subscribeMotion, type Motion } from '@/lib/motion'

/** Current animations preference (stored choice, else the device's). */
export function useMotion(): Motion {
  return useSyncExternalStore(subscribeMotion, currentMotion, () => 'off')
}
