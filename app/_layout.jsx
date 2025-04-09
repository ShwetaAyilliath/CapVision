import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false
    }} 
    initialRouteName="index"
      >
{/*         
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" /> */}
     
      <Stack.Screen 
        name="login/Upload" 
        options={{ 
          title: 'Upload Image',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="login/ImagePreview" 
        options={{ 
          title: 'Preview',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="login/camera" 
        options={{ 
          title: 'Camera',
          headerShown: true 
        }} 
      />
</Stack>
  );
}
