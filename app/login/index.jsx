import React from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity } from 'react-native';



import { useRouter } from 'expo-router';



export default function LoginScreen() {
      const router=useRouter();




  // Function to handle the button click
  const handleButtonClick = () => {
    alert("Welcome to CAPVISION!");
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>CAPVISION</Text>

      {/* Logo/Image with Text on Top */}
      <ImageBackground
      source={require('../../assets/images/vision.jpg')}

        // Correct way to load a local image
        style={styles.logo}
      >
        <Text style={styles.imageText}>
          Capture moments effortlessly with our app - turning images into descriptive captions and bringing them to life with voice
        </Text>
      </ImageBackground>

      {/* Button to Start inside a white box */}
      <TouchableOpacity style={styles.buttonBox} onPress={() => router.push('/login/signin')}
      >
        <Text style={styles.buttonText}>Click to Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(18, 25, 56, 0.5)', 
  },
  title: {
    fontFamily: 'serif',
    fontSize: 44, 
    fontWeight: '800', 
    marginBottom: 10, 
    color: '#ffffff', 
    textAlign: 'center', 
  },
  logo: {
    width: 300, 
    height: 200, 
    marginBottom: 30, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    borderRadius: 20,
  },
  imageText: {
    fontFamily: 'sans-serif', 
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(36, 42, 70, 0.5)', 
    padding: 20,
    borderRadius: 5,
    textAlign: 'center', 
  },
  buttonBox: {
    borderWidth: 2, 
    borderColor: 'white', 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: 'transparent', 
    marginTop: 20, 
  },
  buttonText: {
    fontSize: 18, 
    color: 'white', 
    fontWeight: 'bold', 
    textAlign: 'center', 
  },
});
