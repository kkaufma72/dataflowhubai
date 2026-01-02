import base64
import json

# Your Supabase anon key
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JweGdrdHZnZnNmZmRzaW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDE1NDQsImV4cCI6MjA3NjQxNzU0NH0.xI0sbMYLa7ln-XcbESHr4Y9tLNzg_LLkZAySj0O5a04"

# Decode the payload (second part)
parts = anon_key.split('.')
payload = parts[1]
# Add padding if needed
padding = 4 - len(payload) % 4
if padding != 4:
    payload += '=' * padding

decoded = base64.urlsafe_b64decode(payload)
data = json.loads(decoded)

print("Your Supabase project details:")
print(f"  Project Ref: {data.get('ref')}")
print(f"  Issuer: {data.get('iss')}")
print(f"  Role: {data.get('role')}")
print("\nNote: The JWT secret cannot be extracted from the anon key.")
print("You must get it from: Supabase Dashboard > Settings > API > JWT Secret")
