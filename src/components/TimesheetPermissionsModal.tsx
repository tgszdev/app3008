'use client';

import { useState, useEffect } from 'react';
import { X, Save, UserPlus, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export default function TimesheetPermissionsModal({ isOpen, onClose }: TimesheetPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [bulkAction, setBulkAction] = useState<'department' | 'role' | ''>('');
  const [bulkValue, setBulkValue] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles] = useState(['admin', 'analyst', 'user']);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all permissions for admin modal
      const permRes = await fetch('/api/timesheets/permissions?all=true');
      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(Array.isArray(permData) ? permData : []);
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

  const handlePermissionToggle = async (userId: string, field: 'can_submit_timesheet' | 'can_approve_timesheet') => {
    try {
      const existingPermission = permissions.find(p => p.user_id === userId);
      const currentValue = existingPermission?.[field] || false;
      
      const response = await fetch('/api/timesheets/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          [field]: !currentValue
        })
      });

      if (response.ok) {
        toast.success('Permissão atualizada');
        fetchData();
      } else {
        toast.error('Erro ao atualizar permissão');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário');
      return;
    }

    try {
      const response = await fetch('/api/timesheets/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser,
          can_submit_timesheet: true,
          can_approve_timesheet: false
        })
      });

      if (response.ok) {
        toast.success('Usuário adicionado');
        setSelectedUser('');
        fetchData();
      } else {
        toast.error('Erro ao adicionar usuário');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Erro ao adicionar usuário');
    }
  };

  const handleBulkUpdate = async (canSubmit: boolean, canApprove: boolean) => {
    if (!bulkAction || !bulkValue) {
      toast.error('Selecione um critério para atualização em massa');
      return;
    }

    try {
      const body: any = {
        can_submit_timesheet: canSubmit,
        can_approve_timesheet: canApprove
      };

      if (bulkAction === 'department') {
        body.department = bulkValue;
      } else if (bulkAction === 'role') {
        body.role = bulkValue;
      }

      const response = await fetch('/api/timesheets/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Permissões atualizadas');
        setBulkAction('');
        setBulkValue('');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar permissões');
      }
    } catch (error) {
      console.error('Error bulk updating:', error);
      toast.error('Erro ao atualizar permissões');
    }
  };

  const handleRemovePermission = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover as permissões deste usuário?')) return;

    try {
      const response = await fetch(`/api/timesheets/permissions?user_id=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Permissões removidas');
        fetchData();
      } else {
        toast.error('Erro ao remover permissões');
      }
    } catch (error) {
      console.error('Error removing permission:', error);
      toast.error('Erro ao remover permissões');
    }
  };

  const getUserPermission = (userId: string) => {
    return permissions.find(p => p.user_id === userId);
  };

  const availableUsers = users.filter(u => !permissions.some(p => p.user_id === u.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Permissões de Apontamento de Horas
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Configure quem pode fazer apontamentos e aprovar horas
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Adicionar Novo Usuário */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Adicionar Usuário
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione um usuário...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email} ({user.department || 'Sem departamento'})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddUser}
                disabled={!selectedUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Atualização em Massa */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Atualização em Massa
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    setBulkAction(e.target.value as any);
                    setBulkValue('');
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione critério...</option>
                  <option value="department">Por Departamento</option>
                  <option value="role">Por Perfil</option>
                </select>

                {bulkAction && (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {bulkAction === 'department' && departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                    {bulkAction === 'role' && roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                )}

                {bulkAction && bulkValue && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkUpdate(true, false)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Permitir Apontamento
                    </button>
                    <button
                      onClick={() => handleBulkUpdate(true, true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Permitir Tudo
                    </button>
                    <button
                      onClick={() => handleBulkUpdate(false, false)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Remover Permissões
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Permissões */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Permissões Configuradas
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhuma permissão configurada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                        Usuário
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                        Departamento
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                        Fazer Apontamento
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                        Aprovar Apontamento
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map(permission => {
                      const user = users.find(u => u.id === permission.user_id);
                      if (!user) return null;

                      return (
                        <tr key={permission.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-900 dark:text-white">
                            {user.department || '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => handlePermissionToggle(permission.user_id, 'can_submit_timesheet')}
                              className={`p-1 rounded ${
                                permission.can_submit_timesheet 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                              }`}
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => handlePermissionToggle(permission.user_id, 'can_approve_timesheet')}
                              className={`p-1 rounded ${
                                permission.can_approve_timesheet 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                              }`}
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => handleRemovePermission(permission.user_id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}