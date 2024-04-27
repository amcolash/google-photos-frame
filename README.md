# google-photos-frame

A web app to show google photos from an album on a photo frame.
Scaffolded by `nano-react-app`.

## Setting up an iPad Mini (iOS 9.3.5)

### Jailbreak

- Install [sideloadly](https://sideloadly.io/)
- Sideload and run [blizzard](https://github.com/GeoSn0w/Blizzard-Jailbreak-9/releases)

### Downgrade to 8.4.1

Downgrading makes the iPad much faster and more stable. Additionally, this is a fully untethered jailbreak, so it is highly recommended.
Use [Legacy iOS Toolkit](https://github.com/LukeZGD/Legacy-iOS-Kit) to downgrade to 8.4.1 (already needs iPad to be jailbroken).

### Settings

- Turn off auto-lock
- Turn off lock code
- Ensure there are 3 apps in the dock (in order from left -> right) - Safari, PhotoFrame, Settings
- Install [Let's Encrypt Certs](https://cydia.invoxiplaygames.uk/certificates/)

### Manual Steps [Via SSH]

- Regain storage by moving `/System/Library/LinguisticData` to `/var/stash/` [(steps here)](https://www.reddit.com/r/jailbreak/comments/5xtdt6/tutorial_discussion_solve_and_fix_100_full_system/)
  - `mv /System/Library/LinguisticData /var/stash/`
  - `ln -s /var/stash/LinguisticData /System/Library/LinguisticData`
- Change password for `mobile` + `root` users using `passwd`

### Install Jailbreak Tweaks

#### Required

- SimulateTouch
- Activator
- OpenSSH
- Core Utilities

##### iOS 9

- [App Sync Unified](http://cydia.akemi.ai)
- [ReProvision Reborn](https://repo.satoh.dev)

#### Optional

- nitrous (highly recommended, cannot buy and sources are shady)
- vim
- Veency
- BarFade (Fade on Apps+Hide Bar on Most Apps)
- illLookLater (Remember to Enable + All Apps)
- camshot (if using camera ambient brightness)
