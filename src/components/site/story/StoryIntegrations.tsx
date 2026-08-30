import { motion } from "framer-motion";

const channels = ["WhatsApp", "Instagram", "Messenger", "Telegram", "Email", "Webchat", "Stripe", "OpenAI"];

export function StoryIntegrations() {
  return (
    <section id="integrations" className="mx-auto max-w-[1280px] px-6 py-28 sm:py-32">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
        <div>
          <div className="s-eyebrow">Canales</div>
          <h2 className="s-display mt-6 text-[32px] sm:text-[44px] lg:text-[52px]">
            Conecta todos
            <br />
            tus canales.
          </h2>
        </div>
        <p className="s-body max-w-lg lg:pt-6">
          Un solo inbox para conversaciones, leads y ventas. Conecta tus cuentas en minutos
          y deja que la IA responda en cualquier canal.
        </p>
      </div>

      <div className="s-hr mt-16 grid grid-cols-2 md:grid-cols-4">
        {channels.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="s-hr flex items-center border-b py-9"
            style={{ borderRight: i % 2 === 0 ? "1px solid var(--story-ash)" : undefined }}
          >
            <span className="s-display text-[20px] text-[var(--story-mist)] transition-colors hover:text-white sm:text-[22px]">
              {c}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
