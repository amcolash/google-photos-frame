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

- Regain storage by moving `/System/Library/LinguisticData` to `/var/stash/`: [steps](https://www.reddit.com/r/jailbreak/comments/5xtdt6/tutorial_discussion_solve_and_fix_100_full_system/)
  - `mv /System/Library/LinguisticData /var/stash/`
  - `ln -s /var/stash/LinguisticData /System/Library/LinguisticData`
- Change passwords from `alpine` using `passwd`

### Install Jailbreak Tweaks

#### Required

- SimulateTouch
- Activator
- camshot
- OpenSSH
- Core Utilities
- [App Sync Unified](http://cydia.akemi.ai) (iOS 9+)
- [ReProvision Reborn](https://repo.satoh.dev) (iOS 9+)

#### Optional

- BarFade (Fade on Apps+Hide Bar on Most Apps)
- Veency
- illLookLater (Remember to Enable + All Apps)
- vim
