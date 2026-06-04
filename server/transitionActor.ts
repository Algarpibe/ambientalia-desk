// Actor temporal de las transiciones (autor del comentario e historial).
// El Subsistema H (login/roles) lo reemplazará por el usuario autenticado.
export const TRANSITION_ACTOR = process.env.TRANSITION_ACTOR || 'Equipo Técnico'
