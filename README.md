# Local disaster preparedness mobile app for elderly
Local disaster preparedness mobile app for elderly

A React Native mobile prototype designed to support older adults in Singapore with disaster preparedness and emergency response.

The application focuses on three environmental hazards:
- Haze
- Flooding
- Heat Stress

Main features include preparedness guides, checklists, knowledge tests, readiness progress, badges, accessibility settings, live and simulated alerts, local notifications, and emergency assistance.

## Technologies

- React Native
- Expo
- Expo SDK 52
- AsyncStorage
- Expo Speech
- Expo Notifications
- React Native Gesture Handler
- React Native Reanimated

## Running the Project

### Expo Snack

1. Open the project in Expo Snack.
2. Ensure the project is using Expo SDK 52.
3. Install the required dependencies if they are not already included.
4. Run the application using the web preview or Expo Go on a compatible Android device.

### Local Development

1. Install Node.js and npm.
2. Extract the project files.
3. Open the project folder in Visual Studio Code.
4. Install the dependencies:

```bash
npm install

npx expo start
```

## 5. Important platform note

## Platform Notes

The majority of the interface can be demonstrated using the web version.

Some features require a physical mobile device and are not fully available through the web preview:

- Local notifications
- Emergency Help phone-dialler integration
- Some touch gestures such as pinch-to-zoom

These features should be tested using Expo Go on an Android device.

## First-Time Use

When the application is started after resetting the prototype:

1. Enter a display name.
2. Complete the spotlight tutorial.
3. The tutorial introduces:
   - Emergency Alerts
   - Readiness
   - Badges
   - Checklists
   - Resources
   - Progress
   - Emergency Help
4. The user is then directed to the Haze Guide and knowledge test.

## Main Features

### Preparedness Guides
Provides Haze, Flood and Heat Stress guidance with:
- Essential Actions
- Optional More Information
- Supporting images
- Full-screen image zoom
- Official information links
- Knowledge tests

### Checklists
Includes:
- Default hazard checklists
- Custom checklists
- User-added items
- Item deletion
- Protected default items

### Gamification
Includes:
- Readiness progress
- Guide completion
- Six achievement badges
- Badge collection shown on Home and Progress

### Accessibility
Includes:
- Large Text
- High Contrast
- Text-to-Speech
- Accessibility labels and hints

### Alerts
Supports:
- Live environmental alerts
- Demo Alert Mode
- Links from alerts to relevant guides and checklists
- Local mobile notifications

### Emergency Help
Provides access to Singapore emergency services through a confirmation dialog before opening the phone dialler.

## Demo Alert Mode

Real environmental hazards cannot be guaranteed during testing.

Demo Alert Mode can therefore simulate:
- Haze Alert
- Flood Alert
- Heat Stress Alert
- No Active Alert

This allows the alert interface, guide links, checklist links, and notification behaviour to be demonstrated consistently.

## Local Data Storage

The prototype does not require a user account or backend database.

The following data is stored locally using AsyncStorage:
- User profile
- Checklists
- Settings
- Guide progress
- Badge progress
- Tutorial completion