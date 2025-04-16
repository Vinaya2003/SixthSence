// Gesture detection variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchStartTime = 0;
let touchEndTime = 0;
let longPressThreshold = 1000; // 1 second for long press
let longPressTimer;
let isLongPressed = false;

// Initialize gesture detection
function initGestureDetection() {
    const mainScreen = document.getElementById('main-screen');
    
    // Add touch event listeners
    mainScreen.addEventListener('touchstart', handleTouchStart, false);
    mainScreen.addEventListener('touchmove', handleTouchMove, false);
    mainScreen.addEventListener('touchend', handleTouchEnd, false);
    
    // Add mouse event listeners for desktop testing
    mainScreen.addEventListener('mousedown', handleMouseDown, false);
    mainScreen.addEventListener('mousemove', handleMouseMove, false);
    mainScreen.addEventListener('mouseup', handleMouseUp, false);
    
    console.log('Gesture detection initialized');
}

// Touch event handlers
function handleTouchStart(event) {
    // Check if we're on the message screen - if so, only handle taps, not swipes
    if (isMessageScreenActive()) {
        return;
    }
    
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartTime = new Date().getTime();
    
    // Start timer for long press detection
    longPressTimer = setTimeout(() => {
        isLongPressed = true;
        showAssistiveFeedback('Long press detected. Hold for SOS.');
        speakText('Long press detected. Hold for SOS.');
    }, longPressThreshold);
}

function handleTouchMove(event) {
    // Check if we're on the message screen - if so, only handle taps, not swipes
    if (isMessageScreenActive()) {
        return;
    }
    
    // Cancel long press if user moves finger
    if (Math.abs(event.touches[0].clientX - touchStartX) > 10 || 
        Math.abs(event.touches[0].clientY - touchStartY) > 10) {
        clearTimeout(longPressTimer);
        isLongPressed = false;
    }
}

function handleTouchEnd(event) {
    // Check if we're on the message screen - if so, only handle taps, not swipes
    if (isMessageScreenActive()) {
        return;
    }
    
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    touchEndTime = new Date().getTime();
    
    clearTimeout(longPressTimer);
    
    // Check if it's a long press (hold)
    const touchDuration = touchEndTime - touchStartTime;
    if (touchDuration >= longPressThreshold && isLongPressed) {
        handleHoldGesture();
        isLongPressed = false;
        return;
    }
    
    // Calculate swipe direction
    handleSwipe();
}

// Mouse event handlers (for desktop testing)
function handleMouseDown(event) {
    // Check if we're on the message screen - if so, only handle taps, not swipes
    if (isMessageScreenActive()) {
        return;
    }
    
    touchStartX = event.clientX;
    touchStartY = event.clientY;
    touchStartTime = new Date().getTime();
    
    // Start timer for long press detection
    longPressTimer = setTimeout(() => {
        isLongPressed = true;
        showAssistiveFeedback('Long press detected. Hold for SOS.');
        speakText('Long press detected. Hold for SOS.');
    }, longPressThreshold);
}

function handleMouseMove(event) {
    // Check if we're on the message screen - if so, only handle taps, not swipes
    if (isMessageScreenActive()) {
        return;
    }
    
    // Only if mouse button is down
    if (event.buttons !== 1) return;
    
    // Cancel long press if user moves mouse
    if (Math.abs(event.clientX - touchStartX) > 10 || 
        Math.abs(event.clientY - touchStartY) > 10) {
        clearTimeout(longPressTimer);
        isLongPressed = false;
    }
}

function handleMouseUp(event) {
    // Check if we're on the message screen - if so, only handle taps, not swipes
    if (isMessageScreenActive()) {
        return;
    }
    
    touchEndX = event.clientX;
    touchEndY = event.clientY;
    touchEndTime = new Date().getTime();
    
    clearTimeout(longPressTimer);
    
    // Check if it's a long press (hold)
    const touchDuration = touchEndTime - touchStartTime;
    if (touchDuration >= longPressThreshold && isLongPressed) {
        handleHoldGesture();
        isLongPressed = false;
        return;
    }
    
    // Calculate swipe direction
    handleSwipe();
}

// Helper function to check if the message screen is currently active/visible
function isMessageScreenActive() {
    const messageScreen = document.getElementById('message-screen');
    return messageScreen && 
           window.getComputedStyle(messageScreen).display !== 'none' && 
           !messageScreen.classList.contains('hidden');
}

// Handle swipe gestures
function handleSwipe() {
    // Skip swipe handling on message screen
    if (isMessageScreenActive()) {
        console.log("Swipe detection disabled on message screen");
        return;
    }
    
    console.log("Handling swipe");
    const horizontalDistance = touchEndX - touchStartX;
    const verticalDistance = touchEndY - touchStartY;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    console.log(`Swipe detected: horizontal=${horizontalDistance}, vertical=${verticalDistance}`);
    
    // Check if the swipe is horizontal or vertical
    if (Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
        // Horizontal swipe
        if (Math.abs(horizontalDistance) < minSwipeDistance) {
            showAssistiveFeedback('Swipe not detected. Please try again with a longer swipe.');
            return;
        }
        
        if (horizontalDistance > 0) {
            // Right swipe
            handleRightSwipe();
        } else {
            // Left swipe
            handleLeftSwipe();
        }
    } else {
        // Vertical swipe
        if (Math.abs(verticalDistance) < minSwipeDistance) {
            showAssistiveFeedback('Swipe not detected. Please try again with a longer swipe.');
            return;
        }
        
        if (verticalDistance > 0) {
            // Down swipe
            console.log("DOWN SWIPE DETECTED");
            handleDownSwipe();
        } else {
            // Up swipe
            console.log("UP SWIPE DETECTED");
            handleUpSwipe();
        }
    }
}

// Specific gesture handlers
function handleLeftSwipe() {
    showAssistiveFeedback('Left swipe detected.');
    // Only process for client users
    if (currentUser && currentUser.type === 'client') {
        speakText('Opening camera to describe what is around you.');
        
        // Open camera to take photo and analyze surroundings
        if (typeof openCamera === 'function') {
            openCamera();
        } else {
            console.error('Camera functionality not available');
            speakText('Camera functionality is not available.');
        }
    }
    console.log('Left swipe - Camera Vision mode');
}

function handleRightSwipe() {
    showAssistiveFeedback('Right swipe detected.');
    // Only process for client users
    if (currentUser && currentUser.type === 'client') {
        // Get current date and time
        const now = new Date();
        const options = { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const dateTimeString = now.toLocaleDateString('en-US', options);
        
        // Show and speak the date and time
        showAssistiveFeedback(`Current time and date: ${dateTimeString}`);
        speakText(`Current time and date: ${dateTimeString}`);
    }
    console.log('Right swipe - Time and Date');
}

function handleUpSwipe() {
    // Only process for client users
    if (!currentUser || currentUser.type !== 'client') return;
    
    // Detect device type for appropriate instructions
    const isTouchDevice = ('ontouchstart' in window) || 
                        window.DocumentTouch && document instanceof DocumentTouch;
    
    const instructionText = isTouchDevice ?
        'Message interface opened. Swipe gestures are disabled here. Double-tap to start recording, double-tap again to stop and send your message.' :
        'Message interface opened. Swipe gestures are disabled here. Double-click to start recording, double-click again to stop and send your message.';
    
    showAssistiveFeedback('Up swipe detected. Message interface opened.');
    speakText(instructionText);
    
    // Navigate to message screen and ensure it's visible
    const mainScreen = document.getElementById('main-screen');
    const messageScreen = document.getElementById('message-screen');
    
    if (mainScreen && messageScreen) {
        // Hide all elements in the main screen
        document.querySelectorAll('#main-screen > div').forEach(div => {
            if (div.id !== 'message-screen') {
                div.style.display = 'none';
            }
        });
        
        // Reset styles and make message screen visible
        messageScreen.style.display = 'flex';
        messageScreen.classList.remove('hidden');
        
        // Reset any previous message
        const messageText = document.getElementById('message-text');
        if (messageText) {
            messageText.value = '';
            // Placeholder updated in setupMessageTapHandler via updateMessagePlaceholder
        }
        
        // Set up back button functionality
        setupBackButton();
        
        // Load and display previous messages
        loadAndDisplayMessages();
        
        // Set up the tap-to-record-or-send mechanism
        setupMessageTapHandler();
    } else {
        console.error('Message screen elements not found');
        speakText('Error opening message interface. Please try again.');
    }
    
    console.log('Up swipe - Message interface opened, swipe gestures disabled');
}

// Set up back button functionality
function setupBackButton() {
    const backButton = document.getElementById('message-back-btn');
    if (backButton) {
        // Remove any existing event listeners to prevent duplicates
        const newBackButton = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBackButton, backButton);
        
        // Add click event listener to the new button
        newBackButton.addEventListener('click', navigateBackToMainScreen);
    }
}

// Navigate back to main dashboard from message screen
function navigateBackToMainScreen() {
    // First, announce the action for accessibility
    showAssistiveFeedback('Returning to main screen');
    speakText('Returning to main screen');
    
    // Hide message screen
    const messageScreen = document.getElementById('message-screen');
    if (messageScreen) {
        messageScreen.style.display = 'none';
        messageScreen.classList.add('hidden');
    }
    
    // Show client dashboard
    const dashboard = document.querySelector('.client-dashboard');
    if (dashboard) {
        dashboard.style.display = 'flex';
    } else {
        // If dashboard not found, make all main screen divs visible
        document.querySelectorAll('#main-screen > div').forEach(div => {
            if (div.id !== 'message-screen') {
                div.style.display = 'block';
            }
        });
    }
    
    // Stop any ongoing recording
    if (typeof stopRecognition === 'function' && isCurrentlyRecording) {
        stopRecognition();
        isCurrentlyRecording = false;
    }
    
    console.log('Navigated back to main dashboard');
}

// Function to load and display messages
function loadAndDisplayMessages() {
    // If the global updateMessageDisplays function exists, use it
    if (typeof updateMessageDisplays === 'function') {
        updateMessageDisplays();
    } else {
        // Otherwise, implement a basic version here
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        // Get messages from localStorage
        let messages = [];
        try {
            const storedMessages = localStorage.getItem('visionVoiceMessages');
            if (storedMessages) {
                messages = JSON.parse(storedMessages);
            }
        } catch (e) {
            console.error('Error loading messages:', e);
        }
        
        // Display messages
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-messages">No messages yet.</div>';
            return;
        }
        
        // Clear existing messages
        messagesContainer.innerHTML = '';
        
        // Sort messages by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Display messages
        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = message.content;
            messageDiv.appendChild(contentDiv);
            
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'message-time';
            
            // Format timestamp
            let timeText = '';
            try {
                const date = new Date(message.timestamp);
                timeText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                timeText = 'Unknown time';
            }
            
            timestampDiv.textContent = timeText;
            messageDiv.appendChild(timestampDiv);
            
            messagesContainer.appendChild(messageDiv);
        });
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Function to handle tap behavior in the message screen
function setupMessageTapHandler() {
    const messageScreen = document.getElementById('message-screen');
    if (!messageScreen) return;
    
    // Remove any existing handlers to prevent duplicates
    messageScreen.removeEventListener('click', handleMessageScreenTap);
    messageScreen.removeEventListener('touchstart', handleMessageScreenTouchStart);
    messageScreen.removeEventListener('touchend', handleMessageScreenTouch);
    
    // Feature detection for touch events
    const touchSupported = ('ontouchstart' in window) || 
                          window.DocumentTouch && document instanceof DocumentTouch;
    
    // Add handlers based on device capabilities
    messageScreen.addEventListener('click', handleMessageScreenTap);
    
    if (touchSupported) {
        console.log('Touch events supported - using native touch handlers');
        messageScreen.addEventListener('touchstart', handleMessageScreenTouchStart);
        messageScreen.addEventListener('touchend', handleMessageScreenTouch);
    } else {
        console.log('Touch events not supported - using click-only mode');
        // On non-touch devices, we only need click events which are already added
    }
    
    // Set appropriate instructions based on device capabilities
    updateMessagePlaceholder(touchSupported);
    
    // Reset the detection variables
    lastMessageTapTime = 0;
    lastMessageTouchTime = 0;
    
    // Also ensure that we reset the recording state when switching to the message screen
    isCurrentlyRecording = false;
    
    console.log('Message screen handlers set up for both web and mobile');
}

// Update the message placeholder text based on device capabilities
function updateMessagePlaceholder(isTouchDevice) {
    const messageText = document.getElementById('message-text');
    if (messageText) {
        if (isTouchDevice) {
            messageText.placeholder = 'Double-tap to record your message';
        } else {
            messageText.placeholder = 'Double-click to record your message';
        }
    }
}

// Variables for tracking tap/touch state
let isCurrentlyRecording = false;
let lastMessageTapTime = 0;
let lastMessageTouchTime = 0;

// Handler for touch start events on message screen
function handleMessageScreenTouchStart(event) {
    // Store the position but don't interfere with other handlers
    if (event.touches && event.touches[0]) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
}

// Handler for mouse clicks (primarily for web browsers)
function handleMessageScreenTap(event) {
    // Prevent default actions
    event.preventDefault();
    
    // Ignore clicks on specific elements
    if (event.target.id === 'send-btn' || 
        event.target.closest('#send-btn') ||
        event.target.id === 'message-back-btn' || 
        event.target.closest('#message-back-btn')) {
        return;
    }
    
    // Double-tap detection logic
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastMessageTapTime;
    
    console.log('Click detected in message screen, tapLength:', tapLength);
    
    // If it's a double-tap (tap within 300ms of last tap)
    if (tapLength < 300 && tapLength > 0) {
        console.log('Double-click detected, recording state:', isCurrentlyRecording);
        toggleRecording();
    }
    
    // Update the last tap time
    lastMessageTapTime = currentTime;
}

// Handler for touch events (primarily for mobile devices)
function handleMessageScreenTouch(event) {
    // Prevent the event from being processed as a mouse click too
    event.preventDefault();
    
    // Get the touched element
    const target = event.target || (event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].target : null);
    if (!target) return;
    
    // Ignore touches on specific elements
    if (target.id === 'send-btn' || 
        target.closest('#send-btn') ||
        target.id === 'message-back-btn' || 
        target.closest('#message-back-btn')) {
        return;
    }
    
    // Check if this is a small movement (not a swipe)
    if (event.changedTouches && event.changedTouches[0]) {
        const touch = event.changedTouches[0];
        const moveX = Math.abs(touch.clientX - touchStartX);
        const moveY = Math.abs(touch.clientY - touchStartY);
        
        // If movement is too large, it might be a swipe attempt, not a tap
        if (moveX > 30 || moveY > 30) {
            console.log('Touch movement too large, ignoring as possible swipe');
            return;
        }
    }
    
    // Double-tap detection logic for touch events
    const currentTime = new Date().getTime();
    const touchLength = currentTime - lastMessageTouchTime;
    
    console.log('Touch detected in message screen, touchLength:', touchLength);
    
    // If it's a double-tap (tap within 300ms of last tap)
    if (touchLength < 300 && touchLength > 0) {
        console.log('Double-touch detected, recording state:', isCurrentlyRecording);
        
        // Add small delay to prevent accidental touch events
        setTimeout(() => {
            toggleRecording();
        }, 10);
    }
    
    // Update the last touch time
    lastMessageTouchTime = currentTime;
}

// Shared function to toggle recording state
function toggleRecording() {
    if (!isCurrentlyRecording) {
        // Start recording
        startRecording();
        isCurrentlyRecording = true;
    } else {
        // Stop recording and send
        stopRecordingAndSend();
        isCurrentlyRecording = false;
    }
}

// Function to start voice recording
function startRecording() {
    if (typeof startRecognition === 'function') {
        startRecognition();
        
        // Use appropriate device terminology
        const isTouchDevice = ('ontouchstart' in window) || 
                            window.DocumentTouch && document instanceof DocumentTouch;
        
        const instructionText = isTouchDevice ? 
            'Recording started. Double-tap again to stop and send.' : 
            'Recording started. Double-click again to stop and send.';
        
        showAssistiveFeedback(instructionText);
        speakText(instructionText);
    } else {
        console.error('Speech recognition function not available');
        showAssistiveFeedback('Voice recording not available. Please try again.');
        speakText('Voice recording is not available on this device.');
    }
}

// Function to stop recording and send the message
function stopRecordingAndSend() {
    if (typeof stopRecognition === 'function') {
        stopRecognition();
        
        // Small delay to ensure the final transcript is processed
        setTimeout(() => {
            const messageText = document.getElementById('message-text');
            if (messageText && messageText.value.trim()) {
                // Call the send message function
                if (typeof sendMessage === 'function') {
                    sendMessage();
                    showAssistiveFeedback('Message sent successfully.');
                    speakText('Message sent successfully.');
                    
                    // Keep the message interface open for continued conversation
                    setTimeout(() => {
                        messageText.value = '';
                        messageText.placeholder = 'Double-tap to record your next message';
                    }, 2000);
                } else {
                    showAssistiveFeedback('Could not send message. Please try again.');
                    speakText('Could not send message. Please try again.');
                }
            } else {
                showAssistiveFeedback('No message to send. Please try again.');
                speakText('No message to send. Please try again.');
            }
        }, 500); // Wait 500ms for final transcript
    }
}

function handleDownSwipe() {
    // Only process for client users
    if (!currentUser || currentUser.type !== 'client') {
        console.log("Ignoring down swipe - not a client user");
        return;
    }
    
    console.log('Down swipe detected - attempting to read message');
    showAssistiveFeedback('Down swipe detected. Reading last message from admin.');
    
    // Find the last admin message by accessing the global messages array
    let foundMessage = false;
    
    if (typeof window.messages !== 'undefined' && window.messages.length > 0) {
        // Use the global messages array
        for (let i = window.messages.length - 1; i >= 0; i--) {
            if (window.messages[i].sender === 'admin') {
                speakText(`Message from admin: ${window.messages[i].content}`);
                foundMessage = true;
                console.log("Read admin message:", window.messages[i].content);
                break;
            }
        }
    } else {
        console.error("Global messages array not available");
    }
    
    // If no messages found
    if (!foundMessage) {
        speakText("No messages from admin yet.");
        console.log("No admin messages found to read");
    }
}

function handleHoldGesture() {
    // Only process for client users
    if (!currentUser || currentUser.type !== 'client') return;
    
    showAssistiveFeedback('Hold gesture detected. SOS activated!');
    speakText('SOS mode activated. Your location has been sent to the admin. Hold again to cancel.');
    activateSOS();
    console.log('Hold gesture - SOS');
}

// Display assistive feedback
function showAssistiveFeedback(message) {
    const assistiveOverlay = document.getElementById('assistive-overlay');
    const assistiveFeedback = document.getElementById('assistive-feedback');
    
    assistiveFeedback.textContent = message;
    assistiveOverlay.classList.add('active');
    
    // Hide overlay after 3 seconds
    setTimeout(() => {
        assistiveOverlay.classList.remove('active');
    }, 3000);
} 