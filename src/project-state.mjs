import { createPromptModel } from './prompt-builder.mjs';

const fieldsByStep = {
  usage: ['topic', 'usage'],
  layout: ['layout'],
  design: ['design'],
  density: ['density'],
  details: ['mustInclude', 'other'],
  character: ['characterMode', 'characterEnabled', 'character'],
  adapter: ['adapter']
};

/** Restore only saved model fields that exist and have the expected type. */
export function restoreProjectModel(historyItem, projects = []) {
  const restored = createPromptModel();
  if (!historyItem || typeof historyItem !== 'object') return restored;

  const project = historyItem.id == null
    ? null
    : projects.find((item) => item?.id === historyItem.id);
  const sources = [historyItem, project, historyItem.model, project?.model]
    .filter((value) => value && typeof value === 'object' && !Array.isArray(value));

  for (const source of sources) {
    for (const [key, defaultValue] of Object.entries(createPromptModel())) {
      if (Object.hasOwn(source, key) && typeof source[key] === typeof defaultValue) {
        restored[key] = source[key];
      }
    }
  }
  return restored;
}

/** Create the JSON-safe snapshot stored with a saved project. */
export function snapshotProjectModel(model) {
  return JSON.parse(JSON.stringify(model));
}

/** Clear only the fields owned by the currently displayed editable step. */
export function clearStepModel(model, stepKey) {
  const next = { ...model };
  const defaults = createPromptModel();
  for (const key of fieldsByStep[stepKey] ?? []) next[key] = defaults[key];
  return next;
}
