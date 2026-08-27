export default function Footer() {
  return (
    <footer className="border-t hairline py-14">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 text-sm text-dim sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p className="max-w-xl leading-relaxed">
          Ferramenta de pesquisa e apoio à decisão em manometria esofágica de alta resolução. Não
          substitui a avaliação médica nem a leitura dos traçados originais.
        </p>
        <p className="kicker shrink-0">
          manometry-front · manometry-back · manometry-classification
        </p>
      </div>
    </footer>
  );
}
