# Property Hub

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.

---

## 🔄 Recent Backend Integration (Image URL Fix)

### Problem Solved
Previously, property images would expire after 15 minutes because the backend was storing pre-signed S3 URLs directly in the database. This caused images to become inaccessible when users searched for properties.

### Solution Implemented
The backend now stores **S3 keys** (permanent paths) instead of temporary signed URLs. Fresh signed URLs are generated on-demand whenever properties are fetched.

### How It Works

#### 1. **Upload Flow** (POST /api/upload/property-image, POST /api/upload/virtual-tour-video)
- Frontend uploads image/video to backend
- Backend uploads to S3 and returns: `{ key: "property-images/userId/timestamp-photo.jpg", filename: "photo.jpg" }`
- Frontend stores the **S3 key** for submission
- Frontend displays the **local URI** for preview

#### 2. **Create/Update Flow** (POST /api/properties, PUT /api/properties/:id)
- Frontend sends property data with **S3 keys** in `photos` array and `virtualTourUrl`
- Backend stores these **keys** in the database (not URLs)

#### 3. **Fetch Flow** (GET /api/properties, GET /api/properties/:id, GET /api/my-listings)
- Backend retrieves properties from database (with S3 keys)
- Backend generates **fresh signed URLs** (valid for 1 hour) for each photo and video
- Frontend receives and displays these **signed URLs**
- URLs are regenerated on every fetch, so they never expire from the user's perspective

### Code Changes

#### Files Modified:
1. **app/list-property.tsx**
   - Stores S3 keys from upload responses
   - Sends S3 keys to backend when creating property
   - Added validation to ensure upload responses contain `key` field

2. **app/edit-property/[id].tsx**
   - Extracts S3 keys from signed URLs when loading existing property
   - Maintains separate state for display URLs and S3 keys
   - Sends S3 keys to backend when updating property

3. **app/property/[id].tsx**
   - Displays signed URLs received from backend
   - Added logging to verify signed URLs are received

4. **app/(tabs)/(home)/index.tsx**
   - Displays signed URLs received from backend
   - Added logging to verify signed URLs are received

5. **app/(tabs)/profile.tsx**
   - Displays signed URLs received from backend
   - Added logging to verify signed URLs are received

### Testing Checklist
- ✅ Upload new property with photos → Photos display correctly
- ✅ Search for properties → All photos display correctly (even old ones)
- ✅ View property details → Photos and videos display correctly
- ✅ Edit existing property → Existing photos display, can add/remove photos
- ✅ View "My Listings" → All photos display correctly
- ✅ Photos remain accessible after 15+ minutes (no expiration)

### ⚠️ Important Note for Existing Properties

**If you have properties created BEFORE this backend fix was deployed:**

The old properties have **signed URLs** stored in the database instead of S3 keys. When the backend tries to generate fresh signed URLs for these, it will create double-encoded URLs that won't work.

**Solution:**
1. **Recommended:** Delete old properties and create new ones after the backend fix
2. **Alternative:** Backend needs a migration script to extract S3 keys from existing signed URLs

**How to identify the issue:**
- Check the logs for photo URLs that look like: `https://...s3.amazonaws.com/.../https%3A//...s3.amazonaws.com/...`
- The `https%3A//` indicates double-encoding

**To test the fix properly:**
1. Delete any properties created before the backend fix
2. Create a new property with photos
3. Verify photos display correctly immediately
4. Wait 20+ minutes and verify photos still display correctly

### Technical Details

**S3 Key Format:**
```
property-images/{userId}/{timestamp}-{filename}
virtual-tours/{userId}/{timestamp}-{filename}
```

**Signed URL Format:**
```
https://bucket-name.s3.region.amazonaws.com/property-images/userId/timestamp-photo.jpg?X-Amz-Algorithm=...&X-Amz-Expires=3600...
```

**Key Extraction Logic (in edit-property/[id].tsx):**
```typescript
const extractKeyFromUrl = (url: string): string => {
  if (!url.startsWith('http')) return url; // Already a key
  const urlObj = new URL(url);
  return urlObj.pathname.substring(1); // Remove leading slash
};
```
