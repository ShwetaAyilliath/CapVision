import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'; 
import React, { useState } from 'react'; 
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function SignUp() {
    const router = useRouter();

    // State variables for input fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // New state for error message

    const handleSignUp = async () => {
        setErrorMessage('');
    
        // Client-side validation
        if (!name || !email || !password || !confirmPassword) {
            setErrorMessage("All fields are required!");
            return;
        }
    
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }
    
        try {
            const response = await axios.post('http://10.0.9.130:5000/signup', {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: password,
                confirmPassword: confirmPassword
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data.message === "User registered successfully") {
                alert("Registration successful! Please login.");
                router.push('login/signin');
            } else {
                setErrorMessage(response.data.error || "Registration failed");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 
                            error.message || 
                            "Registration failed. Please try again.";
            setErrorMessage(errorMsg);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.textHeader}>Create New Account!</Text>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null} 

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                    placeholder="Full Name" 
                    placeholderTextColor="gray" 
                    style={styles.textInput} 
                    value={name}
                    onChangeText={setName}
                />
            </View>

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

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput 
                    placeholder="Confirm Password" 
                    placeholderTextColor="gray" 
                    secureTextEntry={true} 
                    style={styles.textInput} 
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.buttonCreate}
                onPress={() => router.push('login/signin')}
            >
                <Text style={styles.buttonCreateText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    ); 
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B192C', padding: 20 },
    textHeader: { fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
    errorText: { color: 'red', fontSize: 16, marginBottom: 10 },  // New style for error messages
    inputContainer: { width: '100%', marginBottom: 15 },
    inputLabel: { color: 'white', marginBottom: 5, fontSize: 16 },
    textInput: { padding: 10, borderWidth: 1, fontSize: 17, borderRadius: 10, borderColor: 'gray', color: 'black', backgroundColor: 'white' },
    button: { width: '100%', padding: 15, backgroundColor: '#1E3E62', borderRadius: 10, marginTop: 20 },
    buttonText: { fontSize: 17, color: 'white', textAlign: 'center' },
    buttonCreate: { width: '100%', padding: 15, backgroundColor: '#1E3E62', borderRadius: 10, marginTop: 15 },
    buttonCreateText: { fontSize: 17, color: 'white', textAlign: 'center' },
});