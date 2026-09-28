"use client";

let humanPromise: Promise<any> | null = null;

export default async function getHuman() {
  if (typeof window === "undefined") {
    throw new Error("Human can only be initialized in the browser.");
  }

  if (!humanPromise) {
    humanPromise = import(
      "../node_modules/@vladmandic/human/dist/human.esm.js"
    ).then((module) => {
      const Human = module.Human;

      return new Human({
        backend: "webgl",
        modelBasePath:
          "https://cdn.jsdelivr.net/npm/@vladmandic/human/models/",
        face: {
          enabled: true,
          detector: {
            maxDetected: 2,
            minConfidence: 0.4,
            minSize: 128,
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
    });
  }

  return humanPromise;
}