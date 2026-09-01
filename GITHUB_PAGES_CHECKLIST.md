# GitHub Pages launch checklist

## Repository

- [ ] ZIP extracted locally.
- [ ] Files uploaded to the repository root.
- [ ] Default branch is `main`.
- [ ] GitHub Pages source is set to `GitHub Actions`.
- [ ] `Build and deploy Merrill Wrestling to GitHub Pages` completes successfully.
- [ ] Site opens from the Pages URL.

## Firebase Authentication

- [ ] Google and/or Email/Password provider enabled.
- [ ] `YOUR-USERNAME.github.io` added to Firebase Authorized domains.
- [ ] Test account can authenticate from the Pages URL.

## Firestore

- [ ] Database created.
- [ ] `firestore.rules` deployed.
- [ ] `firestore.indexes.json` deployed.
- [ ] First admin account bootstrapped from a trusted computer.
- [ ] Real roster is provisioned through the trusted admin script, not public client code.
- [ ] Athlete A cannot read Athlete B's private records.
- [ ] Practice Board account cannot read any private athlete collection.

## Team pilot

- [ ] Approved Merrill terminology reviewed.
- [ ] Coach-approved example buckets reviewed.
- [ ] Official logos display correctly.
- [ ] Before Practice works on a phone.
- [ ] Practice Board is readable on the room display.
- [ ] After Practice closes the loop.
- [ ] Confidence Bank saves and resurfaces evidence.
- [ ] No private information appears on the Practice Board.
