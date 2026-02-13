# Playwright Debugging Supercharged by GitHub Copilot

A powerful testing framework that combines **Playwright**, **GitHub Copilot SDK**, and **GitHub Copilot CLI** to provide intelligent, AI-powered debugging and diagnostics for test failures.

## 🎯 Project Goal

This project demonstrates how to leverage GitHub Copilot to supercharge Playwright test debugging by:
- **Automatically analyzing test failures** with AI-powered root cause identification
- **Providing intelligent remediation suggestions** using the Copilot SDK
- **Categorizing errors** (timeouts, locator issues, network problems, auth failures, etc.)
- **Generating actionable insights** with quick summaries and prevention strategies

## 🔧 How This Uses GitHub Copilot

### 1. **GitHub Copilot SDK Integration**
The project uses the `@github/copilot-sdk` package to send detailed diagnostic prompts to GitHub Copilot for analysis:

```typescript
// From src/fixtures/ai-diagnostics.ts
const CopilotModule = await import('@github/copilot-sdk');
copilotClient = new CopilotModule.CopilotClient();
```

When a test fails, the SDK sends a comprehensive error analysis prompt to Copilot, which returns:
- Root cause identification
- Why the error occurred
- Impact & severity assessment
- Recommended fixes with specific steps
- Prevention strategies
- Quick workarounds

### 2. **GitHub Copilot CLI (ghcp)**
While this project primarily uses the SDK, the Copilot CLI complements it by:
- Providing real-time code analysis and suggestions during development
- Helping diagnose issues in the test setup and configuration
- Offering suggestions for test improvements and best practices

**Usage with ghcp:**
```bash
ghcp status                    # Check integration status
ghcp explain <file>           # Get explanations of test fixtures
ghcp suggest <file>           # Get suggestions for improvements
```

## 📋 Key Features

### AI-Powered Error Analysis
- **Real-time categorization** of errors (Database Timeout, UI Locator Issues, Network Problems, Auth Failures, etc.)
- **Automatic locator extraction** from error messages
- **Comprehensive diagnostic context** collection (page URL, timestamp, platform, stack trace)

### Quick Summary Output
Every test failure displays:
```
✅ AI ANALYSIS SUMMARY
================================================================
🎯 ROOT CAUSE: Identifies the primary issue
📍 WHY IT HAPPENED: Explains the underlying reason
🔧 RECOMMENDED FIX: Provides specific action items
🛡️ PREVENTION: Strategies to prevent recurrence
```

### Detailed Copilot Analysis
When configured with a GitHub token, sends detailed prompts to Copilot for deep analysis:
```
💡 DETAILED COPILOT ANALYSIS:
[Copilot's detailed response with multiple sections of analysis]
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Create .env file with GitHub token (optional, for full Copilot SDK features)
echo "GITHUB_TOKEN=your_github_token_here" > .env
```

### Running Tests

```bash
# Run all tests
npm test

# Run with UI mode
npm run test:ui

# Run with debug mode (Playwright Inspector)
npm run test:debug

# Run in headed mode (see browser)
npm run test:headed
```

## 📁 Project Structure

```
.
├── src/
│   └── fixtures/
│       └── ai-diagnostics.ts       # AI diagnostic fixture for tests
├── tests/
│   └── ai-diagnostics.spec.ts      # Example test with AI diagnostics
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## 🧪 Example Test

```typescript
import { test, expect } from '../src/fixtures/ai-diagnostics';

test('Login with valid credentials', async ({ page, aiDiagnostics }) => {
  try {
    await page.goto('https://www.saucedemo.com/');
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    
    await expect(page).toHaveURL(/.*inventory/);
  } catch (error) {
    // AI diagnostics automatically analyzes the error
    await aiDiagnostics.analyzeError(error as Error);
    throw error;
  }
});
```

## 🔐 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# GitHub token for Copilot SDK analysis
GITHUB_TOKEN=ghp_your_token_here
# Or use GH_TOKEN
GH_TOKEN=ghp_your_token_here
```

### Getting Your GitHub Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token"
3. Select scopes: `read:user`, `user:email`, `repo`
4. Copy the token and add to `.env`

## 📊 Test Reports

After running tests, reports are generated in:
- **HTML Report**: `playwright-report/`
- **JSON Results**: `test-results.json`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)

View HTML report:
```bash
npx playwright show-report
```

## 🛠️ How AI Diagnostics Works

1. **Error Capture**: When a test fails, the error is caught in a try-catch block
2. **Context Collection**: Diagnostic context (URL, timestamp, platform, stack trace) is gathered
3. **Quick Analysis**: Immediate categorization and summary displayed to console
4. **SDK Analysis**: If GitHub token is available, sends detailed prompt to Copilot
5. **Output**: Displays both quick summary and detailed Copilot analysis

### Error Categories Recognized

- ⏱️ **Database/API Timeout** - Backend service is slow
- 🎨 **UI Locator/DOM Change** - Element selector changed or missing
- 🔌 **Network/Connection Issue** - Network connectivity problems
- 🔑 **Authentication/Authorization** - Auth failures or permission issues
- 🚫 **Resource Not Found** - 404 or missing resources
- ✅ **Data Validation Error** - Invalid data format
- ❓ **Unknown Error** - Unclassified errors

## 💡 Use Cases

### Development & Debugging
- **Faster root cause identification** - AI analyzes errors instantly
- **Actionable suggestions** - Get specific fixes, not generic advice
- **Error prevention** - Learn patterns to avoid future failures

### CI/CD Pipelines
- **Automated analysis** - No manual debugging required
- **Intelligent alerts** - Get summaries of what failed and why
- **Knowledge capture** - Build institutional knowledge from failures

### Test Maintenance
- **Locator change detection** - Quickly identify UI changes
- **Flakiness diagnosis** - Distinguish timing issues from real failures
- **Risk assessment** - Understand severity of failures

## 📦 Dependencies

### Main Dependencies
- **@playwright/test**: ^1.58.2 - Testing framework
- **@github/copilot-sdk**: ^0.1.22 - GitHub Copilot SDK for analysis
- **dotenv**: ^17.3.1 - Environment variable management
- **pino**: ^10.3.1 - Structured logging
- **zod**: ^4.3.6 - Schema validation

### Dev Dependencies
- **typescript**: ^5.9.3 - TypeScript support
- **tsx**: ^4.21.0 - TypeScript execution
- **ts-node**: ^10.9.2 - Node with TypeScript support

## 🤝 Integration with Copilot CLI

To use this project with GitHub Copilot CLI:

```bash
# Install GitHub Copilot CLI (if not already installed)
npm install -g @github/copilot-cli

# Use Copilot to explain the test structure
ghcp explain tests/ai-diagnostics.spec.ts

# Get suggestions for test improvements
ghcp suggest src/fixtures/ai-diagnostics.ts

# Debug configuration
ghcp explain playwright.config.ts
```

## 📚 Advanced Features

### Custom Error Context
Pass additional context to the analyzer:

```typescript
await aiDiagnostics.analyzeError(error as Error, {
  networkErrors: ['Connection timeout', 'DNS lookup failed'],
  pageContent: 'Debug page content',
});
```

### Extending Error Categories
Modify `categorizeError()` function in `ai-diagnostics.ts` to add custom categories:

```typescript
if (errorMessage.includes('custom-pattern')) {
  categories.push('Custom Error Type');
}
```

## 🎓 Learning Resources

- [Playwright Documentation](https://playwright.dev)
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [GitHub Copilot CLI](https://github.com/github/copilot-cli)

## 📝 License

ISC

## 🤖 Powered By

- [Playwright](https://playwright.dev) - Modern web testing
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk) - AI-powered analysis
- [GitHub Copilot CLI](https://github.com/github/copilot-cli) - Copilot in terminal

---

**Created with ❤️ to supercharge Playwright testing with GitHub Copilot**
