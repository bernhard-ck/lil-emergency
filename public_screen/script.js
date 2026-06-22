const body = document.body;
const messageText = document.getElementById('message-text');

// Connect to Server-Sent Events
const evtSource = new EventSource('/api/stream');

evtSource.onmessage = function(event) {
    const db = JSON.parse(event.data);
    
    // Check if we have a preset in the URL
    // e.g. http://localhost/fire -> "fire"
    // Handle potential trailing slashes or subpaths if needed, but we keep it simple
    let presetName = window.location.pathname.replace(/^\/+|\/+$/g, '');
    
    // Also decode URI component to handle spaces
    if (presetName) {
        presetName = decodeURIComponent(presetName);
    }
    
    let activeMessage = null;
    
    if (presetName) {
        // Try to match the preset name or slug (case insensitive and safe against missing names)
        activeMessage = db.messages.find(m => {
            if (!m.name && !m.slug) return false;
            const msgName = m.name ? m.name.toLowerCase() : '';
            const msgSlug = m.slug || msgName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return msgSlug === presetName.toLowerCase() || msgName === presetName.toLowerCase();
        });
    } else {
        // Fallback to globally active message
        activeMessage = db.messages.find(m => m.id === db.activeId);
    }
    
    if (activeMessage) {
        // Update Text & Color
        messageText.textContent = activeMessage.text;
        messageText.style.color = activeMessage.textColor || '#ffffff';
        
        // Update Background Color
        body.style.backgroundColor = activeMessage.bgColor || '#000000';
        
        // Update Background Image
        if (activeMessage.bgImage) {
            body.style.backgroundImage = `url('/uploads/${activeMessage.bgImage}')`;
        } else {
            body.style.backgroundImage = 'none';
        }
    } else {
        // Clear display if no active message or preset not found
        messageText.textContent = '';
        body.style.backgroundColor = '#000000';
        body.style.backgroundImage = 'none';
    }
};

evtSource.onerror = function(err) {
    console.error("EventSource failed:", err);
    // Optionally retry logic here, but EventSource usually auto-reconnects
};
