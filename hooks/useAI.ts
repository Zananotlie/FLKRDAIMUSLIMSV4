"use client"

import { useState, useCallback } from "react"

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyC67Zy9d1cQ2lGLuw8EFhzzpTSWsQd0UHk"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

export function useAI() {
  const [isLoading, setIsLoading] = useState(false)

  const generateResponse = useCallback(async (prompt: string, language = "en") => {
    setIsLoading(true)
    try {
      const systemPrompt = `You are Nur, an Islamic AI assistant. Respond in ${language} language. 
      Provide helpful, accurate Islamic guidance based on Quran and authentic Hadith. 
      Be respectful, knowledgeable, and supportive. Keep responses concise but informative.
      If asked about prayer times, Quran verses, or Islamic practices, provide accurate information.
      Always maintain Islamic etiquette and values in your responses.`

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser question: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            stopSequences: [],
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error: ${errorData.error?.message || "Failed to generate AI response"}`)
      }

      const data = await response.json()
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I couldn't generate a response."

      return { response: aiResponse, error: null }
    } catch (error) {
      console.error("AI generation error:", error)
      return {
        response: "I apologize, I'm having trouble connecting right now. Please try again later.",
        error: error as Error,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const moderateContent = useCallback(async (content: string) => {
    setIsLoading(true)
    try {
      const moderationPrompt = `Analyze this content for Islamic appropriateness. 
      Check for: inappropriate language, un-Islamic content, harmful material, or content that goes against Islamic values.
      Respond with only "APPROVED" or "BLOCKED" followed by a brief reason if blocked.
      
      Content to analyze: ${content}`

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: moderationPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.1,
            maxOutputTokens: 100,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to moderate content")
      }

      const data = await response.json()
      const moderationResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "BLOCKED: Unable to analyze"

      const isApproved = moderationResult.toUpperCase().includes("APPROVED")
      const reason = isApproved ? null : moderationResult.replace("BLOCKED", "").trim()

      return { approved: isApproved, reason, error: null }
    } catch (error) {
      console.error("Content moderation error:", error)
      return { approved: false, reason: "Moderation service unavailable", error: error as Error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    generateResponse,
    moderateContent,
    isLoading,
  }
}
