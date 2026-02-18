# Nomo

## Parte 1
## ¿Que problema resuleve el sistema?

Muchos negocios pequeños no tienen una pagina web propia o dependen de herramientas genéricas donde no controlan bien su catálogo ni el menu para actualizarlo correctamente.  
Nomo les da una presencia digital rápida, editable y “presentable”, donde pueden mostrar sus productos con plantillas y textos generados o asistidos por IA.

## ¿Quien lo usara?
- **Admin de plataforma**  
  Gestiona usuarios, límites de uso, monitoreo y configuración global.

- **Dueño de negocio / creador de sitio**  
  Crea y administra su página, sube productos, configura secciones y usa IA para textos.

- **Cliente**  
  Entra a la página visible publica del negocio, navega el catalogo y usa los enlaces de contacto definidos por el dueño.

Cada rol tiene permisos distintos: el admin ve todo, el dueño solo su contenido y el visitante solo consume la página pública.

## ¿Que pasaria si no existiera?

Muchos terminarían o sin web, o pegados a un solo marketplace, o usando links improvisados tipo Canva/Wix sin control sobre los datos ni la experiencia.

## Parte 2

## Identificar los servicios

- **Servicio de usuarios y autenticación**
    Maneja registro/login, perfiles, planes y permisos de los dueños.

- **Servicio de proyectos/sitios**
    Aquí va cada sitio creado en Nomo: nombre del negocio, URL, tema visual, configuración de secciones, etc.

-  **Servicio de productos/catálogo**
    Lista de productos de cada negocio: nombre, precio, descripción, categoría, estado (activo/inactivo).

- **Servicio de medios (Cloudinary)**
    Todo lo de imágenes: subida, transformación y URL optimizadas para las páginas de los negocios.

- **Servicio de IA (Groq)**
    Generación de descripciones, textos para la página, ideas de contenido, quizá incluso propuesta de diseño o estructura básica.

- **Servicio de analíticas / métricas**
    Visitas a los sitios, clics en productos, CTR de botones, etc., para que el dueño vea cómo se mueve su página.​

- **Opcional futuro: servicio de pagos/pedidos**
    Si Nomo evoluciona de “solo presencia” a “mini e-commerce”, ahí entrarían pagos y pedidos.

## Parte 3

## ¿Como se comunican?

- Frontend (la app en Vercel) → solicita → Servicio de autenticación.

    Para login, registro, recuperación de sesión, etc.
- Frontend → solicita → Servicio de proyectos/sitios.
  
    Para crear, listar y configurar las páginas de los negocios.

- Proyectos/sitios → consulta → Servicio de productos.
  
    Cuando construyes la página pública, el sitio necesita saber qué productos mostrar, en qué orden, etc.

- Frontend / Proyectos → usa → Servicio de medios (Cloudinary).
  
    Subes fotos desde la app y guardas solo las URLs/metadata en Supabase.

- Frontend / Proyectos → llama → Servicio de IA (Groq).
  
    Envías contexto (tipo de negocio, productos) y recibes textos sugeridos para descripciones, encabezados, etc.

- Analíticas ← recibe eventos de → Sitios públicos.
  
    Cada visita o clic se manda como evento para luego mostrar estadísticas al dueño.​

## Parte 4

## Tipo de arquitectura

☑ Microservicios

Elegimos esta arquitectura porque se puede separar IA, medios y analíticas como servicios más independientes perfecto para escalar ya que contara con muchos usuarios simultaneos y con tiendas que se pueden visitar de manera cotidiana ademas que se tiene pensado para un sistema grande.

## Parte 5 

## Datos del sistema

Datos que se guardan
- Usuarios
- Sitios Web / Proyectos
- Productos
- Configuracion
- Analitica / Graficas

Datos criticos
- Usuarios
- Sitios Web / Proyectos
- Productos

¿Una base para todos o varias?
Como usamos supabase lo normal es usar una sola base de datos para todo y ya separalos con tablas para todo.

## Parte 6

## Usuarios del sistema

- Admin de la plataforma (Admin)
- Creador de sitios (Empresario)
- Cliente

¿Todos pueden hacer lo mismo?
No:
- Admin ve estadísticas globales, billing, moderación.
- Dueño solo ve y gestiona sus propios sitios y productos.
- Visitante solo consume, no toca el panel ni la configuración.

## Parte 7

## Fallas y Riesgos





