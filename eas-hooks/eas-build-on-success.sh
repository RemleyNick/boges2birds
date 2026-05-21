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

# `sentry-expo-upload-sourcemaps` falls back to reading org/project from the
# `@sentry/react-native/expo` plugin entry in app config — but we use the
# bare `@sentry/react-native` plugin name, so that lookup fails. Pass them
# in via env to skip the lookup. Keep these in sync with app.json.
export SENTRY_ORG="${SENTRY_ORG:-self-employed-s6}"
export SENTRY_PROJECT="${SENTRY_PROJECT:-boges2birds}"
export SENTRY_URL="${SENTRY_URL:-https://sentry.io/}"

uploaded=0
failed=0
while IFS= read -r map; do
  # In EAGER_BUNDLE mode the file next to the .map (e.g.
  # ios/build/.../DerivedSources/main.jsbundle) is a 0-byte stub that
  # react-native-xcode.sh touches for Xcode dependency tracking. The real
  # bundle lives elsewhere in the build tree. If we upload the directory
  # blindly we get a 0 B "Minified" artifact in Sentry, and the symbolicator
  # can't resolve line/column positions even though debug IDs match (this
  # is exactly what happened on builds 7 and 8). Find the largest non-empty
  # main.jsbundle anywhere in the build tree and pair it with the .map in a
  # temp dir.
  bundle=$(find . -name 'main.jsbundle' -not -path '*/node_modules/*' -not -empty -print 2>/dev/null | head -1)

  # `sentry-expo-upload-sourcemaps`' isAsset filter accepts .map/.js/.hbc but
  # NOT .jsbundle, so naming the bundle main.jsbundle silently drops it from
  # the upload (this is why builds 7-10 had a 0-byte ~/main.jsbundle in Sentry
  # and `symbolicated_in_app: false` on every event). Hermes bytecode is what
  # ships in the .ipa anyway, so we name the temp-dir copies .hbc/.hbc.map.
  # Same stem on both files keeps the helper grouping them as a pair.
  upload_dir=$(mktemp -d)
  cp "$map" "$upload_dir/main.hbc.map"
  if [ -n "$bundle" ]; then
    cp "$bundle" "$upload_dir/main.hbc"
    bundle_size=$(wc -c < "$bundle" | tr -d ' ')
    echo "[sentry] Pairing $bundle ($bundle_size B) with $map (renamed to main.hbc / main.hbc.map for helper)"
  else
    echo "[sentry] No non-empty main.jsbundle found; uploading sourcemap alone."
  fi

  if npx --no-install sentry-expo-upload-sourcemaps "$upload_dir"; then
    uploaded=$((uploaded + 1))
  else
    echo "[sentry] Upload of $map failed (continuing)."
    failed=$((failed + 1))
  fi
  rm -rf "$upload_dir"
done < <(find . \( -name 'main.jsbundle.map' -o -name 'main.jsbundle.hbc.map' \) -not -path '*/node_modules/*' 2>/dev/null)

echo "[sentry] Source map upload step complete (uploaded=$uploaded, failed=$failed)."

if [ "$uploaded" -eq 0 ]; then
  echo "[sentry] WARNING: no source maps were uploaded. If this is a production build, verify EAGER_BUNDLE produced main.jsbundle(.hbc).map and that the org/project in app.json are correct."
fi

# Never fail the build because of source map upload trouble — the binary itself is fine.
exit 0
