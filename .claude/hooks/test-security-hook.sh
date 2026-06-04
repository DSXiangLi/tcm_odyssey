#!/bin/bash
# Security Hook Test Script
# Tests the pre-security-scan.js hook with various scenarios

HOOK_SCRIPT="/home/lixiang/Desktop/zhongyi_game_v3/.claude/hooks/pre-security-scan.cjs"

echo "══════════════════════════════════════════════════════════════"
echo "   Security Hook Test Suite"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Test 1: No sensitive information (should PASS)
echo "Test 1: Safe content (should PASS)"
echo "──────────────────────────────────────────────────────────────"
TEST_INPUT_1='{"tool_name":"Write","tool_input":{"file_path":"/tmp/test.js","content":"const hello = \"world\"; console.log(hello);"}}'
echo "Input: $TEST_INPUT_1"
echo ""
RESULT_1=$(echo "$TEST_INPUT_1" | node "$HOOK_SCRIPT" 2>&1)
EXIT_CODE_1=$?
echo "Output: $RESULT_1"
echo "Exit Code: $EXIT_CODE_1"
if [ $EXIT_CODE_1 -eq 0 ]; then
  echo "✅ PASS: Hook allowed safe content"
else
  echo "❌ FAIL: Hook blocked safe content (exit code: $EXIT_CODE_1)"
fi
echo ""

# Test 2: OpenAI API key (should BLOCK)
echo "Test 2: OpenAI API Key (should BLOCK)"
echo "──────────────────────────────────────────────────────────────"
TEST_INPUT_2='{"tool_name":"Write","tool_input":{"file_path":"/tmp/test.js","content":"const api_key = \"sk-proj-1234567890abcdef1234567890abcdef\"; console.log(api_key);"}}'
echo "Input: $TEST_INPUT_2"
echo ""
RESULT_2=$(echo "$TEST_INPUT_2" | node "$HOOK_SCRIPT" 2>&1)
EXIT_CODE_2=$?
echo "Output: $RESULT_2"
echo "Exit Code: $EXIT_CODE_2"
if [ $EXIT_CODE_2 -eq 2 ]; then
  echo "✅ PASS: Hook blocked OpenAI API key"
else
  echo "❌ FAIL: Hook did not block API key (exit code: $EXIT_CODE_2)"
fi
echo ""

# Test 3: GitHub PAT (should BLOCK)
echo "Test 3: GitHub Personal Access Token (should BLOCK)"
echo "──────────────────────────────────────────────────────────────"
TEST_INPUT_3='{"tool_name":"Write","tool_input":{"file_path":"/tmp/test.js","content":"const token = \"ghp_123456789012345678901234567890123456\"; console.log(token);"}}'
echo "Input: $TEST_INPUT_3"
echo ""
RESULT_3=$(echo "$TEST_INPUT_3" | node "$HOOK_SCRIPT" 2>&1)
EXIT_CODE_3=$?
echo "Output: $RESULT_3"
echo "Exit Code: $EXIT_CODE_3"
if [ $EXIT_CODE_3 -eq 2 ]; then
  echo "✅ PASS: Hook blocked GitHub PAT"
else
  echo "❌ FAIL: Hook did not block GitHub PAT (exit code: $EXIT_CODE_3)"
fi
echo ""

# Test 4: .env file (should BLOCK)
echo "Test 4: .env File (should BLOCK)"
echo "──────────────────────────────────────────────────────────────"
TEST_INPUT_4='{"tool_name":"Write","tool_input":{"file_path":"/tmp/.env","content":"API_KEY=secret123"}}'
echo "Input: $TEST_INPUT_4"
echo ""
RESULT_4=$(echo "$TEST_INPUT_4" | node "$HOOK_SCRIPT" 2>&1)
EXIT_CODE_4=$?
echo "Output: $RESULT_4"
echo "Exit Code: $EXIT_CODE_4"
if [ $EXIT_CODE_4 -eq 2 ]; then
  echo "✅ PASS: Hook blocked .env file"
else
  echo "❌ FAIL: Hook did not block .env file (exit code: $EXIT_CODE_4)"
fi
echo ""

# Test 5: Password in config (should BLOCK)
echo "Test 5: Password Assignment (should BLOCK)"
echo "──────────────────────────────────────────────────────────────"
TEST_INPUT_5='{"tool_name":"Edit","tool_input":{"file_path":"/tmp/config.json","old_string":"{}","new_string":"{\"password\": \"my_secret_password123\"}"}}'
echo "Input: $TEST_INPUT_5"
echo ""
RESULT_5=$(echo "$TEST_INPUT_5" | node "$HOOK_SCRIPT" 2>&1)
EXIT_CODE_5=$?
echo "Output: $RESULT_5"
echo "Exit Code: $EXIT_CODE_5"
if [ $EXIT_CODE_5 -eq 2 ]; then
  echo "✅ PASS: Hook blocked password assignment"
else
  echo "❌ FAIL: Hook did not block password (exit code: $EXIT_CODE_5)"
fi
echo ""

# Test 6: Safe environment variable usage (should PASS)
echo "Test 6: Safe environment variable usage (should PASS)"
echo "──────────────────────────────────────────────────────────────"
TEST_INPUT_6='{"tool_name":"Write","tool_input":{"file_path":"/tmp/test.js","content":"const api_key = process.env.API_KEY; console.log(api_key);"}}'
echo "Input: $TEST_INPUT_6"
echo ""
RESULT_6=$(echo "$TEST_INPUT_6" | node "$HOOK_SCRIPT" 2>&1)
EXIT_CODE_6=$?
echo "Output: $RESULT_6"
echo "Exit Code: $EXIT_CODE_6"
if [ $EXIT_CODE_6 -eq 0 ]; then
  echo "✅ PASS: Hook allowed safe env var usage"
else
  echo "❌ FAIL: Hook blocked safe env var usage (exit code: $EXIT_CODE_6)"
fi
echo ""

echo "══════════════════════════════════════════════════════════════"
echo "   Test Summary"
echo "══════════════════════════════════════════════════════════════"
echo "Total tests: 6"
echo "Expected passes: 2 (Test 1, Test 6)"
echo "Expected blocks: 4 (Test 2, Test 3, Test 4, Test 5)"
echo ""

echo "If all tests pass, the security hook is working correctly!"
echo "══════════════════════════════════════════════════════════════"