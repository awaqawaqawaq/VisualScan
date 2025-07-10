import React, { useState, useEffect } from 'react';
import { AddressData } from '../../types';
import { generateAddressSummary } from '../../api';
import { SparklesIcon } from '../icons';

interface AISummaryProps {
  addressData: AddressData;
}

// --- START: localStorage Caching for AI Summaries ---

interface CachedSummary {
    summary: string;
    error: string | null;
    timestamp: number;
}

const CACHE_PREFIX = 'ai-summary-cache-';
const CACHE_TTL = 1000 * 60 * 60 * 24; // Cache summaries for 24 hours

const getCachedSummary = (id: string): CachedSummary | null => {
    const key = `${CACHE_PREFIX}${id}`;
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;

    try {
        const data: CachedSummary = JSON.parse(cachedItem);
        // Check if the cache is expired
        if (Date.now() - data.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        // If parsing fails, the item is corrupt, so remove it
        localStorage.removeItem(key);
        return null;
    }
};

const setCachedSummary = (id: string, summary: string, error: string | null) => {
    try {
        const key = `${CACHE_PREFIX}${id}`;
        const data: CachedSummary = { summary, error, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to write AI summary to localStorage", e);
    }
};

// --- END: localStorage Caching ---


const AISummary: React.FC<AISummaryProps> = ({ addressData }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      // Check localStorage cache first
      const cached = getCachedSummary(addressData.id);
      if (cached) {
        setSummary(cached.summary);
        setError(cached.error);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await generateAddressSummary(addressData);
        setSummary(result);
        setCachedSummary(addressData.id, result, null);
      } catch (err: any) {
        let errorMessage = "Could not generate AI summary. There might be an issue with the API.";
        // Check for Gemini's specific rate limit error structure
        if (err?.error?.status === 'RESOURCE_EXHAUSTED') {
            errorMessage = err.error.message || "API rate limit exceeded. Please check your plan and billing details.";
        } else {
            console.error("Error generating summary:", err);
        }
        setSummary(errorMessage);
        setError(errorMessage);
        setCachedSummary(addressData.id, errorMessage, errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (process.env.API_KEY) {
        fetchSummary();
    } else {
        const msg = "AI analysis is disabled. No API key found.";
        setSummary(msg);
        setError(msg);
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressData.id]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-5 h-5 animate-pulse text-purple-400" />
          <p className="text-gray-400 italic">Generating AI-powered analysis...</p>
        </div>
      );
    }
    // The error message is now displayed directly in the summary text
    return <p className={`leading-relaxed ${error ? 'text-red-400' : 'text-gray-300'}`}>{summary}</p>;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 ring-1 ring-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="w-6 h-6 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI Persona Analysis</h3>
      </div>
      {renderContent()}
      <p className="text-right text-xs text-gray-500 mt-4">Powered by Gemini</p>
    </div>
  );
};

export default AISummary;
