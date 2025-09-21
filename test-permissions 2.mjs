#!/usr/bin/env node

import axios from 'axios';

const baseURL = 'http://localhost:3000';

async function testPermissions() {
  console.log('🔍 Testando Sistema de Permissões\n');
  console.log('='.repeat(50));

  try {
    // 1. Testar endpoint de roles
    console.log('\n1️⃣ Testando /api/roles...');
    try {
      const rolesResponse = await axios.get(`${baseURL}/api/roles`);
      console.log(`   ✅ ${rolesResponse.data.length} roles encontradas`);
      
      // Mostrar roles customizadas
      const customRoles = rolesResponse.data.filter(r => !r.is_system);
      if (customRoles.length > 0) {
        console.log('   📋 Roles customizadas:');
        customRoles.forEach(role => {
          console.log(`      - ${role.display_name} (${role.name})`);
          // Verificar permissão tickets_assign
          if (role.permissions && role.permissions.tickets_assign) {
            console.log(`        ✅ Pode atribuir tickets`);
          } else {
            console.log(`        ❌ NÃO pode atribuir tickets`);
          }
        });
      }
    } catch (error) {
      console.log('   ❌ Erro:', error.response?.status === 401 ? 'Não autorizado' : error.message);
    }

    // 2. Testar endpoint de usuários com permissão
    console.log('\n2️⃣ Testando /api/users/with-permission...');
    try {
      const usersWithAssign = await axios.get(`${baseURL}/api/users/with-permission?permission=tickets_assign`);
      console.log(`   ✅ ${usersWithAssign.data.length} usuários podem atribuir tickets:`);
      usersWithAssign.data.forEach(user => {
        const role = user.role_name || user.role;
        console.log(`      - ${user.name} (${user.email}) - Role: ${role}`);
      });
    } catch (error) {
      console.log('   ❌ Erro:', error.response?.status || error.message);
      if (error.response?.status === 404) {
        console.log('      ℹ️ Endpoint ainda não existe. Será criado em breve.');
      }
    }

    // 3. Verificar permissões específicas
    console.log('\n3️⃣ Verificando permissões por role...');
    const rolesToCheck = ['admin', 'analyst', 'user', 'dev']; // Incluir role customizada se existir
    
    for (const roleName of rolesToCheck) {
      console.log(`\n   Role: ${roleName}`);
      try {
        const roleData = rolesResponse?.data?.find(r => r.name === roleName);
        if (roleData) {
          const perms = roleData.permissions || {};
          console.log(`      Atribuir tickets: ${perms.tickets_assign ? '✅' : '❌'}`);
          console.log(`      Criar tickets: ${perms.tickets_create ? '✅' : '❌'}`);
          console.log(`      Editar todos: ${perms.tickets_edit_all ? '✅' : '❌'}`);
          console.log(`      Gerenciar usuários: ${perms.system_users ? '✅' : '❌'}`);
        } else {
          console.log(`      ⚠️ Role não encontrada no sistema`);
        }
      } catch (error) {
        console.log(`      ❌ Erro ao verificar role`);
      }
    }

    // 4. Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO TESTE:');
    console.log('='.repeat(50));
    
    console.log('\n⚠️ Ações necessárias:');
    console.log('1. Verificar se a coluna role_name foi adicionada no Supabase');
    console.log('2. Confirmar que roles customizadas têm permissões corretas');
    console.log('3. Testar cadastro de usuário com role customizada');
    console.log('4. Verificar se usuários com permissão aparecem nos dropdowns');

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
  }
}

// Executar teste
testPermissions();