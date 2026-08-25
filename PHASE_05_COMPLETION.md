# PHASE 05 COMPLETION REPORT
## Phase: Citizen UX Enhancements — Petition Withdrawal, GPS Auto-Detection, Image Upload

> **Status:** ✅ Complete
> **Date Completed:** 2026-08-04
> **Immutable Snapshot — Do Not Modify**

---

## Phase Objective

Add three citizen-facing UX enhancements to InsightGov without modifying the core AI pipeline, officer workflow, or existing authentication architecture.

---

## Feature 1: Petition Withdrawal

Citizens can withdraw a petition they submitted, provided it has not yet entered officer review (`status` must be `pending` or `analysed`). The decision is irreversible, preserves full audit history, and triggers a citizen notification.

### Backend
| File | Change |
|------|--------|
| `models/petition.py` | Added `withdrawal_reason TEXT` column; added `images` relationship |
| `schemas/petition.py` | Added `WithdrawRequest` Pydantic schema; exposed `withdrawal_reason` in `PetitionOut` |
| `services/petition_service.py` | Added `withdraw_petition()` method with status gate, history record, and notification |
| `routers/petitions.py` | Added `PATCH /petitions/{id}/withdraw` endpoint (citizen-only) |
| `alembic/versions/c1d2e3f4a5b6_...py` | Migration adds `withdrawal_reason` column |

### Frontend
| File | Change |
|------|--------|
| `api/petitions.api.js` | Added `withdrawPetition(id, reason)` API function |
| `hooks/usePetitions.js` | Added `useWithdrawPetition()` mutation hook |
| `pages/citizen/PetitionStatus.jsx` | "Withdraw Petition" button (visible only for pending/analysed); confirmation modal with reason input; withdrawn banner on withdrawn petitions |
| `components/petition/PetitionCard.jsx` | Added `withdrawn` status badge |
| `components/petition/PetitionTable.jsx` | Added `withdrawn` status badge |

### Withdrawal Rules
- Only allowed when `status ∈ {pending, analysed}` (i.e., before officer picks it up)
- Reason is required (minimum 5 characters)
- History record is written with old/new status and reason
- Citizen receives a confirmation notification

---

## Feature 2: GPS Auto-Detection

A **"Use Current Location"** button beside the map label in the petition submission form auto-detects the citizen's GPS coordinates and reverse-geocodes them into an address using OpenStreetMap Nominatim (no API key required).

### Frontend
| File | Change |
|------|--------|
| `components/petition/PetitionForm.jsx` | Added `handleUseCurrentLocation` using `navigator.geolocation`; added `MapController` component that uses `useMap()` to `flyTo` the detected position; calls Nominatim `/reverse` to auto-fill location field; shows loading indicator and error banner on failure (e.g., permission denied) |

### Behaviour
- Success: pin drops on map, map animates to location, location text field auto-filled with reverse-geocoded address
- Permission denied: amber banner with instruction to click map manually
- Network error: pin still drops, location field not auto-filled (graceful degradation)
- No backend changes required

---

## Feature 3: Image Upload

Citizens can attach up to 5 images (JPG, PNG, WebP, max 5 MB each) when submitting a petition. Images are stored on the server filesystem and served via FastAPI `StaticFiles`. Images are displayed with a lightbox viewer in both citizen and officer views.

### Backend
| File | Change |
|------|--------|
| `models/petition_image.py` | **[NEW]** `PetitionImage` ORM model with `id`, `petition_id`, `filename`, `stored_path`, `mime_type`, `file_size`, `created_at` |
| `models/__init__.py` | Registered `PetitionImage` for Alembic autogenerate |
| `models/petition.py` | Added `images` relationship (`lazy="selectin"`, ordered by `created_at`) |
| `schemas/petition.py` | Added `PetitionImageOut` with `computed_field url` (normalised URL path); added `images: list[PetitionImageOut]` to `PetitionWithAnalysis` |
| `routers/petitions.py` | Added `POST /petitions/{id}/images` endpoint accepting multipart `files`; validates MIME type, file size, and max count; stores files under `uploads/petition_images/{petition_id}/` |
| `main.py` | Mounted `StaticFiles(directory="uploads")` at `/uploads`; auto-creates `uploads/petition_images` on startup |
| `requirements.txt` | Added `python-multipart>=0.0.9` |
| `alembic/versions/c1d2e3f4a5b6_...py` | Migration creates `petition_images` table with index |

### Frontend
| File | Change |
|------|--------|
| `api/petitions.api.js` | Added `uploadPetitionImages(id, files)` (multipart POST); added `getImageUrl(url)` helper |
| `components/petition/PetitionForm.jsx` | Image upload zone with file picker; live preview grid (3-5 thumbnails); remove button per image; validation feedback |
| `pages/citizen/PetitionStatus.jsx` | `ImageGallery` component renders uploaded images in a grid with a click-to-open lightbox |
| `pages/officer/PetitionReview.jsx` | `OfficerImageGallery` component identical to above, shown in the left column after petition details |

### Validation Rules
- Accepted MIME: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5 MB per file
- Max files: 5 per petition
- Images uploaded **after** petition JSON is created (petition always saved, images are optional)

---

## Database Changes
```
petitions
  + withdrawal_reason TEXT NULL

petition_images (NEW TABLE)
  id UUID PK
  petition_id UUID FK->petitions(CASCADE)
  filename VARCHAR
  stored_path VARCHAR
  mime_type VARCHAR
  file_size INTEGER
  created_at TIMESTAMPTZ DEFAULT now()
  INDEX ix_petition_images_petition_id
```

---

## Verification Performed
- `alembic upgrade head` — ran cleanly (both migrations applied)
- `python -c "from main import app; ..."` — all 28 routes load, `/uploads` and `/petitions/{id}/withdraw`, `/petitions/{id}/images` registered
- `python-multipart` installed in .venv
- `withdrawn` status badge added to `PetitionCard` and `PetitionTable`

## Breaking Changes
None. All changes are additive. Existing petition JSON payloads and officer workflows are untouched.
