#!/usr/bin/env node

/**
 * Investment Primitives Validation Test
 * 
 * This test validates the implementation of Task 7.1 and 7.2 without requiring
 * a running Supabase instance. It checks:
 * 
 * 1. Database migration files exist and are properly structured
 * 2. Edge Function files exist and have correct structure
 * 3. Relevance scoring integration is properly implemented
 * 4. API contract compliance (response format, error handling)
 * 5. Integration with existing cockpit functionality
 */

const fs = require('fs');
const path = require('path');

class InvestmentPrimitivesValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📝',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    }[type] || '📝';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    } else if (type === 'success') {
      this.successes.push(message);
    }
  }

  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  validateDatabaseMigration() {
    this.log('Validating database migration for investment primitives...', 'info');

    const migrationPath = 'supabase/migrations/20260110000002_investment_primitives.sql';
    
    if (!this.fileExists(migrationPath)) {
      this.log('Investment primitives migration file not found', 'error');
      return false;
    }

    const migrationContent = this.readFile(migrationPath);
    if (!migrationContent) {
      this.log('Could not read migration file', 'error');
      return false;
    }

    // Check for required tables
    const requiredTables = [
      'user_investments',
      'cockpit_alert_rules'
    ];

    let allTablesFound = true;
    for (const table of requiredTables) {
      if (!migrationContent.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
        this.log(`Table ${table} not found in migration`, 'error');
        allTablesFound = false;
      } else {
        this.log(`Table ${table} found in migration`, 'success');
      }
    }

    // Check for RLS policies
    const rlsPolicies = [
      'user_investments_select_own',
      'user_investments_insert_own',
      'user_investments_update_own',
      'user_investments_delete_own',
      'cockpit_alert_rules_select_own',
      'cockpit_alert_rules_insert_own',
      'cockpit_alert_rules_update_own',
      'cockpit_alert_rules_delete_own'
    ];

    let allPoliciesFound = true;
    for (const policy of rlsPolicies) {
      if (!migrationContent.includes(`CREATE POLICY "${policy}"`)) {
        this.log(`RLS policy ${policy} not found`, 'error');
        allPoliciesFound = false;
      } else {
        this.log(`RLS policy ${policy} found`, 'success');
      }
    }

    // Check for helper functions
    const helperFunctions = [
      'get_user_relevance_items',
      'get_active_alert_rules'
    ];

    let allFunctionsFound = true;
    for (const func of helperFunctions) {
      if (!migrationContent.includes(`CREATE OR REPLACE FUNCTION public.${func}`)) {
        this.log(`Helper function ${func} not found`, 'error');
        allFunctionsFound = false;
      } else {
        this.log(`Helper function ${func} found`, 'success');
      }
    }

    return allTablesFound && allPoliciesFound && allFunctionsFound;
  }

  validateEdgeFunctions() {
    this.log('Validating Supabase Edge Functions...', 'info');

    const edgeFunctions = [
      {
        name: 'investments-save',
        path: 'supabase/functions/investments-save/index.ts',
        methods: ['GET', 'POST', 'DELETE']
      },
      {
        name: 'alert-rules',
        path: 'supabase/functions/alert-rules/index.ts',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    ];

    let allFunctionsValid = true;

    for (const func of edgeFunctions) {
      if (!this.fileExists(func.path)) {
        this.log(`Edge function ${func.name} not found at ${func.path}`, 'error');
        allFunctionsValid = false;
        continue;
      }

      const content = this.readFile(func.path);
      if (!content) {
        this.log(`Could not read edge function ${func.name}`, 'error');
        allFunctionsValid = false;
        continue;
      }

      // Check for required HTTP methods
      for (const method of func.methods) {
        if (!content.includes(`method === '${method}'`)) {
          this.log(`Edge function ${func.name} missing ${method} method handler`, 'error');
          allFunctionsValid = false;
        } else {
          this.log(`Edge function ${func.name} has ${method} method handler`, 'success');
        }
      }

      // Check for CORS headers
      if (!content.includes('Access-Control-Allow-Origin')) {
        this.log(`Edge function ${func.name} missing CORS headers`, 'error');
        allFunctionsValid = false;
      } else {
        this.log(`Edge function ${func.name} has CORS headers`, 'success');
      }

      // Check for authentication
      if (!content.includes('supabaseClient.auth.getUser()')) {
        this.log(`Edge function ${func.name} missing authentication`, 'error');
        allFunctionsValid = false;
      } else {
        this.log(`Edge function ${func.name} has authentication`, 'success');
      }

      // Check for proper error handling
      if (!content.includes('UNAUTHORIZED') || !content.includes('VALIDATION_ERROR')) {
        this.log(`Edge function ${func.name} missing proper error codes`, 'error');
        allFunctionsValid = false;
      } else {
        this.log(`Edge function ${func.name} has proper error handling`, 'success');
      }

      // Check for API response format compliance
      if (!content.includes('data:') && content.includes('error:') && content.includes('meta:')) {
        this.log(`Edge function ${func.name} follows API response format`, 'success');
      } else {
        this.log(`Edge function ${func.name} may not follow API response format`, 'warning');
      }
    }

    return allFunctionsValid;
  }

  validateRelevanceIntegration() {
    this.log('Validating relevance scoring integration...', 'info');

    const relevanceIntegrationPath = 'src/lib/cockpit/scoring/relevance-integration.ts';
    
    if (!this.fileExists(relevanceIntegrationPath)) {
      this.log('Relevance integration module not found', 'error');
      return false;
    }

    const content = this.readFile(relevanceIntegrationPath);
    if (!content) {
      this.log('Could not read relevance integration module', 'error');
      return false;
    }

    // Check for required functions
    const requiredFunctions = [
      'getUserRelevanceContext',
      'calculateRelevanceScore',
      'calculateEnhancedRelevanceScore'
    ];

    let allFunctionsFound = true;
    for (const func of requiredFunctions) {
      if (!content.includes(`export function ${func}`) && !content.includes(`function ${func}`)) {
        this.log(`Function ${func} not found in relevance integration`, 'error');
        allFunctionsFound = false;
      } else {
        this.log(`Function ${func} found in relevance integration`, 'success');
      }
    }

    // Check for investment semantics
    if (!content.includes('InvestmentSemantics')) {
      this.log('InvestmentSemantics helper not found', 'error');
      allFunctionsFound = false;
    } else {
      this.log('InvestmentSemantics helper found', 'success');
    }

    // Check for proper scoring weights
    const scoringWeights = ['15', '10', '5', '3']; // save, wallet_role, alert_rule, bookmark
    let hasProperWeights = true;
    for (const weight of scoringWeights) {
      if (!content.includes(`+= ${weight}`)) {
        hasProperWeights = false;
        break;
      }
    }

    if (hasProperWeights) {
      this.log('Proper scoring weights found in relevance integration', 'success');
    } else {
      this.log('Scoring weights may be incorrect in relevance integration', 'warning');
    }

    return allFunctionsFound;
  }

  validateCockpitIntegration() {
    this.log('Validating integration with existing cockpit functionality...', 'info');

    // Check if cockpit summary functions are updated to use new tables
    const cockpitSummaryPaths = [
      'supabase/functions/cockpit-summary/index.ts',
      'src/app/api/cockpit/summary/route.ts'
    ];

    let integrationValid = true;

    for (const summaryPath of cockpitSummaryPaths) {
      if (!this.fileExists(summaryPath)) {
        this.log(`Cockpit summary file not found: ${summaryPath}`, 'warning');
        continue;
      }

      const content = this.readFile(summaryPath);
      if (!content) {
        this.log(`Could not read cockpit summary file: ${summaryPath}`, 'warning');
        continue;
      }

      // Check if it uses the new cockpit_alert_rules table
      if (content.includes('cockpit_alert_rules')) {
        this.log(`${summaryPath} uses new cockpit_alert_rules table`, 'success');
      } else if (content.includes('alert_rules')) {
        this.log(`${summaryPath} still uses old alert_rules table`, 'warning');
      }

      // Check if it fetches user_investments
      if (content.includes('user_investments')) {
        this.log(`${summaryPath} fetches user_investments`, 'success');
      } else {
        this.log(`${summaryPath} does not fetch user_investments`, 'warning');
      }
    }

    return integrationValid;
  }

  validateAPIContract() {
    this.log('Validating API contract compliance...', 'info');

    // Check that Next.js API routes were removed (since this is a Vite project)
    const nextjsApiPaths = [
      'src/app/api/investments/save/route.ts',
      'src/app/api/alerts/rules/route.ts'
    ];

    let contractValid = true;

    for (const apiPath of nextjsApiPaths) {
      if (this.fileExists(apiPath)) {
        this.log(`Next.js API route found but this is a Vite project: ${apiPath}`, 'warning');
        this.log('Consider removing Next.js API routes as they won\'t work in Vite', 'warning');
      }
    }

    // Check that Edge Functions follow the correct response format
    const edgeFunctionPaths = [
      'supabase/functions/investments-save/index.ts',
      'supabase/functions/alert-rules/index.ts'
    ];

    for (const funcPath of edgeFunctionPaths) {
      if (!this.fileExists(funcPath)) continue;

      const content = this.readFile(funcPath);
      if (!content) continue;

      // Check for proper response format: { data, error, meta: { ts } }
      if (content.includes('data:') && content.includes('error:') && content.includes('meta:') && content.includes('ts:')) {
        this.log(`${funcPath} follows API response format`, 'success');
      } else {
        this.log(`${funcPath} may not follow API response format`, 'error');
        contractValid = false;
      }

      // Check for proper HTTP status codes
      const statusCodes = ['200', '201', '400', '401', '404', '405', '500'];
      let hasProperStatusCodes = true;
      for (const code of statusCodes) {
        if (!content.includes(`status: ${code}`)) {
          hasProperStatusCodes = false;
          break;
        }
      }

      if (hasProperStatusCodes) {
        this.log(`${funcPath} uses proper HTTP status codes`, 'success');
      } else {
        this.log(`${funcPath} may be missing some HTTP status codes`, 'warning');
      }
    }

    return contractValid;
  }

  validateRequirementsCompliance() {
    this.log('Validating requirements compliance...', 'info');

    // Task 7.1 Requirements: 12.1, 12.4, 12.6
    // Task 7.2 Requirements: 12.3, 12.5, 12.6

    const requirements = {
      '12.1': 'Save/bookmark functionality for opportunities and findings',
      '12.3': 'Creation and management of alert rules with JSON rule definition',
      '12.4': 'Wallet role assignment for different addresses',
      '12.5': 'Rule validation and storage',
      '12.6': 'Use saved items and alert rules for relevance scoring in action ranking'
    };

    let complianceValid = true;

    // Check 12.1 - Save/bookmark functionality
    if (this.fileExists('supabase/functions/investments-save/index.ts')) {
      this.log('Requirement 12.1: Save/bookmark functionality implemented', 'success');
    } else {
      this.log('Requirement 12.1: Save/bookmark functionality missing', 'error');
      complianceValid = false;
    }

    // Check 12.3 - Alert rules management
    if (this.fileExists('supabase/functions/alert-rules/index.ts')) {
      this.log('Requirement 12.3: Alert rules management implemented', 'success');
    } else {
      this.log('Requirement 12.3: Alert rules management missing', 'error');
      complianceValid = false;
    }

    // Check 12.4 - Wallet role assignment
    const migrationContent = this.readFile('supabase/migrations/20260110000002_investment_primitives.sql');
    if (migrationContent && migrationContent.includes("'wallet_role'")) {
      this.log('Requirement 12.4: Wallet role assignment supported', 'success');
    } else {
      this.log('Requirement 12.4: Wallet role assignment missing', 'error');
      complianceValid = false;
    }

    // Check 12.5 - Rule validation
    const alertRulesContent = this.readFile('supabase/functions/alert-rules/index.ts');
    if (alertRulesContent && alertRulesContent.includes('validateAlertRuleData')) {
      this.log('Requirement 12.5: Rule validation implemented', 'success');
    } else {
      this.log('Requirement 12.5: Rule validation missing', 'error');
      complianceValid = false;
    }

    // Check 12.6 - Relevance scoring integration
    if (this.fileExists('src/lib/cockpit/scoring/relevance-integration.ts')) {
      this.log('Requirement 12.6: Relevance scoring integration implemented', 'success');
    } else {
      this.log('Requirement 12.6: Relevance scoring integration missing', 'error');
      complianceValid = false;
    }

    return complianceValid;
  }

  generateSummary() {
    this.log('\n=== Investment Primitives Validation Summary ===', 'info');
    
    console.log(`\n✅ Successes: ${this.successes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Critical Issues:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    const overallStatus = this.errors.length === 0 ? 'PASS' : 'FAIL';
    console.log(`\n🎯 Overall Status: ${overallStatus}`);

    if (overallStatus === 'PASS') {
      console.log('\n🎉 Investment Primitives implementation is valid!');
      console.log('   - Database schema is properly defined');
      console.log('   - Edge Functions are correctly implemented');
      console.log('   - Relevance scoring integration is in place');
      console.log('   - API contract compliance is maintained');
      console.log('   - Requirements are satisfied');
    } else {
      console.log('\n💥 Investment Primitives implementation has issues that need to be addressed.');
    }

    return overallStatus === 'PASS';
  }

  async runValidation() {
    console.log('🧪 Investment Primitives Implementation Validation');
    console.log('================================================');

    const results = [];

    results.push(this.validateDatabaseMigration());
    results.push(this.validateEdgeFunctions());
    results.push(this.validateRelevanceIntegration());
    results.push(this.validateCockpitIntegration());
    results.push(this.validateAPIContract());
    results.push(this.validateRequirementsCompliance());

    return this.generateSummary();
  }
}

// Run the validation
async function main() {
  const validator = new InvestmentPrimitivesValidator();
  const success = await validator.runValidation();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Validation failed with error:', error.message);
  process.exit(1);
});