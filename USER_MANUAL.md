# User Manual

Welcome to the Emergency Display System. This manual explains how to use the admin command center to control the messages shown on the festival screens.

## Accessing the Admin Panel
1. Open a web browser on any device connected to the local network.
2. Navigate to the admin address (e.g., `http://<server-ip>:8080`).
3. You will be greeted by a login page. Enter the password configured by the system administrator to unlock the command center.

## Interface Overview
The Command Center is split into two main sections:
1. **Create New Message:** A form to design new emergency or informational broadcasts.
2. **Configured Messages:** A list of all previously created messages that you can activate or delete.

You can also use the language toggle in the top left to switch between **English** and **Nederlands**, and the theme toggle in the top right to switch between **Light Mode** and **Dark Mode**.

## Creating a Message
Fill out the "Create New Message" form:
- **Preset Name:** A short, memorable name (e.g., `evacuation`, `lost-child`). This generates a friendly URL for the preset.
- **Message Text:** The exact text to appear on the big screens.
- **Text Color & Background Color:** Use the color pickers to ensure high contrast and readability.
- **Background Image (Optional):** Upload an image file. If selected, this image will cover the screen instead of the solid background color.

Click **Create Message**. It will instantly appear in the "Configured Messages" list on the right.

## Controlling the Screens
There are two ways screens can display your messages:

### 1. Global Activation
If a screen is pointing to the root URL (e.g., `http://<server-ip>`), it is listening for the "Global Active" message.
To change what these screens show, simply click the green **Set Active** button next to any configured message. All global screens will update instantly without refreshing.

### 2. Direct Preset URLs
If you want a specific screen to always show a specific message, you can point that screen to the direct URL of the message. 
Under each message in the Configured Messages list, you will see a clickable **URL**. Point a screen's browser to that URL. If you edit that message later, the screen will still update automatically.

## Fade to Black
If you need to instantly clear all screens listening to the global active state, click the large red **FADE TO BLACK** button. All global screens will instantly go black and display no text.

## Deleting Messages
To permanently remove a message from the system, click the red **Delete** button next to it. Any screens pointed directly to its URL will go black.
