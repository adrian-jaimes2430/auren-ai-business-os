import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/refund")({
  component: RefundPage,
  head: () => ({
    meta: [
      { title: "Política de Reembolso — AUREN AI" },
      { name: "description", content: "Política de reembolso de AUREN AI: garantía de devolución de 30 días gestionada por Paddle." },
    ],
  }),
});

function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        <h1 className="text-4xl font-bold tracking-tight">Política de Reembolso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: 11 de mayo de 2026</p>

        <div className="prose prose-invert mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>En <strong>Company A&amp;O Ecosystem</strong> queremos que estés plenamente satisfecho con AUREN AI. Por eso ofrecemos una <strong>garantía de devolución de 30 días</strong>.</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Qué cubre</h2>
            <p>Si dentro de los 30 días naturales posteriores a tu pago consideras que el servicio no cumple tus expectativas, puedes solicitar el reembolso íntegro de ese cargo.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Cómo solicitarlo</h2>
            <p>El procesamiento de pagos lo realiza nuestro Merchant of Record, <strong>Paddle</strong>. Para solicitar un reembolso:</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Visita <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> e introduce el correo asociado a tu compra para acceder al portal de cliente de Paddle.</li>
              <li>O bien escríbenos a <a href="mailto:soporte@ayoecosystem.com" className="text-primary underline">soporte@ayoecosystem.com</a> indicando el correo de la cuenta y el motivo, y tramitaremos la solicitud con Paddle en tu nombre.</li>
            </ol>
            <p>Una vez aprobado, el reembolso se reflejará en tu medio de pago original en un plazo aproximado de 5 a 10 días hábiles, según tu banco.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Renovaciones</h2>
            <p>Las suscripciones se renuevan automáticamente. Puedes cancelar la renovación en cualquier momento desde <em>Configuración → Plan</em> dentro de la app o desde el portal de Paddle. Las cancelaciones realizadas tras una renovación pueden ser elegibles para reembolso si nos contactas dentro del plazo de 30 días.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Excepciones</h2>
            <p>Esta política no afecta a los derechos imperativos que la legislación de consumo de tu país te reconozca, que prevalecerán cuando sean más favorables.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Contacto</h2>
            <p>Cualquier duda: <a href="mailto:soporte@ayoecosystem.com" className="text-primary underline">soporte@ayoecosystem.com</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
