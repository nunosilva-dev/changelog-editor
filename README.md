# Changelog Editor

A developer-centric desktop application for managing and maintaining `changelog.md` files across modular projects. Built with **Electron** and **TailwindCSS**, it bridges the gap between structured input and raw Markdown editing.

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

## ✨ Features

* **📦 Project Hierarchy Scanning:** Visualize your project folder structure and jump between modules instantly.
* **🛠 Builder Mode:** Structured input fields for standard changelog categories (`Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, `Security`).
* **📝 Raw Editor:** Switch to a full Markdown editor for granular control when you need it.
* **🔄 Intelligent Parsing:** Automatically parses existing `changelog.md` files to populate fields—no data loss.
* **🌑 Dark Mode:** Fully themed UI that respects system preferences or manual toggling.
* **⚡️ Keyboard Shortcuts:** Use `Shift + Enter` in builder fields to automatically create sub-bullets.

## 🚀 Installation

### macOS (Homebrew)
```bash
    brew tap nunosilva-dev/changelog-editor https://github.com/nunosilva-dev/changelog-editor
    brew install --cask changelog-editor
```

### Windows & Linux
Check the [Releases](https://github.com/nunosilva-dev/changelog-editor/releases) page for the latest `.exe` and `.AppImage` files.

## 🛠 Development

If you want to run the project locally or contribute:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/nunosilva-dev/changelog-editor.git
    cd changelog-editor
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run in Development Mode**
    ```bash
    npm start
    ```

4.  **Build Locally (Optional)**
    To create a binary for your current OS:
    ```bash
    npm run build
    ```
    *(Note: This requires `electron-builder` to be installed)*

## 📖 Usage Guide

1.  **Open Project:** Click "Open Folder" to select the root directory of your project.
2.  **Select Module:** Navigate the tree view on the left to find the folder containing the `changelog.md` you wish to edit.
3.  **Edit:**
    * **Builder Mode:** Fill in the text areas. The app handles formatting.
    * **Raw Mode:** Toggle "Raw Editor" to paste or write Markdown directly.
4.  **Publish:** Click **Publish** to write the changes to the file system.
