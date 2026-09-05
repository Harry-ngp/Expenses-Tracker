import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

const IGNORED_WARNINGS = [
  'setLayoutAnimationEnabledExperimental is currently a no-op',
  'SafeAreaView has been deprecated',
  'InteractionManager has been deprecated',
  'VirtualizedLists should never be nested',
];

LogBox.ignoreLogs(IGNORED_WARNINGS);

const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    IGNORED_WARNINGS.some((warning) => args[0].includes(warning))
  ) {
    return;
  }
  originalWarn(...args);
};

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
