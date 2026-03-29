import { supabase } from '../supabase';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

async function fetchConToken(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(e.error);
  }
  return res.json();
}

export const proyectosApi = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchConToken(`/proyectos${qs ? '?' + qs : ''}`);
  },
  obtener: (id) => fetchConToken(`/proyectos/${id}`),
  estadisticas: (id) => fetchConToken(`/proyectos/${id}/estadisticas`),
  crear: (body) =>
    fetchConToken('/proyectos', { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (id, body) =>
    fetchConToken(`/proyectos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  cambiarEstado: (id, estado) =>
    fetchConToken(`/proyectos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  eliminar: (id) =>
    fetchConToken(`/proyectos/${id}`, { method: 'DELETE' }),
};
