// Where the app sends API requests.
//
// - Set EXPO_PUBLIC_API_URL (in mobile/.env or the shell) to override.
// - In development the default is the local backend as seen from the Android
//   emulator (10.0.2.2 is the emulator's alias for the PC's localhost).
// - In release builds the default is the production API on Render.
const PROD_API_URL = 'https://oms-api-23gt.onrender.com'
const DEV_API_URL = 'http://10.0.2.2:8080'

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_URL : PROD_API_URL)).replace(/\/+$/, '')

export const APP_NAME = 'Al-Wakeel Al-Shamel'
