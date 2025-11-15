export class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isWakeWordListening = false;
    this.onResult = null;
    this.onError = null;
    this.onWakeWord = null;
    this.wakeWords = ['elizabeth', 'hey elizabeth', 'hi elizabeth', 'hello elizabeth'];
    this.conversationActive = false;
    this.lastInteractionTime = null;
    this.conversationTimeout = 30000;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        const isFinal = event.results[0].isFinal;

        if (this.isWakeWordListening && isFinal) {
          this.detectWakeWord(transcript);
        } else if (this.onResult) {
          this.onResult(transcript, isFinal);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        if (this.onError) {
          this.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        console.log('Recognition ended');
        this.isListening = false;

        if (this.isWakeWordListening && !this.conversationActive) {
          console.log('Restarting wake word detection...');
          setTimeout(() => {
            if (this.isWakeWordListening && !this.conversationActive) {
              this.startWakeWordDetection(this.onWakeWord);
            }
          }, 100);
        }
      };
    }
  }

  detectWakeWord(transcript) {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('Checking transcript for wake word:', lowerTranscript);

    const wakeWordDetected = this.wakeWords.some(word => {
      const detected = lowerTranscript.includes(word);
      if (detected) {
        console.log(`Wake word match found: "${word}" in "${lowerTranscript}"`);
      }
      return detected;
    });

    if (wakeWordDetected) {
      console.log('Wake word confirmed! Stopping detection.');
      this.isWakeWordListening = false;
      this.conversationActive = true;
      this.lastInteractionTime = Date.now();

      this.recognition.stop();
      this.isListening = false;

      if (this.onWakeWord) {
        this.onWakeWord(transcript);
      }

      this.respondToWakeWord();
    }
  }

  respondToWakeWord() {
    const greetings = [
      "Yes, I'm here. How can I help you?",
      "Hello! What can I do for you?",
      "I'm listening. What do you need?",
      "Yes? How may I assist you?",
      "Hi! I'm ready to help.",
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    this.speak(greeting, {
      onEnd: () => {
        console.log('Greeting finished, ready for command');
      }
    });
  }

  startWakeWordDetection(onWakeWord) {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return false;
    }

    this.isWakeWordListening = true;
    this.onWakeWord = onWakeWord;
    this.conversationActive = false;

    console.log('Starting wake word detection...');

    try {
      if (this.isListening) {
        this.recognition.stop();
        this.isListening = false;
        setTimeout(() => this.startWakeWordDetection(onWakeWord), 100);
        return true;
      }

      this.recognition.continuous = true;
      this.recognition.start();
      this.isListening = true;
      console.log('Wake word detection started');
      return true;
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      }
      return false;
    }
  }

  stopWakeWordDetection() {
    this.isWakeWordListening = false;
    this.conversationActive = false;
    this.stopListening();
  }

  endConversation() {
    this.conversationActive = false;
    const farewells = [
      "Goodbye! Call me if you need anything.",
      "Talk to you later!",
      "I'll be here when you need me.",
      "See you soon!",
    ];

    const farewell = farewells[Math.floor(Math.random() * farewells.length)];
    this.speak(farewell, {
      onEnd: () => {
        if (this.isWakeWordListening) {
          this.startWakeWordDetection(this.onWakeWord);
        }
      }
    });
  }

  updateLastInteraction() {
    this.lastInteractionTime = Date.now();
  }

  isSupported() {
    return this.recognition !== null && this.synthesis !== null;
  }

  startListening(onResult, onError) {
    if (!this.recognition) {
      const error = 'Speech recognition not supported';
      if (onError) onError(error);
      return false;
    }

    if (this.isListening) {
      return true;
    }

    this.onResult = onResult;
    this.onError = onError;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      if (onError) onError(error.message);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported');
      return false;
    }

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    utterance.lang = options.lang || 'en-US';

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    if (options.onError) {
      utterance.onerror = options.onError;
    }

    this.synthesis.speak(utterance);
    return true;
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.stopListening();
  }

  getVoices() {
    if (!this.synthesis) {
      return [];
    }
    return this.synthesis.getVoices();
  }
}

export const voiceAssistant = new VoiceAssistant();
