// Names shared by the engine, its worker and reset(), kept in a tiny module so importing them loads nothing heavy.
export const MODEL_ID = 'Xenova/mobileclip_s0';
/** Cache Storage name for the face models (transformers.js keeps the image model in "transformers-cache") */
export const MODEL_CACHE = 'belluh-memory-models';
/** Key prefix of tesseract's language data in its IndexedDB store */
export const TESS_CACHE = 'belluh-memory-tess';
/** localStorage flag: Memory is on in this browser (photos picked elsewhere in the app also join the index) */
export const MEMORY_ON_FLAG = 'belluh.memory.on';
