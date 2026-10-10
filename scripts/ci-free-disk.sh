#!/usr/bin/env bash
# Frees ~20 GB on GitHub-hosted Ubuntu runners (unused preinstalled toolchains), so the
# Android build + emulator system image fit on the disk.
set -uo pipefail
df -h / | tail -1
sudo rm -rf /usr/share/dotnet /opt/ghc /usr/local/.ghcup /usr/local/share/boost /usr/share/swift \
  /usr/local/share/powershell /usr/local/share/chromium /opt/hostedtoolcache/CodeQL \
  /opt/hostedtoolcache/PyPy /opt/hostedtoolcache/go /opt/hostedtoolcache/Ruby /usr/local/julia* || true
sudo docker image prune --all --force >/dev/null 2>&1 || true
df -h / | tail -1
