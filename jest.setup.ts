jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Platform.OS = "ios";
  return RN;
});

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
