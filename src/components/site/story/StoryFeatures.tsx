import { motion } from "framer-motion";
import { Kanban, Bot, MessageSquare, Workflow, BarChart3, Users } from "lucide-react";

const features = [
  { icon: Kanban, title: "CRM Visual", desc: "Pipeline drag & drop, leads, negocios, etiquetas e historial completo." },
  { icon: Bot, title: "IA Integrada", desc: "Asistente, respuestas automáticas, resúmenes y clasificación inteligente." },
  { icon: MessageSquare, title: "Inbox Omnicanal", desc: "WhatsApp, Instagram, Messenger, Telegram, Email y Webchat unificados." },
  { icon: Workflow, title: "Automatizaciones", desc: "Constructor visual de flujos, disparadores, secuencias y campañas." },
  { icon: BarChart3, title: "Dashboard Enterprise", desc: "Métricas de conversión, ROI, equipos y rendimiento en tiempo real." },
  { icon: Users, title: "Equipos y Roles", desc: "Multiusuario, permisos granulares, supervisores y colaboración fluida." },
];

export function StoryFeatures() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] px-6 py-28 sm:py-32">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
        <h2 className="s-display text-[36px] sm:text-[48px] lg:text-[56px]">
          Todo lo que necesitas
          <br />
          para vender más.
        </h2>
        <div>
          <div className="s-eyebrow">Plataforma</div>
          <p className="s-body mt-5 max-w-md">
            Una arquitectura modular pensada para emprendedores, PyMEs, agencias y empresas
            que escalan. Sin paneles innecesarios: solo la información que mueve tu negocio.
          </p>
        </div>
      </div>

      <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="s-card group"
          >
            <f.icon
              className="h-6 w-6 text-[var(--story-mist)] transition-colors duration-500 group-hover:text-white"
              strokeWidth={1.25}
            />
            <h3 className="s-display mt-6 text-[22px]">{f.title}</h3>
            <p className="s-body mt-3 text-[15px]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
