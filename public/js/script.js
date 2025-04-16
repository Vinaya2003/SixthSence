// PWA Installation
let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';
installButton.textContent = 'Install App';
document.body.appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
        installButton.style.display = 'none';
    }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/public/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const messageScreen = document.getElementById('message-screen');
const adminScreen = document.getElementById('admin-screen');
const sosScreen = document.getElementById('sos-screen');
const assistiveOverlay = document.getElementById('assistive-overlay');
const assistiveFeedback = document.getElementById('assistive-feedback');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const userTypeSelect = document.getElementById('user-type');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const backBtn = document.getElementById('back-btn');
const screenTitle = document.getElementById('screen-title');
const userInfo = document.getElementById('user-info');
const gestureContainer = document.getElementById('gesture-container');
const messagesContainer = document.getElementById('messages-container');
const adminMessagesContainer = document.getElementById('admin-messages-container');
const messageText = document.getElementById('message-text');
const adminMessageText = document.getElementById('admin-message-text');
const voiceInputBtn = document.getElementById('voice-input-btn');
const sendBtn = document.getElementById('send-btn');
const adminSendBtn = document.getElementById('admin-send-btn');
const cancelSosBtn = document.getElementById('cancel-sos-btn');

// Admin password modal elements
const adminPasswordModal = document.getElementById('admin-password-modal');
const adminPasswordInput = document.getElementById('admin-password');
const adminPasswordSubmit = document.getElementById('admin-password-submit');
const adminPasswordCancel = document.getElementById('admin-password-cancel');
const adminPasswordError = document.getElementById('admin-password-error');

// Admin password (in a real app, this would be securely stored)
const ADMIN_PASSWORD = 'test';

// Sample users for demo
const users = {
    admin: { username: 'admin', password: 'admin123', type: 'admin' },
    client: { username: 'user', password: 'user123', type: 'client' }
};

// Current user and app state
let currentUser = null;
let currentScreen = 'login';
let isRecording = false;
let messagePollingInterval = null; // For real-time message polling

// Sample messages for demo
const messages = [
    {
        sender: 'admin',
        content: 'Welcome to Vision Voice! How can I help you today?',
        timestamp: new Date()
    },
    {
        sender: 'client',
        content: 'Hello, I need assistance with navigation.',
        timestamp: new Date()
    }
];

// Make messages array globally accessible
window.messages = messages;

// Store messages in localStorage
let adminInbox = [];

// Initialize the application
function initApp() {
    // Load saved messages from localStorage
    const savedMessages = localStorage.getItem('visionVoiceMessages');
    if (savedMessages) {
        try {
            const parsedMessages = JSON.parse(savedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                // Convert string timestamps back to Date objects
                parsedMessages.forEach(msg => {
                    msg.timestamp = new Date(msg.timestamp);
                });
                // Replace the messages array with saved messages
                while (messages.length) messages.pop(); // Clear array
                parsedMessages.forEach(msg => messages.push(msg)); // Add saved messages
                console.log("Loaded saved messages:", messages.length);
            }
        } catch (e) {
            console.error("Error loading saved messages:", e);
        }
    }

    // Add event listeners for direct access buttons
    const clientBtn = document.getElementById('client-btn');
    const adminBtn = document.getElementById('admin-btn');
    
    if (clientBtn) {
        clientBtn.addEventListener('click', () => directAccess('client'));
    }
    
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPasswordModal);
    }
    
    // Handle back button - need to select all instances since they share the same ID
    const backButtons = document.querySelectorAll('#back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', navigateBack);
    });
    
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    // Add admin send button listener
    const adminSendButton = document.getElementById('admin-send-btn');
    if (adminSendButton) {
        adminSendButton.addEventListener('click', sendAdminMessage);
        console.log('Admin send button listener added');
    } else {
        console.warn('Admin send button not found');
    }
    
    if (voiceInputBtn) voiceInputBtn.addEventListener('click', toggleVoiceInput);
    if (cancelSosBtn) cancelSosBtn.addEventListener('click', cancelSOS);
    
    // Add tap event to the entire document for client accessibility
    document.addEventListener('click', handleScreenTap);
    
    // Initialize speech synthesis for accessibility
    if (typeof initSpeechSynthesis === 'function') {
        initSpeechSynthesis();
    }
    
    // Initialize speech recognition
    if (typeof initSpeechRecognition === 'function') {
        initSpeechRecognition();
    }
    
    // Initialize camera functionality
    if (typeof initCameraFunctionality === 'function') {
        initCameraFunctionality();
    }
    
    // Initialize gesture detection
    if (typeof initGestureDetection === 'function') {
        initGestureDetection();
    }
    
    // Initialize the client dashboard accessibility features
    initClientDashboardAccessibility();
    
    // Initialize help button
    initHelpButton();
    
    // Log initialization status
    console.log('App initialized with', messages.length, 'messages');
    
    // Announce app loaded only for screen readers
    speakText("Vision Voice app loaded. Select client or admin to continue.");
    
    // Initialize admin dashboard buttons
    initAdminDashboard();
    
    // Load messages
    loadMessages();
}

// Function for direct access (no login required)
function directAccess(userType) {
    // Set the current user based on type
    if (userType === 'admin') {
        currentUser = { ...users.admin, username: 'Admin' };
        userInfo.textContent = 'Admin';
        navigateTo('admin');
        
        // Get device information for admin dashboard
        updateClientDeviceInfo();
    } else if (userType === 'client') {
        currentUser = { ...users.client, username: 'Client' };
        userInfo.textContent = 'Client';
        navigateTo('main');
        speakText(`Welcome. Swipe up to send message, swipe down to read the last message from admin.`);
        
        // Store client device info in localStorage
        storeClientDeviceInfo();
    }
    
    // Start real-time message polling
    startMessagePolling();
}

// Store client device information when a client logs in
function storeClientDeviceInfo() {
    // Gather comprehensive device information
    const deviceInfo = {
        userAgent: navigator.userAgent,
        deviceName: getDeviceName(),
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth,
        connection: getConnectionInfo(),
        lastActive: new Date().toISOString(),
        // Try to get more detailed device info from client hints if available
        brandInfo: getBrandModel()
    };
    
    // Function to update location
    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const stored = localStorage.getItem('clientDeviceInfo');
                    if (stored) {
                        try {
                            const info = JSON.parse(stored);
                            info.location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                speed: position.coords.speed,
                                heading: position.coords.heading,
                                timestamp: new Date().toISOString()
                            };
                            info.lastActive = new Date().toISOString();
                            info.connection = getConnectionInfo();
                            localStorage.setItem('clientDeviceInfo', JSON.stringify(info));
                        } catch (e) {
                            console.error('Error updating location:', e);
                        }
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }
    };
    
    localStorage.setItem('clientDeviceInfo', JSON.stringify(deviceInfo));
    
    // Update activity and location status periodically while client is active
    if (currentUser && currentUser.type === 'client') {
        // Initial location update
        updateLocation();
        
        // Update location every 5 seconds
        setInterval(updateLocation, 5000);
        
        // Update activity status every 5 seconds
        setInterval(() => {
            const stored = localStorage.getItem('clientDeviceInfo');
            if (stored) {
                try {
                    const info = JSON.parse(stored);
                    info.lastActive = new Date().toISOString();
                    info.connection = getConnectionInfo();
                    localStorage.setItem('clientDeviceInfo', JSON.stringify(info));
                } catch (e) {
                    console.error('Error updating client activity:', e);
                }
            }
        }, 5000);
    }
    
    console.log('Real-time client device info stored:', deviceInfo);
}

// Try to get device brand and model from client hints API
function getBrandModel() {
    // Check if User-Agent Client Hints are supported
    if (navigator.userAgentData) {
        return new Promise((resolve) => {
            navigator.userAgentData.getHighEntropyValues([
                "platform", "platformVersion", "model", "brand"
            ]).then(ua => {
                resolve({
                    brand: ua.brand,
                    model: ua.model,
                    platform: ua.platform,
                    platformVersion: ua.platformVersion
                });
            }).catch(error => {
                console.log('Error getting client hints:', error);
                resolve(null);
            });
        });
    }
    return null;
}

// Get connection information if available
function getConnectionInfo() {
    // Check if Network Information API is available
    if (navigator.connection) {
        return {
            type: navigator.connection.effectiveType || 'unknown',
            downlink: navigator.connection.downlink || 'unknown',
            rtt: navigator.connection.rtt || 'unknown',
            saveData: navigator.connection.saveData || false
        };
    }
    return 'unknown';
}

// Update client device information in the admin dashboard
function updateClientDeviceInfo() {
    const clientInfoSection = document.querySelector('.client-info-section');
    const deviceNameElement = document.querySelector('.client-device .device-name');
    const deviceInfoElement = document.querySelector('.client-device .device-info');
    
    if (!deviceNameElement || !deviceInfoElement || !clientInfoSection) return;
    
    // Try to get actual client device info from localStorage
    const storedInfo = localStorage.getItem('clientDeviceInfo');
    
    if (storedInfo) {
        try {
            const deviceInfo = JSON.parse(storedInfo);
            
            // Try to get the most accurate device name
            let deviceName = "Unknown Device";
            
            // Check for client hints API info first (most accurate)
            if (deviceInfo.brandInfo && deviceInfo.brandInfo.model) {
                deviceName = `${deviceInfo.brandInfo.brand} ${deviceInfo.brandInfo.model}`;
            } else {
                // Fall back to user agent detection
                deviceName = deviceInfo.deviceName || getDeviceNameFromUserAgent(deviceInfo.userAgent);
            }
            
            // Check if the client info is recent (less than 30 seconds old for real-time status)
            const lastActive = new Date(deviceInfo.lastActive || 0);
            const timeSinceActive = new Date() - lastActive;
            const isActive = timeSinceActive < 30 * 1000; // 30 seconds
            const isRecent = timeSinceActive < 2 * 60 * 1000; // 2 minutes
            
            // Set appropriate status text with timing
            let statusText = "";
            if (isActive) {
                statusText = "Active Now";
                clientInfoSection.classList.add('active-client');
                clientInfoSection.classList.remove('recent-client', 'inactive-client');
            } else if (isRecent) {
                const secondsAgo = Math.floor(timeSinceActive / 1000);
                statusText = `Active ${secondsAgo}s ago`;
                clientInfoSection.classList.remove('active-client', 'inactive-client');
                clientInfoSection.classList.add('recent-client');
            } else {
                const minutesAgo = Math.floor(timeSinceActive / (60 * 1000));
                statusText = minutesAgo < 60 
                    ? `Inactive (${minutesAgo}m ago)` 
                    : `Inactive (${Math.floor(minutesAgo / 60)}h ago)`;
                clientInfoSection.classList.remove('active-client', 'recent-client');
                clientInfoSection.classList.add('inactive-client');
            }
            
            // Build complete HTML for the device info
            let htmlContent = '';
            
            // First, create the name and status
            htmlContent += `<div class="device-name">
                <strong>${deviceName}</strong> 
                <span class="status-indicator ${isActive ? 'active' : isRecent ? 'recent' : 'inactive'}">
                    ${isActive ? '<span class="pulse-indicator"></span>' : ''}
                    (${statusText})
                </span>
            </div>`;
            
            // Create a more detailed device description
            let connectionText = '';
            if (deviceInfo.connection && deviceInfo.connection !== 'unknown') {
                if (typeof deviceInfo.connection === 'object' && deviceInfo.connection.type) {
                    connectionText = deviceInfo.connection.type.toUpperCase();
                    // Add connection speed if available
                    if (deviceInfo.connection.downlink) {
                        connectionText += ` (${deviceInfo.connection.downlink} Mbps)`;
                    }
                } else if (typeof deviceInfo.connection === 'string') {
                    connectionText = deviceInfo.connection;
                }
            }
            
            // Get OS version if available
            let osInfo = '';
            if (deviceInfo.brandInfo && deviceInfo.brandInfo.platform && deviceInfo.brandInfo.platformVersion) {
                osInfo = `${deviceInfo.brandInfo.platform} ${deviceInfo.brandInfo.platformVersion}`;
            } else if (deviceInfo.userAgent) {
                // Extract OS info from user agent
                if (deviceInfo.userAgent.match(/Android\s+([\d\.]+)/i)) {
                    osInfo = `Android ${deviceInfo.userAgent.match(/Android\s+([\d\.]+)/i)[1]}`;
                } else if (deviceInfo.userAgent.match(/iPhone\s+OS\s+([\d_]+)/i)) {
                    osInfo = `iOS ${deviceInfo.userAgent.match(/iPhone\s+OS\s+([\d_]+)/i)[1].replace(/_/g, '.')}`;
                } else if (deviceInfo.userAgent.match(/Windows NT\s+([\d\.]+)/i)) {
                    const winVer = deviceInfo.userAgent.match(/Windows NT\s+([\d\.]+)/i)[1];
                    if (winVer === '10.0') osInfo = 'Windows 10/11';
                    else if (winVer === '6.3') osInfo = 'Windows 8.1';
                    else if (winVer === '6.2') osInfo = 'Windows 8';
                    else if (winVer === '6.1') osInfo = 'Windows 7';
                    else osInfo = `Windows (${winVer})`;
                }
            }
            
            // Display additional device details
            const resolutionText = deviceInfo.screenWidth && deviceInfo.screenHeight 
                ? `${deviceInfo.screenWidth}×${deviceInfo.screenHeight}` 
                : '';
                
            // Add detailed info section
            let detailsContent = '';
            
            if (osInfo) {
                detailsContent += `<span class="os-info">${osInfo}</span>`;
            }
            
            if (connectionText) {
                if (detailsContent) detailsContent += ' • ';
                detailsContent += `<span class="connection-type">${connectionText}</span>`;
            }
            
            if (resolutionText) {
                if (detailsContent) detailsContent += ' • ';
                detailsContent += `<span class="resolution">${resolutionText}</span>`;
            }
            
            // Add a last active timestamp
            const lastActiveTime = new Date(deviceInfo.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            if (detailsContent) detailsContent += ' • ';
            detailsContent += `<span class="last-seen">Last seen: ${lastActiveTime}</span>`;
            
            // Add the device details to the main HTML content
            if (detailsContent) {
                htmlContent += `<div class="device-details">${detailsContent}</div>`;
            }
            
            // Update the DOM with all the info
            deviceInfoElement.innerHTML = htmlContent;
        } catch (e) {
            console.error('Error parsing client device info:', e);
            // Fall back to default device name if stored data is invalid
            setDefaultDeviceName(deviceInfoElement);
        }
    } else {
        // No stored client info, use default
        setDefaultDeviceName(deviceInfoElement);
        // Remove active classes
        clientInfoSection.classList.remove('active-client', 'recent-client');
        clientInfoSection.classList.add('inactive-client');
    }
}

// Set default device name when no client info is available
function setDefaultDeviceName(deviceInfoElement) {
    deviceInfoElement.innerHTML = `
        <div class="device-name">
            <strong>Waiting for device...</strong> 
            <span class="status-indicator inactive">(No Data)</span>
        </div>
        <div class="device-details">
            <span class="no-client-data">No client connection data available</span>
        </div>`;
}

// Get device name based on user agent and platform
function getDeviceName() {
    try {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        // Try to get more accurate device info using client hints if available
        if (navigator.userAgentData) {
            try {
                // Request high-entropy values which may include the device model
                return navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion", "model", "architecture"])
                    .then(data => {
                        if (data.model) {
                            return `${data.model} (${data.platform})`;
                        }
                        return getDeviceNameFromUserAgent(ua, platform);
                    })
                    .catch(err => {
                        console.log('Error getting detailed device info:', err);
                        return getDeviceNameFromUserAgent(ua, platform);
                    });
            } catch (e) {
                console.log('Error with client hints API:', e);
                return getDeviceNameFromUserAgent(ua, platform);
            }
        }
        
        return getDeviceNameFromUserAgent(ua, platform);
    } catch (e) {
        console.error('Error detecting device:', e);
        return "Unknown Device";
    }
}

// Extract device name from user agent string
function getDeviceNameFromUserAgent(ua, platform) {
    if (!ua) return "Unknown Device";
    
    let deviceName = "Unknown Device";
    
    // More comprehensive device detection
    // Mobile devices first
    if (ua.match(/iPhone/i)) {
        // Try to identify iPhone models more precisely
        if (ua.match(/iPhone.*OS 17/i)) deviceName = "iPhone 15 Series";
        else if (ua.match(/iPhone.*OS 16/i)) deviceName = "iPhone 14 Series";
        else if (ua.match(/iPhone.*OS 15/i)) deviceName = "iPhone 13 Series";
        else if (ua.match(/iPhone.*OS 14/i)) deviceName = "iPhone 12 Series";
        else {
            // Map common iPhone identifiers to names
            const match = ua.match(/iPhone(?:\d+,\d+)?/i);
            const model = match ? match[0] : "iPhone";
            if (model.match(/iPhone15,\d+/)) deviceName = "iPhone 15";
            else if (model.match(/iPhone14,\d+/)) deviceName = "iPhone 14";
            else if (model.match(/iPhone13,\d+/)) deviceName = "iPhone 13";
            else if (model.match(/iPhone12,\d+/)) deviceName = "iPhone 12";
            else deviceName = "iPhone";
        }
    } 
    // Samsung devices
    else if (ua.match(/SAMSUNG|SM-|Galaxy/i)) {
        if (ua.match(/SAMSUNG SM-S9|SM-S9\d+/i)) deviceName = "Samsung Galaxy S24";
        else if (ua.match(/SAMSUNG SM-S9|SM-S91/i)) deviceName = "Samsung Galaxy S23";
        else if (ua.match(/SAMSUNG SM-S9|SM-S90/i)) deviceName = "Samsung Galaxy S22";
        else if (ua.match(/SAMSUNG SM-G99|SM-G99/i)) deviceName = "Samsung Galaxy S21";
        else if (ua.match(/SAMSUNG SM-G98|SM-G98/i)) deviceName = "Samsung Galaxy S20";
        else if (ua.match(/SAMSUNG SM-G97|SM-G97/i)) deviceName = "Samsung Galaxy S10";
        else if (ua.match(/SAMSUNG SM-G96|SM-G96/i)) deviceName = "Samsung Galaxy S9";
        else if (ua.match(/SAMSUNG SM-G95|SM-G95/i)) deviceName = "Samsung Galaxy S8";
        else if (ua.match(/Galaxy Note/i)) {
            const noteMatch = ua.match(/Galaxy Note\s*(\d+)/i);
            deviceName = noteMatch ? `Samsung ${noteMatch[0]}` : "Samsung Galaxy Note";
        }
        else if (ua.match(/Galaxy A/i)) {
            const aMatch = ua.match(/Galaxy A\d+/i);
            deviceName = aMatch ? `Samsung ${aMatch[0]}` : "Samsung Galaxy A Series";
        }
        // Extract SM-XXXX model
        else if (ua.match(/SM-[A-Z0-9]+/i)) {
            const modelMatch = ua.match(/SM-[A-Z0-9]+/i);
            deviceName = `Samsung ${modelMatch[0]}`;
        }
        else deviceName = "Samsung Galaxy Device";
    }
    // Google Pixel
    else if (ua.match(/Pixel/i)) {
        if (ua.match(/Pixel 8 Pro/i)) deviceName = "Google Pixel 8 Pro";
        else if (ua.match(/Pixel 8/i)) deviceName = "Google Pixel 8";
        else if (ua.match(/Pixel 7a/i)) deviceName = "Google Pixel 7a";
        else if (ua.match(/Pixel 7 Pro/i)) deviceName = "Google Pixel 7 Pro";
        else if (ua.match(/Pixel 7/i)) deviceName = "Google Pixel 7";
        else if (ua.match(/Pixel 6a/i)) deviceName = "Google Pixel 6a";
        else if (ua.match(/Pixel 6 Pro/i)) deviceName = "Google Pixel 6 Pro";
        else if (ua.match(/Pixel 6/i)) deviceName = "Google Pixel 6";
        else {
            const pixelMatch = ua.match(/Pixel\s+\d+[a-z]*/i);
            deviceName = pixelMatch ? `Google ${pixelMatch[0]}` : "Google Pixel";
        }
    }
    // Motorola devices
    else if (ua.match(/motorola|moto/i)) {
        if (ua.match(/edge\s+50\s+pro/i)) deviceName = "Motorola Edge 50 Pro";
        else if (ua.match(/edge\s+50\s+ultra/i)) deviceName = "Motorola Edge 50 Ultra";
        else if (ua.match(/edge\s+50\s+fusion/i)) deviceName = "Motorola Edge 50 Fusion";
        else if (ua.match(/edge\s+50/i)) deviceName = "Motorola Edge 50";
        else if (ua.match(/edge\s+40\s+pro/i)) deviceName = "Motorola Edge 40 Pro";
        else if (ua.match(/edge\s+40/i)) deviceName = "Motorola Edge 40";
        else if (ua.match(/edge\s+\d+/i)) {
            const edgeMatch = ua.match(/edge\s+\d+[a-z\s]*/i);
            deviceName = edgeMatch ? `Motorola ${edgeMatch[0]}` : "Motorola Edge";
        }
        else if (ua.match(/razr/i)) deviceName = "Motorola Razr";
        else if (ua.match(/moto\s+g/i)) {
            const gMatch = ua.match(/moto\s+g[^\s;)]+/i);
            deviceName = gMatch ? `Motorola ${gMatch[0]}` : "Motorola Moto G";
        }
        else {
            // Try to extract the model name from user agent
            const motoMatch = ua.match(/moto\s+[a-z0-9]+/i);
            deviceName = motoMatch ? `Motorola ${motoMatch[0]}` : "Motorola Device";
        }
    }
    // OnePlus devices
    else if (ua.match(/OnePlus/i)) {
        const oneplus = ua.match(/OnePlus\s+\d+\s*(?:Pro|T|R|Nord)?/i);
        deviceName = oneplus ? oneplus[0] : "OnePlus Device";
    }
    // Xiaomi/Redmi devices
    else if (ua.match(/Mi\s+\d+/i)) {
        const mi = ua.match(/Mi\s+\d+[^\s;)]+/i);
        deviceName = mi ? `Xiaomi ${mi[0]}` : "Xiaomi Device";
    }
    else if (ua.match(/Redmi/i)) {
        const redmi = ua.match(/Redmi[^\s;)]+/i);
        deviceName = redmi ? `Xiaomi ${redmi[0]}` : "Redmi Device";
    }
    else if (ua.match(/POCO/i)) {
        const poco = ua.match(/POCO[^\s;)]+/i);
        deviceName = poco ? `Xiaomi ${poco[0]}` : "POCO Device";
    }
    else if (ua.match(/Xiaomi/i)) deviceName = "Xiaomi Device";
    // Other common brands
    else if (ua.match(/OPPO/i)) {
        const oppo = ua.match(/OPPO[^\s;)]+/i);
        deviceName = oppo ? oppo[0] : "OPPO Device";
    }
    else if (ua.match(/vivo/i)) {
        const vivo = ua.match(/vivo[^\s;)]+/i);
        deviceName = vivo ? vivo[0] : "Vivo Device";
    }
    else if (ua.match(/Huawei/i)) {
        const huawei = ua.match(/Huawei[^\s;)]+/i);
        deviceName = huawei ? huawei[0] : "Huawei Device";
    }
    else if (ua.match(/Nokia/i)) {
        const nokia = ua.match(/Nokia[^\s;)]+/i);
        deviceName = nokia ? nokia[0] : "Nokia Device";
    }
    else if (ua.match(/LG/i)) {
        const lg = ua.match(/LG[^\s;)]+/i);
        deviceName = lg ? lg[0] : "LG Device";
    }
    else if (ua.match(/Sony/i)) {
        const sony = ua.match(/Sony[^\s;)]+/i);
        deviceName = sony ? sony[0] : "Sony Device";
    }
    else if (ua.match(/HTC/i)) {
        const htc = ua.match(/HTC[^\s;)]+/i);
        deviceName = htc ? htc[0] : "HTC Device";
    }
    // More general Android detection
    else if (ua.match(/Android/i)) {
        // Try to extract Android device model
        const modelMatch = ua.match(/Android[\s\/][\d\.]+;\s*([^;)]+)/i);
        const model = modelMatch ? modelMatch[1].trim() : "Android Device";
        
        // Clean up common patterns in model names
        deviceName = model
            .replace(/Build\/[^\s]+/, '')
            .replace(/SAMSUNG\s*/i, 'Samsung ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    // Tablets and other devices
    else if (ua.match(/iPad/i)) {
        if (ua.match(/iPad.*OS 17/i)) deviceName = "iPad (iPadOS 17)";
        else if (ua.match(/iPad.*OS 16/i)) deviceName = "iPad (iPadOS 16)";
        else if (ua.match(/iPad.*OS 15/i)) deviceName = "iPad (iPadOS 15)";
        else deviceName = "iPad";
    }
    else if (ua.match(/Windows Phone/i)) deviceName = "Windows Phone";
    // Desktop systems
    else if (ua.match(/Macintosh/i)) {
        // Try to get Mac model
        if (ua.match(/Mac OS X 14/i)) deviceName = "Mac (Sonoma)";
        else if (ua.match(/Mac OS X 13/i)) deviceName = "Mac (Ventura)";
        else if (ua.match(/Mac OS X 12/i)) deviceName = "Mac (Monterey)";
        else if (ua.match(/Mac OS X 11/i)) deviceName = "Mac (Big Sur)";
        else deviceName = "Mac Device";
    }
    else if (ua.match(/Windows/i)) {
        // Get computer name if available or Windows version
        let computerName = "";
        try {
            // This is a privacy-sensitive operation and may not work in all browsers
            if (window.navigator && window.navigator.mediaDevices) {
                window.navigator.mediaDevices.enumerateDevices()
                    .then(devices => {
                        for (const device of devices) {
                            if (device.label && device.label.includes('(')) {
                                const parts = device.label.split('(');
                                if (parts.length > 1) {
                                    computerName = parts[1].replace(')', '').trim();
                                    break;
                                }
                            }
                        }
                    })
                    .catch(error => console.log('Error getting device names:', error));
            }
        } catch (e) {
            console.log('Error trying to get computer name:', e);
        }
        
        if (computerName) {
            deviceName = `PC (${computerName})`;
        } else {
            if (ua.match(/Windows NT 10\.0/i)) deviceName = "Windows 11/10 PC";
            else if (ua.match(/Windows NT 6\.3/i)) deviceName = "Windows 8.1 PC";
            else if (ua.match(/Windows NT 6\.2/i)) deviceName = "Windows 8 PC";
            else if (ua.match(/Windows NT 6\.1/i)) deviceName = "Windows 7 PC";
            else deviceName = "Windows PC";
        }
    }
    else if (ua.match(/Linux/i)) {
        if (ua.match(/Ubuntu/i)) deviceName = "Ubuntu Linux";
        else if (ua.match(/Fedora/i)) deviceName = "Fedora Linux";
        else if (ua.match(/Debian/i)) deviceName = "Debian Linux";
        else if (ua.match(/CentOS/i)) deviceName = "CentOS Linux";
        else deviceName = "Linux Device";
    }
    
    // If all detection methods failed, use navigator.platform as fallback
    if (deviceName === "Unknown Device" && platform) {
        if (platform.match(/Win/i)) deviceName = "Windows PC";
        else if (platform.match(/Mac/i)) deviceName = "Mac Device";
        else if (platform.match(/Linux/i)) deviceName = "Linux Device";
        else if (platform.match(/iPhone/i)) deviceName = "iPhone";
        else if (platform.match(/iPad/i)) deviceName = "iPad";
        else if (platform.match(/Android/i)) deviceName = "Android Device";
        else deviceName = platform; // Just use the platform string as device name
    }
    
    return deviceName;
}

// Show admin password modal
function showAdminPasswordModal() {
    if (adminPasswordModal) {
        adminPasswordModal.classList.add('active');
        
        // Clear any previous input
        if (adminPasswordInput) {
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
        
        // Clear error message
        if (adminPasswordError) {
            adminPasswordError.textContent = '';
        }
        
        // Announce for screen readers
        speakText('Admin authentication required. Please enter password.');
    }
}

// Hide admin password modal
function hideAdminPasswordModal() {
    if (adminPasswordModal) {
        adminPasswordModal.classList.remove('active');
    }
}

// Verify admin password
function verifyAdminPassword() {
    const password = adminPasswordInput.value.trim();
    
    if (!password) {
        adminPasswordError.textContent = 'Please enter a password';
        speakText('Please enter a password');
        return;
    }
    
    if (password === ADMIN_PASSWORD) {
        // Password correct, grant access
        hideAdminPasswordModal();
        directAccess('admin');
    } else {
        // Password incorrect
        adminPasswordError.textContent = 'Incorrect password';
        speakText('Incorrect password. Please try again.');
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
    }
}

// Handle tap anywhere on the screen (for client only)
function handleScreenTap(event) {
    // Only process taps when on the message screen AND the user is a client
    if (currentScreen !== 'messages' || (currentUser && currentUser.type !== 'client')) return;
    
    // Ignore taps on specific buttons to prevent double actions
    if (event.target === sendBtn || 
        event.target === voiceInputBtn || 
        event.target === backBtn) {
        return;
    }
    
    // Toggle recording state
    if (!isRecording) {
        // Start recording
        startRecognition();
        isRecording = true;
        showAssistiveFeedback('Recording started. Tap anywhere to stop and send.');
        speakText('Recording started. Tap anywhere to stop and send.');
    } else {
        // Stop recording and send if there's content
        stopRecognition();
        isRecording = false;
        
        if (messageText.value.trim()) {
            sendMessage();
        } else {
            showAssistiveFeedback('No message recorded. Tap again to try.');
            speakText('No message recorded. Tap again to try.');
        }
    }
}

// Handle login functionality
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const userType = userTypeSelect.value;
    
    if (!username || !password) {
        loginError.textContent = 'Please enter username and password';
        speakText('Please enter username and password');
        return;
    }
    
    // Check if user exists (in a real app, this would be an API call)
    let isValidUser = false;
    
    if (userType === 'admin' && username === users.admin.username && password === users.admin.password) {
        currentUser = { ...users.admin, username };
        isValidUser = true;
    } else if (userType === 'client' && username === users.client.username && password === users.client.password) {
        currentUser = { ...users.client, username };
        isValidUser = true;
    }
    
    if (isValidUser) {
        userInfo.textContent = `${username} (${userType})`;
        
        // Navigate to different screens based on user type
        if (currentUser.type === 'admin') {
            navigateTo('admin');
        } else {
            navigateTo('main');
            speakText(`Welcome ${username}. Swipe up to send message, swipe down to read the last message from admin.`);
        }
        
        // Start real-time message polling
        startMessagePolling();
    } else {
        loginError.textContent = 'Invalid username or password';
        speakText('Invalid username or password. Please try again.');
    }
}

// Navigation functions
function navigateTo(screen, skipAnnouncement = false) {
    // Hide all screens
    loginScreen.classList.remove('active');
    mainScreen.classList.remove('active');
    messageScreen.classList.remove('active');
    sosScreen.classList.remove('active');
    if (adminScreen) adminScreen.classList.remove('active');
    
    // Show selected screen
    switch (screen) {
        case 'login':
            loginScreen.classList.add('active');
            currentScreen = 'login';
            screenTitle.textContent = 'Vision Voice';
            break;
        case 'main':
            // Only for client users
            mainScreen.classList.add('active');
            gestureContainer.style.display = 'flex';
            messageScreen.style.display = 'none';
            currentScreen = 'main';
            screenTitle.textContent = 'Gesture Controls';
            
            // Announce gesture controls guidance for client - skip if requested
            if (currentUser && currentUser.type === 'client' && !skipAnnouncement) {
                setTimeout(() => {
                    speakText('Swipe up to send a message. Swipe down to read the last message from admin.');
                }, 1000);
            }
            break;
        case 'messages':
            // Only for client users
            mainScreen.classList.add('active');
            gestureContainer.style.display = 'none';
            messageScreen.style.display = 'block';
            currentScreen = 'messages';
            screenTitle.textContent = 'Messages';
            loadMessages(messagesContainer);
            
            // Only announce for client users - skip if requested
            if (currentUser && currentUser.type === 'client' && !skipAnnouncement) {
                speakText("Double-tap to start voice input. Double-tap again to stop and send your message.");
            }
            break;
        case 'admin':
            // Only for admin users
            if (adminScreen) {
                adminScreen.classList.add('active');
                currentScreen = 'admin';
                screenTitle.textContent = 'Admin Dashboard';
                loadMessages(adminMessagesContainer);
            }
            break;
        case 'sos':
            sosScreen.classList.add('active');
            currentScreen = 'sos';
            screenTitle.textContent = 'SOS Emergency';
            if (currentUser && currentUser.type === 'client' && !skipAnnouncement) {
                speakText('SOS activated. Emergency contacts are being notified.');
            }
            break;
    }
}

function navigateBack() {
    if (currentScreen === 'messages') {
        navigateTo('main');
    } else if (currentScreen === 'main' || currentScreen === 'admin') {
        // Confirm before logout
        if (confirm('Do you want to logout?')) {
            // Store user type before clearing currentUser
            const wasClient = currentUser && currentUser.type === 'client';
            
            // Stop polling when logging out
            stopMessagePolling();
            
            currentUser = null;
            navigateTo('login');
            
            if (wasClient) {
                speakText('You have been logged out. Select client or admin to continue.');
            } else {
                speakText('You have been logged out.');
            }
        }
    }
}

// Message functions
function loadMessages(container) {
    if (!container) {
        console.error("Message container not found");
        return;
    }
    
    console.log("Loading messages into container:", container.id);
    
    container.innerHTML = '';
    
    if (messages.length === 0) {
        const noMessagesElement = document.createElement('div');
        noMessagesElement.classList.add('no-messages');
        noMessagesElement.textContent = 'No messages yet';
        container.appendChild(noMessagesElement);
        return;
    }
    
    messages.forEach((message, index) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.dataset.index = index;
        
        if (message.sender === 'client') {
            messageElement.classList.add('client');
        } else if (message.sender === 'admin') {
            messageElement.classList.add('admin');
        }
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${time}</div>
        `;
        
        container.appendChild(messageElement);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    console.log(`Loaded ${messages.length} messages into ${container.id}`);
    
    // Update SOS button state after loading messages
    updateSOSButtonState();
}

// Real-time message polling functions
function startMessagePolling() {
    // Clear any existing interval first
    stopMessagePolling();
    
    // Check for new messages every 2 seconds
    messagePollingInterval = setInterval(() => {
        checkForNewMessages();
    }, 2000);
    
    console.log("Started real-time message polling");
    
    // Update SOS button state when checking for new messages
    updateSOSButtonState();
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
        console.log("Stopped message polling");
    }
}

// Mock implementation of checking for new messages
// In a real app, this would be an API call to a server
function checkForNewMessages() {
    // For this demo, we'll just reload messages from localStorage
    // to simulate receiving new messages from another user
    const savedMessages = localStorage.getItem('visionVoiceMessages');
    if (savedMessages) {
        try {
            const parsedMessages = JSON.parse(savedMessages);
            
            // Check if there are new messages
            if (parsedMessages.length > messages.length) {
                console.log("New messages detected:", parsedMessages.length - messages.length);
                
                // Get the last message for notification
                const lastMessage = parsedMessages[parsedMessages.length - 1];
                const isNewMessageFromOther = 
                    (currentUser && currentUser.type === 'client' && lastMessage.sender === 'admin') ||
                    (currentUser && currentUser.type === 'admin' && lastMessage.sender === 'client');
                
                // Update local messages array
                while (messages.length) messages.pop(); // Clear array
                parsedMessages.forEach(msg => {
                    // Convert string timestamps back to Date objects
                    msg.timestamp = new Date(msg.timestamp);
                    messages.push(msg);
                });
                
                // Refresh message displays
                updateMessageDisplays();
                
                // Notify of new messages if relevant
                if (isNewMessageFromOther) {
                    if (currentUser.type === 'client') {
                        showAssistiveFeedback('New message from admin');
                        speakText(`New message from admin: ${lastMessage.content}`);
                    } else {
                        showAssistiveFeedback('New message from client');
                        playNotificationSound();
                    }
                }
            }
        } catch (e) {
            console.error("Error checking for new messages:", e);
        }
    }
}

// Play notification sound
function playNotificationSound() {
    const notification = document.getElementById('message-notification');
    if (notification) {
        notification.currentTime = 0;
        notification.play().catch(e => console.error("Error playing notification sound:", e));
    }
}

// Update all active message displays
function updateMessageDisplays() {
    if (currentScreen === 'admin' && adminMessagesContainer) {
        loadMessages(adminMessagesContainer);
    } else if (currentScreen === 'messages' && messagesContainer) {
        loadMessages(messagesContainer);
    }
}

// Function to send message from client
function sendMessage() {
    const messageText = document.getElementById('message-text');
    
    if (!messageText || !messageText.value.trim()) {
        console.log('No message to send');
        return;
    }
    
    const messageContent = messageText.value.trim();
    
    // Create a message object
    const newMessage = {
        sender: 'client',
        content: messageContent,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // 1. Save to general messages
    let messages = [];
    try {
        const storedMessages = localStorage.getItem('visionVoiceMessages');
        if (storedMessages) {
            messages = JSON.parse(storedMessages);
        }
    } catch (e) {
        console.error('Error parsing stored messages:', e);
    }
    
    messages.push(newMessage);
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
    
    // 2. Update global messages array
    if (typeof window.messages !== 'undefined') {
        window.messages.push(newMessage);
    } else {
        window.messages = messages;
    }
    
    // 3. IMPORTANT: Ensure message is added to admin inbox
    let adminInbox = [];
    try {
        const storedInbox = localStorage.getItem('adminInbox');
        if (storedInbox) {
            adminInbox = JSON.parse(storedInbox);
        }
    } catch (e) {
        console.error('Error parsing admin inbox:', e);
    }
    
    // Add to admin inbox
    adminInbox.push(newMessage);
    localStorage.setItem('adminInbox', JSON.stringify(adminInbox));
    
    console.log('Message saved to admin inbox:', newMessage);
    
    // 4. Update UI and notify
    updateMessageDisplays();
    playNotificationSound();
    
    // 5. Clear the input field
    messageText.value = '';
    
    // Show feedback
    showAssistiveFeedback('Message sent successfully');
    speakText('Message sent successfully');
    
    // Notify admin (if API available)
    try {
        notifyAdmin(newMessage);
    } catch (e) {
        console.log('Admin notification not available:', e);
    }
}

// Function to notify admin of a new message
function notifyAdmin(message) {
    // Check if we're using real-time updates (WebSockets, etc)
    if (typeof sendRealTimeUpdate === 'function') {
        sendRealTimeUpdate('new_message', message);
    }
    
    // If we have any API endpoint for notifications
    fetch('/api/notify-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'new_message',
            message: message
        })
    }).catch(err => {
        // Silent failure - this is optional and shouldn't block the UI
        console.log('Admin notification API not available:', err);
    });
    
    // Trigger any custom event listeners we might have
    document.dispatchEvent(new CustomEvent('newClientMessage', {
        detail: message
    }));
}

// Update all message displays across the app
function updateMessageDisplays() {
    // Get messages container
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;
    
    // Only proceed if we have messages
    if (!window.messages || !window.messages.length) {
        messagesContainer.innerHTML = '<div class="no-messages">No messages yet.</div>';
        return;
    }
    
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Sort messages by timestamp
    const sortedMessages = [...window.messages].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Display messages
    sortedMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;
        
        // Format message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message.content;
        messageDiv.appendChild(contentDiv);
        
        // Add timestamp
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-time';
        timestampDiv.textContent = formatMessageTime(message.timestamp);
        messageDiv.appendChild(timestampDiv);
        
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll to bottom to show latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to handle admin inbox
function handleInbox() {
    console.log('Opening admin inbox');
    
    // Get admin inbox messages
    let inboxMessages = [];
    try {
        const storedInbox = localStorage.getItem('adminInbox');
        console.log('Raw admin inbox data:', storedInbox);
        
        if (storedInbox) {
            inboxMessages = JSON.parse(storedInbox);
            console.log('Parsed admin inbox messages:', inboxMessages);
        }
    } catch (e) {
        console.error('Error parsing admin inbox:', e);
    }
    
    // Create inbox modal
    const inboxModal = document.createElement('div');
    inboxModal.className = 'inbox-modal';
    inboxModal.innerHTML = `
        <div class="inbox-modal-content">
            <div class="inbox-header">
                <h3>Client Messages</h3>
                <button class="close-inbox-btn">&times;</button>
            </div>
            <div class="inbox-messages"></div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(inboxModal);
    
    // Get messages container
    const messagesContainer = inboxModal.querySelector('.inbox-messages');
    
    // Display messages or show empty message
    if (!inboxMessages || inboxMessages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">No messages from clients yet.</div>';
    } else {
        // Sort messages by timestamp (newest first)
        inboxMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Display each message
        inboxMessages.forEach((message, index) => {
            // Ensure message has the right format
            if (!message.content) {
                console.warn('Invalid message format:', message);
                return;
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `inbox-message ${message.read ? '' : 'unread'}`;
            messageDiv.innerHTML = `
                <div class="message-content">${message.content}</div>
                <div class="message-info">
                    <span>${formatMessageTime(message.timestamp)}</span>
                    <span>${message.read ? 'Read' : 'Unread'}</span>
                </div>
                <div class="message-actions">
                    ${message.read ? '' : '<button class="mark-read-btn">Mark as Read</button>'}
                    <button class="reply-btn" data-message-id="${index}">Reply</button>
                </div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            
            // Add event listener to mark read button
            const markReadBtn = messageDiv.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', () => {
                    message.read = true;
                    localStorage.setItem('adminInbox', JSON.stringify(inboxMessages));
                    messageDiv.classList.remove('unread');
                    markReadBtn.remove();
                    messageDiv.querySelector('.message-info').innerHTML = `
                        <span>${formatMessageTime(message.timestamp)}</span>
                        <span>Read</span>
                    `;
                    // Update badge count
                    updateInboxBadge(document.getElementById('inbox-btn'));
                });
            }
            
            // Add event listener to reply button
            const replyBtn = messageDiv.querySelector('.reply-btn');
            if (replyBtn) {
                replyBtn.addEventListener('click', () => {
                    openReplyModal(message);
                });
            }
        });
    }
    
    // Close button functionality
    const closeBtn = inboxModal.querySelector('.close-inbox-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(inboxModal);
    });
}

// Format message time for display
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // If same day, just show time
    if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } 
    // If yesterday, show "Yesterday"
    else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } 
    // Otherwise show date
    else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + 
               ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Function to open reply modal
function openReplyModal(message) {
    // Create reply modal
    const replyModal = document.createElement('div');
    replyModal.className = 'reply-modal';
    replyModal.innerHTML = `
        <div class="reply-modal-content">
            <div class="reply-header">
                <h3>Reply to Message</h3>
                <button class="close-reply-btn">&times;</button>
            </div>
            <div class="original-message">
                <h4>Original Message:</h4>
                <p>${message.content}</p>
                <small>${formatMessageTime(message.timestamp)}</small>
            </div>
            <div class="reply-form">
                <textarea id="reply-text" placeholder="Type your reply here..."></textarea>
                <button class="send-reply-btn">Send Reply</button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(replyModal);
    
    // Close button functionality
    const closeBtn = replyModal.querySelector('.close-reply-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(replyModal);
    });
    
    // Send reply functionality
    const sendBtn = replyModal.querySelector('.send-reply-btn');
    sendBtn.addEventListener('click', () => {
        const replyText = document.getElementById('reply-text').value.trim();
        if (replyText) {
            sendAdminReply(replyText, message);
            document.body.removeChild(replyModal);
        } else {
            alert('Please enter a reply message');
        }
    });
}

// Send admin reply to client
function sendAdminReply(replyText, originalMessage) {
    // Create admin message
    const adminMessage = {
        sender: 'admin',
        content: replyText,
        timestamp: new Date().toISOString(),
        replyTo: originalMessage.timestamp // Reference to original message
    };
    
    // Get existing messages
    let messages = [];
    const storedMessages = localStorage.getItem('visionVoiceMessages');
    if (storedMessages) {
        try {
            messages = JSON.parse(storedMessages);
        } catch (e) {
            console.error('Error parsing stored messages:', e);
            messages = [];
        }
    }
    
    // Add admin message
    messages.push(adminMessage);
    
    // Update storage
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
    
    // Update global messages array if it exists
    if (typeof window.messages !== 'undefined') {
        window.messages.push(adminMessage);
    }
    
    // Mark original message as read in admin inbox
    updateMessageReadStatus(originalMessage);
    
    // Show confirmation
    showAssistiveFeedback('Reply sent successfully');
    
    console.log('Admin reply sent:', replyText);
}

// Update message read status in admin inbox
function updateMessageReadStatus(message) {
    let adminInbox = [];
    const storedInbox = localStorage.getItem('adminInbox');
    if (storedInbox) {
        try {
            adminInbox = JSON.parse(storedInbox);
            
            // Find the message by timestamp and mark as read
            const messageIndex = adminInbox.findIndex(msg => 
                msg.timestamp === message.timestamp && 
                msg.content === message.content
            );
            
            if (messageIndex !== -1) {
                adminInbox[messageIndex].read = true;
                localStorage.setItem('adminInbox', JSON.stringify(adminInbox));
            }
        } catch (e) {
            console.error('Error updating message read status:', e);
        }
    }
}

// Send message from admin
function sendAdminMessage() {
    if (!adminMessageText) {
        console.error("Admin message text area not found");
        return;
    }
    
    const content = adminMessageText.value.trim();
    
    if (!content) return;
    
    const newMessage = {
        sender: 'admin',
        content,
        timestamp: new Date()
    };
    
    console.log("Admin sending message:", newMessage);
    messages.push(newMessage);
    adminMessageText.value = '';
    
    // Update UI immediately
    updateMessageDisplays();
    
    // Store messages in localStorage for persistence and real-time sharing
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
}

// Read the last message from admin
function readLastAdminMessage() {
    console.log("Reading last admin message, total messages:", messages.length);
    
    // Find the last admin message
    let foundMessage = false;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        console.log("Checking message:", messages[i]);
        if (messages[i].sender === 'admin') {
            console.log("Found admin message:", messages[i].content);
            speakText(`Message from admin: ${messages[i].content}`);
            foundMessage = true;
            break;
        }
    }
    
    // If no messages found
    if (!foundMessage) {
        console.log("No admin messages found");
        speakText("No messages from admin yet.");
    }
}

// SOS functions
function activateSOS() {
    // Get client's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                // Create SOS message with location
                const sosMessage = {
                    sender: 'client',
                    content: `SOS ACTIVATED! Location: https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
                    timestamp: new Date(),
                    type: 'sos',
                    location: location
                };
                
                // Add to messages array
                messages.push(sosMessage);
                
                // Store in localStorage
                localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
                
                // Update message displays
                updateMessageDisplays();
                
                // Show SOS screen
                navigateTo('sos');
                
                // Provide feedback
                showAssistiveFeedback('SOS activated! Your location has been sent to admin.');
                speakText('SOS mode activated. Your location has been sent to the admin. Hold again to cancel.');
                
                // Play emergency sound
                const notificationSound = document.getElementById('message-notification');
                if (notificationSound) {
                    notificationSound.play().catch(e => console.log('Error playing notification sound:', e));
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                // Fallback message without location
                const sosMessage = {
                    sender: 'client',
                    content: 'SOS ACTIVATED! Location unavailable.',
                    timestamp: new Date(),
                    type: 'sos'
                };
                
                messages.push(sosMessage);
                localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
                updateMessageDisplays();
                navigateTo('sos');
                
                showAssistiveFeedback('SOS activated! Location unavailable.');
                speakText('SOS mode activated. Location unavailable. Hold again to cancel.');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        // Fallback if geolocation is not supported
        const sosMessage = {
            sender: 'client',
            content: 'SOS ACTIVATED! Location tracking not supported.',
            timestamp: new Date(),
            type: 'sos'
        };
        
        messages.push(sosMessage);
        localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
        updateMessageDisplays();
        navigateTo('sos');
        
        showAssistiveFeedback('SOS activated! Location tracking not supported.');
        speakText('SOS mode activated. Location tracking not supported. Hold again to cancel.');
    }
}

function cancelSOS() {
    // Create cancellation message
    const cancelMessage = {
        sender: 'client',
        content: 'SOS CANCELLED',
        timestamp: new Date(),
        type: 'sos-cancel'
    };
    
    // Add to messages array
    messages.push(cancelMessage);
    
    // Store in localStorage
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
    
    // Update message displays
    updateMessageDisplays();
    
    // Return to main screen
    navigateTo('main');
    
    // Provide feedback
    showAssistiveFeedback('SOS cancelled');
    speakText('SOS mode cancelled');
}

// Helper function for client speech
function speakText(text) {
    // Only speak if the current user is a client (blind user)
    if (currentUser && currentUser.type === 'client') {
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    } else if (!currentUser) {
        // On login screen, speak for everyone
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make function globally accessible for gesture handling
window.readLastAdminMessage = readLastAdminMessage;

// Add event listeners for admin password modal
if (adminPasswordSubmit) {
    adminPasswordSubmit.addEventListener('click', verifyAdminPassword);
    
    // Also allow Enter key to submit
    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAdminPassword();
        }
    });
}

if (adminPasswordCancel) {
    adminPasswordCancel.addEventListener('click', hideAdminPasswordModal);
}

// Initialize admin dashboard
function initAdminDashboard() {
    // Update greeting based on time of day
    updateGreeting();
    
    // Update current time
    updateCurrentTime();
    
    // Update client device information
    updateClientDeviceInfo();
    
    // Update time, greeting and client info periodically
    setInterval(() => {
        updateCurrentTime();
        updateGreeting();
    }, 60000); // Update time/greeting every minute
    
    // Update client device info more frequently to ensure real-time data
    setInterval(() => {
        updateClientDeviceInfo();
    }, 5000); // Update client info every 5 seconds for more real-time display
    
    // Add event listeners to admin dashboard buttons
    const handsignPredictionBtn = document.getElementById('handsign-prediction-btn');
    const changeRoleBtn = document.getElementById('change-role-btn');
    const inboxBtn = document.getElementById('inbox-btn');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const trackClientsBtn = document.getElementById('track-clients-btn');
    const sosInfoBtn = document.getElementById('sos-info-btn');
    const settingsIcon = document.querySelector('.settings-icon');
    
    // Initialize the password reset modal elements and event listeners
    initPasswordResetModal();
    
    if (settingsIcon) {
        settingsIcon.addEventListener('click', showPasswordResetModal);
    }
    
    if (handsignPredictionBtn) {
        handsignPredictionBtn.addEventListener('click', handleHandsignPrediction);
    }
    
    if (changeRoleBtn) {
        changeRoleBtn.addEventListener('click', handleChangeRole);
    }
    
    if (inboxBtn) {
        inboxBtn.addEventListener('click', handleInbox);
        
        // Add unread count badge
        updateInboxBadge(inboxBtn);
        
        // Update badge every 10 seconds
        setInterval(() => updateInboxBadge(inboxBtn), 10000);
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', handleSendMessage);
    }
    
    if (trackClientsBtn) {
        trackClientsBtn.addEventListener('click', handleTrackClients);
    }
    
    if (sosInfoBtn) {
        sosInfoBtn.addEventListener('click', handleSOSInfo);
    }
}

// Update inbox button badge with unread count
function updateInboxBadge(inboxBtn) {
    if (!inboxBtn) return;
    
    // Get admin inbox
    let adminInbox = [];
    const storedInbox = localStorage.getItem('adminInbox');
    if (storedInbox) {
        try {
            adminInbox = JSON.parse(storedInbox);
        } catch (e) {
            console.error('Error parsing admin inbox:', e);
            return;
        }
    }
    
    // Count unread messages
    const unreadCount = adminInbox.filter(msg => !msg.read).length;
    
    // Remove existing badge if any
    const existingBadge = inboxBtn.querySelector('.unread-count');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Add badge if there are unread messages
    if (unreadCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'unread-count';
        badge.textContent = unreadCount;
        inboxBtn.appendChild(badge);
    }
}

// Update greeting based on time of day
function updateGreeting() {
    const greetingElement = document.querySelector('.greeting-header h2');
    if (!greetingElement) return;
    
    const currentHour = new Date().getHours();
    let greeting = '';
    
    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }
    
    greetingElement.textContent = greeting;
}

// Update current time display
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    if (currentTimeElement) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        currentTimeElement.textContent = `${hours}:${minutes}`;
    }
}

// Handler functions for admin dashboard buttons
function handleChangeRole() {
    console.log('Change Role clicked');
    
    // Ask for confirmation before changing role
    if (confirm('Are you sure you want to change roles? This will log you out of the admin account.')) {
        // Reset current user
        currentUser = null;
        
        // Stop polling when changing roles
        stopMessagePolling();
        
        // Navigate to login screen
        navigateTo('login');
        
        // Provide feedback (optional, since we're leaving this page)
        speakText('Please select a role to continue.');
    }
}

// Function to handle Track Clients button
function handleTrackClients() {
    // Create a modal for the map
    const mapModal = document.createElement('div');
    mapModal.className = 'map-modal';
    mapModal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-header">
                <h3>Live Client Tracking</h3>
                <div class="tracking-status">
                    <span class="status-indicator">Initializing...</span>
                    <span class="last-update"></span>
                </div>
                <div class="map-controls">
                    <button class="start-tracking-btn">Start Live Tracking</button>
                    <button class="center-map-btn">Center Map</button>
                    <button class="clear-path-btn">Clear Path</button>
                    <button class="close-map-btn">×</button>
                </div>
            </div>
            <div class="location-details">
                <div class="coordinates"></div>
                <div class="address"></div>
                <div class="speed"></div>
                <div class="accuracy"></div>
                <div class="heading"></div>
            </div>
            <div id="client-map" style="width: 100%; height: 400px;"></div>
            <div class="tracking-info">
                <div class="client-details"></div>
                <div class="connection-status"></div>
                <div class="tracking-stats">
                    <span class="total-distance">Total Distance: 0.00 km</span>
                    <span class="avg-speed">Average Speed: 0.0 km/h</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(mapModal);

    let map, clientMarker, accuracyCircle, pathPolyline;
    let isTracking = false;
    let trackingInterval;
    let locationHistory = [];
    const updateInterval = 3000; // Update every 3 seconds
    let totalDistance = 0;
    let speedReadings = [];

    // Initialize map
    function initializeMap(initialPosition) {
        // Create map centered on initial position
        map = L.map('client-map').setView([initialPosition.lat, initialPosition.lng], 15);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Create custom marker icon
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-pin"></div><div class="marker-pulse"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        // Add client marker
        clientMarker = L.marker([initialPosition.lat, initialPosition.lng], {
            icon: markerIcon
        }).addTo(map);

        // Add accuracy circle
        accuracyCircle = L.circle([initialPosition.lat, initialPosition.lng], {
            color: '#5e17eb',
            fillColor: '#5e17eb',
            fillOpacity: 0.1,
            radius: initialPosition.accuracy || 0
        }).addTo(map);

        // Initialize path polyline
        pathPolyline = L.polyline([], {
            color: '#5e17eb',
            weight: 3,
            opacity: 0.7
        }).addTo(map);

        // Update location details
        updateLocationDetails(initialPosition);
    }

    // Function to calculate distance between two points
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Function to update location details
    function updateLocationDetails(position) {
        const { lat, lng, accuracy, speed, heading, timestamp } = position;
        
        // Update coordinates display
        mapModal.querySelector('.coordinates').textContent = 
            `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Update accuracy
        mapModal.querySelector('.accuracy').textContent = 
            `Accuracy: ${accuracy ? accuracy.toFixed(0) + 'm' : 'Unknown'}`;
        
        // Update speed if available
        if (speed) {
            const speedKmh = (speed * 3.6).toFixed(1);
            mapModal.querySelector('.speed').textContent = `Speed: ${speedKmh} km/h`;
            speedReadings.push(speed * 3.6); // Store speed in km/h
        }

        // Update heading if available
        if (heading) {
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const index = Math.round(heading / 45) % 8;
            mapModal.querySelector('.heading').textContent = 
                `Heading: ${heading.toFixed(0)}° (${directions[index]})`;
        }

        // Update last update time
        mapModal.querySelector('.last-update').textContent = 
            `Last Update: ${new Date(timestamp).toLocaleTimeString()}`;

        // Get address using OpenStreetMap Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(response => response.json())
            .then(data => {
                if (data.display_name) {
                    mapModal.querySelector('.address').textContent = data.display_name;
                }
            })
            .catch(error => console.error('Error getting address:', error));

        // Update tracking stats
        if (locationHistory.length > 1) {
            const lastPoint = locationHistory[locationHistory.length - 2];
            const distance = calculateDistance(lastPoint[0], lastPoint[1], lat, lng);
            totalDistance += distance;
            
            // Update stats display
            mapModal.querySelector('.total-distance').textContent = 
                `Total Distance: ${totalDistance.toFixed(2)} km`;
            
            if (speedReadings.length > 0) {
                const avgSpeed = speedReadings.reduce((a, b) => a + b) / speedReadings.length;
                mapModal.querySelector('.avg-speed').textContent = 
                    `Average Speed: ${avgSpeed.toFixed(1)} km/h`;
            }
        }
    }

    // Function to start live tracking
    function startTracking() {
        if (isTracking) return;
        
        isTracking = true;
        mapModal.querySelector('.start-tracking-btn').textContent = 'Stop Tracking';
        mapModal.querySelector('.status-indicator').textContent = 'Live Tracking Active';
        mapModal.querySelector('.tracking-status').classList.add('active');

        // Clear previous interval if exists
        if (trackingInterval) {
            clearInterval(trackingInterval);
        }

        // Function to update client's location
        function updateClientLocation() {
            // Get client's stored location from localStorage
            const clientInfo = JSON.parse(localStorage.getItem('clientDeviceInfo') || '{}');
            
            if (clientInfo.location) {
                const position = {
                    lat: clientInfo.location.latitude,
                    lng: clientInfo.location.longitude,
                    accuracy: clientInfo.location.accuracy,
                    speed: clientInfo.location.speed,
                    heading: clientInfo.location.heading,
                    timestamp: new Date(clientInfo.location.timestamp)
                };

                // Update marker position
                clientMarker.setLatLng([position.lat, position.lng]);
                
                // Update accuracy circle
                accuracyCircle.setLatLng([position.lat, position.lng]);
                if (position.accuracy) {
                    accuracyCircle.setRadius(position.accuracy);
                }

                // Add to location history
                locationHistory.push([position.lat, position.lng]);
                pathPolyline.setLatLngs(locationHistory);

                // Update location details
                updateLocationDetails(position);

                // Center map if auto-center is enabled
                if (mapModal.querySelector('.center-map-btn').classList.contains('active')) {
                    map.panTo([position.lat, position.lng]);
                }

                // Update connection status
                const timeSinceUpdate = new Date() - new Date(clientInfo.location.timestamp);
                const connectionStatus = timeSinceUpdate < 10000 ? 'Connected' : 'Disconnected';
                mapModal.querySelector('.connection-status').textContent = 
                    `Status: ${connectionStatus} (${Math.floor(timeSinceUpdate / 1000)}s ago)`;
            }
        }

        // Start periodic updates
        trackingInterval = setInterval(updateClientLocation, updateInterval);
        updateClientLocation(); // Initial update
    }

    // Function to stop tracking
    function stopTracking() {
        isTracking = false;
        mapModal.querySelector('.start-tracking-btn').textContent = 'Start Live Tracking';
        mapModal.querySelector('.status-indicator').textContent = 'Tracking Stopped';
        mapModal.querySelector('.tracking-status').classList.remove('active');
        
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }
    }

    // Get initial client location
    const clientInfo = JSON.parse(localStorage.getItem('clientDeviceInfo') || '{}');
    if (clientInfo.location) {
        const initialPosition = {
            lat: clientInfo.location.latitude,
            lng: clientInfo.location.longitude,
            accuracy: clientInfo.location.accuracy,
            heading: clientInfo.location.heading,
            timestamp: new Date(clientInfo.location.timestamp)
        };

        // Initialize map with client's location
        initializeMap(initialPosition);

        // Add event listeners
        const startTrackingBtn = mapModal.querySelector('.start-tracking-btn');
        const centerMapBtn = mapModal.querySelector('.center-map-btn');
        const clearPathBtn = mapModal.querySelector('.clear-path-btn');
        const closeBtn = mapModal.querySelector('.close-map-btn');

        startTrackingBtn.addEventListener('click', () => {
            if (isTracking) {
                stopTracking();
            } else {
                startTracking();
            }
        });

        centerMapBtn.addEventListener('click', () => {
            centerMapBtn.classList.toggle('active');
            if (clientMarker) {
                map.panTo(clientMarker.getLatLng());
            }
        });

        clearPathBtn.addEventListener('click', () => {
            locationHistory = [];
            totalDistance = 0;
            speedReadings = [];
            pathPolyline.setLatLngs([]);
            mapModal.querySelector('.total-distance').textContent = 'Total Distance: 0.00 km';
            mapModal.querySelector('.avg-speed').textContent = 'Average Speed: 0.0 km/h';
        });

        closeBtn.addEventListener('click', () => {
            stopTracking();
            document.body.removeChild(mapModal);
        });

        // Start tracking automatically
        startTracking();
    } else {
        showAssistiveFeedback('No client location data available');
        document.body.removeChild(mapModal);
    }
}

// Helper function to update location information
function updateLocationInfo(position) {
    const { latitude, longitude, speed } = position.coords;
    const mapModal = document.querySelector('.map-modal');
    
    if (!mapModal) return;

    // Update coordinates
    mapModal.querySelector('.coordinates').textContent = 
        `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
    // Update speed if available
    if (speed) {
        const speedKmh = (speed * 3.6).toFixed(1);
        mapModal.querySelector('.speed').textContent = `🚶 ${speedKmh} km/h`;
    }

    // Update last updated time
    mapModal.querySelector('.last-updated').textContent = 
        `Last updated: ${new Date().toLocaleTimeString()}`;
}

// Helper function to get address from coordinates
function getLocationAddress(latitude, longitude) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(response => response.json())
        .then(data => {
            if (data.display_name) {
                const mapModal = document.querySelector('.map-modal');
                if (mapModal) {
                    mapModal.querySelector('.address').textContent = 
                        `📌 ${data.display_name}`;
                }
            }
        })
        .catch(error => console.error('Error getting address:', error));
}

// Helper function to add location to history
function addToLocationHistory(location) {
    locationHistory.push(location);
    if (locationHistory.length > locationHistoryLimit) {
        locationHistory.shift();
    }
    updateTrackingStats();
}

// Helper function to update tracking statistics
function updateTrackingStats() {
    if (locationHistory.length < 2) return;

    const mapModal = document.querySelector('.map-modal');
    if (!mapModal) return;

    let totalDistance = 0;
    let totalSpeed = 0;
    let speedCount = 0;

    for (let i = 1; i < locationHistory.length; i++) {
        const prev = locationHistory[i-1];
        const curr = locationHistory[i];
        
        // Calculate distance
        const distance = calculateDistance(
            prev.lat, prev.lng,
            curr.lat, curr.lng
        );
        totalDistance += distance;

        // Calculate speed
        if (curr.speed) {
            totalSpeed += curr.speed * 3.6; // Convert m/s to km/h
            speedCount++;
        }
    }

    const avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

    mapModal.querySelector('.total-distance').textContent = 
        `Total Distance: ${totalDistance.toFixed(2)} km`;
    mapModal.querySelector('.avg-speed').textContent = 
        `Average Speed: ${avgSpeed.toFixed(1)} km/h`;
}

// Function to send a message from the new interface
function sendAdminMessageFromInterface(text) {
    if (!text.trim()) return;
    
    const newMessage = {
        sender: 'admin',
        content: text,
        timestamp: new Date()
    };
    
    // Add to messages array
    messages.push(newMessage);
    
    // Save to localStorage
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
    
    console.log('Admin message sent:', text);
}

// Helper function to format message time
function formatMessageTime(timestamp) {
    const now = new Date();
    const msgDate = new Date(timestamp);
    
    // Check if message is from today
    if (now.toDateString() === msgDate.toDateString()) {
        return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
               ' ' + msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Add handler for HandSign Prediction button
function handleHandsignPrediction() {
    console.log('HandSign Prediction clicked');
    
    // Create modal for hand sign messages
    const handSignModal = document.createElement('div');
    handSignModal.className = 'hand-sign-modal';
    handSignModal.innerHTML = `
        <div class="hand-sign-modal-content">
            <div class="hand-sign-header">
                <h3>Hand Sign Predictions</h3>
                <button class="close-hand-sign-btn">×</button>
            </div>
            <div class="hand-sign-messages">
                <div class="sign-history"></div>
                <div class="sign-stats">
                    <h4>Statistics</h4>
                    <div class="stats-content"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(handSignModal);

    // Get hand sign messages
    const handSignMessages = JSON.parse(localStorage.getItem('handSignMessages') || '[]');
    
    if (handSignMessages.length > 0) {
        // Sort messages by timestamp (newest first)
        handSignMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Calculate statistics
        const stats = calculateHandSignStats(handSignMessages);
        
        // Display messages
        const signHistory = handSignModal.querySelector('.sign-history');
        signHistory.innerHTML = `
            <h4>Recent Hand Signs</h4>
            ${handSignMessages.map(msg => `
                <div class="sign-message">
                    <span class="sign-content">${msg.content}</span>
                    <span class="sign-time">${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
            `).join('')}
        `;
        
        // Display statistics
        const statsContent = handSignModal.querySelector('.stats-content');
        statsContent.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Signs:</span>
                <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Most Used:</span>
                <span class="stat-value">${stats.mostUsed.sign} (${stats.mostUsed.count} times)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Today's Signs:</span>
                <span class="stat-value">${stats.today}</span>
            </div>
            <div class="stat-chart">
                ${generateSignChart(stats.frequency)}
            </div>
        `;
    } else {
        handSignModal.querySelector('.hand-sign-messages').innerHTML = `
            <div class="no-signs">No hand signs received yet</div>
        `;
    }

    // Add event listener to close button
    const closeBtn = handSignModal.querySelector('.close-hand-sign-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(handSignModal);
    });
}

// Calculate hand sign statistics
function calculateHandSignStats(messages) {
    const stats = {
        total: messages.length,
        frequency: {},
        today: 0,
        mostUsed: { sign: '', count: 0 }
    };

    const today = new Date().toDateString();

    messages.forEach(msg => {
        // Count frequency
        stats.frequency[msg.content] = (stats.frequency[msg.content] || 0) + 1;

        // Count today's signs
        if (new Date(msg.timestamp).toDateString() === today) {
            stats.today++;
        }
    });

    // Find most used sign
    Object.entries(stats.frequency).forEach(([sign, count]) => {
        if (count > stats.mostUsed.count) {
            stats.mostUsed = { sign, count };
        }
    });

    return stats;
}

// Generate visual chart for sign frequency
function generateSignChart(frequency) {
    const maxCount = Math.max(...Object.values(frequency));
    
    return `
        <div class="frequency-chart">
            ${Object.entries(frequency).map(([sign, count]) => `
                <div class="chart-bar">
                    <div class="bar-label">${sign}</div>
                    <div class="bar-container">
                        <div class="bar" style="width: ${(count / maxCount) * 100}%">
                            <span class="bar-value">${count}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Add handler for SOS Info button
function handleSOSInfo() {
    // Find the most recent SOS message with location
    const sosMessage = messages
        .filter(msg => msg.type === 'sos' && msg.location)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (sosMessage && sosMessage.location) {
        // Open Google Maps with the client's location
        const mapsUrl = `https://www.google.com/maps?q=${sosMessage.location.latitude},${sosMessage.location.longitude}`;
        window.open(mapsUrl, '_blank');
        
        // Provide feedback
        showAssistiveFeedback('Opening client location in Google Maps');
        speakText('Opening client location in Google Maps');
    } else {
        showAssistiveFeedback('No active SOS location available');
        speakText('No active SOS location available');
    }
}

// Initialize the password reset modal
function initPasswordResetModal() {
    const passwordResetModal = document.getElementById('password-reset-modal');
    const passwordResetCancel = document.getElementById('password-reset-cancel');
    const passwordResetSubmit = document.getElementById('password-reset-submit');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordResetCancel) {
        passwordResetCancel.addEventListener('click', hidePasswordResetModal);
    }
    
    if (passwordResetSubmit) {
        passwordResetSubmit.addEventListener('click', handlePasswordReset);
    }
    
    // Allow pressing Enter on the confirm password field to submit
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlePasswordReset();
            }
        });
    }
}

// Show the password reset modal
function showPasswordResetModal() {
    const passwordResetModal = document.getElementById('password-reset-modal');
    const currentPasswordInput = document.getElementById('current-password');
    const passwordResetError = document.getElementById('password-reset-error');
    const passwordResetSuccess = document.getElementById('password-reset-success');
    
    if (passwordResetModal) {
        // Clear any previous inputs and messages
        if (currentPasswordInput) currentPasswordInput.value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        if (passwordResetError) passwordResetError.textContent = '';
        if (passwordResetSuccess) passwordResetSuccess.textContent = '';
        
        // Show the modal
        passwordResetModal.classList.add('active');
        
        // Focus on the first input field
        if (currentPasswordInput) currentPasswordInput.focus();
    }
}

// Hide the password reset modal
function hidePasswordResetModal() {
    const passwordResetModal = document.getElementById('password-reset-modal');
    if (passwordResetModal) {
        passwordResetModal.classList.remove('active');
    }
}

// Handle password reset
function handlePasswordReset() {
    const currentPassword = document.getElementById('current-password').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const passwordResetError = document.getElementById('password-reset-error');
    const passwordResetSuccess = document.getElementById('password-reset-success');
    
    // Clear previous messages
    passwordResetError.textContent = '';
    passwordResetSuccess.textContent = '';
    
    // Validate inputs
    if (!currentPassword) {
        passwordResetError.textContent = 'Please enter your current password';
        return;
    }
    
    if (!newPassword) {
        passwordResetError.textContent = 'Please enter a new password';
        return;
    }
    
    if (newPassword.length < 6) {
        passwordResetError.textContent = 'New password must be at least 6 characters long';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        passwordResetError.textContent = 'New passwords do not match';
        return;
    }
    
    // Check if current password is correct (for demo purposes using ADMIN_PASSWORD)
    if (currentPassword !== ADMIN_PASSWORD) {
        passwordResetError.textContent = 'Current password is incorrect';
        return;
    }
    
    // In a real app, this would be an API call to update the password in the database
    // For the demo, we'll just update the ADMIN_PASSWORD variable
    ADMIN_PASSWORD = newPassword;
    
    // Show success message
    passwordResetSuccess.textContent = 'Password has been reset successfully!';
    
    // Clear the form fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Close the modal after a delay
    setTimeout(() => {
        hidePasswordResetModal();
    }, 3000);
}

function updateSOSButtonState() {
    const sosBtn = document.getElementById('sos-info-btn');
    if (!sosBtn) return;

    // Check if there's an active SOS message
    const hasActiveSOS = messages.some(msg => 
        msg.type === 'sos' && 
        !messages.some(cancelMsg => 
            cancelMsg.type === 'sos-cancel' && 
            cancelMsg.timestamp > msg.timestamp
        )
    );

    if (hasActiveSOS) {
        sosBtn.classList.add('active');
        // Play emergency sound
        const notificationSound = document.getElementById('message-notification');
        if (notificationSound) {
            notificationSound.play().catch(e => console.log('Error playing notification sound:', e));
        }
    } else {
        sosBtn.classList.remove('active');
    }
}

// Function to handle Send Message button in Admin Dashboard
function handleSendMessage() {
    // Create send message modal
    const sendMessageModal = document.createElement('div');
    sendMessageModal.className = 'send-message-modal';
    sendMessageModal.innerHTML = `
        <div class="send-message-content">
            <div class="send-message-header">
                <h3>Send Message to Client</h3>
                <button class="close-send-message-btn">×</button>
            </div>
            <div class="send-message-form">
                <textarea id="admin-message-text" placeholder="Type your message here..."></textarea>
                <button id="send-admin-message-btn">Send Message</button>
            </div>
        </div>
    `;

    document.body.appendChild(sendMessageModal);

    // Add event listeners
    const closeBtn = sendMessageModal.querySelector('.close-send-message-btn');
    const sendBtn = sendMessageModal.querySelector('#send-admin-message-btn');
    const messageText = sendMessageModal.querySelector('#admin-message-text');

    closeBtn.addEventListener('click', () => {
        document.body.removeChild(sendMessageModal);
    });

    sendBtn.addEventListener('click', () => {
        const content = messageText.value.trim();
        if (content) {
            // Create new message
            const newMessage = {
                sender: 'admin',
                content: content,
                timestamp: new Date(),
                delivered: false
            };

            // Add to messages array
            messages.push(newMessage);

            // Store in localStorage
            localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));

            // Show confirmation
            showAssistiveFeedback('Message sent to client');

            // Clear input and close modal
            messageText.value = '';
            document.body.removeChild(sendMessageModal);

            // Update UI
            updateMessageDisplays();
        }
    });
}

// Update the handleDownSwipe function to show latest admin messages
function handleDownSwipe() {
    // Only process for client users
    if (!currentUser || currentUser.type !== 'client') {
        console.log("Ignoring down swipe - not a client user");
        return;
    }
    
    console.log('Down swipe detected - attempting to read message');
    showAssistiveFeedback('Down swipe detected. Reading messages from admin.');
    
    // Get messages from localStorage
    const storedMessages = JSON.parse(localStorage.getItem('visionVoiceMessages') || '[]');
    
    // Find the most recent admin messages (up to 3)
    const adminMessages = storedMessages
        .filter(msg => msg.sender === 'admin')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 3);

    if (adminMessages.length > 0) {
        // Create and show messages modal
        const messagesModal = document.createElement('div');
        messagesModal.className = 'client-messages-modal';
        messagesModal.innerHTML = `
            <div class="client-messages-content">
                <div class="client-messages-header">
                    <h3>Messages from Admin</h3>
                    <button class="close-messages-btn">×</button>
                </div>
                <div class="messages-list">
                    ${adminMessages.map(msg => `
                        <div class="message-item">
                            <div class="message-content">${msg.content}</div>
                            <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(messagesModal);

        // Add close button functionality
        const closeBtn = messagesModal.querySelector('.close-messages-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(messagesModal);
        });

        // Read messages aloud
        adminMessages.forEach(msg => {
            speakText(`Message from admin: ${msg.content}`);
        });
    } else {
        speakText("No messages from admin yet.");
        console.log("No admin messages found to read");
    }
}

// Add voice recording functionality
let mediaRecorder = null;
let audioChunks = [];

// Function to handle voice recording
async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Convert to base64 for storage
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = reader.result;
                sendVoiceMessage(base64Audio);
            };
        };

        mediaRecorder.start();
        showAssistiveFeedback('Recording started... Tap anywhere to stop.');
        speakText('Recording started. Tap anywhere to stop.');
    } catch (error) {
        console.error('Error starting recording:', error);
        showAssistiveFeedback('Could not start recording. Please check microphone permissions.');
        speakText('Could not start recording. Please check microphone permissions.');
    }
}

// Function to stop voice recording
function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        showAssistiveFeedback('Recording stopped. Sending message...');
        speakText('Recording stopped. Sending message.');
    }
}

// Function to send voice message
function sendVoiceMessage(audioData) {
    const newMessage = {
        sender: 'client',
        type: 'voice',
        content: audioData,
        timestamp: new Date(),
        delivered: false
    };

    // Add to messages array
    messages.push(newMessage);
    
    // Store in localStorage
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
    
    // Update UI
    updateMessageDisplays();
    showAssistiveFeedback('Voice message sent successfully');
}

// Update handleUpSwipe for voice recording
function handleUpSwipe() {
    // Only process for client users
    if (!currentUser || currentUser.type !== 'client') return;
    
    showAssistiveFeedback('Up swipe detected. Starting voice recording.');
    startVoiceRecording();
}

// Update handleScreenTap to handle voice recording
function handleScreenTap(event) {
    // Only process taps when on the message screen AND the user is a client
    if (currentScreen !== 'messages' || (currentUser && currentUser.type !== 'client')) return;
    
    // Ignore taps on specific buttons
    if (event.target === sendBtn || 
        event.target === voiceInputBtn || 
        event.target === backBtn) {
        return;
    }

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopVoiceRecording();
    }
}

// Update message display functions to handle voice messages
function updateMessageDisplays() {
    if (currentScreen === 'messages' && messagesContainer) {
        displayMessages(messagesContainer);
    } else if (currentScreen === 'admin' && adminMessagesContainer) {
        displayMessages(adminMessagesContainer);
    }
}

function displayMessages(container) {
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="no-messages">No messages yet</div>';
        return;
    }

    messages.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}`;
        
        if (msg.type === 'voice') {
            // Create audio player for voice messages
            messageDiv.innerHTML = `
                <div class="message-content voice-message">
                    <audio controls>
                        <source src="${msg.content}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
            `;
        } else {
            // Regular text message
            messageDiv.innerHTML = `
                <div class="message-content">${msg.content}</div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
            `;
        }
        
        container.appendChild(messageDiv);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Update handleDownSwipe to show all messages
function handleDownSwipe() {
    // Only process for client users
    if (!currentUser || currentUser.type !== 'client') {
        console.log("Ignoring down swipe - not a client user");
        return;
    }
    
    console.log('Down swipe detected - showing message history');
    showAssistiveFeedback('Down swipe detected. Showing message history.');
    
    // Create and show messages modal
    const messagesModal = document.createElement('div');
    messagesModal.className = 'client-messages-modal';
    messagesModal.innerHTML = `
        <div class="client-messages-content">
            <div class="client-messages-header">
                <h3>Message History</h3>
                <button class="close-messages-btn">×</button>
            </div>
            <div class="messages-list"></div>
        </div>
    `;

    document.body.appendChild(messagesModal);
    
    // Display messages in the modal
    const messagesList = messagesModal.querySelector('.messages-list');
    displayMessages(messagesList);

    // Add close button functionality
    const closeBtn = messagesModal.querySelector('.close-messages-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(messagesModal);
    });
}

// Function to initialize the client dashboard accessibility
function initClientDashboardAccessibility() {
    // Get the client dashboard element
    const dashboard = document.querySelector('.client-dashboard');
    if (!dashboard) return;
    
    // Variable to track taps for double-tap detection
    let lastTapTime = 0;
    
    // Add event listener for double tap
    dashboard.addEventListener('click', function(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        // If it's a double-tap (tap within 300ms of last tap)
        if (tapLength < 300 && tapLength > 0) {
            // Prevent any other actions that might be triggered by the tap
            event.preventDefault();
            
            // Read all features
            readAllFeatures();
        }
        
        lastTapTime = currentTime;
    });

    // Initialize battery monitoring
    initBatteryMonitoring();
}

// Function to monitor and update battery level
function initBatteryMonitoring() {
    const batteryLevelElement = document.getElementById('battery-level');
    const batteryIconElement = document.querySelector('.battery-icon');
    
    if (!batteryLevelElement) return;
    
    // Update the battery level display
    function updateBatteryStatus(battery) {
        // Update the percentage text
        const level = Math.floor(battery.level * 100);
        batteryLevelElement.textContent = `${level}%`;
        
        // Update the battery icon based on level
        if (level <= 20) {
            batteryIconElement.textContent = '🪫'; // Low battery icon
        } else {
            batteryIconElement.textContent = '🔋'; // Regular battery icon
        }
        
        // Add appropriate color classes based on battery level
        batteryLevelElement.classList.remove('battery-low', 'battery-medium', 'battery-high');
        
        if (level <= 20) {
            batteryLevelElement.classList.add('battery-low');
        } else if (level <= 50) {
            batteryLevelElement.classList.add('battery-medium');
        } else {
            batteryLevelElement.classList.add('battery-high');
        }
    }
    
    // Check if Battery API is supported
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            // Update the battery status immediately
            updateBatteryStatus(battery);
            
            // Update when battery level changes
            battery.addEventListener('levelchange', () => {
                updateBatteryStatus(battery);
            });
            
            // Update when charging status changes
            battery.addEventListener('chargingchange', () => {
                updateBatteryStatus(battery);
            });
        });
    } else {
        // Fallback for browsers that don't support the Battery API
        batteryLevelElement.textContent = 'N/A';
        console.log('Battery API not supported');
    }
}

// Function to read all available features in the client dashboard
function readAllFeatures() {
    // Stop any current speech
    if (typeof stopSpeaking === 'function') {
        stopSpeaking();
    }
    
    // Get all feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Create a description of all features
    let featuresDescription = "Here are all available features in your SixthSenseAI dashboard: ";
    
    featureCards.forEach(card => {
        const title = card.querySelector('h3').textContent;
        const gesture = card.querySelector('p').textContent;
        const description = card.querySelector('small').textContent;
        
        featuresDescription += `${title}: ${description}. Use ${gesture}. `;
    });
    
    // Add quick actions
    featuresDescription += "You also have quick access buttons at the bottom: Emergency SOS and Voice Help.";
    
    // Show feedback and speak the text
    showAssistiveFeedback("Reading all features");
    speakText(featuresDescription);
}

// Function to provide voice help guide
function provideHelpGuide() {
    // Stop any current speech
    if (typeof stopSpeaking === 'function') {
        stopSpeaking();
    }
    
    const helpText = `
        Welcome to SixthSense AI. Here's how to use this app:
        
        Double tap anywhere on the screen to hear all available features.
        
        Swipe left to use AI Vision, which will describe your surroundings.
        
        Swipe right to hear the current time and date.
        
        Swipe up to record and send a voice message. Double-tap to start recording and double-tap again to stop and send.
        
        Swipe down to hear the last message from your assistant.
        
        Press and hold the screen to activate SOS in an emergency.
        
        At the bottom of the screen, there are two buttons: 
        Emergency SOS on the left, and Voice Help on the right.
        
        To go back to the main screen at any time, shake your device or use the back button.
    `;
    
    showAssistiveFeedback("Voice Help Guide");
    speakText(helpText);
}

// Add click handler for the help button
function initHelpButton() {
    const helpButton = document.getElementById('quick-help');
    if (helpButton) {
        helpButton.addEventListener('click', provideHelpGuide);
    }
    
    // Also make the help feature card activate the help
    const helpFeature = document.getElementById('help-feature');
    if (helpFeature) {
        helpFeature.addEventListener('click', provideHelpGuide);
    }
}

// Load messages from storage
function loadMessages() {
    // Try to get messages from localStorage
    const storedMessages = localStorage.getItem('visionVoiceMessages');
    if (storedMessages) {
        try {
            window.messages = JSON.parse(storedMessages);
            
            // Update UI if we have messages
            if (window.messages.length > 0) {
                updateMessageDisplays();
            }
        } catch (e) {
            console.error('Error parsing stored messages:', e);
            window.messages = [];
        }
    } else {
        window.messages = [];
    }
    
    // Start polling for new messages
    startMessagePolling();
    
    console.log('Messages loaded:', window.messages.length);
    return window.messages;
}

// Start polling for new messages
function startMessagePolling() {
    // Check every 5 seconds for new messages
    window.messagePollingInterval = setInterval(checkForNewMessages, 5000);
}

// Check for new messages from admin
function checkForNewMessages() {
    // If we're using server communication
    fetch('/api/check-messages', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.hasNewMessages) {
            // Reload messages
            const storedMessages = localStorage.getItem('visionVoiceMessages');
            if (storedMessages) {
                try {
                    const parsedMessages = JSON.parse(storedMessages);
                    
                    // Check if we have new messages
                    if (parsedMessages.length > window.messages.length) {
                        // Update messages array
                        window.messages = parsedMessages;
                        
                        // Update UI
                        updateMessageDisplays();
                        
                        // Notify user of new messages
                        notifyNewMessages();
                    }
                } catch (e) {
                    console.error('Error parsing stored messages:', e);
                }
            }
        }
    })
    .catch(err => {
        // Silent failure - this is optional and shouldn't block the UI
        // On fail, still check localStorage for any local updates
        const storedMessages = localStorage.getItem('visionVoiceMessages');
        if (storedMessages) {
            try {
                const parsedMessages = JSON.parse(storedMessages);
                // If the stored messages are different, update the UI
                if (JSON.stringify(parsedMessages) !== JSON.stringify(window.messages)) {
                    window.messages = parsedMessages;
                    updateMessageDisplays();
                }
            } catch (e) {
                console.error('Error parsing stored messages:', e);
            }
        }
    });
}

// Notify user of new messages
function notifyNewMessages() {
    // Play notification sound
    playNotificationSound();
    
    // Show visual notification
    showAssistiveFeedback('New message received from admin');
    
    // Speak notification for clients
    if (currentUser && currentUser.type === 'client') {
        speakText('New message received from admin');
    }
} 