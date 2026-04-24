# Putting Speed Trainer Project Notes

This file preserves the key thinking and decisions from the development chat so that context compression does not lose the project memory.

## Current working approach

- The app is intended to run on iPhone Safari via GitHub Pages.
- Current deployed build version is `v12 sampled ball gate`.
- Speed is measured from elapsed time between a start gate trigger and a finish gate trigger.
- The user sets the real-world gate distance in feet. Current default is `3 ft`.
- The app no longer depends on live ball tracking for the speed calculation.
- Recording is currently disabled because it was suspected to add overhead and reduce responsiveness.
- Marker retracking is currently disabled because it was not improving results and added complexity.

## Why the design changed

Several earlier approaches were tried and then backed out:

1. Full-field or corridor ball tracking:
   - This was noisy and unreliable on iPhone.
   - It also made debugging harder because the app appeared to react to too much of the frame.

2. Generic motion detection in a large ROI:
   - This produced false triggers.
   - A visible red diff mask did not always produce a gate trigger because the trigger logic averaged changes over too much area.

3. Marker retracking while armed:
   - The idea was to compensate for slight camera movement.
   - In practice it did not clearly improve behaviour and added uncertainty about whether the gates were moving.

## Current detection model

The current setup flow is:

1. Tap start gate marker 1
2. Tap start gate marker 2
3. Tap finish gate marker 1
4. Tap finish gate marker 2
5. Tap the centre of the ball

After the ball tap:

- The app samples a small region around the ball.
- It builds a simple ball profile from the sampled region:
  - brightness / grayscale expectation
  - saturation expectation
- The app then arms the start and finish gates.

Gate detection now works like this:

- Each gate uses a narrow four-sided strip aligned to the gate line.
- The strip is not a large axis-aligned rectangle.
- The long sides of the strip are parallel to the gate.
- During a putt, the app compares the current strip image with a reference image captured during setup.
- A trigger occurs when enough new pixels in the strip look like the sampled ball profile.

This means the system is closer to:

- "did the sampled ball appear in this narrow gate strip?"

rather than:

- "did something move somewhere in a large ROI?"

## Important implementation details

- `index.html`
  - version badge
  - default gate distance input
  - cache-busting query params on CSS and JS
  - service worker cleanup script

- `src/js/app.js`
  - main animation loop
  - start/finish timing
  - setup flow orchestration
  - gate trigger thresholds

- `src/js/tracking/MarkerTracker.js`
  - marker setup flow
  - ball sampling and ball profile creation
  - gate ROI geometry
  - ROI comparison and diff mask logic

- `src/js/ui/UIController.js`
  - setup prompts
  - marker and gate drawing
  - debug overlay

## GitHub Pages / caching notes

- Safari caching caused confusion during testing.
- The app now aggressively avoids stale code by:
  - unregistering service workers on load
  - clearing caches on load
  - using explicit version query params on CSS and JS
- When testing a new build on iPhone, use a versioned URL such as:
  - `https://speuan.github.io/putting-speed-trainer-v6/?v=12`

## Practical assumptions

- Exact speed does not need to be perfect to the last decimal place.
- Reliable detection matters more than continuous live tracking.
- The gate-based timing approach is preferable to trying to estimate speed from free-motion ball tracking.
- A sampled ball profile is better than hard-coded assumptions about "white ball on grey carpet".
- The app should optimize for simple repeatable use on phone, not for maximum computer-vision sophistication.

## Known good current behaviour

- Marker setup works.
- Ball sampling appears to help gating.
- The narrow gate strip is visually closer to the intended trigger region.
- The app can arm and register putts without full live ball tracking.

## Next-step idea already discussed

The next improvement should be a multi-putt workflow:

- Keep the existing gate markers.
- Keep the sampled ball brightness / saturation profile.
- Reset only the timing and results state.
- Add a `Next Putt` button.

That would avoid forcing the user to redo setup between putts.

## Things to be careful about in future changes

- Avoid reintroducing large generic motion ROIs.
- Avoid making the trigger depend on continuous full-scene tracking unless there is a clear benefit.
- Be careful with any feature that increases per-frame work on iPhone.
- If recording is reintroduced, verify that it does not degrade trigger responsiveness.
- Keep version labels and `?v=` cache-busters in sync when shipping test builds.
