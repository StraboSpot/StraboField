## Description
<!-- Describe what this PR does and why -->

## Type of Change
- [ ] 🐛 Bug fix (`fix:`)
- [ ] ✨ New feature (`feat:`)
- [ ] ♻️ Refactor (`refactor:`)
- [ ] 📝 Docs (`docs:`)
- [ ] 🔧 Chore (`chore:`)

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web

---

<!-- If this is a PR into rc-* or master, complete the release checklist below -->
<details>
<summary>📋 Release Checklist (rc → master only)</summary>

- [ ] Version bumped on rc branch (`npm run bump-patch / minor / major`)
- [ ] Version pushed to rc → draft release created on GitHub
- [ ] Testers have signed off on draft release
- [ ] Merging into **master** (not dev)
- [ ] After merge: tag on master with `v` prefix (`git tag v{version}`)
- [ ] After tag push: verify official GitHub Release was published

⚠️ **Reminders:**
- Tag on **master** after merging, never on rc
- Always use `v` prefix: `v2.29.1` not `2.29.1`
- Never manually write the changelog — GitHub Actions generates it

</details>
