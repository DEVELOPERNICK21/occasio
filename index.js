/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import firebase from '@react-native-firebase/app';
import { AppRegistry } from 'react-native';

if (!firebase.apps.length) {
  firebase.initializeApp();
}
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
