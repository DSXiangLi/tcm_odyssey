"""Test script to check GLM-4 API response structure with streaming."""
import os
import json
from dotenv import load_dotenv
from pathlib import Path
from openai import OpenAI

# Load environment from parent directory
load_dotenv(Path(__file__).parent.parent / '.env')

# Initialize client
api_key = os.getenv('GLM_API_KEY')
base_url = os.getenv('GLM_API_BASE')
model_name = os.getenv('GLM_MODEL_NAME')

print(f"Testing GLM-4 API: {base_url} with model {model_name}")
print(f"API Key: {api_key[:10]}...")

client = OpenAI(api_key=api_key, base_url=base_url)

# Test with a simple question that might trigger thinking
test_message = "请解释一下中医的阴阳理论，并说明它在诊断中的应用"

print("\n=== Testing streaming response ===")
print(f"Message: {test_message}")

response = client.chat.completions.create(
    model=model_name,
    messages=[
        {'role': 'user', 'content': test_message}
    ],
    stream=True
)

# Collect all chunks and analyze structure
all_chunks = []
for chunk in response:
    all_chunks.append(chunk)

    # Analyze each chunk's structure
    if chunk.choices:
        delta = chunk.choices[0].delta

        # Check what fields delta has
        delta_fields = list(delta.__dict__.keys())

        # Print first 5 chunks to see structure
        if len(all_chunks) <= 5:
            print(f"\nChunk {len(all_chunks)}:")
            print(f"  Delta fields: {delta_fields}")

            # Check for specific fields
            if hasattr(delta, 'content') and delta.content:
                print(f"  content: {delta.content[:50]}...")
            if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                print(f"  reasoning_content: {delta.reasoning_content[:50]}...")
            if hasattr(delta, 'thinking') and delta.thinking:
                print(f"  thinking: {delta.thinking[:50]}...")
            if hasattr(delta, 'tool_calls') and delta.tool_calls:
                print(f"  tool_calls: {delta.tool_calls}")

print(f"\nTotal chunks received: {len(all_chunks)}")

# Check the first chunk for any special fields
if all_chunks:
    first_chunk = all_chunks[0]
    print("\n=== First chunk full structure ===")
    print(json.dumps(first_chunk.__dict__, indent=2, default=str))

# Check for reasoning/thinking in any chunk
has_reasoning = False
has_thinking = False
for chunk in all_chunks:
    if chunk.choices:
        delta = chunk.choices[0].delta
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
            has_reasoning = True
            print(f"\nFound reasoning_content in chunk {all_chunks.index(chunk)}")
            print(f"Content: {delta.reasoning_content[:100]}...")
        if hasattr(delta, 'thinking') and delta.thinking:
            has_thinking = True
            print(f"\nFound thinking in chunk {all_chunks.index(chunk)}")
            print(f"Content: {delta.thinking[:100]}...")

if not has_reasoning and not has_thinking:
    print("\nNo reasoning_content or thinking fields found in response")
    print("This model might not support explicit reasoning output")

print("\n=== Test complete ===")