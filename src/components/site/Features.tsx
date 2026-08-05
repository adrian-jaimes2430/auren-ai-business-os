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

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] px-6 py-32">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
        <h2 className="display-lg">
          Todo lo que necesitas
          <br />
          para vender más.
        </h2>
        <div>
          <div className="eyebrow text-spark">Plataforma</div>
          <p className="mt-5 text-lg font-extralight leading-relaxed text-silver">
            Una arquitectura modular pensada para emprendedores, PyMEs, agencias y empresas
            que escalan. Sin paneles innecesarios: solo la información que mueve tu negocio.
          </p>
        </div>
      </div>

      <div className="mt-24 grid gap-x-16 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="group"
          >
            <f.icon className="h-6 w-6 text-primary transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.25} />
            <h3 className="mt-6 text-[27px] font-normal leading-tight tracking-[-0.03em]">{f.title}</h3>
            <p className="mt-3 max-w-sm text-[17px] font-extralight leading-relaxed text-silver">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
