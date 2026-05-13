export type Lesson = {
  id: string;
  title: string;
  duration: string;
  steps: string[];
  tip?: string;
  cta?: { label: string; to: string };
};

export type AcademyModule = {
  id: string;
  title: string;
  summary: string;
  icon: "rocket" | "kanban" | "inbox" | "radio" | "workflow" | "bot" | "megaphone" | "users";
  lessons: Lesson[];
};

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: "first-steps",
    title: "Primeros pasos",
    summary: "Configura tu workspace y conoce el panel principal en menos de 10 minutos.",
    icon: "rocket",
    lessons: [
      {
        id: "tour",
        title: "Tour por el workspace",
        duration: "3 min",
        steps: [
          "Identifica el menú lateral: cada sección concentra una capacidad (CRM, Inbox, Canales, IA, etc.).",
          "En la parte inferior verás tu organización activa, tu rol y el plan vigente.",
          "Usa Ajustes para cambiar el nombre del workspace, logo y zona horaria.",
        ],
        tip: "Puedes pertenecer a varios workspaces; selecciona el activo desde Ajustes → Workspace.",
        cta: { label: "Ir al Dashboard", to: "/app" },
      },
      {
        id: "profile",
        title: "Completa tu perfil",
        duration: "2 min",
        steps: [
          "Abre Ajustes y carga tu nombre completo y avatar.",
          "Verifica que el correo coincida con el que usas para inicio de sesión.",
        ],
        cta: { label: "Abrir Ajustes", to: "/app/settings" },
      },
    ],
  },
  {
    id: "crm",
    title: "CRM y Pipeline",
    summary: "Gestiona contactos y oportunidades de venta con un Kanban visual.",
    icon: "kanban",
    lessons: [
      {
        id: "contacts",
        title: "Crear y organizar contactos",
        duration: "4 min",
        steps: [
          "Entra a Contactos y pulsa “Nuevo contacto”.",
          "Captura nombre, teléfono, email y agrega tags para segmentar.",
          "Asigna un dueño para que reciba notificaciones del contacto.",
        ],
        cta: { label: "Ir a Contactos", to: "/app/contacts" },
      },
      {
        id: "deals",
        title: "Mover deals en el pipeline",
        duration: "5 min",
        steps: [
          "Abre CRM y arrastra una tarjeta entre etapas para actualizar el estado.",
          "Edita el valor y la fecha estimada de cierre haciendo clic en la tarjeta.",
          "Marca la etapa final como “Ganado” o “Perdido” para reportes precisos.",
        ],
        tip: "Las etapas y colores se pueden personalizar desde Ajustes → Pipelines.",
        cta: { label: "Abrir CRM", to: "/app/crm" },
      },
    ],
  },
  {
    id: "inbox",
    title: "Inbox y conversaciones",
    summary: "Centraliza mensajes de WhatsApp, Instagram, Facebook y Email en un solo lugar.",
    icon: "inbox",
    lessons: [
      {
        id: "reply",
        title: "Responder y asignar conversaciones",
        duration: "3 min",
        steps: [
          "Selecciona una conversación de la lista.",
          "Escribe tu respuesta y pulsa Enviar; el mensaje se entrega por el canal original.",
          "Asigna la conversación a un agente desde el panel derecho.",
        ],
        cta: { label: "Abrir Inbox", to: "/app/inbox" },
      },
      {
        id: "ai-autoreply",
        title: "Activar respuestas con IA",
        duration: "2 min",
        steps: [
          "En el detalle de la conversación, activa el switch “IA autoreply”.",
          "La IA responderá usando tu base de conocimiento mientras estés ausente.",
        ],
      },
    ],
  },
  {
    id: "channels",
    title: "Conectar redes sociales y canales",
    summary: "Guía paso a paso para WhatsApp, Instagram, Facebook Messenger y Email.",
    icon: "radio",
    lessons: [
      {
        id: "whatsapp",
        title: "WhatsApp Cloud API",
        duration: "8 min",
        steps: [
          "Crea una app en business.facebook.com → Productos → WhatsApp.",
          "Copia el Phone Number ID y el token permanente.",
          "En Auren, abre Canales → Nuevo canal → WhatsApp y pega los datos.",
          "Copia el Webhook URL y el Verify Token que te muestra Auren y pégalos en Meta.",
          "Envía un mensaje de prueba al número conectado para validar.",
        ],
        tip: "Necesitas un número verificado de Meta Business antes de conectar.",
        cta: { label: "Ir a Canales", to: "/app/channels" },
      },
      {
        id: "instagram",
        title: "Instagram Direct",
        duration: "5 min",
        steps: [
          "Convierte tu cuenta de Instagram en Business y vincúlala a una página de Facebook.",
          "En Auren, Canales → Nuevo → Instagram y autoriza la conexión con Meta.",
          "Acepta los permisos de mensajes para que Auren pueda leer/responder DMs.",
        ],
        cta: { label: "Conectar Instagram", to: "/app/channels" },
      },
      {
        id: "facebook",
        title: "Facebook Messenger",
        duration: "5 min",
        steps: [
          "Selecciona la página de Facebook que administras.",
          "En Canales → Nuevo → Facebook autoriza la conexión y elige la página.",
          "Auren se suscribe automáticamente a los eventos de mensajes de la página.",
        ],
        cta: { label: "Conectar Facebook", to: "/app/channels" },
      },
      {
        id: "email",
        title: "Email transaccional",
        duration: "4 min",
        steps: [
          "Configura un dominio verificado en Ajustes → Email.",
          "Agrega los registros DNS (SPF, DKIM) que indica el panel.",
          "Crea un canal Email para enviar y recibir mensajes desde Auren.",
        ],
      },
    ],
  },
  {
    id: "automations",
    title: "Automatizaciones",
    summary: "Crea flujos que respondan, asignen y muevan deals sin intervención manual.",
    icon: "workflow",
    lessons: [
      {
        id: "new-flow",
        title: "Crear tu primera automatización",
        duration: "6 min",
        steps: [
          "Ve a Automatizaciones → Nueva.",
          "Elige un trigger: nuevo mensaje, nuevo contacto, deal movido, etc.",
          "Agrega pasos: enviar plantilla, asignar agente, mover etapa, esperar X minutos.",
          "Activa el switch para ponerlo en producción.",
        ],
        cta: { label: "Crear automatización", to: "/app/automations" },
      },
    ],
  },
  {
    id: "ai",
    title: "IA y base de conocimiento",
    summary: "Entrena al asistente con tus artículos para respuestas más precisas.",
    icon: "bot",
    lessons: [
      {
        id: "knowledge",
        title: "Cargar artículos de conocimiento",
        duration: "5 min",
        steps: [
          "Abre Knowledge → Nuevo artículo.",
          "Captura título, contenido y categoría; agrega tags relevantes.",
          "Activa el artículo para que el asistente IA lo use al responder.",
        ],
        cta: { label: "Abrir Knowledge", to: "/app/knowledge" },
      },
      {
        id: "ai-config",
        title: "Configurar el asistente",
        duration: "3 min",
        steps: [
          "Ve a IA y elige el modelo (rápido o premium).",
          "Define el tono y un prompt base alineado a tu marca.",
          "Prueba con un mensaje de ejemplo antes de activarlo en conversaciones reales.",
        ],
        cta: { label: "Abrir IA", to: "/app/ai" },
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing y campañas",
    summary: "Envía broadcasts segmentados por canal y mide su desempeño.",
    icon: "megaphone",
    lessons: [
      {
        id: "campaign",
        title: "Crear una campaña",
        duration: "5 min",
        steps: [
          "Abre Marketing → Nueva campaña.",
          "Selecciona canal (WhatsApp, Email) y plantilla aprobada.",
          "Filtra audiencia por tags o segmento y programa el envío.",
        ],
        cta: { label: "Crear campaña", to: "/app/marketing" },
      },
    ],
  },
  {
    id: "team",
    title: "Equipo y permisos",
    summary: "Invita agentes y asigna roles para colaborar de forma segura.",
    icon: "users",
    lessons: [
      {
        id: "invite",
        title: "Invitar miembros",
        duration: "2 min",
        steps: [
          "Ve a Equipo → Invitar.",
          "Captura el email y elige un rol (owner, admin, supervisor o agent).",
          "El invitado recibirá un enlace para unirse al workspace.",
        ],
        cta: { label: "Invitar al equipo", to: "/app/team" },
      },
    ],
  },
];
