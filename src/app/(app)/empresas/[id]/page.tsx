/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: "Empresa - Sec Jessica" };
}

export function generateStaticParams() {
  return [{ id: "principal" }];
}

export default function EmpresaDetalhePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Empresa</h1>
          <p className="text-muted-foreground">Configurações e dados da organização.</p>
        </div>
        <Link href="/empresas" className="text-sm text-secjessica-600 hover:underline">← Voltar</Link>
      </div>
      <div className="mt-6 rounded-xl border border-input bg-background shadow-sm p-6">
        <p className="text-muted-foreground">Detalhes da empresa {params.id}. Configure em Configurações.</p>
      </div>
    </div>
  );
}
