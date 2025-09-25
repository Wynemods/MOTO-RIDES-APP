export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList) => void;
  goBack: () => void;
  replace: (screen: keyof RootStackParamList) => void;
};