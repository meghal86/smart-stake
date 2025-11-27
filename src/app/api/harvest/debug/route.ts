/**
 * Debug endpoint to diagnose HarvestPro connection issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // Check 1: Supabase client creation
    try {
      const supabase = await createClient();
      diagnostics.checks.supabaseClient = { status: 'OK', message: 'Client created successfully' };

      // Check 2: Authentication
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          diagnostics.checks.authentication = { 
            status: 'ERROR', 
            message: authError.message,
            code: authError.code 
          };
        } else if (!user) {
          diagnostics.checks.authentication = { 
            status: 'ERROR', 
            message: 'No user found - not authenticated' 
          };
        } else {
          diagnostics.checks.authentication = { 
            status: 'OK', 
            message: 'User authenticated',
            userId: user.id,
            email: user.email 
          };

          // Check 3: Database access
          try {
            const { data: txData, error: txError } = await supabase
              .from('harvest_transactions')
              .select('count')
              .limit(1);

            if (txError) {
              diagnostics.checks.database = { 
                status: 'ERROR', 
                message: `Database query failed: ${txError.message}` 
              };
            } else {
              diagnostics.checks.database = { 
                status: 'OK', 
                message: 'Database accessible' 
              };

              // Check 4: Transaction data
              const { count: txCount } = await supabase
                .from('harvest_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

              diagnostics.checks.transactionData = {
                status: txCount && txCount > 0 ? 'OK' : 'WARNING',
                message: `Found ${txCount || 0} transactions for user`,
                count: txCount || 0
              };

              // Check 5: Edge Function availability
              try {
                const { data: efData, error: efError } = await supabase.functions.invoke(
                  'harvest-recompute-opportunities',
                  {
                    body: {
                      userId: user.id,
                      taxRate: 0.24,
                      minLossThreshold: 100,
                    },
                  }
                );

                if (efError) {
                  diagnostics.checks.edgeFunction = {
                    status: 'ERROR',
                    message: `Edge Function error: ${efError.message}`,
                    error: efError
                  };
                } else {
                  diagnostics.checks.edgeFunction = {
                    status: 'OK',
                    message: 'Edge Function executed successfully',
                    opportunitiesFound: efData?.opportunitiesFound || 0,
                    totalSavings: efData?.totalPotentialSavings || 0
                  };
                }
              } catch (efCatchError) {
                diagnostics.checks.edgeFunction = {
                  status: 'ERROR',
                  message: `Edge Function exception: ${efCatchError instanceof Error ? efCatchError.message : 'Unknown error'}`,
                };
              }
            }
          } catch (dbError) {
            diagnostics.checks.database = { 
              status: 'ERROR', 
              message: `Database exception: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` 
            };
          }
        }
      } catch (authCatchError) {
        diagnostics.checks.authentication = { 
          status: 'ERROR', 
          message: `Auth exception: ${authCatchError instanceof Error ? authCatchError.message : 'Unknown error'}` 
        };
      }
    } catch (clientError) {
      diagnostics.checks.supabaseClient = { 
        status: 'ERROR', 
        message: `Client creation failed: ${clientError instanceof Error ? clientError.message : 'Unknown error'}` 
      };
    }

    // Check 6: Environment variables
    diagnostics.checks.environment = {
      status: 'INFO',
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      }
    };

    // Overall status
    const hasErrors = Object.values(diagnostics.checks).some((check: any) => check.status === 'ERROR');
    diagnostics.overallStatus = hasErrors ? 'FAILED' : 'OK';

    return NextResponse.json(diagnostics, { 
      status: hasErrors ? 500 : 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallStatus: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
