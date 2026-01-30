# Railway DATABASE_URL helper

This helper explains how to URL-encode a Supabase password before setting `DATABASE_URL` in Railway. Replace the placeholders with your own values.

```
# 1) URL-encode your Supabase password (replace YOUR_PASSWORD)
python - <<'PY'
import urllib.parse
pw = "YOUR_PASSWORD"
print(urllib.parse.quote_plus(pw))
PY

# 2) Construct DATABASE_URL
# Pooled
DATABASE_URL="postgresql://<user>.<instance-id>:<encoded_password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Direct
DATABASE_URL="postgresql://<user>.<instance-id>:<encoded_password>@db.<instance-id>.supabase.co:5432/postgres"
```

Never commit live credentials. Rotate any previously exposed secrets immediately in Supabase and Railway.
