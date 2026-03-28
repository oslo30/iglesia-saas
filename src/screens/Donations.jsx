import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Banknote, Smartphone, Download, Plus, Search, Filter, Check, X, Clock, ArrowUpRight, RefreshCw, Wallet, FileText, FileSpreadsheet, File } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import './Donations.css';

// Cache global para datos de finanzas
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 segundos

const COLORS = ['#1E3A5F', '#10B981', '#C9A84C', '#8B5CF6'];
const METODO_ICON = {
  'Transferencia Bancaria': Banknote,
  'Billetera Digital': Smartphone,
  'Efectivo': CreditCard,
  'Cheque': CreditCard,
};

function fmt(v) { return '$' + Number(v || 0).toLocaleString('es-CO'); }
function fmtM(v) { return '$' + (Number(v || 0) / 1000000).toFixed(1) + 'M'; }

function Toast({ message, onClose, type = 'success' }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast" style={{ background: type === 'success' ? '#10B981' : '#EF4444' }}>
      {type === 'success' ? <Check size={18} /> : <X size={18} />}
      <span>{message}</span>
    </div>
  );
}

function ExportModal({ onClose, data, onExport }) {
  const formats = [
    { id: 'csv', name: 'CSV', desc: 'Para hojas de cálculo', icon: FileSpreadsheet },
    { id: 'pdf', name: 'PDF', desc: 'Documento para imprimir', icon: FileText },
    { id: 'excel', name: 'Excel', desc: 'Libro de Excel', icon: FileSpreadsheet },
    { id: 'word', name: 'Word', desc: 'Documento de Word', icon: File },
  ];

  function handleExport(format) {
    onExport(format);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header" style={{ borderTopColor: '#1E3A5F' }}>
          <h2>Exportar Datos</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {formats.map(fmt => (
            <button key={fmt.id} className="export-option" onClick={() => handleExport(fmt.id)}>
              <div className="export-icon"><fmt.icon size={24} /></div>
              <div className="export-info">
                <span className="export-name">{fmt.name}</span>
                <span className="export-desc">{fmt.desc}</span>
              </div>
              <Download size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Donations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  // Data states
  const [diezmos, setDiezmos] = useState([]);
  const [ofrendas, setOfrendas] = useState([]);
  const [especiales, setEspeciales] = useState([]);
  const [miembros, setMiembros] = useState([]);

  useEffect(() => {
    const now = Date.now()
    if (cachedData && (now - lastFetch) < CACHE_DURATION) {
      // Usar cache
      setDiezmos(cachedData.diezmos)
      setOfrendas(cachedData.ofrendas)
      setEspeciales(cachedData.especiales)
      setMiembros(cachedData.miembros)
      setLoading(false)
      return
    }
    loadData()
  }, []);

  async function loadData() {
    setLoading(true)

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    try {
      const [dzRes, ofRes, espRes, mbsRes] = await Promise.all([
        supabase.from('diezmos').select('*').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('ofrendas').select('*').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('donaciones_especiales').select('*').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('miembros').select('id, nombre, apellido').eq('estado', 'activo').order('apellido'),
      ])

      const dz = dzRes.data || []
      const of = ofRes.data || []
      const esp = espRes.data || []
      const mbs = mbsRes.data || []

      // Guardar en cache
      cachedData = { diezmos: dz, ofrendas: of, especiales: esp, miembros: mbs }
      lastFetch = Date.now()

      setDiezmos(dz)
      setOfrendas(of)
      setEspeciales(esp)
      setMiembros(mbs)
    } catch (err) {
      console.error('Error cargando finanzas:', err)
    }
    setLoading(false)
  }

  // Aggregate monthly data for bar chart
  const monthlyData = (() => {
    const months = {};
    diezmos.forEach(d => {
      const k = d.mes;
      months[k] = (months[k] || { diezmos: 0, ofrendas: 0, especiales: 0 });
      months[k].diezmos += Number(d.monto);
    });
    ofrendas.forEach(o => {
      const d = new Date(o.created_at);
      const k = d.toLocaleDateString('es-ES', { month: 'short' });
      months[k] = months[k] || { diezmos: 0, ofrendas: 0, especiales: 0 };
      months[k].ofrendas += Number(o.monto);
    });
    especiales.forEach(e => {
      const d = new Date(e.created_at);
      const k = d.toLocaleDateString('es-ES', { month: 'short' });
      months[k] = months[k] || { diezmos: 0, ofrendas: 0, especiales: 0 };
      months[k].especiales += Number(e.monto);
    });
    return Object.entries(months).sort((a, b) => {
      const order = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    }).map(([name, data]) => ({ name, ...data }));
  })();

  // Payments by method
  const paymentsByMethod = (() => {
    const map = { 'Transferencia Bancaria': 0, 'Efectivo': 0, 'Billetera Digital': 0, 'Cheque': 0 };
    diezmos.forEach(d => { const m = d.metodo || 'Transferencia Bancaria'; map[m] = (map[m] || 0) + Number(d.monto); });
    especiales.forEach(e => { const m = e.metodo || 'Transferencia Bancaria'; map[m] = (map[m] || 0) + Number(e.monto); });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map).filter(([k, v]) => v > 0).map(([name, value]) => ({ name, value: Math.round(value / total * 100), color: COLORS[Object.keys(map).indexOf(name) % COLORS.length] }));
  })();

  // Summary KPIs
  const totalRecibido = [...diezmos, ...ofrendas, ...especiales].reduce((s, d) => s + Number(d.monto), 0);
  const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long' });
  const diezmosMes = diezmos.filter(d => d.mes === mesActual).reduce((s, d) => s + Number(d.monto), 0);
  const pendientes = [...diezmos, ...especiales].filter(d => d.estado === 'pendiente').reduce((s, d) => s + Number(d.monto), 0);
  const donorsCount = new Set([...diezmos.map(d => d.miembro_id), ...especiales.map(e => e.nombre)]).size;

  const summaryCards = [
    { label: 'Total Recibido', value: fmtM(totalRecibido), change: '', trend: 'up', icon: DollarSign, color: '#1E3A5F' },
    { label: `Este Mes (${mesActual})`, value: fmtM(diezmosMes), change: '', trend: 'up', icon: TrendingUp, color: '#10B981' },
    { label: 'Pendiente', value: fmtM(pendientes), change: '', trend: 'neutral', icon: Clock, color: '#F59E0B' },
    { label: 'Donantes Activos', value: donorsCount.toString(), change: '', trend: 'up', icon: CreditCard, color: '#8B5CF6' },
  ];

  // Combined transactions
  const allTx = [
    ...diezmos.map(d => {
      const mb = miembros.find(m => m.id === d.miembro_id);
      return { id: d.id, name: mb ? `${mb.nombre} ${mb.apellido}` : 'Sin nombre', type: 'Diezmo', method: d.metodo || 'Transferencia Bancaria', amount: d.monto, status: 'completed', date: new Date(d.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }), created_at: d.created_at };
    }),
    ...ofrendas.map(o => ({ id: o.id, name: o.descripcion || 'Ofrenda general', type: 'Ofrenda', method: o.metodo || 'Efectivo', amount: o.monto, status: 'completed', date: new Date(o.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }), created_at: o.created_at })),
    ...especiales.map(e => {
      const mb = miembros.find(m => m.id === e.miembro_id);
      return { id: e.id, name: mb ? `${mb.nombre} ${mb.apellido}` : (e.nombre || 'Denario'), type: 'Denario', method: e.metodo || 'Transferencia Bancaria', amount: e.monto, status: e.estado || 'completed', date: new Date(e.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }), created_at: e.created_at };
    }),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredTx = activeTab === 'all' ? allTx
    : activeTab === 'pending' ? allTx.filter(t => t.status === 'pending')
    : allTx.filter(t => t.type.toLowerCase() === activeTab.toLowerCase());

  // Top donors
  const donorMap = {};
  diezmos.forEach(d => {
    const key = d.miembro_id;
    if (!donorMap[key]) donorMap[key] = { id: key, total: 0, count: 0 };
    donorMap[key].total += Number(d.monto);
    donorMap[key].count++;
  });
  const topDonors = Object.values(donorMap).sort((a, b) => b.total - a.total).slice(0, 5).map(d => {
    const mb = miembros.find(m => m.id === d.id);
    return { name: mb ? `${mb.nombre} ${mb.apellido}` : 'Donante', total: d.total, count: d.count };
  });

  async function handleSaveDonation(formData) {
    const { type, monto, metodo, nombre, telefono, email, estado, miembro_id } = formData;
    let error = null;
    let successMsg = '';

    if (type === 'Diezmo') {
      const mes = new Date().toLocaleDateString('es-ES', { month: 'long' });
      const ano = new Date().getFullYear();
      const { error: err } = await supabase.from('diezmos').insert([{ miembro_id: miembro_id || null, monto: Number(monto), mes, ano, metodo }]);
      error = err;
      successMsg = 'Diezmo registrado con éxito';
    } else if (type === 'Ofrenda') {
      const { error: err } = await supabase.from('ofrendas').insert([{ monto: Number(monto), metodo, descripcion: nombre || null }]);
      error = err;
      successMsg = 'Ofrenda registrada con éxito';
    } else {
      const { error: err } = await supabase.from('donaciones_especiales').insert([{ nombre: nombre, tipo: 'denario', monto: Number(monto), metodo, estado: estado || 'completado', telefono, email, miembro_id: miembro_id || null }]);
      error = err;
      successMsg = 'Denario registrado con éxito';
    }
    if (error) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' });
    } else {
      setToast({ message: successMsg, type: 'success' });
      setShowForm(false);
      // Limpiar cache y recargar
      cachedData = null;
      loadData();
    }
  }

  function handleExport(format) {
    const headers = ['Tipo', 'Nombre', 'Método', 'Monto', 'Estado', 'Fecha'];
    const rows = filteredTx.map(t => [t.type, t.name, t.method, t.amount, t.status, t.date]);
    let content, filename, mimeType;

    if (format === 'csv') {
      content = [headers, ...rows].map(r => r.join(',')).join('\n');
      filename = 'finanzas.csv';
      mimeType = 'text/csv';
    } else if (format === 'excel') {
      content = [headers, ...rows].map(r => r.join('\t')).join('\n');
      filename = 'finanzas.xls';
      mimeType = 'application/vnd.ms-excel';
    } else if (format === 'pdf') {
      content = 'Reporte de Finanzas\n' + new Date().toLocaleDateString() + '\n\n' + [headers, ...rows].map(r => r.join(' | ')).join('\n');
      filename = 'finanzas.pdf';
      mimeType = 'application/pdf';
    } else {
      content = 'Reporte de Finanzas\n' + new Date().toLocaleDateString() + '\n\n' + [headers, ...rows].map(r => r.join('\t')).join('\n');
      filename = 'finanzas.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Archivo descargado con éxito', type: 'success' });
  }

  const methOptions = ['Transferencia Bancaria', 'Efectivo', 'Billetera Digital', 'Cheque'];

  return (
    <div className="donations-screen">
      <div className="donations-header">
        <div>
          <h2>Finanzas</h2>
          <p className="text-muted">Controla las contribuciones y genera reportes financieros</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={() => setRefreshKey(k => k + 1)}><RefreshCw size={16} /> Actualizar</button>
          <button className="btn-export" onClick={() => setShowExport(true)}><Download size={16} /> Exportar</button>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Registrar Ingreso</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
          <div style={{ marginBottom: '12px' }}>Cargando datos financieros...</div>
          <div style={{ fontSize: '0.875rem' }}>Esto puede tardar unos segundos</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="summary-row">
            {summaryCards.map((card, i) => (
              <div key={i} className="summary-card">
                <div className="summary-icon" style={{ background: card.color + '15', color: card.color }}>
                  <card.icon size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-label">{card.label}</span>
                  <span className="summary-value">{card.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="card chart-card flex-2">
              <div className="card-header">
                <div>
                  <h3>Ingresos Mensuales</h3>
                  <p className="text-muted">Diezmos, ofrendas y donaciones especiales</p>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData.length ? monthlyData : [{ name: '—', diezmos: 0, ofrendas: 0, especiales: 0 }]} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000000}M`} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} formatter={(v) => fmt(v)} />
                    <Bar dataKey="diezmos" name="Diezmos" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ofrendas" name="Ofrendas" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="especiales" name="Especiales" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                <span><i style={{ background: '#1E3A5F' }} />Diezmos</span>
                <span><i style={{ background: '#C9A84C' }} />Ofrendas</span>
                <span><i style={{ background: '#10B981' }} />Especiales</span>
              </div>
            </div>

            <div className="card chart-card flex-1">
              <div className="card-header">
                <div>
                  <h3>Por Método de Pago</h3>
                  <p className="text-muted">Distribución de tipos de donación</p>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={paymentsByMethod} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {paymentsByMethod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend">
                {paymentsByMethod.map((item, i) => (
                  <div key={i} className="pie-legend-item">
                    <i style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <span className="pie-legend-val">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Donors */}
          <div className="card top-donors-card">
            <div className="card-header">
              <h3>Principales Donantes</h3>
            </div>
            <div className="top-donors-list">
              {topDonors.length === 0 ? (
                <p style={{ padding: '16px', color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin datos aún</p>
              ) : topDonors.map((donor, i) => (
                <div key={i} className="donor-row">
                  <div className="donor-rank">{i + 1}</div>
                  <div className="donor-avatar">{donor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <div className="donor-info">
                    <span className="donor-name">{donor.name}</span>
                    <span className="donor-meta">{donor.count} contribuciones</span>
                  </div>
                  <span className="donor-amount">{fmt(donor.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card transactions-card">
            <div className="card-header">
              <div>
                <h3>Transacciones Recientes</h3>
                <p className="text-muted">{filteredTx.length} transacciones</p>
              </div>
            </div>

            <div className="tabs-mini">
              <button className={`tab-mini ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Todas</button>
              <button className={`tab-mini ${activeTab === 'diezmo' ? 'active' : ''}`} onClick={() => setActiveTab('diezmo')}>Diezmos</button>
              <button className={`tab-mini ${activeTab === 'ofrenda' ? 'active' : ''}`} onClick={() => setActiveTab('ofrenda')}>Ofrendas</button>
              <button className={`tab-mini ${activeTab === 'denario' ? 'active' : ''}`} onClick={() => setActiveTab('denario')}>Denario</button>
              <button className={`tab-mini ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pendientes</button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Nombre</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Sin transacciones</td></tr>
                  ) : filteredTx.map(tx => {
                    const Icon = METODO_ICON[tx.method] || CreditCard;
                    return (
                      <tr key={tx.id}>
                        <td><span className={`type-badge type-${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                        <td><span className="donor-cell">{tx.name}</span></td>
                        <td>
                          <span className="method-badge">
                            <Icon size={14} /> {tx.method}
                          </span>
                        </td>
                        <td><span className="amount-cell">{fmt(tx.amount)}</span></td>
                        <td>
                          <span className={`status-badge status-${tx.status}`}>
                            {tx.status === 'completed' ? <><Check size={12} /> Completado</> : <><Clock size={12} /> Pendiente</>}
                          </span>
                        </td>
                        <td><span className="date-cell">{tx.date}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <DonationFormModal onClose={() => setShowForm(false)} onSubmit={handleSaveDonation} miembros={miembros} />
      )}

      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} data={filteredTx} onExport={handleExport} />
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} type={toast.type} />}
    </div>
  );
}

function DonationFormModal({ onClose, onSubmit, miembros }) {
  const [form, setForm] = useState({ type: 'Diezmo', monto: '', metodo: 'Transferencia Bancaria', nombre: '', telefono: '', email: '', miembro_id: '', estado: 'completado' });

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header" style={{ borderTopColor: '#C9A84C' }}>
          <h2>Registrar Ingreso</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="login-field">
            <label>Tipo de Ingreso</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="Diezmo">Diezmo</option>
              <option value="Ofrenda">Ofrenda</option>
              <option value="Especial">Denario</option>
            </select>
          </div>

          {form.type === 'Diezmo' && (
            <div className="login-field">
              <label>Miembro</label>
              <select value={form.miembro_id} onChange={e => setForm({ ...form, miembro_id: e.target.value })}>
                <option value="">— Seleccionar miembro —</option>
                {miembros.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                ))}
              </select>
            </div>
          )}

          {form.type === 'Especial' && (
            <>
              <div className="login-field">
                <label>Miembro</label>
                <select value={form.miembro_id} onChange={e => setForm({ ...form, miembro_id: e.target.value })}>
                  <option value="">— Seleccionar miembro —</option>
                  {miembros.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                  ))}
                </select>
              </div>
              <div className="login-field">
                <label>Descripción</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Ofrenda especial, Construcción..." />
              </div>
            </>
          )}

          {form.type === 'Ofrenda' && (
            <div className="login-field">
              <label>Descripción</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Ofrenda domingo, Fondo de construcción..." />
            </div>
          )}

          <div className="login-field">
            <label>Monto (COP)</label>
            <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} required placeholder="Ej: 100000" min="1000" />
          </div>

          <div className="login-field">
            <label>Método de Pago</label>
            <select value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })}>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Billetera Digital">Billetera Digital</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {form.type === 'Especial' && (
            <>
              <div className="login-field">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  <option value="completado">Completado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div className="login-field">
                <label>Teléfono (opcional)</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="300 000 0000" />
              </div>
              <div className="login-field">
                <label>Email (opcional)</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
