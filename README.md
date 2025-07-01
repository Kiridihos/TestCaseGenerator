# Generador de Casos de Prueba: Guía de Despliegue On-Premise

Este documento proporciona una guía completa para configurar, y desplegar la aplicación Generador de Casos de Prueba en un servidor on-premise.

## Tabla de Contenidos
1. [Descripción General](#1-descripción-general)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Configuración del Proyecto Firebase](#3-configuración-del-proyecto-firebase)
4. [Configuración de Azure DevOps](#4-configuración-de-azure-devops)
5. [Configuración de la Aplicación](#5-configuración-de-la-aplicación)
    - [Variables de Entorno (`workspace/.env`)](#variables-de-entorno-workspaceenv)
    - [Autenticación de Google AI / Genkit](#autenticación-de-google-ai--genkit)
6. [Instalación](#6-instalación)
7. [Compilar y Ejecutar para Producción](#7-compilar-y-ejecutar-para-producción)
    - [Compilar la Aplicación](#compilar-la-aplicación)
    - [Ejecutar la Aplicación](#ejecutar-la-aplicación)
    - [Usar un Gestor de Procesos (Recomendado)](#usar-un-gestor-de-procesos-recomendado)
8. [Desarrollo](#8-desarrollo)
9. [Pila Tecnológica](#9-pila-tecnológica)

---

## 1. Descripción General

El Generador de Casos de Prueba es una aplicación web construida con Next.js que utiliza IA para generar casos de prueba detallados a partir de historias de usuario. Se integra con Firebase para la autenticación de usuarios y el almacenamiento de datos, y con Azure DevOps para obtener elementos de trabajo y enviar los casos de prueba generados.

## 2. Prerrequisitos

Antes de comenzar, asegúrate de que tu servidor tenga el siguiente software instalado:
- **Node.js**: Versión 20.x o posterior.
- **npm**: (Generalmente viene con Node.js).
- **Git**: Para clonar el repositorio.
- **Cuenta de Firebase**: Necesitarás un proyecto de Firebase para manejar la autenticación de usuarios y almacenar configuraciones específicas del usuario.
- **Cuenta de Azure DevOps**: Necesitas una cuenta con acceso a una organización y un proyecto donde se gestionan los elementos de trabajo.
- **Cuenta de Google Cloud**: Para usar las funciones de IA (Genkit), necesitarás un proyecto de Google Cloud con la API de Vertex AI habilitada y una cuenta de servicio.

## 3. Configuración del Proyecto Firebase

Esta aplicación requiere un proyecto de Firebase para su funcionalidad principal.

1.  **Crear un Proyecto de Firebase**: Ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Habilitar Autenticación**:
    - En tu proyecto, ve a la sección de **Authentication**.
    - Haz clic en la pestaña "Sign-in method" (Método de inicio de sesión).
    - Habilita el proveedor **Email/Password** (Correo y contraseña).
3.  **Habilitar Firestore**:
    - Ve a la sección **Firestore Database**.
    - Haz clic en "Crear base de datos".
    - Inicia en **modo de producción**. Esto es importante por seguridad.
    - Elige una ubicación para tu base de datos.
4.  **Obtener Credenciales de la Aplicación Web**:
    - Ve a la Configuración de tu Proyecto (haz clic en el ícono de engranaje).
    - En la pestaña "General", desplázate hacia abajo hasta "Tus aplicaciones".
    - Haz clic en el ícono Web (`</>`) para crear una nueva aplicación web.
    - Dale un apodo y registra la aplicación.
    - Firebase te proporcionará un objeto `firebaseConfig`. Necesitarás estas claves para el archivo `.env`.

## 4. Configuración de Azure DevOps

Para conectarse a Azure DevOps, la aplicación necesita un Token de Acceso Personal (PAT).

1.  **Crear un Token de Acceso Personal (PAT)**:
    - En Azure DevOps, ve a tus **User settings** (Configuración de usuario) -> **Personal Access Tokens**.
    - Crea un nuevo token con los siguientes ámbitos (como mínimo):
        - **Work Items** (Elementos de trabajo): `Read & write` (Lectura y escritura)
        - **Test Management** (Gestión de pruebas): `Read & write` (Lectura y escritura)
    - **Importante**: Copia el PAT generado inmediatamente. No podrás verlo de nuevo.
2.  **Encontrar los Nombres de tu Organización y Proyecto**: Estos suelen ser parte de la URL cuando navegas por tu proyecto (ej., `https://dev.azure.com/{organization}/{project}`).

## 5. Configuración de la Aplicación

### Variables de Entorno (`workspace/.env`)

Todas las claves secretas y variables de configuración se gestionan en un único archivo: `workspace/.env`. **Este es el único archivo que necesitas editar.**

1.  Navega al directorio `workspace` en la raíz del proyecto.
2.  Crea un archivo llamado `.env`.
3.  Copia y pega la siguiente plantilla en el archivo y llénala con tus credenciales.

```env
# ----------------------------------
# CONFIGURACIÓN DE FIREBASE (Requerido)
# ----------------------------------
# Obtén estos valores de la configuración de tu aplicación web en el proyecto de Firebase.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ----------------------------------
# CONFIGURACIÓN DE AZURE DEVOPS (Opcional - Predeterminado Global)
# ----------------------------------
# Si completas estos campos, serán la configuración predeterminada para todos los nuevos usuarios.
# Los usuarios pueden sobrescribir esto con su propia configuración personal en la página de configuración de la aplicación.
NEXT_PUBLIC_AZURE_DEVOPS_PAT=
NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION=
NEXT_PUBLIC_AZURE_DEVOPS_PROJECT=

# ----------------------------------
# GOOGLE AI / GENKIT (Requerido para Funciones de IA)
# ----------------------------------
# Ruta a tu archivo de clave de cuenta de servicio de Google Cloud.
# Consulta la sección "Autenticación de Google AI / Genkit" a continuación para más detalles.
GOOGLE_APPLICATION_CREDENTIALS=
```

### Autenticación de Google AI / Genkit

Las funciones de IA son impulsadas por Genkit, que llama a los modelos de IA Generativa de Google. Para autenticarte en tu servidor on-premise, debes usar una **Cuenta de Servicio**.

1.  **Habilitar la API de Vertex AI**: En tu proyecto de Google Cloud, ve al Panel de APIs y Servicios y habilita la "Vertex AI API".
2.  **Crear una Cuenta de Servicio**:
    - En Google Cloud IAM y Administración, ve a "Cuentas de servicio".
    - Crea una nueva cuenta de servicio. Asígnale el rol de **Usuario de Vertex AI**.
    - Después de crearla, ve a la pestaña "Claves" de esa cuenta de servicio.
    - Haz clic en "Agregar clave" -> "Crear nueva clave". Elige **JSON** como tipo.
    - Se descargará un archivo JSON. Esta es tu clave de cuenta de servicio.
3.  **Configurar el Servidor**:
    - Coloca el archivo de clave JSON descargado en un lugar seguro en tu servidor (ej., `/etc/secrets/gcp-key.json`).
    - En tu archivo `workspace/.env`, establece la variable `GOOGLE_APPLICATION_CREDENTIALS` a la ruta absoluta de ese archivo JSON.

## 6. Instalación

Sigue estos pasos en tu servidor para instalar las dependencias de la aplicación.

```bash
# 1. Clona el repositorio
git clone <url-de-tu-repositorio>
cd <carpeta-del-repositorio>

# 2. Instala las dependencias
npm install
```

## 7. Compilar y Ejecutar para Producción

### Compilar la Aplicación
Este comando compila y optimiza la aplicación Next.js para producción.

```bash
npm run build
```

### Ejecutar la Aplicación
Este comando inicia el servidor de producción. La aplicación estará disponible en el puerto 3000 por defecto.

```bash
npm run start
```

### Usar un Gestor de Procesos (Recomendado)
Para un despliegue on-premise real, deberías usar un gestor de procesos como **PM2** para mantener la aplicación ejecutándose continuamente y gestionar los registros.

1.  **Instalar PM2 globalmente**:
    ```bash
    npm install pm2 -g
    ```
2.  **Iniciar la aplicación con PM2**:
    ```bash
    # La bandera --name le da a tu proceso un nombre fácil de recordar.
    pm2 start npm --name "test-case-generator" -- run start
    ```
3.  **Comandos comunes de PM2**:
    ```bash
    pm2 list          # Lista todos los procesos en ejecución
    pm2 stop 0        # Detiene el proceso con ID 0
    pm2 restart 0     # Reinicia el proceso
    pm2 logs          # Muestra los registros de todos los procesos
    pm2 startup       # Configura PM2 para que se inicie al reiniciar el servidor
    ```

## 8. Desarrollo

Para ejecutar la aplicación en modo de desarrollo, la aplicación se divide en dos procesos separados: el servidor web de Next.js (para la interfaz de usuario) y el servidor de IA de Genkit. Necesitarás dos terminales para ejecutarlos simultáneamente.

1.  **Terminal 1: Ejecuta la aplicación Next.js**:
    ```bash
    npm run dev
    ```
2.  **Terminal 2: Ejecuta el servidor de IA de Genkit**: Los flujos de IA se ejecutan en este proceso separado, y el comando `watch` reiniciará el servidor automáticamente si haces cambios en los archivos de IA.
    ```bash
    npm run genkit:watch
    ```

## 9. Pila Tecnológica

- **Framework**: Next.js
- **UI (Interfaz de Usuario)**: React, ShadCN UI, Tailwind CSS
- **Autenticación**: Firebase Authentication
- **Base de Datos**: Firestore (para configuraciones específicas de usuario)
- **IA**: Genkit (usando los modelos Gemini de Google)
- **Gestión de Estado**: React Context & Custom Hooks
- **Estilos**: Tailwind CSS
- **Manejo de Formularios**: React Hook Form, Zod
