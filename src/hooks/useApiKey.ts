"use client";

import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'azureDevOpsApiKey';

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isKeyLoaded, setIsKeyLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        setApiKey(storedKey);
      } catch (error) {
        console.error("Failed to access localStorage:", error);
        // Fallback or error handling if localStorage is not available
      } finally {
        setIsKeyLoaded(true);
      }
    }
  }, []);

  const saveApiKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setApiKey(key);
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }
  }, []);

  const clearApiKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setApiKey(null);
      } catch (error) {
        console.error("Failed to remove from localStorage:", error);
      }
    }
  }, []);

  return { apiKey, saveApiKey, clearApiKey, isKeyLoaded };
}
