# google-photos-frame

A web app to show google photos from an album on a photo frame.
Scaffolded by `nano-react-app`.

## Setting up an iPad Mini (iOS 9.3.5)

### Jailbreak

- Install [sideloadly](https://sideloadly.io/)
- Sideload and run [blizzard](https://github.com/GeoSn0w/Blizzard-Jailbreak-9/releases)

### Settings

- Turn off auto-lock
- Turn off lock code
- Install [Let's Encrypt Certs](https://cydia.invoxiplaygames.uk/certificates/)

### Manual Steps [Via SSH]

- Ensure there are 3 apps in the dock - Safari, PhotoFrame, Settings
- Regain storage by moving `/System/Library/LinguisticData` to `/var/stash/`: [steps](https://www.reddit.com/r/jailbreak/comments/5xtdt6/tutorial_discussion_solve_and_fix_100_full_system/)
- Change passwords from `alpine`

### Install Jailbreak Tweaks

#### Required

- [App Sync Unified](http://cydia.akemi.ai)
- [ReProvision Reborn](https://repo.satoh.dev)
- SimulateTouch
- Activator
- camshot
- OpenSSH

#### Optional

- BarFade (Fade on Apps+Hide Bar on Most Apps)
- Veency
- illLookLater (Remember to Enable + All Apps)
- vim
