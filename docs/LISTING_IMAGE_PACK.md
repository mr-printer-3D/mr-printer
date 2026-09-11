# Listing Image Pack

Upload one product photo → **5 Meesho marketplace images** (or full 8-pack) at **2000×2000**.

Saved to Google Drive as:

```
Drive parent folder/
  └── {SKU}/
        ├── SKU-1-hero.jpg
        ├── SKU-2-features.jpg
        ├── SKU-3-quality.jpg
        ├── SKU-4-gift.jpg
        └── SKU-5-dimensions.jpg
```

Meesho sync reads those SKU folders automatically.

## Open

http://localhost:3000/listing-images

## Flow

1. Enter **SKU** (same as Pricing sheet)
2. Upload a clear product photo
3. Generate **5 Meesho shots** (or 8 full pack)
4. **Save to Drive / SKU**
5. In `/meesho` → Sync — images attach by SKU folder

## Drive upload

Uses the pricing **Apps Script** Web App (`uploadProductImages`, script v6+).
Redeploy Apps Script with a **New version** after updating `google-apps-script.js`.

Env:

```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
GOOGLE_DRIVE_FOLDER_ID=...   # parent folder
```

## Quality

Canvas compositions at 2000×2000 with high JPEG quality. Use a sharp, well-lit source photo for best cutout results. Optional `REPLICATE_API_TOKEN` for AI rembg + scene plates.
