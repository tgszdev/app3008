#!/usr/bin/env node

/**
 * Script para debugar as permissões
 */

// Simular as permissões padrão
const defaultSystemPermissions = {
  admin: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: true,
    tickets_assign: true,
    tickets_close: true
  },
  analyst: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: false,
    tickets_assign: true,
    tickets_close: true
  },
  user: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: false,
    tickets_delete: false,
    tickets_assign: false,
    tickets_close: false
  }
}

// Simular dados de usuários baseados no diagnóstico anterior
const users = [
  {
    "id": "4e8b7081-842b-4364-8351-1ada057bf121",
    "name": "Desenvolvedor",
    "role": "dev",
    "role_name": "dev",
    "is_active": true
  },
  {
    "id": "c8005da5-3d63-4de2-9956-43c2084d7385",
    "name": "Lucas Reis Wiser",
    "role": "admin",
    "role_name": "admin",
    "is_active": true
  },
  {
    "id": "2a33241e-ed38-48b5-9c84-e8c354ae9606",
    "name": "Thiago Rodrigues Souza",
    "role": "admin",
    "role_name": "admin",
    "is_active": true
  },
  {
    "id": "2bcd314e-ee43-4d2e-98aa-62c25d85deb7",
    "name": "Fernanda Costa",
    "role": "analyst",
    "role_name": "analyst",
    "is_active": true
  },
  {
    "id": "45a3ebc8-d3f2-4e60-a561-4cf80e5afe45",
    "name": "Carlos Santos",
    "role": "analyst",
    "role_name": "analyst",
    "is_active": true
  },
  {
    "id": "cb3a7544-8aed-409e-b0b7-98cb3d332396",
    "name": "Ana Silva",
    "role": "analyst",
    "role_name": "analyst",
    "is_active": true
  },
  {
    "id": "a17bd88a-2385-4539-8b96-4d89f5e5e7f0",
    "name": "Administrador do Sistema",
    "role": "admin",
    "role_name": "admin",
    "is_active": true
  }
]

function debugGetUsersWithPermission(permission) {
  console.log(`\n🔍 DEBUG: Buscando usuários com permissão "${permission}"`)
  console.log('=' * 50)
  
  // Simular roles customizadas vazias (como no problema real)
  const customRoles = []
  
  // Criar mapa de permissões incluindo roles customizadas
  const allPermissions = { ...defaultSystemPermissions }
  
  if (customRoles) {
    customRoles.forEach(role => {
      allPermissions[role.name] = role.permissions
    })
  }
  
  console.log('📋 Permissões disponíveis:')
  console.log(Object.keys(allPermissions))
  
  console.log('\n👥 Processando usuários:')
  
  // Filtrar usuários que têm a permissão
  const usersWithPermission = users.filter(user => {
    const userRole = user.role_name || user.role
    const permissions = allPermissions[userRole]
    const hasPermission = permissions && permissions[permission]
    
    console.log(`  - ${user.name}:`)
    console.log(`    Role: ${userRole}`)
    console.log(`    Permissões encontradas: ${!!permissions}`)
    console.log(`    Tem permissão "${permission}": ${hasPermission}`)
    
    return hasPermission
  })
  
  console.log(`\n✅ Usuários com permissão "${permission}":`)
  usersWithPermission.forEach(user => {
    console.log(`  - ${user.name} (${user.role})`)
  })
  
  return usersWithPermission
}

// Testar com a permissão tickets_assign
const result = debugGetUsersWithPermission('tickets_assign')
console.log(`\n📊 Total de usuários encontrados: ${result.length}`)

// Testar outras permissões
console.log('\n' + '=' * 60)
debugGetUsersWithPermission('tickets_view')
console.log('\n' + '=' * 60)
debugGetUsersWithPermission('system_settings')








