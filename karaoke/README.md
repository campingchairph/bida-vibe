# Videoke library

`library.json` holds every song in the app's Videoke: a **code** (10001 and up), title, artist, genre, and the YouTube karaoke video ID. No music or lyrics are stored here; songs play from YouTube.

**Don't edit this file by hand.** Manage it in the app: sign in as admin → **Videoke** tab → **Admin: Videoke library**.
- **Magdagdag ng kanta:** paste one YouTube karaoke video link. The title and artist are filled in automatically, and you can edit them after.
- **I-import ang YouTube playlist:** paste a karaoke playlist link to add up to 200 songs at once. Videos whose owners don't allow playing on other sites are skipped automatically.
- **Codes:** never reused, and the first song added gets the first free number.

It uses the same GitHub token as the Sound manager.