import { motion } from "framer-motion";

const channels = ["WhatsApp", "Instagram", "Messenger", "Telegram", "Email", "Webchat", "Stripe", "OpenAI"];

export function Integrations() {
  return (
    <section id="integrations" className="mx-auto max-w-[1280px] px-6 py-32">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
        <div>
          <div className="eyebrow text-spark">Canales</div>
          <h2 className="mt-6 display-lg">
            Conecta todos
            <br />
            tus canales.
          </h2>
        </div>
        <p className="max-w-lg text-lg font-extralight leading-relaxed text-silver lg:pt-6">
          Un solo inbox para conversaciones, leads y ventas. Conecta tus cuentas en minutos
          y deja que la IA responda en cualquier canal.
        </p>
      </div>

      <div className="mt-20 grid grid-cols-2 border-t border-border/40 md:grid-cols-4">
        {channels.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="border-b border-border/40 py-10 text-[24px] font-extralight tracking-[-0.02em] text-silver transition-colors hover:text-foreground"
          >
            {c}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
