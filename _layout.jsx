import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';




export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false
    }}>
        <Tabs.Screen name='index'
          options={{
            tabBarLabel:'Home',
            tabBarIcon:({color,size})=>(
              <FontAwesome name="home" size={24} color={color} />

            )
          }}
        />
        <Tabs.Screen name='AddNew'
        options={{
          tabBarLabel:'Capture',
          tabBarIcon:({color,size})=>(
            <Entypo name="camera" size={size} color={color} />

          )
        }}/>
        
        <Tabs.Screen name='Profile'
        options={{
          tabBarLabel:'Upload',
          tabBarIcon:({color,size})=>(
            <Entypo name="upload" size={size} color={color} />

          )
        }}/>
    </Tabs>
  )
}
