import { areasForTransition } from './transitions'

/** ¿Puede un usuario con estas áreas (o admin) ejecutar una transición de `transitionArea`? */
export function canExecuteTransition(userAreas: string[], isAdmin: boolean, transitionArea: string): boolean {
  if (isAdmin) return true
  return areasForTransition(transitionArea).some((a) => userAreas.includes(a))
}
