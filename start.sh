#!/bin/bash

# Determine current mode (springboard, application, lockscreen)
currentMode=$(activator current-mode)

# Determine the current app running
runningApp=$(activator current-app)

# Check if Safari is running and close it
function stopSafari() {
  if [[ $runningApp == "com.apple.webapp" ]]; then
    echo "Stopping Safari"

    killall -9 Web >/dev/null
    sleep 5
  fi
}

# Check if anything else is running and close it
function stopOther() {
  if [[ $runningApp ]]; then
    echo "Stopping other app: $runningApp"

    activator send libactivator.system.homebutton
    sleep 1
    activator send libactivator.system.homebutton
    sleep 5
  fi
}

function start() {
  echo "Starting Slideshow"
  if [[ $1 == '3' ]]; then
    echo "Right"
  else
    echo "Left"
  fi

  stouch touch 512 700 $1
  sleep 15

  echo "Enabling Wakelock"
  stouch touch 300 300 $1
}

# If locked, unlock before starting
if [[ $currentMode == "lockscreen" ]]; then
  activator send libactivator.lockscreen.dismiss
  sleep 3
fi

# Only stop safari when "--restart" passed
if [[ $2 == '--restart' ]]; then
  stopSafari
  stopOther
  start $1
elif [[ $runningApp != "com.apple.webapp" ]]; then
  # Otherwise, just start things if they are not running
  stopOther
  start $1
fi
