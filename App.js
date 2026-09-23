/* References
n95 image - https://www.cdc.gov/niosh/ppe/php/n95-use/index.html
haze advisory - https://www.channelnewsasia.com/singapore/haze-nea-psi-unhealthy-forecast-daily-advisories-6362211
flood advisory - https://www.pub.gov.sg/Public/KeyInitiatives/Get-Flood-Wise/Flood-Safety-Tips
heat stress - https://www.nea.gov.sg/media/news/news/index/new-heat-stress-advisory-launched-to-guide-public-on-minimising-risk-of-heat-related-illnesses 
hydration - <a href="https://www.vecteezy.com/free-vector/natural-hydration">Natural Hydration Vectors by Vecteezy</a>
flood2mid -<iframe src="https://assets.pinterest.com/ext/embed.html?id=534802524519794307" height="547" width="345" frameborder="0" scrolling="no" ></iframe>

*/
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Switch,
  Linking,
  Platform,
  Image,
  BackHandler
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STORAGE_KEY = 'elderly_disaster_checklists_v3';
const BADGE_STORAGE_KEY = 'elderly_disaster_badges_v1';
const SETTINGS_STORAGE_KEY = 'elderly_disaster_settings_v1';
const GUIDE_PROGRESS_STORAGE_KEY = 'elderly_disaster_guide_progress_v1';
const USER_PROFILE_STORAGE_KEY = 'elderly_disaster_user_profile_v1';

const API_URLS = {
  psi: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
  flood: 'https://api-open.data.gov.sg/v2/real-time/api/weather/flood-alerts',
  wbgt: 'https://api-open.data.gov.sg/v2/real-time/api/weather?api=wbgt',
};

const defaultSettings = {
  textToSpeech: true,
  highContrast: false,
  largeText: false,
  notifications: true,
  demoAlertMode: true,
  demoAlertType: 'haze',
};

const defaultChecklists = [
  {
    id: 'haze',
    title: 'Haze',
    type: 'Default',
    items: [
      { id: 'haze-1', text: 'Prepare N95 mask', done: false },
      { id: 'haze-2', text: 'Close windows and doors', done: false },
      { id: 'haze-3', text: 'Check air quality updates', done: false },
      { id: 'haze-4', text: 'Prepare medication', done: false },
      { id: 'haze-5', text: 'Call caregiver if feeling unwell', done: false },
    ],
  },
  {
    id: 'flood',
    title: 'Flood',
    type: 'Default',
    items: [
      {
        id: 'flood-1',
        text: 'Avoid walking through flooded areas',
        done: false,
      },
      { id: 'flood-2', text: 'Move important items higher', done: false },
      { id: 'flood-3', text: 'Check official weather updates', done: false },
      { id: 'flood-4', text: 'Keep phone charged', done: false },
    ],
  },
  {
    id: 'heatwave',
    title: 'Heatwave',
    type: 'Default',
    items: [
      { id: 'heat-1', text: 'Drink enough water', done: false },
      { id: 'heat-2', text: 'Stay in a cool shaded place', done: false },
      { id: 'heat-3', text: 'Avoid outdoor activity at noon', done: false },
      { id: 'heat-4', text: 'Check on elderly neighbours', done: false },
    ],
  },
];

const defaultBadges = [
  {
    id: 'tutorial-complete',
    title: 'Getting Started Badge',
    description: 'Completed the introductory tutorial.',
    earned: false,
    earnedAt: null,
  },
  {
    id: 'haze-aware',
    title: 'Haze Aware Badge',
    description: 'Passed the Haze Guide test.',
    earned: false,
    earnedAt: null,
  },
  {
    id: 'flood-ready',
    title: 'Flood Ready Badge',
    description: 'Passed the Flood Guide test.',
    earned: false,
    earnedAt: null,
  },
  {
    id: 'heat-safe',
    title: 'Heat Safe Badge',
    description: 'Passed the Heat Stress Guide test.',
    earned: false,
    earnedAt: null,
  },
  {
    id: 'checklist-revisit',
    title: 'Preparedness Habit Badge',
    description: 'Returned to a checklist after opening it before.',
    earned: false,
    earnedAt: null,
  },
  {
    id: 'preparedness-master',
    title: 'Preparedness Champion Badge',
    description: 'Collected every other preparedness badge.',
    earned: false,
    earnedAt: null,
  },
];

const guides = [
  {
    id: 'haze-guide',
    title: 'Haze Guide',
    description: 'Learn what to do during haze.',
    content:
      'Check official air quality updates and reduce outdoor activity when air quality becomes unhealthy. Keep medication nearby and use an N95 mask when outdoor activity cannot be avoided.',
    moreContent:
      'Keep doors and windows closed where practical and follow medical advice for existing health conditions. Contact a caregiver or seek medical assistance if you begin to feel unwell.',
    images: [require('./assets/haze-psi.jpg')],
    midImage: require('./assets/haze-n95.jpg'),
    moreInfoUrl: 'https://www.haze.gov.sg/',
    badgeId: 'haze-aware',
    checklistId: 'haze',
    questions: [
      {
        id: 'q1',
        question: 'Question 1: What item should be prepared during haze?',
        options: ['N95 mask', 'Extra shoes', 'Umbrella only'],
        answer: 'N95 mask',
      },
      {
        id: 'q2',
        question:
          'Question 2: What should users do when air quality is unhealthy?',
        options: [
          'Stay indoors if possible',
          'Exercise outdoors',
          'Open all windows',
        ],
        answer: 'Stay indoors if possible',
      },
      {
        id: 'q3',
        question: 'Question 3: What should users do if they feel unwell?',
        options: [
          'Ignore it',
          'Contact caregiver or seek help',
          'Wait for a week',
        ],
        answer: 'Contact caregiver or seek help',
      },
    ],
  },
  {
    id: 'flood-guide',
    title: 'Flood Guide',
    description: 'Learn how to stay safe during flooding.',
    content:
      'Avoid flooded roads and walkways, move away from drains and canals, and follow official instructions. Keep your phone charged and important belongings above floor level.',
    moreContent:
      'Do not enter fast-moving or unknown-depth water. Contact emergency services or a caregiver if assistance is needed, and continue checking official updates until conditions improve.',
    images: [require('./assets/flood.jpg')],
    midImage: require('./assets/flood2mid.jpg'),
    moreInfoUrl: 'https://www.pub.gov.sg/Public/KeyInitiatives/Get-Flood-Wise/Flood-Safety-Tips',
    badgeId: 'flood-ready',
    checklistId: 'flood',
    questions: [
      {
        id: 'flood-q1',
        question: 'What should you do when a path is flooded?',
        options: [
          'Avoid the flooded path',
          'Walk through it slowly',
          'Stand beside a drain',
        ],
        answer: 'Avoid the flooded path',
      },
      {
        id: 'flood-q2',
        question: 'Where should important items be placed?',
        options: ['On a higher level', 'Beside the front door', 'On the floor'],
        answer: 'On a higher level',
      },
      {
        id: 'flood-q3',
        question: 'What should you do during an official flood alert?',
        options: [
          'Follow official instructions',
          'Ignore further updates',
          'Visit the flooded location',
        ],
        answer: 'Follow official instructions',
      },
    ],
  },
  {
    id: 'heat-guide',
    title: 'Heat Stress Guide',
    description: 'Learn how to remain safe during hot weather.',
    content:
      'Drink water regularly, remain in a cool or shaded place and avoid strenuous outdoor activity during the hottest part of the day.',
    moreContent:
      'Wear light clothing, keep medication nearby and check on people who may be vulnerable to heat. Contact a caregiver or seek medical help if you begin to feel unwell.',
    images: [require('./assets/heat-stress.jpg')],
    midImage: require('./assets/hydration.jpg'),
    moreInfoUrl: 'https://www.nea.gov.sg/media/news/news/index/new-heat-stress-advisory-launched-to-guide-public-on-minimising-risk-of-heat-related-illnesses',
    badgeId: 'heat-safe',
    checklistId: 'heatwave',
    questions: [
      {
        id: 'heat-q1',
        question: 'What should you drink regularly during hot weather?',
        options: ['Water', 'Nothing until evening', 'Only very hot drinks'],
        answer: 'Water',
      },
      {
        id: 'heat-q2',
        question: 'Where should you remain during extreme heat?',
        options: [
          'In a cool or shaded place',
          'In direct sunlight',
          'Inside a parked vehicle',
        ],
        answer: 'In a cool or shaded place',
      },
      {
        id: 'heat-q3',
        question: 'What should you do if you feel unwell from the heat?',
        options: ['Seek help', 'Continue exercising', 'Ignore the symptoms'],
        answer: 'Seek help',
      },
    ],
  },
];

const demoAlerts = [
  {
    id: 'alert-haze',
    hazardType: 'haze',
    title: 'Haze Alert',
    message: 'Air quality is unhealthy.',
    instruction: 'Stay indoors and prepare your haze checklist.',
    severity: 'High',
    guideId: 'haze-guide',
    checklistId: 'haze',
  },
  {
    id: 'alert-flood',
    hazardType: 'flood',
    title: 'Flood Alert',
    message: 'Heavy rain may cause flash flooding.',
    instruction: 'Avoid flooded areas and check the flood checklist.',
    severity: 'High',
    guideId: 'flood-guide',
    checklistId: 'flood',
  },
  {
    id: 'alert-heatwave',
    hazardType: 'heatwave',
    title: 'Heat Alert',
    message: 'High temperatures are expected.',
    instruction: 'Drink water and remain in a cool place.',
    severity: 'Moderate',
    guideId: 'heat-guide',
    checklistId: 'heatwave',
  },
];

const defaultGuideProgress = {
  'haze-guide': {
    completed: false,
    bestScore: 0,
    attempts: 0,
    completedAt: null,
  },
  'flood-guide': {
    completed: false,
    bestScore: 0,
    attempts: 0,
    completedAt: null,
  },
  'heat-guide': {
    completed: false,
    bestScore: 0,
    attempts: 0,
    completedAt: null,
  },
};

const AppThemeContext = createContext(null);

function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeContext.Provider');
  }

  return context;
}

function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  async function speak(text) {
    if (!text || !text.trim()) {
      Alert.alert(
        'Nothing to Read',
        'There is no text available on this page.'
      );
      return;
    }

    try {
      const currentlySpeaking = await Speech.isSpeakingAsync();

      if (currentlySpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }

      Speech.speak(text, {
        language: 'en-SG',
        rate: 0.85,
        pitch: 1,
        volume: 1,

        onStart: () => {
          setIsSpeaking(true);
        },

        onDone: () => {
          setIsSpeaking(false);
        },

        onStopped: () => {
          setIsSpeaking(false);
        },

        onError: (error) => {
          console.log('Text-to-speech error', error);
          setIsSpeaking(false);

          Alert.alert('Speech Error', 'The page could not be read aloud.');
        },
      });
    } catch (error) {
      console.log('Failed to start speech', error);
      setIsSpeaking(false);
    }
  }

  return {
    isSpeaking,
    speak,
  };
}

function ReadButton({ text, accessibilityLabel }) {
  const { styles, settings } = useAppTheme();
  const { isSpeaking, speak } = useTextToSpeech();

  if (!settings.textToSpeech) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.speakerButton, isSpeaking && styles.speakerButtonSpeaking]}
      onPress={() => speak(text)}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ||
        (isSpeaking ? 'Stop reading this page' : 'Read this page aloud')
      }
      accessibilityState={{
        selected: isSpeaking,
      }}>
      <Text style={styles.speakerText}>{isSpeaking ? 'Stop' : 'Read'}</Text>
    </TouchableOpacity>
  );
}

const defaultUserProfile = {
  name: '',
  setupCompleted: false,
  tutorialCompleted: false,
  checklistVisitCounts: {},
};

function getGreeting() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return 'Good Morning';
  }

  if (currentHour < 18) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result?.code !== undefined && result.code !== 0) {
    throw new Error(result.errorMsg || 'The API returned an error.');
  }

  return result;
}

async function fetchHazeAlert() {
  const result = await fetchJson(API_URLS.psi);

  const latestItem = result?.data?.items?.[0];
  const regionalPsi = latestItem?.readings?.psi_twenty_four_hourly;

  if (!regionalPsi) {
    throw new Error('PSI readings were missing.');
  }

  const regionalValues = Object.entries(regionalPsi)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .map(([region, value]) => ({
      region,
      value: Number(value),
    }));

  if (regionalValues.length === 0) {
    throw new Error('No valid PSI readings were found.');
  }

  const highestReading = regionalValues.reduce((highest, current) =>
    current.value > highest.value ? current : highest
  );

  if (highestReading.value < 101) {
    return null;
  }

  let severity = 'Unhealthy';

  if (highestReading.value > 300) {
    severity = 'Hazardous';
  } else if (highestReading.value >= 201) {
    severity = 'Very Unhealthy';
  }

  return {
    id: 'live-haze-alert',
    hazardType: 'haze',
    title: 'Haze Alert',
    message:
      `The highest 24-hour PSI is ${highestReading.value} ` +
      `in the ${highestReading.region} region.`,
    instruction: 'Reduce outdoor activity and prepare your haze checklist.',
    severity,
    guideId: 'haze-guide',
    checklistId: 'haze',
    source: 'NEA',
    updatedAt: latestItem.updatedTimestamp || latestItem.timestamp || null,
  };
}

async function fetchHeatAlert() {
  const result = await fetchJson(API_URLS.wbgt);

  const latestRecord = result?.data?.records?.[0];
  const readings = latestRecord?.item?.readings;

  if (!Array.isArray(readings)) {
    throw new Error('WBGT readings were missing.');
  }

  const validReadings = readings
    .map((reading) => ({
      station:
        reading?.station?.townCenter ||
        reading?.station?.name ||
        'Unknown location',
      wbgt: Number(reading?.wbgt),
      heatStress: String(reading?.heatStress || '').toLowerCase(),
    }))
    .filter((reading) => Number.isFinite(reading.wbgt));

  if (validReadings.length === 0) {
    throw new Error('No valid WBGT readings were found.');
  }

  const highestReading = validReadings.reduce((highest, current) =>
    current.wbgt > highest.wbgt ? current : highest
  );

  const hasHighHeatStress = validReadings.some(
    (reading) => reading.heatStress === 'high'
  );

  if (!hasHighHeatStress) {
    return null;
  }

  return {
    id: 'live-heat-alert',
    hazardType: 'heatwave',
    title: 'Heat Stress Alert',
    message:
      `High heat stress has been recorded. ` +
      `The highest WBGT reading is ${highestReading.wbgt}°C ` +
      `at ${highestReading.station}.`,
    instruction: 'Stay cool, drink water and prepare your heat checklist.',
    severity: 'High',
    guideId: 'heat-guide',
    checklistId: 'heatwave',
    source: 'NEA',
    updatedAt: latestRecord.updatedTimestamp || null,
  };
}

async function fetchFloodAlert() {
  const result = await fetchJson(API_URLS.flood);

  const records = result?.data?.records;

  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const recordWithFlood = records.find(
    (record) =>
      Array.isArray(record?.item?.readings) &&
      record.item.readings.length > 0
  );

  if (!recordWithFlood) {
    return null;
  }

  const floodReading = recordWithFlood.item.readings[0];

  const location =
    floodReading?.location ||
    floodReading?.area ||
    floodReading?.roadName ||
    floodReading?.road ||
    floodReading?.station?.name ||
    floodReading?.station?.townCenter ||
    floodReading?.description ||
    null;

  const severity =
    floodReading?.severity ||
    floodReading?.level ||
    'High';

  const eventId =
    floodReading?.id ||
    floodReading?.eventId ||
    floodReading?.alertId ||
    recordWithFlood.datetime;

  return {
    id: `live-flood-${eventId}`,
    hazardType: 'flood',
    title: location
      ? `Flood Alert – ${location}`
      : 'Flood Alert',
    message:
      floodReading?.message ||
      floodReading?.description ||
      (location
        ? `Flooding has been reported at ${location}.`
        : 'Flooding has been reported in Singapore.'),
    instruction:
      'Avoid the affected area and prepare your flood checklist.',
    severity,
    guideId: 'flood-guide',
    checklistId: 'flood',
    source: 'PUB',
    updatedAt:
      recordWithFlood.updatedTimestamp ||
      recordWithFlood.datetime ||
      null,
  };
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [checklists, setChecklists] = useState(defaultChecklists);
  const [badges, setBadges] = useState(defaultBadges);
  const [badgeQueue, setBadgeQueue] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [quizValidationAttempted, setQuizValidationAttempted] = useState(false);

  const [settings, setSettings] = useState(defaultSettings);
  const [guideProgress, setGuideProgress] = useState(defaultGuideProgress);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [setupName, setSetupName] = useState('');
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertError, setAlertError] = useState(null);
  const [lastAlertUpdate, setLastAlertUpdate] = useState(null);
  const [tutorialInProgress, setTutorialInProgress] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(false);
  const previousAlertIdsRef = useRef(new Set());

  const selectedDemoAlert =
    settings.demoAlertType === 'none'
      ? null
      : demoAlerts.find(
          (alert) => alert.hazardType === settings.demoAlertType
        ) || null;

  const displayedAlerts = settings.demoAlertMode
    ? selectedDemoAlert
      ? [selectedDemoAlert]
      : []
    : liveAlerts;

  const activeAlert = displayedAlerts[0] || null;

  useEffect(() => {
    async function loadStoredData() {
      try {
        const [
          savedChecklists,
          savedBadges,
          savedSettings,
          savedGuideProgress,
          savedUserProfile,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(BADGE_STORAGE_KEY),
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
          AsyncStorage.getItem(GUIDE_PROGRESS_STORAGE_KEY),
          AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY),
        ]);

        if (savedChecklists) {
          setChecklists(JSON.parse(savedChecklists));
        }

        if (savedBadges) {
          setBadges(JSON.parse(savedBadges));
        }

        if (savedSettings) {
          setSettings({
            ...defaultSettings,
            ...JSON.parse(savedSettings),
          });
        }

        if (savedGuideProgress) {
          setGuideProgress({
            ...defaultGuideProgress,
            ...JSON.parse(savedGuideProgress),
          });
        }

        if (savedUserProfile) {
          const parsedProfile = JSON.parse(savedUserProfile);

          setUserProfile({
            ...defaultUserProfile,
            ...parsedProfile,
          });

          setSetupName(parsedProfile.name || '');
        }
      } catch (error) {
        console.log('Failed to load stored data', error);
      } finally {
        setDataLoaded(true);
      }
    }

    loadStoredData();
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    async function storeUserProfile() {
      try {
        await AsyncStorage.setItem(
          USER_PROFILE_STORAGE_KEY,
          JSON.stringify(userProfile)
        );
      } catch (error) {
        console.log('Failed to save user profile', error);
      }
    }

    storeUserProfile();
  }, [userProfile, dataLoaded]);

  function completeFirstTimeSetup() {
    const cleanedName = setupName.trim();

    if (!cleanedName) {
      Alert.alert('Name Required', 'Please enter your name before continuing.');
      return;
    }

    if (cleanedName.length > 30) {
      Alert.alert(
        'Name Too Long',
        'Please enter a name with 30 characters or fewer.'
      );
      return;
    }

    setUserProfile({
      name: cleanedName,
      setupCompleted: true,
      tutorialCompleted: false,
      checklistVisitCounts: {},
    });

    setTutorialStep(0);
    setTutorialInProgress(true);
    setScreen('home');
  }

  useEffect(() => {
    if (!dataLoaded) return;

    async function storeChecklists() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
      } catch (error) {
        console.log('Failed to save checklists', error);
      }
    }

    storeChecklists();
  }, [checklists, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    async function storeBadges() {
      try {
        await AsyncStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(badges));
      } catch (error) {
        console.log('Failed to save badges', error);
      }
    }

    storeBadges();
  }, [badges, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    async function storeGuideProgress() {
      try {
        await AsyncStorage.setItem(
          GUIDE_PROGRESS_STORAGE_KEY,
          JSON.stringify(guideProgress)
        );
      } catch (error) {
        console.log('Failed to save guide progress', error);
      }
    }

    storeGuideProgress();
  }, [guideProgress, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    async function storeSettings() {
      try {
        await AsyncStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(settings)
        );
      } catch (error) {
        console.log('Failed to save settings', error);
      }
    }

    storeSettings();
  }, [settings, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || settings.demoAlertMode) {
      return;
    }

    refreshLiveAlerts();
  }, [dataLoaded, settings.demoAlertMode]);

  useEffect(() => {
    if (!dataLoaded || !userProfile.setupCompleted || !settings.notifications) {
      return;
    }

    async function prepareNotifications() {
      try {
        if (Platform.OS === 'web') {
          setNotificationPermissionGranted(false);
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('emergency-alerts', {
            name: 'Emergency Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const currentPermissions = await Notifications.getPermissionsAsync();

        if (currentPermissions.granted) {
          setNotificationPermissionGranted(true);
          return;
        }

        const requestedPermissions =
          await Notifications.requestPermissionsAsync();

        if (!requestedPermissions.granted) {
            setSettings((previousSettings) => ({
              ...previousSettings,
              notifications: false,
            }));

          setNotificationPermissionGranted(false);

          Alert.alert(
            'Notifications Disabled',
            'Notification permission was not granted. You can enable it later in your device settings.'
          );
          return;
        }

        setNotificationPermissionGranted(true);
      } catch (error) {
        console.log('Failed to prepare notifications', error);
      }
    }

    prepareNotifications();
  }, [dataLoaded, userProfile.setupCompleted, settings.notifications]);

  useEffect(() => {
    const currentAlertKeys = new Set(
      displayedAlerts.map(
        (alert) => `${alert.id}-${alert.hazardType}`
      )
    );

    async function notifyForNewAlerts() {
      if (
        !dataLoaded ||
        !userProfile.setupCompleted ||
        !settings.notifications ||
        !notificationPermissionGranted ||
        Platform.OS === 'web'
      ) {
        return;
      }

      const newAlerts = displayedAlerts.filter(
        (alert) =>
          !previousAlertIdsRef.current.has(
            `${alert.id}-${alert.hazardType}`
          )
      );

      for (const alert of newAlerts) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alert.title,
              body: `${alert.message} ${alert.instruction}`,
              sound: 'default',
              data: {
                alertId: alert.id,
                hazardType: alert.hazardType,
              },
            },
            trigger: null,
          });
        } catch (error) {
          console.log(
            'Failed to show alert notification',
            error
          );
        }
      }

      previousAlertIdsRef.current = currentAlertKeys;
    }

    notifyForNewAlerts();
  }, [
    displayedAlerts,
    dataLoaded,
    userProfile.setupCompleted,
    settings.notifications,
    notificationPermissionGranted,
  ]);

  useEffect(() => {
    Speech.stop().catch((error) => {
      console.log('Failed to stop speech during navigation', error);
    });
  }, [screen]);

  //Android back button 
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const handleAndroidBack = () => {
      //Do not allow the Android Back button to escape the guided Home tutorial 
      if (tutorialInProgress) {
        return true;
      }

      switch (screen) {
        case 'detail':
          setScreen('selection');
          return true;

        case 'selection':
          setScreen('home');
          return true;

        case 'guideTest':
          setScreen('guideInfo');
          return true;

        case 'testResult':
          setScreen('guideInfo');
          return true;

        case 'guideInfo':
          setScreen('resources');
          return true;

        case 'resources':
          setScreen('home');
          return true;

        case 'progress':
          setScreen('home');
          return true;

        case 'settings':
          setScreen('home');
          return true;

        case 'home':
          return false;

        default:
          setScreen('home');
          return true;
      }
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleAndroidBack
    );

    return () => {
      backSubscription.remove();
    };
  }, [screen, tutorialInProgress]);

  useEffect(() => {
    if (
      dataLoaded &&
      userProfile.setupCompleted &&
      !userProfile.tutorialCompleted &&
      screen === 'home'
    ) {
      setTutorialStep(0);
      setTutorialInProgress(true);
    }
  }, [
    dataLoaded,
    userProfile.setupCompleted,
    userProfile.tutorialCompleted,
    screen,
  ]);

  function queueBadgePopup(badge) {
    setBadgeQueue((previousQueue) => [
      ...previousQueue,
      badge,
    ]);
  }
  function unlockBadge(badgeId) {
    const badge = badges.find((item) => item.id === badgeId);

    if (!badge || badge.earned) {
      return;
    }

    const earnedBadge = {
      ...badge,
      earned: true,
      earnedAt: new Date().toISOString(),
    };

    setBadges((previousBadges) =>
      previousBadges.map((item) =>
        item.id === badgeId ? earnedBadge : item
      )
    );

    queueBadgePopup(earnedBadge);
  }

  useEffect(() => {
    const prerequisiteBadgeIds = [
      'tutorial-complete',
      'haze-aware',
      'flood-ready',
      'heat-safe',
      'checklist-revisit',
    ];

    const allPrerequisitesEarned = prerequisiteBadgeIds.every((badgeId) =>
      badges.some((badge) => badge.id === badgeId && badge.earned)
    );

    const masterBadge = badges.find(
      (badge) => badge.id === 'preparedness-master'
    );

    if (allPrerequisitesEarned && masterBadge && !masterBadge.earned) {
      const earnedMasterBadge = {
        ...masterBadge,
        earned: true,
        earnedAt: new Date().toISOString(),
      };

      setBadges((previousBadges) =>
        previousBadges.map((badge) =>
          badge.id === 'preparedness-master'
            ? earnedMasterBadge
            : badge
        )
      );

      queueBadgePopup(earnedMasterBadge);
    }
  }, [badges]);

  useEffect(() => {
    if (currentBadge || badgeQueue.length === 0) {
      return;
    }

    setCurrentBadge(badgeQueue[0]);

    setBadgeQueue((previousQueue) =>
      previousQueue.slice(1)
    );
  }, [badgeQueue, currentBadge]);


  function openChecklist(id) {
    const previousVisits = userProfile.checklistVisitCounts?.[id] || 0;
    const updatedVisits = previousVisits + 1;

    setUserProfile((previousProfile) => ({
      ...previousProfile,
      checklistVisitCounts: {
        ...(previousProfile.checklistVisitCounts || {}),
        [id]: updatedVisits,
      },
    }));

    if (updatedVisits >= 2) {
      unlockBadge('checklist-revisit');
    }

    setSelectedChecklistId(id);
    setScreen('detail');
  }

  function createChecklist() {
    if (!newChecklistName.trim()) {
      Alert.alert('Missing name', 'Please enter a checklist name.');
      return;
    }

    const splitItems = newChecklistItems
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (splitItems.length === 0) {
      Alert.alert(
        'No Checklist Items',
        'Please enter at least one checklist item.'
      );
      return;
    }

    const newChecklist = {
      id: `custom-${Date.now()}`,
      title: newChecklistName.trim(),
      type: 'Custom',
      items: splitItems.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        text: item,
        done: false,
      })),
    };

    setChecklists([...checklists, newChecklist]);

    setNewChecklistName('');
    setNewChecklistItems('');
    setModalVisible(false);
  }

  function toggleItem(itemId) {
    const updatedChecklists = checklists.map((list) => {
      if (list.id !== selectedChecklistId) return list;

      return {
        ...list,
        items: list.items.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item
        ),
      };
    });

    setChecklists(updatedChecklists);
  }

  function addItemToSelectedChecklist() {
    if (!newItemText.trim()) {
      Alert.alert('Missing Item', 'Please enter an item before adding it.');
      return;
    }

    const updatedChecklists = checklists.map((list) => {
      if (list.id !== selectedChecklistId) return list;

      return {
        ...list,
        items: [
          ...list.items,
          {
            id: `added-${Date.now()}`,
            text: newItemText.trim(),
            done: false,
          },
        ],
      };
    });

    setChecklists(updatedChecklists);
    setNewItemText('');
  }

  function deleteChecklistItem(itemId) {
    const checklist = checklists.find(
      (list) => list.id === selectedChecklistId
    );

    if (!checklist) {
      return;
    }

    const item = checklist.items.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    const isUserCreatedItem =
      checklist.type === 'Custom' ||
      item.id.startsWith('added-') ||
      item.id.startsWith('item-');

    if (!isUserCreatedItem) {
      Alert.alert(
        'Default Item',
        'The original emergency items in a default checklist cannot be deleted.'
      );
      return;
    }

    const performDelete = () => {
      setChecklists((previousChecklists) =>
        previousChecklists.map((list) =>
          list.id === selectedChecklistId
            ? {
                ...list,
                items: list.items.filter((entry) => entry.id !== itemId),
              }
            : list
        )
      );
    };

    const message = `Remove "${item.text}" from this checklist?`;

    if (Platform.OS === 'web') {
      const confirmed =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm(message)
          : true;

      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert('Remove Checklist Item?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
  }

  function deleteSelectedChecklist() {
    const checklist = checklists.find(
      (list) => list.id === selectedChecklistId
    );

    if (!checklist || checklist.type !== 'Custom') {
      return;
    }

    const performDelete = () => {
      setChecklists((previousChecklists) =>
        previousChecklists.filter((list) => list.id !== checklist.id)
      );
      setSelectedChecklistId(null);
      setNewItemText('');
      setScreen('selection');
    };

    const message = `Delete "${checklist.title}"? This cannot be undone.`;

    if (Platform.OS === 'web') {
      const confirmed =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm(message)
          : true;

      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert('Delete Checklist?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
  }

  async function resetPrototype() {
    //Reset the visible state immediately, then clear all persisted data
    //Keeping dataLoaded false prevents the save effects from writing the old state back into AsyncStorage while the reset is taking place
    setDataLoaded(false);

    try {
      await Speech.stop();
    } catch (error) {
      console.log('Failed to stop speech during reset', error);
    }

    setChecklists(defaultChecklists);
    setBadges(defaultBadges);
    setBadgeQueue([]);
    setCurrentBadge(null);
    setSettings(defaultSettings);
    setGuideProgress(defaultGuideProgress);
    setUserProfile({ ...defaultUserProfile });
    setSetupName('');

    setLiveAlerts([]);
    setAlertLoading(false);
    setAlertError(null);
    setLastAlertUpdate(null);

    setTutorialInProgress(false);
    setTutorialStep(0);
    setNotificationPermissionGranted(false);
    previousAlertIdsRef.current = new Set();

    setSelectedChecklistId(null);
    setSelectedGuideId(null);
    setQuizAnswers({});
    setQuizValidationAttempted(false);
    setTestResult(null);
    setNewChecklistName('');
    setNewChecklistItems('');
    setNewItemText('');
    setModalVisible(false);
    setScreen('home');

    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        BADGE_STORAGE_KEY,
        SETTINGS_STORAGE_KEY,
        GUIDE_PROGRESS_STORAGE_KEY,
        USER_PROFILE_STORAGE_KEY,
      ]);
    } catch (error) {
      console.log('Failed to clear stored prototype data', error);
    }

    //Re-enable persistence only after storage has been cleared.
    setDataLoaded(true);
  }

  function confirmResetPrototype() {
    const message = 'This will remove your saved name, progress, badges, checklists and settings.';

    //React Native Alert confirmation buttons are not consistently supported by Expo Snack on web, so use the browser confirmation dialog there.
    if (Platform.OS === 'web') {
      const confirmed =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm(`Reset Prototype?\n\n${message}`)
          : true;

      if (confirmed) {
        resetPrototype();
      }
      return;
    }

    Alert.alert('Reset Prototype?', message, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: resetPrototype,
      },
    ]);
  }

  const selectedChecklist = checklists.find(
    (list) => list.id === selectedChecklistId
  );

  const selectedGuide = guides.find((guide) => guide.id === selectedGuideId);

  const selectedGuideIndex = guides.findIndex((guide) => guide.id === selectedGuideId);

  const nextGuide =
    selectedGuideIndex >= 0 && selectedGuideIndex < guides.length - 1
      ? guides[selectedGuideIndex + 1]
      : null;

  const completedGuides = guides.filter((guide) => guideProgress[guide.id]?.completed === true).length;

  const totalGuides = guides.length;

  const progress = totalGuides === 0 ? 0 : Math.round((completedGuides / totalGuides) * 100);

  const readinessLevel =
    progress === 0
      ? 'Not Started'
      : progress < 40
      ? 'Getting Started'
      : progress < 80
      ? 'Developing Readiness'
      : progress < 100
      ? 'Almost Prepared'
      : 'Prepared';

  function finishTutorial() {
    setUserProfile((previousProfile) => ({
      ...previousProfile,
      tutorialCompleted: true,
    }));

    unlockBadge('tutorial-complete');
    setTutorialInProgress(false);
    setScreen('home');
  }

  function skipTutorial() {
    setUserProfile((previousProfile) => ({
      ...previousProfile,
      tutorialCompleted: true,
    }));

    setTutorialInProgress(false);
    setScreen('home');
  }

  function replayTutorial() {
    setTutorialStep(0);
    setTutorialInProgress(true);
    setScreen('home');
  }

  function openTutorialHazeGuide() {
    setTutorialStep(0);
    setTutorialInProgress(true);
    setSelectedGuideId('haze-guide');
    setQuizAnswers({});
    setQuizValidationAttempted(false);
    setScreen('guideInfo');
  }

  function openGuide(id) {
    setSelectedGuideId(id);
    setQuizAnswers({});
    setQuizValidationAttempted(false);
    setScreen('guideInfo');
  }

  function startGuideTest() {
    setQuizAnswers({});
    setQuizValidationAttempted(false);
    setScreen('guideTest');
  }

  function selectQuizAnswer(questionId, option) {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }

  function submitGuideTest() {
    if (!selectedGuide) return;

    const unansweredQuestions = selectedGuide.questions.filter(
      (question) => !quizAnswers[question.id]
    );

    if (unansweredQuestions.length > 0) {
      setQuizValidationAttempted(true);

      Alert.alert(
        'Incomplete Test',
        `Please answer all questions. ${unansweredQuestions.length} question${
          unansweredQuestions.length === 1 ? ' is' : 's are'
        } still unanswered.`
      );

      return;
    }

    let score = 0;

    selectedGuide.questions.forEach((question) => {
      if (quizAnswers[question.id] === question.answer) {
        score += 1;
      }
    });

    const passingScore = Math.ceil(selectedGuide.questions.length * (2 / 3));

    const passed = score >= passingScore;

    setGuideProgress((previousProgress) => {
      const existingProgress = previousProgress[selectedGuide.id] || {
        completed: false,
        bestScore: 0,
        attempts: 0,
        completedAt: null,
      };

      const firstCompletion = passed && !existingProgress.completed;

      return {
        ...previousProgress,
        [selectedGuide.id]: {
          completed: existingProgress.completed || passed,

          bestScore: Math.max(existingProgress.bestScore, score),

          attempts: existingProgress.attempts + 1,

          completedAt: firstCompletion
            ? new Date().toISOString()
            : existingProgress.completedAt,
        },
      };
    });

    if (passed) {
      unlockBadge(selectedGuide.badgeId);

      //Completing the Haze test during onboarding completes the tutorial
      //This is done here rather than waiting for the View Progress button so returning to Home cannot restart the tutorial from step one
      if (tutorialInProgress && selectedGuide.id === 'haze-guide') {
        setUserProfile((previousProfile) => ({
          ...previousProfile,
          tutorialCompleted: true,
        }));
        unlockBadge('tutorial-complete');
        setTutorialInProgress(false);
      }
    }

    setTestResult({
      score,
      total: selectedGuide.questions.length,
      passed,
      badgeId: passed ? selectedGuide.badgeId : null,
    });

    setScreen('testResult');
  }
  //Accessibility
  const accessibilityTheme = {
    backgroundColor: settings.highContrast ? '#000000' : '#FFFFFF',
    cardColor: settings.highContrast ? '#000000' : '#F8F0FA',
    textColor: settings.highContrast ? '#FFFFFF' : '#2F2733',
    secondaryTextColor: settings.highContrast ? '#FFFFFF' : '#5F5366',
    borderColor: settings.highContrast ? '#FFFFFF' : '#E5D6EA',
    primaryColor: settings.highContrast ? '#FFD600' : '#6F46B2',
    primaryTextColor: settings.highContrast ? '#000000' : '#FFFFFF',
    selectedColor: settings.highContrast ? '#FFD600' : '#E9DDF2',
    inputBorderColor: settings.highContrast ? '#FFFFFF' : '#D8C9DF',
    switchTrackOff: settings.highContrast ? '#666666' : '#C9C1CC',
    normalTextSize: settings.largeText ? 21 : 18,
    smallTextSize: settings.largeText ? 18 : 15,
    headingTextSize: settings.largeText ? 25 : 20,
    errorColor: settings.highContrast ? '#FFEB3B' : '#B3261E',
    inputColor: settings.highContrast ? '#1A1A1A' : '#FFFFFF',
  };

  const styles = createStyles(accessibilityTheme);

  if (!dataLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading your saved information...
        </Text>
      </SafeAreaView>
    );
  }

  if (!userProfile.setupCompleted) {
    return (
      <AppThemeContext.Provider
        value={{
          styles,
          theme: accessibilityTheme,
          settings,
        }}>
        <FirstTimeSetupScreen
          name={setupName}
          onChangeName={setSetupName}
          onContinue={completeFirstTimeSetup}
        />
      </AppThemeContext.Provider>
    );
  }

  function updateSetting(settingName, value) {
    setSettings((previousSettings) => ({
      ...previousSettings,
      [settingName]: value,
    }));
  }

  //Alerts
  function openAlertGuide(alert) {
    if (!alert) return;

    if (!alert.guideId) {
      Alert.alert(
        'Guide unavailable',
        'A guide has not yet been added for this alert.'
      );
      return;
    }

    setSelectedGuideId(alert.guideId);
    setQuizAnswers({});
    setScreen('guideInfo');
  }

  function openAlertChecklist(alert) {
    if (!alert) return;

    const relatedChecklist = checklists.find(
      (checklist) => checklist.id === alert.checklistId
    );

    if (!relatedChecklist) {
      Alert.alert(
        'Checklist unavailable',
        'A checklist could not be found for this alert.'
      );
      return;
    }

    setSelectedChecklistId(alert.checklistId);
    setScreen('detail');
  }

  async function refreshLiveAlerts() {
    setAlertLoading(true);
    setAlertError(null);

    try {
      const results = await Promise.allSettled([
        fetchHazeAlert(),
        fetchFloodAlert(),
        fetchHeatAlert(),
      ]);

      const alerts = results
        .filter(
          (result) => result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => result.value);

      const failedRequests = results.filter(
        (result) => result.status === 'rejected'
      );

      setLiveAlerts(alerts);
      setLastAlertUpdate(new Date());

      if (failedRequests.length > 0) {
        setAlertError(
          `${failedRequests.length} alert service${
            failedRequests.length === 1 ? '' : 's'
          } could not be loaded.`
        );
      }
    } catch (error) {
      console.log('Failed to refresh alerts', error);
      setAlertError('Live alerts could not be loaded.');
    } finally {
      setAlertLoading(false);
    }
  }

  return (
    <AppThemeContext.Provider
      value={{ styles, theme: accessibilityTheme, settings }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.appFrame}>
          {screen === 'home' && (
            <HomeScreen
              userName={userProfile.name}
              activeAlert={activeAlert}
              displayedAlerts={displayedAlerts}
              demoAlertMode={settings.demoAlertMode}
              alertLoading={alertLoading}
              alertError={alertError}
              lastAlertUpdate={lastAlertUpdate}
              onRefreshAlerts={refreshLiveAlerts}
              progress={progress}
              completedGuides={completedGuides}
              totalGuides={totalGuides}
              readinessLevel={readinessLevel}
              badges={badges}
              onOpenAlertGuide={openAlertGuide}
              onOpenAlertChecklist={openAlertChecklist}
              onOpenChecklist={() => setScreen("selection")}
              onOpenResources={() => setScreen("resources")}
              onOpenProgress={() => setScreen("progress")}
              onEmergencyCall={confirmEmergencyCall}
              onReset={confirmResetPrototype}
              tutorialActive={tutorialInProgress}
              tutorialStep={tutorialStep}
              onTutorialNext={() =>
                setTutorialStep((previousStep) => previousStep + 1)
              }
              onTutorialBack={() =>
                setTutorialStep((previousStep) =>
                  Math.max(0, previousStep - 1)
                )
              }
              onTutorialSkip={skipTutorial}
              onTutorialOpenHazeGuide={openTutorialHazeGuide}
            />
          )}

          {screen === 'selection' && (
            <ChecklistSelectionScreen
              checklists={checklists}
              onOpenChecklist={openChecklist}
              onAddNew={() => setModalVisible(true)}
            />
          )}

          {screen === 'detail' && selectedChecklist && (
            <ChecklistDetailScreen
              checklist={selectedChecklist}
              onBack={() => setScreen('selection')}
              onToggleItem={toggleItem}
              newItemText={newItemText}
              setNewItemText={setNewItemText}
              onAddItem={addItemToSelectedChecklist}
              onDeleteItem={deleteChecklistItem}
              onDeleteChecklist={deleteSelectedChecklist}
            />
          )}

          {screen === 'resources' && (
            <ResourcesScreen
              guides={guides}
              onOpenGuide={openGuide}
              badges={badges}
              guideProgress={guideProgress}
            />
          )}

          {screen === 'guideInfo' && selectedGuide && (
            <GuideInfoScreen
              guide={selectedGuide}
              onBack={() => setScreen('resources')}
              onStartTest={startGuideTest}
              onOpenChecklist={() => openChecklist(selectedGuide.checklistId)}
            />
          )}

          {screen === 'guideTest' && selectedGuide && (
            <GuideTestScreen
              guide={selectedGuide}
              quizAnswers={quizAnswers}
              onSelectAnswer={selectQuizAnswer}
              validationAttempted={quizValidationAttempted}
              onSubmit={submitGuideTest}
              onBack={() => setScreen('guideInfo')}
            />
          )}

          {screen === 'progress' && (
            <ProgressScreen
              progress={progress}
              completedGuides={completedGuides}
              totalGuides={totalGuides}
              readinessLevel={readinessLevel}
              badges={badges}
              guides={guides}
              guideProgress={guideProgress}
            />
          )}
          {screen === 'testResult' && selectedGuide && testResult && (
            <TestResultScreen
              guide={selectedGuide}
              result={testResult}
              badges={badges}
              onViewProgress={() => setScreen('progress')}
              onOpenChecklist={() => openChecklist(selectedGuide.checklistId)}
              nextGuide={nextGuide}
              onOpenNextGuide={() => {
                if (nextGuide) {
                  openGuide(nextGuide.id);
                }
              }}
              onReviewGuide={() => setScreen('guideInfo')}
              onTryAgain={() => {
                setQuizAnswers({});
                setQuizValidationAttempted(false);
                setScreen('guideTest');
              }}
              onBackResources={() => setScreen('resources')}
            />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdateSetting={updateSetting}
              userName={userProfile.name}
              onReplayTutorial={replayTutorial}
              onUpdateName={(newName) => {
                const cleanedName = newName.trim();

                if (!cleanedName) {
                  Alert.alert('Name Required', 'The name cannot be empty.');
                  return;
                }

                setUserProfile((previousProfile) => ({
                  ...previousProfile,
                  name: cleanedName,
                }));

                setSetupName(cleanedName);
              }}
            />
          )}

          {!(tutorialInProgress && screen === 'home') && (
            <BottomNav currentScreen={screen} setScreen={setScreen} />
          )}
        </View>

        <CreateChecklistModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          checklistName={newChecklistName}
          setChecklistName={setNewChecklistName}
          checklistItems={newChecklistItems}
          setChecklistItems={setNewChecklistItems}
          onCreate={createChecklist}
        />

        {currentBadge && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setCurrentBadge(null)}
          >
            <View style={styles.badgePopupOverlay}>
              <View style={styles.badgePopupCard}>
                <Text style={styles.badgePopupSymbol}>
                  ★
                </Text>

                <Text style={styles.badgePopupHeading}>
                  Badge Earned!
                </Text>

                <Text style={styles.badgePopupTitle}>
                  {currentBadge.title}
                </Text>

                <Text style={styles.badgePopupDescription}>
                  {currentBadge.description}
                </Text>

                <TouchableOpacity
                  style={styles.badgePopupButton}
                  onPress={() => setCurrentBadge(null)}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue after earning ${currentBadge.title}`}
                >
                  <Text style={styles.quickButtonText}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

      </SafeAreaView>
    </AppThemeContext.Provider>
  );
}

function confirmEmergencyCall() {
  Alert.alert(
    "Call Emergency Services?",
    "Call 995 only for a fire, rescue situation, or medical emergency.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Call 995",
        style: "destructive",
        onPress: async () => {
          try {
            const phoneUrl = "tel:995";
            const supported = await Linking.canOpenURL(phoneUrl);

            if (!supported) {
              Alert.alert(
                "Calling Unavailable",
                "This device cannot open the phone dialler."
              );
              return;
            }

            await Linking.openURL(phoneUrl);
          } catch (error) {
            console.log("Failed to open emergency call", error);

            Alert.alert(
              "Calling Unavailable",
              "The phone dialler could not be opened."
            );
          }
        },
      },
    ]
  );
}

function HomeScreen({
  userName,
  activeAlert,
  displayedAlerts,
  demoAlertMode,
  alertLoading,
  alertError,
  lastAlertUpdate,
  onRefreshAlerts,
  progress,
  completedGuides,
  totalGuides,
  readinessLevel,
  badges,
  onOpenAlertGuide,
  onOpenAlertChecklist,
  onOpenChecklist,
  onOpenResources,
  onOpenProgress,
  onEmergencyCall,
  onReset,
  tutorialActive,
  tutorialStep,
  onTutorialNext,
  onTutorialBack,
  onTutorialSkip,
  onTutorialOpenHazeGuide,
}) {
  const { styles, settings } = useAppTheme();
  const greeting = getGreeting();

  const alertTutorialRef = useRef(null);
  const readinessTutorialRef = useRef(null);
  const checklistTutorialRef = useRef(null);
  const resourcesTutorialRef = useRef(null);
  const badgesTutorialRef = useRef(null);
  const progressTutorialRef = useRef(null);
  const emergencyTutorialRef = useRef(null);
  const homeScrollRef = useRef(null);
  const homeTutorialRootRef = useRef(null);
  const currentScrollYRef = useRef(0);

  const [tutorialTarget, setTutorialTarget] = useState(null);
  const [tutorialBubbleHeight, setTutorialBubbleHeight] = useState(260);
  const [homeViewport, setHomeViewport] = useState({ width: 0, height: 0 });

  const tutorialSteps = [
    {
      id: 'alert',
      title: 'Emergency Alerts',
      text:
        'Important hazard information appears here. You can open the related guide or checklist directly from an alert.',
      ref: alertTutorialRef,
    },
    {
      id: 'readiness',
      title: 'Your Readiness',
      text:
        'Your readiness increases when you complete preparedness guides and pass their short tests.',
      ref: readinessTutorialRef,
    },
    {
      id: 'badges',
      title: 'Badges',
      text:
        'Earn badges by completing preparedness activities such as the tutorial, hazard tests and checklist revisits. Earned and locked badges are shown here.',
      ref: badgesTutorialRef,
    },
    {
      id: 'checklist',
      title: 'Checklists',
      text:
        'Use checklists to remember important actions and items during an emergency. You can also create your own checklist.',
      ref: checklistTutorialRef,
    },
    {
      id: 'resources',
      title: 'Resources',
      text:
        'Resources contains preparedness guides for Haze, Flood and Heat Stress. Each guide includes a short knowledge test.',
      ref: resourcesTutorialRef,
    },
    {
      id: 'progress',
      title: 'Progress',
      text:
        'Progress shows your overall readiness, completed guides, best quiz scores and detailed badge collection.',
      ref: progressTutorialRef,
    },
    {
      id: 'emergency',
      title: 'Emergency Help',
      text:
        'Emergency Help opens a confirmation before the phone dialler. Do not make an emergency call unless help is genuinely needed.',
      ref: emergencyTutorialRef,
    },
  ];

  const currentTutorialStep =
    tutorialSteps[Math.min(tutorialStep, tutorialSteps.length - 1)];

  const isLastTutorialStep =
    tutorialStep >= tutorialSteps.length - 1;

  useEffect(() => {
    if (!tutorialActive || !currentTutorialStep) {
      setTutorialTarget(null);
      return;
    }

    let cancelled = false;
    let finalMeasureTimer = null;

    const measureRelativeToHome = (callback) => {
      const targetRef = currentTutorialStep.ref?.current;
      const rootRef = homeTutorialRootRef.current;

      if (
        !targetRef ||
        !rootRef ||
        typeof targetRef.measureInWindow !== 'function' ||
        typeof rootRef.measureInWindow !== 'function'
      ) {
        return;
      }

      rootRef.measureInWindow((rootX, rootY, rootWidth, rootHeight) => {
        targetRef.measureInWindow((x, y, width, height) => {
          if (cancelled || width <= 0 || height <= 0) {
            return;
          }

          callback({
            x: x - rootX,
            y: y - rootY,
            width,
            height,
            rootWidth,
            rootHeight,
          });
        });
      });
    };

    //First measure where the real component is, then scroll it to a predictable visible position
    const initialMeasureTimer = setTimeout(() => {
      measureRelativeToHome((measurement) => {
        const viewportHeight =
          homeViewport.height || measurement.rootHeight || 700;

        const desiredTop = Math.max(24, Math.min(90, viewportHeight * 0.12));
        const nextScrollY = Math.max(
          0,
          currentScrollYRef.current + measurement.y - desiredTop
        );

        homeScrollRef.current?.scrollTo({
          y: nextScrollY,
          animated: true,
        });

        currentScrollYRef.current = nextScrollY;

        //Measure again after scrolling. The final spotlight coordinates are relative to the Home root, so SafeArea/status-bar offsets, browser zoom and different phone dimensions do not shift the highlight.
        finalMeasureTimer = setTimeout(() => {
          measureRelativeToHome((finalMeasurement) => {
            setTutorialTarget({
              x: finalMeasurement.x,
              y: finalMeasurement.y,
              width: finalMeasurement.width,
              height: finalMeasurement.height,
            });
          });
        }, 340);
      });
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(initialMeasureTimer);
      if (finalMeasureTimer) {
        clearTimeout(finalMeasureTimer);
      }
    };
  }, [
    tutorialActive,
    tutorialStep,
    homeViewport.width,
    homeViewport.height,
    settings.largeText,
  ]);

  const tutorialCoachPosition = (() => {
    if (!tutorialTarget || !homeViewport.height) {
      return { bottom: 20 };
    }

    const gap = 16;
    const edgePadding = 12;
    const targetTop = Math.max(tutorialTarget.y - 6, edgePadding);
    const targetBottom = tutorialTarget.y + tutorialTarget.height + 6;
    const spaceBelow = homeViewport.height - targetBottom - gap;
    const spaceAbove = targetTop - gap;

    if (spaceBelow >= tutorialBubbleHeight || spaceBelow >= spaceAbove) {
      return {
        top: Math.min(
          targetBottom + gap,
          Math.max(
            edgePadding,
            homeViewport.height - tutorialBubbleHeight - edgePadding
          )
        ),
      };
    }

    return {
      top: Math.max(
        edgePadding,
        targetTop - gap - tutorialBubbleHeight
      ),
    };
  })();

  const homeSpeech = [
    'Home page.',
    `${greeting}, ${userName}.`,
    displayedAlerts.length > 0
      ? [
          `${displayedAlerts.length} active alert${
            displayedAlerts.length === 1 ? '' : 's'
          }.`,
          ...displayedAlerts.map(
            (alert) =>
              `${alert.title}. Severity ${alert.severity}. ` +
              `${alert.message} ${alert.instruction}`
          ),
        ].join(' ')
      : alertLoading
      ? 'Official alerts are currently being checked.'
      : 'There are currently no active alerts.',
    `Your readiness level is ${readinessLevel}.`,
    `${completedGuides} out of ${totalGuides} guides completed.`,
    `You are ${progress} percent prepared.`,
    `${badges.filter((badge) => badge.earned).length} out of ${badges.length} badges earned.`,
    'Available actions are Checklist, Alert, Resources, Progress, and Emergency Help.',
  ].join(' ');

  return (
    <View
      ref={homeTutorialRootRef}
      collapsable={false}
      style={styles.homeTutorialRoot}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        setHomeViewport((previous) =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height }
        );
      }}
    >
      <ScrollView
        ref={homeScrollRef}
        contentContainerStyle={styles.screenContent}
        scrollEnabled={!tutorialActive}
        scrollEventThrottle={16}
        onScroll={(event) => {
          currentScrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
      >
      <View style={styles.topRow}>
        <View style={styles.greetingCard}>
          <Text style={styles.greetingText}>
            {greeting}, {userName}
          </Text>
        </View>

        <ReadButton
          text={homeSpeech}
          accessibilityLabel="Read the home page aloud"
        />
      </View>

      {demoAlertMode && (
        <View style={styles.demoModeBanner}>
          <Text style={styles.demoModeBannerText}>Demo Mode</Text>
          <Text style={styles.demoModeSubText}>
            Simulated alert information is being shown.
          </Text>
        </View>
      )}

      {!demoAlertMode && alertLoading && (
        <View style={styles.alertStatusCard}>
          <Text style={styles.alertTitle}>Checking Official Alerts</Text>
          <Text style={styles.alertText}>
            Please wait while the latest hazard information is loaded.
          </Text>
        </View>
      )}

      {!demoAlertMode && alertError && (
        <View style={styles.alertErrorCard}>
          <Text style={styles.alertErrorTitle}>Alert Service Notice</Text>
          <Text style={styles.alertText}>{alertError}</Text>
        </View>
      )}

      {!demoAlertMode && lastAlertUpdate && (
        <Text style={styles.lastUpdatedText}>
          Last checked:{' '}
          {lastAlertUpdate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}

      <View ref={alertTutorialRef} collapsable={false}>
        {!alertLoading && displayedAlerts.length > 0 ? (
          displayedAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertSeverity}>
              Severity: {alert.severity}
            </Text>
            <Text style={styles.alertText}>{alert.message}</Text>
            <Text style={styles.alertInstruction}>{alert.instruction}</Text>

            {alert.source && (
              <Text style={styles.alertSourceText}>
                Source: {alert.source}
              </Text>
            )}

            <View style={styles.alertActions}>
              {alert.guideId && (
                <TouchableOpacity
                  style={styles.alertActionButton}
                  onPress={() => onOpenAlertGuide(alert)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${alert.title} guide`}>
                  <Text style={styles.quickButtonText}>View Guide</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.alertActionButton}
                onPress={() => onOpenAlertChecklist(alert)}
                accessibilityRole="button"
                accessibilityLabel={`Open checklist for ${alert.title}`}>
                <Text style={styles.quickButtonText}>Open Checklist</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
        ) : !alertLoading ? (
          <View style={styles.noAlertCard}>
            <Text style={styles.alertTitle}>No Active Alerts</Text>
            <Text style={styles.alertText}>
              {demoAlertMode
                ? 'No demonstration alert has been selected.'
                : 'No current alerts were returned by the official services.'}
            </Text>
          </View>
        ) : null}
      </View>

      {!demoAlertMode && (
        <View style={styles.refreshAlertContainer}>
          <TouchableOpacity
            style={[
              styles.quickButtonWide,
              alertLoading && styles.disabledButton,
            ]}
            disabled={alertLoading}
            onPress={onRefreshAlerts}
            accessibilityRole="button"
            accessibilityLabel="Refresh official emergency alerts">
            <Text style={styles.quickButtonText}>
              {alertLoading ? 'Checking Alerts...' : 'Refresh Alerts'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        ref={readinessTutorialRef}
        collapsable={false}
        style={styles.readinessCard}
      >
        <Text style={styles.cardText}>Readiness Level: {readinessLevel}</Text>
        <Text style={styles.cardText}>Guide Learning Progress</Text>
        <Text style={styles.cardText}>
          {completedGuides}/{totalGuides} guides completed
        </Text>
        <Text style={styles.cardText}>{progress}% prepared</Text>
      </View>

      <View
        ref={badgesTutorialRef}
        collapsable={false}
        style={styles.homeBadgesCard}
      >
        <View style={styles.homeBadgesHeader}>
          <Text style={styles.homeBadgesTitle}>Badges</Text>
          <Text style={styles.homeBadgesCount}>
            {badges.filter((badge) => badge.earned).length}/{badges.length} earned
          </Text>
        </View>

        <View style={styles.homeBadgesGrid}>
          {badges.map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.homeBadgeItem,
                badge.earned && styles.homeBadgeItemEarned,
              ]}
            >
              <Text style={styles.homeBadgeSymbol}>
                {badge.earned ? '★' : '○'}
              </Text>
              <Text style={styles.homeBadgeTitle}>{badge.title}</Text>
              <Text style={styles.homeBadgeStatus}>
                {badge.earned ? 'Earned' : badge.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.quickGrid}>
        <TouchableOpacity
          ref={checklistTutorialRef}
          collapsable={false}
          style={styles.quickButton}
          onPress={onOpenChecklist}
        >
          <Text style={styles.quickButtonText}>Checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickButton,
            !activeAlert && styles.quickButtonDisabled,
          ]}
          disabled={!activeAlert}
          onPress={() => onOpenAlertGuide(activeAlert)}
          accessibilityRole="button"
          accessibilityLabel={
            activeAlert
              ? `Open current ${activeAlert.title}`
              : 'No active alerts'
          }>
          <Text style={styles.quickButtonText}>
            {displayedAlerts.length > 1
              ? `${displayedAlerts.length} Alerts`
              : activeAlert
              ? 'Alert'
              : 'No Alert'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          ref={resourcesTutorialRef}
          collapsable={false}
          style={styles.quickButton}
          onPress={onOpenResources}
        >
          <Text style={styles.quickButtonText}>Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          ref={progressTutorialRef}
          collapsable={false}
          style={styles.quickButton}
          onPress={onOpenProgress}
        >
          <Text style={styles.quickButtonText}>Progress</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        ref={emergencyTutorialRef}
        collapsable={false}
        style={styles.emergencyButton}
        onPress={onEmergencyCall}
        accessibilityRole="button"
        accessibilityLabel="Call Singapore emergency services at 995"
        accessibilityHint="Opens a confirmation before launching the phone dialler"
      >
        <Text style={styles.emergencyButtonText}>Emergency Help – Call 995</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetText}>Reset Prototype</Text>
      </TouchableOpacity>
      </ScrollView>

      {tutorialActive && tutorialTarget && currentTutorialStep && (
        <View style={styles.tutorialOverlayContainer} pointerEvents="box-none">
          <View
            style={[
              styles.tutorialDimPiece,
              {
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(tutorialTarget.y - 8, 0),
              },
            ]}
          />

          <View
            style={[
              styles.tutorialDimPiece,
              {
                top: Math.max(tutorialTarget.y - 8, 0),
                left: 0,
                width: Math.max(tutorialTarget.x - 8, 0),
                height: tutorialTarget.height + 16,
              },
            ]}
          />

          <View
            style={[
              styles.tutorialDimPiece,
              {
                top: Math.max(tutorialTarget.y - 8, 0),
                left:
                  tutorialTarget.x +
                  tutorialTarget.width +
                  8,
                right: 0,
                height: tutorialTarget.height + 16,
              },
            ]}
          />

          <View
            style={[
              styles.tutorialDimPiece,
              {
                top:
                  tutorialTarget.y +
                  tutorialTarget.height +
                  8,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.tutorialHighlightBorder,
              {
                top: Math.max(tutorialTarget.y - 6, 0),
                left: Math.max(tutorialTarget.x - 6, 0),
                width: tutorialTarget.width + 12,
                height: tutorialTarget.height + 12,
              },
            ]}
          />

          <View
            style={[styles.tutorialCoachCard, tutorialCoachPosition]}
            onLayout={(event) => {
              const measuredHeight = event.nativeEvent.layout.height;

              if (
                measuredHeight > 0 &&
                Math.abs(measuredHeight - tutorialBubbleHeight) > 1
              ) {
                setTutorialBubbleHeight(measuredHeight);
              }
            }}
          >
            <Text style={styles.tutorialCoachProgress}>
              Step {tutorialStep + 1} of {tutorialSteps.length}
            </Text>

            <View style={styles.tutorialCoachTitleRow}>
              <Text
                style={[
                  styles.tutorialCoachTitle,
                  styles.tutorialCoachTitleFlex,
                ]}
              >
                {currentTutorialStep.title}
              </Text>

              <ReadButton
                text={`${currentTutorialStep.title}. ${currentTutorialStep.text}`}
                accessibilityLabel={`Read the ${currentTutorialStep.title} tutorial explanation aloud`}
              />
            </View>

            <Text style={styles.tutorialCoachText}>
              {currentTutorialStep.text}
            </Text>

            <View style={styles.tutorialCoachActions}>
              {tutorialStep > 0 && (
                <TouchableOpacity
                  style={styles.tutorialBackButton}
                  onPress={onTutorialBack}
                  accessibilityRole="button"
                  accessibilityLabel="Previous tutorial step"
                >
                  <Text style={styles.tutorialBackButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.tutorialNextButton}
                onPress={
                  isLastTutorialStep
                    ? onTutorialOpenHazeGuide
                    : onTutorialNext
                }
                accessibilityRole="button"
                accessibilityLabel={
                  isLastTutorialStep
                    ? 'Open the Haze Guide'
                    : 'Next tutorial step'
                }
              >
                <Text style={styles.quickButtonText}>
                  {isLastTutorialStep ? 'Try Haze Guide' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.tutorialSkipButton}
              onPress={onTutorialSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
            >
              <Text style={styles.tutorialSkipText}>Skip Tutorial</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function ChecklistSelectionScreen({ checklists, onOpenChecklist, onAddNew }) {
  const { styles } = useAppTheme();

  const checklistSpeech = [
    'Checklist selection page.',
    `${checklists.length} checklists are available.`,
    ...checklists.map(
      (checklist) =>
        `${checklist.title}. ${checklist.type} checklist with ${checklist.items.length} items.`
    ),
    'Select a checklist or choose Add New to create one.',
  ].join(' ');
  return (
    <View style={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>Checklist Selection</Text>
        </View>

        <ReadButton
          text={checklistSpeech}
          accessibilityLabel="Read the checklist selection page aloud"
        />
      </View>

      <FlatList
        data={checklists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => onOpenChecklist(item.id)}>
            <Text style={styles.selectionText}>{item.title}</Text>
            <Text style={styles.selectionSubText}>
              {item.type} • {item.items.length} items
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity style={styles.selectionButton} onPress={onAddNew}>
        <Text style={styles.selectionText}>Add New</Text>
      </TouchableOpacity>
    </View>
  );
}

function ChecklistDetailScreen({
  checklist,
  onBack,
  onToggleItem,
  newItemText,
  setNewItemText,
  onAddItem,
  onDeleteItem,
  onDeleteChecklist,
}) {
  const { styles, theme } = useAppTheme();
  const completed = checklist.items.filter((item) => item.done).length;
  const checklistSpeech = [
    `${checklist.title} checklist.`,
    `${completed} out of ${checklist.items.length} items completed.`,
    'Tick these items during an alert or emergency.',
    ...checklist.items.map(
      (item, index) =>
        `Item ${index + 1}. ${item.text}. ${
          item.done ? 'Completed.' : 'Not completed.'
        }`
    ),
  ].join(' ');

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>{checklist.title}</Text>
        </View>

        <ReadButton
          text={checklistSpeech}
          accessibilityLabel={`Read the ${checklist.title} checklist aloud`}
        />
      </View>

      <View style={styles.readinessCard}>
        <Text style={styles.cardText}>
          {completed}/{checklist.items.length} completed
        </Text>
        <Text style={styles.smallText}>
          Tick items during an alert or emergency.
        </Text>
      </View>

      {checklist.items.map((item) => {
        const canDeleteItem =
          checklist.type === 'Custom' ||
          item.id.startsWith('added-') ||
          item.id.startsWith('item-');

        return (
          <View key={item.id} style={styles.checkItem}>
            <TouchableOpacity
              style={styles.checkItemMain}
              onPress={() => onToggleItem(item.id)}
              accessibilityRole="checkbox"
              accessibilityLabel={item.text}
              accessibilityState={{ checked: item.done }}
            >
              <Text style={styles.checkbox}>{item.done ? '☑' : '☐'}</Text>
              <Text style={styles.checkText}>{item.text}</Text>
            </TouchableOpacity>

            {canDeleteItem && (
              <TouchableOpacity
                style={styles.removeItemButton}
                onPress={() => onDeleteItem(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.text} from checklist`}
              >
                <Text style={styles.removeItemButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={styles.addItemCard}>
        <Text style={styles.cardText}>Add item to this checklist</Text>

        <TextInput
          style={styles.input}
          placeholder="Example: Bring inhaler"
          placeholderTextColor={theme.secondaryTextColor}
          value={newItemText}
          onChangeText={setNewItemText}
        />

        <TouchableOpacity style={styles.quickButtonWide} onPress={onAddItem}>
          <Text style={styles.quickButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>

      {checklist.type === 'Custom' && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDeleteChecklist}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${checklist.title} checklist`}
        >
          <Text style={styles.deleteButtonText}>Delete Checklist</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function ResourcesScreen({ guides, onOpenGuide, badges, guideProgress }) {
  const { styles } = useAppTheme();
  const resourceSpeech = [
    'Resources page.',
    `${guides.length} guides are available.`,
    ...guides.map((guide) => {
      const completed = guideProgress?.[guide.id]?.completed === true;

      return `${guide.title}. ${guide.description}. ${
        completed ? 'Completed.' : 'Not completed.'
      }`;
    }),
  ].join(' ');
  return (
    <View style={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>Resources</Text>
        </View>

        <ReadButton
          text={resourceSpeech}
          accessibilityLabel="Read the resources page aloud"
        />
      </View>

      {guides.map((guide) => {
        const progressData = guideProgress[guide.id];

        const completed = progressData?.completed === true;

        const guideBadge = badges.find((badge) => badge.id === guide.badgeId);

        return (
          <TouchableOpacity
            key={guide.id}
            style={styles.resourceCard}
            onPress={() => onOpenGuide(guide.id)}>
            <Text style={styles.cardText}>{guide.title}</Text>
            <Text style={styles.smallText}>{guide.description}</Text>

            <View
              style={[
                styles.guideStatusBox,
                completed && styles.guideStatusBoxCompleted,
              ]}>
              <Text style={styles.guideStatusText}>
                {completed ? 'Completed' : 'Not Completed'}
              </Text>
            </View>

            {progressData?.attempts > 0 && (
              <Text style={styles.smallText}>
                Best score: {progressData.bestScore}/{guide.questions.length}
              </Text>
            )}

            {guideBadge?.earned && (
              <Text style={styles.smallText}>
                Badge earned: {guideBadge.title}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function GuideInfoScreen({ guide, onBack, onStartTest, onOpenChecklist }) {
  const { styles } = useAppTheme();
  const [showMore, setShowMore] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    setShowMore(false);
    setExpandedImage(null);

    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [guide.id]);

  function closeExpandedImage() {
    scale.value = 1;
    savedScale.value = 1;

    translateX.value = 0;
    translateY.value = 0;

    savedTranslateX.value = 0;
    savedTranslateY.value = 0;

    setExpandedImage(null);
  }

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = savedScale.value * event.scale;

      scale.value = Math.min(Math.max(nextScale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;

        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
        return;
      }

      translateX.value =
        savedTranslateX.value + event.translationX;

      translateY.value =
        savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;

        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }

      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const combinedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
      {
        translateY: translateY.value,
      },
      {
        scale: scale.value,
      },
    ],
  }));

  async function openOfficialSource() {
    if (!guide.moreInfoUrl) return;

    try {
      const supported = await Linking.canOpenURL(guide.moreInfoUrl);

      if (!supported) {
        Alert.alert(
          'Link Unavailable',
          'The official information page could not be opened on this device.'
        );
        return;
      }

      await Linking.openURL(guide.moreInfoUrl);
    } catch (error) {
      console.log('Failed to open guide source', error);

      Alert.alert(
        'Link Unavailable',
        'The official information page could not be opened.'
      );
    }
  }

  const spokenGuideText = [
    `${guide.title}.`,
    'Guide information.',
    guide.content,
    showMore && guide.moreContent ? guide.moreContent : '',
    'You can test your knowledge or open the related checklist.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.topRow}>
          <View style={styles.headerBox}>
            <Text style={styles.headerText}>{guide.title}</Text>
          </View>

          <ReadButton
            text={spokenGuideText}
            accessibilityLabel={`Read the ${guide.title} aloud`}
          />
        </View>

        <View style={styles.resourceCard}>
          <Text style={styles.cardText}>Essential Actions</Text>

          {guide.images?.map((imageSource, index) => (
            <TouchableOpacity
              key={`${guide.id}-image-${index}`}
              style={styles.guideImageButton}
              onPress={() => {
                scale.value = 1;
                savedScale.value = 1;

                translateX.value = 0;
                translateY.value = 0;

                savedTranslateX.value = 0;
                savedTranslateY.value = 0;

                setExpandedImage(imageSource);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Enlarge ${guide.title} safety information image ${index + 1}`}
              accessibilityHint="Opens the image in a larger full-screen view"
            >
              <Image
                source={imageSource}
                style={styles.guideImage}
                resizeMode="contain"
                accessibilityRole="image"
                accessibilityLabel={`${guide.title} safety information image ${index + 1}`}
              />

              <Text style={styles.enlargeImageText}>
                Tap image to enlarge
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.guideText}>
            {guide.content}
          </Text>

          {/* Show the middle image only after More Information is pressed */}
          {showMore && guide.midImage && (
            <TouchableOpacity
              style={styles.guideImageButton}
              onPress={() => {
                scale.value = 1;
                savedScale.value = 1;

                translateX.value = 0;
                translateY.value = 0;

                savedTranslateX.value = 0;
                savedTranslateY.value = 0;

                setExpandedImage(guide.midImage);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Enlarge ${guide.title} instruction image`}
              accessibilityHint="Opens the image in a larger full-screen view"
            >
              <Image
                source={guide.midImage}
                style={styles.guideImage}
                resizeMode="contain"
                accessibilityRole="image"
                accessibilityLabel={`${guide.title} instruction image`}
              />

              <Text style={styles.enlargeImageText}>
                Tap image to enlarge
              </Text>
            </TouchableOpacity>
          )}

          {/* Second paragraph */}
          {showMore && guide.moreContent && (
            <Text style={styles.guideMoreText}>
              {guide.moreContent}
            </Text>
          )}

          {guide.moreContent && (
            <TouchableOpacity
              style={styles.moreInfoButton}
              onPress={() =>
                setShowMore((previous) => !previous)
              }
              accessibilityRole="button"
              accessibilityLabel={
                showMore
                  ? 'Hide additional guide information'
                  : 'Show additional guide information'
              }
            >
              <Text style={styles.moreInfoButtonText}>
                {showMore ? 'Show Less' : 'More Information'}
              </Text>
            </TouchableOpacity>
          )}

          {guide.moreInfoUrl && (
            <TouchableOpacity
              style={styles.officialSourceButton}
              onPress={openOfficialSource}
              accessibilityRole="link"
              accessibilityLabel={`Open official ${guide.title} information`}
            >
              <Text style={styles.officialSourceButtonText}>
                More Information – Official Source
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.quickButtonWide}
          onPress={onStartTest}
          accessibilityRole="button"
          accessibilityLabel={`Open the ${guide.title} test`}
        >
          <Text style={styles.quickButtonText}>
            Test Your Knowledge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onOpenChecklist}
          accessibilityRole="button"
          accessibilityLabel={`Open the ${guide.title} checklist`}
        >
          <Text style={styles.secondaryButtonText}>
            Open Related Checklist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onBack}
        >
          <Text style={styles.secondaryButtonText}>
            Back to Resources
          </Text>
        </TouchableOpacity>
      </ScrollView>

    <Modal
      visible={expandedImage !== null}
      transparent
      animationType="fade"
      onRequestClose={closeExpandedImage}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={closeExpandedImage}
            accessibilityRole="button"
            accessibilityLabel="Close enlarged image"
          >
            <Text style={styles.imageViewerCloseText}>
              Close
            </Text>
          </TouchableOpacity>

          {expandedImage && (
            <GestureDetector gesture={combinedGesture}>
              <Animated.View style={{ width: '95%', height: '80%' }}>
                <Animated.Image
                  source={expandedImage}
                  style={[
                    styles.imageViewerImage,
                    animatedImageStyle,
                  ]}
                  resizeMode="contain"
                  accessibilityRole="image"
                  accessibilityLabel={`Enlarged ${guide.title} safety information`}
                />
              </Animated.View>
            </GestureDetector>
          )}

          <Text style={styles.imageViewerHint}>
            Pinch to zoom and drag to move
          </Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
    </>
  );
}

function GuideTestScreen({
  guide,
  quizAnswers,
  validationAttempted,
  onSelectAnswer,
  onSubmit,
  onBack,
}) {
  const { styles } = useAppTheme();
  const answeredCount = guide.questions.filter(
    (question) => quizAnswers[question.id]
  ).length;
  const allAnswered = answeredCount === guide.questions.length;
  const quizSpeech = [
    `${guide.title} test.`,
    `${guide.questions.length} questions.`,
    ...guide.questions.flatMap((question, questionIndex) => [
      `Question ${questionIndex + 1}. ${question.question}`,
      ...question.options.map(
        (option, optionIndex) => `Option ${optionIndex + 1}. ${option}.`
      ),
    ]),
  ].join(' ');
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>{guide.title} Test</Text>
        </View>

        <ReadButton
          text={quizSpeech}
          accessibilityLabel={`Read the ${guide.title} test aloud`}
        />
      </View>

      {guide.questions.map((question) => {
        const unanswered = validationAttempted && !quizAnswers[question.id];

        return (
          <View
            key={question.id}
            style={[styles.quizCard, unanswered && styles.quizCardError]}>
            <Text style={styles.quizQuestion}>{question.question}</Text>

            {unanswered && (
              <Text style={styles.validationText}>
                Please select an answer.
              </Text>
            )}

            {question.options.map((option) => {
              const selected = quizAnswers[question.id] === option;

              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.answerButton,
                    selected && styles.answerButtonSelected,
                  ]}
                  onPress={() => onSelectAnswer(question.id, option)}>
                  <Text style={styles.answerText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.quickButtonWide, !allAnswered && styles.disabledButton]}
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel={
          allAnswered
            ? 'Submit completed test'
            : `${guide.questions.length - answeredCount} questions unanswered`
        }
>
        <Text style={styles.quickButtonText}>
          {allAnswered
            ? 'Submit Test'
            : `Answer All Questions (${answeredCount}/${guide.questions.length})`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Back to Guide</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProgressScreen({
  progress,
  completedGuides,
  totalGuides,
  readinessLevel,
  badges,
  guides,
  guideProgress,
}) {
  const { styles } = useAppTheme();
  const earnedBadges = badges.filter((badge) => badge.earned);
  const progSpeech = [
    'Progress page.',
    `Your readiness level is ${readinessLevel}.`,
    `${completedGuides} out of ${totalGuides} guides completed.`,
    `Overall progress is ${progress} percent.`,
    earnedBadges.length === 0
      ? 'No badges have been earned yet.'
      : `${earnedBadges.length} badges earned. ${earnedBadges
          .map((badge) => badge.title)
          .join(', ')}.`,
  ].join(' ');

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>Progress</Text>
        </View>

        <ReadButton
          text={progSpeech}
          accessibilityLabel={'Read progress information aloud'}
        />
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.cardText}>Readiness Level:</Text>
        <Text style={styles.cardText}>{readinessLevel}</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.cardText}>Guide Progress:</Text>
        <Text style={styles.cardText}>
          {completedGuides}/{totalGuides} guides completed
        </Text>
        <Text style={styles.cardText}>{progress}% prepared</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.cardText}>Guide Completion</Text>

        {guides.map((guide) => {
          const progressData = guideProgress[guide.id];

          const completed = progressData?.completed === true;

          return (
            <View key={guide.id} style={styles.guideProgressRow}>
              <View style={styles.guideProgressText}>
                <Text style={styles.badgeTitle}>{guide.title}</Text>

                <Text style={styles.smallText}>
                  {completed ? 'Completed' : 'Not completed'}
                </Text>

                {progressData?.attempts > 0 && (
                  <Text style={styles.smallText}>
                    Best score: {progressData.bestScore}/
                    {guide.questions.length}
                  </Text>
                )}
              </View>

              <Text style={styles.completionSymbol}>
                {completed ? '✓' : '○'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.cardText}>{progress}% complete</Text>

      <View style={styles.progressCard}>
        <Text style={styles.cardText}>Badge Collection</Text>
        <Text style={styles.smallText}>
          {earnedBadges.length}/{badges.length} badges earned
        </Text>

        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[
              styles.badgeBox,
              badge.earned && styles.badgeBoxEarned,
            ]}
          >
            <Text style={styles.badgeTitle}>
              {badge.earned ? '★ ' : '○ '}
              {badge.title}
            </Text>
            <Text style={styles.smallText}>
              {badge.earned ? 'Earned' : badge.description}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function TestResultScreen({
  guide,
  result,
  badges,
  onViewProgress,
  onOpenChecklist,
  nextGuide,
  onOpenNextGuide,
  onReviewGuide,
  onTryAgain,
  onBackResources,
}) {
  const { styles } = useAppTheme();
  const earnedBadge = badges.find((badge) => badge.id === guide.badgeId);
  const testResSpeech = [
    'Test result.',
    `You scored ${result.score} out of ${result.total}.`,
    result.passed
      ? 'You passed the test.'
      : 'You did not pass. Review the guide and try again.',
    result.passed && earnedBadge ? `You earned the ${earnedBadge.title}.` : '',
  ].join(' ');

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>Test Result</Text>
        </View>

        <ReadButton
          text={testResSpeech}
          accessibilityLabel={'Read the test result aloud'}
        />
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>
          You scored {result.score}/{result.total}
        </Text>

        <Text style={styles.resultStatus}>
          {result.passed ? 'Result: Passed' : 'Result: Try Again'}
        </Text>

        <Text style={styles.smallText}>
          {result.passed
            ? 'Good job. You have completed this guide test.'
            : 'Please review the guide and try the test again.'}
        </Text>
      </View>

      {result.passed && earnedBadge && (
        <View style={styles.resultCard}>
          <Text style={styles.cardText}>Badge Earned</Text>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeTitle}>{earnedBadge.title}</Text>
            <Text style={styles.smallText}>{earnedBadge.description}</Text>
          </View>
        </View>
      )}

      {result.passed ? (
        <>
          <TouchableOpacity
            style={styles.quickButtonWide}
            onPress={onViewProgress}>
            <Text style={styles.quickButtonText}>View Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onOpenChecklist}>
            <Text style={styles.secondaryButtonText}>Open Related Checklist</Text>
          </TouchableOpacity>

          {nextGuide && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onOpenNextGuide}>
              <Text style={styles.secondaryButtonText}>
                Continue to {nextGuide.title}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onBackResources}>
            <Text style={styles.secondaryButtonText}>Back to Resources</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={styles.quickButtonWide}
            onPress={onReviewGuide}>
            <Text style={styles.quickButtonText}>Review Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onTryAgain}>
            <Text style={styles.secondaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function SettingsScreen({
  settings,
  onUpdateSetting,
  userName,
  onUpdateName,
  onReplayTutorial,
}) {
  const [editedName, setEditedName] = useState(userName);
  const { styles, theme } = useAppTheme();
  const settingsSpeech = [
    'Settings page.',
    `Text to speech is ${settings.textToSpeech ? 'enabled' : 'disabled'}.`,
    `High contrast is ${settings.highContrast ? 'enabled' : 'disabled'}.`,
    `Large text is ${settings.largeText ? 'enabled' : 'disabled'}.`,
    `Notifications are ${settings.notifications ? 'enabled' : 'disabled'}.`,
    'A Replay Tutorial option is available in Settings.',
    `Demo alert mode is ${settings.demoAlertMode ? "enabled" : "disabled"}.`,
    settings.demoAlertMode
      ? `The selected demo alert is ${
          settings.demoAlertType === "none"
            ? "no active alert"
            : settings.demoAlertType === "heatwave"
            ? "heat stress"
            : settings.demoAlertType
        }.`
      : "The application is using live official alert data.",
  ].join(' ');

  

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>Settings</Text>
        </View>
        <ReadButton
          text={settingsSpeech}
          accessibilityLabel={'Read settings aloud'}
        />
      </View>

      <View style={styles.settingRowVertical}>
        <Text style={styles.settingLabel}>Display Name</Text>

        <TextInput
          style={styles.input}
          value={editedName}
          onChangeText={setEditedName}
          placeholder="Enter your display name"
          placeholderTextColor={theme.secondaryTextColor}
          maxLength={30}
          autoCapitalize="words"
          accessibilityLabel="Change display name"
        />

        <TouchableOpacity
          style={styles.quickButtonWide}
          onPress={() => onUpdateName(editedName)}>
          <Text style={styles.quickButtonText}>Save Name</Text>
        </TouchableOpacity>
      </View>

      <SettingRow
        label="Text-to-speech"
        description="Show Read buttons that speak page information aloud."
        value={settings.textToSpeech}
        onValueChange={(value) => onUpdateSetting('textToSpeech', value)}
      />

      <SettingRow
        label="High Contrast"
        description="Use stronger colours and borders."
        value={settings.highContrast}
        onValueChange={(value) => onUpdateSetting('highContrast', value)}
      />

      <SettingRow
        label="Large Text"
        description="Increase text size across the app."
        value={settings.largeText}
        onValueChange={(value) => onUpdateSetting('largeText', value)}
      />

      <SettingRow
        label="Notifications"
        description="Allow emergency alert notifications."
        value={settings.notifications}
        onValueChange={(value) => onUpdateSetting('notifications', value)}
      />

      <View style={styles.settingRowVertical}>
        <Text style={styles.settingLabel}>Help</Text>
        <Text style={styles.settingDescription}>
          Replay the introductory tutorial and practise the Haze Guide flow again.
        </Text>

        <TouchableOpacity
          style={styles.quickButtonWide}
          onPress={onReplayTutorial}
          accessibilityRole="button"
          accessibilityLabel="Replay app tutorial">
          <Text style={styles.quickButtonText}>Replay Tutorial</Text>
        </TouchableOpacity>
      </View>

      <SettingRow
  label="Demo Alert Mode"
  description="Use simulated alerts instead of live official alert data."
  value={settings.demoAlertMode}
  onValueChange={(value) =>
    onUpdateSetting("demoAlertMode", value)
  }
/>

    {settings.demoAlertMode && (
      <View style={styles.demoAlertSettingsCard}>
        <Text style={styles.settingLabel}>
          Select Demo Alert
        </Text>

        <Text style={styles.settingDescription}>
          Choose which simulated alert appears on the Home page.
        </Text>

        <DemoAlertOption
          label="Haze Alert"
          value="haze"
          selectedValue={settings.demoAlertType}
          onSelect={(value) =>
            onUpdateSetting("demoAlertType", value)
          }
        />

        <DemoAlertOption
          label="Flood Alert"
          value="flood"
          selectedValue={settings.demoAlertType}
          onSelect={(value) =>
            onUpdateSetting("demoAlertType", value)
          }
        />

        <DemoAlertOption
          label="Heat Stress Alert"
          value="heatwave"
          selectedValue={settings.demoAlertType}
          onSelect={(value) =>
            onUpdateSetting("demoAlertType", value)
          }
        />

        <DemoAlertOption
          label="No Active Alert"
          value="none"
          selectedValue={settings.demoAlertType}
          onSelect={(value) =>
            onUpdateSetting("demoAlertType", value)
          }
        />
      </View>
    )}
    </ScrollView>
  );
}

function FirstTimeSetupScreen({ name, onChangeName, onContinue }) {
  const { styles, settings, theme } = useAppTheme();

  const setupSpeech = [
    'Welcome to the disaster preparedness application.',
    'This application provides disaster guides, checklists, alerts, and learning progress.',
    'Please enter your name to begin.',
    'Your name will only be stored on this device.',
  ].join(' ');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.setupScreenContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.setupHeaderRow}>
          <View style={styles.setupHeaderBox}>
            <Text style={styles.setupTitle}>Welcome</Text>
          </View>

          {settings.textToSpeech && (
            <ReadButton
              text={setupSpeech}
              accessibilityLabel="Read the welcome page aloud"
            />
          )}
        </View>

        <View style={styles.setupCard}>
          <Text style={styles.setupHeading}>Disaster Preparedness</Text>

          <Text style={styles.setupDescription}>
            This app helps you learn about emergencies, prepare checklists and
            track your readiness.
          </Text>
        </View>

        <View style={styles.setupCard}>
          <Text style={styles.label}>What should we call you?</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={onChangeName}
            placeholder="Enter your name"
            placeholderTextColor={theme.secondaryTextColor}
            maxLength={30}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onContinue}
            accessibilityLabel="Enter your name"
            accessibilityHint="Your name will be stored on this device"
          />

          <Text style={styles.setupPrivacyText}>
            Your name is stored locally on this device and is not sent to an
            online account.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.quickButtonWide}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Complete setup and continue to the home page">
          <Text style={styles.quickButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, description, value, onValueChange }) {
  const { styles, theme } = useAppTheme();
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingLabel}>{label}</Text>

        <Text style={styles.settingDescription}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.switchTrackOff,
          true: theme.primaryColor,
        }}
        thumbColor={value ? theme.primaryTextColor : '#FFFFFF'}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

function DemoAlertOption({
  label,
  value,
  selectedValue,
  onSelect,
}) {
  const { styles } = useAppTheme();

  const selected = selectedValue === value;

  return (
    <TouchableOpacity
      style={[
        styles.demoAlertOption,
        selected && styles.demoAlertOptionSelected,
      ]}
      onPress={() => onSelect(value)}
      accessibilityRole="radio"
      accessibilityLabel={`${label} demo alert`}
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          styles.demoAlertOptionText,
          selected && styles.demoAlertOptionTextSelected,
        ]}
      >
        {selected ? "● " : "○ "}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BottomNav({ currentScreen, setScreen }) {
  const { styles } = useAppTheme();
  const items = [
    { key: 'home', label: 'Home' },
    { key: 'selection', label: 'List' },
    { key: 'resources', label: 'Info' },
    { key: 'settings', label: 'Set' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active =
          currentScreen === item.key ||
          (item.key === 'selection' && currentScreen === 'detail');

        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => setScreen(item.key)}>
            <Text style={[styles.navText, active && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CreateChecklistModal({
  visible,
  onClose,
  checklistName,
  setChecklistName,
  checklistItems,
  setChecklistItems,
  onCreate,
}) {
  const { styles, theme } = useAppTheme();
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.modalTitle}>Create New Checklist</Text>

          <Text style={styles.label}>Checklist Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Medication Checklist"
            placeholderTextColor={theme.secondaryTextColor}
            value={checklistName}
            onChangeText={setChecklistName}
          />

          <Text style={styles.label}>Checklist Items</Text>
          <Text style={styles.smallText}>Enter one item per line.</Text>

          <TextInput
            style={[styles.input, styles.largeInput]}
            placeholder={'Bring inhaler\nPack medication\nCall daughter'}
            placeholderTextColor={theme.secondaryTextColor}
            value={checklistItems}
            onChangeText={setChecklistItems}
            multiline
          />

          <TouchableOpacity style={styles.quickButtonWide} onPress={onCreate}>
            <Text style={styles.quickButtonText}>Save Checklist</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },

    appFrame: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },

    screenContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 95,
      backgroundColor: theme.backgroundColor,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },

    greetingCard: {
      flex: 1,
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },

    greetingText: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
    },

    speakerButton: {
      width: 54,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },

    speakerText: {
      fontSize: theme.smallTextSize - 1,
      color: theme.primaryTextColor,
      fontWeight: '700',
    },

    alertCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      marginBottom: 16,
    },

    alertTitle: {
      fontSize: theme.headingTextSize + 2,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 6,
    },

    alertText: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      textAlign: 'center',
      lineHeight: 26,
    },

    readinessCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      marginBottom: 16,
    },

    cardText: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      textAlign: 'center',
      lineHeight: 27,
    },

    smallText: {
      fontSize: theme.smallTextSize,
      color: theme.secondaryTextColor,
      textAlign: 'center',
      lineHeight: 22,
    },

    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },

    quickButton: {
      width: '48%',
      backgroundColor: theme.primaryColor,
      borderRadius: 22,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 10,
    },

    quickButtonWide: {
      backgroundColor: theme.primaryColor,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 6,
    },

    quickButtonText: {
      color: theme.primaryTextColor,
      fontSize: theme.smallTextSize + 1,
      fontWeight: '700',
    },

    emergencyButton: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      marginBottom: 14,
    },

    emergencyButtonText: {
      fontSize: theme.normalTextSize - 1,
      color: theme.textColor,
    },

    resetButton: {
      alignItems: 'center',
      marginTop: 8,
    },

    resetText: {
      fontSize: theme.smallTextSize - 1,
      color: theme.secondaryTextColor,
    },

    headerBox: {
      flex: 1,
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      alignItems: 'center',
    },

    headerText: {
      fontSize: theme.headingTextSize,
      color: theme.textColor,
      fontWeight: '600',
    },

    selectionButton: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginBottom: 16,
    },

    selectionText: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      textAlign: 'center',
    },

    selectionSubText: {
      fontSize: theme.smallTextSize - 1,
      color: theme.secondaryTextColor,
      marginTop: 4,
    },

    checkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },

    checkItemMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },

    removeItemButton: {
      borderWidth: 1,
      borderColor: theme.errorColor,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginLeft: 8,
    },

    removeItemButtonText: {
      color: theme.errorColor,
      fontSize: theme.smallTextSize,
      fontWeight: '700',
    },

    checkbox: {
      fontSize: 28,
      marginRight: 14,
      color: theme.textColor,
    },

    checkText: {
      flex: 1,
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      lineHeight: 26,
    },

    addItemCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 16,
      marginTop: 8,
      marginBottom: 12,
    },

    input: {
      backgroundColor: theme.inputColor,
      color: theme.textColor,
      borderRadius: 10,
      padding: 14,
      fontSize: theme.normalTextSize - 1,
      borderWidth: 1,
      borderColor: theme.inputBorderColor,
      marginTop: 10,
      marginBottom: 10,
    },

    largeInput: {
      height: 150,
      textAlignVertical: 'top',
    },

    label: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      fontWeight: '700',
      marginTop: 12,
    },

    secondaryButton: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 10,
    },

    secondaryButtonText: {
      fontSize: theme.normalTextSize - 1,
      color: theme.textColor,
    },

    deleteButton: {
      borderWidth: 1,
      borderColor: theme.errorColor,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 18,
    },

    deleteButtonText: {
      fontSize: theme.normalTextSize - 1,
      color: theme.errorColor,
      fontWeight: '700',
    },

    progressCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 22,
      alignItems: 'center',
      marginBottom: 24,
    },

    badgeBox: {
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
      width: '100%',
    },

    badgeBoxEarned: {
      backgroundColor: theme.selectedColor,
      borderColor: theme.primaryColor,
    },

    homeBadgesCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
    },

    homeBadgesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    homeBadgesTitle: {
      fontSize: theme.headingTextSize,
      color: theme.textColor,
      fontWeight: '700',
    },

    homeBadgesCount: {
      fontSize: theme.smallTextSize,
      color: theme.secondaryTextColor,
      fontWeight: '700',
    },

    homeBadgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    homeBadgeItem: {
      width: '48%',
      minHeight: 116,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },

    homeBadgeItemEarned: {
      backgroundColor: theme.selectedColor,
      borderColor: theme.primaryColor,
      borderWidth: 2,
    },

    homeBadgeSymbol: {
      fontSize: theme.headingTextSize + 6,
      color: theme.primaryColor,
      fontWeight: '700',
      marginBottom: 4,
    },

    homeBadgeTitle: {
      fontSize: theme.smallTextSize,
      color: theme.textColor,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
    },

    homeBadgeStatus: {
      fontSize: Math.max(theme.smallTextSize - 2, 11),
      color: theme.secondaryTextColor,
      textAlign: 'center',
      lineHeight: theme.smallTextSize + 3,
    },

    badgeTitle: {
      fontSize: theme.normalTextSize - 1,
      fontWeight: '700',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 4,
    },

    badgePopupOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },

    badgePopupCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.cardColor,
      borderWidth: 2,
      borderColor: theme.primaryColor,
      borderRadius: 18,
      padding: 26,
      alignItems: 'center',
    },

    badgePopupSymbol: {
      fontSize: 54,
      color: theme.primaryColor,
      marginBottom: 8,
    },

    badgePopupHeading: {
      fontSize: theme.headingTextSize + 3,
      color: theme.textColor,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 12,
    },

    badgePopupTitle: {
      fontSize: theme.normalTextSize + 1,
      color: theme.textColor,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },

    badgePopupDescription: {
      fontSize: theme.smallTextSize,
      color: theme.secondaryTextColor,
      textAlign: 'center',
      lineHeight: theme.smallTextSize + 7,
      marginBottom: 20,
    },

    badgePopupButton: {
      width: '100%',
      backgroundColor: theme.primaryColor,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },

    settingsDescription: {
      fontSize: theme.smallTextSize + 1,
      color: theme.secondaryTextColor,
      lineHeight: 23,
      marginBottom: 20,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginBottom: 16,
    },

    settingTextContainer: {
      flex: 1,
      paddingRight: 14,
    },

    settingLabel: {
      fontSize: theme.normalTextSize,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 5,
    },

    settingDescription: {
      fontSize: theme.smallTextSize,
      color: theme.secondaryTextColor,
      lineHeight: 21,
    },

    modalTitle: {
      fontSize: theme.headingTextSize + 6,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 20,
    },

    bottomNav: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 76,
      backgroundColor: theme.cardColor,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 10,
    },

    navItem: {
      minWidth: 58,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    navItemActive: {
      backgroundColor: theme.selectedColor,
    },

    navText: {
      fontSize: theme.smallTextSize,
      color: theme.textColor,
      fontWeight: '700',
    },
    resourceCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      marginBottom: 16,
    },

    guideText: {
      fontSize: theme.normalTextSize - 1,
      color: theme.textColor,
      lineHeight: 27,
      textAlign: 'left',
      marginTop: 12,
    },

    guideMoreText: {
      fontSize: theme.normalTextSize - 1,
      color: theme.textColor,
      lineHeight: 27,
      textAlign: 'left',
      marginTop: 14,
    },

    guideImageButton: {
      width: '100%',
      marginTop: 14,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      overflow: 'hidden',
    },

    guideImage: {
      width: '100%',
      height: 260,
      backgroundColor: theme.backgroundColor,
    },

    enlargeImageText: {
      fontSize: theme.smallTextSize,
      color: theme.primaryColor,
      fontWeight: '700',
      paddingVertical: 10,
      textAlign: 'center',
    },

    imageViewerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.96)',
      paddingTop: 54,
      paddingBottom: 28,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    imageViewerImage: {
      width: '100%',
      height: '100%',
      flex: 1,
    },

    imageViewerCloseButton: {
      position: 'absolute',
      top: 18,
      right: 18,
      zIndex: 10,
      backgroundColor: theme.primaryColor,
      borderRadius: 18,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },

    imageViewerCloseText: {
      color: theme.primaryTextColor,
      fontSize: theme.smallTextSize + 1,
      fontWeight: '700',
    },

    imageViewerHint: {
      color: '#FFFFFF',
      fontSize: theme.smallTextSize,
      textAlign: 'center',
      marginTop: 8,
    },

    moreInfoButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.primaryColor,
      borderRadius: 10,
      alignSelf: 'stretch',
      alignItems: 'center',
    },

    moreInfoButtonText: {
      color: theme.primaryColor,
      fontSize: theme.smallTextSize + 1,
      fontWeight: '700',
    },

    officialSourceButton: {
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.primaryColor,
      borderRadius: 10,
      alignSelf: 'stretch',
      alignItems: 'center',
    },

    officialSourceButtonText: {
      color: theme.primaryTextColor,
      fontSize: theme.smallTextSize + 1,
      fontWeight: '700',
      textAlign: 'center',
    },

    quizCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 18,
      marginBottom: 16,
    },

    quizCardError: {
      borderWidth: 2,
      borderColor: theme.errorColor,
    },

    validationText: {
      fontSize: theme.smallTextSize,
      color: theme.errorColor,
      fontWeight: '700',
      marginBottom: 12,
    },

    quizQuestion: {
      fontSize: theme.normalTextSize,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 12,
      lineHeight: 26,
    },

    quizProgressCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
    },

    progressBarBackground: {
      width: '100%',
      height: 14,
      backgroundColor: theme.inputColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 7,
      overflow: 'hidden',
      marginVertical: 14,
    },

    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primaryColor,
      borderRadius: 7,
    },

    guideProgressRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.inputColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 14,
      marginTop: 12,
    },

    guideProgressText: {
      flex: 1,
      paddingRight: 12,
    },

    completionSymbol: {
      fontSize: theme.headingTextSize,
      color: theme.primaryColor,
      fontWeight: '700',
    },

    disabledButton: {
      opacity: 0.55,
    },

    answerButton: {
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.inputBorderColor,
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
    },

    answerButtonSelected: {
      backgroundColor: theme.selectedColor,
      borderColor: theme.primaryColor,
    },

    answerText: {
      fontSize: theme.normalTextSize - 1,
      color: theme.textColor,
    },
    resultCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 22,
      alignItems: 'center',
      marginBottom: 18,
    },

    resultTitle: {
      fontSize: theme.headingTextSize + 4,
      fontWeight: '700',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 10,
    },

    resultStatus: {
      fontSize: theme.headingTextSize,
      fontWeight: '700',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 10,
    },
    guideStatusBox: {
      marginTop: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.inputBorderColor,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },

    guideStatusBoxCompleted: {
      backgroundColor: theme.selectedColor,
      borderColor: theme.primaryColor,
    },

    guideStatusText: {
      fontSize: theme.smallTextSize,
      fontWeight: '700',
      color: theme.textColor,
      textAlign: 'center',
    },
    alertSeverity: {
      fontSize: theme.smallTextSize + 1,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 8,
    },

    alertInstruction: {
      fontSize: theme.normalTextSize - 1,
      color: theme.textColor,
      textAlign: 'center',
      lineHeight: 25,
      marginTop: 8,
    },

    alertActions: {
      width: '100%',
      marginTop: 14,
    },

    alertActionButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 10,
    },

    noAlertCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      marginBottom: 16,
    },

    quickButtonDisabled: {
      opacity: 0.5,
    },

    switchTrackOff: {
      backgroundColor: theme.switchTrackOff,
    },

    switchTrackOn: {
      backgroundColor: theme.primaryColor,
    },

    switchThumbOn: {
      backgroundColor: theme.primaryTextColor,
    },

    switchThumbOff: {
      backgroundColor: '#FFFFFF',
    },

    navTextActive: {
      color: theme.primaryTextColor,
    },

    loadingContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },

    loadingText: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      textAlign: 'center',
    },

    speakerButtonSpeaking: {
      opacity: 0.7,
    },

    setupScreenContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 40,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
    },

    setupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },

    setupHeaderBox: {
      flex: 1,
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      paddingVertical: 16,
      paddingHorizontal: 14,
      alignItems: 'center',
    },

    setupTitle: {
      fontSize: theme.headingTextSize,
      color: theme.textColor,
      fontWeight: '700',
    },

    setupCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 20,
      marginBottom: 18,
    },

    setupHeading: {
      fontSize: theme.headingTextSize,
      color: theme.textColor,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 12,
    },

    setupDescription: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      lineHeight: theme.normalTextSize + 9,
      textAlign: 'center',
    },

    setupPrivacyText: {
      fontSize: theme.smallTextSize,
      color: theme.secondaryTextColor,
      lineHeight: theme.smallTextSize + 7,
      marginTop: 6,
    },

    settingRowVertical: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
    },
    tutorialProgressText: {
      fontSize: theme.smallTextSize,
      color: theme.secondaryTextColor,
      textAlign: 'center',
      marginBottom: 14,
    },

    tutorialCard: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      padding: 24,
      marginBottom: 16,
    },

    tutorialStepTitle: {
      fontSize: theme.headingTextSize + 2,
      color: theme.textColor,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 14,
    },

    tutorialStepText: {
      fontSize: theme.normalTextSize,
      color: theme.textColor,
      lineHeight: theme.normalTextSize + 9,
      textAlign: 'left',
    },

    demoModeBanner: {
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderLeftWidth: 4,
      borderLeftColor: theme.primaryColor,
      borderRadius: 8,
      paddingVertical: 9,
      paddingHorizontal: 12,
      marginBottom: 14,
    },

    demoModeBannerText: {
      color: theme.textColor,
      fontSize: theme.smallTextSize,
      fontWeight: '700',
    },

    demoModeSubText: {
      color: theme.secondaryTextColor,
      fontSize: theme.smallTextSize - 1,
      marginTop: 2,
    },

  alertStatusCard: {
    backgroundColor: theme.cardColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },

  alertErrorCard: {
    backgroundColor: theme.cardColor,
    borderWidth: 2,
    borderColor: theme.errorColor,
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },

  alertErrorTitle: {
    fontSize: theme.headingTextSize,
    fontWeight: "700",
    color: theme.errorColor,
    textAlign: "center",
    marginBottom: 8,
  },

  lastUpdatedText: {
    fontSize: theme.smallTextSize,
    color: theme.secondaryTextColor,
    textAlign: "center",
    marginBottom: 12,
  },

  alertSourceText: {
    fontSize: theme.smallTextSize,
    color: theme.secondaryTextColor,
    marginTop: 10,
    textAlign: 'center',
  },

  refreshAlertContainer: {
    marginBottom: 16,
  },
  demoAlertSettingsCard: {
    backgroundColor: theme.cardColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },

  demoAlertOption: {
    backgroundColor: theme.inputColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 14,
    marginTop: 12,
  },

  demoAlertOptionSelected: {
    backgroundColor: theme.primaryColor,
    borderColor: theme.primaryColor,
  },

  demoAlertOptionText: {
    fontSize: theme.normalTextSize,
    color: theme.textColor,
    fontWeight: "600",
  },

  demoAlertOptionTextSelected: {
    color: theme.primaryTextColor,
  },

  homeTutorialRoot: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },

  tutorialOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  tutorialDimPiece: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },

  tutorialHighlightBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: theme.primaryColor,
    borderRadius: 14,
    zIndex: 101,
  },

  tutorialCoachCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: theme.cardColor,
    borderWidth: 2,
    borderColor: theme.primaryColor,
    borderRadius: 14,
    padding: 18,
    zIndex: 102,
  },


  tutorialCoachProgress: {
    fontSize: theme.smallTextSize,
    color: theme.secondaryTextColor,
    fontWeight: '700',
    marginBottom: 6,
  },

  tutorialCoachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  tutorialCoachTitle: {
    fontSize: theme.headingTextSize,
    color: theme.textColor,
    fontWeight: '700',
  },

  tutorialCoachTitleFlex: {
    flex: 1,
  },

  tutorialCoachText: {
    fontSize: theme.normalTextSize - 1,
    color: theme.textColor,
    lineHeight: theme.normalTextSize + 8,
  },

  tutorialCoachActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },

  tutorialBackButton: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginRight: 8,
  },

  tutorialBackButtonText: {
    color: theme.textColor,
    fontSize: theme.smallTextSize + 1,
    fontWeight: '700',
  },

  tutorialNextButton: {
    flex: 1,
    backgroundColor: theme.primaryColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },

  tutorialSkipButton: {
    alignItems: 'center',
    paddingTop: 14,
  },

  tutorialSkipText: {
    color: theme.secondaryTextColor,
    fontSize: theme.smallTextSize,
    textDecorationLine: 'underline',
  },

  });
}
