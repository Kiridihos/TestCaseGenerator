# Generador de Casos de Prueba: Guía de Despliegue On-Premise - By Diego Fino

Este documento proporciona una guía completa para configurar, y desplegar la aplicación Generador de Casos de Prueba en un servidor on-premise.

## Tabla de Contenidos
1. [Descripción General](#1-descripción-general)
2. [Arquitectura de IA: ¿Local o en la Nube?](#2-arquitectura-de-ia-local-o-en-la-nube)
3. [Prerrequisitos](#3-prerrequisitos)
4. [Configuración del Proyecto Firebase](#4-configuración-del-proyecto-firebase)
5. [Configuración de Azure DevOps](#5-configuración-de-azure-devops)
6. [Configuración de la Aplicación](#6-configuración-de-la-aplicación)
    - [Variables de Entorno (`.env`)](#variables-de-entorno-env)
    - [Autenticación de Google AI / Genkit](#autenticación-de-google-ai--genkit)
7. [Instalación](#7-instalación)
8. [Compilar y Ejecutar para Producción](#8-compilar-y-ejecutar-para-producción)
    - [Compilar la Aplicación](#compilar-la-aplicación)
    - [Ejecutar la Aplicación](#ejecutar-la-aplicación)
    - [Usar un Gestor de Procesos (Recomendado)](#usar-un-gestor-de-procesos-recomendado)
9. [Desarrollo](#9-desarrollo)
10. [Pila Tecnológica](#10-pila-tecnológica)

---

## 1. Descripción General

El Generador de Casos de Prueba es una aplicación web construida con Next.js que utiliza IA para generar casos de prueba detallados a partir de historias de usuario. Se integra con Firebase para la autenticación de usuarios y el almacenamiento de datos, y con Azure DevOps para obtener elementos de trabajo y enviar los casos de prueba generados.

## 2. Arquitectura de IA: ¿Local o en la Nube?

Es importante aclarar que la aplicación **no ejecuta el modelo de Inteligencia Artificial en tu servidor local**. El modelo de IA (Gemini de Google) es un servicio que se consume desde la nube. La arquitectura funciona de la siguiente manera:

- **Modelo de IA (Gemini)**: Es el "cerebro". Se encuentra en los servidores de Google Cloud y es quien procesa las solicitudes para generar los casos de prueba.
- **Genkit (El Conector)**: Es el *toolkit* que se ejecuta en tu servidor. Actúa como un intermediario seguro que comunica tu aplicación con el modelo Gemini.
- **Autenticación (La "Llave")**: Para que tu servidor pueda usar Gemini, necesita autenticarse con Google Cloud. Esto se puede hacer de dos formas: con una **Clave de API** (más simple) o con una **Cuenta de Servicio** (más segura).

Por lo tanto, el comando `npm run genkit:watch` inicia este conector local, no el modelo de IA en sí.

## 3. Prerrequisitos

Antes de comenzar, asegúrate de que tu servidor tenga el siguiente software instalado:
- **Node.js**: Versión 20.x o posterior.
- **npm**: (Generalmente viene con Node.js).
- **Git**: Para clonar el repositorio.
- **Cuenta de Firebase**: Necesitarás un proyecto de Firebase para manejar la autenticación de usuarios y almacenar configuraciones específicas del usuario.
- **Cuenta de Azure DevOps**: Necesitas una cuenta con acceso a una organización y un proyecto donde se gestionan los elementos de trabajo.
- **Cuenta de Google para IA**: Para usar las funciones de IA (Genkit), necesitarás una clave de API de Google AI Studio o un proyecto de Google Cloud con la API de Vertex AI habilitada y una cuenta de servicio.

## 4. Configuración del Proyecto Firebase

Esta aplicación requiere un proyecto de Firebase para su funcionalidad principal.

1.  **Crear un Proyecto de Firebase**: Ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Habilitar Autenticación**:
    - En tu proyecto, ve a la sección de **Authentication**.
    - Haz clic en la pestaña "Sign-in method" (Método de inicio de sesión).
    - Habilita el proveedor **Email/Password** (Correo y contraseña).
3.  **Habilitar Firestore (¡Paso Crucial!)**:
    - Esta aplicación **requiere** Firestore para guardar la configuración personal de cada usuario. Si no habilitas este servicio, la aplicación no podrá guardar datos.
    - En tu proyecto de Firebase, ve a la sección **Firestore Database**.
    - Haz clic en **"Crear base de datos"**.
    - Selecciona iniciar en **modo de producción**. Esto es vital por seguridad.
    - Elige la ubicación para tu base de datos (elige la más cercana a tus usuarios).
    - Una vez creada, ve a la pestaña **"Reglas"** y reemplaza el contenido con las siguientes reglas para permitir que los usuarios gestionen su propia configuración de forma segura:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /userConfigs/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
4.  **Obtener Credenciales de la Aplicación Web**:
    - Ve a la Configuración de tu Proyecto (haz clic en el ícono de engranaje).
    - En la pestaña "General", desplázate hacia abajo hasta "Tus aplicaciones".
    - Haz clic en el ícono Web (`</>`) para crear una nueva aplicación web.
    - Dale un apodo y registra la aplicación.
    - Firebase te proporcionará un objeto `firebaseConfig`. Necesitarás estas claves para el archivo `.env`.

## 5. Configuración de Azure DevOps

Para conectarse a Azure DevOps, la aplicación necesita un Token de Acceso Personal (PAT).

1.  **Crear un Token de Acceso Personal (PAT)**:
    - En Azure DevOps, ve a tus **User settings** (Configuración de usuario) -> **Personal Access Tokens**.
    - Crea un nuevo token con los siguientes ámbitos (como mínimo):
        - **Work Items** (Elementos de trabajo): `Read & write` (Lectura y escritura)
        - **Test Management** (Gestión de pruebas): `Read & write` (Lectura y escritura)
    - **Importante**: Copia el PAT generado inmediatamente. No podrás verlo de nuevo.
2.  **Encontrar los Nombres de tu Organización y Proyecto**: Estos suelen ser parte de la URL cuando navegas por tu proyecto (ej., `https://dev.azure.com/{organization}/{project}`).

## 6. Configuración de la Aplicación

### Variables de Entorno (`.env`)

Todas las claves secretas y variables de configuración se gestionan en un único archivo: `.env`, ubicado en la raíz del proyecto. **Este es el único archivo que necesitas editar.**

1.  En la raíz de tu proyecto, crea un archivo llamado `.env`.
2.  Copia y pega la siguiente plantilla en el archivo y llénala con tus credenciales.

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
# GOOGLE AI / GENKIT (Requerido - Elige UNA opción)
# ----------------------------------
# La aplicación necesita autenticarse con Google para usar la IA.
# Elige solo UNO de los siguientes métodos. El método de la API Key es más simple.
# El método de Cuenta de Servicio es más seguro para producción.

# --- Opción 1: Clave de API (Más simple) ---
# Obtén una clave desde Google AI Studio: https://aistudio.google.com/app/apikey
# Descomenta y pega tu clave aquí.
# GOOGLE_API_KEY=

# --- Opción 2: Cuenta de Servicio (Más seguro) ---
# Ruta a tu archivo de clave de cuenta de servicio de Google Cloud.
# Si usas este método, deja GOOGLE_API_KEY comentado.
# Consulta la sección "Autenticación de Google AI / Genkit" para más detalles.
GOOGLE_APPLICATION_CREDENTIALS=
```

### Autenticación de Google AI / Genkit

> **Nota para usuarios de Firebase Studio / App Hosting:** Si estás ejecutando esta aplicación dentro de Firebase Studio o la has desplegado en Firebase App Hosting, **no necesitas configurar credenciales de IA**. El entorno de Google Cloud gestiona la autenticación automáticamente. Las siguientes instrucciones son para despliegues en servidores externos (on-premise).

Para usar las funciones de IA, tu aplicación necesita autenticarse con Google. Tienes dos opciones:

#### Opción 1: Clave de API (Simple)

Este es el método más rápido para empezar.
1.  Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Haz clic en "Create API key in new project".
3.  Copia la clave generada.
4.  En tu archivo `.env`, descomenta la línea `GOOGLE_API_KEY` y pega tu clave allí.

#### Opción 2: Cuenta de Servicio (Recomendado para Producción)

Este método es más seguro y robusto, ideal para aplicaciones en producción.
1.  **Habilitar la API de Vertex AI**: En tu proyecto de Google Cloud, ve al Panel de APIs y Servicios y habilita la "Vertex AI API".
2.  **Crear una Cuenta de Servicio**:
    - En Google Cloud IAM y Administración, ve a "Cuentas de servicio".
    - Crea una nueva cuenta de servicio. Asígnale el rol de **Usuario de Vertex AI**.
    - Después de crearla, ve a la pestaña "Claves" de esa cuenta de servicio.
    - Haz clic en "Agregar clave" -> "Crear nueva clave". Elige **JSON** como tipo.
    - Se descargará un archivo JSON. Esta es tu clave de cuenta de servicio.
3.  **Configurar el Servidor**:
    - Coloca el archivo de clave JSON descargado en un lugar seguro en tu servidor (ej., `/etc/secrets/gcp-key.json`).
    - En tu archivo `.env`, establece la variable `GOOGLE_APPLICATION_CREDENTIALS` a la ruta absoluta de ese archivo JSON. Asegúrate de que la variable `GOOGLE_API_KEY` esté comentada o vacía.

## 7. Instalación

Sigue estos pasos en tu servidor para instalar las dependencias de la aplicación.

```bash
# 1. Clona el repositorio
git clone <url-de-tu-repositorio>
cd <carpeta-del-repositorio>

# 2. Instala las dependencias
npm install
```

## 8. Compilar y Ejecutar para Producción

> **¡IMPORTANTE! Proceso de Compilación**
> Antes de compilar, asegúrate de que tu archivo `.env` esté completamente configurado. Next.js **incrusta** las variables de entorno públicas (las que empiezan con `NEXT_PUBLIC_`) en el código de la aplicación durante el proceso de compilación (`npm run build`).
> Si modificas el archivo `.env` después de haber compilado la aplicación, **debes volver a ejecutar `npm run build`** para que los cambios surtan efecto.

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

## 9. Desarrollo

Para ejecutar la aplicación en modo de desarrollo, la aplicación se divide en dos procesos de servidor independientes que necesitan ejecutarse al mismo tiempo:

1.  **Terminal 1: Ejecuta la aplicación Next.js (Interfaz de Usuario)**:
    - **Comando:** `npm run dev`
    - **Función:** Este servidor se encarga de todo lo visual: las páginas, los botones, los formularios, etc.

2.  **Terminal 2: Ejecuta el servidor de IA de Genkit (Conector de IA)**:
    - **Comando:** `npm run genkit:watch`
    - **Función:** Este servidor se dedica exclusivamente a comunicarse con la IA de Google. Cuando tu aplicación necesita generar casos de prueba, le envía una solicitud a este servidor.

Necesitarás dos terminales porque cada comando inicia un proceso que "ocupa" esa terminal para ejecutarse y mostrar sus registros.

## 10. Pila Tecnológica

- **Framework**: Next.js
- **UI (Interfaz de Usuario)**: React, ShadCN UI, Tailwind CSS
- **Autenticación**: Firebase Authentication
- **Base de Datos**: Firestore (para configuraciones específicas de usuario)
- **IA**: Genkit (usando los modelos Gemini de Google)
- **Gestión de Estado**: React Context & Custom Hooks
- **Estilos**: Tailwind CSS
- **Manejo de Formularios**: React Hook Form, Zod
