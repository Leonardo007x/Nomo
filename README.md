# Arquitectura del Sistema – NOMO

## Información General del Proyecto

**Nombre del proyecto:** NOMO  

**Problema que resuelve:**  
NOMO es una plataforma que permite a pequeños y medianos negocios crear su propia página web utilizando plantillas personalizables. El problema que resuelve es la falta de presencia digital profesional para emprendedores que no tienen conocimientos técnicos ni recursos para contratar un desarrollador web.

**Roles del equipo:**  
- Brayan Esmid Cruz – Líder del proyecto  
- Julián Leonardo Cerón – Encargado de presentación  
- Elkin Yesid Yandun – Encargado técnico  
- Jeison Javier Guerra – Encargado de documentación  

**Repositorio:**  
[El proyecto se encuentra alojado en GitHub y el equipo tiene acceso compartido.](https://github.com/Leonardo007x/Nomo)

---

# PARTE 1 — ENTENDER EL PROBLEMA

## 1. ¿Qué problema resuelve el sistema?

El sistema permite que emprendedores y dueños de negocios puedan crear y personalizar su propia página web para mostrar sus productos o servicios. Facilita la creación de sitios web sin necesidad de conocimientos en programación.

## 2. ¿Quién lo usará?

- Emprendedores  
- Pequeños y medianos negocios  
- Personas que venden productos en redes sociales  
- Usuarios que necesiten una página web sencilla y rápida  

## 3. ¿Qué pasaría si no existiera?

Si no existiera NOMO, los negocios tendrían que contratar desarrolladores, usar únicamente redes sociales como canal de ventas o no contar con presencia digital profesional, lo que limitaría su crecimiento.

---

# PARTE 2 — IDENTIFICAR LOS SERVICIOS

## ¿Qué funciones principales tiene el sistema?

- Registro e inicio de sesión de usuarios  
- Creación y edición de páginas web  
- Gestión de productos  
- Generación de texto con inteligencia artificial  
- Almacenamiento de imágenes  
- Gestión de datos en base de datos  

## ¿Qué partes pueden trabajar por separado?

- Servicio de autenticación  
- Servicio de gestión de negocios  
- Servicio de productos  
- Servicio de generación de contenido con IA  
- Servicio de almacenamiento de imágenes  
- Servicio de base de datos  

## ¿Qué procesos son independientes?

- Subida de imágenes  
- Generación automática de descripciones con IA  
- Guardado y consulta de datos  
- Renderizado de plantillas  

---

# PARTE 3 — ¿CÓMO SE COMUNICAN?

## ¿Qué servicio necesita información de otro?

El frontend necesita información del backend.  
El backend necesita información de la base de datos.  
El backend también se comunica con servicios externos como el de inteligencia artificial y almacenamiento de imágenes.

## ¿Quién solicita datos?

El frontend solicita datos al backend.  
El backend solicita datos a la base de datos y a los servicios externos.

## ¿Quién responde?

El backend responde al frontend.  
La base de datos y los servicios externos responden al backend.

Ejemplo de flujo:

- Usuario crea un producto → Backend guarda la información en la base de datos.  
- Usuario genera descripción → Backend solicita contenido a la IA → IA responde con el texto generado.

