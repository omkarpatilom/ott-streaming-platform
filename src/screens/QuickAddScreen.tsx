"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import { theme } from "../theme/theme"
import { storageService, type ContentItem } from "../services/StorageService"

interface QuickAddScreenProps {
  navigation: any
}

export default function QuickAddScreen({ navigation }: QuickAddScreenProps) {
  const [seriesName, setSeriesName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [startSeason, setStartSeason] = useState("1")
  const [endSeason, setEndSeason] = useState("1")
  const [episodesPerSeason, setEpisodesPerSeason] = useState("10")
  const [isLoading, setIsLoading] = useState(false)

  const generateEpisodes = async () => {
    if (!seriesName.trim() || !baseUrl.trim()) {
      Alert.alert("Error", "Series name and base URL are required")
      return
    }

    const startSeasonNum = Number.parseInt(startSeason) || 1
    const endSeasonNum = Number.parseInt(endSeason) || 1
    const episodesNum = Number.parseInt(episodesPerSeason) || 10

    if (startSeasonNum > endSeasonNum) {
      Alert.alert("Error", "Start season cannot be greater than end season")
      return
    }

    setIsLoading(true)

    try {
      const episodes = []

      for (let season = startSeasonNum; season <= endSeasonNum; season++) {
        for (let episode = 1; episode <= episodesNum; episode++) {
          const episodeTitle = `${seriesName} S${season
            .toString()
            .padStart(2, "0")}E${episode.toString().padStart(2, "0")}`

          // Replace placeholders in URL
          const episodeUrl = baseUrl
            .replace("{season}", season.toString())
            .replace("{episode}", episode.toString())
            .replace("{season:02d}", season.toString().padStart(2, "0"))
            .replace("{episode:02d}", episode.toString().padStart(2, "0"))

          episodes.push({
            number: episode,
            title: `Episode ${episode}`,
            url: episodeUrl,
          })
        }

        // Create series content item for each season
        const contentItem: Omit<ContentItem, "id" | "createdAt"> = {
          title: `${seriesName} Season ${season}`,
          type: "series",
          episodes: episodes.slice(
            (season - startSeasonNum) * episodesNum,
            (season - startSeasonNum + 1) * episodesNum,
          ),
          description: `Season ${season} of ${seriesName}`,
        }

        await storageService.addContent(contentItem)
      }

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: `Added ${endSeasonNum - startSeasonNum + 1} seasons with ${episodesNum} episodes each`,
      })

      navigation.goBack()
    } catch (error) {
      console.error("Error adding episodes:", error)
      Alert.alert("Error", "Failed to add episodes")
    } finally {
      setIsLoading(false)
    }
  }

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = "default",
    multiline = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  )

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Quick Add Series</Text>
          <Text style={styles.subtitle}>Quickly add multiple episodes of a series with URL patterns</Text>

          {/* Series Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Series Information</Text>

            {renderInput("Series Name *", seriesName, setSeriesName, "e.g., Breaking Bad")}

            {renderInput(
              "Base URL Pattern *",
              baseUrl,
              setBaseUrl,
              "e.g., https://example.com/series/s{season}e{episode}.mkv",
              "default",
              true,
            )}
          </View>

          {/* URL Pattern Help */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>URL Pattern Variables:</Text>
            <Text style={styles.helpText}>• {"{season}"} - Season number (1, 2, 3...)</Text>
            <Text style={styles.helpText}>• {"{episode}"} - Episode number (1, 2, 3...)</Text>
            <Text style={styles.helpText}>• {"{season:02d}"} - Season with leading zero (01, 02, 03...)</Text>
            <Text style={styles.helpText}>• {"{episode:02d}"} - Episode with leading zero (01, 02, 03...)</Text>
          </View>

          {/* Range Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episode Range</Text>

            <View style={styles.row}>
              {renderInput("Start Season", startSeason, setStartSeason, "1", "numeric")}

              {renderInput("End Season", endSeason, setEndSeason, "1", "numeric")}
            </View>

            {renderInput("Episodes per Season", episodesPerSeason, setEpisodesPerSeason, "10", "numeric")}
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Preview:</Text>
            <Text style={styles.previewText}>
              Will create{" "}
              {((Number.parseInt(endSeason) || 1) - (Number.parseInt(startSeason) || 1) + 1) *
                (Number.parseInt(episodesPerSeason) || 10)}{" "}
              episodes across {(Number.parseInt(endSeason) || 1) - (Number.parseInt(startSeason) || 1) + 1} seasons
            </Text>

            {seriesName && baseUrl && (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Example URLs:</Text>
                <Text style={styles.exampleUrl}>
                  {baseUrl
                    .replace("{season}", startSeason)
                    .replace("{episode}", "1")
                    .replace("{season:02d}", startSeason.padStart(2, "0"))
                    .replace("{episode:02d}", "01")}
                </Text>
                <Text style={styles.exampleUrl}>
                  {baseUrl
                    .replace("{season}", startSeason)
                    .replace("{episode}", "2")
                    .replace("{season:02d}", startSeason.padStart(2, "0"))
                    .replace("{episode:02d}", "02")}
                </Text>
              </View>
            )}
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, isLoading && styles.disabledButton]}
            onPress={generateEpisodes}
            disabled={isLoading}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.generateButtonText}>{isLoading ? "Generating..." : "Generate Episodes"}</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
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
    flex: 1,
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  helpSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  previewSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  exampleContainer: {
    marginTop: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  exampleUrl: {
    fontSize: 12,
    color: theme.colors.accent,
    fontFamily: "monospace",
    marginBottom: 2,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
})
