# Commercial App Plan

## Purpose

This document turns the current putting speed trainer prototype into a practical plan for shipping a commercial product. It assumes the current codebase is a browser-based iPhone-first prototype with reliable gate-based speed detection, but no accounts, cloud backend, billing, analytics, or production operations yet.

## Product Goal

Build a commercial mobile product that helps golfers measure and improve putting speed with a fast setup flow, repeatable training sessions, saved history, and user profiles. The commercial version should preserve the current strength of the prototype, which is simple and reliable gate-based timing, while adding the product features and infrastructure needed for real customers.

## Product Vision

- Keep the core experience fast enough for live use on a practice green.
- Preserve the current gate-based detection model unless a better approach clearly beats it in reliability on iPhone hardware.
- Add user accounts, saved sessions, personal history, and training progress without making setup feel heavy.
- Make the first paid version useful for solo golfers.
- Leave room for future coach, academy, and team features.

## Success Criteria

### User success

- A new user can install, sign up, calibrate, and complete their first measured putt session in under 5 minutes.
- A returning user can start a new session from a saved profile in under 30 seconds.
- Session history clearly shows progress over time.
- The app works reliably outdoors and indoors on supported iPhones.

### Business success

- Free-to-paid conversion path is clear and valuable.
- Retention is driven by repeat training, progress tracking, and session comparison.
- Support burden stays manageable because calibration and detection are understandable.
- Privacy and camera permissions are handled in a way that supports App Store review and customer trust.

### Technical success

- Detection stays responsive on supported phones.
- Failed putt detections and false triggers are measurable through telemetry.
- Backend, auth, and billing are production-grade.
- The app can ship updates without breaking calibration or stored user data.

## Recommended Product Shape

### MVP commercial offering

- iPhone app or installable web app with a polished onboarding flow
- Account creation and sign-in
- User profile with handedness, preferred units, typical green speed setup, and device support info
- Saved sessions and historical results
- Multi-putt workflow with reusable calibration
- Basic training programs or drills
- Freemium model with a limited free tier and premium subscription

### Later expansion

- Coach dashboards
- Shared plans and remote feedback
- Team or academy accounts
- Benchmark comparisons by handicap or skill segment
- Optional cloud video clips only if performance impact is controlled

## Commercialization Strategy

### Target customer segments

1. Individual golfers who want measurable practice feedback
2. Serious amateurs focused on repeatable speed control
3. Coaches giving structured putting practice
4. Indoor golf or academy environments needing repeatable drills

### Monetization options

1. Freemium subscription
   - Free: limited saved sessions, basic drills, local-only history
   - Paid: unlimited history, cloud sync, advanced analytics, structured training plans
2. Coach plan
   - Multiple athletes, shared drills, athlete progress view
3. Founding-user pricing
   - Useful for early launch validation before a larger pricing rollout

### Recommended first model

Start with consumer freemium plus one premium tier. It is the simplest way to validate willingness to pay without forcing team features too early.

## Product Roadmap

## Phase 0: Stabilize the prototype

Goal: turn the current experiment into a product-ready foundation.

Deliverables:

- Lock and document the current detection pipeline
- Add a proper multi-putt flow with `Next Putt`
- Add calibration reset and session reset states
- Improve error handling for camera permissions and unsupported devices
- Add a supported-device policy for initial launch
- Add internal debug logging that can be enabled without exposing noisy overlays to all users
- Establish repeatable manual test scenarios on real iPhones

Exit criteria:

- The current core measurement flow is reliable enough that product work is not built on unstable behaviour.

## Phase 1: Define the product and UX

Goal: translate the prototype into a commercial user journey.

Deliverables:

- Product requirements doc
- User personas and core jobs-to-be-done
- Onboarding wireframes
- Session flow wireframes
- Account and profile model
- Result history and progress views
- Subscription entitlement rules
- Privacy and permissions copy

Key decisions:

- Native app, PWA, or hybrid wrapper
- Supported launch devices
- Free tier limits
- Whether first release stores video at all

Recommendation:

Strongly consider wrapping the web experience in a native iOS shell, or rebuilding the UI shell in React Native / native iOS while keeping the CV logic isolated. A commercial app will benefit from better installability, permissions handling, subscription support, and App Store distribution.

## Phase 2: Re-architect for production

Goal: move from static GitHub Pages hosting to an application architecture that supports accounts and cloud data.

Deliverables:

- Frontend application architecture decision
- Backend architecture decision
- Environment strategy for dev, staging, production
- Data model for users, profiles, sessions, putts, entitlements, devices
- API contracts
- Observability and error tracking plan

Recommended architecture:

- Client:
  - Keep camera and detection processing on-device
  - Move UI into a modern app structure with components, routing/state management, and testability
- Backend:
  - Managed backend stack such as Supabase, Firebase, or a custom API with PostgreSQL
  - Auth, profile storage, session sync, subscriptions, analytics events
- Storage:
  - Relational data for users, plans, sessions, drill definitions
  - Blob storage only if media capture is added later

Recommendation:

Use a managed backend first. Supabase is a strong fit if you want PostgreSQL, row-level security, and simpler product iteration. Firebase is also viable if you prefer its mobile-centric auth and analytics ecosystem.

## Phase 3: Accounts and user profiles

Goal: add identity and persistent user state.

Deliverables:

- Email/password and social sign-in
- Password reset and account recovery
- User profile fields
- Units preferences
- Local-to-cloud sync
- Guest mode with upgrade path
- Account deletion flow

Suggested profile fields:

- Name
- Email
- Handicap range optional
- Dominant hand optional
- Preferred units
- Home practice surface notes optional
- Device model and app version for support diagnostics

Important product rule:

Do not force sign-up before the user understands the value. Let users try a short guided session in guest mode, then ask them to save results.

## Phase 4: Sessions, history, and analytics

Goal: make the app sticky by helping users see improvement.

Deliverables:

- Session model
- Saved putt results
- Aggregated stats
- Personal bests
- Trend charts
- Drill completion tracking
- Notes per session
- Filters by date, drill, distance, and green speed setup

Core metrics to capture:

- Gate distance
- Calculated speed
- Trigger confidence
- False start or invalid trial markers
- Session duration
- Calibration reuse count
- Device and app version

User-facing insights:

- Average speed by session
- Consistency spread
- Best streak
- Improvement over last 7, 30, and 90 days

## Phase 5: Payments and entitlements

Goal: support monetization cleanly.

Deliverables:

- Subscription plans
- Free trial logic
- Paywall screens
- App Store billing integration
- Entitlement service
- Restore purchases flow
- Pricing experiment framework

Recommended paid features:

- Unlimited saved sessions
- Full history and charts
- Advanced drill packs
- Data export
- Coach share links when that feature exists

## Phase 6: Quality, compliance, and launch readiness

Goal: make the product safe to sell and support.

Deliverables:

- Privacy policy
- Terms of service
- Camera permission rationale
- Account deletion and data export compliance
- Crash reporting
- Performance monitoring
- QA matrix for supported iPhone devices
- Beta program via TestFlight or equivalent
- Release checklist

Important non-functional requirements:

- Fast startup
- Graceful offline behaviour for local sessions
- Sync retry when connectivity returns
- Clear handling for denied camera permission
- No silent loss of session data

## Phase 7: Growth and expansion

Goal: move beyond the initial commercial release.

Deliverables:

- Coach mode
- Shared athlete dashboards
- Drill marketplace or bundled programs
- Smart recommendations
- Social or challenge features if retention data supports them
- Academy/team pricing

## Workstreams

## 1. Product and design

- Define the premium value proposition
- Design onboarding, calibration, session, history, and paywall flows
- Build a simple, trustworthy visual identity
- Reduce cognitive load during setup

## 2. Core detection and performance

- Preserve the current narrow gate strip approach as the baseline
- Benchmark frame processing on supported devices
- Add confidence scoring and diagnostics
- Create a calibration quality indicator
- Build regression tests around known good videos if possible

## 3. Mobile app platform

- Decide PWA versus native wrapper versus full native rebuild
- Implement app navigation, state persistence, and release configuration
- Integrate camera, permissions, background/foreground handling, and update delivery

## 4. Backend and data

- Auth
- User profiles
- Session storage
- Entitlements
- Analytics events
- Secure admin tooling

## 5. Growth and monetization

- Pricing
- Trials
- Upgrade prompts
- Referral ideas
- Lifecycle messaging later, after product-market fit signals appear

## 6. Operations

- Monitoring
- Incident handling
- Feature flags
- Support tooling
- Release management

## Suggested Technical Evolution

## Current state

- Static site
- Client-side CV logic
- No accounts
- No backend persistence
- No formal test pyramid

## Target state

- Production mobile app
- On-device CV pipeline
- Cloud-backed user accounts and session history
- Subscription billing
- Analytics and crash reporting
- CI/CD for app builds and backend deployments

## Suggested stack direction

### Option A: React / React Native + Supabase

Pros:

- Good long-term product flexibility
- Shared JavaScript expertise from the current codebase
- PostgreSQL data model
- Easier auth and storage than a fully custom backend

Risks:

- Some rework of the current plain JS structure
- Native camera/performance tuning still required

### Option B: Keep web core + native iOS wrapper + managed backend

Pros:

- Faster path from prototype to App Store
- Preserves more of the current detection code
- Native wrapper can handle subscriptions and install flow

Risks:

- Long-term maintenance complexity if web and native boundaries are messy
- Performance debugging across bridge layers can get awkward

### Recommendation

For fastest commercialization, start by isolating the current detection engine behind a clean interface, then choose either a native wrapper or a React Native shell depending on how much UI change you want in the next 1 to 2 months. Do not mix product work and CV logic haphazardly in the current prototype structure.

## Data Model Outline

- `users`
- `profiles`
- `devices`
- `sessions`
- `putts`
- `drills`
- `training_plans`
- `subscriptions`
- `entitlements`
- `analytics_events`
- `support_feedback`

## Milestones

## Milestone 1: Product-ready prototype

Timeline: 2 to 4 weeks

- Multi-putt flow
- Better reset states
- Internal telemetry
- Manual test matrix
- Decision on app shell direction

## Milestone 2: Closed beta

Timeline: 4 to 8 weeks after Milestone 1

- Sign-in
- Profiles
- Saved session history
- Beta-ready UI
- Crash reporting
- Basic subscription scaffolding hidden or limited

## Milestone 3: Paid launch candidate

Timeline: 6 to 10 weeks after Milestone 2

- Billing
- Paywall
- Entitlements
- Polished onboarding
- Privacy/legal pages
- Analytics dashboard
- App Store assets and release process

## Risks and Mitigations

### Risk: measurement reliability drops as product complexity rises

Mitigation:

- Keep detection isolated and benchmarked
- Add telemetry around trigger failures and calibration quality
- Treat CV responsiveness as a release blocker

### Risk: forcing accounts too early hurts activation

Mitigation:

- Support guest mode first
- Convert to sign-up when saving or syncing results

### Risk: too much effort goes into advanced features before core retention is proven

Mitigation:

- Ship history, profiles, and simple premium features before coach/team features

### Risk: web prototype architecture slows down scaling

Mitigation:

- Refactor around modules and interfaces before adding backend logic
- Avoid bolting auth and billing directly onto the current global app flow

## Immediate Next Actions

1. Implement the multi-putt workflow already identified in `PROJECT_NOTES.md`.
2. Refactor the current app into clearer modules: detection engine, session state, UI flow, persistence adapter.
3. Decide the commercial app shell direction: PWA, native wrapper, or React Native.
4. Draft the backend schema for users, profiles, sessions, and entitlements.
5. Design guest mode, sign-up conversion points, and history screens.
6. Add instrumentation for calibration success, trigger failures, and session completion.
7. Prepare a closed-beta scope with only the features needed to validate retention and willingness to pay.

## Recommended Sequence

Do not start with payments. First make the current prototype strong enough to support repeat sessions, then add persistence, then add identity, then add premium packaging around genuinely useful history and training features.

## Definition of Done for the First Commercial Version

The first commercial version is done when:

- Users can complete repeated practice sessions without repeating full calibration every time
- Users can create accounts and recover them
- Users can save and review session history across devices
- Premium features are enforced correctly
- The app is testable, supportable, and acceptable for App Store distribution
- Detection remains fast and reliable on the supported device list
