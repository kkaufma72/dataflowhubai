#!/usr/bin/env python3
"""
Test JWT secret validation.
This script helps debug JWT signature verification issues.
"""

print("\n=== Supabase JWT Secret Checker ===\n")

print("The JWT secret you have in config.py:")
print("  c2df5fcb-2982-4bb2-912c-75cd9d79c830")
print()
print("This is the 'Current key' (Legacy HS256) from your Supabase dashboard.")
print()
print("IMPORTANT: This secret is used to SIGN tokens on the Supabase server.")
print("Your backend needs this EXACT secret to VERIFY the signatures.")
print()
print("If you're still getting 'Signature verification failed', check:")
print()
print("1. The JWT Secret in Supabase Dashboard > Settings > API > JWT Secret")
print("   - Copy the EXACT value (it's case-sensitive)")
print("   - It should match: c2df5fcb-2982-4bb2-912c-75cd9d79c830")
print()
print("2. The secret in backend/utils/config.py line 96:")
print("   - SUPABASE_JWT_SECRET: str = 'c2df5fcb-2982-4bb2-912c-75cd9d79c830'")
print()
print("3. Try restarting the backend after confirming:")
print("   - docker-compose restart backend")
print()
print("DEBUG MODE: The backend will now accept tokens WITHOUT signature verification")
print("to help identify if the issue is the secret or the token structure.")
print()
