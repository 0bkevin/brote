import { useMemo, useState } from "react";
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
import type { StoreAPI, Wallet } from "../types";

type Props = {
  wallet: Wallet;
  store: StoreAPI;
  notify: (message: string) => void;
  simple?: boolean;
};
type MissionId = "smart-shop" | "spot-the-scam" | "rainy-day";
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
    id: "smart-shop",
    title: "La compra inteligente",
    eyebrow: "NECESIDADES Y DESEOS",
    lesson:
      "Arma una canasta que cubra lo importante sin pasarte del presupuesto.",
    difficulty: "Suave",
    minutes: 4,
    xp: 35,
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
    id: "rainy-day",
    title: "Un plan para imprevistos",
    eyebrow: "AHORRO PARA EMERGENCIAS",
    lesson:
      "Decide cómo repartir una cantidad de práctica entre hoy y el futuro.",
    difficulty: "Medio",
    minutes: 4,
    xp: 40,
    reward: 14,
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

const shopItems = [
  {
    id: "lunch",
    name: "Almuerzo para hoy",
    price: 7,
    kind: "Necesidad",
    detail: "Alimentación",
  },
  {
    id: "bus",
    name: "Pasaje de transporte",
    price: 4,
    kind: "Necesidad",
    detail: "Transporte",
  },
  {
    id: "notebook",
    name: "Cuaderno para clases",
    price: 5,
    kind: "Necesidad",
    detail: "Estudio",
  },
  {
    id: "sticker",
    name: "Calcomanías brillantes",
    price: 6,
    kind: "Deseo",
    detail: "Diversión",
  },
  {
    id: "treat",
    name: "Dulce extra",
    price: 4,
    kind: "Deseo",
    detail: "Antojo",
  },
];

const money = (value: number) => `${value} B`;

export default function Learning({
  wallet,
  store,
  notify,
  simple = false,
}: Props) {
  const [active, setActive] = useState<MissionId | null>(null);
  const [shopSelected, setShopSelected] = useState<string[]>([]);
  const [shopChecked, setShopChecked] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [speechMessage, setSpeechMessage] = useState("");
  const [allocations, setAllocations] = useState([10, 6, 4]);
  const [allocationChecked, setAllocationChecked] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const completed = wallet.completedMissions ?? [];
  const xp = Math.max(0, wallet.xp ?? 0);
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const mission = missions.find((item) => item.id === active);
  const shopTotal = useMemo(
    () =>
      shopItems
        .filter((item) => shopSelected.includes(item.id))
        .reduce((sum, item) => sum + item.price, 0),
    [shopSelected],
  );
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
      notify("El aprendizaje está en pausa para este perfil.");
      return;
    }
    setJustCompleted(false);
    resetMission();
    setActive(id);
  };
  const resetMission = () => {
    setShopSelected([]);
    setShopChecked(false);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizStep(0);
    setSpeechMessage("");
    setAllocations([10, 6, 4]);
    setAllocationChecked(false);
  };
  const finishMission = (item: Mission) => {
    if (wallet.paused) {
      notify("El perfil está en pausa. No se entregaron recompensas.");
      return;
    }
    if ((wallet.completedMissions ?? []).includes(item.id)) {
      notify("Esta misión ya fue completada.");
      closeMission();
      return;
    }
    try {
      store.completeMission(wallet.id, item.id, item.xp, item.reward);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "No pudimos guardar tu progreso.",
      );
      return;
    }
    notify(
      `¡Misión completada! +${item.xp} XP y ${item.reward} Brotes de práctica.`,
    );
    setJustCompleted(true);
  };

  const shopReady =
    shopChecked &&
    shopTotal <= 18 &&
    shopItems.filter(
      (item) => shopSelected.includes(item.id) && item.kind === "Necesidad",
    ).length >= 2;
  const quizReady = quizSubmitted && quizScore === quiz.length;
  const allocationReady =
    allocationChecked &&
    allocations[0] >= 4 &&
    allocations[1] >= 8 &&
    allocations[2] >= 2 &&
    allocations.reduce((a, b) => a + b, 0) === 20;
  const adjustAllocation = (index: number, amount: number) => {
    setAllocationChecked(false);
    setAllocations((current) =>
      current.map((value, i) =>
        i === index ? Math.max(0, Math.min(20, value + amount)) : value,
      ),
    );
  };
  const speakCurrentQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechMessage(
        "La lectura en voz alta no está disponible en este navegador.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const question = quiz[quizStep];
    const utterance = new SpeechSynthesisUtterance(
      `${question.prompt} ${question.options.map((option, index) => `Opción ${index + 1}: ${option}`).join(". ")}`,
    );
    utterance.lang = "es-VE";
    utterance.onstart = () => setSpeechMessage("Leyendo en voz alta…");
    utterance.onend = () => setSpeechMessage("Lectura terminada.");
    utterance.onerror = () =>
      setSpeechMessage("No se pudo iniciar la lectura en voz alta.");
    setSpeechMessage("Preparando lectura…");
    window.speechSynthesis.speak(utterance);
  };

  const renderMission = () => {
    if (!mission) return null;
    const isDone = completed.includes(mission.id);
    return (
      <Modal title={mission.title} onClose={closeMission}>
        <div className="learning-modal-content">
          <div className="learning-modal-intro">
            <span className={`learning-icon learning-icon-${mission.tone}`}>
              <mission.icon size={22} />
            </span>
            <div>
              <p className="learning-eyebrow">{mission.eyebrow}</p>
              <p className="learning-muted">
                Una práctica breve. Todo aquí es simulado.
              </p>
            </div>
          </div>
          {isDone || justCompleted ? (
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
                  ? `Sumaste ${mission.xp} XP y ${mission.reward} Brotes de práctica. Tu avance cuenta, paso a paso.`
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
          ) : mission.id === "smart-shop" ? (
            <div className="learning-game">
              <div className="learning-budget">
                <div>
                  <span>Presupuesto de práctica</span>
                  <strong>{money(18)}</strong>
                </div>
                <div>
                  <span>Tu canasta</span>
                  <strong className={shopTotal > 18 ? "is-over" : ""}>
                    {money(shopTotal)}
                  </strong>
                </div>
              </div>
              <p className="learning-instruction">
                {simple
                  ? "Elige primero lo que necesitas. Si alcanza, suma un gusto."
                  : "Elige lo que comprarías para cubrir las necesidades del día. Si queda espacio, puedes sumar un deseo."}
              </p>
              <div
                className="learning-choice-list"
                role="group"
                aria-label="Artículos para elegir"
              >
                {shopItems.map((item) => {
                  const selected = shopSelected.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`learning-choice ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => {
                        setShopChecked(false);
                        setShopSelected((current) =>
                          selected
                            ? current.filter((id) => id !== item.id)
                            : [...current, item.id],
                        );
                      }}
                    >
                      <span className="learning-check">
                        {selected && <Check size={15} />}
                      </span>
                      <span className="learning-choice-copy">
                        <strong>{item.name}</strong>
                        <small>
                          {item.kind} · {item.detail}
                        </small>
                      </span>
                      <b>{money(item.price)}</b>
                    </button>
                  );
                })}
              </div>
              {shopChecked && (
                <div
                  className={`learning-feedback ${shopReady ? "good" : "try"}`}
                  role="status"
                >
                  {shopReady
                    ? "¡Buen plan! Cubriste al menos dos necesidades y respetaste el presupuesto. Los deseos pueden esperar si son más importantes otras prioridades."
                    : shopTotal > 18
                      ? "Te pasaste del presupuesto. Prueba quitar algo y vuelve a revisar."
                      : "Elige al menos dos necesidades y mantén la canasta dentro del presupuesto. Luego puedes añadir un deseo si cabe."}
                </div>
              )}
              <div className="learning-modal-actions">
                {shopReady ? (
                  <button
                    className="button button-primary"
                    onClick={() => finishMission(mission)}
                  >
                    Completar y recibir recompensa <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    onClick={() => setShopChecked(true)}
                  >
                    Revisar mi canasta
                  </button>
                )}
              </div>
            </div>
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
                        Pregunta {quizStep + 1} de {quiz.length}
                      </div>
                      <fieldset
                        className="learning-question learning-question-simple"
                        key={quiz[quizStep].prompt}
                      >
                        <legend>
                          <span className="learning-question-number">
                            0{quizStep + 1}
                          </span>
                          {quiz[quizStep].prompt}
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
                              <span>{option}</span>
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
                          {question.prompt}
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
                              <span>{option}</span>
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
                    <strong>{quizScore} de 3 correctas</strong>
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
                          <strong>Pregunta {index + 1}</strong>
                          {question.why}
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
            <div className="learning-game">
              <div className="learning-allocation-summary">
                <span>
                  Reparte <strong>20 Brotes de práctica</strong> en este
                  escenario simulado.
                </span>
                <strong
                  className={
                    allocations.reduce((a, b) => a + b, 0) === 20
                      ? ""
                      : "is-over"
                  }
                >
                  {allocations.reduce((a, b) => a + b, 0)} / 20
                </strong>
              </div>
              <p className="learning-instruction">
                {simple
                  ? "Reparte los Brotes entre hoy, imprevistos y algo que disfrutas."
                  : "Piensa en las necesidades de hoy y también en un gasto inesperado que podría aparecer. No hay una única respuesta para la vida real."}
              </p>
              <div className="learning-allocations">
                {[
                  {
                    label: "Necesidades de hoy",
                    note: "Comida, transporte o materiales",
                    icon: "🌱",
                  },
                  {
                    label: "Fondo de imprevistos",
                    note: "Una reserva para gastos inesperados",
                    icon: "☂️",
                  },
                  {
                    label: "Algo que disfruto",
                    note: "Un gusto pequeño y planificado",
                    icon: "🍊",
                  },
                ].map((bucket, index) => (
                  <div className="learning-allocation" key={bucket.label}>
                    <span className="learning-bucket-emoji" aria-hidden="true">
                      {bucket.icon}
                    </span>
                    <div className="learning-bucket-name">
                      <strong>{bucket.label}</strong>
                      <small>{bucket.note}</small>
                    </div>
                    <div className="learning-stepper">
                      <button
                        type="button"
                        aria-label={`Quitar 1 de ${bucket.label}`}
                        disabled={allocations[index] === 0}
                        onClick={() => adjustAllocation(index, -1)}
                      >
                        −
                      </button>
                      <strong>{money(allocations[index])}</strong>
                      <button
                        type="button"
                        aria-label={`Añadir 1 a ${bucket.label}`}
                        disabled={allocations.reduce((a, b) => a + b, 0) >= 20}
                        onClick={() => adjustAllocation(index, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {allocationChecked && (
                <div
                  className={`learning-feedback ${allocationReady ? "good" : "try"}`}
                  role="status"
                >
                  {allocationReady
                    ? "Una reserva y un plan para hoy ayudan a dar opciones cuando algo cambia. En la vida real, la cantidad adecuada depende de tus necesidades y de lo que puedas ahorrar."
                    : allocations.reduce((a, b) => a + b, 0) !== 20
                      ? "Reparte exactamente los 20 Brotes entre las tres categorías."
                      : "Prueba cubrir las necesidades de hoy, reservar al menos 8 para imprevistos y dejar algo para disfrutar."}
                </div>
              )}
              <div className="learning-modal-actions">
                {allocationReady ? (
                  <button
                    className="button button-primary"
                    onClick={() => finishMission(mission)}
                  >
                    Completar y recibir recompensa <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    onClick={() => setAllocationChecked(true)}
                  >
                    Ver mi plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  return (
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
              <strong>Nivel {level}</strong>
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
              {100 - levelProgress} XP para nivel {level + 1}
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
      <div className="learning-mission-grid">
        {missions.map((item, index) => {
          const Icon = item.icon;
          const isDone = completed.includes(item.id);
          return (
            <article
              className={`learning-card learning-card-${item.tone} ${isDone ? "is-complete" : ""}`}
              key={item.id}
            >
              <div className="learning-card-top">
                <span className={`learning-icon learning-icon-${item.tone}`}>
                  <Icon size={22} />
                </span>
                <span className="learning-mission-step">
                  MISIÓN 0{index + 1}
                </span>
                {isDone && (
                  <span className="learning-done-label">
                    <Check size={13} /> Lista
                  </span>
                )}
              </div>
              <p className="learning-eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p className="learning-card-lesson">{item.lesson}</p>
              <div className="learning-card-meta">
                <span>
                  <Star size={14} />
                  {item.difficulty}
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
                  aria-label={`${isDone ? "Ver" : "Comenzar"} misión: ${item.title}`}
                  onClick={() => openMission(item.id)}
                  disabled={wallet.paused}
                >
                  <span className="sr-only">
                    {isDone ? "Ver misión completada" : "Comenzar misión"}:{" "}
                  </span>
                  {isDone ? (
                    <>
                      <Check size={16} /> Completada
                    </>
                  ) : (
                    <>
                      Empezar <ArrowRight size={16} />
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
              id: "smart-shop",
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
              id: "rainy-day",
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
                <strong>{badge.title}</strong>
                <small>{badge.note}</small>
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
  );
}
