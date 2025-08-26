import { Stack } from 'expo-router';

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="location" />
      <Stack.Screen name="vehicle-selection" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="guest" />
    </Stack>
  );
}