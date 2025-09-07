'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Plus, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import type { Timesheet } from '@/types/timesheet';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  assignee_id: string;
}

export default function TimesheetsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedRejection, setSelectedRejection] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    can_submit_timesheet: false,
    can_approve_timesheet: false
  });

  // Form states
  const [activityDescription, setActivityDescription] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [workDate, setWorkDate] = useState<Date>(new Date());
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterTicketId, setFilterTicketId] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session?.user) return;

    try {
      // Fetch user permissions
      const permRes = await fetch('/api/timesheets/permissions');
      console.log('Permission response status:', permRes.status);
      if (permRes.ok) {
        const permData = await permRes.json();
        console.log('Permission data:', permData);
        setPermissions(permData);
      } else {
        console.error('Failed to fetch permissions:', await permRes.text());
        // Set default permissions for admin
        if (session.user.role === 'admin') {
          setPermissions({
            can_submit_timesheet: true,
            can_approve_timesheet: true
          });
        }
      }

      // Fetch all tickets (will be filtered by API based on user role)
      // We'll get tickets the user created or is assigned to
      const ticketsRes = await fetch(`/api/tickets`);
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        // Filter to show tickets that are either assigned to user or created by user
        const userTickets = ticketsData.filter((t: any) => 
          (t.assigned_to === session.user.id || 
           t.assignee_id === session.user.id || 
           t.created_by === session.user.id) &&
          t.status !== 'closed'
        );
        setTickets(userTickets);
      }

      // Fetch timesheets
      const timesheetsRes = await fetch(`/api/timesheets?user_id=${session.user.id}`);
      if (timesheetsRes.ok) {
        const timesheetsData = await timesheetsRes.json();
        setTimesheets(timesheetsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!selectedTicket || !activityDescription || !hoursWorked || !workDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const url = editingTimesheet 
        ? `/api/timesheets/${editingTimesheet.id}`
        : '/api/timesheets';
      
      const method = editingTimesheet ? 'PATCH' : 'POST';
      
      const body = editingTimesheet
        ? {
            activity_description: activityDescription,
            hours_worked: parseFloat(hoursWorked),
            work_date: format(workDate, 'yyyy-MM-dd')
          }
        : {
            ticket_id: selectedTicket.id,
            activity_description: activityDescription,
            hours_worked: parseFloat(hoursWorked),
            work_date: format(workDate, 'yyyy-MM-dd')
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingTimesheet ? 'Apontamento atualizado' : 'Apontamento criado com sucesso');
        setShowAddDialog(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar apontamento');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast.error('Erro ao salvar apontamento');
    }
  };

  const handleDeleteTimesheet = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este apontamento?')) return;

    try {
      const response = await fetch(`/api/timesheets/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Apontamento excluído');
        fetchData();
      } else {
        toast.error('Erro ao excluir apontamento');
      }
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast.error('Erro ao excluir apontamento');
    }
  };

  const resetForm = () => {
    setActivityDescription('');
    setHoursWorked('');
    setWorkDate(new Date());
    setEditingTimesheet(null);
  };

  const openEditDialog = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    setSelectedTicket(tickets.find(t => t.id === timesheet.ticket_id) || null);
    setActivityDescription(timesheet.activity_description);
    setHoursWorked(timesheet.hours_worked.toString());
    setWorkDate(new Date(timesheet.work_date));
    setShowAddDialog(true);
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

  const getTicketTimesheets = (ticketId: string) => {
    return timesheets.filter(t => t.ticket_id === ticketId);
  };

  const getTotalHours = (ticketId: string) => {
    return getTicketTimesheets(ticketId)
      .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
      .toFixed(1);
  };

  const getApprovedHours = (ticketId: string) => {
    return getTicketTimesheets(ticketId)
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
      .toFixed(1);
  };

  // Filter timesheets based on selected filters
  const getFilteredTimesheets = () => {
    let filtered = [...timesheets];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Filter by ticket
    if (filterTicketId !== 'all') {
      filtered = filtered.filter(t => t.ticket_id === filterTicketId);
    }

    // Filter by date range
    if (filterDateRange.start) {
      filtered = filtered.filter(t => new Date(t.work_date) >= filterDateRange.start!);
    }
    if (filterDateRange.end) {
      filtered = filtered.filter(t => new Date(t.work_date) <= filterDateRange.end!);
    }

    return filtered;
  };

  const filteredTimesheets = getFilteredTimesheets();

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

  if (!permissions.can_submit_timesheet) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para fazer apontamentos de horas.
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
        <h1 className="text-3xl font-bold">Apontamento de Horas</h1>
        <p className="text-muted-foreground">Registre suas horas trabalhadas nos tickets</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Recusado</option>
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
                setFilterStatus('all');
                setFilterTicketId('all');
                setFilterDateRange({ start: null, end: null });
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map(ticket => {
          const ticketTimesheets = getTicketTimesheets(ticket.id);
          const hasPending = ticketTimesheets.some(t => t.status === 'pending');

          return (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  {hasPending && (
                    <Badge className="bg-yellow-500">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{ticket.status}</Badge>
                  <Badge variant="outline">{ticket.priority}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de horas:</span>
                    <span className="font-semibold">{getTotalHours(ticket.id)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas aprovadas:</span>
                    <span className="font-semibold text-green-600">{getApprovedHours(ticket.id)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Apontamentos:</span>
                    <span className="font-semibold">{ticketTimesheets.length}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTicket(ticket);
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Apontamento
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalhes do Ticket Selecionado */}
      {selectedTicket && !showAddDialog && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedTicket.title}</CardTitle>
                <p className="text-muted-foreground mt-2">{selectedTicket.description}</p>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Apontamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTicketTimesheets(selectedTicket.id).map(timesheet => (
                <Card key={timesheet.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(timesheet.work_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <Clock className="w-4 h-4 text-muted-foreground ml-4" />
                          <span className="text-sm font-semibold">{timesheet.hours_worked}h</span>
                          {getStatusBadge(timesheet.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {timesheet.activity_description}
                        </p>
                        {timesheet.status === 'rejected' && timesheet.rejection_reason && (
                          <div 
                            className="bg-red-50 border border-red-200 rounded p-2 mt-2 cursor-pointer"
                            onClick={() => {
                              setSelectedRejection(timesheet);
                              setShowRejectionDialog(true);
                            }}
                          >
                            <p className="text-sm text-red-700">
                              <strong>Motivo da recusa:</strong> {timesheet.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>
                      {timesheet.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(timesheet)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTimesheet(timesheet.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Adicionar/Editar Apontamento */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTimesheet ? 'Editar Apontamento' : 'Novo Apontamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data do Trabalho *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !workDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {workDate ? (
                      <>
                        {format(workDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={workDate}
                    onSelect={(date) => date && setWorkDate(date)}
                    locale={ptBR}
                    disabled={(date) => date > new Date() || date < new Date(new Date().setMonth(new Date().getMonth() - 3))}
                    modifiers={{
                      today: new Date()
                    }}
                    modifiersStyles={{
                      today: {
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'rgb(59, 130, 246)'
                      }
                    }}
                    footer={
                      <div className="flex justify-between px-2 py-2 text-xs text-muted-foreground">
                        <button
                          onClick={() => setWorkDate(new Date())}
                          className="hover:text-primary"
                        >
                          Hoje
                        </button>
                        <button
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            setWorkDate(yesterday);
                          }}
                          className="hover:text-primary"
                        >
                          Ontem
                        </button>
                      </div>
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Horas Trabalhadas *</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="Ex: 2.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHoursWorked('1')}
                  >
                    1h
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHoursWorked('2')}
                  >
                    2h
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHoursWorked('4')}
                  >
                    4h
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHoursWorked('8')}
                  >
                    8h
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use decimais para minutos: 1.5 = 1h30min, 2.25 = 2h15min
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Descrição da Atividade *</label>
              <Textarea
                placeholder="Descreva detalhadamente as atividades realizadas..."
                rows={4}
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                className="resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Seja específico sobre o que foi feito
                </p>
                <p className="text-xs text-muted-foreground">
                  {activityDescription.length}/500 caracteres
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitTimesheet}>
              {editingTimesheet ? 'Salvar Alterações' : 'Adicionar Apontamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Motivo de Recusa */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apontamento Recusado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Data: {selectedRejection && format(new Date(selectedRejection.work_date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Horas: {selectedRejection?.hours_worked}h
              </p>
              <p className="text-sm mb-4">
                {selectedRejection?.activity_description}
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm font-medium text-red-700 mb-1">Motivo da Recusa:</p>
                <p className="text-sm text-red-600">
                  {selectedRejection?.rejection_reason}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRejectionDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}