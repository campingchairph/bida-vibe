> **Temporary option.** Once the Cloudflare Worker is set up, upload sounds in the app instead (Sounds → Admin: Sound manager). This folder is only used while `workerUrl` is empty.

# Free sound pads (8)

Put up to **8 audio files** here. Every user gets these pads **free**, shown first in the Sounds tab and in Live mode.

- **The pad name = the file name.** `Ay Susmaryosep.mp3` becomes a pad called **Ay Susmaryosep**.
  - Dashes and underscores turn into spaces: `sad_violin.mp3` becomes **sad violin**.
  - A number at the front only sets the order and is hidden: `01-Palakpak.mp3` becomes **Palakpak** and goes first.
- **Formats:** mp3 (best), m4a, wav, ogg. Keep each file under 3 MB, and under 1 MB is ideal. Short clips of 1–5 seconds work best.
- **More than 8 files?** Only the first 8, in file-name order, are used.
- **Changing sounds:** replace or rename a file, then push. Users see the change within about an hour, or right away after a refresh on a new device.
- Use sounds you have the right to use.

The app reads this folder through GitHub's public file listing, so the repo must be **public**. To control the order or names exactly, you can also add a `list.json` here, e.g. `["Palakpak.mp3", "Ay Susmaryosep.mp3"]`.
