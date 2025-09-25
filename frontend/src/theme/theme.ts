import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000',
    accent: '#00FF00',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    placeholder: '#666666',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  dark: true,
};
