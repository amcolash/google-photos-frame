#!/bin/bash

# Check if Safari is running
if [[ $(ps aux | grep Web | grep -v 'grep') ]]; then
  echo "Killing Safari"
  killall -9 Web > /dev/null
  sleep 1
fi

# Check if anything else is running and close it
if [[ $(activator current-app) ]]; then
  echo "Closing other app"
  activator send libactivator.system.homebutton
  sleep 1
  activator send libactivator.system.homebutton
fi

sleep 5

echo "Starting Slideshow"
stouch touch 500 700 4
sleep 15

echo "Enabling Wakelock"
stouch touch 300 300 4
