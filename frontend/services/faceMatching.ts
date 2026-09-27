import Human from "@/lib/human-browser";

export type FaceMatchStatus =
  | "MATCH"
  | "MISMATCH"
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "UNAVAILABLE";

const human = new Human({
  backend: "webgl",
  modelBasePath:
    "https://cdn.jsdelivr.net/npm/@vladmandic/human/models/",
  face: {
    enabled: true,
    detector: {
      maxDetected: 2,
      minConfidence: 0.6,
      rotation: true,
    },
    mesh: {
      enabled: true,
    },
    description: {
      enabled: true,
    },
  },
});

let initialized = false;

export async function initializeFaceMatcher() {
  if (initialized) return human;

  await human.load();
  await human.warmup();

  initialized = true;

  return human;
}

export async function getReferenceEmbedding(
  photoDataUrl: string
): Promise<number[] | null> {
  const engine = await initializeFaceMatcher();

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
  const engine = await initializeFaceMatcher();

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
    embedding
  );

  // Project/demo threshold. This is configurable and is not a
  // biometric/legal identity standard.
  const status: FaceMatchStatus =
    similarity >= 0.65 ? "MATCH" : "MISMATCH";

  return {
    status,
    similarity,
    faceDetected: true,
  };
}
