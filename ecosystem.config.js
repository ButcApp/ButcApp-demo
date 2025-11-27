module.exports = {
  apps: [{
    name: 'butcapp',
    script: '.next/standalone/server.js',
    cwd: '/var/www/butcapp',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'https://uizazhyshhazgmqrzxfq.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemF6aHlzaGhhemdtcXJ6eGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjU4MjIsImV4cCI6MjA3OTUwMTgyMn0.kPLcu-vVhFEgZP-YFQuqrFH3DA2ozZUQTNBMYw_yfSQ',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemF6aHlzaGhhemdtcXJ6eGZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkyNTgyMiwiZXhwIjoyMDc5NTAxODIyfQ.b1j988HrUNLowXo043d5Nyr-n5b1Ath0DtHNk-PXtOc',
      DATABASE_URL: 'postgresql://username:password@localhost:5432/butcapp_db'
    },
    error_file: '/var/log/butcapp/error.log',
    out_file: '/var/log/butcapp/out.log',
    log_file: '/var/log/butcapp/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}