# Phase 01 Completion: Petition Location Pipeline Fix and Hardening

## Overview
This document summarizes the fixes implemented during Phase 01 to resolve bugs and harden the petition location pipeline. 

## Root Cause Analysis
The original bug causing location submissions to fail was a data-contract mismatch between the frontend and the backend.
- The **frontend** (`PetitionForm.jsx`) was sending `{ ..., location: "...", latitude: XX, longitude: YY }` as expected.
- The **backend database** required `location` (`nullable=False`).
- However, the **FastAPI Pydantic schema** (`PetitionCreate` in `backend/schemas/petition.py`) was entirely missing the `location` field. This mismatch meant that the `location` string was stripped out during validation, causing `petition_service.py` to raise an `AttributeError` when attempting to access `data.location`, ultimately failing the petition submission.

## Files Changed
1. **`backend/schemas/petition.py`**
   - Added `location: str` to `PetitionCreate` schema.
   - Added `pydantic.Field` validation to `latitude` (`ge=-90, le=90`) and `longitude` (`ge=-180, le=180`) to ensure coordinates are mathematically valid.

2. **`frontend/src/components/petition/PetitionForm.jsx`**
   - Fixed mapping logic in `LocationPicker`. Now relies on Leaflet's `latlng.wrap()` to ensure that even if a user pans continuously horizontally across the map, the submitted coordinates wrap correctly back into the valid `[-180, 180]` range.
   - Enhanced error handling on the submit button. Now gracefully parses FastAPI `422 Unprocessable Entity` detailed validation arrays into a clean, human-readable UI error message instead of showing `[object Object]`.

## Behavior Verified
- **Coordinate Hardening**: Out-of-bounds latitude (e.g. 100) or longitude (e.g. 200) are correctly rejected with a clear message to the user.
- **Location Requirements**: The system preserves the original requirement that users must manually pin the exact location and provide a descriptive string if reverse-geocoding fails. Reverse geocoding remains a "best effort" fallback.
- **Robust Failure Modes**: If the backend rejects a submission (e.g. missing fields, invalid types), the error is cleanly reported.

## Remaining Limitations
- Reverse geocoding (Nominatim) does not have rate-limiting handling implemented beyond a basic silent `catch` block on the frontend. A dedicated caching mechanism or a more reliable enterprise geocoding API might be required for production scale.
- We do not currently detect GPS spoofing. Location assertions from the browser (`navigator.geolocation`) are trusted natively.
