'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  UserPlus, 
  Trash2, 
  Check, 
  AlertCircle,
  Users,
  Shield,
  Clock,
  CheckSquare,
  Square,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Permission {
  id: string;
  user_id: string;
  can_submit_timesheet: boolean;
  can_approve_timesheet: boolean;
  user?: User;
}

interface TimesheetPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimesheetPermissionsModalV2({ isOpen, onClose }: TimesheetPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Map<string, { submit: boolean; approve: boolean }>>(new Map());

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all permissions
      const permRes = await fetch('/api/timesheets/permissions?all=true');
      if (permRes.ok) {
        const permData = await permRes.json();
        const perms = Array.isArray(permData) ? permData : [];
        setPermissions(perms);
        
        // Initialize local permissions map
        const permMap = new Map();
        perms.forEach((p: Permission) => {
          permMap.set(p.user_id, {
            submit: p.can_submit_timesheet,
            approve: p.can_approve_timesheet
          });
        });
        setLocalPermissions(permMap);
      }

      // Fetch users
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
        
        // Extract unique departments
        const uniqueDepts = [...new Set(usersData.map((u: User) => u.department).filter(Boolean))] as string[];
        setDepartments(uniqueDepts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (userId: string, type: 'submit' | 'approve', value: boolean) => {
    const newMap = new Map(localPermissions);
    const current = newMap.get(userId) || { submit: false, approve: false };
    
    if (type === 'submit') {
      current.submit = value;
    } else {
      current.approve = value;
    }
    
    newMap.set(userId, current);
    setLocalPermissions(newMap);
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      
      const updates: Promise<any>[] = [];
      
      localPermissions.forEach((perms, userId) => {
        updates.push(
          fetch('/api/timesheets/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              can_submit_timesheet: perms.submit,
              can_approve_timesheet: perms.approve
            })
          })
        );
      });
      
      await Promise.all(updates);
      toast.success('Permissões salvas com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = (action: 'enable_submit' | 'enable_approve' | 'disable_all' | 'enable_all') => {
    const newMap = new Map(localPermissions);
    
    filteredUsers.forEach(user => {
      const current = newMap.get(user.id) || { submit: false, approve: false };
      
      switch (action) {
        case 'enable_submit':
          current.submit = true;
          break;
        case 'enable_approve':
          current.approve = true;
          break;
        case 'disable_all':
          current.submit = false;
          current.approve = false;
          break;
        case 'enable_all':
          current.submit = true;
          current.approve = true;
          break;
      }
      
      newMap.set(user.id, current);
    });
    
    setLocalPermissions(newMap);
    toast.success('Permissões atualizadas localmente. Clique em Salvar para confirmar.');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const getUserPermissions = (userId: string) => {
    return localPermissions.get(userId) || { submit: false, approve: false };
  };

  const removePermissions = async (userId: string) => {
    try {
      const response = await fetch(`/api/timesheets/permissions/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Permissões removidas');
        const newMap = new Map(localPermissions);
        newMap.delete(userId);
        setLocalPermissions(newMap);
        fetchData();
      } else {
        toast.error('Erro ao remover permissões');
      }
    } catch (error) {
      console.error('Error removing permissions:', error);
      toast.error('Erro ao remover permissões');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              Permissões de Apontamento de Horas
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure quem pode fazer apontamentos e aprovar horas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Departamentos</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('enable_submit')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Permitir Apontar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('enable_approve')}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Permitir Aprovar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('enable_all')}
              >
                <Check className="w-4 h-4 mr-2" />
                Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('disable_all')}
              >
                <X className="w-4 h-4 mr-2" />
                Nenhuma
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Carregando...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const perms = getUserPermissions(user.id);
                  const hasAnyPermission = perms.submit || perms.approve;
                  
                  return (
                    <Card 
                      key={user.id} 
                      className={`transition-all ${hasAnyPermission ? 'ring-2 ring-blue-500/20' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {user.role === 'admin' ? 'Administrador' : user.role === 'analyst' ? 'Analista' : 'Usuário'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">{user.department || 'Sem departamento'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.submit}
                                  onChange={(e) => handlePermissionChange(user.id, 'submit', e.target.checked)}
                                  className="sr-only"
                                />
                                <div className={`
                                  w-10 h-6 rounded-full transition-colors relative
                                  ${perms.submit ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                                `}>
                                  <div className={`
                                    absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                                    ${perms.submit ? 'translate-x-4' : 'translate-x-0'}
                                  `} />
                                </div>
                                <span className="ml-2 text-sm">Fazer Apontamento</span>
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.approve}
                                  onChange={(e) => handlePermissionChange(user.id, 'approve', e.target.checked)}
                                  className="sr-only"
                                />
                                <div className={`
                                  w-10 h-6 rounded-full transition-colors relative
                                  ${perms.approve ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                                `}>
                                  <div className={`
                                    absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                                    ${perms.approve ? 'translate-x-4' : 'translate-x-0'}
                                  `} />
                                </div>
                                <span className="ml-2 text-sm">Aprovar Apontamento</span>
                              </label>
                            </div>
                            
                            {hasAnyPermission && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePermissions(user.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredUsers.length} usuário(s) • {localPermissions.size} com permissões
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={savePermissions} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}