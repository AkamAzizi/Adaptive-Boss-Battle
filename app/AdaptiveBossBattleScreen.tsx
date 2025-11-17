import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Topic = "JavaScript" | "React" | "TypeScript" | "Mobile Dev";
type Difficulty = "beginner" | "intermediate" | "advanced";
type GameState = "menu" | "playing" | "complete";
type BossPhase = 1 | 2 | 3;
type GameMode = "boss" | "speed" | "endless" | "suddenDeath" | "focusTopic";
type Confidence = 1 | 2 | 3; // 1 = low, 3 = high

interface QuestionBase {
  question: string;
  answers: string[];
  correct: number; // index in answers[]
  explanation: string;
}

interface Question extends QuestionBase {
  difficulty: Difficulty;
  topic: Topic;
  rating: number;
}

interface HistoryEntry extends Question {
  userAnswer: number; // -1 = timeout
  isCorrect: boolean;
  confidence: Confidence;
}

type TopicMastery = Record<Topic, number>;

const topics: Topic[] = ["JavaScript", "React", "TypeScript", "Mobile Dev"];

const INITIAL_MASTERY: TopicMastery = topics.reduce<TopicMastery>((acc, t) => {
  acc[t] = 1000;
  return acc;
}, {} as TopicMastery);

const getDifficultyFromMastery = (rating: number): Difficulty => {
  if (rating < 1100) return "beginner";
  if (rating < 1300) return "intermediate";
  return "advanced";
};

const bossReactions = {
  correct: [
    "Not bad, human. Let’s see if you can keep that up.",
    "You got lucky. Next one will be harder.",
    "Impressive. I might need to power up…",
  ],
  incorrect: [
    "You hesitated. Confidence matters as much as knowledge.",
    "Interesting mistake. Pay attention to the details.",
    "You rushed that one. Slow is smooth, smooth is fast.",
  ],
} as const;

const getRandom = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// --- Question bank by difficulty ---

const questionsByDifficulty: Record<Difficulty, QuestionBase[]> = {
  beginner: [
    {
      question: "What does JavaScript primarily run in for web apps?",
      answers: ["Browser runtime", "Database engine", "GPU only", "Excel"],
      correct: 0,
      explanation:
        "JavaScript usually runs in the browser or a JS runtime like Node.",
    },
    {
      question: "What is React mainly used for?",
      answers: [
        "Building user interfaces",
        "Styling with CSS only",
        "Managing databases",
        "Compiling TypeScript to C++",
      ],
      correct: 0,
      explanation:
        "React is a UI library focused on building component-based interfaces.",
    },
    {
      question: "What does TypeScript add on top of JavaScript?",
      answers: [
        "Static typing and tooling",
        "Better CSS support",
        "Database migrations",
        "Native device APIs",
      ],
      correct: 0,
      explanation:
        "TypeScript adds static types and tooling to catch bugs earlier.",
    },
    {
      question: "What is a key benefit of React Native for mobile dev?",
      answers: [
        "Shared codebase for iOS and Android",
        "No need to test",
        "Replaces app stores",
        "Only works offline",
      ],
      correct: 0,
      explanation:
        "React Native lets you share most UI code across mobile platforms.",
    },
    {
      question: "What is JSX in a React project?",
      answers: [
        "A syntax that lets you write UI using HTML-like code in JavaScript",
        "A database query language",
        "A CSS preprocessor",
        "A testing framework",
      ],
      correct: 0,
      explanation:
        "JSX is a syntax extension that lets you describe UI using HTML-like elements in JavaScript.",
    },
    {
      question: "What is a React component?",
      answers: [
        "A reusable piece of UI logic",
        "A database table",
        "A type of CSS selector",
        "A browser extension",
      ],
      correct: 0,
      explanation:
        "Components are reusable building blocks that define how parts of the UI look and behave.",
    },
    {
      question: "What are React props mainly used for?",
      answers: [
        "Passing data into components",
        "Styling components with CSS",
        "Managing server configuration",
        "Running database migrations",
      ],
      correct: 0,
      explanation:
        "Props are used to pass data and configuration down into components.",
    },
    {
      question: "What does React state represent?",
      answers: [
        "Data that can change over time and re-render the UI",
        "Project folder structure",
        "Static CSS styles",
        "Build configuration for Webpack",
      ],
      correct: 0,
      explanation:
        "State is mutable data that, when changed, triggers re-renders of the component.",
    },
    {
      question: "What is the purpose of useState in React?",
      answers: [
        "To add local state to a functional component",
        "To define routes in an app",
        "To style components",
        "To connect to a database",
      ],
      correct: 0,
      explanation:
        "The useState hook lets functional components hold and update local state.",
    },
    {
      question:
        "Which language do you typically use when writing React Native apps?",
      answers: ["JavaScript or TypeScript", "Java only", "C only", "Ruby only"],
      correct: 0,
      explanation:
        "React Native apps are usually written in JavaScript or TypeScript.",
    },
    {
      question: "What does 'cross-platform' mean in mobile development?",
      answers: [
        "The app runs on both iOS and Android from a shared codebase",
        "The app only runs on iOS",
        "The app only runs on Android",
        "The app only runs in a desktop browser",
      ],
      correct: 0,
      explanation:
        "Cross-platform means one shared codebase can target multiple platforms.",
    },
    {
      question: "Why is TypeScript useful in larger codebases?",
      answers: [
        "It catches type-related bugs before runtime",
        "It makes the app run without a browser",
        "It replaces the need for tests",
        "It only changes how CSS is written",
      ],
      correct: 0,
      explanation:
        "TypeScript can detect type issues during development, reducing bugs in larger projects.",
    },
    {
      question:
        "What is the main role of package.json in a JavaScript project?",
      answers: [
        "It defines dependencies and scripts for the project",
        "It stores compiled app binaries",
        "It defines all CSS styles",
        "It holds all environment variables by default",
      ],
      correct: 0,
      explanation:
        "package.json declares dependencies, scripts, and metadata for the project.",
    },
    {
      question: "What is npm (or yarn/pnpm) used for?",
      answers: [
        "Managing and installing project dependencies",
        "Running the mobile emulator",
        "Designing app icons",
        "Translating text",
      ],
      correct: 0,
      explanation:
        "npm, yarn, and pnpm are package managers for installing JavaScript dependencies.",
    },
    {
      question: "In React, what does 'component re-render' mean?",
      answers: [
        "React recalculates and redraws the component UI",
        "The browser restarts",
        "The database is reset",
        "The code is recompiled to C++",
      ],
      correct: 0,
      explanation:
        "A re-render means React calls the component again to update the UI based on new data.",
    },
    {
      question: "What is a common way to style components in React Native?",
      answers: [
        "Using the StyleSheet API or inline style objects",
        "Using direct HTML style tags",
        "Only using external CSS files",
        "Using SQL queries",
      ],
      correct: 0,
      explanation:
        "React Native uses the StyleSheet API and JS style objects for styling.",
    },
    {
      question: "What does 'hot reloading' or 'fast refresh' help with?",
      answers: [
        "Seeing code changes quickly without restarting the whole app",
        "Deploying the app to production",
        "Optimizing database indexes",
        "Removing TypeScript types",
      ],
      correct: 0,
      explanation:
        "Fast refresh lets you see UI changes quickly while you code, improving the feedback loop.",
    },
    {
      question: "What is Expo used for in React Native development?",
      answers: [
        "A toolkit that simplifies building, testing, and deploying React Native apps",
        "A database engine",
        "A CSS framework",
        "A TypeScript-only compiler",
      ],
      correct: 0,
      explanation:
        "Expo provides tooling and services that make it easier to build and ship React Native apps.",
    },
    {
      question: "What does 'responsive UI' generally mean?",
      answers: [
        "The UI adapts to different screen sizes and orientations",
        "The backend responds faster to requests",
        "The database is always online",
        "The app only works in portrait mode",
      ],
      correct: 0,
      explanation:
        "Responsive UI adjusts layout and elements to fit various screens and devices.",
    },
    {
      question: "What is a 'bug' in software development?",
      answers: [
        "An error or unintended behavior in the program",
        "A testing framework",
        "A design system",
        "A deployment script",
      ],
      correct: 0,
      explanation:
        "A bug is any flaw that causes the software to behave differently from what’s intended.",
    },
    {
      question: "Why is version control (like Git) important?",
      answers: [
        "It tracks changes to code and makes collaboration easier",
        "It automatically writes all your code",
        "It replaces the need for tests",
        "It only manages design files",
      ],
      correct: 0,
      explanation:
        "Version control helps you track changes, experiment safely, and collaborate with others.",
    },
    {
      question: "What is a 'commit' in Git?",
      answers: [
        "A saved snapshot of the code changes",
        "A production deployment",
        "A test suite",
        "A database migration",
      ],
      correct: 0,
      explanation:
        "A commit represents a snapshot of your changes with a message describing what you did.",
    },
    {
      question:
        "In a typical React project, what does index.tsx or index.js do?",
      answers: [
        "Bootstraps the app and renders the root component",
        "Defines the database schema",
        "Configures network routers",
        "Stores environment secrets",
      ],
      correct: 0,
      explanation:
        "index.tsx/js is usually the entry point that mounts the root React component.",
    },
    {
      question: "In React Native, what is a 'View'?",
      answers: [
        "A basic container component for layout and styling",
        "A database record",
        "A CSS style rule",
        "A network request",
      ],
      correct: 0,
      explanation:
        "View is a fundamental building block for layouts in React Native.",
    },
    {
      question: "What is a common way to handle user taps in React Native?",
      answers: [
        "Using TouchableOpacity or Pressable components",
        "Editing the DOM directly",
        "Running SQL queries on press",
        "Styling with :hover in CSS",
      ],
      correct: 0,
      explanation:
        "Components like TouchableOpacity or Pressable are used to handle taps and gestures.",
    },
  ],
  intermediate: [
    {
      question: "How can you avoid unnecessary re-renders in React?",
      answers: [
        "Using memoization (React.memo, useMemo, useCallback)",
        "Rewriting everything in vanilla JS",
        "Adding more setState calls",
        "Avoiding keys in lists",
      ],
      correct: 0,
      explanation:
        "Memoization helps React skip rendering when inputs don't change.",
    },
    {
      question:
        "In a React Native app, how do you keep lists fast with many rows?",
      answers: [
        "Use FlatList/SectionList with keyExtractor",
        "Render everything in a ScrollView",
        "Nest ScrollViews deeply",
        "Call alert() for each item",
      ],
      correct: 0,
      explanation:
        "FlatList and SectionList are optimized for large data sets.",
    },
    {
      question: "What’s a good way to structure API calls in a TypeScript app?",
      answers: [
        "Typed API client with shared DTO types",
        "Calling fetch() from every component randomly",
        "Hardcoding JSON strings everywhere",
        "Avoiding any error handling",
      ],
      correct: 0,
      explanation:
        "A typed API layer centralizes logic and catches errors at compile time.",
    },
    {
      question:
        "For mobile performance, what should you avoid on the JS main thread?",
      answers: [
        "Heavy synchronous computations",
        "UI updates",
        "Gesture handling",
        "Reading props",
      ],
      correct: 0,
      explanation:
        "Heavy sync work blocks UI; offload it to background / native modules.",
    },
  ],
  advanced: [
    {
      question:
        "You stream tokens from an LLM into a React Native chat UI. What's important?",
      answers: [
        "Chunked rendering and back-pressure handling",
        "Waiting for the full response before showing anything",
        "Blocking UI with while(true) loops",
        "Storing every token in AsyncStorage synchronously",
      ],
      correct: 0,
      explanation:
        "Streaming UIs need incremental rendering and careful handling of network back-pressure.",
    },
    {
      question:
        "How would you architect real-time collaboration in a React app?",
      answers: [
        "Event-driven with WebSockets, optimistic updates, and conflict resolution",
        "Purely polling every 30 seconds",
        "Single global mutable object with no versioning",
        "Reloading the page after every change",
      ],
      correct: 0,
      explanation:
        "Real-time collaboration benefits from event-driven design and conflict resolution.",
    },
    {
      question:
        "What’s a robust strategy for feature-flag driven UI experiments?",
      answers: [
        "Remote config + typed flag evaluation + analytics events",
        "Hardcoding if (Math.random()) branches",
        "Manually editing code in production",
        "Relying on console.log in prod only",
      ],
      correct: 0,
      explanation:
        "Feature flags with analytics let you safely run and measure experiments.",
    },
    {
      question:
        "How do you keep a React Native app responsive when consuming Kafka-backed streams?",
      answers: [
        "Aggregate and downsample on the backend, push concise events",
        "Send raw events directly to every device",
        "Do all aggregation in the render function",
        "Block JS thread until all messages are processed",
      ],
      correct: 0,
      explanation:
        "Push pre-aggregated data to the client to keep UI simple and fast.",
    },
  ],
};

// Shuffle answers and move correct index
const shuffleQuestion = (base: QuestionBase): QuestionBase => {
  const withFlags = base.answers.map((answer, index) => ({
    answer,
    isCorrect: index === base.correct,
  }));

  for (let i = withFlags.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [withFlags[i], withFlags[j]] = [withFlags[j], withFlags[i]];
  }

  const answers = withFlags.map((a) => a.answer);
  const correct = withFlags.findIndex((a) => a.isCorrect);

  return { ...base, answers, correct };
};

const QUESTION_TIME = 20; // seconds
const SPEED_MODE_QUESTIONS = 10;

const AdaptiveBossBattleScreen: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("boss");
  const [focusTopic, setFocusTopic] = useState<Topic | null>(null);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  const [questionHistory, setQuestionHistory] = useState<HistoryEntry[]>([]);
  const [progress, setProgress] = useState<number>(0);

  const [topicMastery, setTopicMastery] =
    useState<TopicMastery>(INITIAL_MASTERY);
  const [bossHealth, setBossHealth] = useState<number>(100);
  const [bossPhase, setBossPhase] = useState<BossPhase>(1);

  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );

  const generateAdaptiveQuestion = (): Question => {
    let chosenTopic: Topic;

    if (gameMode === "focusTopic" && focusTopic) {
      chosenTopic = focusTopic;
    } else {
      const weakestEntry = Object.entries(topicMastery).sort(
        (a, b) => a[1] - b[1]
      )[0];
      chosenTopic = weakestEntry[0] as Topic;
    }

    const rating = topicMastery[chosenTopic];
    const difficulty = getDifficultyFromMastery(rating);

    const pool = questionsByDifficulty[difficulty];
    const base = getRandom(pool);
    const shuffled = shuffleQuestion(base);

    return {
      ...shuffled,
      difficulty,
      topic: chosenTopic,
      rating,
    };
  };

  const resetState = () => {
    setScore(0);
    setStreak(0);
    setLevel(1);
    setQuestionHistory([]);
    setProgress(0);
    setBossHealth(100);
    setBossPhase(1);
    setTopicMastery(INITIAL_MASTERY);
    setSelectedAnswer(null);
    setPendingAnswer(null);
    setConfidence(null);
    setIsCorrect(null);
    setFeedback("");
    setCurrentQuestion(null);
    setTimeLeft(QUESTION_TIME);
    setQuestionStartTime(null);
  };

  const loadNextQuestion = () => {
    setSelectedAnswer(null);
    setPendingAnswer(null);
    setConfidence(null);
    setIsCorrect(null);
    setFeedback("");
    const newQuestion = generateAdaptiveQuestion();
    setCurrentQuestion(newQuestion);
    setTimeLeft(QUESTION_TIME);
    setQuestionStartTime(Date.now());
  };

  const startGame = () => {
    resetState();
    setGameState("playing");
    loadNextQuestion();
  };

  const updateBossPhase = (newHealth: number) => {
    if (newHealth <= 30) setBossPhase(3);
    else if (newHealth <= 70) setBossPhase(2);
    else setBossPhase(1);
  };

  const updateMastery = (topic: Topic, correct: boolean) => {
    setTopicMastery((prev) => {
      const current = prev[topic];
      const delta = correct ? 25 : -15;
      const next = Math.max(900, Math.min(1400, current + delta));
      return { ...prev, [topic]: next };
    });
  };

  const timerActive =
    gameMode === "boss" || gameMode === "speed" || gameMode === "suddenDeath";

  // Timer
  useEffect(() => {
    if (
      !timerActive ||
      gameState !== "playing" ||
      !currentQuestion ||
      selectedAnswer !== null
    ) {
      return;
    }

    if (timeLeft <= 0) {
      // Timeout: treat as wrong, low confidence
      handleAnswer(-1, 1);
      return;
    }

    const id = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, gameState, currentQuestion, selectedAnswer, timeLeft]);

  const getSpeedBonus = (): number => {
    if (!questionStartTime) return 0;
    const elapsedSec = (Date.now() - questionStartTime) / 1000;

    if (elapsedSec <= 6) return 60;
    if (elapsedSec <= 10) return 30;
    return 0;
  };

  const handleAnswer = (index: number, conf: Confidence) => {
    if (!currentQuestion || selectedAnswer !== null) return;

    const timedOut = index === -1;
    const chosenIndex = timedOut ? -1 : index;

    const correct = !timedOut && chosenIndex === currentQuestion.correct;
    setSelectedAnswer(chosenIndex);
    setIsCorrect(correct);

    let newScore = score;
    let newStreak = streak;
    let newBossHealth = bossHealth;

    if (correct) {
      const base = 100;
      const phaseMultiplier = gameMode === "boss" ? bossPhase : 1;
      const difficultyMultiplier =
        currentQuestion.difficulty === "beginner"
          ? 1
          : currentQuestion.difficulty === "intermediate"
          ? 1.5
          : 2;

      const accuracyMultiplier = conf === 3 ? 1.4 : conf === 2 ? 1.2 : 1.0;

      const speedBonus = getSpeedBonus();
      const raw = base * phaseMultiplier * difficultyMultiplier;
      const points = Math.round(raw * accuracyMultiplier + speedBonus);

      newScore = score + points;
      newStreak = streak + 1;

      if (gameMode === "boss") {
        const damage = 15 + bossPhase * 3;
        newBossHealth = Math.max(0, bossHealth - damage);
        setBossHealth(newBossHealth);
        updateBossPhase(newBossHealth);
      }

      setScore(newScore);
      setStreak(newStreak);

      const bonusText = speedBonus > 0 ? ` (Speed bonus +${speedBonus})` : "";

      setFeedback(
        `Excellent! +${points} points${bonusText}. ${getRandom(
          bossReactions.correct
        )}`
      );

      if ((streak + 1) % 3 === 0) {
        setLevel((prev) => prev + 1);
      }
    } else {
      newStreak = 0;
      setStreak(0);

      const reason = timedOut
        ? "Time's up on this one."
        : currentQuestion.explanation;

      // Wrong + high confidence gets punished harder
      const penalty = conf === 3 ? 25 : conf === 2 ? 15 : 5;

      const penaltyApplied = Math.min(score, penalty);
      setScore(score - penaltyApplied);

      setFeedback(
        `${reason}  •  ${getRandom(
          bossReactions.incorrect
        )} (−${penaltyApplied} points for overconfidence)`
      );
    }

    updateMastery(currentQuestion.topic, correct);

    const newHistory: HistoryEntry[] = [
      ...questionHistory,
      {
        ...currentQuestion,
        userAnswer: chosenIndex,
        isCorrect: correct,
        confidence: conf,
      },
    ];
    setQuestionHistory(newHistory);

    const newProgress = Math.min(100, progress + 20);
    setProgress(newProgress);

    const shouldComplete =
      (gameMode === "boss" && (newBossHealth <= 0 || newProgress >= 100)) ||
      (gameMode === "suddenDeath" && !correct) ||
      (gameMode === "speed" && newHistory.length >= SPEED_MODE_QUESTIONS) ||
      (gameMode === "focusTopic" && newProgress >= 100);

    setTimeout(() => {
      if (gameMode === "endless") {
        loadNextQuestion();
      } else if (shouldComplete) {
        setGameState("complete");
      } else {
        loadNextQuestion();
      }
    }, 1200);
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const colors: Record<Difficulty, string> = {
      beginner: "#6ee7b7",
      intermediate: "#fde68a",
      advanced: "#fca5a5",
    };
    return colors[difficulty] ?? "#e5e7eb";
  };

  const getBossPhaseLabel = (): string => {
    if (bossPhase === 1) return "Warming Up";
    if (bossPhase === 2) return "Powered Up";
    return "Final Phase";
  };

  const getBossEmoji = (): string => {
    if (bossHealth <= 0) return "😵";
    if (bossPhase === 3) return streak >= 2 ? "😠" : "😤";
    if (bossPhase === 2) return streak >= 2 ? "😈" : "😐";
    return streak >= 2 ? "🙂" : "😌";
  };

  const correctCount = questionHistory.filter((q) => q.isCorrect).length;
  const maxMastery = Math.max(...Object.values(topicMastery));

  // Confidence vs accuracy per topic
  const calibrationByTopic = topics.map((topic) => {
    const entries = questionHistory.filter((h) => h.topic === topic);
    if (!entries.length) {
      return { topic, avgConf: 0, accuracy: 0 };
    }
    const avgConf =
      entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;
    const accuracy = entries.filter((e) => e.isCorrect).length / entries.length;
    return { topic, avgConf, accuracy };
  });

  const showBossUI = gameMode === "boss";

  const getCoachLine = (): string => {
    if (gameState === "menu") {
      return "Pick a mode and I’ll push your weak spots.";
    }
    if (!questionHistory.length) {
      return "Let’s see what you already know.";
    }
    const last = questionHistory[questionHistory.length - 1];
    if (!last.isCorrect) {
      return "Nice try. I’ll stay on this topic a bit longer.";
    }
    if (streak >= 3) {
      return "🔥 You’re on a streak. I’m ramping difficulty up.";
    }
    if (timeLeft < QUESTION_TIME / 2) {
      return "Don’t rush, but don’t fall asleep either.";
    }
    return "Steady progress. Keep going.";
  };

  return (
    <LinearGradient
      colors={["#1e293b", "#111827", "#020617"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.statItem}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#fbbf24" }]}
                  >
                    <Feather name="award" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Score</Text>
                    <Text style={styles.statValue}>{score}</Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#3b82f6" }]}
                  >
                    <Feather name="zap" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Streak</Text>
                    <Text style={styles.statValue}>{streak}🔥</Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#8b5cf6" }]}
                  >
                    <Feather name="target" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Level</Text>
                    <Text style={styles.statValue}>{level}</Text>
                  </View>
                </View>
              </View>

              {gameState !== "menu" && (
                <>
                  {showBossUI && (
                    <View style={styles.bossRow}>
                      <View style={styles.bossAvatar}>
                        <Text style={styles.bossEmoji}>{getBossEmoji()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.progressLabel}>
                          Boss: Adaptive Engine · {getBossPhaseLabel()}
                        </Text>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${bossHealth}%`,
                                backgroundColor: "#f97373",
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {timerActive && (
                    <View style={styles.timerRow}>
                      <Text style={styles.progressLabel}>
                        Time left: {timeLeft}s
                      </Text>
                      <View style={styles.timerBarBg}>
                        <View
                          style={[
                            styles.timerBarFill,
                            {
                              width: `${(timeLeft / QUESTION_TIME) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </>
              )}

              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Session Progress</Text>
                  <Text style={styles.progressLabel}>{progress}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress}%`, backgroundColor: "#6366f1" },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* COACH BUBBLE */}
            <View style={styles.coachBubble}>
              <Text style={styles.coachTitle}>Nova · Adaptive Coach</Text>
              <Text style={styles.coachText}>{getCoachLine()}</Text>
            </View>

            {/* MENU */}
            {gameState === "menu" && (
              <View style={styles.card}>
                <View style={styles.bigIconBox}>
                  <Feather name="cpu" size={48} color="#fff" />
                </View>
                <Text style={styles.title}>Adaptive Boss Battle</Text>
                <Text style={styles.subtitle}>
                  Pick a game mode and battle an adaptive learning engine that
                  targets your weak spots.
                </Text>

                {/* Game mode selector */}
                <View style={styles.modeRow}>
                  {(
                    [
                      { id: "boss", label: "Boss Battle" },
                      { id: "speed", label: "Speed Run" },
                      { id: "endless", label: "Endless" },
                      { id: "suddenDeath", label: "Sudden Death" },
                      { id: "focusTopic", label: "Focus Topic" },
                    ] as { id: GameMode; label: string }[]
                  ).map((mode) => {
                    const active = gameMode === mode.id;
                    return (
                      <TouchableOpacity
                        key={mode.id}
                        style={[
                          styles.modeButton,
                          active && styles.modeButtonActive,
                        ]}
                        onPress={() => setGameMode(mode.id)}
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            active && styles.modeButtonTextActive,
                          ]}
                        >
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Focus topic selection */}
                {gameMode === "focusTopic" && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subtitleSecondary}>
                      Choose a topic to drill:
                    </Text>
                    <View style={styles.modeRow}>
                      {topics.map((t) => {
                        const active = focusTopic === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            style={[
                              styles.topicButton,
                              active && styles.topicButtonActive,
                            ]}
                            onPress={() => setFocusTopic(active ? null : t)}
                          >
                            <Text
                              style={[
                                styles.topicButtonText,
                                active && styles.topicButtonTextActive,
                              ]}
                            >
                              {t}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <Text style={[styles.subtitleSecondary, { marginTop: 12 }]}>
                  ⏱ Boss & Speed use timers. Sudden Death ends on your first
                  mistake. Focus Topic drills one area deeply.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    gameMode === "focusTopic" &&
                      !focusTopic && {
                        opacity: 0.4,
                      },
                  ]}
                  onPress={startGame}
                  disabled={gameMode === "focusTopic" && !focusTopic}
                >
                  <Feather name="play" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Start Game</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PLAYING */}
            {gameState === "playing" && currentQuestion && (
              <View style={styles.card}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "rgba(75, 192, 192, 0.15)" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: getDifficultyColor(currentQuestion.difficulty),
                        },
                      ]}
                    >
                      {currentQuestion.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "rgba(59,130,246,0.2)" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: "#93c5fd" }]}>
                      {currentQuestion.topic}
                    </Text>
                  </View>
                </View>

                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>

                {/* ANSWERS */}
                <View style={{ marginBottom: 16 }}>
                  {currentQuestion.answers.map((answer, index) => {
                    const isSelected = selectedAnswer === index;
                    const isPending = pendingAnswer === index;
                    const isCorrectAnswer = index === currentQuestion.correct;
                    const showResult = selectedAnswer !== null;

                    let borderColor = "rgba(255,255,255,0.2)";
                    let backgroundColor = "rgba(15,23,42,0.6)";

                    if (showResult) {
                      if (isSelected && isCorrect) {
                        borderColor = "#22c55e";
                        backgroundColor = "rgba(34,197,94,0.2)";
                      } else if (isSelected && !isCorrect) {
                        borderColor = "#ef4444";
                        backgroundColor = "rgba(239,68,68,0.2)";
                      } else if (isCorrectAnswer && !isCorrect) {
                        borderColor = "#22c55e";
                        backgroundColor = "rgba(34,197,94,0.2)";
                      }
                    } else if (isPending) {
                      borderColor = "#4f46e5";
                      backgroundColor = "rgba(79,70,229,0.25)";
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() =>
                          selectedAnswer === null && setPendingAnswer(index)
                        }
                        disabled={selectedAnswer !== null}
                        style={[
                          styles.answerButton,
                          {
                            borderColor,
                            backgroundColor,
                          },
                        ]}
                      >
                        <View style={styles.answerRow}>
                          <View style={styles.answerLabelCircle}>
                            <Text style={styles.answerLabel}>
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </View>
                          <Text style={styles.answerText}>{answer}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* CONFIDENCE PICKER */}
                {pendingAnswer !== null && selectedAnswer === null && (
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>
                      How confident are you?
                    </Text>
                    <View style={styles.confidenceButtons}>
                      {[1, 2, 3].map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.confidenceButton,
                            confidence === c && styles.confidenceButtonActive,
                          ]}
                          onPress={() => setConfidence(c as Confidence)}
                        >
                          <Text
                            style={[
                              styles.confidenceButtonText,
                              confidence === c &&
                                styles.confidenceButtonTextActive,
                            ]}
                          >
                            {c === 1 ? "Low" : c === 2 ? "Medium" : "High"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        !confidence && { opacity: 0.4 },
                      ]}
                      disabled={!confidence}
                      onPress={() => {
                        if (pendingAnswer !== null && confidence !== null) {
                          handleAnswer(pendingAnswer, confidence);
                        }
                      }}
                    >
                      <Feather name="check-circle" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Lock In</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {feedback ? (
                  <View
                    style={[
                      styles.feedbackBox,
                      {
                        borderColor: isCorrect ? "#22c55e" : "#3b82f6",
                        backgroundColor: isCorrect
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(59,130,246,0.2)",
                      },
                    ]}
                  >
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  </View>
                ) : null}

                {gameMode === "endless" && (
                  <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: 16 }]}
                    onPress={() => setGameState("complete")}
                  >
                    <Feather name="flag" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>End Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* COMPLETE */}
            {gameState === "complete" && (
              <View style={styles.card}>
                <View style={styles.bigIconBoxYellow}>
                  <Feather name="award" size={48} color="#fff" />
                </View>
                <Text style={styles.title}>Session Complete</Text>
                <Text style={styles.subtitle}>
                  Here’s your performance across modes, topics, and confidence.
                </Text>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Feather name="award" size={32} color="#fde68a" />
                    <Text style={styles.summaryValue}>{score}</Text>
                    <Text style={styles.summaryLabel}>Total Score</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Feather name="target" size={32} color="#6ee7b7" />
                    <Text style={styles.summaryValue}>
                      {correctCount}/{questionHistory.length || 1}
                    </Text>
                    <Text style={styles.summaryLabel}>Correct Answers</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Feather name="zap" size={32} color="#93c5fd" />
                    <Text style={styles.summaryValue}>{level}</Text>
                    <Text style={styles.summaryLabel}>Level Reached</Text>
                  </View>
                </View>

                {/* Topic mastery overview */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.subtitleSecondary, { marginBottom: 8 }]}>
                    Topic Mastery (session end)
                  </Text>
                  {topics.map((topic) => {
                    const value = topicMastery[topic];
                    const width =
                      maxMastery > 0 ? (value / maxMastery) * 100 : 0;
                    return (
                      <View key={topic} style={{ marginBottom: 6 }}>
                        <View style={styles.masteryRow}>
                          <Text style={styles.masteryLabel}>{topic}</Text>
                          <Text style={styles.masteryValue}>{value}</Text>
                        </View>
                        <View style={styles.masteryBarBg}>
                          <View
                            style={[
                              styles.masteryBarFill,
                              { width: `${width}%` },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Calibration */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.subtitleSecondary, { marginBottom: 8 }]}>
                    Confidence vs Accuracy
                  </Text>
                  {calibrationByTopic.map(({ topic, avgConf, accuracy }) => {
                    if (!questionHistory.length) return null;
                    const accPercent = Math.round(accuracy * 100);
                    const confPercent = Math.round((avgConf / 3) * 100);

                    let label = "🎯 Well calibrated";
                    if (accPercent + 10 < confPercent) {
                      label = "⚠️ Overconfident";
                    } else if (accPercent - 10 > confPercent) {
                      label = "😅 Underconfident";
                    }

                    return (
                      <View key={topic} style={{ marginBottom: 4 }}>
                        <Text style={styles.masteryLabel}>
                          {topic}: {accPercent}% correct, confidence ~{" "}
                          {avgConf.toFixed(1)}/3
                        </Text>
                        <Text style={styles.masteryValue}>{label}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Session path */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.subtitleSecondary, { marginBottom: 8 }]}>
                    Session Path
                  </Text>
                  {questionHistory.map((q, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: q.isCorrect ? "#22c55e" : "#ef4444",
                          marginRight: 8,
                        }}
                      />
                      <Text
                        style={{
                          color: "#e5e7eb",
                          fontSize: 12,
                        }}
                      >
                        Step {i + 1}: {q.topic} · {q.difficulty} ·{" "}
                        {q.isCorrect ? "✅" : "❌"}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setGameState("menu")}
                >
                  <Feather name="refresh-ccw" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Back to Menu</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  headerCard: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  iconBox: {
    padding: 10,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(226,232,240,0.7)",
    fontSize: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  bossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  bossAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15,23,42,0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.7)",
  },
  bossEmoji: {
    fontSize: 26,
  },
  timerRow: {
    marginBottom: 6,
  },
  timerBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.7)",
    overflow: "hidden",
    marginTop: 4,
  },
  timerBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#f97373",
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 12,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.8)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  coachBubble: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.7)",
    marginBottom: 8,
  },
  coachTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a5b4fc",
    marginBottom: 4,
  },
  coachText: {
    fontSize: 14,
    color: "#e5e7eb",
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.8)",
    marginTop: 8,
  },
  bigIconBox: {
    alignSelf: "center",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(79,70,229,0.9)",
    marginBottom: 16,
  },
  bigIconBoxYellow: {
    alignSelf: "center",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(245,158,11,0.9)",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(226,232,240,0.9)",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleSecondary: {
    fontSize: 14,
    color: "rgba(148,163,184,0.9)",
    textAlign: "center",
    marginBottom: 16,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.9)",
  },
  modeButtonActive: {
    backgroundColor: "rgba(79,70,229,0.9)",
    borderColor: "#4f46e5",
  },
  modeButtonText: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  modeButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  topicButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.7)",
  },
  topicButtonActive: {
    backgroundColor: "rgba(34,197,94,0.9)",
    borderColor: "#22c55e",
  },
  topicButtonText: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 12,
  },
  topicButtonTextActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  questionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  answerButton: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  answerLabelCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  answerLabel: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  answerText: {
    color: "#f9fafb",
    flexShrink: 1,
  },
  confidenceRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.5)",
  },
  confidenceLabel: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 13,
    marginBottom: 6,
  },
  confidenceButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  confidenceButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.9)",
  },
  confidenceButtonActive: {
    backgroundColor: "rgba(59,130,246,0.9)",
    borderColor: "#3b82f6",
  },
  confidenceButtonText: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 12,
  },
  confidenceButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  feedbackBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  feedbackText: {
    color: "#f9fafb",
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.8)",
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  summaryLabel: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 12,
  },
  masteryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  masteryLabel: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 12,
  },
  masteryValue: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 12,
  },
  masteryBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.7)",
    overflow: "hidden",
    marginTop: 2,
  },
  masteryBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },
  footerText: {
    color: "rgba(148,163,184,0.7)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});

export default AdaptiveBossBattleScreen;
