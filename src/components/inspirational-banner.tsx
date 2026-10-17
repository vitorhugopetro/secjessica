"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Heart, BookOpen, Quote, Copy, Check } from "lucide-react";

export interface DevotionalMessage {
  id: number;
  verse: string;
  reference: string;
  message: string;
  theme: string;
}

export const DEVOTIONAL_MESSAGES: DevotionalMessage[] = [
  {
    id: 1,
    verse: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens... É a Cristo, o Senhor, que vocês estão servindo.",
    reference: "Colossenses 3:23-24",
    message: "Jéssica, que o seu dia seja repleto de paz e propósito. Cada mensagem respondida, cada compromisso organizado e cada pessoa atendida com carinho é uma forma de expressar o amor de Deus e fazer a diferença na vida de alguém. Tenha um dia abençoado e produtivo!",
    theme: "Propósito & Dedicação",
  },
  {
    id: 2,
    verse: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.",
    reference: "Provérbios 16:3",
    message: "Coloque nas mãos de Deus cada tarefa da sua lista hoje. Ele capacita as suas mãos, dá clareza à sua mente e abençoa o fruto do seu trabalho. Respire fundo, confie e brilhe com serenidade!",
    theme: "Confiança & Sucesso",
  },
  {
    id: 3,
    verse: "Ele fortalece o cansado e multiplica as forças ao que não tem nenhum vigor.",
    reference: "Isaías 40:29",
    message: "Mesmo nos dias mais intensos e cheios de tarefas, lembre-se: você nunca está sozinha. A graça de Deus renova suas energias a cada instante. Você é capaz, dedicada e admirável!",
    theme: "Renovo & Energia",
  },
  {
    id: 4,
    verse: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    message: "Não há demanda ou desafio que você não possa superar com sabedoria, graça e serenidade. Comece este dia com a certeza inabalável de que a força que move o seu trabalho vem do Alto.",
    theme: "Superação & Fé",
  },
  {
    id: 5,
    verse: "Não fui eu que lhe ordenei? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.",
    reference: "Josué 1:9",
    message: "Enfrente a sua jornada de hoje com coragem, sorriso no rosto e paz no coração. Deus caminha ao seu lado em cada atendimento, em cada decisão e em cada detalhe. Seu trabalho tem um valor precioso!",
    theme: "Coragem & Proteção",
  },
  {
    id: 6,
    verse: "Seja sobre nós a graça do Senhor, nosso Deus; confirma sobre nós as obras das nossas mãos; sim, confirma a obra das nossas mãos.",
    reference: "Salmos 90:17",
    message: "Que a beleza da graça divina repouse sobre você neste dia, tornando o seu trabalho leve, organizado e cheio de realizações extraordinárias para todos os clientes que você atende.",
    theme: "Graça & Excelência",
  },
  {
    id: 7,
    verse: "E não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desanimarmos.",
    reference: "Gálatas 6:9",
    message: "O seu cuidado, presteza e paciência nos atendimentos são sementes de bênçãos plantadas diariamente. Continue com esse coração generoso e acolhedor, pois a sua colheita será abundante!",
    theme: "Perseverança & Colheita",
  },
  {
    id: 8,
    verse: "Reveste-se de força e dignidade; sorri diante do futuro. Fala com sabedoria, e a instrução da bondade está na sua língua.",
    reference: "Provérbios 31:25-26",
    message: "Você é uma mulher forte, sábia e inspiradora. Que as suas palavras hoje transmitam calma, eficiência e acolhimento a todos que cruzarem o seu caminho. Tenha um dia maravilhoso!",
    theme: "Sabedoria & Graça Feminina",
  },
  {
    id: 9,
    verse: "Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai de vocês, que está nos céus.",
    reference: "Mateus 5:16",
    message: "Seja a luz no dia de cada cliente, paciente e colega de trabalho hoje. A sua gentileza e organização impecável refletem o cuidado amoroso de Deus em cada detalhe.",
    theme: "Luz & Testemunho",
  },
  {
    id: 10,
    verse: "Entregue o seu caminho ao Senhor; confie nele, e ele agirá.",
    reference: "Salmos 37:5",
    message: "Descanse o seu coração. Entregue os horários, os prazos e as conversas nas mãos de Quem tudo governa com amor. Tenha um dia de trabalho em perfeita paz e tranquilidade.",
    theme: "Paz & Descanso",
  },
  {
    id: 11,
    verse: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.",
    reference: "Jeremias 29:11",
    message: "O seu futuro e o seu sustento estão guardados nas mãos do Senhor. Trabalhe hoje com alegria e gratidão, sabendo que cada passo do seu caminho foi planejado com carinho e amor eterno.",
    theme: "Esperança & Prosperidade",
  },
  {
    id: 12,
    verse: "Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele.",
    reference: "Salmos 118:24",
    message: "Hoje é uma nova oportunidade, cheia de frescor e misericórdia! Comece o seu trabalho com um sorriso e a certeza de que Deus preparou momentos especiais e muitas bênçãos para este dia.",
    theme: "Alegria & Gratidão",
  },
  {
    id: 13,
    verse: "O Senhor é o meu pastor; de nada terei falta. Em verdes pastagens me faz repousar e me conduz a águas tranquilas.",
    reference: "Salmos 23:1-2",
    message: "Que a calmaria e a provisão divina conduzam suas horas de trabalho hoje. Mesmo em meio a muitas notificações e compromissos, há um refúgio de paz no seu interior.",
    theme: "Cuidado & Serenidade",
  },
  {
    id: 14,
    verse: "Nunca lhes falte o zelo, sejam fervorosos no espírito, sirvam ao Senhor. Tenham alegria na esperança, sejam pacientes na tribulação e perseverem na oração.",
    reference: "Romanos 12:11-12",
    message: "Que o seu entusiasmo, dedicação e zelo profissional inspirem todos ao seu redor. A sua presteza e o seu coração dedicado fazem toda a diferença neste dia!",
    theme: "Zelo & Fervor",
  },
  {
    id: 15,
    verse: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça-o em todos os seus caminhos, e ele endireitará as suas veredas.",
    reference: "Provérbios 3:5-6",
    message: "Quando a rotina parecer corrida ou surgirem imprevistos, confie que Deus conduzirá suas respostas, organizará o seu tempo e tornará o seu caminho suave e próspero.",
    theme: "Direção & Confiança",
  },
  {
    id: 16,
    verse: "Façam tudo com amor.",
    reference: "1 Coríntios 16:14",
    message: "O amor transforma cada pequena mensagem, cada agendamento e cada atendimento em um ato de bênção. Que o amor seja a sua assinatura em tudo o que você fizer hoje!",
    theme: "Amor em Tudo",
  },
  {
    id: 17,
    verse: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e tenha misericórdia de ti; o Senhor sobre ti levante o seu rosto e te dê a paz.",
    reference: "Números 6:24-26",
    message: "Uma bênção especial sobre a sua vida, sua mente e seu trabalho neste dia. Que você sinta a presença de Deus protegendo você, sua família e todos os seus projetos.",
    theme: "Bênção Sacerdotal",
  },
  {
    id: 18,
    verse: "Aquietai-vos e sabei que eu sou Deus.",
    reference: "Salmos 46:10",
    message: "Respire fundo no meio de qualquer correria. Deus está no controle de tudo. Faça o seu melhor com calma, um passo de cada vez. Você é muito competente e especial!",
    theme: "Quietude & Certeza",
  },
  {
    id: 19,
    verse: "A resposta calma desvia a fúria, mas a palavra ríspida desperta a ira.",
    reference: "Provérbios 15:1",
    message: "No atendimento ao cliente e na comunicação diária, a sua voz mansa, educada e cheia de empatia é um bálsamo. Que Deus inspire cada palavra que sair dos seus lábios e dedos hoje.",
    theme: "Manso & Acolhedor",
  },
  {
    id: 20,
    verse: "Eu te louvo porque me fizeste de modo especial e admirável. Tuas obras são maravilhosas! Digo isso com convicção.",
    reference: "Salmos 139:14",
    message: "Nunca se esqueça do quanto você é valiosa, amada e cheia de talentos únicos. O seu carinho e dedicação tornam o SecJessica um lugar acolhedor e profissional. Tenha um dia abençoado!",
    theme: "Identidade & Autoestima",
  },
];

export function InspirationalBanner({ className = "" }: { className?: string }) {
  const [current, setCurrent] = useState<DevotionalMessage>(DEVOTIONAL_MESSAGES[0]);
  const [copied, setCopied] = useState(false);
  const [greeting, setGreeting] = useState("Olá, Jéssica!");
  const [isRotating, setIsRotating] = useState(false);

  // Define a saudação conforme o horário e sorteia um versículo na montagem do componente (cada atualização de página)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Bom dia, Jéssica! ☀️");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Boa tarde, Jéssica! 🌤️");
    } else {
      setGreeting("Boa noite, Jéssica! ✨");
    }

    // Sorteia aleatoriamente um versículo a cada refresh/abertura da página
    const randomIndex = Math.floor(Math.random() * DEVOTIONAL_MESSAGES.length);
    setCurrent(DEVOTIONAL_MESSAGES[randomIndex]);
  }, []);

  // Permite à usuária sortear outro versículo com 1 clique
  function handleNextVerse() {
    setIsRotating(true);
    let nextIndex = Math.floor(Math.random() * DEVOTIONAL_MESSAGES.length);
    if (DEVOTIONAL_MESSAGES[nextIndex].id === current.id) {
      nextIndex = (nextIndex + 1) % DEVOTIONAL_MESSAGES.length;
    }
    setTimeout(() => {
      setCurrent(DEVOTIONAL_MESSAGES[nextIndex]);
      setIsRotating(false);
    }, 200);
  }

  // Copia o versículo + reflexão para compartilhar ou guardar
  function handleCopy() {
    const textToCopy = `📖 "${current.verse}" (${current.reference})\n\n💖 Mensagem do Dia para o Trabalho:\n${current.message}\n\n— SecJessica Secretariado Remoto`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-secjessica-200/80 bg-gradient-to-br from-amber-50/90 via-rose-50/40 to-emerald-50/40 p-6 md:p-8 shadow-sm backdrop-blur-sm transition-all duration-300 ${className}`}
    >
      {/* Detalhe de fundo decorativo delicado */}
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-secjessica-200/40 to-amber-200/30 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-gradient-to-tr from-rose-200/30 to-emerald-200/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Cabeçalho do Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secjessica-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secjessica-600/10 text-secjessica-700 shadow-inner">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-playfair text-base font-bold text-secjessica-900 tracking-tight">
                  {greeting}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secjessica-600/10 px-2.5 py-0.5 text-[11px] font-semibold text-secjessica-800">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  {current.theme}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sua inspiração diária para um dia de trabalho abençoado, sereno e produtivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={handleCopy}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-secjessica-200/70 bg-white/80 px-2.5 text-xs font-medium text-secjessica-900 transition-colors hover:bg-white hover:text-secjessica-700 shadow-2xs"
              title="Copiar versículo e reflexão"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 text-[11px]">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px]">Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleNextVerse}
              disabled={isRotating}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-secjessica-300 bg-secjessica-600 px-3 text-xs font-medium text-white transition-all hover:bg-secjessica-500 shadow-2xs active:scale-95"
              title="Sortear outro versículo para hoje"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRotating ? "animate-spin" : ""}`} />
              <span className="text-[11px]">Novo Versículo</span>
            </button>
          </div>
        </div>

        {/* Citação do Versículo Bíblico */}
        <div className="relative pl-6 pr-2 py-1">
          <Quote className="absolute left-0 top-0 h-5 w-5 text-secjessica-400/60 rotate-180" />
          <blockquote className="font-playfair text-base sm:text-lg font-medium italic text-secjessica-950 leading-relaxed">
            &ldquo;{current.verse}&rdquo;
          </blockquote>
          <p className="mt-1.5 text-xs font-bold text-secjessica-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>— {current.reference}</span>
          </p>
        </div>

        {/* Mensagem Motivacional Cristã para o Trabalho da Secretária */}
        <div className="rounded-xl border border-white/70 bg-white/70 p-4 shadow-2xs transition-all hover:bg-white/90">
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 mt-0.5">
              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
            </span>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              {current.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
