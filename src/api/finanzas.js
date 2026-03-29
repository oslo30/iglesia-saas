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

export const ingresosApi = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchConToken(`/ingresos${qs ? '?' + qs : ''}`);
  },
  crearDiezmo: (body) =>
    fetchConToken('/ingresos/diezmos', { method: 'POST', body: JSON.stringify(body) }),
  crearOfrenda: (body) =>
    fetchConToken('/ingresos/ofrendas', { method: 'POST', body: JSON.stringify(body) }),
  resumen: (periodo, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchConToken(`/ingresos/resumen/${periodo}${qs ? '?' + qs : ''}`);
  },
};

export const egresosApi = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchConToken(`/egresos${qs ? '?' + qs : ''}`);
  },
  obtener: (id) => fetchConToken(`/egresos/${id}`),
  crear: (body) =>
    fetchConToken('/egresos', { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (id, body) =>
    fetchConToken(`/egresos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  eliminar: (id) =>
    fetchConToken(`/egresos/${id}`, { method: 'DELETE' }),
};

export const categoriasApi = {
  listar: () => fetchConToken('/categorias'),
  crear: (body) =>
    fetchConToken('/categorias', { method: 'POST', body: JSON.stringify(body) }),
  crearSubcategoria: (categoriaId, body) =>
    fetchConToken(`/categorias/${categoriaId}/subcategorias`, { method: 'POST', body: JSON.stringify(body) }),
  eliminarSubcategoria: (id) =>
    fetchConToken(`/categorias/subcategorias/${id}`, { method: 'DELETE' }),
};
