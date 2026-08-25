const sessions = {
  Speaking: {
    module: "Speaking",
    duration: "3 minutes",
    prompt: "Describe a skill you would like to learn. Explain why it interests you and how you would begin learning it.",
    focus: ["Fluency", "Vocabulary", "Clear structure"],
  },
  Writing: {
    module: "Writing",
    duration: "10 minutes",
    prompt: "Some people believe online learning is more effective than classroom learning. To what extent do you agree or disagree?",
    focus: ["Position", "Coherence", "Grammar range"],
  },
  Reading: {
    module: "Reading",
    duration: "6 minutes",
    prompt: "Read a short academic passage and complete five questions using skimming, scanning, and evidence matching.",
    focus: ["Main idea", "Evidence", "Time control"],
  },
  Listening: {
    module: "Listening",
    duration: "5 minutes",
    prompt: "Listen to a short university orientation extract and complete five note-completion questions.",
    focus: ["Prediction", "Spelling", "Detail"],
  },
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { module?: string };
    const moduleName = body.module as keyof typeof sessions;
    const session = sessions[moduleName];

    if (!session) {
      return Response.json({ error: "Unknown practice module." }, { status: 400 });
    }

    return Response.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
}
