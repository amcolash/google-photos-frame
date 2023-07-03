#!/bin/bash

# Check if Safari is running and close it
function stopSafari() {
  if [[ $(ps aux | grep Web | grep -v 'grep') ]]; then
    echo "Stopping Safari"

    killall -9 Web > /dev/null
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
  stouch touch 500 700 4
  sleep 15

  echo "Enabling Wakelock"
  stouch touch 300 300 4
}

runningApp=$(activator current-app)

# Only stop safari when "--restart" passed
if [[ $1 == '--restart' ]]; then
  stopSafari
  stopOther
  start
elif [[ $runningApp != "com.apple.webapp" ]]; then
  # Otherwise, just start things if they are not running
  stopOther
  start
fi
