import { View, Image, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function ImagePreview() {
  const params = useLocalSearchParams();
  const photoUri = params?.photoUri;
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  
  useEffect(() => {
    if (photoUri) {
      generateCaption();
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [photoUri]);

  const generateCaption = async () => {
    try {
      if (!photoUri) {
        console.error('No image URI found');
        return;
      }

      setIsLoading(true);
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist at the given URI');
      }

      // Read file as base64
      const base64Photo = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send the photo data to your Flask backend
      const response = await fetch('http://10.0.9.130:5000/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: base64Photo }),
      });

      const data = await response.json();
      console.log('Response from backend:', data);
      setCaption(data.caption);
      
      // Set the audio URI with cache busting
      setAudioUri(`http://10.0.9.130:5000/get_audio?${Date.now()}`);
    } catch (error) {
      console.error('Failed to generate caption:', error);
      setCaption('Failed to generate caption');
    } finally {
      setIsLoading(false);
    }
  };

  const playTextToSpeech = async () => {
    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        setIsPlaying(false);
        return;
      }

      if (!audioUri) {
        console.error('No audio URL available');
        return;
      }

      setIsPlaying(true);
      
      // Create new cache-busted URI for each play
      const cacheBustedUri = `${audioUri.split('?')[0]}?${Date.now()}`;
      
      // Load and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: cacheBustedUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  if (!photoUri) {
    return <Text style={styles.errorText}>Image not found. Please retake the photo.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
      </View>
      
      <View style={styles.captionContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Generating caption...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.captionText}>{caption}</Text>
            <TouchableOpacity 
              style={[styles.audioButton, isPlaying && styles.playingButton]} 
              onPress={playTextToSpeech}
              disabled={!audioUri}
            >
              <Text style={styles.audioButtonText}>
                {isPlaying ? '⏹ Stop' : '▶ Play Caption'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.retakeButton]} 
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retake Photo</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 20 },
  imageContainer: { flex: 2, backgroundColor: '#f0f0f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  image: { width: '100%', height: '100%' },
  captionContainer: { flex: 1, marginBottom: 20, justifyContent: 'center' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  captionText: { fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  audioButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, marginBottom: 20 },
  playingButton: { backgroundColor: '#f44336' },
  audioButtonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 20 },
  button: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8 },
  retakeButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 }
});
