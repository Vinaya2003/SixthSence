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
        } else if ('webkitSpeechRecognition' in window) {
            recognition = new window.webkitSpeechRecognition();
        } else {
            console.warn('Speech recognition not supported in this browser');
            speakText('Speech recognition is not supported in your browser. Please use a modern browser like Chrome or Edge.');
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
    } catch (error) {
        console.error('Error initializing speech recognition:', error);
        speakText('Error initializing speech recognition. Please check your microphone permissions.');
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
        speakText('Speech recognition is not available. Please check your browser support and microphone permissions.');
        return;
    }
    
    try {
        // Reset the final message text
        finalMessageText = '';
        
        // If already recognizing, stop first
        if (isRecognizing) {
            recognition.stop();
        }
        
        // Request microphone permission first
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                recognition.start();
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
            })
            .catch(error => {
                console.error('Microphone access denied:', error);
                speakText('Microphone access denied. Please allow microphone access to use voice input.');
            });
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        speakText('Error starting speech recognition. Please try again.');
    }
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
    
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly into your microphone.';
            break;
        case 'aborted':
            errorMessage = 'Speech recognition was aborted. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = 'No microphone detected. Please check your microphone connection.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
            break;
        case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
        case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed. Please check your browser settings.';
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