module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^expo-modules-core/src/web/index\\.web$': '<rootDir>/node_modules/expo-modules-core/src/polyfill/index.web.ts',
    '^expo-modules-core/src/uuid/uuid\\.web$': '<rootDir>/node_modules/expo-modules-core/src/uuid/index.web.ts',
    '^expo-modules-core/src/(.*)$': '<rootDir>/node_modules/expo-modules-core/src/$1.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|convex|react-native-gesture-handler|react-native-safe-area-context|react-native-screens))',
  ],
};
