import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';

export default function UploadScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams(); // Use this to extract params properly
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);

  // Request gallery permissions
  useEffect(() => {
    (async () => {
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryStatus === 'granted');
      setLoading(false);
    })();
  }, []);

  // Set the photo from route parameters
  useEffect(() => {
    if (photoUri) {
      setPhoto(photoUri); // Set photo from camera
    }
  }, [photoUri]);

  // Select image from gallery

const handleSelectImage = async () => {
  if (!hasGalleryPermission) {
    Alert.alert('Permission Denied', 'Gallery access is required to select an image.');
    return;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const originalUri = result.assets[0].uri;

      // Generate new path in app-safe directory
      const fileName = originalUri.split('/').pop();
      const newPath = FileSystem.documentDirectory + fileName;

      // Copy file to known location
      await FileSystem.copyAsync({
        from: originalUri,
        to: newPath,
      });

      // Navigate to preview screen with the new URI
      router.push({ 
        pathname: '/login/ImagePreview', 
        params: { photoUri: newPath }
      });
    }
  } catch (error) {
    console.error('Gallery Upload Error:', error);
    Alert.alert('Error', 'Failed to select image from gallery');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Page</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <>
          {/* Display Image Preview if Available */}
          {photo ? (
            <Image source={{ uri: photo }} style={styles.preview} />
          ) : (
            <Text style={styles.noImageText}>No image selected</Text>
          )}

          {/* Select Image from Gallery */}
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]} 
            onPress={handleSelectImage}
          >
            <Text style={styles.buttonText}>Upload from Gallery</Text>
          </TouchableOpacity>

          {/* Open Camera to Take Picture */}
          <TouchableOpacity 
            style={[styles.button, styles.cameraButton]} 
            onPress={() => router.push('/login/camera')}
          >
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          {/* Go Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001f3f', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  button: { paddingVertical: 15, paddingHorizontal: 60, borderRadius: 10, marginVertical: 10, width: '80%' },
  uploadButton: { backgroundColor: '#1E90FF' },
  cameraButton: { backgroundColor: '#4CAF50' },
  backButton: { marginTop: 20, backgroundColor: '#e74c3c', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 10, width: '80%' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  preview: { width: 200, height: 300, borderRadius: 10, marginVertical: 20 },
  noImageText: { color: 'white', fontSize: 16, marginVertical: 20 },
});
