'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      try {
        console.log('Running client-side auth tests...')
        
        // Test 1: Check supabase client
        const supabaseClientExists = !!supabase
        console.log('Supabase client exists:', supabaseClientExists)
        
        // Test 2: Get current user
        const { data: { user }, error: userError } = await supabase!.auth.getUser()
        console.log('Current user:', { user, userError })
        
        // Test 3: Get current session
        const { data: { session }, error: sessionError } = await supabase!.auth.getSession()
        console.log('Current session:', { session, sessionError })
        
        // Test 4: Try to access user_data
        let userDataTest = null
        if (user) {
          const { data: userData, error: dataError } = await supabase!
            .from('user_data')
            .select('*')
            .eq('user_id', user.id)
            .limit(5)
          
          userDataTest = { data: userData, error: dataError }
          console.log('User data test:', userDataTest)
        }
        
        setTestResults({
          supabaseClient: supabaseClientExists,
          currentUser: {
            user: user ? { id: user.id, email: user.email } : null,
            error: userError?.message
          },
          currentSession: {
            session: session ? { 
              user: { id: session.user.id, email: session.user.email },
              expires_at: session.expires_at 
            } : null,
            error: sessionError?.message
          },
          userDataAccess: userDataTest
        })
        
      } catch (error) {
        console.error('Test error:', error)
        setTestResults({
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setLoading(false)
      }
    }

    runTests()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Testing authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Results</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Client-side authentication tests</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}