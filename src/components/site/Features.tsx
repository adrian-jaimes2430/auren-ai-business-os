import { motion } from "framer-motion";
import {
  Kanban, Bot, MessageSquare, Workflow, BarChart3, Users,
} from "lucide-react";

const features = [
  { icon: Kanban, title: "CRM Visual", desc: "Pipeline drag & drop, leads, negocios, etiquetas e historial completo." },
  { icon: Bot, title: "IA Integrada", desc: "Asistente, respuestas automáticas, resúmenes y clasificación inteligente." },
  { icon: MessageSquare, title: "Inbox Omnicanal", desc: "WhatsApp, Instagram, Messenger, Telegram, Email y Webchat unificados." },
  { icon: Workflow, title: "Automatizaciones", desc: "Constructor visual de flujos, disparadores, secuencias y campañas." },
  { icon: BarChart3, title: "Dashboard Enterprise", desc: "Métricas de conversión, ROI, equipos, ventas y rendimiento en tiempo real." },
  { icon: Users, title: "Equipos y Roles", desc: "Multiusuario, permisos granulares, supervisores y colaboración fluida." },
];

export function Features() {
  return (
    <section id="features" className="py-32 mx-auto max-w-6xl px-6">
      <div className="max-w-2xl">
        <div className="text-xs text-primary uppercase tracking-widest">Plataforma</div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">Todo lo que necesitas para vender más, en un solo lugar.</h2>
        <p className="mt-4 text-muted-foreground">Una arquitectura modular pensada para emprendedores, PyMEs, agencias y empresas que escalan.</p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group relative rounded-2xl glass p-6 hover:border-primary/40 transition-colors"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-[0.04] transition-opacity" />
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary glow-primary">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
