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
import { useI18n, LanguageSwitcher } from "./i18n";

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
  const { t } = useI18n();
  return (
    <div className="landing" id="inicio">
      <a className="landing-skip" href="#contenido">
        {t("Saltar al contenido")}
      </a>

      <header className="landing-header">
        <div className="landing-shell landing-header__inner">
          <a
            className="landing-brand"
            href="#inicio"
            aria-label={t("Brote, ir al inicio")}
          >
            <span className="landing-brand__mark">
              <LeafLogo size={28} />
            </span>
            <span>
              brote<span className="landing-brand__dot">.</span>
            </span>
          </a>
          <nav className="landing-nav" aria-label={t("Navegación principal")}>
            <a href="#como-funciona">{t("Cómo funciona")}</a>
            <a href="#juegos">{t("Explora y juega")}</a>
            <a href="#para-todos">{t("Para todos")}</a>
            <a href="#solana">{t('Solana')}</a>
          </nav>
          <div className="landing-header__tools">
            <LanguageSwitcher />
            <a className="landing-header__cta" href={APP}>
              <span className="landing-header__cta-desktop">{t("Probar la demo")}</span>
              <span className="landing-header__cta-mobile">{t('Demo')}</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main id="contenido">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-shell landing-hero__grid">
            <div className="landing-hero__copy">
              <div className="landing-kicker">
                <span className="landing-kicker__star">✳</span>{t('UNA NUEVA FORMA DE CRECER JUNTOS')}</div>
              <h1 id="landing-hero-title">{t('El dinero se aprende.')}<br />
                <em>{t('En equipo.')}</em>
              </h1>
              <p className="landing-hero__lead">{t('Un espacio para practicar, jugar y tomar mejores decisiones con alguien a tu lado. Desde la primera alcancía hasta una nueva etapa de vida.')}</p>
              <div className="landing-hero__actions">
                <ArrowLink href={APP}>{t('Entrar a la demo')}</ArrowLink>
                <a className="landing-text-link" href="#como-funciona">
                  {t("Descubre cómo funciona")} {" "}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
              <div className="landing-hero__note">
                <span className="landing-hero__note-icon">
                  <Check size={14} strokeWidth={3} />
                </span>{" "}
                {t("Demo interactiva, sin crear una cuenta · Brotes de práctica sin valor monetario")}
              </div>
            </div>

            <div
              className="landing-hero__art"
              aria-label={t("Ilustración de Brote y tarjetas de ejemplo de práctica")}
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
                  <Zap size={15} fill="currentColor" />{t('APRENDER ES UNA AVENTURA')}</span>
                <div className="landing-hero__mascot">
                  <Plant />
                </div>
                <span className="landing-hero__platform-bottom">{t('PASO A PASO')}<span>↗</span>
                </span>
              </div>
              <div className="landing-float landing-float--wallet">
                <div className="landing-float__top">
                  <span className="landing-float__icon">
                    <Wallet size={20} />
                  </span>
                  <span className="landing-float__dots">•••</span>
                </div>
                <span className="landing-float__eyebrow">{t('EJEMPLO DE PRÁCTICA')}</span>
                <strong>
                  240 <small>{t('Brotes')}</small>
                </strong>
                <span className="landing-float__foot">{t('Saldo ficticio')}<span>↗</span>
                </span>
              </div>
              <div className="landing-float landing-float--goal">
                <span className="landing-float__goal-icon">
                  <Target size={21} />
                </span>
                <span>
                  <b>{t('Mi primera meta')}</b>
                  <small>{t('¡Cada paso cuenta!')}</small>
                </span>
                <span className="landing-float__goal-stars">✦</span>
              </div>
              <div className="landing-hero__level">
                <span>01</span>{t('TU PRÓXIMO NIVEL')}</div>
            </div>
          </div>
          <div className="landing-hero__rail">
            <span>{t('IMAGINA')}</span>
            <span>{t('APRENDE')}</span>
            <span>{t('DECIDE')}</span>
            <span>{t('CRECE')}</span>
            <span className="landing-hero__rail-icon">✳</span>
            <span>{t('IMAGINA')}</span>
            <span>{t('APRENDE')}</span>
            <span>{t('DECIDE')}</span>
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
                <span className="landing-overline">{t('EL CAMINO BROTE')}<span>↘</span>
                </span>
                <h2 id="landing-how-title">{t('Pequeños pasos.')}<br />
                  <span>{t('Grandes posibilidades.')}</span>
                </h2>
              </div>
              <p>{t('Un círculo donde cada persona aprende a su ritmo y quien acompaña conserva la claridad de cada decisión.')}</p>
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
                <h3>{t('Crea tu círculo')}</h3>
                <p>{t('Organiza los perfiles de quienes aprenden y acompaña sus primeros pasos desde un mismo lugar.')}</p>
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
                    <span>{t('RETO DEL DÍA')}</span>
                    <b>{t('Elige y aprende')}</b>
                    <div className="landing-step__mini-bars">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <span className="landing-step__mini-badge">{t('+ XP')}</span>
                </div>
                <h3>{t('Practica jugando')}</h3>
                <p>{t('Explora misiones, metas y decisiones cotidianas con Brotes ficticios. Equivocarse también enseña.')}</p>
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
                      <b>{t('Decisión por revisar')}</b>
                      <small>{t('Tú acompañas el proceso')}</small>
                    </div>
                    <Check size={21} />
                  </div>
                </div>
                <h3>{t('Acompaña de cerca')}</h3>
                <p>{t('Revisa la actividad, conversa sobre cada elección y decide cuándo avanzar juntos.')}</p>
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
                <span className="landing-overline">{t('APRENDER SE SIENTE DIFERENTE')}<span>✦</span>
                </span>
                <h2 id="landing-games-title">{t('Aquí cada decisión')}<br />{t('suma experiencia')}<span className="landing-punctuation">.</span>
                </h2>
              </div>
              <p>{t('Retos sencillos para explorar el valor de ahorrar, elegir y planear. Todo dentro de la práctica.')}</p>
            </div>
            <div className="landing-game-grid">
              <article className="landing-game landing-game--coral">
                <div className="landing-game__top">
                  <span>{t('MISIÓN 01')}</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="landing-game__picture landing-game__picture--basket">
                  <span className="landing-game__ticket">{t('¿Qué llevarías?')}</span>
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
                <h3>{t('Mercado aventura')}</h3>
                <p>{t('Recorre el mercado y completa tu lista sin pasarte del presupuesto.')}</p>
                <a href={LEARN}>{t('Jugar en la demo')}<ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
              <article className="landing-game landing-game--blue">
                <div className="landing-game__top">
                  <span>{t('MISIÓN 02')}</span>
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
                <h3>{t('Detective digital')}</h3>
                <p>{t('Encuentra pistas para reconocer mensajes sospechosos.')}</p>
                <a href={LEARN}>{t('Jugar en la demo')}<ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
              <article className="landing-game landing-game--purple">
                <div className="landing-game__top">
                  <span>{t('MISIÓN 03')}</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="landing-game__picture landing-game__picture--choice">
                  <span className="landing-game__choice-card">
                    <Sparkles size={26} />{t('Hoy')}</span>
                  <span className="landing-game__choice-vs">{t('O')}</span>
                  <span className="landing-game__choice-card">
                    <Target size={26} />{t('Después')}</span>
                </div>
                <h3>{t('Isla de las metas')}</h3>
                <p>{t('Gana monedas de juego, prepara una reserva y construye tu meta en una isla.')}</p>
                <a href={LEARN}>{t('Jugar en la demo')}<ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
            </div>
            <div className="landing-games__more">
              <span>
                <CirclePlay size={20} />{t('Juega, repite, aprende a tu manera.')}</span>
              <ArrowLink href={LEARN} variant="outline">{t('Explorar los juegos')}</ArrowLink>
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
              <span className="landing-overline">{t('PARA CADA ETAPA')}<span>✳</span>
              </span>
              <h2 id="landing-all-title">{t('Aprender no tiene')}<br />
                <em>{t('una sola edad.')}</em>
              </h2>
              <p>{t('Una niña que descubre su primera meta. Un adulto que quiere ordenar sus decisiones. Una persona mayor que prefiere ir paso a paso. Brote deja espacio para todos.')}</p>
              <div className="landing-all__pills">
                <span>{t('Desde los primeros pasos')}</span>
                <span>{t('A cualquier ritmo')}</span>
                <span>{t('En compañía')}</span>
              </div>
              <ArrowLink href={APP} variant="light">{t('Conoce la demo')}</ArrowLink>
            </div>
            <div className="landing-all__display">
              <div className="landing-all__display-top">
                <span>{t('UNA VISTA MÁS CLARA')}</span>
                <span>
                  <MousePointer2 size={18} />{t('MODO SIMPLE')}</span>
              </div>
              <div className="landing-all__display-main">
                <span className="landing-all__display-icon">
                  <BookOpen size={31} />
                </span>
                <span>{t('UN PASO A LA VEZ')}</span>
                <strong>{t('¿Qué te gustaría hacer hoy?')}</strong>
                <p>{t('Opciones claras. Textos fáciles de leer. Tu propio ritmo para decidir.')}</p>
                <div>
                  <span>{t('Ver mi saldo')}</span>
                  <ArrowRight size={22} />
                </div>
              </div>
              <div className="landing-all__display-bottom">
                <span>
                  <Check size={17} />{t('Sin prisa')}</span>
                <span>
                  <Check size={17} />{t('Con apoyo')}</span>
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
                <span className="landing-solana__frame-top">{t('DOS CAMINOS, CLAROS DESDE EL INICIO')}<span>✳</span>
                </span>
                <div className="landing-solana__practice">
                  <span>
                    <Sparkles size={25} />
                  </span>
                  <div>
                    <small>{t('01 / APRENDER')}</small>
                    <b>{t('Brotes de práctica')}</b>
                    <p>{t('Ficticios · sin valor monetario')}</p>
                  </div>
                </div>
                <div className="landing-solana__bridge">↓</div>
                <div className="landing-solana__real">
                  <span>
                    <LockKeyhole size={25} />
                  </span>
                  <div>
                    <small>{t('02 / DECIDIR')}</small>
                    <b>{t('SOL en Solana')}</b>
                    <p>{t('Mainnet real · testnet de prueba')}</p>
                  </div>
                </div>
              </div>
              <span className="landing-solana__side">{t('TU WALLET, TU DECISIÓN ↗')}</span>
            </div>
            <div className="landing-solana__copy">
              <span className="landing-overline">{t('CUANDO QUIERAS EXPLORAR MÁS')}<span>↗</span>
              </span>
              <h2 id="landing-solana-title">{t('La práctica es juego.')}<br />
                <span>{t('SOL es real.')}</span>
              </h2>
              <p>{t('Los Brotes te ayudan a aprender sin mover dinero. En Solana puedes elegir mainnet, con SOL real, o testnet, con SOL de prueba sin valor monetario. La persona responsable debe iniciar y firmar cada movimiento.')}</p>
              <div className="landing-solana__fact">
                <ShieldCheck size={22} />
                <span>{t('Explora distintos perfiles en la demo. Para mover SOL, la wallet responsable tiene que firmar.')}</span>
              </div>
              <ArrowLink href={SOLANA} variant="outline">{t('Explorar Solana en la demo')}</ArrowLink>
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
            <span className="landing-overline">{t('TU HISTORIA EMPIEZA AQUÍ')}</span>
            <h2 id="landing-final-title">{t('Un pequeño paso puede')}<br />
              <em>{t('cambiarlo todo.')}</em>
            </h2>
            <p>{t('Abre la demo, explora un círculo de ejemplo y descubre una forma más cercana de aprender sobre dinero.')}</p>
            <ArrowLink href={APP} variant="light">{t('Entrar a la demo')}</ArrowLink>
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
            aria-label={t("Brote, volver al inicio")}
          >
            <span className="landing-brand__mark">
              <LeafLogo size={25} />
            </span>
            <span>
              brote<span className="landing-brand__dot">.</span>
            </span>
          </a>
          <p>{t('Crecer se aprende juntos.')}</p>
          <div>
            <a href="#como-funciona">{t('Cómo funciona')}</a>
            <a href="#juegos">{t('Juegos')}</a>
            <a href="#para-todos">{t('Para todos')}</a>
            <a href={APP}>{t('Abrir demo')}<ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div className="landing-shell landing-footer__bottom">
          <span>© {new Date().getFullYear()} Brote</span>
          <span>{t('Brotes ficticios. Mainnet con SOL real. Testnet sin valor monetario.')}</span>
          <a href="#inicio">{t('Volver arriba')}<ChevronDown size={15} />
          </a>
        </div>
      </footer>
    </div>
  );
}
