/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import firebase from '@react-native-firebase/app';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerFcmBackgroundHandler } from './src/features/vault/data/fcmRepository';

if (!firebase.apps.length) {
  firebase.initializeApp();
}
registerFcmBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
