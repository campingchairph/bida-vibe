# Default sound pads

Put **20 mp3 files** in this `sounds/` folder, named **exactly** like this (lowercase, with the number in front). The app reads the file name to know which pad it belongs to. If a file is missing, that pad just doesn't show.

| # | File name | Pad label | Free? |
|---|---|---|---|
| 1 | `01-boink.mp3` | Boink | Free |
| 2 | `02-tawa.mp3` | Tawa | Free |
| 3 | `03-faah.mp3` | Faah | Free |
| 4 | `04-drumroll.mp3` | Drumroll | Free |
| 5 | `05-palakpak.mp3` | Palakpak | Premium |
| 6 | `06-badumtss.mp3` | Ba-dum-tss | Premium |
| 7 | `07-airhorn.mp3` | Air horn | Premium |
| 8 | `08-tama.mp3` | Tama! (ding) | Premium |
| 9 | `09-mali.mp3` | Mali! (buzzer) | Premium |
| 10 | `10-tada.mp3` | Ta-da! | Premium |
| 11 | `11-kuliglig.mp3` | Kuliglig | Premium |
| 12 | `12-giggle.mp3` | Giggle | Premium |
| 13 | `13-bruh.mp3` | Bruh | Premium |
| 14 | `14-wahwah.mp3` | Wah-wah | Premium |
| 15 | `15-wow.mp3` | Wow | Premium |
| 16 | `16-dundun.mp3` | Dun dun DUN | Premium |
| 17 | `17-kaching.mp3` | Ka-ching | Premium |
| 18 | `18-whoosh.mp3` | Whoosh | Premium |
| 19 | `19-pop.mp3` | Pop | Premium |
| 20 | `20-countdown.mp3` | Countdown | Premium |

## Tips
- **mp3 only**, short clips (under 5 seconds is best), under 1 MB each so they load fast on mobile data.
- Trim silence at the start so the sound fires the moment the pad is tapped.
- Want a different sound in a slot? Keep the file name, just swap the audio. To change the **label** too, edit `DEFAULT_SOUNDS` near the top of the Sound pads section in `bida-app.js`.
- Use sounds you have the right to use (your own recordings, or royalty-free/CC0 sound libraries). Many viral TikTok sounds are owned by someone.
- Signed in as admin, the Sounds tab lists any file names that are still missing.
