"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { Ionicons } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import { theme } from "../theme/theme"
import { storageService, type ContentItem } from "../services/StorageService"

interface AddContentScreenProps {
  navigation: any
}

export default function AddContentScreen({ navigation }: AddContentScreenProps) {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    thumbnail: "",
    description: "",
    genre: "",
    year: "",
    duration: "",
    rating: "",
    series: "",
    season: "",
    episode: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        handleInputChange("url", asset.uri)
        if (!formData.title) {
          handleInputChange("title", asset.name?.replace(/\.[^/.]+$/, "") || "")
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file")
    }
  }

  const parseSeriesInfo = (title: string) => {
    // Try to extract series info from title
    const seasonEpisodeRegex = /S(\d+)E(\d+)/i
    const match = title.match(seasonEpisodeRegex)

    if (match) {
      const season = match[1]
      const episode = match[2]
      const seriesName = title.replace(seasonEpisodeRegex, "").trim()

      return {
        series: seriesName,
        season,
        episode,
      }
    }

    return null
  }

  const autoParseTitle = () => {
    if (formData.title) {
      const seriesInfo = parseSeriesInfo(formData.title)
      if (seriesInfo) {
        setFormData((prev) => ({
          ...prev,
          ...seriesInfo,
        }))
      }
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Title is required")
      return false
    }

    if (!formData.url.trim()) {
      Alert.alert("Error", "URL or file is required")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const contentItem: Omit<ContentItem, "id" | "createdAt"> = {
        title: formData.title.trim(),
        url: formData.url.trim(),
        thumbnail: formData.thumbnail.trim() || undefined,
        description: formData.description.trim() || undefined,
        genre: formData.genre.trim() || undefined,
        year: formData.year ? Number.parseInt(formData.year) : undefined,
        duration: formData.duration.trim() || undefined,
        rating: formData.rating ? Number.parseFloat(formData.rating) : undefined,
        type: formData.series ? "series" : "movie",
      }

      if (formData.series) {
        contentItem.episodes = [
          {
            number: formData.episode ? Number.parseInt(formData.episode) : 1,
            title: `Episode ${formData.episode || 1}`,
            url: formData.url.trim(),
          },
        ]
      }

      await storageService.addContent(contentItem)

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Content added successfully",
      })

      navigation.goBack()
    } catch (error) {
      console.error("Error adding content:", error)
      Alert.alert("Error", "Failed to add content")
    } finally {
      setIsLoading(false)
    }
  }

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    multiline = false,
    keyboardType: any = "default",
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={formData[field as keyof typeof formData]}
        onChangeText={(value) => handleInputChange(field, value)}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  )

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Add New Content</Text>

          {/* File Picker */}
          <TouchableOpacity style={styles.filePickerButton} onPress={pickFile}>
            <Ionicons name="folder-open" size={24} color="white" />
            <Text style={styles.filePickerText}>Pick Video File</Text>
          </TouchableOpacity>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {renderInput("Title *", "title", "Enter title")}
            {renderInput("URL/File Path *", "url", "Enter URL or file path")}
            {renderInput("Thumbnail URL", "thumbnail", "Enter thumbnail URL")}
            {renderInput("Description", "description", "Enter description", true)}
          </View>

          {/* Metadata */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metadata</Text>

            {renderInput("Genre", "genre", "e.g., Action, Comedy")}
            {renderInput("Year", "year", "e.g., 2023", false, "numeric")}
            {renderInput("Duration", "duration", "e.g., 2h 30m")}
            {renderInput("Rating", "rating", "e.g., 8.5", false, "decimal-pad")}
          </View>

          {/* Series Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Series Information (Optional)</Text>

            <TouchableOpacity style={styles.parseButton} onPress={autoParseTitle}>
              <Ionicons name="sparkles" size={20} color="white" />
              <Text style={styles.parseButtonText}>Auto Parse from Title</Text>
            </TouchableOpacity>

            {renderInput("Series Name", "series", "e.g., Breaking Bad")}
            {renderInput("Season", "season", "e.g., 1", false, "numeric")}
            {renderInput("Episode", "episode", "e.g., 5", false, "numeric")}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>{isLoading ? "Adding..." : "Add Content"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 20,
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  filePickerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  parseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  parseButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})
