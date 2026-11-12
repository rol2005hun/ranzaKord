# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0-alpha.1] - 2026-11-12

### Added
- **Christmas Holiday Theme**: New festive theme featuring falling snow animations, Santa hat branding, holiday recommendations on the home dashboard, and customized snowflake seekbar thumbs (`#7ea7b12`).
- **Music Video Mode**: Added YouTube music video playback support inside the fullscreen visualizer mode.
- **Color Conversion Utilities**: Added bidirectional HSL/HEX color conversion functions with contrast calculation.

### Fixed
- **Adaptive Theme Contrast**: Calibrated primary accent lightness and saturation to guarantee high contrast and WCAG readability against dark surfaces.
- **Player Bar Snow Positioning**: Aligned the decorative snow overlay snug to the top border of the player bar.
- **Playlist Modal Layout**: Redesigned the cover image in the playlist create/edit modal to match the full height of the adjacent form fields (230x230px).
- **Player & Visualizer Slider Centering**: Fixed thumb vertical centering and minimum position alignment across progress and volume sliders.
- **Localization**: Localized privacy settings, show original lyrics action, and menu translation keys for both English and Hungarian locales.
- **Layout & Sidebar**: Removed obsolete margin and border-radius on the left navigation sidebar for a seamless edge-to-edge design.
- **Streaming & Server**: Authenticated YouTube Innertube instance globally to avoid bot detection and improved session cookie generation.

### Changed
- Updated dependencies and pnpm workspace configuration for Nuxt 4 and Tauri v2.

## [0.1.0-alpha.2] - 2026-07-12

### Fixed
- Private user profile visibility and security checks.
- Tauri Android and mobile icon generation.
- Sitemap generation zeroRuntime configuration.
- Extended unit and integration tests.

## [0.1.0-alpha.1] - 2026-07-11

### Added
- Public user profiles.
- Public and private playlist settings.
- Dynamic adaptive theme support based on track artwork.
- Built-in Equalizer (EQ).
- Collaborative playlists with multi-user editing.
- Improved playback queue management.
- Offline demo mode.
- In-app changelog and roadmap in settings.
- Comprehensive UI overhaul and performance optimizations.

