# Nomo
Proyecto - NOMO

NOMO es una plataforma creada para que pequeños y medianos negocios puedan construir su propia página web usando plantillas editables. La idea principal es ofrecer una solución práctica a personas que quieren tener presencia digital pero no saben programar ni pueden pagar un desarrollo a medida.

Equipo de trabajo -
Brayan Esmid Cruz cumple el rol de líder del proyecto.
Julián Leonardo Cerón se encarga de la parte de presentación.
Elkin Yesid Yandun asume la responsabilidad técnica.
Jeison Javier Guerra desarrolla la documentación.

La aplicación está desplegada en Vercel y utiliza Supabase como sistema de base de datos. Para la generación de contenido automático se integra Groq y el manejo de imágenes se realiza mediante Cloudinary.

PARTE 1 - ENTENDER EL PROBLEMA

El sistema busca resolver la dificultad que tienen muchos emprendedores para crear una página web profesional. Con NOMO pueden organizar su información, mostrar productos y personalizar su sitio sin conocimientos técnicos.

Los principales usuarios son emprendedores, pequeñas empresas y personas que venden productos por redes sociales y necesitan una página web sencilla.

Si la plataforma no existiera, estos negocios tendrían que limitarse a redes sociales o asumir mayores costos para contratar a un desarrollador, lo que frenaría su crecimiento digital.

PARTE 2 - IDENTIFICAR LOS SERVICIOS

El sistema se compone de varios módulos que cumplen funciones específicas. Existe un componente encargado del registro y autenticación de usuarios, otro que administra los negocios y sus páginas, uno dedicado a los productos, un servicio que genera descripciones automáticamente con inteligencia artificial, otro que gestiona las imágenes y finalmente el servicio que almacena toda la información.

Algunas tareas funcionan de forma independiente, como la carga de imágenes o la generación de texto con IA. También el guardado y consulta de datos opera de manera separada del renderizado de las plantillas.

PARTE 3 - COMUNICACIÓN ENTRE COMPONENTES

La interacción comienza cuando el usuario realiza una acción en la interfaz. El frontend envía la solicitud al backend. El backend procesa la petición y, si es necesario, consulta la base de datos o se comunica con servicios externos. Una vez obtiene la respuesta, la devuelve al frontend para que el usuario vea el resultado.

Por ejemplo, cuando se crea un producto, el backend registra la información en la base de datos. Si el usuario solicita una descripción automática, el backend envía la petición al servicio de IA y luego entrega el texto generado.

PARTE 4 - ARQUITECTURA

Se adopta una arquitectura basada en microservicios. Esto se debe a que el sistema está compuesto por varios servicios que pueden operar de manera relativamente independiente, como la base de datos, el almacenamiento de imágenes y la inteligencia artificial.

La plataforma está pensada para crecer en número de usuarios, por lo que necesita una estructura que permita escalar y mantener cada parte sin afectar a las demás. Aunque actualmente es un proyecto en desarrollo, se diseñó considerando una posible expansión futura.

PARTE 5 - BASE DE DATOS

El sistema almacena información relacionada con usuarios, negocios, productos y configuraciones de cada página. También guarda datos necesarios para la autenticación y personalización.

Los datos más sensibles son las credenciales de acceso y la información comercial de los negocios. Si estos datos se pierden, las páginas dejarían de funcionar correctamente y se afectaría la confianza de los usuarios.

Actualmente se utiliza una base de datos centralizada en Supabase que es compartida por los distintos módulos del sistema.

PARTE 6 - TIPOS DE USUARIO

Dentro del sistema existen tres perfiles principales. El administrador supervisa y controla la plataforma. El cliente, que es el dueño del negocio, crea y modifica su página. El visitante únicamente visualiza la información pública. Cada perfil tiene permisos distintos según su función.

PARTE 7 - FALLAS Y RIESGOS

Si el servicio de inteligencia artificial deja de funcionar, simplemente no se podrán generar descripciones automáticas, aunque el usuario podrá escribirlas manualmente.

Si la base de datos falla, no sería posible guardar ni consultar información, lo que impactaría directamente el funcionamiento general.

Si el servidor principal presenta una caída, la aplicación no estaría disponible temporalmente.

Para reducir riesgos se consideran medidas como reintentos automáticos, mensajes de error controlados, copias de seguridad y monitoreo constante del sistema.

PARTE 8 - DOCUMENTACIÓN

El README del repositorio incluye la explicación del problema, los servicios definidos, la arquitectura adoptada, la forma en que se comunican los componentes, los tipos de usuario y los riesgos identificados.

PARTE 9 - CONTROL DE VERSIONES

Los cambios se organizan por secciones relacionadas con la documentación de servicios, arquitectura, comunicación y usuarios.

El Pull Request titulado Arquitectura inicial del sistema resume las decisiones tomadas en esta primera etapa y deja registro de la estructura definida.

PARTE 10 - REVISIÓN

Cada integrante revisa la propuesta completa, aporta observaciones, identifica posibles debilidades y valida que la arquitectura tenga coherencia y capacidad de crecimiento.
