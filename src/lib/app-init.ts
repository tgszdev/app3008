/**
 * Inicialização da aplicação
 * Configura serviços que devem rodar automaticamente
 */

import scheduler from './scheduler';

let isInitialized = false;

/**
 * Inicializa todos os serviços da aplicação
 */
export function initializeApp(): void {
  if (isInitialized) {
    console.log('⚠️ Aplicação já foi inicializada');
    return;
  }

  console.log('🚀 Inicializando aplicação...');

  try {
    // Inicializar scheduler
    scheduler.initialize();
    
    isInitialized = true;
    console.log('✅ Aplicação inicializada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
  }
}

/**
 * Para todos os serviços da aplicação
 */
export function shutdownApp(): void {
  if (!isInitialized) {
    console.log('⚠️ Aplicação não foi inicializada');
    return;
  }

  console.log('🛑 Parando aplicação...');

  try {
    // Parar scheduler
    scheduler.stopAll();
    
    isInitialized = false;
    console.log('✅ Aplicação parada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao parar aplicação:', error);
  }
}

/**
 * Verifica se a aplicação foi inicializada
 */
export function isAppInitialized(): boolean {
  return isInitialized;
}
