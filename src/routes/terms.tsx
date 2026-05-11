import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — AUREN AI" },
      { name: "description", content: "Términos y condiciones de uso de la plataforma AUREN AI por Company A&O Ecosystem." },
    ],
  }),
});

function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        <h1 className="text-4xl font-bold tracking-tight">Términos y Condiciones</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: 11 de mayo de 2026</p>

        <div className="prose prose-invert mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Quiénes somos</h2>
            <p>AUREN AI es una plataforma operada por <strong>Company A&amp;O Ecosystem</strong> ("A&amp;O", "nosotros"), con sitio web en <a href="https://www.ayoecosystem.com" className="text-primary underline">www.ayoecosystem.com</a>. Al registrarte o utilizar el servicio, contratas con A&amp;O y aceptas estos Términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Aceptación</h2>
            <p>El uso continuado del servicio implica la aceptación íntegra de estos Términos. Si no estás de acuerdo, no debes utilizar la plataforma. Si contratas en nombre de una organización, declaras tener autoridad para vincularla. Si contratas como persona física, declaras tener la mayoría de edad legal en tu jurisdicción.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Descripción del servicio</h2>
            <p>AUREN AI es un sistema operativo comercial que combina CRM, omnicanalidad, automatizaciones y asistencia por IA. Las funcionalidades disponibles dependen del plan contratado (Starter, Pro, Business o Enterprise).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Cuenta y credenciales</h2>
            <p>Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades realizadas bajo tu cuenta. Debes proporcionar información veraz y mantenerla actualizada. Notifícanos de inmediato cualquier acceso no autorizado a <a href="mailto:soporte@ayoecosystem.com" className="text-primary underline">soporte@ayoecosystem.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Uso aceptable</h2>
            <p>Te comprometes a no utilizar el servicio para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Actividades ilegales, fraudulentas o engañosas.</li>
              <li>Envío de spam, mensajes no solicitados o vulneración de normativas anti-spam y de protección al consumidor.</li>
              <li>Infracción de derechos de propiedad intelectual o de privacidad de terceros.</li>
              <li>Distribución de malware, sondeo de seguridad, ingeniería inversa o scraping no autorizado.</li>
              <li>Generar contenido ilegal, deepfakes no consentidos, contenido de odio, acoso, explotación infantil o cualquier material prohibido por la ley.</li>
              <li>Eludir límites técnicos del plan contratado o revender el servicio sin autorización escrita.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Funcionalidades de Inteligencia Artificial</h2>
            <p>El servicio incluye capacidades de IA generativa. Reconoces y aceptas que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Eres responsable de los prompts que envías, del uso de las salidas y de verificar su exactitud.</li>
              <li>Las salidas pueden contener errores y no constituyen asesoramiento legal, médico, financiero ni profesional regulado. No deben utilizarse sin supervisión humana competente en contextos sensibles.</li>
              <li>Debes contar con los derechos necesarios sobre el contenido que envíes como entrada.</li>
              <li>A&amp;O se reserva el derecho de filtrar, restringir o rechazar prompts y salidas, así como suspender cuentas que abusen de la funcionalidad.</li>
              <li>Existe un canal para reportar infracciones de derechos de terceros: <a href="mailto:contacto@ayoecosystem.com" className="text-primary underline">contacto@ayoecosystem.com</a>. Las infracciones reiteradas conllevarán la baja de la cuenta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Propiedad intelectual</h2>
            <p>A&amp;O conserva la titularidad de la plataforma, su software, documentación, marcas y demás elementos. Te concedemos una licencia limitada, no exclusiva, intransferible y revocable para utilizar el servicio dentro de los límites del plan contratado. Conservas la titularidad de los contenidos que cargas; nos otorgas una licencia limitada para alojarlos y procesarlos con el único fin de prestarte el servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Pagos, suscripciones y facturación</h2>
            <p>El proceso de compra es realizado por nuestro revendedor en línea Paddle.com. <strong>Paddle es el Merchant of Record (MoR) de todos nuestros pedidos</strong>. Paddle gestiona los pagos, la facturación, el cumplimiento fiscal, la atención al cliente sobre transacciones y los reembolsos.</p>
            <p>Las condiciones de pago, periodo de facturación, renovación automática, cancelaciones, impuestos y reembolsos se rigen por los <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Buyer Terms de Paddle</a>. Las suscripciones se renuevan automáticamente al final de cada periodo salvo cancelación previa desde la propia plataforma o desde el portal de Paddle (paddle.net).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Reembolsos</h2>
            <p>Aplicamos una garantía de devolución de 30 días. Consulta los detalles en nuestra <Link to="/refund" className="text-primary underline">Política de Reembolso</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Suspensión y terminación</h2>
            <p>Podemos suspender o terminar el acceso al servicio en caso de: incumplimiento material de estos Términos, impago, riesgo de seguridad o fraude, o infracciones reiteradas o graves de las políticas. Cuando finalice tu contrato podrás exportar tus datos durante un plazo razonable; transcurrido ese plazo procederemos a su eliminación o anonimización.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Disponibilidad y garantías</h2>
            <p>Nos esforzamos por mantener el servicio disponible, pero no garantizamos su funcionamiento ininterrumpido o libre de errores. En la máxima medida permitida por la ley, excluimos toda garantía implícita de comerciabilidad, idoneidad para un fin particular o no infracción.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Limitación de responsabilidad</h2>
            <p>En la máxima medida permitida por la ley, la responsabilidad agregada de A&amp;O frente a ti por cualquier reclamación derivada del servicio se limita al importe efectivamente pagado por ti durante los 12 meses anteriores al hecho generador. A&amp;O no responderá de daños indirectos, consecuentes, especiales, lucro cesante, pérdida de datos o de fondo de comercio. No se excluyen las responsabilidades que la ley no permita excluir (dolo, daños personales).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Indemnidad</h2>
            <p>Te comprometes a mantener indemne a A&amp;O frente a reclamaciones de terceros derivadas de tu contenido, de un uso ilícito del servicio o del incumplimiento de estos Términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">14. Modificaciones</h2>
            <p>Podemos actualizar estos Términos. Comunicaremos los cambios materiales con antelación razonable. El uso continuado tras la entrada en vigor implica aceptación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">15. Cesión y fuerza mayor</h2>
            <p>No puedes ceder tu posición contractual sin nuestro consentimiento. A&amp;O podrá cederla en supuestos de reorganización societaria. Ninguna parte responde por incumplimientos derivados de causas de fuerza mayor.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">16. Ley aplicable y jurisdicción</h2>
            <p>Estos Términos se rigen por la legislación del país de domicilio de Company A&amp;O Ecosystem. Cualquier controversia se someterá a los tribunales competentes de dicho domicilio, sin perjuicio de los derechos imperativos del consumidor.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">17. Contacto</h2>
            <p>Cuestiones generales: <a href="mailto:contacto@ayoecosystem.com" className="text-primary underline">contacto@ayoecosystem.com</a><br/>Soporte técnico: <a href="mailto:soporte@ayoecosystem.com" className="text-primary underline">soporte@ayoecosystem.com</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
