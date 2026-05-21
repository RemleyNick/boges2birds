#!/usr/bin/env bash
# Upload JS source maps to Sentry after a successful EAS Build.
#
# Why this exists: with EAGER_BUNDLE (EAS Build 18+) the JS bundle is created
# before xcodebuild runs, so the Sentry Expo plugin's wrapped
# `react-native-xcode.sh` build phase never sees the bundle and never uploads
# source maps. We rerun the upload here, after EAS has produced the bundle and
# matching .map.
#
# Bundles already carry Debug IDs because metro.config.js uses
# `getSentryExpoConfig`, so all that's missing is the upload.

set -uo pipefail

if [ "${EAS_BUILD_PROFILE:-}" != "production" ]; then
  echo "[sentry] Skipping source map upload (profile=${EAS_BUILD_PROFILE:-unset})"
  exit 0
fi

if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "[sentry] SENTRY_AUTH_TOKEN is not set; skipping source map upload."
  exit 0
fi

uploaded=0
failed=0
while IFS= read -r map; do
  dir="$(dirname "$map")"
  echo "[sentry] Uploading bundle + sourcemap from $dir"
  if npx --no-install sentry-expo-upload-sourcemaps "$dir"; then
    uploaded=$((uploaded + 1))
  else
    echo "[sentry] Upload from $dir failed (continuing)."
    failed=$((failed + 1))
  fi
done < <(find . \( -name 'main.jsbundle.map' -o -name 'main.jsbundle.hbc.map' \) -not -path '*/node_modules/*' 2>/dev/null)

echo "[sentry] Source map upload step complete (uploaded=$uploaded, failed=$failed)."

if [ "$uploaded" -eq 0 ]; then
  echo "[sentry] WARNING: no source maps were uploaded. If this is a production build, verify EAGER_BUNDLE produced main.jsbundle(.hbc).map and that the org/project in app.json are correct."
fi

# Never fail the build because of source map upload trouble — the binary itself is fine.
exit 0
