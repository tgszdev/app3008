'use client'

import { useState } from 'react'
import { Database, Copy, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function KnowledgeBaseSetup() {
  const [copied, setCopied] = useState(false)
  
  const sqlScript = `-- Script rápido para criar as tabelas da Base de Conhecimento
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'FileText',
  color VARCHAR(7) DEFAULT '#6366F1',
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de artigos
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES kb_categories(id),
  author_id UUID,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_faq BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- 3. Criar tabela de tags
CREATE TABLE IF NOT EXISTS kb_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar tabela de relação artigo-tags
CREATE TABLE IF NOT EXISTS kb_article_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES kb_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, tag_id)
);

-- 5. Criar tabela de feedback
CREATE TABLE IF NOT EXISTS kb_article_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id UUID,
  helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inserir categorias padrão
INSERT INTO kb_categories (name, slug, description, icon, color, display_order) VALUES
  ('Primeiros Passos', 'primeiros-passos', 'Guias para começar a usar o sistema', 'Rocket', '#6366F1', 1),
  ('Tutoriais', 'tutoriais', 'Tutoriais passo a passo', 'BookOpen', '#8B5CF6', 2),
  ('Solução de Problemas', 'solucao-problemas', 'Resoluções para problemas comuns', 'Wrench', '#EF4444', 3),
  ('FAQ', 'faq', 'Perguntas frequentes', 'HelpCircle', '#F59E0B', 4),
  ('Recursos', 'recursos', 'Recursos e funcionalidades do sistema', 'Lightbulb', '#10B981', 5)
ON CONFLICT (slug) DO NOTHING;`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    toast.success('Script SQL copiado!')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
              Configuração Necessária
            </h3>
            <p className="mt-2 text-yellow-700 dark:text-yellow-300">
              As tabelas da Base de Conhecimento ainda não foram criadas no banco de dados.
              Siga as instruções abaixo para configurar.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configurar Base de Conhecimento
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Execute o script SQL no Supabase para criar as tabelas necessárias
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Passo 1 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Passo 1: Copie o Script SQL
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 relative">
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Copiar script"
              >
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <pre className="text-gray-300 text-sm overflow-x-auto">
                <code>{sqlScript.slice(0, 500)}...</code>
              </pre>
              <p className="text-gray-500 text-xs mt-2">
                Script completo ({sqlScript.length} caracteres)
              </p>
            </div>
          </div>

          {/* Passo 2 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Passo 2: Acesse o Supabase SQL Editor
            </h3>
            <ol className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                Acesse seu projeto no Supabase
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                No menu lateral, clique em "SQL Editor"
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                Clique em "New Query"
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                Cole o script SQL copiado
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">5.</span>
                Clique em "Run" para executar
              </li>
            </ol>
            <a
              href="https://app.supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Abrir Supabase
            </a>
          </div>

          {/* Passo 3 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Passo 3: Recarregue a Página
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Após executar o script com sucesso, recarregue esta página para começar a usar a Base de Conhecimento.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ℹ️ Informações Importantes
            </h4>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>• O script criará 5 tabelas e 5 categorias padrão</li>
              <li>• Um artigo de exemplo será criado automaticamente</li>
              <li>• O script é seguro e pode ser executado múltiplas vezes</li>
              <li>• Todas as tabelas usam UUID como chave primária</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}