'use client'

import Image from 'next/image'

export default function ShadowDemo() {
  const shadowOptions = [
    {
      id: 'corporate',
      name: 'Sombra Suave Corporativa',
      description: 'Sombra preta suave, ideal para ambientes corporativos',
      class: 'animate-pulse-corporate',
      preview: 'Sombra preta com intensidade baixa, movimento suave'
    },
    {
      id: 'blue',
      name: 'Sombra Azul Corporativa',
      description: 'Sombra azul sutil, moderna e profissional',
      class: 'animate-pulse-blue',
      preview: 'Sombra azul com tom corporativo, elegante'
    },
    {
      id: 'smoke',
      name: 'Sombra Cinza Esfumaçada',
      description: 'Sombra cinza difusa, efeito esfumaçado',
      class: 'animate-pulse-smoke',
      preview: 'Sombra cinza com efeito de fumaça, muito sutil'
    },
    {
      id: 'white-soft',
      name: 'Sombra Branca Suave',
      description: 'Sombra branca delicada, quase imperceptível',
      class: 'animate-pulse-white-soft',
      preview: 'Sombra branca muito suave, quase invisível'
    },
    {
      id: 'gradient',
      name: 'Sombra Gradiente Corporativa',
      description: 'Múltiplas camadas de sombra para profundidade',
      class: 'animate-pulse-gradient',
      preview: 'Sombra em camadas, efeito de profundidade'
    },
    {
      id: 'minimal',
      name: 'Sombra Minimalista',
      description: 'Sombra discreta, movimento mínimo',
      class: 'animate-pulse-minimal',
      preview: 'Sombra muito discreta, movimento sutil'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Opções de Sombra Corporativa
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Escolha a sombra pulsante que melhor se adapta ao seu design corporativo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shadowOptions.map((option) => (
            <div key={option.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {option.description}
                </p>
                
                {/* Logo com a sombra específica */}
                <div className="flex justify-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-[#111111] rounded-2xl mb-4 transform hover:scale-105 transition-transform overflow-hidden ${option.class}`}>
                    <Image src="/icons/symbol.png" alt="Logo" width={64} height={64} priority />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  {option.preview}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  Classe: {option.class}
                </div>
                <button 
                  onClick={() => {
                    // Aqui você pode implementar a seleção
                    console.log(`Selecionado: ${option.name}`)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Selecionar Esta Opção
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Como usar:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Visualize cada opção acima</li>
            <li>Clique em "Selecionar Esta Opção" na que preferir</li>
            <li>A classe CSS será aplicada automaticamente ao logo</li>
            <li>O efeito será salvo e enviado para produção</li>
          </ol>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            Ver na Tela de Login
          </a>
        </div>
      </div>
    </div>
  )
}
