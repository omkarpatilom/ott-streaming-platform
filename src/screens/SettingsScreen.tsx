"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Sharing from "expo-sharing"
import * as FileSystem from "expo-file-system"
import * as DocumentPicker from "expo-document-picker"
import Toast from "react-native-toast-message"
import { theme } from "../theme/theme"
import { storageService } from "../services/StorageService"

interface SettingsScreenProps {
  navigation: any
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [autoPlay, setAutoPlay] = useState(true)
  const [highQuality, setHighQuality] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const exportData = async () => {
    try {
      setIsExporting(true)
      const data = await storageService.exportData()
      const exportString = JSON.stringify(data, null, 2)

      const fileName = `streamflix_backup_${new Date().toISOString().split("T")[0]}.json`
      const fileUri = FileSystem.documentDirectory + fileName

      await FileSystem.writeAsStringAsync(fileUri, exportString)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: "Export StreamFlix Data",
          mimeType: "application/json",
        })
      }

      Toast.show({
        type: "success",
        text1: "Export Successful",
        text2: "Your data has been exported successfully",
      })
    } catch (error) {
      console.error("Export error:", error)
      Alert.alert("Export Failed", "Failed to export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const importData = async () => {
    try {
      setIsImporting(true)

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri)
        const importedData = JSON.parse(fileContent)

        Alert.alert("Import Data", "This will replace all your current data. Are you sure?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              try {
                await storageService.importData(importedData)
                Toast.show({
                  type: "success",
                  text1: "Import Successful",
                  text2: "Your data has been imported successfully",
                })
              } catch (error) {
                Alert.alert("Import Failed", "Invalid data format or corrupted file.")
              }
            },
          },
        ])
      }
    } catch (error) {
      console.error("Import error:", error)
      Alert.alert("Import Failed", "Failed to import data. Please try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your content, bookmarks, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await storageService.clearAllData()
              Toast.show({
                type: "success",
                text1: "Data Cleared",
                text2: "All data has been cleared successfully",
              })
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.")
            }
          },
        },
      ],
    )
  }

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }: {
    icon: string
    title: string
    subtitle?: string
    onPress?: () => void
    rightComponent?: React.ReactNode
    showArrow?: boolean
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  )

  const SectionHeader = ({ title }: { title: string }) => <Text style={styles.sectionHeader}>{title}</Text>

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your StreamFlix experience</Text>
        </View>

        {/* Playback Settings */}
        <SectionHeader title="Playback" />
        <View style={styles.section}>
          <SettingItem
            icon="play-circle"
            title="Auto Play Next Episode"
            subtitle="Automatically play the next episode in series"
            rightComponent={
              <Switch
                value={autoPlay}
                onValueChange={setAutoPlay}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="white"
              />
            }
            showArrow={false}
          />

          <SettingItem
            icon="videocam"
            title="High Quality Playback"
            subtitle="Prefer higher quality video when available"
            rightComponent={
              <Switch
                value={highQuality}
                onValueChange={setHighQuality}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="white"
              />
            }
            showArrow={false}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.section}>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Get notified about new content and updates"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="white"
              />
            }
            showArrow={false}
          />
        </View>

        {/* Data Management */}
        <SectionHeader title="Data Management" />
        <View style={styles.section}>
          <SettingItem
            icon="download"
            title={isExporting ? "Exporting..." : "Export Data"}
            subtitle="Backup your content and settings"
            onPress={isExporting ? undefined : exportData}
          />

          <SettingItem
            icon="cloud-upload"
            title={isImporting ? "Importing..." : "Import Data"}
            subtitle="Restore from a backup file"
            onPress={isImporting ? undefined : importData}
          />

          <SettingItem
            icon="trash"
            title="Clear All Data"
            subtitle="Delete all content, bookmarks, and settings"
            onPress={clearAllData}
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.section}>
          <SettingItem
            icon="information-circle"
            title="Version"
            subtitle="StreamFlix Mobile v1.0.0"
            showArrow={false}
          />

          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help with using the app"
            onPress={() => {
              Alert.alert("Help & Support", "For support and feature requests, please contact the developer.", [
                { text: "OK" },
              ])
            }}
          />

          <SettingItem
            icon="star"
            title="Rate the App"
            subtitle="Help us improve by rating the app"
            onPress={() => {
              Alert.alert("Rate StreamFlix", "Thank you for using StreamFlix! Your feedback helps us improve.", [
                { text: "OK" },
              ])
            }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for movie and series enthusiasts</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footer: {
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
})
