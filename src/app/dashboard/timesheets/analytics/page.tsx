'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Clock, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Statistics {
  summary: {
    total_hours: number;
    approved_hours: number;
    pending_hours: number;
    rejected_hours: number;
    total_entries: number;
    unique_tickets: number;
    unique_users: number;
    period: {
      start_date: string;
      end_date: string;
    };
  };
  statistics: any[];
  raw_data: any[];
}

export default function TimesheetAnalyticsPage() {
  const { data: session } = useSession();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [groupBy, setGroupBy] = useState<'user' | 'ticket' | 'date' | 'department'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState({
    can_submit_timesheet: false,
    can_approve_timesheet: false
  });

  useEffect(() => {
    fetchData();
  }, [session, dateRange, groupBy, selectedUserId]);

  const fetchData = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      // Check permissions
      const permRes = await fetch('/api/timesheets/permissions');
      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData);
      }

      // Fetch users if admin
      if (session.user.role === 'admin') {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      }

      // Build query params
      const params = new URLSearchParams({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
        group_by: groupBy
      });

      if (selectedUserId) {
        params.append('user_id', selectedUserId);
      } else if (!permissions.can_approve_timesheet) {
        params.append('user_id', session.user.id);
      }

      // Fetch statistics
      const statsRes = await fetch(`/api/timesheets/statistics?${params}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const getApprovalRate = () => {
    if (!statistics || statistics.summary.total_hours === 0) return 0;
    return ((statistics.summary.approved_hours / statistics.summary.total_hours) * 100).toFixed(1);
  };

  const getPieChartData = () => {
    if (!statistics) return [];
    
    return [
      { name: 'Aprovadas', value: statistics.summary.approved_hours, color: '#10b981' },
      { name: 'Pendentes', value: statistics.summary.pending_hours, color: '#eab308' },
      { name: 'Recusadas', value: statistics.summary.rejected_hours, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    if (!statistics) return [];
    
    return statistics.statistics.slice(0, 10).map(item => ({
      name: item.label,
      aprovadas: item.approved_hours,
      pendentes: item.pending_hours,
      recusadas: item.rejected_hours,
      total: item.total_hours
    }));
  };

  const getTimelineData = () => {
    if (!statistics || groupBy !== 'date') return [];
    
    return statistics.statistics.map(item => ({
      date: format(new Date(item.key), 'dd/MM', { locale: ptBR }),
      horas: item.total_hours
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics de Apontamentos</h1>
        <p className="text-muted-foreground">Visualize métricas e tendências dos apontamentos de horas</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Agrupar por</label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="department">Departamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {permissions.can_approve_timesheet && (
              <div>
                <label className="text-sm font-medium mb-2 block">Usuário</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={fetchData} className="w-full">
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(statistics?.summary.total_hours || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.summary.total_entries || 0} apontamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getApprovalRate()}%</div>
            <Progress value={parseFloat(getApprovalRate())} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.summary.unique_tickets || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tickets com apontamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.summary.unique_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Gráfico de Pizza - Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatHours(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatHours(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Top 10 */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - {groupBy === 'user' ? 'Colaboradores' : groupBy === 'ticket' ? 'Tickets' : groupBy === 'department' ? 'Departamentos' : 'Dias'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getBarChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => formatHours(value)} />
                <Legend />
                <Bar dataKey="aprovadas" fill="#10b981" name="Aprovadas" />
                <Bar dataKey="pendentes" fill="#eab308" name="Pendentes" />
                <Bar dataKey="recusadas" fill="#ef4444" name="Recusadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Horas (apenas quando agrupado por data) */}
      {groupBy === 'date' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTimelineData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatHours(value)} />
                <Line 
                  type="monotone" 
                  dataKey="horas" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Horas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    {groupBy === 'user' ? 'Colaborador' : groupBy === 'ticket' ? 'Ticket' : groupBy === 'department' ? 'Departamento' : 'Data'}
                  </th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Aprovadas</th>
                  <th className="text-right p-2">Pendentes</th>
                  <th className="text-right p-2">Recusadas</th>
                  <th className="text-right p-2">Taxa Aprovação</th>
                  <th className="text-right p-2">Apontamentos</th>
                </tr>
              </thead>
              <tbody>
                {statistics?.statistics.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2">{item.label}</td>
                    <td className="text-right p-2 font-semibold">
                      {formatHours(item.total_hours)}
                    </td>
                    <td className="text-right p-2 text-green-600">
                      {formatHours(item.approved_hours)}
                    </td>
                    <td className="text-right p-2 text-yellow-600">
                      {formatHours(item.pending_hours)}
                    </td>
                    <td className="text-right p-2 text-red-600">
                      {formatHours(item.rejected_hours)}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant={parseFloat(item.approval_rate) >= 80 ? 'default' : 'secondary'}>
                        {item.approval_rate}%
                      </Badge>
                    </td>
                    <td className="text-right p-2">{item.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}