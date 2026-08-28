// Environment Variable Validator for Production Debug
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_URL',
    'VITE_LIVEKIT_URL',
  ];

  const optionalVars = [
    'VITE_ANEMIA_API_URL',
    'VITE_CATARACT_API_URL', 
    'VITE_DR_API_URL',
    'VITE_PARKINSONS_API_URL',
    'VITE_MENTAL_HEALTH_API_URL',
    'VITE_CHATBOT_API_URL',
    'VITE_EMERGENCY_API_URL',
    'VITE_MCP_API_URL',
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_CLIENT_ID',
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  const optional = optionalVars.filter(varName => !import.meta.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
  }

  if (optional.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', optional);
  }

  console.log('✅ Environment variables loaded:', {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗',
    API_URL: import.meta.env.VITE_API_URL ? '✓' : '✗',
    LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_URL ? '✓' : '✗',
    BYPASS_AUTH: import.meta.env.VITE_BYPASS_AUTH,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });

  return {
    isValid: missing.length === 0,
    missing,
    optional
  };
};

// Call this early in app initialization
export const debugEnvironment = () => {
  console.log('🔧 Environment Debug Info:', {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    baseURL: import.meta.env.BASE_URL,
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'unknown'
  });
  
  return validateEnvironment();
};