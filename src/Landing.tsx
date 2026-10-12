import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CirclePlay,
  Compass,
  Gamepad2,
  HeartHandshake,
  LockKeyhole,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import Plant, { LeafLogo } from "./components/Plant";
import Avatar from "./components/Avatar";

const APP = "/app";
const LEARN = "/app?view=learn";
const SOLANA = "/app?mode=crypto";

function ArrowLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "light" | "outline";
}) {
  return (
    <a className={`landing-link landing-link--${variant}`} href={href}>
      <span>{children}</span>
      <ArrowUpRight size={19} strokeWidth={2.2} aria-hidden="true" />
    </a>
  );
}

export default function Landing() {
  return (
    <div className="landing" id="inicio">
      <a className="landing-skip" href="#contenido">
        Saltar al contenido
      </a>

      <header className="landing-header">
        <div className="landing-shell landing-header__inner">
          <a
            className="landing-brand"
            href="#inicio"
            aria-label="Brote, ir al inicio"
          >
            <span className="landing-brand__mark">
              <LeafLogo size={28} />
            </span>
            <span>
              brote<span className="landing-brand__dot">.</span>
            </span>
          </a>
          <nav className="landing-nav" aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#juegos">Explora y juega</a>
            <a href="#para-todos">Para todos</a>
            <a href="#solana">Solana</a>
          </nav>
          <a className="landing-header__cta" href={APP}>
            Probar la demo <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main id="contenido">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-shell landing-hero__grid">
            <div className="landing-hero__copy">
              <div className="landing-kicker">
                <span className="landing-kicker__star">✳</span> UNA NUEVA FORMA
                DE CRECER JUNTOS
              </div>
              <h1 id="landing-hero-title">
                El dinero se aprende.
                <br />
                <em>En equipo.</em>
              </h1>
              <p className="landing-hero__lead">
                Un espacio para practicar, jugar y tomar mejores decisiones con
                alguien a tu lado. Desde la primera alcancía hasta una nueva
                etapa de vida.
              </p>
              <div className="landing-hero__actions">
                <ArrowLink href={APP}>Entrar a la demo</ArrowLink>
                <a className="landing-text-link" href="#como-funciona">
                  Descubre cómo funciona{" "}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
              <div className="landing-hero__note">
                <span className="landing-hero__note-icon">
                  <Check size={14} strokeWidth={3} />
                </span>{" "}
                Demo interactiva, sin crear una cuenta · Brotes de práctica sin
                valor monetario
              </div>
            </div>

            <div
              className="landing-hero__art"
              aria-label="Ilustración de Brote y tarjetas de ejemplo de práctica"
              role="img"
            >
              <div className="landing-hero__orbit landing-hero__orbit--one" />
              <div className="landing-hero__orbit landing-hero__orbit--two" />
              <span className="landing-hero__spark landing-hero__spark--one">
                ✳
              </span>
              <span className="landing-hero__spark landing-hero__spark--two">
                ✦
              </span>
              <div className="landing-hero__platform">
                <span className="landing-hero__platform-label">
                  <Zap size={15} fill="currentColor" /> APRENDER ES UNA AVENTURA
                </span>
                <div className="landing-hero__mascot">
                  <Plant />
                </div>
                <span className="landing-hero__platform-bottom">
                  PASO A PASO <span>↗</span>
                </span>
              </div>
              <div className="landing-float landing-float--wallet">
                <div className="landing-float__top">
                  <span className="landing-float__icon">
                    <Wallet size={20} />
                  </span>
                  <span className="landing-float__dots">•••</span>
                </div>
                <span className="landing-float__eyebrow">
                  EJEMPLO DE PRÁCTICA
                </span>
                <strong>
                  240 <small>Brotes</small>
                </strong>
                <span className="landing-float__foot">
                  Saldo ficticio <span>↗</span>
                </span>
              </div>
              <div className="landing-float landing-float--goal">
                <span className="landing-float__goal-icon">
                  <Target size={21} />
                </span>
                <span>
                  <b>Mi primera meta</b>
                  <small>¡Cada paso cuenta!</small>
                </span>
                <span className="landing-float__goal-stars">✦</span>
              </div>
              <div className="landing-hero__level">
                <span>01</span> TU PRÓXIMO NIVEL
              </div>
            </div>
          </div>
          <div className="landing-hero__rail">
            <span>IMAGINA</span>
            <span>APRENDE</span>
            <span>DECIDE</span>
            <span>CRECE</span>
            <span className="landing-hero__rail-icon">✳</span>
            <span>IMAGINA</span>
            <span>APRENDE</span>
            <span>DECIDE</span>
          </div>
        </section>

        <section
          className="landing-section landing-how"
          id="como-funciona"
          aria-labelledby="landing-how-title"
        >
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head--split">
              <div>
                <span className="landing-overline">
                  EL CAMINO BROTE <span>↘</span>
                </span>
                <h2 id="landing-how-title">
                  Pequeños pasos.
                  <br />
                  <span>Grandes posibilidades.</span>
                </h2>
              </div>
              <p>
                Un círculo donde cada persona aprende a su ritmo y quien
                acompaña conserva la claridad de cada decisión.
              </p>
            </div>
            <div className="landing-steps">
              <article className="landing-step landing-step--purple">
                <div className="landing-step__top">
                  <span className="landing-step__number">01</span>
                  <span className="landing-step__icon">
                    <Compass size={29} strokeWidth={1.8} />
                  </span>
                </div>
                <div className="landing-step__visual landing-step__visual--circle">
                  <div className="landing-step__avatar landing-step__avatar--a">
                    <Avatar kind="fox" color="mint" size={58} />
                  </div>
                  <div className="landing-step__avatar landing-step__avatar--b">
                    <Avatar kind="owl" color="lavender" size={58} />
                  </div>
                  <div className="landing-step__avatar landing-step__avatar--c">
                    <Avatar kind="bear" color="peach" size={58} />
                  </div>
                  <span className="landing-step__visual-star">✳</span>
                </div>
                <h3>Crea tu círculo</h3>
                <p>
                  Organiza los perfiles de quienes aprenden y acompaña sus
                  primeros pasos desde un mismo lugar.
                </p>
              </article>
              <article className="landing-step landing-step--blue">
                <div className="landing-step__top">
                  <span className="landing-step__number">02</span>
                  <span className="landing-step__icon">
                    <Gamepad2 size={29} strokeWidth={1.8} />
                  </span>
                </div>
                <div className="landing-step__visual landing-step__visual--game">
                  <div className="landing-step__mini-card">
                    <span>RETO DEL DÍA</span>
                    <b>Elige y aprende</b>
                    <div className="landing-step__mini-bars">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <span className="landing-step__mini-badge">+ XP</span>
                </div>
                <h3>Practica jugando</h3>
                <p>
                  Explora misiones, metas y decisiones cotidianas con Brotes
                  ficticios. Equivocarse también enseña.
                </p>
              </article>
              <article className="landing-step landing-step--lime">
                <div className="landing-step__top">
                  <span className="landing-step__number">03</span>
                  <span className="landing-step__icon">
                    <HeartHandshake size={29} strokeWidth={1.8} />
                  </span>
                </div>
                <div className="landing-step__visual landing-step__visual--check">
                  <div className="landing-step__approval">
                    <span>
                      <ShieldCheck size={26} />
                    </span>
                    <div>
                      <b>Decisión por revisar</b>
                      <small>Tú acompañas el proceso</small>
                    </div>
                    <Check size={21} />
                  </div>
                </div>
                <h3>Acompaña de cerca</h3>
                <p>
                  Revisa la actividad, conversa sobre cada elección y decide
                  cuándo avanzar juntos.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-games"
          id="juegos"
          aria-labelledby="landing-games-title"
        >
          <div className="landing-shell">
            <div className="landing-section-head landing-games__head">
              <div>
                <span className="landing-overline">
                  APRENDER SE SIENTE DIFERENTE <span>✦</span>
                </span>
                <h2 id="landing-games-title">
                  Aquí cada decisión
                  <br />
                  suma experiencia<span className="landing-punctuation">.</span>
                </h2>
              </div>
              <p>
                Retos sencillos para explorar el valor de ahorrar, elegir y
                planear. Todo dentro de la práctica.
              </p>
            </div>
            <div className="landing-game-grid">
              <article className="landing-game landing-game--coral">
                <div className="landing-game__top">
                  <span>MISIÓN 01</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="landing-game__picture landing-game__picture--basket">
                  <span className="landing-game__ticket">¿Qué llevarías?</span>
                  <span className="landing-game__basket">▣</span>
                  <span className="landing-game__fruit landing-game__fruit--one">
                    ●
                  </span>
                  <span className="landing-game__fruit landing-game__fruit--two">
                    ●
                  </span>
                  <span className="landing-game__fruit landing-game__fruit--three">
                    ●
                  </span>
                </div>
                <h3>La compra inteligente</h3>
                <p>Arma una canasta sin pasarte del presupuesto de práctica.</p>
                <a href={LEARN}>
                  Jugar en la demo <ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
              <article className="landing-game landing-game--blue">
                <div className="landing-game__top">
                  <span>MISIÓN 02</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="landing-game__picture landing-game__picture--path">
                  <span className="landing-game__path-point landing-game__path-point--a">
                    1
                  </span>
                  <span className="landing-game__path-line" />
                  <span className="landing-game__path-point landing-game__path-point--b">
                    2
                  </span>
                  <span className="landing-game__path-flag">⚑</span>
                  <span className="landing-game__path-spark">✳</span>
                </div>
                <h3>Detective digital</h3>
                <p>Encuentra pistas para reconocer mensajes sospechosos.</p>
                <a href={LEARN}>
                  Jugar en la demo <ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
              <article className="landing-game landing-game--purple">
                <div className="landing-game__top">
                  <span>MISIÓN 03</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="landing-game__picture landing-game__picture--choice">
                  <span className="landing-game__choice-card">
                    <Sparkles size={26} /> Hoy
                  </span>
                  <span className="landing-game__choice-vs">O</span>
                  <span className="landing-game__choice-card">
                    <Target size={26} /> Después
                  </span>
                </div>
                <h3>Un plan para imprevistos</h3>
                <p>
                  Decide cuánto destinar a hoy y cuánto guardar para el futuro.
                </p>
                <a href={LEARN}>
                  Jugar en la demo <ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
            </div>
            <div className="landing-games__more">
              <span>
                <CirclePlay size={20} /> Juega, repite, aprende a tu manera.
              </span>
              <ArrowLink href={LEARN} variant="outline">
                Explorar los juegos
              </ArrowLink>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-all"
          id="para-todos"
          aria-labelledby="landing-all-title"
        >
          <div className="landing-shell landing-all__grid">
            <div className="landing-all__copy">
              <span className="landing-overline">
                PARA CADA ETAPA <span>✳</span>
              </span>
              <h2 id="landing-all-title">
                Aprender no tiene
                <br />
                <em>una sola edad.</em>
              </h2>
              <p>
                Una niña que descubre su primera meta. Un adulto que quiere
                ordenar sus decisiones. Una persona mayor que prefiere ir paso a
                paso. Brote deja espacio para todos.
              </p>
              <div className="landing-all__pills">
                <span>Desde los primeros pasos</span>
                <span>A cualquier ritmo</span>
                <span>En compañía</span>
              </div>
              <ArrowLink href={APP} variant="light">
                Conoce la demo
              </ArrowLink>
            </div>
            <div className="landing-all__display">
              <div className="landing-all__display-top">
                <span>UNA VISTA MÁS CLARA</span>
                <span>
                  <MousePointer2 size={18} /> MODO SIMPLE
                </span>
              </div>
              <div className="landing-all__display-main">
                <span className="landing-all__display-icon">
                  <BookOpen size={31} />
                </span>
                <span>UN PASO A LA VEZ</span>
                <strong>¿Qué te gustaría hacer hoy?</strong>
                <p>
                  Opciones claras. Textos fáciles de leer. Tu propio ritmo para
                  decidir.
                </p>
                <div>
                  <span>Ver mi saldo</span>
                  <ArrowRight size={22} />
                </div>
              </div>
              <div className="landing-all__display-bottom">
                <span>
                  <Check size={17} /> Sin prisa
                </span>
                <span>
                  <Check size={17} /> Con apoyo
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-solana"
          id="solana"
          aria-labelledby="landing-solana-title"
        >
          <div className="landing-shell landing-solana__grid">
            <div className="landing-solana__art" aria-hidden="true">
              <div className="landing-solana__frame">
                <span className="landing-solana__frame-top">
                  DOS CAMINOS, CLAROS DESDE EL INICIO <span>✳</span>
                </span>
                <div className="landing-solana__practice">
                  <span>
                    <Sparkles size={25} />
                  </span>
                  <div>
                    <small>01 / APRENDER</small>
                    <b>Brotes de práctica</b>
                    <p>Ficticios · sin valor monetario</p>
                  </div>
                </div>
                <div className="landing-solana__bridge">↓</div>
                <div className="landing-solana__real">
                  <span>
                    <LockKeyhole size={25} />
                  </span>
                  <div>
                    <small>02 / DECIDIR</small>
                    <b>SOL en Solana</b>
                    <p>Real · firma del responsable</p>
                  </div>
                </div>
              </div>
              <span className="landing-solana__side">
                TU WALLET, TU DECISIÓN ↗
              </span>
            </div>
            <div className="landing-solana__copy">
              <span className="landing-overline">
                CUANDO QUIERAS EXPLORAR MÁS <span>↗</span>
              </span>
              <h2 id="landing-solana-title">
                La práctica es juego.
                <br />
                <span>SOL es real.</span>
              </h2>
              <p>
                Los Brotes te ayudan a aprender sin mover dinero. En una
                experiencia aparte puedes conectar una wallet de Solana mainnet
                y revisar operaciones reales. La persona responsable debe
                iniciar y firmar cada movimiento.
              </p>
              <div className="landing-solana__fact">
                <ShieldCheck size={22} />
                <span>
                  Explora distintos perfiles en la demo. Para mover SOL, la
                  wallet responsable tiene que firmar.
                </span>
              </div>
              <ArrowLink href={SOLANA} variant="outline">
                Explorar Solana en la demo
              </ArrowLink>
            </div>
          </div>
        </section>

        <section
          className="landing-final"
          aria-labelledby="landing-final-title"
        >
          <div className="landing-shell landing-final__inner">
            <span className="landing-final__star" aria-hidden="true">
              ✳
            </span>
            <span className="landing-overline">TU HISTORIA EMPIEZA AQUÍ</span>
            <h2 id="landing-final-title">
              Un pequeño paso puede
              <br />
              <em>cambiarlo todo.</em>
            </h2>
            <p>
              Abre la demo, explora un círculo de ejemplo y descubre una forma
              más cercana de aprender sobre dinero.
            </p>
            <ArrowLink href={APP} variant="light">
              Entrar a la demo
            </ArrowLink>
            <span className="landing-final__corner" aria-hidden="true">
              ↗
            </span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-shell landing-footer__inner">
          <a
            className="landing-brand"
            href="#inicio"
            aria-label="Brote, volver al inicio"
          >
            <span className="landing-brand__mark">
              <LeafLogo size={25} />
            </span>
            <span>
              brote<span className="landing-brand__dot">.</span>
            </span>
          </a>
          <p>Crecer se aprende juntos.</p>
          <div>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#juegos">Juegos</a>
            <a href="#para-todos">Para todos</a>
            <a href={APP}>
              Abrir demo <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div className="landing-shell landing-footer__bottom">
          <span>© {new Date().getFullYear()} Brote</span>
          <span>
            Brotes de práctica sin valor monetario. SOL real en Solana mainnet.
          </span>
          <a href="#inicio">
            Volver arriba <ChevronDown size={15} />
          </a>
        </div>
      </footer>
    </div>
  );
}
