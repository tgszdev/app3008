'use client'

import { useEffect, useState } from 'react'

export default function StatusPage() {
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      // Tenta múltiplos endpoints
      const endpoints = [
        '/api/health',
        '/api/test',
        '/api/users/debug'
      ]

      const results: any = {}
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint)
          results[endpoint] = {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.json() : null
          }
        } catch (e: any) {
          results[endpoint] = {
            status: 'error',
            error: e.message
          }
        }
      }

      setStatus(results)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          System Status Check
        </h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Checking status...</div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Environment Variables
              </h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">NEXT_PUBLIC_SUPABASE_URL:</span>
                  <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? "text-green-600" : "text-red-600"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not Set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Build Time:</span>
                  <span className="text-gray-900 dark:text-white">{new Date().toISOString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                API Endpoints Status
              </h2>
              <div className="space-y-3">
                {Object.entries(status).map(([endpoint, result]: [string, any]) => (
                  <div key={endpoint} className="border-b dark:border-gray-700 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {endpoint}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    {result.data && (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Quick Links
              </h3>
              <div className="space-y-1">
                <a href="/" className="block text-blue-600 hover:underline">→ Home</a>
                <a href="/login" className="block text-blue-600 hover:underline">→ Login</a>
                <a href="/dashboard" className="block text-blue-600 hover:underline">→ Dashboard</a>
                <a href="/api/health" className="block text-blue-600 hover:underline">→ API Health</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}