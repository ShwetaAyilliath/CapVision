import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert, Button } from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync();
        // Create a new persistent URI by moving the file
        const newUri = FileSystem.documentDirectory + photoData.uri.split('/').pop();
        await FileSystem.moveAsync({
          from: photoData.uri,
          to: newUri,
        });
        setPhoto(newUri);
        setCameraActive(false);
        router.push({ pathname: '/login/ImagePreview', params: { photoUri: newUri } });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  return (
    <View style={styles.container}>
      {!cameraActive ? (
        <TouchableOpacity style={styles.captureButton} onPress={() => setCameraActive(true)}>
          <Text style={styles.buttonText}>📷 Open Camera</Text>
        </TouchableOpacity>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef} facing={0}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Text style={styles.buttonText}>📷 Capture</Text>
          </TouchableOpacity>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { textAlign: 'center', paddingBottom: 10 },
  camera: { flex: 1, width: '100%' },
  captureButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 50,
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center'
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }
});
