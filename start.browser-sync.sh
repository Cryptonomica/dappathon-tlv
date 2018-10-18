#!/usr/bin/env bash

# see: https://browsersync.io/docs/command-line
# sudo npm install -g browser-sync

browser-sync start --server './webapp' --files './webapp' --port 9527 --no-open

