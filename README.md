# Generador de Casos de Prueba: Guía de Despliegue On-Premise - By Diego Fino

Este proyecto es una aplicación web que automatiza la creación de casos de prueba a partir de historias de usuario mediante inteligencia artificial, integrándose con Azure DevOps para la interacción con elementos de trabajo (Historias de usuario).



Este documento proporciona una guía completa para configurar, y desplegar la aplicación Generador de Casos de Prueba en un servidor on-premise.

## Tabla de Contenidos
1. [Descripción General](#1-descripción-general)
2. [Video Demostrativo](#2-video-demostrativo)
3. [Arquitectura de IA: ¿Local o en la Nube?](#3-arquitectura-de-ia-local-o-en-la-nube)
4. [Prerrequisitos](#4-prerrequisitos)
5. [Configuración del Proyecto Firebase](#5-configuración-del-proyecto-firebase)
6. [Configuración de Azure DevOps](#6-configuración-de-azure-devops)
7. [Configuración de la Aplicación](#7-configuración-de-la-aplicación)
    - [Variables de Entorno (`.env`)](#variables-de-entorno-env)
    - [Configuración del Proveedor de IA](#configuración-del-proveedor-de-ia)
8. [Instalación](#8-instalación)
9. [Compilar y Ejecutar para Producción](#9-compilar-y-ejecutar-para-producción)
    - [Compilar la Aplicación](#compilar-la-aplicación)
    - [Ejecutar la Aplicación](#ejecutar-la-aplicación)
    - [Usar un Gestor de Procesos (Recomendado)](#usar-un-gestor-de-procesos-recomendado)
10. [Desarrollo](#10-desarrollo)
11. [Pila Tecnológica](#11-pila-tecnológica)
12. [Licencia](#12-licencia)

---

## 1. Descripción General

El Generador de Casos de Prueba es una aplicación web construida con Next.js que utiliza IA para generar casos de prueba detallados a partir de historias de usuario. Se integra con Firebase para la autenticación de usuarios y el almacenamiento de datos, y con Azure DevOps para obtener elementos de trabajo y enviar los casos de prueba generados.

## 2. Video Demostrativo

Puedes ver una explicación completa y una demostración de la aplicación en el siguiente video:

[**-> Ver video en YouTube aquí <-**](https://www.youtube.com/)
*(Reemplaza este enlace con la URL de tu video)*

## 3. Arquitectura de IA: ¿Local o en la Nube?

Es importante aclarar que la aplicación **no ejecuta el modelo de Inteligencia Artificial en tu servidor local**. El modelo de IA (Gemini de Google) es un servicio que se consume desde la nube. La arquitectura funciona de la siguiente manera:

- **Modelo de IA (Nube)**: Es el "cerebro". Se encuentra en los servidores de Google Cloud y es quien procesa las solicitudes para generar los casos de prueba.
- **Genkit (El Conector)**: Es el *toolkit* que se ejecuta en tu servidor. Actúa como un intermediario seguro que comunica tu aplicación con el modelo de IA seleccionado.
- **Autenticación (La "Llave")**: Para que tu servidor pueda usar el servicio de IA, necesita autenticarse con Google Cloud. Esto se hace a través de credenciales que se configuran en el archivo `.env`.

Por lo tanto, el comando `npm run genkit:watch` inicia este conector local, no el modelo de IA en sí.

## 4. Prerrequisitos

Antes de comenzar, asegúrate de que tu servidor tenga el siguiente software instalado:
- **Node.js**: Versión 20.x o posterior.
- **npm**: (Generalmente viene con Node.js).
- **Git**: Para clonar el repositorio.
- **Cuenta de Firebase**: Necesitarás un proyecto de Firebase para manejar la autenticación de usuarios y almacenar configuraciones específicas del usuario.
- **Cuenta de Azure DevOps**: Necesitas una cuenta con acceso a una organización y un proyecto donde se gestionan los elementos de trabajo.
- **Cuenta de Google Cloud**: Necesitarás una cuenta para obtener las credenciales de la API de IA.

## 5. Configuración del Proyecto Firebase

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

## 6. Configuración de Azure DevOps

Para conectarse a Azure DevOps, la aplicación necesita un Token de Acceso Personal (PAT).

1.  **Crear un Token de Acceso Personal (PAT)**:
    - En Azure DevOps, ve a tus **User settings** (Configuración de usuario) -> **Personal Access Tokens**.
    - Crea un nuevo token con los siguientes ámbitos (como mínimo):
        - **Work Items** (Elementos de trabajo): `Read & write` (Lectura y escritura)
        - **Test Management** (Gestión de pruebas): `Read & write` (Lectura y escritura)
    - **Importante**: Copia el PAT generado inmediatamente. No podrás verlo de nuevo.
2.  **Encontrar los Nombres de tu Organización y Proyecto**: Estos suelen ser parte de la URL cuando navegas por tu proyecto (ej., `https://dev.azure.com/{organization}/{project}`).

## 7. Configuración de la Aplicación

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
# CONFIGURACIÓN DE LA APLICACIÓN
# ----------------------------------
# Habilita o deshabilita el registro de nuevos usuarios.
# Ponlo en "true" para permitir que nuevos usuarios se registren (valor por defecto).
# Ponlo en "false" para ocultar el botón de registro y solo permitir el inicio de sesión.
NEXT_PUBLIC_ENABLE_REGISTRATION=true

# ----------------------------------
# CONFIGURACIÓN DE AZURE DEVOPS (Opcional - Predeterminado Global)
# ----------------------------------
# Si completas estos campos, serán la configuración predeterminada para todos los nuevos usuarios.
# Los usuarios pueden sobrescribir esto con su propia configuración personal en la página de configuración de la aplicación.
NEXT_PUBLIC_AZURE_DEVOPS_PAT=
NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION=
NEXT_PUBLIC_AZURE_DEVOPS_PROJECT=

# ----------------------------------
# CONFIGURACIÓN DEL PROVEEDOR DE IA (Requerido)
# ----------------------------------
# La aplicación utiliza Google AI (Gemini).
# Obtén una clave desde Google AI Studio: https://aistudio.google.com/app/apikey
# Si dejas esta clave en blanco, la aplicación intentará usar
# las Credenciales Predeterminadas de la Aplicación (ADC),
# ideal para entornos gestionados como Firebase App Hosting.
GOOGLE_API_KEY=

```

### Configuración del Proveedor de IA

La aplicación utiliza **Google Gemini** para generar los casos de prueba.

1.  **Habilitar la API de Vertex AI**: En tu proyecto de Google Cloud, habilita la "Vertex AI API".
2.  **Obtener una Clave de API**:
    - Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
    - Haz clic en "Create API key in new project".
    - Copia la clave generada.
    - En tu archivo `.env`, pega tu clave en `GOOGLE_API_KEY`.

## 8. Instalación

Sigue estos pasos en tu servidor para instalar las dependencias de la aplicación.

```bash
# 1. Clona el repositorio
git clone <url-de-tu-repositorio>
cd <carpeta-del-repositorio>

# 2. Instala las dependencias
npm install
```

## 9. Compilar y Ejecutar para Producción

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

## 10. Desarrollo

Para ejecutar la aplicación en modo de desarrollo, la aplicación se divide en dos procesos de servidor independientes que necesitan ejecutarse al mismo tiempo:

1.  **Terminal 1: Ejecuta la aplicación Next.js (Interfaz de Usuario)**:
    - **Comando:** `npm run dev`
    - **Función:** Este servidor se encarga de todo lo visual: las páginas, los botones, los formularios, etc.

2.  **Terminal 2: Ejecuta el servidor de IA de Genkit (Conector de IA)**:
    - **Comando:** `npm run genkit:watch`
    - **Función:** Este servidor se dedica exclusivamente a comunicarse con la IA. Cuando tu aplicación necesita generar casos de prueba, le envía una solicitud a este servidor.

Necesitarás dos terminales porque cada comando inicia un proceso que "ocupa" esa terminal para ejecutarse y mostrar sus registros.

## 11. Pila Tecnológica

- **Framework**: Next.js
- **UI (Interfaz de Usuario)**: React, ShadCN UI, Tailwind CSS
- **Autenticación**: Firebase Authentication
- **Base de Datos**: Firestore (para configuraciones específicas de usuario)
- **IA**: Genkit (usando modelos Gemini de Google)
- **Gestión de Estado**: React Context & Custom Hooks
- **Estilos**: Tailwind CSS
- **Manejo de Formularios**: React Hook Form, Zod

## 12. Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
