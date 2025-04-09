import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native'; 
import React, { useState } from 'react'; 
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function SignIn() { 
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            if (!email || !password) {
                alert("Please enter both email and password");
                return;
            }
    
            const response = await axios.post('http://10.0.9.130:5000/login', {
                email: email.trim().toLowerCase(),
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data.message === "Login successful") {
                alert("Login successful!");
                router.push('login/Upload');
            } else {
                alert(response.data.error || "Login failed");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 
                            error.message || 
                            "Login failed. Please try again.";
            alert(errorMsg);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.textHeader}>Let's Sign you in!</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput 
                    placeholder="Email" 
                    placeholderTextColor="gray" 
                    style={styles.textInput} 
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput 
                    placeholder="Password" 
                    placeholderTextColor="gray" 
                    secureTextEntry={true} 
                    style={styles.textInput} 
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonCreate} onPress={() => router.push('login/signUp')}>
                <Text style={styles.buttonCreateText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B192C', padding: 20 },
  textHeader: { fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: 15 },
  inputLabel: { color: 'white', marginBottom: 5, fontSize: 16 },
  textInput: { padding: 10, borderWidth: 1, fontSize: 17, borderRadius: 10, borderColor: 'black', color: 'black', backgroundColor: 'white' },
  button: { width: '100%', padding: 15, backgroundColor: '#1E3E62', borderRadius: 10, marginTop: 20 },
  buttonText: { fontSize: 17, color: 'white', textAlign: 'center' },
  buttonCreate: { width: '100%', padding: 15, backgroundColor: '#1E3E62', borderRadius: 10, marginTop: 15 },
  buttonCreateText: { fontSize: 17, color: 'white', textAlign: 'center' },
});
