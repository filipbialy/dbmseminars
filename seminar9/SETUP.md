# Seminar 9 · Northway Home board meeting — setup

Files (all go in the `seminar9/` folder of the `dbmseminars` repository):

| File | What it is |
|---|---|
| `index.html` | The page (layout and styles) |
| `app.js` | The system |
| `content.js` | All seminar content: questions, facts, wording — edit here |
| `config.js` | **Your settings: Firebase connection and tutor PIN** |

## 1. Create the database (Firebase, free)

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. **Create a project** → name it e.g. `dbm-seminars` → Google Analytics is not needed (switch it off) → **Create project**.
3. In the left menu: **Build → Firestore Database → Create database**.
   - Location: **europe-west2 (London)**. This cannot be changed later.
   - Start in **production mode** → **Create**.
4. Open the **Rules** tab of Firestore, replace everything with the rules below and press **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{session}/{document=**} {
      allow read, write: if request.time < timestamp.date(2027, 6, 30);
    }
  }
}
```

   This lets the seminar page read and write only its own session data, until 30 June 2027. Everything else is closed.
5. Register the web page: click the **gear icon → Project settings → General**, scroll to **Your apps**, click the **`</>` (Web)** icon, give it a nickname (e.g. `seminar9`), leave “Firebase Hosting” unticked → **Register app**.
6. Firebase shows a block of code containing `const firebaseConfig = { … }`. Copy **only the part in curly brackets**.

## 2. Connect the page to the database

Open `config.js` and replace `firebase: null,` with what you copied, for example:

```js
window.SEMINAR_CONFIG = {
  firebase: {
    apiKey: "AIza…",
    authDomain: "dbm-seminars.firebaseapp.com",
    projectId: "dbm-seminars",
    storageBucket: "dbm-seminars.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abc123"
  },
  tutorPin: '2468'
};
```

Change `tutorPin` to your own PIN. (The Firebase values are not secret — they only identify the project; the rules above decide what is allowed.)

## 3. Upload to GitHub

In the `dbmseminars` repository: **Add file → Upload files** → drag in the four files into a folder named `seminar9` (or open the `seminar9` folder first, then upload) → **Commit changes**. After a minute the page is live at:

`https://filipbialy.github.io/dbmseminars/seminar9/`

## 4. Check it before class (5 minutes)

1. Open the page on your laptop, enter a session code (e.g. `TEST1`). The top bar must **not** say “TEST MODE”.
2. Open the same link on your phone, same code, choose a team, answer a check question.
3. On the laptop, open the observer view (`…/seminar9/?s=TEST1#observer`, enter the PIN): the answer should appear within a second or two.
4. In the observer view press **Reset session** twice.

## In class

- Choose a new session code for each class (e.g. `NW9-MON`, `NW9-TUE`) and write it on the board / printouts.
- Students open `filipbialy.github.io/dbmseminars/seminar9`, type the code, choose their team.
- The top bar on every page has a menu: **Teams · Class screen · Observer · Change session**. Only the observer view asks for the PIN (each device remembers it once entered).
- Class screen (projector): `…/seminar9/?s=CODE#board`
- Observer view: `…/seminar9/?s=CODE#observer` → **Start the 60-minute clock** when students start reading.
- Observer controls: unlock a stuck team’s facts · **+5 minutes** (once) · **Start meeting anyway** · move the class screen between stages · reset.

Without a Firebase config the page runs in **test mode**: everything works, but only between tabs of one browser. Use it to try things out (observer view → “Fill with sample work”).
