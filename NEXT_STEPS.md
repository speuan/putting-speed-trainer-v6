# Next Steps

This file is our lightweight handoff for the next session.

## Current Priority

The main issue to return to is false triggering in the gate detector:

- The app can trigger when a hand moves in front of the camera, even when the ball has not crossed the gate.
- This means the current bright-pixel gate test is too permissive for non-ball motion.

## Likely Cause

Right now a trigger can happen when a region inside the gate ROI becomes bright enough and unsaturated enough to resemble the sampled ball profile. A hand or other foreground object can still create enough matching pixels to pass that test.

## Recommended Next Work

1. Tighten trigger qualification so a gate event needs more than "some bright changed pixels".
2. Add shape and size checks so the changed region must look roughly ball-sized rather than hand-sized.
3. Require movement consistency across frames before firing a gate trigger.
4. Test on the published iPhone GitHub Pages build, not only locally.

## Concrete Fix Ideas

- Connected-component filtering:
  Find contiguous changed regions in the ROI and reject anything much larger than the sampled ball area.

- Ball-sized bounds check:
  Compare the candidate blob width and height against the learned ball region size with a tolerance band.

- Circularity / compactness check:
  Prefer candidates that are approximately compact and round, and reject long or wide blobs.

- Multi-frame confirmation:
  Require the candidate to persist for 2-3 consecutive frames before counting as a crossing.

- Directional gating:
  Only accept a finish trigger after a valid start trigger, and optionally require the centroid to move in the expected gate-to-gate direction.

- Reuse template matching:
  Blend the existing ROI-difference signal with a stronger local ball-template confirmation before triggering.

## Good Debug Additions

- Show candidate blob box and estimated area on the debug overlay.
- Log why a candidate was accepted or rejected.
- Add temporary thresholds to the UI or code constants so tuning is faster on-device.

## Suggested Order

1. Instrument the current detector with blob size logging and overlay.
2. Add a simple max-area filter tied to the sampled ball size.
3. Add a 2-frame confirmation rule.
4. Re-test against hand occlusion and real putts.
5. Tune thresholds only after the new guards are in place.

## Current Published Version

- GitHub Pages URL: `https://speuan.github.io/putting-speed-trainer-v6/`
- Current label: `v13 next putt`

