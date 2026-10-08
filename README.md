# learn.

A small, modern learning app by Kosuke. It runs entirely in the browser: no
Supabase setup, online account service, or backend is required.

## Run the app

1. Open a terminal in this project folder.
2. Start a local web server:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit [http://localhost:8000](http://localhost:8000).
4. On Home, choose **Get started — it's free**, then select an emoji and enter
   a username and password. Sign in again later with the same username and
   password in this browser.

If you are using Codespaces, forward port **8000** and open its forwarded URL.

## Local profiles and weekly league

- Usernames, locally salted password hashes, Kuids, profile cosmetics, lesson
  progress, weekly challenge scores, and league tiers are saved in this browser.
- Earn 10 Kuids and 10 league points for each new lesson. The weekly quiz gives
  one league point per correct answer; three optional weekly challenges award
  additional points when claimed.
- Kuids can be spent on profile emojis and themes. League points cannot be
  purchased.
- At the start of a new week, the top five saved profiles in each tier advance
  one tier. The first-place profile receives a prize-wheel reward.
- Find people searches the usernames, levels, and tiers of profiles saved in
  this browser. There are no bots or generated competitors.

**Important limitation:** local storage is specific to one browser profile on
one device. Other people using different devices cannot see or search these
profiles, and data may be lost if browser storage is cleared. Password hashing
does not make a browser-only account secure; do not reuse a real password or
store sensitive information. To share real users and league standings across
devices, the app would need an online backend.

## Other features

The app includes Home, Learn, learnGPT, Notes, Weekly league, Find people,
Shop, and Profile pages; 1,200 generated 100-day lessons across four subjects
and three levels; and a built-in study companion that uses local study guides
rather than a live AI service. Notes and learning progress are kept in the
browser.
