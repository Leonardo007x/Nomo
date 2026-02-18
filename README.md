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
[El proyecto se encuentra alojado en GitHub.](https://github.com/Leonardo007x/Nomo)

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

---

# PARTE 4 — ELEGIR LA ARQUITECTURA

Arquitectura seleccionada: Microservicios

## ¿Cuántos usuarios tendrá el sistema?

Se espera que pueda tener múltiples negocios registrados, por lo que debe estar preparado para crecer.

## ¿Necesita escalar?

Sí. La plataforma debe soportar el crecimiento de usuarios y negocios.

## ¿Es un sistema pequeño o grande?

Actualmente es un sistema en crecimiento, pero con potencial de convertirse en una plataforma grande.

## Justificación

Elegimos esta arquitectura porque el sistema trabaja con varios servicios independientes como base de datos, almacenamiento de imágenes e inteligencia artificial. Esta separación permite mayor escalabilidad, mantenimiento más sencillo y mejor organización del sistema.

---

# PARTE 5 — BASE DE DATOS

## ¿Qué información debe guardarse?

- Usuarios  
- Negocios  
- Productos  
- Configuración de plantillas  
- Información personalizada de cada página  

## ¿Qué datos son críticos?

- Datos de autenticación  
- Información de los negocios  
- Productos registrados  

## ¿Qué pasaría si se pierden?

Se perdería la información de los usuarios y sus páginas web dejarían de funcionar correctamente.

## ¿Todos los servicios usan la misma base de datos o cada uno tiene la suya?

Actualmente todos los servicios utilizan la misma base de datos centralizada.

---

# PARTE 6 — IDENTIFICAR USUARIOS

## ¿Quién usará el sistema?

- Administrador  
- Cliente (dueño del negocio)  
- Visitante (usuario final que ve la página pública)

## ¿Todos pueden hacer lo mismo?

No.  
El administrador gestiona la plataforma.  
El cliente puede crear y editar su negocio.  
El visitante solo puede visualizar la información pública.

---

# PARTE 7 — FALLAS Y RIESGOS

## ¿Qué pasaría si falla el servicio de IA?

No se podrían generar descripciones automáticas, pero el usuario podría escribirlas manualmente.

## ¿Qué pasaría si falla la base de datos?

No se podrían guardar ni consultar datos, afectando el funcionamiento general del sistema.

## ¿Qué pasaría si falla el servidor principal?

La aplicación no estaría disponible temporalmente.

## Posibles soluciones

- Implementar reintentos automáticos.  
- Mostrar mensajes de error controlados.  
- Realizar copias de seguridad periódicas.  
- Monitorear el estado del sistema.

---

# PARTE 8 — DOCUMENTACIÓN EN EL README

Este documento incluye:

- Descripción del proyecto  
- Problema que resuelve  
- Servicios identificados  
- Comunicación entre servicios  
- Arquitectura seleccionada  
- Usuarios del sistema  
- Riesgos y posibles soluciones  

---

# PARTE 9 — COMMIT Y PULL REQUEST

Commits realizados por sección:

- doc: definición de servicios  
- doc: comunicación entre servicios  
- doc: arquitectura seleccionada  
- doc: usuarios del sistema  

Pull Request:

**Título:**  
Arquitectura inicial del sistema  

**Descripción:**  
Se definieron los servicios principales, la comunicación entre ellos, la arquitectura seleccionada, los usuarios del sistema y los posibles riesgos.

---

# PARTE 10 — REVISIÓN DEL EQUIPO

Cada integrante debe:

- Leer la arquitectura completa.  
- Sugerir mejoras.  
- Identificar posibles fallos.  
- Confirmar que el diseño tenga coherencia y posibilidad de escalabilidad.

