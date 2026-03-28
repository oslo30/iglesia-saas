import { useEffect, useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Calendar, Filter, ChevronDown, Eye, Users, DollarSign, Heart, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { supabase } from '../supabase';
import './Reports.css';

const COLORS = ['#1E3A5F', '#94A3B8', '#C9A84C', '#10B981'];

function fmt(v) { return '$' + Number(v || 0).toLocaleString('es-CO'); }
function fmtM(v) { return '$' + (Number(v || 0) / 1000000).toFixed(0) + 'M'; }

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data
  const [attendanceData, setAttendanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [membersStats, setMembersStats] = useState({ total: 0, activos: 0, inactivos: 0, visitantes: 0 });
  const [groupsData, setGroupsData] = useState([]);

  useEffect(() => {
    loadData();
  }, [dateRange, refreshKey]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    let desde;
    if (dateRange === '1m') desde = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    else if (dateRange === '3m') desde = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    else if (dateRange === '6m') desde = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    else desde = new Date(now.getFullYear(), 0, 1);

    const [attRes, dzRes, miembrosRes] = await Promise.all([
      supabase.from('registros_asistencia').select('*, servicios(nombre)').gte('created_at', desde.toISOString()).order('created_at'),
      supabase.from('diezmos').select('*').gte('created_at', desde.toISOString()),
      supabase.from('miembros').select('estado'),
    ]);

    // Attendance data grouped by month
    const attByMonth = {};
    (attRes.data || []).forEach(r => {
      const k = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short' });
      if (!attByMonth[k]) attByMonth[k] = { adultos: 0, ninos: 0, amigos: 0, total: 0 };
      attByMonth[k].adultos += Number(r.adultos || 0);
      attByMonth[k].ninos += Number(r.ninos || 0);
      attByMonth[k].amigos += Number(r.amigos || 0);
      attByMonth[k].total += Number(r.total || 0);
    });
    setAttendanceData(Object.entries(attByMonth).sort((a, b) => {
      const order = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    }).map(([name, data]) => ({ name, ...data })));

    // Revenue grouped by month
    const revByMonth = {};
    (dzRes.data || []).forEach(d => {
      const k = d.mes;
      if (!revByMonth[k]) revByMonth[k] = { diezmos: 0, ofrendas: 0, especiales: 0 };
      revByMonth[k].diezmos += Number(d.monto);
    });
    setRevenueData(Object.entries(revByMonth).sort((a, b) => {
      const order = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    }).map(([name, data]) => ({ name, ...data })));

    // Members stats
    const mbs = miembrosRes.data || [];
    setMembersStats({
      total: mbs.length,
      activos: mbs.filter(m => m.estado === 'activo').length,
      inactivos: mbs.filter(m => m.estado === 'inactivo').length,
      visitantes: 0,
    });

    setGroupsData([
      { name: 'Activos', value: mbs.filter(m => m.estado === 'activo').length, color: '#1E3A5F' },
      { name: 'Inactivos', value: mbs.filter(m => m.estado === 'inactivo').length, color: '#94A3B8' },
    ]);

    setLoading(false);
  }

  const totalAttendance = attendanceData.reduce((s, d) => s + (d.total || 0), 0);
  const avgAttendance = attendanceData.length ? Math.round(totalAttendance / attendanceData.length) : 0;
  const totalRevenue = revenueData.reduce((s, d) => s + (d.diezmos || 0), 0);

  const membershipData = [
    { name: 'Miembros Activos', value: membersStats.activos, color: '#1E3A5F' },
    { name: 'Inactivos', value: membersStats.inactivos, color: '#94A3B8' },
    { name: 'Visitantes', value: membersStats.visitantes, color: '#C9A84C' },
  ];

  return (
    <div className="reports-screen">
      <div className="reports-header">
        <div>
          <h2>Reportes y Análisis</h2>
          <p className="text-muted">Genera y exporta reportes detallados de la iglesia</p>
        </div>
        <div className="header-actions">
          <div className="date-range-selector">
            <button className={dateRange === '1m' ? 'active' : ''} onClick={() => setDateRange('1m')}>1M</button>
            <button className={dateRange === '3m' ? 'active' : ''} onClick={() => setDateRange('3m')}>3M</button>
            <button className={dateRange === '6m' ? 'active' : ''} onClick={() => setDateRange('6m')}>6M</button>
            <button className={dateRange === '1y' ? 'active' : ''} onClick={() => setDateRange('1y')}>1Y</button>
          </div>
          <button className="btn-export"><Download size={16} /> Exportar</button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="report-types-grid">
        {[
          { id: 'attendance', label: 'Resumen de Asistencia', icon: Users, desc: 'Desglose de asistencia semanal y mensual' },
          { id: 'financial', label: 'Estado Financiero', icon: DollarSign, desc: 'Reporte de diezmos, ofrendas y donaciones' },
          { id: 'membership', label: 'Reporte de Membresía', icon: Heart, desc: 'Estadísticas de miembros y crecimiento' },
        ].map(r => (
          <button key={r.id} className={`report-type-card ${selectedReport === r.id ? 'active' : ''}`} onClick={() => setSelectedReport(r.id)}>
            <div className="report-type-icon"><r.icon size={20} /></div>
            <div className="report-type-info">
              <span className="report-type-label">{r.label}</span>
              <span className="report-type-desc">{r.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* KPI Summary */}
      <div className="report-kpis">
        <div className="kpi-summary-card">
          <div className="kpi-icon-wrap" style={{ background: '#1E3A5F15', color: '#1E3A5F' }}><Users size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Asistencia</span>
            <span className="kpi-big-value">{totalAttendance.toLocaleString()}</span>
          </div>
        </div>
        <div className="kpi-summary-card">
          <div className="kpi-icon-wrap" style={{ background: '#10B98115', color: '#10B981' }}><TrendingUp size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Promedio por Servicio</span>
            <span className="kpi-big-value">{avgAttendance.toLocaleString()}</span>
          </div>
        </div>
        <div className="kpi-summary-card">
          <div className="kpi-icon-wrap" style={{ background: '#C9A84C15', color: '#C9A84C' }}><DollarSign size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Ingresos</span>
            <span className="kpi-big-value">{fmtM(totalRevenue)}</span>
          </div>
        </div>
        <div className="kpi-summary-card">
          <div className="kpi-icon-wrap" style={{ background: '#8B5CF615', color: '#8B5CF6' }}><Heart size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Miembros</span>
            <span className="kpi-big-value">{membersStats.total}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>Cargando reportes...</div>
      ) : (
        <div className="charts-row">
          <div className="card chart-card flex-2">
            <div className="card-header">
              <div>
                <h3>{selectedReport === 'attendance' ? 'Tendencias de Asistencia' : selectedReport === 'financial' ? 'Resumen de Ingresos' : 'Membresía'}</h3>
                <p className="text-muted">Análisis comparativo en el tiempo</p>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                {selectedReport === 'financial' ? (
                  <BarChart data={revenueData.length ? revenueData : [{ name: '—', diezmos: 0, ofrendas: 0, especiales: 0 }]} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000000}M`} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} formatter={(v) => fmt(v)} />
                    <Bar dataKey="diezmos" name="Diezmos" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ofrendas" name="Ofrendas" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={attendanceData.length ? attendanceData : [{ name: '—', adultos: 0, ninos: 0, amigos: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} />
                    <Area type="monotone" dataKey="total" name="Total" fill="#1E3A5F20" stroke="#1E3A5F" strokeWidth={2} />
                    <Line type="monotone" dataKey="adultos" name="Adultos" stroke="#1E3A5F" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ninos" name="Niños" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              {selectedReport === 'financial' ? (
                <><span><i style={{ background: '#1E3A5F' }} />Diezmos</span><span><i style={{ background: '#C9A84C' }} />Ofrendas</span></>
              ) : (
                <><span><i style={{ background: '#1E3A5F' }} />Adultos</span><span><i style={{ background: '#10B981' }} />Niños</span><span><i style={{ background: '#1E3A5F80' }} />Total</span></>
              )}
            </div>
          </div>

          <div className="card chart-card flex-1">
            <div className="card-header">
              <h3>{selectedReport === 'membership' ? 'Membresía' : 'Demografía'}</h3>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={selectedReport === 'membership' ? membershipData : groupsData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {(selectedReport === 'membership' ? membershipData : groupsData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend">
              {(selectedReport === 'membership' ? membershipData : groupsData).slice(0, 5).map((item, i) => (
                <div key={i} className="pie-legend-item">
                  <i style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <span className="pie-legend-val">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
