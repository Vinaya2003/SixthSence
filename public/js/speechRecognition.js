// Speech recognition variables
let recognition = null;
let isRecognizing = false;
let recognitionTimeout = null;
let recognitionMaxDuration = 30000; // 30 seconds maximum for recognition
let finalMessageText = ''; // Store the complete message

// Initialize speech recognition
function initSpeechRecognition() {
    try {
        // Check if browser supports speech recognition
        if ('SpeechRecognition' in window) {
            recognition = new window.SpeechRecognition();
            console.log('Using standard SpeechRecognition API');
        } else if ('webkitSpeechRecognition' in window) {
            recognition = new window.webkitSpeechRecognition();
            console.log('Using webkit prefixed SpeechRecognition API');
        } else {
            console.warn('Speech recognition not supported in this browser');
            speakText('Speech recognition is not supported in your browser. Please use a modern browser like Chrome or Edge.');
            // Set recognition to null to indicate it's not available
            recognition = null;
            return;
        }
        
        // Set recognition properties
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3; // Get more alternatives for better accuracy
        
        // Add event listeners
        recognition.onstart = handleRecognitionStart;
        recognition.onresult = handleRecognitionResult;
        recognition.onerror = handleRecognitionError;
        recognition.onend = handleRecognitionEnd;
        
        console.log('Speech recognition initialized');
        
        // Test recognition by requesting permission immediately
        // This helps on mobile where permissions might need to be requested before using
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                console.log('Microphone permission granted during init');
            })
            .catch(error => {
                console.error('Microphone permission denied during init:', error);
                alert('Please enable microphone access to use voice recognition features. You may need to go to browser settings to grant permission.');
            });
    } catch (error) {
        console.error('Error initializing speech recognition:', error);
        speakText('Error initializing speech recognition. Please check your microphone permissions.');
        recognition = null;
    }
}

// Handle voice input button click
function toggleVoiceInput() {
    if (isRecognizing) {
        stopRecognition();
        isRecording = false; // Update global state
    } else {
        startRecognition();
        isRecording = true; // Update global state
    }
}

// Start speech recognition
function startRecognition() {
    if (!recognition) {
        // Try to reinitialize if recognition is null
        initSpeechRecognition();
        
        // Check again after initialization attempt
        if (!recognition) {
            console.error('Speech recognition not available on this browser');
            speakText('Speech recognition is not available. Please check your browser support and microphone permissions.');
            showAssistiveFeedback('Speech recognition not available. Try a different browser like Chrome.');
            return;
        }
    }
    
    try {
        // Reset the final message text
        finalMessageText = '';
        
        // If already recognizing, stop first
        if (isRecognizing) {
            recognition.stop();
            // Small delay to ensure previous session is properly closed
            setTimeout(() => {
                startActualRecognition();
            }, 200);
        } else {
            startActualRecognition();
        }
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        speakText('Error starting speech recognition. Please try again.');
        showAssistiveFeedback('Speech recognition error. Please try again.');
    }
}

// Separate function to handle the actual recognition start
// This helps with mobile browser quirks
function startActualRecognition() {
    // Request microphone permission first
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            try {
                // For mobile devices, we need to handle the start process differently
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                
                if (isMobile) {
                    // On mobile, we need to be more careful about recognition state
                    if (isRecognizing) {
                        console.log('Already recognizing, skipping start');
                        return;
                    }
                    
                    // Mobile browsers sometimes need this flag set before starting
                    recognition.continuous = false; // Sometimes works better on mobile
                    recognition.interimResults = true;
                }
                
                // Start recognition
                recognition.start();
                console.log('Recognition started successfully');
                
                // Visual feedback - change background color of message area
                const messageText = document.getElementById('message-text');
                if (messageText) {
                    messageText.classList.add('recording');
                    messageText.placeholder = 'Listening... Speak your message';
                    messageText.value = ''; // Clear any previous text
                }
                
                // Set a timeout to stop recognition after maximum duration
                clearTimeout(recognitionTimeout);
                recognitionTimeout = setTimeout(() => {
                    if (isRecognizing) {
                        stopRecognition();
                        speakText('Recording stopped automatically. Your message will be sent.');
                    }
                }, recognitionMaxDuration);
                
                // Additional feedback for users
                showAssistiveFeedback('Listening... Speak your message now');
            } catch (startError) {
                console.error('Error starting recognition after permission granted:', startError);
                speakText('Error starting speech recognition. Please try again or use text input.');
            }
        })
        .catch(error => {
            console.error('Microphone access denied:', error);
            speakText('Microphone access denied. Please allow microphone access to use voice input.');
            showAssistiveFeedback('Microphone access needed for voice input');
            
            // On mobile, often we need to specifically prompt for permission
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                alert('Please grant microphone access in your browser settings to use voice input.');
            }
        });
}

// Stop speech recognition
function stopRecognition() {
    if (!recognition || !isRecognizing) return;
    
    try {
        recognition.stop();
        clearTimeout(recognitionTimeout);
        
        // Visual feedback - remove recording styles
        const messageText = document.getElementById('message-text');
        if (messageText) {
            messageText.classList.remove('recording');
            messageText.placeholder = 'Message will be sent automatically';
            
            // Final cleanup of the message
            if (finalMessageText) {
                messageText.value = finalMessageText.trim();
            }
        }
        
        isRecognizing = false;
    } catch (error) {
        console.error('Error stopping speech recognition:', error);
    }
}

// Handle recognition results
function handleRecognitionResult(event) {
    const messageText = document.getElementById('message-text');
    if (!messageText) return;
    
    let interimTranscript = '';
    let finalTranscript = '';
    
    // Process each result
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Get the most confident result
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
            // For final results, append to the final message
            finalTranscript = transcript;
            // Update the complete message
            if (finalMessageText) {
                finalMessageText += ' ' + finalTranscript;
            } else {
                finalMessageText = finalTranscript;
            }
            // Clean up and display the complete message
            finalMessageText = finalMessageText.trim();
            // Capitalize first letter of sentences
            finalMessageText = finalMessageText.replace(/([.!?]\s+)([a-z])/g, 
                (match, p1, p2) => p1 + p2.toUpperCase()
            );
            finalMessageText = finalMessageText.charAt(0).toUpperCase() + finalMessageText.slice(1);
            
            messageText.value = finalMessageText;
        } else {
            // For interim results, show them temporarily
            interimTranscript = transcript;
            // Show interim results along with any final text we have
            messageText.value = finalMessageText + ' ' + interimTranscript;
        }
    }
    
    // Provide visual feedback for new text
    if (finalTranscript) {
        messageText.classList.add('highlight');
        setTimeout(() => {
            messageText.classList.remove('highlight');
        }, 500);
    }
}

// Handle recognition start
function handleRecognitionStart() {
    isRecognizing = true;
    console.log('Recognition started');
}

// Handle recognition end
function handleRecognitionEnd() {
    isRecognizing = false;
    console.log('Recognition ended');
    
    // If recognition ends unexpectedly, restart it if we're still supposed to be recording
    if (isRecognizing) {
        console.log('Recognition ended unexpectedly, restarting...');
        startRecognition();
    }
}

// Handle recognition errors
function handleRecognitionError(event) {
    console.error('Recognition error:', event.error);
    
    let errorMessage = 'Error with speech recognition.';
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly into your microphone.';
            break;
        case 'aborted':
            errorMessage = 'Speech recognition was aborted. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = isMobile ? 
                'No microphone access. Please check your device settings and browser permissions.' : 
                'No microphone detected. Please check your microphone connection.';
            break;
        case 'not-allowed':
            errorMessage = isMobile ? 
                'Microphone access denied. You must allow microphone access in your device settings.' : 
                'Microphone access denied. Please allow microphone access in your browser settings.';
            
            // On mobile, we need to guide users to settings
            if (isMobile) {
                // Separate instructions for iOS vs Android
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    setTimeout(() => {
                        alert('On iOS, you need to allow microphone access in Settings > Safari > Microphone.');
                    }, 1000);
                } else if (/Android/i.test(navigator.userAgent)) {
                    setTimeout(() => {
                        alert('On Android, please check your browser settings or tap the lock/info icon in the address bar to manage site permissions.');
                    }, 1000);
                }
            }
            break;
        case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
        case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed. Please check your browser settings.';
            break;
        case 'bad-grammar':
            errorMessage = 'Speech recognition encountered a problem understanding your speech.';
            break;
        case 'language-not-supported':
            errorMessage = 'The selected language is not supported. Switching to English.';
            // Try to switch to English
            if (recognition) {
                recognition.lang = 'en-US';
            }
            break;
    }
    
    showAssistiveFeedback(errorMessage);
    speakText(errorMessage);
    
    // Reset state
    isRecognizing = false;
    
    // Reset UI
    const messageText = document.getElementById('message-text');
    if (messageText) {
        messageText.classList.remove('recording');
        // Keep any final text we've captured
        if (!finalMessageText) {
            messageText.value = '';
        }
    }
    
    // If on mobile, add a visual cue to help users understand what happened
    if (isMobile) {
        const messageScreen = document.querySelector('.message-screen');
        if (messageScreen) {
            const errorNotice = document.createElement('div');
            errorNotice.className = 'error-notice';
            errorNotice.textContent = errorMessage;
            messageScreen.appendChild(errorNotice);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (errorNotice.parentNode) {
                    errorNotice.parentNode.removeChild(errorNotice);
                }
            }, 5000);
        }
    }
}

// Enhance accessibility for blind users
function enhanceAccessibility() {
    // Add role and aria attributes
    document.querySelectorAll('button').forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent);
        }
    });
    
    // Make input fields announce their purpose
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('focus', () => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                speakText(`${label.textContent} field. ${input.placeholder || ''}`);
            }
        });
    });
    
    // Announce screen changes
    document.querySelectorAll('.screen').forEach(screen => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && 
                    screen.classList.contains('active')) {
                    const heading = screen.querySelector('h1, h2');
                    if (heading) {
                        speakText(`Screen changed to ${heading.textContent}`);
                    }
                }
            });
        });
        
        observer.observe(screen, { attributes: true });
    });
} 