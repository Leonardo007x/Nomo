# Nomo  


# ¿Qué problema resuelve el sistema?

Nomo soluciona el problema de las pequeñas y medianas empresas con ausencia de presencia digital. Muchas venden productos o servicios, pero carecen de las habilidades técnicas para crear un sitio web profesional.

La plataforma permite a cualquier empresa crear y personalizar su propio sitio web utilizando plantillas prediseñadas, sin necesidad de conocimientos de programación.

---

#¿Quién lo usará?

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
   - Registro
   - Inicio de sesión
   - Gestión de perfiles  

2. **Servicio de autenticación**
   - Validación de credenciales
   - Control de acceso  

3. **Servicio de páginas web**
   - Creación de sitios
   - Edición de plantillas
   - Publicación  

4. **Servicio de productos**
   - Crear, editar y eliminar productos
   - Asociar productos a una página  

5. **Servicio de imágenes**
   - Subida de imágenes a Cloudinary
   - Gestión de recursos multimedia  

6. **Servicio de inteligencia artificial**
   - Generación de descripciones
   - Apoyo en creación de contenido  

---

## ¿Qué partes pueden trabajar por separado?

- El servicio de imágenes puede funcionar de manera independiente.
- La inteligencia artificial puede operar como un servicio externo.
- La base de datos funciona como un servicio centralizado.
- El frontend y backend están separados del almacenamiento multimedia.

---

# PARTE 3 – ¿CÓMO SE COMUNICAN?  

## Comunicación entre servicios

Ejemplos dentro del sistema:

- Usuarios → solicita → Autenticación  
- Páginas Web → solicita → Base de Datos  
- Productos → consulta → Base de Datos  
- Servicio de IA → responde → Páginas Web  
- Imágenes → almacena → Cloudinary  

---

## Flujo general

1. El usuario inicia sesión.
2. El sistema valida credenciales.
3. El usuario crea una página.
4. Se guardan datos en la base de datos.
5. Si sube imágenes, se envían a Cloudinary.
6. Si solicita contenido, se consulta el servicio de IA.
7. Se publica la página en Vercel.

Cada servicio cumple una función específica y se comunica mediante solicitudes y respuestas.

---

# PARTE 4 – ELEGIR LA ARQUITECTURA  

☐ Cliente–Servidor  
☐ Arquitectura en capas  
☑ Microservicios  
☐ Basados en eventos  
☐ Híbrida  

---

## Justificación

Elegimos arquitectura de microservicios porque el sistema tiene varias funciones independientes que pueden escalar por separado, como:

- Autenticación  
- Gestión de productos  
- Inteligencia artificial  
- Almacenamiento de imágenes  

Además, al estar desplegado en Vercel y conectado con servicios externos como Supabase, Groq y Cloudinary, el sistema ya funciona como un conjunto de servicios distribuidos.

Este tipo de arquitectura permite:

- Escalabilidad  
- Mejor mantenimiento  
- Separación de responsabilidades  
- Mayor flexibilidad  

---

## Consideraciones de usuarios y escalabilidad

El sistema puede crecer a muchos usuarios, ya que cualquier negocio podría registrarse. Por eso necesita ser escalable y tolerante a fallos.

No es un sistema pequeño, ya que integra múltiples servicios externos y manejo de datos en la nube.

---

# PARTE 5 – BASE DE DATOS  

## ¿Qué información debe guardarse?

La base de datos debe almacenar:

- Información de usuarios  
- Credenciales de acceso  
- Datos de los negocios  
- Configuración de páginas web  
- Productos  
- URLs de imágenes  
- Fechas de creación y actualización  

---

## ¿Qué datos son más importantes?

Los datos más importantes son:

- Identidad del usuario  
- Información del negocio  
- Productos publicados  
- Configuración de la página  

Si estos datos se pierden, el negocio perdería su presencia digital dentro de la plataforma.

---

# Conclusión

Nomo es un sistema distribuido que integra múltiples servicios en la nube para permitir que negocios creen y gestionen su presencia digital de manera sencilla.

La arquitectura basada en microservicios facilita la escalabilidad, el mantenimiento y la integración con servicios externos, haciendo que el sistema sea flexible y preparado para crecer.

