import getHuman from "@/lib/human-browser";

export type FaceMatchStatus =
  | "MATCH"
  | "MISMATCH"
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "UNAVAILABLE";

const MATCH_OPTIONS = {
  order: 2,
  multiplier: 25,
  min: 0.2,
  max: 0.8,
};

const MATCH_THRESHOLD = 0.5;

let humanPromise: ReturnType<typeof getHuman> | null = null;
let initialized = false;

async function getEngine() {
  if (!humanPromise) {
    humanPromise = getHuman();
  }

  const human = await humanPromise;

  if (!initialized) {
    await human.load();
    await human.warmup();
    initialized = true;
  }

  return human;
}

export async function initializeFaceMatcher() {
  return getEngine();
}

export async function getReferenceEmbedding(
  photoDataUrl: string
): Promise<number[] | null> {
  const engine = await getEngine();

  const image = new Image();
  image.src = photoDataUrl;

  await image.decode();

  const result = await engine.detect(image);

  if (result.face.length !== 1) {
    return null;
  }

  const embedding = result.face[0].embedding;

  if (!embedding) {
    return null;
  }

  return Array.from(embedding);
}

export async function compareVideoFace(
  video: HTMLVideoElement,
  referenceEmbedding: number[]
): Promise<{
  status: FaceMatchStatus;
  similarity: number | null;
  faceDetected: boolean;
}> {
  const engine = await getEngine();

  const result = await engine.detect(video);

  if (result.face.length === 0) {
    return {
      status: "NO_FACE",
      similarity: null,
      faceDetected: false,
    };
  }

  if (result.face.length > 1) {
    return {
      status: "MULTIPLE_FACES",
      similarity: null,
      faceDetected: true,
    };
  }

  const embedding = result.face[0].embedding;

  if (!embedding) {
    return {
      status: "UNAVAILABLE",
      similarity: null,
      faceDetected: true,
    };
  }

  const similarity = engine.match.similarity(
    referenceEmbedding,
    embedding,
    MATCH_OPTIONS
  );

  const status: FaceMatchStatus =
    similarity >= MATCH_THRESHOLD ? "MATCH" : "MISMATCH";

  return {
    status,
    similarity,
    faceDetected: true,
  };
}