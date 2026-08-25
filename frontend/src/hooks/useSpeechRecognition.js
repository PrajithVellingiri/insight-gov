import { useState, useEffect, useRef, useCallback } from 'react';

// Global state to ensure only one microphone is active at a time across the entire application
let globalActiveStop = null;
let globalInactivityTimer = null;

const INACTIVITY_TIMEOUT_MS = 3000;

function clearGlobalTimer() {
  if (globalInactivityTimer) {
    clearTimeout(globalInactivityTimer);
    globalInactivityTimer = null;
  }
}

function resetGlobalTimer(stopCallback) {
  clearGlobalTimer();
  if (stopCallback) {
    globalInactivityTimer = setTimeout(() => {
      stopCallback(false); // false = not preempted, just inactive timeout
    }, INACTIVITY_TIMEOUT_MS);
  }
}

export default function useSpeechRecognition({ onResult, onEnd, language = 'en-US' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);
  
  // Track if we intentionally stopped this instance (e.g. preempted by another mic)
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
  }, [onResult, onEnd]);

  // Define stopThisInstance so we can use it inside useEffect and pass it to global state
  const stopThisInstance = useCallback((preempted = false) => {
    if (!recognitionRef.current) return;
    
    stopRequestedRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // ignore
    }
    
    setIsListening(false);
    
    // If we were the active global mic, clear the timer and our reference
    if (globalActiveStop === stopThisInstance) {
      clearGlobalTimer();
      globalActiveStop = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const localeMap = {
        'en': 'en-IN',
        'ta': 'ta-IN',
        'hi': 'hi-IN',
        'ml': 'ml-IN',
        'te': 'te-IN',
        'kn': 'kn-IN',
      };
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = localeMap[language] || language;

      recognition.onstart = () => {
        if (stopRequestedRef.current) {
          recognition.stop();
          return;
        }
        setIsListening(true);
        setError(null);
        resetGlobalTimer(stopThisInstance);
      };

      recognition.onresult = (event) => {
        // Reset timer on meaningful speech
        resetGlobalTimer(stopThisInstance);
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (onResultRef.current) {
          onResultRef.current(finalTranscript, interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        // If we intentionally stopped this instance (preempted or timeout), completely ignore all errors to avoid false popups
        if (stopRequestedRef.current) {
          return;
        }
        
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else if (event.error === 'no-speech') {
          // Ignore no-speech, just stops
        } else if (event.error === 'aborted') {
          // ignore
        } else {
          setError(`Error: ${event.error}`);
        }
        setIsListening(false);
        
        if (globalActiveStop === stopThisInstance) {
          clearGlobalTimer();
          globalActiveStop = null;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        
        if (globalActiveStop === stopThisInstance) {
          clearGlobalTimer();
          globalActiveStop = null;
        }
        
        if (onEndRef.current) onEndRef.current();
        stopRequestedRef.current = false;
      };

      recognitionRef.current = recognition;
      
      return () => {
        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
        if (globalActiveStop === stopThisInstance) {
          clearGlobalTimer();
          globalActiveStop = null;
        }
      };
    }
  }, [language, stopThisInstance]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    // Stop any other active microphone globally (Preempt it)
    if (globalActiveStop && globalActiveStop !== stopThisInstance) {
      globalActiveStop(true);
    }
    
    globalActiveStop = stopThisInstance;
    
    setError(null);
    stopRequestedRef.current = false;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      resetGlobalTimer(stopThisInstance);
    } catch (e) {
      // already started
    }
  }, [isSupported, stopThisInstance]);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening: stopThisInstance
  };
}
