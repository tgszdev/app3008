'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User,
  FileText,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';
import type { Timesheet } from '@/types/timesheet';

interface TicketWithTimesheets {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  timesheets: Timesheet[];
  pendingCount: number;
  totalHours: number;
  approvedHours: number;
}

export default function TimesheetAdminPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<TicketWithTimesheets[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithTimesheets | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    can_submit_timesheet: false,
    can_approve_timesheet: false
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  // Additional filters
  const [filterTicketId, setFilterTicketId] = useState<string>('all');
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    fetchData();
  }, [session, filter, filterTicketId, filterUserId, filterDateRange]);

  const fetchData = async () => {
    if (!session?.user) return;

    try {
      // Check permissions
      const permRes = await fetch('/api/timesheets/permissions');
      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData);
        
        if (!permData.can_approve_timesheet) {
          return;
        }
      }

      // Build URL with filters
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (filterTicketId !== 'all') params.append('ticket_id', filterTicketId);
      if (filterUserId !== 'all') params.append('user_id', filterUserId);
      if (filterDateRange.start) params.append('start_date', format(filterDateRange.start, 'yyyy-MM-dd'));
      if (filterDateRange.end) params.append('end_date', format(filterDateRange.end, 'yyyy-MM-dd'));
      
      const url = `/api/timesheets${params.toString() ? '?' + params.toString() : ''}`;
      const timesheetsRes = await fetch(url);
      if (timesheetsRes.ok) {
        const timesheetsData: Timesheet[] = await timesheetsRes.json();
        
        // Extract unique users for filter
        const usersMap = new Map<string, { id: string; name: string; email: string }>();
        timesheetsData.forEach(timesheet => {
          if (timesheet.user && !usersMap.has(timesheet.user.id)) {
            usersMap.set(timesheet.user.id, {
              id: timesheet.user.id,
              name: timesheet.user.name || 'Unknown',
              email: timesheet.user.email
            });
          }
        });
        setAllUsers(Array.from(usersMap.values()));
        
        // Group timesheets by ticket
        const ticketMap = new Map<string, TicketWithTimesheets>();
        
        timesheetsData.forEach(timesheet => {
          if (!timesheet.ticket) return;
          
          const ticketId = timesheet.ticket_id;
          if (!ticketMap.has(ticketId)) {
            ticketMap.set(ticketId, {
              id: ticketId,
              title: timesheet.ticket.title,
              status: timesheet.ticket.status,
              priority: timesheet.ticket.priority,
              timesheets: [],
              pendingCount: 0,
              totalHours: 0,
              approvedHours: 0
            });
          }
          
          const ticket = ticketMap.get(ticketId)!;
          ticket.timesheets.push(timesheet);
          ticket.totalHours += parseFloat(timesheet.hours_worked.toString());
          
          if (timesheet.status === 'pending') {
            ticket.pendingCount++;
          } else if (timesheet.status === 'approved') {
            ticket.approvedHours += parseFloat(timesheet.hours_worked.toString());
          }
        });
        
        setTickets(Array.from(ticketMap.values()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timesheet: Timesheet) => {
    try {
      const response = await fetch(`/api/timesheets/${timesheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      if (response.ok) {
        toast.success('Apontamento aprovado');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao aprovar apontamento');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast.error('Erro ao aprovar apontamento');
    }
  };

  const handleReject = async () => {
    if (!selectedTimesheet || !rejectionReason.trim()) {
      toast.error('Informe o motivo da recusa');
      return;
    }

    try {
      const response = await fetch(`/api/timesheets/${selectedTimesheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected',
          rejection_reason: rejectionReason 
        })
      });

      if (response.ok) {
        toast.success('Apontamento recusado');
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedTimesheet(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao recusar apontamento');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      toast.error('Erro ao recusar apontamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Recusado</Badge>;
      default:
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
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

  if (!permissions.can_approve_timesheet) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para aprovar apontamentos de horas.
              Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Administração de Apontamentos</h1>
        <p className="text-muted-foreground">Aprove ou recuse apontamentos de horas da equipe</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Recusado</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Usuário</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              >
                <option value="all">Todos os Usuários</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Ticket Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ticket</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterTicketId}
                onChange={(e) => setFilterTicketId(e.target.value)}
              >
                <option value="all">Todos os Tickets</option>
                {tickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filterDateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateRange.start ? (
                      format(filterDateRange.start, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione..."
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDateRange.start || undefined}
                    onSelect={(date) => setFilterDateRange(prev => ({ ...prev, start: date || null }))}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Range End */}
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filterDateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateRange.end ? (
                      format(filterDateRange.end, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione..."
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDateRange.end || undefined}
                    onSelect={(date) => setFilterDateRange(prev => ({ ...prev, end: date || null }))}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilter('pending');
                setFilterTicketId('all');
                setFilterUserId('all');
                setFilterDateRange({ start: null, end: null });
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Recusados</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map(ticket => (
              <Card 
                key={ticket.id} 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  ticket.pendingCount > 0 ? 'ring-2 ring-yellow-500' : ''
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    {ticket.pendingCount > 0 && (
                      <Badge className="bg-yellow-500">
                        {ticket.pendingCount} Pendente{ticket.pendingCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{ticket.status}</Badge>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de horas:</span>
                      <span className="font-semibold">{ticket.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horas aprovadas:</span>
                      <span className="font-semibold text-green-600">
                        {ticket.approvedHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Apontamentos:</span>
                      <span className="font-semibold">{ticket.timesheets.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum apontamento {filter !== 'all' ? filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovado' : 'recusado' : ''} encontrado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Detalhes do Ticket Selecionado */}
      {selectedTicket && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedTicket.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{selectedTicket.status}</Badge>
              <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                {selectedTicket.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTicket.timesheets
                .sort((a, b) => {
                  // Ordenar pendentes primeiro, depois por data
                  if (a.status === 'pending' && b.status !== 'pending') return -1;
                  if (a.status !== 'pending' && b.status === 'pending') return 1;
                  return new Date(b.work_date).getTime() - new Date(a.work_date).getTime();
                })
                .map(timesheet => (
                <Card key={timesheet.id} className={timesheet.status === 'pending' ? 'border-yellow-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted rounded-full p-2">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">{timesheet.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{timesheet.user?.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(timesheet.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(timesheet.work_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{timesheet.hours_worked}h</span>
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded p-3">
                        <p className="text-sm">{timesheet.activity_description}</p>
                      </div>

                      {timesheet.status === 'rejected' && timesheet.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm text-red-700">
                            <strong>Motivo da recusa:</strong> {timesheet.rejection_reason}
                          </p>
                        </div>
                      )}

                      {timesheet.status === 'approved' && timesheet.approver && (
                        <div className="text-sm text-muted-foreground">
                          Aprovado por {timesheet.approver.name} em{' '}
                          {format(new Date(timesheet.approved_at!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    {timesheet.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => handleApprove(timesheet)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button 
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            setSelectedTimesheet(timesheet);
                            setShowRejectDialog(true);
                          }}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Recusa */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Apontamento</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. Esta informação será enviada ao colaborador.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTimesheet && (
            <div className="space-y-4">
              <div className="bg-muted rounded p-3 space-y-2">
                <p className="text-sm">
                  <strong>Colaborador:</strong> {selectedTimesheet.user?.name}
                </p>
                <p className="text-sm">
                  <strong>Data:</strong> {format(new Date(selectedTimesheet.work_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-sm">
                  <strong>Horas:</strong> {selectedTimesheet.hours_worked}h
                </p>
                <p className="text-sm">
                  <strong>Atividade:</strong> {selectedTimesheet.activity_description}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Motivo da Recusa *</label>
                <Textarea
                  placeholder="Explique o motivo da recusa..."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedTimesheet(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}