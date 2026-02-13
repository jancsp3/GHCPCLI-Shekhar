import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

interface DiagnosticContext {
  errorMessage: string;
  errorStack: string;
  pageUrl: string;
  timestamp: string;
  platform: string;
  pageContent?: string;
  networkErrors?: string[];
  locatorInfo?: {
    selector: string;
    found: boolean;
  };
}

interface AIDiagnostics {
  analyzeError: (error: Error, context?: Partial<DiagnosticContext>) => Promise<void>;
}

let copilotClient: any = null;

// Initialize CopilotClient at module load
(async () => {
  try {
    // Try ES module first
    const CopilotModule = await import('@github/copilot-sdk');
    if (CopilotModule?.CopilotClient) {
      copilotClient = new CopilotModule.CopilotClient();
    } else if (CopilotModule?.default?.CopilotClient) {
      copilotClient = new CopilotModule.default.CopilotClient();
    } else {
      copilotClient = new CopilotModule.default();
    }
  } catch (err) {
    // Fallback: try CommonJS
    try {
      const CopilotModule = require('@github/copilot-sdk');
      if (CopilotModule?.CopilotClient) {
        copilotClient = new CopilotModule.CopilotClient();
      } else {
        copilotClient = new CopilotModule();
      }
    } catch (e) {
      // SDK initialization will be attempted at runtime
    }
  }
})();

export const test = base.extend<{ aiDiagnostics: AIDiagnostics }>({
  aiDiagnostics: async ({ page }, use) => {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

    const extractLocatorInfo = (errorMessage: string): any => {
      // Extract selector from common error messages
      const selectorMatch = errorMessage.match(/selector\s*[:'"]([^'"]+)['"]/i) ||
                           errorMessage.match(/locator\s*[:'"]([^'"]+)['"]/i) ||
                           errorMessage.match(/selector:\s*[:'"]?([^\s'"]+)/i);
      
      if (selectorMatch) {
        return {
          selector: selectorMatch[1],
          found: false,
        };
      }
      return null;
    };

    const categorizeError = (errorMessage: string): string[] => {
      const categories = [];
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        categories.push('Database/API Timeout');
      }
      if (errorMessage.includes('element') || errorMessage.includes('locator') || errorMessage.includes('selector')) {
        categories.push('UI Locator/DOM Change');
      }
      if (errorMessage.includes('schema') || errorMessage.includes('field') || errorMessage.includes('property')) {
        categories.push('API Schema Change');
      }
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('request')) {
        categories.push('Network/Connection Issue');
      }
      if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
        categories.push('Authentication/Authorization');
      }
      if (errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('404')) {
        categories.push('Resource Not Found');
      }
      if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        categories.push('Data Validation Error');
      }
      
      return categories.length > 0 ? categories : ['Unknown Error'];
    };

    const generateQuickSummary = (errorMessage: string, categories: string[], locatorInfo: any): string => {
      const summary: string[] = [];
      summary.push('\n✅ AI ANALYSIS SUMMARY');
      summary.push('='.repeat(70));
      
      // Root cause
      summary.push('\n🎯 ROOT CAUSE:');
      if (categories.includes('UI Locator/DOM Change')) {
        summary.push('   The UI element selector has changed or element is not present in the DOM');
      } else if (categories.includes('Database/API Timeout')) {
        summary.push('   Backend service timeout - database or API is slow to respond');
      } else if (categories.includes('Resource Not Found')) {
        summary.push('   Expected resource/element does not exist (404 or selector mismatch)');
      } else if (categories.includes('Network/Connection Issue')) {
        summary.push('   Network connectivity problem or service unavailable');
      } else {
        summary.push('   Test assertion failed - check error details above');
      }

      // Why it happened
      summary.push('\n📍 WHY IT HAPPENED:');
      if (locatorInfo) {
        summary.push(`   Locator '${locatorInfo.selector}' not found on page`);
        summary.push('   Possible causes:');
        summary.push('     • Element ID/class was renamed in recent UI updates');
        summary.push('     • Page structure changed or element was removed');
        summary.push('     • Page loaded but element not yet rendered (timing issue)');
      } else {
        summary.push('   Check the error message and stack trace for specific details');
      }

      // Recommended fix
      summary.push('\n🔧 RECOMMENDED FIX:');
      if (locatorInfo) {
        summary.push(`   1. Verify the correct selector for the element`);
        summary.push(`   2. Update test to use correct locator`);
        summary.push(`   3. Add explicit waits if element loads asynchronously`);
      }

      // Prevention
      summary.push('\n🛡️ PREVENTION:');
      summary.push('   • Use data-testid attributes for reliable element selection');
      summary.push('   • Add proper wait conditions for dynamic elements');
      summary.push('   • Run tests frequently to catch selector changes early');

      summary.push('\n' + '='.repeat(70));
      return summary.join('\n');
    };

    const aiDiagnostics: AIDiagnostics = {
      analyzeError: async (error: Error, context?: Partial<DiagnosticContext>) => {
        const errorCategories = categorizeError(error.message);
        const locatorInfo = extractLocatorInfo(error.message);

        const diagnosticContext: DiagnosticContext = {
          errorMessage: error.message,
          errorStack: error.stack || 'No stack trace available',
          pageUrl: page.url(),
          timestamp: new Date().toISOString(),
          platform: process.platform,
          ...context,
        };

        const diagnosticPrompt = `
🔍 TEST FAILURE ROOT CAUSE ANALYSIS
=====================================

CATEGORIZED ERROR TYPE(S):
${errorCategories.map(cat => `  • ${cat}`).join('\n')}

ERROR DETAILS:
  Message: ${diagnosticContext.errorMessage}
  URL: ${diagnosticContext.pageUrl}
  Timestamp: ${diagnosticContext.timestamp}
  Platform: ${diagnosticContext.platform}

${locatorInfo ? `LOCATOR ANALYSIS:
  Selector: ${locatorInfo.selector}
  Expected: Element should be present and visible
  Actual: Element not found or timeout
` : ''}

${diagnosticContext.networkErrors && diagnosticContext.networkErrors.length > 0 ? `NETWORK ERRORS:
${diagnosticContext.networkErrors.map(err => `  • ${err}`).join('\n')}
` : ''}

STACK TRACE:
${diagnosticContext.errorStack}

REQUIRED ANALYSIS:
1. **Root Cause**: Identify the primary issue
   - Is this a Database timeout?
   - Is this an API schema change?
   - Is this a UI locator/DOM change?
   - Is this a network connectivity issue?
   - Is this an authentication problem?
   - Other?

2. **Why It Happened**: Explain the underlying reason
   - Recent code changes that could cause this?
   - External dependency changes?
   - Timing/race conditions?

3. **Impact & Severity**: What's affected?
   - Critical path or edge case?
   - Blocking or non-blocking?

4. **Recommended Fix**: Provide specific steps
   - Code changes needed?
   - Configuration updates?
   - Test adjustments?

5. **Prevention**: How to prevent recurrence?
   - Code improvements?
   - Better error handling?
   - Enhanced monitoring?
   - Test enhancements?

6. **Quick Workaround**: If available, provide immediate steps to mitigate
        `.trim();

        // Display quick AI summary (immediate feedback)
        console.log(generateQuickSummary(diagnosticContext.errorMessage, errorCategories, locatorInfo));

        // Send to Copilot SDK for detailed analysis
        if (token) {
          try {
            let result;
            
            // Try different Copilot methods with timeout
            const analysisPromise = (async () => {
              if (copilotClient?.analyze) {
                return await copilotClient.analyze(diagnosticPrompt);
              } else if (copilotClient?.request) {
                return await copilotClient.request({ prompt: diagnosticPrompt });
              } else if (copilotClient?.diagnose) {
                return await copilotClient.diagnose(diagnosticPrompt);
              }
            })();

            // Wait for response with timeout
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 2000));
            result = await Promise.race([analysisPromise, timeoutPromise]);

            if (result) {
              console.log('\n💡 DETAILED COPILOT ANALYSIS:');
              console.log(result);
            }
          } catch (err) {
            // Silent fail
          }
        }
      },
    };

    await use(aiDiagnostics);
  },
});

export { expect };
