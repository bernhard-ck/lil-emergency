const form = document.getElementById('create-form');
const listContainer = document.getElementById('message-list');

let state = {
    activeId: null,
    messages: []
};

const i18n = {
    en: {
        header_title: "Emergency Command Center",
        theme_light: "☀️ Light Mode",
        theme_dark: "🌙 Dark Mode",
        logout: "Logout",
        create_title: "Create New Message",
        preset_name: "Preset Name",
        msg_text: "Message Text",
        txt_color: "Text Color",
        bg_color: "Background Color",
        bg_img: "Background Image (Optional)",
        btn_create: "Create Message",
        fade_to_black: "FADE TO BLACK",
        fade_desc: "Instantly clear all screens",
        config_msgs: "Configured Messages",
        no_msgs: "No messages configured. Create one to the left.",
        active_badge: "ACTIVE ON SCREEN",
        set_active: "Set Active",
        delete_btn: "Delete",
        confirm_del: "Are you sure you want to delete this message?",
        url_label: "URL: "
    },
    nl: {
        header_title: "Noodgevallen Beheercentrum",
        theme_light: "☀️ Lichte Modus",
        theme_dark: "🌙 Donkere Modus",
        logout: "Uitloggen",
        create_title: "Nieuw Bericht Maken",
        preset_name: "Naam Voorinstelling",
        msg_text: "Berichttekst",
        txt_color: "Tekstkleur",
        bg_color: "Achtergrondkleur",
        bg_img: "Achtergrondafbeelding (Optioneel)",
        btn_create: "Bericht Aanmaken",
        fade_to_black: "ZWARTE ACHTERGROND",
        fade_desc: "Wis direct alle schermen",
        config_msgs: "Geconfigureerde Berichten",
        no_msgs: "Geen berichten geconfigureerd. Maak er links een aan.",
        active_badge: "ACTIEF OP SCHERM",
        set_active: "Maak Actief",
        delete_btn: "Verwijderen",
        confirm_del: "Weet je zeker dat je dit bericht wilt verwijderen?",
        url_label: "URL: "
    }
};

let currentLang = localStorage.getItem('lang') || 'en';

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    const langSelect = document.getElementById('lang-toggle');
    if(langSelect) langSelect.value = lang;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) el.textContent = i18n[lang][key];
    });
    
    const nameInput = document.getElementById('name');
    if(nameInput) nameInput.placeholder = lang === 'nl' ? 'bijv. brandontruiming' : 'e.g. fire-evacuation';
    const textInput = document.getElementById('text');
    if(textInput) textInput.placeholder = lang === 'nl' ? 'Voer noodbericht in...' : 'Enter emergency message...';
    
    updateThemeToggleText();
    render();
}

function updateThemeToggleText() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = isLight ? i18n[currentLang].theme_dark : i18n[currentLang].theme_light;
    }
}

let appConfig = { screenPort: 80 };

// Fetch initial data
async function fetchData() {
    try {
        const [res, configRes] = await Promise.all([
            fetch('/api/messages'),
            fetch('/api/config')
        ]);
        state = await res.json();
        appConfig = await configRes.json();
        render();
    } catch (e) {
        console.error('Failed to fetch data', e);
    }
}

// Render the list
function render() {
    listContainer.innerHTML = '';
    
    if (state.messages.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center;">${i18n[currentLang].no_msgs}</p>`;
        return;
    }

    state.messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = `message-item ${msg.id === state.activeId ? 'active' : ''}`;
        
        let previewStyle = `background-color: ${msg.bgColor};`;
        if (msg.bgImage) {
            previewStyle += ` background-image: url('/uploads/${msg.bgImage}');`;
        }

        const nameStr = msg.name || `preset-${msg.id}`;
        const slugStr = msg.slug || nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Construct the correct screen URL using the screen port
        const hostname = window.location.hostname;
        const portStr = (appConfig.screenPort == 80 || appConfig.screenPort == 443) ? '' : `:${appConfig.screenPort}`;
        const screenUrl = `${window.location.protocol}//${hostname}${portStr}/${slugStr}`;

        item.innerHTML = `
            <div class="message-content">
                <div class="color-preview" style="${previewStyle}"></div>
                <div class="text-preview">
                    <p style="color: ${msg.textColor || '#fff'}">${msg.text}</p>
                    <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 2px;">
                        ${i18n[currentLang].url_label} <a href="${screenUrl}" target="_blank" style="color: var(--primary); text-decoration: none;">${screenUrl}</a>
                    </small>
                </div>
            </div>
            <div class="actions">
                ${msg.id === state.activeId 
                    ? `<span class="active-badge">${i18n[currentLang].active_badge}</span>` 
                    : `<button class="btn btn-success" onclick="setActive('${msg.id}')">${i18n[currentLang].set_active}</button>`
                }
                <button class="btn btn-danger" onclick="deleteMessage('${msg.id}')">${i18n[currentLang].delete_btn}</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// Create new message
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const text = document.getElementById('text').value;
    const textColor = document.getElementById('textColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const fileInput = document.getElementById('bgImage');
    
    let bgImage = null;
    
    // Handle image upload if exists
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        
        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();
        bgImage = uploadData.filename;
    }
    
    // Create message
    await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text, textColor, bgColor, bgImage })
    });
    
    form.reset();
    fetchData();
});

// Set active message
async function setActive(id) {
    await fetch('/api/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    fetchData();
}

// Fade to black (clear active message)
async function fadeToBlack() {
    await fetch('/api/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: null })
    });
    fetchData();
}

// Delete message
async function deleteMessage(id) {
    if (!confirm(i18n[currentLang].confirm_del)) return;
    
    const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE'
    });
    if (res.status === 401) return window.location.href = '/login';
    fetchData();
}

// Logout
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
}

// Theme Toggle
function toggleTheme() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleText();
}

// Init
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
}
changeLang(currentLang);
fetchData();
