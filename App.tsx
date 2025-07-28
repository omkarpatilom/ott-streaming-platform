"use client"

import { useEffect } from "react"
import { StatusBar } from "expo-status-bar"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Provider as PaperProvider } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import * as ScreenOrientation from "expo-screen-orientation"
import Toast from "react-native-toast-message"

// Screens
import HomeScreen from "./src/screens/HomeScreen"
import WatchScreen from "./src/screens/WatchScreen"
import AddContentScreen from "./src/screens/AddContentScreen"
import QuickAddScreen from "./src/screens/QuickAddScreen"
import BookmarksScreen from "./src/screens/BookmarksScreen"
import SettingsScreen from "./src/screens/SettingsScreen"

// Theme
import { theme } from "./src/theme/theme"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Bookmarks") {
            iconName = focused ? "bookmark" : "bookmark-outline"
          } else if (route.name === "Add") {
            iconName = focused ? "add-circle" : "add-circle-outline"
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline"
          } else {
            iconName = "help-circle-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Add" component={AddContentScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  useEffect(() => {
    // Set default orientation
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
  }, [])

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Watch" component={WatchScreen} options={{ headerShown: false }} />
          <Stack.Screen name="QuickAdd" component={QuickAddScreen} options={{ title: "Quick Add Series" }} />
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  )
}
