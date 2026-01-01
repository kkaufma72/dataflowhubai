# Data Layer Consolidation Complete

## ✅ What Was Refactored

We've consolidated the data layer to use **MinIO/S3 as the single source of truth for blobs**, storing only metadata and presigned URLs in Postgres.

### Key Changes

1. **StorageService** (`backend/services/storage_service.py`)
   - Centralized S3/MinIO client wrapper
   - Presigned URL generation (upload & download)
   - File operations (upload, download, delete, exists, metadata)
   - Checksum computation utilities

2. **DataServiceRefactored** (`backend/services/data_service_refactored.py`)
   - Uses StorageService instead of direct MinIO client
   - Implements presigned URL workflow (recommended for large files)
   - Maintains backward-compatible server-side upload
   - Profiling and transformations still work on DataFrame

3. **Database Schema** (`supabase/migrations/20260101000000_add_s3_storage_columns.sql`)
   - Added S3 fields to `datasets` table:
     - `s3_key`, `s3_bucket`, `storage_provider`
     - `content_type`, `checksum`, `storage_metadata`
   - Added S3 fields to `models` table:
     - `artifact_s3_key`, `artifact_s3_bucket`, `artifact_storage_provider`
     - `artifact_content_type`, `artifact_checksum`, `artifact_storage_metadata`
   - Indexes on S3 keys for fast lookups
   - Helper functions: `get_dataset_download_info()`, `get_model_artifact_info()`

4. **Updated Schemas** (`backend/schemas/dataset.py`)
   - Added S3 storage fields to `Dataset` model
   - New schemas:
     - `PresignedUploadRequest` / `PresignedUploadResponse`
     - `ConfirmUploadRequest`
     - `DownloadUrlResponse`

---

## 🚀 Presigned URL Workflow (Recommended)

### Upload Flow

```
Client                          API Server                    MinIO/S3
  |                                  |                            |
  |  POST /datasets/upload-url       |                            |
  |--------------------------------->|                            |
  |                                  | generate_presigned_url()   |
  |                                  |--------------------------->|
  |  { upload_url, s3_key,          |                            |
  |    dataset_id }                  |                            |
  |<---------------------------------|                            |
  |                                                               |
  |  PUT <upload_url> (file binary)                              |
  |-------------------------------------------------------------->|
  |                                                               |
  |  POST /datasets/confirm-upload                               |
  |  { dataset_id, s3_key, file_size }                           |
  |--------------------------------->|                            |
  |                                  | verify_object_exists()     |
  |                                  |--------------------------->|
  |                                  | INSERT metadata into PG    |
  |  { dataset_id, status: "uploaded" }                          |
  |<---------------------------------|                            |
```

### Download Flow

```
Client                          API Server                    MinIO/S3
  |                                  |                            |
  |  GET /datasets/{id}/download-url |                            |
  |--------------------------------->|                            |
  |                                  | SELECT s3_key from PG      |
  |                                  | generate_presigned_url()   |
  |                                  |--------------------------->|
  |  { download_url, filename,      |                            |
  |    expires_in: 3600 }            |                            |
  |<---------------------------------|                            |
  |                                                               |
  |  GET <download_url>                                          |
  |-------------------------------------------------------------->|
  |  <file binary>                                               |
  |<--------------------------------------------------------------|
```

---

## 📊 Postgres Schema Changes

Run migration:

```bash
# Apply locally (if using Supabase CLI)
supabase db push

# Or via Supabase Dashboard → SQL Editor → paste migration
```

### New Columns (datasets)

- `s3_key` (TEXT): Object key in S3
- `s3_bucket` (TEXT): Bucket name (default: "datasets")
- `storage_provider` (TEXT): "minio", "s3", or "gcs"
- `content_type` (TEXT): MIME type
- `checksum` (TEXT): MD5/SHA256 for integrity
- `storage_metadata` (JSONB): Additional metadata

### New Columns (models)

- `artifact_s3_key`, `artifact_s3_bucket`, `artifact_storage_provider`
- `artifact_content_type`, `artifact_checksum`, `artifact_storage_metadata`

---

## 🔌 Integration Checklist

### Backend Routes (TODO)

1. **Create presigned upload endpoint**:
   ```python
   @router.post("/datasets/upload-url")
   async def get_upload_url(
       request: PresignedUploadRequest,
       storage: StorageService = Depends(get_storage_service),
       user: User = Depends(get_current_user),
   ):
       data_service = DataServiceRefactored(storage)
       return await data_service.get_upload_url(request, user.id)
   ```

2. **Create confirm upload endpoint**:
   ```python
   @router.post("/datasets/confirm-upload")
   async def confirm_upload(
       request: ConfirmUploadRequest,
       storage: StorageService = Depends(get_storage_service),
       user: User = Depends(get_current_user),
   ):
       data_service = DataServiceRefactored(storage)
       return await data_service.confirm_upload(request, user.id, ...)
   ```

3. **Create download URL endpoint**:
   ```python
   @router.get("/datasets/{dataset_id}/download-url")
   async def get_download_url(
       dataset_id: str,
       storage: StorageService = Depends(get_storage_service),
       user: User = Depends(get_current_user),
   ):
       data_service = DataServiceRefactored(storage)
       return await data_service.get_download_url(dataset_id, user.id)
   ```

### Frontend Integration

Update `src/lib/api.ts` to use presigned URLs:

```typescript
// 1. Get upload URL
const { upload_url, s3_key, dataset_id } = await fetch('/api/datasets/upload-url', {
  method: 'POST',
  body: JSON.stringify({ filename, content_type, dataset_name })
});

// 2. Upload directly to S3
await fetch(upload_url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': content_type }
});

// 3. Confirm upload
await fetch('/api/datasets/confirm-upload', {
  method: 'POST',
  body: JSON.stringify({ dataset_id, s3_key, file_size })
});
```

---

## 🧹 Migration Path

1. **Phase 1** (Current):
   - Schema updated ✅
   - StorageService created ✅
   - DataServiceRefactored created ✅
   - Presigned URL schemas added ✅

2. **Phase 2** (Next):
   - Add API endpoints (`upload-url`, `confirm-upload`, `download-url`)
   - Update frontend to use presigned URLs
   - Test with real uploads/downloads

3. **Phase 3** (Optional):
   - Backfill existing datasets: populate `s3_key` from `storage_path`
   - Deprecate/remove `data` BLOB columns from Postgres
   - Add S3 lifecycle policies (auto-delete old datasets)

---

## 🎯 Benefits

- **Postgres stays lightweight**: Only metadata, no blobs
- **Faster queries**: Indexes on s3_key, no BLOB scanning
- **Scalable uploads**: Clients upload directly to S3 (no API server bottleneck)
- **Better security**: Presigned URLs expire after 1 hour
- **Cost-effective**: S3 is cheaper than Postgres storage for large files
- **Multi-cloud ready**: Easy to swap MinIO → S3 → GCS by changing `storage_provider`

---

## 📚 Related Files

- `backend/services/storage_service.py` — Centralized S3/MinIO client
- `backend/services/data_service_refactored.py` — Refactored data service
- `backend/schemas/dataset.py` — Updated schemas with S3 fields
- `supabase/migrations/20260101000000_add_s3_storage_columns.sql` — Schema migration

---

## 🧪 Testing Locally

```bash
# 1. Start MinIO
docker-compose up -d minio

# 2. Apply migration
supabase db push

# 3. Test presigned upload
curl -X POST http://localhost:8000/api/datasets/upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"filename": "test.csv", "dataset_name": "Test Dataset"}'

# 4. Upload file to returned URL
curl -X PUT "<presigned_upload_url>" \
  --upload-file test.csv \
  -H "Content-Type: text/csv"

# 5. Confirm upload
curl -X POST http://localhost:8000/api/datasets/confirm-upload \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dataset_id": "...", "s3_key": "...", "file_size": 1234}'
```

---

**Status**: Schema + services ready. Next: wire up API endpoints and frontend integration.
