export const APP_NAME = "Rhema" as const;
export const APP_DESCRIPTION = "Prepare e guarde seus esboços de discurso";
export const APP_SLUG = "rhema" as const;

export const OUTLINE_CATEGORIES = [
  "Discurso público",
  "Vida e Ministério",
  "Estudo d'A Sentinela",
  "Estudo de congregação",
  "Discurso de batismo",
  "Outro",
] as const;

export type OutlineCategory = (typeof OUTLINE_CATEGORIES)[number];
