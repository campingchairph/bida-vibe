# Sound pads

**Sounds are now uploaded in the app by the admin**, not by putting files in this folder.

1. Sign in on Bida-Vibe with the admin Google account.
2. Go to **Sounds**, scroll to **Admin: Sound manager**, choose **Libre sa lahat** (max 8) or **Premium lang**, then tap **Mag-upload**.
3. The pad name is taken from the file name, and you can rename, reorder, switch Libre/Premium, or delete later.

The files are stored on the payment server (Cloudflare Worker), so premium sounds are never public. Only the server decides who gets them: a signed-in account with an active pass, or admin. Max 1.5 MB per sound, and up to 40 pads.

This needs the Worker to be set up first (PAYMENTS.md, step 3). Until then, free pads can still come from [`sounds/free/`](free/README.md).