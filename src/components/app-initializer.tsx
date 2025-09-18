'use client';

import { useEffect } from 'react';
import { initializeApp } from '@/lib/app-init';

/**
 * Componente para inicializar serviços da aplicação
 * Executa apenas no lado do cliente
 */
export function AppInitializer() {
  useEffect(() => {
    // Inicializar aplicação apenas no cliente
    if (typeof window !== 'undefined') {
      console.log('🚀 Inicializando serviços da aplicação...');
      initializeApp();
    }
  }, []);

  // Este componente não renderiza nada
  return null;
}
