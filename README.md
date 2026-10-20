# SS Training

A React + TypeScript + Vite starter for an Apple-inspired gaming and focus training platform.

## What is included

- Responsive dark UI with Overview, Music, Focus, Games, Fortnite, Siege, osu! Training, Leaderboard, and Settings.
- 100 curated **track entries** with genre filtering, search, and favorites. These are metadata placeholders; licensed audio URLs still need to be added.
- Focus reaction test and rhythm timing trainer.
- Aim drill with target placement and customization.
- Snake mini-game plus an arcade menu with 10 additional game slots.
- Siege weapon reference for 15 popular weapons.
- Difficulty selection, local demo XP, rank progression, crosshair controls, keybind fields, graphics/FPS settings.
- Supabase authentication and database starter schema.

## Important status

This is a **working starter/demo**, not yet a published production service.
- Guest progress is stored in the current browser only.
- Online sign-in and shared progress require Supabase setup.
- The top-trainer names on the preview are illustrative.
- Music entries have no audio files/URLs yet.
- Some arcade cards are placeholders and need their game modules implemented.
- The XP RPC is a starter guardrail, not full anti-cheat. Before opening the leaderboard publicly, validate session results server-side and rate-limit XP awards.
- Siege recoil descriptions are general notes, not guaranteed current numerical patterns.

## Run locally

1. Install Node.js LTS from https://nodejs.org/
2. Extract this folder.
3. Open a terminal in this folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local address Vite prints (usually `http://localhost:5173`).

## Connect Supabase

1. Create a project at https://supabase.com/
2. Open Project Settings → API and copy the Project URL and publishable/anon key.
3. Copy `.env.example` to `.env` and fill in those two values.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. For this starter's username-only flow, review Supabase email-confirmation settings. The app uses synthetic `.invalid` emails, so ordinary email confirmation cannot work. Add a recovery method before production.
6. Create your own account through the site.
7. In Supabase SQL Editor, promote the account:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(username) = lower('SSZN');
   ```

8. Sign out and back in, then confirm the profile role in the database. The UI admin controls still need to be expanded; role enforcement must remain server-side.

### Administrator credentials

For security, the administrator password is **not hardcoded** into the project. Register the SSZN account yourself and set the password through the sign-up form, then promote it using the SQL above. Never share a Supabase service-role key.

## Deploy online

1. Push the project to a private or public GitHub repository.
2. Import the repository into Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables.
4. Deploy. Vercel will run the Vite build.
5. Choose a deployment URL, then connect a custom domain in Vercel if you purchase one.

A free `*.vercel.app` URL is usually the easiest first step, subject to availability and provider terms. I have not deployed this project from your accounts; you will need to complete the hosting setup or provide access through a supported workflow.

## Future admin/content management

Recommended next milestone:
- Add `tracks`, `playlists`, `training_modes`, `weapon_profiles`, `site_settings`, and `announcements` tables.
- Add role-protected admin routes and server-side authorization.
- Store licensed audio source URLs and artwork in Supabase Storage.
- Move XP awards to validated server-side events and add anti-abuse controls.
