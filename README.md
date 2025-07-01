# Test Case Generator: On-Premise Deployment Guide

This document provides a comprehensive guide for setting up, configuring, and deploying the Test Case Generator application on an on-premise server.

## Table of Contents
1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Firebase Project Setup](#3-firebase-project-setup)
4. [Azure DevOps Setup](#4-azure-devops-setup)
5. [Application Configuration](#5-application-configuration)
    - [Environment Variables (`workspace/.env`)](#environment-variables-workspaceenv)
    - [Google AI / Genkit Authentication](#google-ai--genkit-authentication)
6. [Installation](#6-installation)
7. [Building and Running for Production](#7-building-and-running-for-production)
    - [Building the Application](#building-the-application)
    - [Running the Application](#running-the-application)
    - [Using a Process Manager (Recommended)](#using-a-process-manager-recommended)
8. [Development](#8-development)
9. [Technology Stack](#9-technology-stack)

---

## 1. Overview

The Test Case Generator is a web application built with Next.js that leverages AI to generate detailed test cases from user stories. It integrates with Firebase for user authentication and data storage, and with Azure DevOps to fetch work items and push the generated test cases.

## 2. Prerequisites

Before you begin, ensure your server has the following software installed:
- **Node.js**: Version 20.x or later.
- **npm**: (Usually comes with Node.js).
- **Git**: For cloning the repository.
- **Firebase Account**: You will need a Firebase project to handle user authentication and store user-specific configurations.
- **Azure DevOps Account**: You need an account with access to an organization and project where work items are managed.
- **Google Cloud Account**: For using the AI (Genkit) features, you'll need a Google Cloud project with the Vertex AI API enabled and a service account.

## 3. Firebase Project Setup

This application requires a Firebase project for its core functionality.

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication**:
    - In your project, go to the **Authentication** section.
    - Click on the "Sign-in method" tab.
    - Enable the **Email/Password** provider.
3.  **Enable Firestore**:
    - Go to the **Firestore Database** section.
    - Click "Create database".
    - Start in **production mode**. This is important for security.
    - Choose a location for your database.
4.  **Get Web App Credentials**:
    - Go to your Project Settings (click the gear icon).
    - In the "General" tab, scroll down to "Your apps".
    - Click on the Web icon (`</>`) to create a new web app.
    - Give it a nickname and register the app.
    - Firebase will provide you with a `firebaseConfig` object. You will need these keys for the `.env` file.

## 4. Azure DevOps Setup

To connect to Azure DevOps, the application needs a Personal Access Token (PAT).

1.  **Create a Personal Access Token (PAT)**:
    - In Azure DevOps, go to your **User settings** -> **Personal Access Tokens**.
    - Create a new token with the following scopes (at minimum):
        - **Work Items**: `Read & write`
        - **Test Management**: `Read & write`
    - **Important**: Copy the generated PAT immediately. You will not be able to see it again.
2.  **Find Your Organization and Project Names**: These are typically part of the URL when you are browsing your project (e.g., `https://dev.azure.com/{organization}/{project}`).

## 5. Application Configuration

### Environment Variables (`workspace/.env`)

All secret keys and configuration variables are managed in a single file: `workspace/.env`. **This is the only file you need to edit.**

1.  Navigate to the `workspace` directory in the project root.
2.  Create a file named `.env`.
3.  Copy and paste the following template into the file and fill it with your credentials.

```env
# ----------------------------------
# FIREBASE CONFIGURATION (Required)
# ----------------------------------
# Get these values from your Firebase project's web app settings.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ----------------------------------
# AZURE DEVOPS CONFIGURATION (Optional - Global Default)
# ----------------------------------
# If you fill these out, they will be the default configuration for all new users.
# Users can override these with their own personal settings in the app's configuration page.
NEXT_PUBLIC_AZURE_DEVOPS_PAT=
NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION=
NEXT_PUBLIC_AZURE_DEVOPS_PROJECT=

# ----------------------------------
# GOOGLE AI / GENKIT (Required for AI Features)
# ----------------------------------
# Path to your Google Cloud service account key file.
# See the "Google AI / Genkit Authentication" section below for details.
GOOGLE_APPLICATION_CREDENTIALS=
```

### Google AI / Genkit Authentication

The AI features are powered by Genkit, which calls Google's Generative AI models. To authenticate on your on-premise server, you must use a **Service Account**.

1.  **Enable the Vertex AI API**: In your Google Cloud project, go to the APIs & Services Dashboard and enable the "Vertex AI API".
2.  **Create a Service Account**:
    - In Google Cloud IAM & Admin, go to "Service Accounts".
    - Create a new service account. Give it the **Vertex AI User** role.
    - After creating it, go to the "Keys" tab for that service account.
    - Click "Add Key" -> "Create new key". Choose **JSON** as the type.
    - A JSON file will be downloaded. This is your service account key.
3.  **Configure the Server**:
    - Place the downloaded JSON key file somewhere secure on your server (e.g., `/etc/secrets/gcp-key.json`).
    - In your `workspace/.env` file, set the `GOOGLE_APPLICATION_CREDENTIALS` variable to the absolute path of that JSON file.

## 6. Installation

Follow these steps on your server to install the application dependencies.

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd <repository-folder>

# 2. Install dependencies
npm install
```

## 7. Building and Running for Production

### Building the Application
This command compiles and optimizes the Next.js application for production.

```bash
npm run build
```

### Running the Application
This command starts the production server. The app will be available on port 3000 by default.

```bash
npm run start
```

### Using a Process Manager (Recommended)
For a real on-premise deployment, you should use a process manager like **PM2** to keep the application running continuously and manage logs.

1.  **Install PM2 globally**:
    ```bash
    npm install pm2 -g
    ```
2.  **Start the application with PM2**:
    ```bash
    # The --name flag gives your process a memorable name.
    pm2 start npm --name "test-case-generator" -- run start
    ```
3.  **Common PM2 Commands**:
    ```bash
    pm2 list          # List all running processes
    pm2 stop 0        # Stop the process with ID 0
    pm2 restart 0     # Restart the process
    pm2 logs          # View logs for all processes
    pm2 startup       # Configure PM2 to start on server reboot
    ```

## 8. Development

To run the application in development mode:

1.  **Terminal 1: Run the Next.js app**:
    ```bash
    npm run dev
    ```
2.  **Terminal 2: Run the Genkit AI server**: The AI flows run in a separate process during development.
    ```bash
    npm run genkit:watch
    ```

## 9. Technology Stack

- **Framework**: Next.js
- **UI**: React, ShadCN UI, Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firestore (for user-specific settings)
- **AI**: Genkit (using Google's Gemini models)
- **State Management**: React Context & Custom Hooks
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form, Zod
