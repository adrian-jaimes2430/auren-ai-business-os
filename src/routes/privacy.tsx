import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Política de Privacidad — AUREN AI" },
      { name: "description", content: "Cómo Company A&O Ecosystem recopila, usa y protege los datos personales en la plataforma AUREN AI." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        <h1 className="text-4xl font-bold tracking-tight">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: 11 de mayo de 2026</p>

        <div className="prose prose-invert mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Responsable del tratamiento</h2>
            <p>El responsable del tratamiento de los datos personales recopilados a través de la plataforma AUREN AI es <strong>Company A&amp;O Ecosystem</strong> ("A&amp;O", "nosotros"), con sitio web en <a href="https://www.ayoecosystem.com" className="text-primary underline">www.ayoecosystem.com</a> y correo de contacto <a href="mailto:contacto@ayoecosystem.com" className="text-primary underline">contacto@ayoecosystem.com</a>.</p>
            <p>Actuamos como Responsable (Data Controller) respecto a los datos personales que tratamos para prestar el servicio AUREN AI.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Datos que recopilamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Datos de cuenta:</strong> nombre, correo electrónico, contraseña cifrada, organización, rol.</li>
              <li><strong>Datos de uso del producto:</strong> contactos cargados, conversaciones, mensajes, oportunidades comerciales, automatizaciones, prompts y respuestas de IA, archivos de la base de conocimiento.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, identificadores de dispositivo, navegador, sistema operativo, logs de acceso, telemetría de errores.</li>
              <li><strong>Datos de soporte:</strong> mensajes y adjuntos enviados a soporte@ayoecosystem.com.</li>
              <li><strong>Datos de facturación:</strong> el procesamiento de pagos lo realiza Paddle (ver §5). A&amp;O recibe únicamente metadatos de la suscripción (plan, estado, fecha de renovación) y no almacena datos de tarjetas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Finalidades y bases jurídicas</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prestar el servicio y gestionar la cuenta — <em>ejecución de contrato</em>.</li>
              <li>Facturación, gestión de suscripciones y cumplimiento fiscal — <em>obligación legal y ejecución de contrato</em> (a través de Paddle como Merchant of Record).</li>
              <li>Seguridad, prevención de fraude y abuso — <em>interés legítimo</em>.</li>
              <li>Mejora del producto y analítica agregada — <em>interés legítimo</em>.</li>
              <li>Comunicaciones transaccionales y soporte — <em>ejecución de contrato</em>.</li>
              <li>Comunicaciones comerciales sobre nuevas funcionalidades — <em>consentimiento</em>, revocable en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Tratamiento por IA</h2>
            <p>La plataforma utiliza modelos de IA para asistirte en tareas comerciales (sugerir respuestas, resumir conversaciones, generar contenido). Los prompts y el contexto necesario se envían a proveedores de modelos (Google, OpenAI) a través de pasarelas seguras. No utilizamos tus contenidos para entrenar modelos de terceros. Eres responsable de los prompts que envías y de validar las salidas antes de usarlas, especialmente en contextos regulados.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Destinatarios y subencargados</h2>
            <p>Compartimos datos únicamente con proveedores que nos prestan servicios necesarios:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Paddle.com Market Ltd.</strong> — Merchant of Record, gestión de pagos, suscripciones, impuestos y facturación.</li>
              <li><strong>Proveedores de infraestructura cloud</strong> — alojamiento, base de datos, almacenamiento de archivos.</li>
              <li><strong>Proveedores de IA</strong> — Google, OpenAI, para inferencia de modelos.</li>
              <li><strong>Proveedores de mensajería</strong> — WhatsApp Business API y otros canales que actives.</li>
              <li><strong>Asesores profesionales</strong> — legales, contables, cuando sea necesario.</li>
              <li><strong>Autoridades</strong> — cuando exista obligación legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Transferencias internacionales</h2>
            <p>Algunos proveedores pueden tratar datos fuera del país del usuario. En esos casos aplicamos garantías adecuadas (Cláusulas Contractuales Tipo de la Comisión Europea, decisiones de adecuación o equivalentes locales).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Conservación</h2>
            <p>Conservamos los datos mientras la cuenta permanezca activa y durante los plazos legales aplicables (facturación, fiscal). Cuando elimines tu cuenta, eliminamos o anonimizamos tus datos en un plazo máximo de 90 días, salvo obligación legal de conservación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Tus derechos</h2>
            <p>Puedes ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad, así como retirar el consentimiento, escribiendo a <a href="mailto:contacto@ayoecosystem.com" className="text-primary underline">contacto@ayoecosystem.com</a>. Responderemos en el plazo máximo de un mes. Si consideras que no atendemos correctamente tu solicitud, puedes presentar una reclamación ante la autoridad de control competente.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Seguridad</h2>
            <p>Aplicamos medidas técnicas y organizativas apropiadas: cifrado en tránsito (TLS) y en reposo, control de accesos por roles, políticas RLS a nivel de base de datos, auditoría de eventos, copias de seguridad y segregación de entornos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Cookies</h2>
            <p>Utilizamos cookies estrictamente necesarias para la sesión y la seguridad. No utilizamos cookies publicitarias de terceros. Puedes configurar tu navegador para rechazar cookies, aunque ello puede afectar al funcionamiento del servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Cambios</h2>
            <p>Podemos actualizar esta política para reflejar cambios legales o del servicio. Notificaremos los cambios materiales por correo electrónico o desde la propia plataforma con antelación razonable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Contacto</h2>
            <p>Para cualquier cuestión sobre privacidad: <a href="mailto:contacto@ayoecosystem.com" className="text-primary underline">contacto@ayoecosystem.com</a>.</p>
            <p className="mt-4"><Link to="/terms" className="text-primary underline">Términos y Condiciones</Link> · <Link to="/refund" className="text-primary underline">Política de Reembolso</Link></p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
