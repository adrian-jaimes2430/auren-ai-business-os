const channels = ["WhatsApp", "Instagram", "Messenger", "Telegram", "Email", "Webchat", "Stripe", "OpenAI"];

export function Integrations() {
  return (
    <section id="integrations" className="py-24 mx-auto max-w-6xl px-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-xs text-primary uppercase tracking-widest">Integraciones</div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">Conecta todos tus canales</h2>
        <p className="mt-4 text-muted-foreground">Un solo inbox para conversaciones, leads y ventas.</p>
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {channels.map((c) => (
          <div key={c} className="rounded-full glass px-5 py-2.5 text-sm font-medium hover:border-primary/40 transition-colors">
            {c}
          </div>
        ))}
      </div>
    </section>
  );
}
