import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { stopSpeech } from "../speech";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  CircleHelp,
  Clock3,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";
import Modal from "./Modal";
import MarketGame from "./MarketGame";
import IslandGame from "./IslandGame";
import "../games/arcade.css";
import type { StoreAPI, Wallet } from "../types";
import { useI18n } from "../i18n";

type Props = {
  wallet: Wallet;
  store: StoreAPI;
  notify: (message: string) => void;
  simple?: boolean;
};
type MissionId = "market-adventure" | "spot-the-scam" | "goal-island";
type Mission = {
  id: MissionId;
  title: string;
  eyebrow: string;
  lesson: string;
  difficulty: string;
  minutes: number;
  xp: number;
  reward: number;
  icon: typeof ShoppingBasket;
  tone: string;
};

const missions: Mission[] = [
  {
    id: "market-adventure",
    title: "Mercado aventura",
    eyebrow: "NECESIDADES Y DESEOS",
    lesson:
      "Recorre el mercado, compra lo que necesitas y supera tres rondas sin gastar de más.",
    difficulty: "Suave",
    minutes: 4,
    xp: 45,
    reward: 12,
    icon: ShoppingBasket,
    tone: "mint",
  },
  {
    id: "spot-the-scam",
    title: "Detective digital",
    eyebrow: "SEGURIDAD EN LÍNEA",
    lesson: "Aprende a reconocer mensajes sospechosos y proteger tus datos.",
    difficulty: "Suave",
    minutes: 3,
    xp: 30,
    reward: 10,
    icon: ShieldCheck,
    tone: "lavender",
  },
  {
    id: "goal-island",
    title: "Isla de las metas",
    eyebrow: "AHORRO PARA EMERGENCIAS",
    lesson:
      "Haz crecer una isla: gana, cubre necesidades, guarda una reserva y construye tu meta.",
    difficulty: "Medio",
    minutes: 4,
    xp: 50,
    reward: 16,
    icon: WalletCards,
    tone: "apricot",
  },
];

const quiz = [
  {
    prompt:
      "Recibes un mensaje: «Tu cuenta se bloqueará hoy. Entra aquí y confirma tu clave». ¿Qué haces?",
    options: [
      "Abro el enlace para evitar el bloqueo",
      "No abro el enlace; verifico desde la app o sitio oficial",
      "Reenvío mi clave para confirmar que soy yo",
    ],
    answer: 1,
    why: "Los mensajes urgentes que piden claves o usan enlaces inesperados pueden ser phishing. Abre la app o escribe la dirección oficial por tu cuenta.",
  },
  {
    prompt:
      "Una persona desconocida te pide un código que llegó a tu teléfono. ¿Qué es lo más seguro?",
    options: [
      "No compartirlo; los códigos son privados",
      "Compartirlo si conoce mi nombre",
      "Publicarlo para que me ayuden",
    ],
    answer: 0,
    why: "Los códigos de verificación funcionan como una llave temporal. No los compartas, ni siquiera con alguien que diga ser soporte.",
  },
  {
    prompt: "¿Cómo compruebas si una oferta por mensaje es real?",
    options: [
      "Confío si tiene un logo conocido",
      "Reviso por un canal oficial y consulto a una persona de confianza",
      "Pago primero para no perder la oportunidad",
    ],
    answer: 1,
    why: "Los logos se pueden copiar. Comprueba las ofertas por canales oficiales y pide apoyo si algo te presiona o parece extraño.",
  },
];

function translateTree(node: ReactNode, t: ReturnType<typeof useI18n>["t"]): ReactNode {
  if (typeof node === "string") {
    const match = node.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match || !match[2]) return node;
    return `${match[1]}${t(match[2])}${match[3]}`;
  }
  if (Array.isArray(node)) return node.map((child) => translateTree(child, t));
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  const props = { ...node.props } as Record<string, unknown>;
  for (const key of ["aria-label", "title", "alt"]) {
    if (typeof props[key] === "string") props[key] = t(props[key] as string);
  }
  return cloneElement(node, props, translateTree(node.props.children, t));
}

export default function Learning({
  wallet,
  store,
  notify,
  simple = false,
}: Props) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState<MissionId | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [gameRun, setGameRun] = useState(0);
  const handleGameComplete = useCallback(() => setGameReady(true), []);
  const handleGameReset = useCallback(() => setGameReady(false), []);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [speechMessage, setSpeechMessage] = useState("");
  const spoken = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      stopSpeech(window.speechSynthesis, spoken.current);
    spoken.current = null;
  }, [active, quizStep]);

  const [justCompleted, setJustCompleted] = useState(false);
  const completed = wallet.completedMissions ?? [];
  const xp = Math.max(0, wallet.xp ?? 0);
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const mission = missions.find((item) => item.id === active);
  const quizScore = quizAnswers.reduce(
    (sum, answer, index) => sum + (answer === quiz[index]?.answer ? 1 : 0),
    0,
  );

  const closeMission = () => {
    setActive(null);
    setJustCompleted(false);
    resetMission();
  };
  const openMission = (id: MissionId) => {
    if (wallet.paused) {
      notify(t("El aprendizaje está en pausa para este perfil."));
      return;
    }
    setJustCompleted(false);
    resetMission();
    setActive(id);
  };
  const resetMission = () => {
    setGameReady(false);
    setGameRun((run) => run + 1);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizStep(0);
    setSpeechMessage("");

  };
  const finishMission = (item: Mission) => {
    if (wallet.paused) {
      notify(t("El perfil está en pausa. No se entregaron recompensas."));
      return;
    }
    if ((wallet.completedMissions ?? []).includes(item.id)) {
      notify(t("Esta misión ya fue completada."));
      closeMission();
      return;
    }
    try {
      store.completeMission(wallet.id, item.id, item.xp, item.reward);
    } catch (error) {
      notify(
        error instanceof Error
          ? t(error.message)
          : t("No pudimos guardar tu progreso."),
      );
      return;
    }
    notify(t("¡Misión completada! +{xp} XP y {reward} Brotes de práctica.", { xp: item.xp, reward: item.reward }));
    setJustCompleted(true);
  };

  const quizReady = quizSubmitted && quizScore === quiz.length;
  const speakCurrentQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined") {
      setSpeechMessage(
        t("La lectura en voz alta no está disponible en este navegador."),
      );
      return;
    }
    stopSpeech(window.speechSynthesis, spoken.current);
    const question = quiz[quizStep];
    const utterance = new SpeechSynthesisUtterance(
      `${t(question.prompt)} ${question.options.map((option, index) => `${t("Opción {count}: {option}", { count: index + 1, option: t(option) })}`).join(". ")}`,
    );
    utterance.lang = locale;
    spoken.current = utterance;
    utterance.onstart = () => setSpeechMessage(t("Leyendo en voz alta…"));
    utterance.onend = () => setSpeechMessage(t("Lectura terminada."));
    utterance.onerror = () =>
      setSpeechMessage(t("No se pudo iniciar la lectura en voz alta."));
    setSpeechMessage(t("Preparando lectura…"));
    window.speechSynthesis.speak(utterance);
  };

  function renderGameReward(item: Mission, alreadyCompleted: boolean) {
    return <div className="arcade-reward" role="status">
      <div><Sparkles size={20} /><strong>{t(alreadyCompleted ? "¡Lo lograste otra vez!" : "¡Juego superado!")}</strong></div>
      <p>{t(alreadyCompleted ? "Puedes repetir para practicar. La recompensa de este juego ya está guardada." : "Guarda tu logro para recibir XP y Brotes de práctica. Las monedas del juego son simuladas.")}</p>
      <button type="button" className="button button-primary" disabled={!store.persistence.writable}
        onClick={() => alreadyCompleted ? closeMission() : finishMission(item)}>
        {t(alreadyCompleted ? "Volver a misiones" : "Guardar logro y recompensa")} <ArrowRight size={17} />
      </button>
    </div>;
  }

  const renderMission = () => {
    if (!mission) return null;
    const isDone = completed.includes(mission.id);
    return (
          <Modal title={t(mission.title)} onClose={closeMission} variant={mission.id === "spot-the-scam" ? undefined : "game"}>
        <div className="learning-modal-content">
          {mission.id === "spot-the-scam" && <div className="learning-modal-intro">
            <span className={`learning-icon learning-icon-${mission.tone}`}>
              <mission.icon size={22} />
            </span>
            <div>
              <p className="learning-eyebrow">{t(mission.eyebrow)}</p>
              <p className="learning-muted">
                Una práctica breve. Todo aquí es simulado.
              </p>
            </div>
          </div>}
          {(isDone && mission.id === "spot-the-scam") || justCompleted ? (
            <div className="learning-finished" role="status">
              <span className="learning-finished-icon">
                <BadgeCheck size={30} />
              </span>
              <p className="learning-eyebrow">
                {justCompleted
                  ? "¡NUEVA INSIGNIA DE APRENDIZAJE!"
                  : "MISIÓN COMPLETADA"}
              </p>
              <h3>
                {justCompleted
                  ? "¡Misión cumplida!"
                  : "¡Ya completaste esta misión!"}
              </h3>
              <p>
                {justCompleted
                  ? t("Sumaste {xp} XP y {reward} Brotes de práctica. Tu avance cuenta, paso a paso.", { xp: mission.xp, reward: mission.reward })
                  : "Tu progreso y recompensa de práctica ya están guardados para este perfil."}
              </p>
              <button className="button button-primary" onClick={closeMission}>
                Volver a misiones
              </button>
            </div>
          ) : wallet.paused ? (
            <div className="learning-paused" role="status">
              <LockKeyhole size={24} />
              <h3>Este perfil está en pausa</h3>
              <p>Puedes volver a practicar cuando se reanude el aprendizaje.</p>
            </div>
          ) : mission.id === "market-adventure" ? (
            <>
              <MarketGame key={`${wallet.id}:${gameRun}`} wallet={wallet} simple={simple}
                disabled={!store.persistence.writable} onComplete={handleGameComplete} onReset={handleGameReset} />
              {gameReady && renderGameReward(mission, isDone)}
            </>
          ) : mission.id === "spot-the-scam" ? (
            <div className="learning-game">
              {!quizSubmitted ? (
                <>
                  <p className="learning-instruction">
                    {simple
                      ? "Lee o escucha. Elige la respuesta más segura."
                      : "Elige la respuesta más segura en cada situación. Puedes cambiar tus respuestas antes de revisar."}
                  </p>
                  {simple ? (
                    <>
                      <div
                        className="learning-simple-progress"
                        aria-live="polite"
                      >
                        {t("Pregunta {count} de {total}", { count: quizStep + 1, total: quiz.length })}
                      </div>
                      <fieldset
                        className="learning-question learning-question-simple"
                        key={quiz[quizStep].prompt}
                      >
                        <legend>
                          <span className="learning-question-number">
                            0{quizStep + 1}
                          </span>
                          {t(quiz[quizStep].prompt)}
                        </legend>
                        <div className="learning-options">
                          {quiz[quizStep].options.map((option, optionIndex) => (
                            <label key={option}>
                              <input
                                type="radio"
                                name={`quiz-${quizStep}`}
                                checked={quizAnswers[quizStep] === optionIndex}
                                onChange={() =>
                                  setQuizAnswers((current) => {
                                    const next = [...current];
                                    next[quizStep] = optionIndex;
                                    return next;
                                  })
                                }
                              />
                                <span>{t(option)}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="learning-simple-tools">
                        <button
                          type="button"
                          className="button button-secondary learning-listen-button"
                          onClick={speakCurrentQuestion}
                        >
                          <span aria-hidden="true">🔊</span> Escuchar pregunta
                        </button>
                        <span className="learning-speech-status" role="status">
                          {speechMessage}
                        </span>
                      </div>
                    </>
                  ) : (
                    quiz.map((question, index) => (
                      <fieldset
                        className="learning-question"
                        key={question.prompt}
                      >
                        <legend>
                          <span className="learning-question-number">
                            0{index + 1}
                          </span>
                          {t(question.prompt)}
                        </legend>
                        <div className="learning-options">
                          {question.options.map((option, optionIndex) => (
                            <label key={option}>
                              <input
                                type="radio"
                                name={`quiz-${index}`}
                                checked={quizAnswers[index] === optionIndex}
                                onChange={() =>
                                  setQuizAnswers((current) => {
                                    const next = [...current];
                                    next[index] = optionIndex;
                                    return next;
                                  })
                                }
                              />
                              <span>{t(option)}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))
                  )}
                  <div className="learning-modal-actions">
                    {simple
                      ? quizStep > 0 && (
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => setQuizStep((step) => step - 1)}
                          >
                            Anterior
                          </button>
                        )
                      : null}
                    <button
                      className="button button-primary"
                      disabled={
                        simple
                          ? quizAnswers[quizStep] === undefined
                          : !quiz.every(
                              (_, index) => quizAnswers[index] !== undefined,
                            )
                      }
                      onClick={() => {
                        if (simple && quizStep < quiz.length - 1)
                          setQuizStep((step) => step + 1);
                        else setQuizSubmitted(true);
                      }}
                    >
                      {simple && quizStep < quiz.length - 1
                        ? "Siguiente pregunta"
                        : "Revisar respuestas"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`learning-quiz-score ${quizReady ? "good" : "try"}`}
                    role="status"
                  >
                    <strong>{t("{score} de 3 correctas", { score: quizScore })}</strong>
                    <span>
                      {quizReady
                        ? "¡Excelente criterio digital!"
                        : "Repasa los consejos y vuelve a intentarlo."}
                    </span>
                  </div>
                  <div className="learning-explanations">
                    {quiz.map((question, index) => (
                      <div
                        key={question.prompt}
                        className={
                          quizAnswers[index] === question.answer
                            ? "correct"
                            : "incorrect"
                        }
                      >
                        <span>
                          {quizAnswers[index] === question.answer ? (
                            <Check size={15} />
                          ) : (
                            <CircleHelp size={15} />
                          )}
                        </span>
                        <p>
                          <strong>{t("Pregunta {count}", { count: index + 1 })}</strong>
                          {t(question.why)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="learning-modal-actions">
                    {quizReady ? (
                      <button
                        className="button button-primary"
                        onClick={() => finishMission(mission)}
                      >
                        Completar y recibir recompensa <ArrowRight size={17} />
                      </button>
                    ) : (
                      <button
                        className="button button-secondary"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers([]);
                        }}
                      >
                        Intentar otra vez <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <IslandGame key={`${wallet.id}:${gameRun}`} wallet={wallet} simple={simple}
                disabled={!store.persistence.writable} onComplete={handleGameComplete} onReset={handleGameReset} />
              {gameReady && renderGameReward(mission, isDone)}
            </>
          )}
        </div>
      </Modal>
    );
  };

  return translateTree((
    <section className="learning-page" aria-labelledby="learning-title">
      <div className="learning-hero">
        <div className="learning-hero-copy">
          <span className="learning-eyebrow">B R O T E · ZONA DE PRÁCTICA</span>
          <h2 id="learning-title">Misiones para tu vida real</h2>
          <p>
            Practica decisiones cotidianas a tu ritmo. Cada misión enseña algo
            útil y celebra lo que vas aprendiendo.
          </p>
        </div>
        <div className="learning-level-card">
          <div className="learning-level-top">
            <span className="learning-level-icon">
              <Sparkles size={19} />
            </span>
            <div>
              <span className="learning-muted">TU PROGRESO</span>
              <strong>{t("Nivel {level}", { level })}</strong>
            </div>
            <span className="learning-xp-total">{xp} XP</span>
          </div>
          <div
            className="learning-progress-track"
            role="progressbar"
            aria-label="Progreso al siguiente nivel"
            aria-valuenow={levelProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${levelProgress}%` }} />
          </div>
          <div className="learning-level-foot">
            <span>{levelProgress} / 100 XP</span>
            <span>
              {t("{count} XP para nivel {level}", { count: 100 - levelProgress, level: level + 1 })}
            </span>
          </div>
        </div>
        <div className="learning-leaf learning-leaf-one" aria-hidden="true">
          ✦
        </div>
        <div className="learning-leaf learning-leaf-two" aria-hidden="true">
          ✿
        </div>
      </div>
      <div className="learning-section-head">
        <div>
          <span className="learning-eyebrow">TU CAMINO DE APRENDIZAJE</span>
          <h2>Misiones para explorar</h2>
          <p>Sin prisa: elige una misión cuando tengas ganas de practicar.</p>
        </div>
        <div className="learning-completion-pill">
          <Award size={17} />
          <strong>
            {
              completed.filter((id) => missions.some((item) => item.id === id))
                .length
            }{" "}
            de 3
          </strong>
          <span>completadas</span>
        </div>
      </div>
      {wallet.paused && (
        <div className="learning-pause-banner" role="status">
          <LockKeyhole size={18} />
          <span>
            <strong>Aprendizaje en pausa.</strong> Las misiones y recompensas
            están desactivadas para este perfil.
          </span>
        </div>
      )}
      <div className="learning-mission-grid arcade-mission-grid">
        {[missions[0], missions[2], missions[1]].map((item, index) => {
          const Icon = item.icon;
          const isDone = completed.includes(item.id);
          return (
            <article
              className={`learning-card learning-card-${item.tone} ${item.id === "spot-the-scam" ? "arcade-extra" : "arcade-main-card"} ${isDone ? "is-complete" : ""}`}
              key={item.id}
            >
              {item.id !== "spot-the-scam" && <div className="arcade-card-art" aria-hidden="true">
                <img src={item.id === "market-adventure" ? "/games/market-scene.svg" : "/games/island-scene.svg"} alt="" />
                <span>{t("JUEGO INTERACTIVO")}</span>
              </div>}
              <div className="learning-card-top">
                <span className={`learning-icon learning-icon-${item.tone}`}>
                  <Icon size={22} />
                </span>
                <span className="learning-mission-step">
                  {t("MISIÓN 0{count}", { count: index + 1 })}
                </span>
                {isDone && (
                  <span className="learning-done-label">
                    <Check size={13} /> Lista
                  </span>
                )}
              </div>
              <p className="learning-eyebrow">{item.eyebrow}</p>
          <h3>{t(item.title)}</h3>
              <p className="learning-card-lesson">{t(item.lesson)}</p>
              <div className="learning-card-meta">
                <span>
                  <Star size={14} />
                  {t(item.difficulty)}
                </span>
                <span>
                  <Clock3 size={14} />
                  {item.minutes} min
                </span>
              </div>
              <div className="learning-card-bottom">
                <div>
                  <span className="learning-reward-label">AL COMPLETAR</span>
                  <strong>
                    <Sparkles size={15} /> {item.xp} XP <i>·</i> {item.reward}{" "}
                    Brotes
                  </strong>
                </div>
                <button
                  className={`learning-start-button ${isDone ? "done" : ""}`}
                  type="button"
                  aria-label={t("{action} misión: {title}", { action: t(isDone && item.id === "spot-the-scam" ? "Ver" : "Jugar"), title: t(item.title) })}
                  onClick={() => openMission(item.id)}
                  disabled={wallet.paused}
                >
                  <span className="sr-only">
                    {isDone ? "Ver misión completada" : "Comenzar misión"}:{" "}
                  </span>
                  {isDone && item.id === "spot-the-scam" ? (
                    <>
                      <Check size={16} /> Completada
                    </>
                  ) : (
                    <>
                      {t(isDone ? "Jugar otra vez" : "Jugar")} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="learning-badges">
        <div className="learning-badge-heading">
          <span className="learning-badge-icon">
            <Award size={19} />
          </span>
          <div>
            <h2>Insignias de aprendizaje</h2>
            <p>Recuerdos de cada habilidad que practicas.</p>
          </div>
        </div>
        <div className="learning-badge-list">
          {[
            {
              id: "market-adventure",
              title: "Compra con intención",
              note: "Por cuidar tu presupuesto",
              icon: "🧺",
            },
            {
              id: "spot-the-scam",
              title: "Ojo digital",
              note: "Por proteger tus datos",
              icon: "🛡️",
            },
            {
              id: "goal-island",
              title: "Plan previsor",
              note: "Por practicar el ahorro",
              icon: "☂️",
            },
          ].map((badge) => (
            <div
              className={`learning-badge ${completed.includes(badge.id) ? "earned" : ""}`}
              key={badge.id}
            >
              <span className="learning-badge-emoji" aria-hidden="true">
                {badge.icon}
              </span>
              <span>
                  <strong>{t(badge.title)}</strong>
                  <small>{t(badge.note)}</small>
              </span>
              {completed.includes(badge.id) ? (
                <BadgeCheck size={17} />
              ) : (
                <span
                  className="learning-badge-locked"
                  aria-label="Aún por conseguir"
                >
                  <LockKeyhole size={13} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="learning-footer-note">
        <span>
          <Sparkles size={16} />
        </span>
        <p>
          Las recompensas son Brotes de práctica dentro de la app. No son dinero
          real ni cripto.
        </p>
        <button
          className="learning-note-help"
          type="button"
          onClick={() =>
            notify(
              "Las misiones son actividades educativas con saldos simulados. No cambian ningún saldo cripto.",
            )
          }
          aria-label="Más información sobre las recompensas"
        >
          <CircleHelp size={16} />
        </button>
      </div>
      {renderMission()}
    </section>
  ), t) as ReactNode;
}
