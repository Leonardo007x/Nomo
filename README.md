# Nomo

Plataforma para creación de presencia digital para negocios

Descripción del proyecto

NOMO es una plataforma web desarrollada en TypeScript que permite a emprendedores y pequeños negocios crear y personalizar su propia página web mediante plantillas prediseñadas.

El sistema está desplegado en Vercel
La base de datos está en Supabase
La inteligencia artificial se integra mediante Groq
La gestión de imágenes se realiza con Cloudinary

Problema que resuelve

Muchos pequeños negocios no cuentan con presencia digital

Falta de conocimientos técnicos para crear una página web

Costos elevados al contratar desarrolladores

Si el sistema no existiera, muchos negocios seguirían sin visibilidad en internet o dependerían de soluciones más costosas.

Usuarios del sistema

Administrador

Usuario dueño del negocio

Visitante

No todos los usuarios tienen los mismos permisos.
El administrador gestiona la plataforma.
El usuario crea y edita su página.
El visitante solo visualiza la información.

Servicios identificados

Servicio de usuarios

Servicio de autenticación

Servicio de gestión de páginas

Servicio de productos

Servicio de imágenes

Servicio de inteligencia artificial

Servicio de base de datos

Procesos independientes

La generación de texto con IA funciona de manera independiente

La gestión de imágenes es un servicio externo

La base de datos centraliza la información del sistema

Comunicación entre servicios

Páginas solicita información a Productos

Productos guarda datos en Base de datos

IA responde a Páginas

Imágenes devuelve URL al sistema

El frontend solicita datos al backend

Arquitectura seleccionada

Tipo Arquitectura híbrida

Se eligió esta arquitectura porque

Permite escalar si aumentan los usuarios

Separa responsabilidades

Facilita el mantenimiento

Integra servicios externos especializados

El sistema combina modelo cliente servidor con servicios externos independientes.

Base de datos

Información almacenada

Usuarios

Datos del negocio

Productos

Plantillas seleccionadas

Configuraciones personalizadas

URLs de imágenes

Datos críticos

Información de usuarios

Datos comerciales

Productos publicados

Si estos datos se pierden, los negocios perderían su información y su presencia digital.

La mayoría de servicios comparten la misma base de datos en Supabase mientras que imágenes e IA funcionan como servicios externos.

Fallas y riesgos

Posibles fallos

Falla del servicio de IA

Falla de la base de datos

Falla del servidor principal

Posibles soluciones

Reintentos automáticos

Mensajes de error claros

Copias de seguridad

Monitoreo del sistema

Organización de commits

doc definición de servicios

doc comunicación entre servicios

doc arquitectura seleccionada

doc usuarios del sistema

Pull request

Título Arquitectura inicial del sistema

Descripción definición de servicios comunicación arquitectura usuarios y riesgos

Revisión del equipo

Leer la arquitectura

Sugerir mejoras

Identificar posibles fallos

Confirmar que el diseño tiene coherencia
