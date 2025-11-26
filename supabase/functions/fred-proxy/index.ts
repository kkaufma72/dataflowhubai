// Supabase Edge Function to proxy FRED API requests
// This bypasses CORS restrictions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FRED_API_KEY = Deno.env.get('FRED_API_KEY') || ''
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { endpoint, params } = await req.json()

    if (!FRED_API_KEY) {
      throw new Error('FRED API key not configured')
    }

    // Build URL with API key
    const url = new URL(`${FRED_BASE_URL}${endpoint}`)
    url.searchParams.append('api_key', FRED_API_KEY)
    url.searchParams.append('file_type', 'json')
    
    // Add all other params
    Object.entries(params || {}).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })

    console.log('FRED Proxy Request:', url.toString().replace(FRED_API_KEY, '***'))

    // Make request to FRED API
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`FRED API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('FRED Proxy Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch from FRED API' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

