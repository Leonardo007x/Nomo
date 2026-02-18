# Nomo  


# ¿Qué problema resuelve el sistema?

Nomo soluciona el problema de las pequeñas y medianas empresas con ausencia de presencia digital. Muchas venden productos o servicios, pero carecen de las habilidades técnicas para crear un sitio web profesional.

La plataforma permite a cualquier empresa crear y personalizar su propio sitio web utilizando plantillas prediseñadas, sin necesidad de conocimientos de programación.

---
# ROLES DEL EQUIPO

-Líder del proyecto: Brayan Esmid Cruz Chate
- Encargado de documentación: Jeison Guerra
- Encargado técnico: Elkin Yesid Yandun
- Encargado de presentación: Julián Leonardo Cerón

# ¿Quién lo usará?

El sistema será utilizado por:

- Emprendedores
- Pequeñas empresas
- Comercios locales
- Personas que venden bienes o servicios.

---

#¿Qué pasaría si no existiera?

Si Nomo no existiera:

- Muchas empresas no tendrian presencia en línea.
- Necesitarian contratar a un desarrollador para crear su sitio web.
- Perderian oportunidades de comercio electrónico.
- El crecimiento seria más lento que el de las empresas que han digitalizado sus operaciones.

---

# IDENTIFICAR LOS SERVICIOS  

## Funciones principales del sistema

- Registro e inicio de sesión de usuarios  
- Creación y edición de páginas web  
- Creación con plantillas
- Gestión de productos  
- Subida y almacenamiento de imágenes  
- Procesamiento de la información con inteligencia artificial

---

## Servicios identificados

Al dividir el sistema, identificamos los siguientes servicios:

1. **Servicio de usuarios**
   * Creación de cuentas
   * Acceso al sistema
   * Administración de perfiles

2. **Servicio de autenticación**
   * Verificación de credenciales
   * Gestión de permisos de acceso

3. **Servicio de páginas web**
   * Desarrollo de sitios web
   * Modificación de plantillas
   * Puesta en línea

4. **Servicio de productos**
   * Agregar, modificar y eliminar artículos
   * Vincular productos a un sitio web

5. **Servicio de imágenes**
   * Carga de imágenes en Cloudinary
   * Administración de archivos multimedia

6. **Servicio de inteligencia artificial**
   * Creación automática de descripciones
   * Soporte en la generación de contenido

---

## ¿Qué partes pueden trabajar por separado?

- El servicio de imágenes puede operar de forma autónoma.
- La inteligencia artificial puede implementarse como un servicio externo.
- La base de datos actúa como un servicio centralizado.
- El frontend y el backend se encuentran desacoplados del almacenamiento multimedia.

---

# ¿CÓMO SE COMUNICAN?  

## Comunicación entre servicios

Ejemplos dentro del sistema:

- Usuarios → requiere → Servicio de Autenticación
- Páginas Web → accede a → Base de Datos
- Productos → obtiene información de → Base de Datos
- Servicio de IA → provee respuesta a → Páginas Web
- Imágenes → guarda archivos en → Cloudinary


---

## Flujo general

1. El usuario accede al sistema.
2. El sistema verifica las credenciales ingresadas.
3. El usuario genera una nueva página.
4. La información se almacena en la base de datos.
5. Si se cargan imágenes, estas se envían a Cloudinary.
6. Si se requiere contenido, se realiza una consulta al servicio de IA.
7. La página se despliega en Vercel.

Cada servicio desempeña una tarea específica y se integra con los demás a través de solicitudes y respuestas.

---

# PARTE 4 – ELEGIR LA ARQUITECTURA  

☐ Cliente–Servidor  
☐ Arquitectura en capas  
☑ Microservicios  
☐ Basados en eventos  
☐ Híbrida  

---

## Justificación de nuestra elección

Elegimos una arquitectura de microservicios debido a que el sistema cuenta con múltiples funcionalidades independientes que pueden escalar de manera individual, tales como:

- Autenticación
- Administración de productos
- Inteligencia artificial
- Gestión de almacenamiento de imágenes

Además, al estar implementado en Vercel y vinculado con servicios externos como Supabase, Groq y Cloudinary, el sistema opera como un conjunto de servicios distribuidos.

Este enfoque arquitectónico permite:

- Escalabilidad independiente
- Mantenimiento más eficiente
- Separación clara de responsabilidades
- Mayor adaptabilidad y flexibilidad

---

# BASE DE DATOS  

## ¿Qué información debe guardarse?

La base de datos debe encargarse de almacenar:

- Datos de los usuarios
- Información de autenticación
- Detalles de los negocios
- Configuraciones de las páginas web
- Información de los productos
- Enlaces (URLs) de las imágenes
- Fechas de registro y última actualización

---

## ¿Qué datos son más importantes?

Los datos más importantes son:

- Datos de identificación del usuario
- Información correspondiente al negocio
- Productos que han sido publicados
- Ajustes y configuración de la página

Si esta información se pierde, el negocio quedaría sin su presencia digital dentro de la plataforma.


---

# FAllAS Y RIESGOS

## ¿Quién usará el sistema?

- Administrador
- Cliente (propietario del negocio)
- Visitante (persona que accede a la página pública del negocio)

No todos cuentan con los mismos permisos:
- El administrador tiene la capacidad de administrar la plataforma.
- El cliente puede modificar y gestionar la información de su negocio.
- El visitante únicamente puede visualizar la página pública.

---

# FALLAS Y RIESGOS

- Servicio de IA (Groq): no se generarían descripciones automáticas.
  Base de datos (Supabase): no sería posible almacenar ni consultar información.
- Servidor principal (Vercel): la aplicación dejaría de estar disponible.
- Cloudinary: no se podrían subir ni visualizar imágenes.
  
Posibles soluciones:
I- mplementar mecanismos de reintento automático.
- Mostrar mensajes de error controlados y comprensibles para el usuario.
- Realizar copias de seguridad periódicas de la base de datos.
- Establecer monitoreo constante del sistema.
