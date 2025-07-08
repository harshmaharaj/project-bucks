
# iOS App Configuration

## App Details
- **App ID**: app.lovable.443edbf4e9e740b2be5aabd057b3eb48
- **App Name**: Project Bucks
- **Bundle Name**: time-track-freelance-zenith

## Next Steps for iOS Development

After exporting to GitHub and setting up locally:

1. Run `npx cap init` (already configured)
2. Run `npx cap add ios`
3. Run `npm run build`
4. Run `npx cap sync`
5. Run `npx cap open ios` to open in Xcode

## Widget Development
Once you have the native iOS app running, you can add widgets by:
1. Opening the project in Xcode
2. Adding a Widget Extension target
3. Creating SwiftUI widgets that can:
   - Show current timer status
   - Display today's total hours
   - Quick start/stop functionality
   - Show recent projects

## Required for Physical Device Testing
- Mac with Xcode installed
- Apple Developer account (for device testing)
- iOS device for testing
