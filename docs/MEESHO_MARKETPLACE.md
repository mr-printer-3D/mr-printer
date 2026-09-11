# Meesho Marketplace

Sync product rows from the **Pricing** Google Sheet + images from **Google Drive**, review in Studio, then export a **Meesho bulk-upload CSV**.

## Open

```
http://localhost:3000/meesho
```

Production: `https://mr-printer.vercel.app/meesho`

## Flow

1. Products live in Google Sheet tab **Pricing** (same as pricing calculator)  
2. Images in a Drive folder (name files with SKU when possible)  
3. Sync in Meesho panel  
4. Review / select rows  
5. Download Meesho CSV  
6. Upload in [Supplier Panel](https://supplier.meesho.com/) → Catalog → Bulk Upload  

## Images from Drive

1. Put product photos in the Drive folder (filename should include **SKU**).  
2. Share folder: **Anyone with the link → Viewer**.  
3. On Sync, images are matched to products and written into the CSV as:

`https://your-domain/api/meesho/image/<driveFileId>`

Meesho downloads those URLs during bulk upload. Set `NEXT_PUBLIC_APP_URL` to your live site (e.g. `https://mr-printer.vercel.app`) so CSV links are public.

## Env (`pricing-tool/.env.local`)

```
GOOGLE_API_KEY=...
GOOGLE_SHEETS_ID=1HaJIjWntMd16vnSAFa9wASb_sWds2YwmrN4yGmGZ84M
GOOGLE_SHEETS_RANGE=Pricing!A1:AZ500
GOOGLE_DRIVE_FOLDER_ID=1wjql3Yu4fNZJNolL780WKepimVuTKPoh
```

- Create key: https://console.cloud.google.com/apis/credentials  
- Enable **Sheets API** + **Drive API**  
- Share Sheet + Drive folder: **Anyone with the link → Viewer**  

Without a key, use **Force mock** in the UI.

## Price mapping

From the Pricing sheet, Meesho selling price is taken as:

1. `meesho` column (if &gt; 0)  
2. else `sellingPrice`  

MRP, weight, inventory (`inventoryTotal` or Ritesh+Mayuri), and colors JSON are mapped automatically.

## Notes

Meesho does **not** give most sellers a public listing API. Bulk CSV is the supported path. Category templates from Meesho may use slightly different headers — copy values into their official template if upload rejects the starter CSV.
