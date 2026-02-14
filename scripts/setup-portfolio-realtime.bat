@echo off
REM Portfolio Real-Time Data Setup Script (Windows)
REM This script helps set up the portfolio real-time data implementation

echo.
echo ========================================
echo AlphaWhale Portfolio Real-Time Data Setup
echo ========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [WARNING] .env.local not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env.local
        echo [SUCCESS] Created .env.local
    ) else (
        echo [ERROR] .env.example not found. Please create .env.local manually.
        exit /b 1
    )
)

echo.
echo Checking environment variables...
echo.

REM Check required variables
findstr /C:"NEXT_PUBLIC_SUPABASE_URL=" .env.local >nul
if errorlevel 1 (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_URL not set
    set MISSING_VARS=1
) else (
    echo [SUCCESS] NEXT_PUBLIC_SUPABASE_URL configured
)

findstr /C:"NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local >nul
if errorlevel 1 (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY not set
    set MISSING_VARS=1
) else (
    echo [SUCCESS] NEXT_PUBLIC_SUPABASE_ANON_KEY configured
)

findstr /C:"SUPABASE_SERVICE_ROLE_KEY=" .env.local >nul
if errorlevel 1 (
    echo [ERROR] SUPABASE_SERVICE_ROLE_KEY not set
    set MISSING_VARS=1
) else (
    echo [SUCCESS] SUPABASE_SERVICE_ROLE_KEY configured
)

echo.
echo Checking optional variables (for real-time prices)...
echo.

findstr /C:"COINGECKO_API_KEY=" .env.local >nul
if errorlevel 1 (
    echo [WARNING] COINGECKO_API_KEY not set (will use fallback/mock data)
) else (
    echo [SUCCESS] COINGECKO_API_KEY configured
)

findstr /C:"COINMARKETCAP_API_KEY=" .env.local >nul
if errorlevel 1 (
    echo [WARNING] COINMARKETCAP_API_KEY not set (will use fallback/mock data)
) else (
    echo [SUCCESS] COINMARKETCAP_API_KEY configured
)

if defined MISSING_VARS (
    echo.
    echo [ERROR] Some required environment variables are missing.
    echo Please edit .env.local and set the required variables.
    exit /b 1
)

echo.
echo [SUCCESS] All required environment variables are set!
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Supabase CLI not found. Skipping database migration.
    echo           Install it with: npm install -g supabase
    echo.
) else (
    echo Running database migration...
    echo.
    
    supabase db push
    if errorlevel 1 (
        echo.
        echo [ERROR] Database migration failed.
        echo        You may need to run: supabase link
        echo.
    ) else (
        echo.
        echo [SUCCESS] Database migration completed!
    )
)

REM Edge functions info
echo.
echo Checking edge functions...
echo.
echo [NOTE] Edge functions must be deployed manually.
echo.
echo To deploy edge functions, run:
echo.
echo   supabase functions deploy guardian-scan-v2
echo   supabase functions deploy hunter-opportunities
echo   supabase functions deploy harvest-recompute-opportunities
echo   supabase functions deploy portfolio-tracker-live
echo.

REM Install dependencies
echo Installing dependencies...
echo.

call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install dependencies.
    exit /b 1
)

echo.
echo [SUCCESS] Dependencies installed!

REM Build check
echo.
echo Running build check...
echo.

call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed. Please fix errors and try again.
    exit /b 1
)

echo.
echo [SUCCESS] Build successful!

REM Summary
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Start the development server:
echo    npm run dev
echo.
echo 2. Navigate to http://localhost:3000/portfolio
echo.
echo 3. Connect your wallet and test real-time data
echo.
echo 4. Check the logs for data fetching status:
echo    - [SUCCESS] = Success (real data)
echo    - [WARNING] = Warning (fallback used)
echo    - [MOCK] = Mock data (edge function not available)
echo.
echo For more information, see:
echo   - docs/PORTFOLIO_REALTIME_DATA.md
echo   - PORTFOLIO_REALTIME_IMPLEMENTATION_SUMMARY.md
echo.
echo Happy coding!
echo.

pause
