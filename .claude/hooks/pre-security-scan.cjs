#!/usr/bin/env node
/**
 * PreToolUse Hook: Security Scan for Sensitive Information
 *
 * Comprehensive scanner for detecting sensitive information before tool execution:
 * - API keys (OpenAI, Anthropic, GitHub, AWS, Google, etc.)
 * - Passwords and authentication tokens
 * - Certificate files (.key, .pem, .crt)
 * - Credential files (.env, auth.json, config.yaml, credentials/)
 * - Generic patterns (api_key=xxx, password=xxx, token=xxx)
 *
 * Works with multiple tool types:
 * - Bash: Check git operations, file commands
 * - Write/Edit: Check file content being written/edited
 *
 * Exit codes:
 *   0 - Success (no sensitive info detected)
 *   2 - Block tool execution (sensitive info found)
 *
 * Based on CLAUDE.md security requirements:
 * - Never commit API keys, passwords, tokens
 * - Never commit .env, auth.json, config.yaml
 * - Never commit private keys, certificates
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MAX_STDIN = 1024 * 1024; // 1MB limit

// ========================================
// SENSITIVE INFORMATION PATTERNS
// ========================================

const SECRET_PATTERNS = {
  // API Keys - Specific Providers
  apiKeys: [
    { pattern: /sk-[a-zA-Z0-9\-]{20,}/g, name: 'OpenAI API Key', severity: 'critical' },
    { pattern: /sk-ant-api03-[a-zA-Z0-9\-]{95,}/g, name: 'Anthropic API Key', severity: 'critical' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token', severity: 'critical' },
    { pattern: /gho_[a-zA-Z0-9]{36}/g, name: 'GitHub OAuth Access Token', severity: 'critical' },
    { pattern: /ghu_[a-zA-Z0-9]{36}/g, name: 'GitHub User-to-Server Token', severity: 'critical' },
    { pattern: /ghs_[a-zA-Z0-9]{36}/g, name: 'GitHub Server-to-Server Token', severity: 'critical' },
    { pattern: /ghr_[a-zA-Z0-9]{36}/g, name: 'GitHub Refresh Token', severity: 'critical' },
    { pattern: /AKIA[A-Z0-9]{16}/g, name: 'AWS Access Key ID', severity: 'critical' },
    { pattern: /ASIA[A-Z0-9]{16}/g, name: 'AWS Temporary Access Key ID', severity: 'critical' },
    { pattern: /AIza[a-zA-Z0-9\-]{35}/g, name: 'Google API Key', severity: 'critical' },
    { pattern: /ya29\.[a-zA-Z0-9\-]{50,}/g, name: 'Google OAuth Access Token', severity: 'critical' },
    { pattern: /xox[baprs]-[a-zA-Z0-9\-]{10,}/g, name: 'Slack Token', severity: 'critical' },
    { pattern: /eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, name: 'JWT Token', severity: 'high' },
  ],

  // Generic API Key Patterns
  genericPatterns: [
    { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/gi, name: 'API Key Assignment', severity: 'high' },
    { pattern: /access[_-]?token\s*[=:]\s*['"][^'"]{10,}['"]/gi, name: 'Access Token Assignment', severity: 'high' },
    { pattern: /auth[_-]?token\s*[=:]\s*['"][^'"]{10,}['"]/gi, name: 'Auth Token Assignment', severity: 'high' },
    { pattern: /secret[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/gi, name: 'Secret Key Assignment', severity: 'high' },
    { pattern: /private[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/gi, name: 'Private Key Assignment', severity: 'critical' },
  ],

  // Password Patterns
  passwords: [
    { pattern: /password\s*[=:]\s*['"][^'"]{4,}['"]/gi, name: 'Password Assignment', severity: 'critical' },
    { pattern: /passwd\s*[=:]\s*['"][^'"]{4,}['"]/gi, name: 'Password Assignment (passwd)', severity: 'critical' },
    { pattern: /pwd\s*[=:]\s*['"][^'"]{4,}['"]/gi, name: 'Password Assignment (pwd)', severity: 'critical' },
    { pattern: /db[_-]?password\s*[=:]\s*['"][^'"]{4,}['"]/gi, name: 'Database Password', severity: 'critical' },
    { pattern: /mysql[_-]?password\s*[=:]\s*['"][^'"]{4,}['"]/gi, name: 'MySQL Password', severity: 'critical' },
    { pattern: /postgres[_-]?password\s*[=:]\s*['"][^'"]{4,}['"]/gi, name: 'PostgreSQL Password', severity: 'critical' },
    // JSON/YAML格式密码字段 (字段名也被引号包裹)
    { pattern: /["']password["']\s*[=:]\s*["'][^"']{4,}["']/gi, name: 'Password in JSON/YAML', severity: 'critical' },
    { pattern: /["']passwd["']\s*[=:]\s*["'][^"']{4,}["']/gi, name: 'Password in JSON (passwd)', severity: 'critical' },
    { pattern: /["']pwd["']\s*[=:]\s*["'][^"']{4,}["']/gi, name: 'Password in JSON (pwd)', severity: 'critical' },
    { pattern: /["']db[_-]?password["']\s*[=:]\s*["'][^"']{4,}["']/gi, name: 'Database Password in JSON', severity: 'critical' },
  ],

  // Environment Variable Patterns
  envPatterns: [
    { pattern: /GLM_API_KEY\s*[=:]/g, name: 'GLM API Key Environment Variable', severity: 'critical' },
    { pattern: /ANTHROPIC_API_KEY\s*[=:]/g, name: 'Anthropic API Key Environment Variable', severity: 'critical' },
    { pattern: /OPENAI_API_KEY\s*[=:]/g, name: 'OpenAI API Key Environment Variable', severity: 'critical' },
  ],
};

// ========================================
// SENSITIVE FILE PATTERNS
// ========================================

const SENSITIVE_FILES = {
  // Credential Files
  credentialFiles: [
    { pattern: /\.env$/i, name: 'Environment Variables File', severity: 'critical' },
    { pattern: /\.env\.local$/i, name: 'Local Environment Variables', severity: 'critical' },
    { pattern: /\.env\.production$/i, name: 'Production Environment Variables', severity: 'critical' },
    { pattern: /auth\.json$/i, name: 'Authentication JSON File', severity: 'critical' },
    { pattern: /config\.yaml$/i, name: 'YAML Config File (may contain secrets)', severity: 'high' },
    { pattern: /config\.yml$/i, name: 'YML Config File (may contain secrets)', severity: 'high' },
    { pattern: /credentials\.json$/i, name: 'Credentials JSON File', severity: 'critical' },
    { pattern: /secrets\.json$/i, name: 'Secrets JSON File', severity: 'critical' },
    { pattern: /\.htpasswd$/i, name: 'Apache Password File', severity: 'critical' },
  ],

  // Certificate Files
  certificateFiles: [
    { pattern: /\.key$/i, name: 'Private Key File', severity: 'critical' },
    { pattern: /\.pem$/i, name: 'PEM Certificate/Private Key', severity: 'critical' },
    { pattern: /\.crt$/i, name: 'Certificate File', severity: 'high' },
    { pattern: /\.cer$/i, name: 'Certificate File', severity: 'high' },
    { pattern: /\.p12$/i, name: 'PKCS#12 Certificate', severity: 'critical' },
    { pattern: /\.pfx$/i, name: 'PFX Certificate', severity: 'critical' },
  ],

  // Directory Patterns
  sensitiveDirectories: [
    { pattern: /\/secrets\/$/i, name: 'Secrets Directory', severity: 'critical' },
    { pattern: /\/credentials\/$/i, name: 'Credentials Directory', severity: 'critical' },
    { pattern: /\/\.ssh\/$/i, name: 'SSH Keys Directory', severity: 'critical' },
    { pattern: /\/private\/$/i, name: 'Private Files Directory', severity: 'high' },
  ],

  // Cache Files (based on CLAUDE.md experience)
  cacheFiles: [
    { pattern: /models_dev_cache\.json$/i, name: 'Model Dev Cache (may contain API info)', severity: 'high' },
  ],
};

// ========================================
// FILE CONTENT SCANNER
// ========================================

/**
 * Scan file content for sensitive information
 * @param {string} content - File content to scan
 * @param {string} filePath - File path for context
 * @returns {object[]} Array of detected issues
 */
function scanContentForSecrets(content, filePath) {
  const issues = [];

  if (!content || content.trim() === '') {
    return issues;
  }

  const lines = content.split('\n');

  // Skip binary files or very large content
  if (lines.length > 10000) {
    return issues;
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip commented lines (but still check for secrets in comments)
    const isComment = line.trim().startsWith('#') ||
                      line.trim().startsWith('//') ||
                      line.trim().startsWith('*') ||
                      line.trim().startsWith('/*');

    // 优先检测特定模式 (critical severity)
    // Order: apiKeys > envPatterns > passwords > genericPatterns
    const priorityOrder = ['apiKeys', 'envPatterns', 'passwords', 'genericPatterns'];

    for (const categoryName of priorityOrder) {
      const category = SECRET_PATTERNS[categoryName];
      if (!category) continue;

      for (const { pattern, name, severity } of category) {
        // Reset regex state for each line
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(line)) !== null) {
          // Avoid duplicate matches
          const matchedText = match[0];

          // 检查是否已经检测到同样的位置
          const existingIssue = issues.find(i => i.line === lineNum && i.matched === matchedText.substring(0, 20));
          if (!existingIssue) {
            issues.push({
              type: 'secret',
              category: name,
              message: `${name} detected at line ${lineNum}`,
              line: lineNum,
              matched: matchedText.substring(0, 20) + (matchedText.length > 20 ? '...' : ''),
              severity: severity,
              context: line.trim().substring(0, 100)
            });
          }

          // 如果发现critical severity的问题，立即返回（不再检测其他模式）
          if (severity === 'critical') {
            return issues;
          }
        }
      }
    }
  });

  return issues;
}

/**
 * Check if a file path matches sensitive file patterns
 * @param {string} filePath - File path to check
 * @returns {object|null} Detected sensitive file or null
 */
function checkSensitiveFilePath(filePath) {
  if (!filePath) return null;

  const normalizedPath = path.normalize(filePath);

  for (const category of Object.values(SENSITIVE_FILES)) {
    for (const { pattern, name, severity } of category) {
      if (pattern.test(normalizedPath)) {
        return {
          type: 'sensitive_file',
          category: name,
          message: `Sensitive file detected: ${name}`,
          path: filePath,
          severity: severity
        };
      }
    }
  }

  return null;
}

// ========================================
// TOOL-SPECIFIC SCANNERS
// ========================================

/**
 * Scan Bash tool command for sensitive operations
 * @param {string} command - Bash command to scan
 * @returns {object[]} Array of detected issues
 */
function scanBashCommand(command) {
  const issues = [];

  if (!command) return issues;

  // Check for git operations with sensitive files
  if (command.includes('git ') && (command.includes('add') || command.includes('commit'))) {
    // Extract file paths from git command
    const pathMatch = command.match(/git\s+(?:add|commit)\s+(?:-[^\s]+\s+)*(.+)/);
    if (pathMatch) {
      const files = pathMatch[1].split(/\s+/).filter(f => f.length > 0);
      for (const file of files) {
        const sensitiveFile = checkSensitiveFilePath(file);
        if (sensitiveFile) {
          issues.push(sensitiveFile);
        }
      }
    }
  }

  // Check for file operations with sensitive files
  if (command.includes('cp ') || command.includes('mv ') || command.includes('rm ')) {
    const files = command.split(/\s+/).slice(1).filter(f => !f.startsWith('-') && f.length > 0);
    for (const file of files) {
      const sensitiveFile = checkSensitiveFilePath(file);
      if (sensitiveFile) {
        issues.push(sensitiveFile);
      }
    }
  }

  // Check for environment variable exports containing secrets
  if (command.includes('export ') || command.includes('set ')) {
    const contentIssues = scanContentForSecrets(command, 'bash command');
    issues.push(...contentIssues);
  }

  return issues;
}

/**
 * Scan Write/Edit tool parameters for sensitive content
 * @param {object} toolInput - Tool input parameters
 * @returns {object[]} Array of detected issues
 */
function scanWriteEditInput(toolInput) {
  const issues = [];

  const filePath = toolInput.file_path || toolInput.path;
  const content = toolInput.content || toolInput.new_string;

  // Check file path
  const sensitiveFile = checkSensitiveFilePath(filePath);
  if (sensitiveFile) {
    issues.push(sensitiveFile);
  }

  // Check content for secrets
  if (content) {
    const contentIssues = scanContentForSecrets(content, filePath);
    issues.push(...contentIssues);
  }

  return issues;
}

/**
 * Get staged files content for git commit check
 * @returns {object[]} Array of issues from staged files
 */
function scanStagedFiles() {
  const issues = [];

  try {
    // Get list of staged files
    const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.status !== 0 || !result.stdout) {
      return issues;
    }

    const stagedFiles = result.stdout.trim().split('\n').filter(f => f.length > 0);

    for (const file of stagedFiles) {
      // Whitelist: Skip hook-related files (they contain detection patterns)
      if (file.includes('pre-security-scan.cjs') ||
          file.includes('SECURITY-HOOK-README.md') ||
          file.includes('test-security-hook.sh') ||
          file.includes('security-hook-design.md')) {
        continue;  // Skip these files
      }

      // Check file path
      const sensitiveFile = checkSensitiveFilePath(file);
      if (sensitiveFile) {
        issues.push({
          ...sensitiveFile,
          message: `Staged sensitive file: ${sensitiveFile.category}`,
          path: file
        });
      }

      // Check file content
      const contentResult = spawnSync('git', ['show', `:${file}`], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (contentResult.status === 0 && contentResult.stdout) {
        const contentIssues = scanContentForSecrets(contentResult.stdout, file);
        issues.push(...contentIssues);
      }
    }
  } catch (error) {
    // Git not available or not in a git repo
  }

  return issues;
}

// ========================================
// ISSUE REPORTING
// ========================================

/**
 * Format and report detected issues
 * @param {object[]} issues - Array of detected issues
 * @returns {string} Formatted report
 */
function formatIssueReport(issues) {
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium' || !i.severity);

  let report = '\n╔══════════════════════════════════════════════════════════════╗\n';
  report += '║          🔴 SECURITY WARNING: Sensitive Information Detected          ║\n';
  report += '╚══════════════════════════════════════════════════════════════╝\n\n';

  if (critical.length > 0) {
    report += 'CRITICAL ISSUES (BLOCKING):\n';
    report += '─'.repeat(60) + '\n';
    for (const issue of critical) {
      report += `  ❌ ${issue.category || issue.type}\n`;
      report += `     File: ${issue.path || 'N/A'}\n`;
      if (issue.line) report += `     Line: ${issue.line}\n`;
      if (issue.matched) report += `     Match: "${issue.matched}"\n`;
      report += '\n';
    }
  }

  if (high.length > 0) {
    report += 'HIGH SEVERITY ISSUES:\n';
    report += '─'.repeat(60) + '\n';
    for (const issue of high) {
      report += `  ⚠️  ${issue.category || issue.type}\n`;
      report += `     File: ${issue.path || 'N/A'}\n`;
      if (issue.line) report += `     Line: ${issue.line}\n`;
      if (issue.matched) report += `     Match: "${issue.matched}"\n`;
      report += '\n';
    }
  }

  if (medium.length > 0) {
    report += 'OTHER ISSUES:\n';
    report += '─'.repeat(60) + '\n';
    for (const issue of medium) {
      report += `  ℹ️  ${issue.category || issue.type}\n`;
      report += `     File: ${issue.path || 'N/A'}\n`;
      if (issue.line) report += `     Line: ${issue.line}\n`;
      report += '\n';
    }
  }

  report += '─'.repeat(60) + '\n';
  report += `Total: ${issues.length} issue(s) (${critical.length} critical, ${high.length} high, ${medium.length} other)\n`;
  report += '─'.repeat(60) + '\n\n';

  report += 'RECOMMENDED ACTIONS:\n';
  report += '1. Remove sensitive information from files\n';
  report += '2. Use environment variables instead of hardcoded secrets\n';
  report += '3. Add sensitive files to .gitignore\n';
  report += '4. If secrets were already committed, rotate them immediately\n\n';

  report += 'Example fixes:\n';
  report += '  ❌ api_key = "sk-1234567890abcdef"\n';
  report += '  ✅ api_key = os.getenv("API_KEY")\n\n';

  return report;
}

// ========================================
// MAIN EVALUATION FUNCTION
// ========================================

/**
 * Core logic — exported for direct invocation
 * @param {string} rawInput - Raw JSON string from stdin
 * @returns {{output:string, exitCode:number}} Pass-through output and exit code
 */
function evaluate(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // Whitelist: Skip security check for hook script itself
    // (Hook contains regex patterns for detection, which would trigger itself)
    const filePath = toolInput.file_path || toolInput.path || '';
    const command = toolInput.command || '';

    if (filePath.includes('pre-security-scan.cjs') ||
        filePath.includes('SECURITY-HOOK-README.md') ||
        filePath.includes('test-security-hook.sh') ||
        command.includes('pre-security-scan.cjs') ||
        command.includes('SECURITY-HOOK-README.md')) {
      // Allow hook-related files without checking
      return { output: rawInput, exitCode: 0 };
    }

    let issues = [];

    // Tool-specific scanning
    if (toolName === 'Bash') {
      const command = toolInput.command || '';

      // Git commit check - scan staged files
      if (command.includes('git commit') && !command.includes('--amend')) {
        issues = scanStagedFiles();
      }

      // General command scan
      const commandIssues = scanBashCommand(command);
      issues.push(...commandIssues);

    } else if (toolName === 'Write' || toolName === 'Edit' || toolName === 'MultiEdit') {
      issues = scanWriteEditInput(toolInput);
    }

    // Report and block if critical issues found
    if (issues.length > 0) {
      const criticalCount = issues.filter(i => i.severity === 'critical').length;

      console.error(formatIssueReport(issues));

      if (criticalCount > 0) {
        console.error('[Hook] BLOCKED: Critical security issues detected. Tool execution prevented.');
        return { output: rawInput, exitCode: 2 };
      } else {
        console.error('[Hook] WARNING: Security concerns detected. Proceed with caution.');
      }
    }

  } catch (error) {
    console.error(`[Hook] Error: ${error.message}`);
    // Non-blocking on error - allow tool to proceed
  }

  return { output: rawInput, exitCode: 0 };
}

function run(rawInput) {
  return evaluate(rawInput).output;
}

// ── stdin entry point ────────────────────────────────────────────
if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', chunk => {
    if (data.length < MAX_STDIN) {
      const remaining = MAX_STDIN - data.length;
      data += chunk.substring(0, remaining);
    }
  });

  process.stdin.on('end', () => {
    const result = evaluate(data);
    process.stdout.write(result.output);
    process.exit(result.exitCode);
  });
}

module.exports = { run, evaluate, scanContentForSecrets, checkSensitiveFilePath };