// Delte typer + konstanter for sortskataloget. Adskilt fra
// src/actions/group-varieties.ts ('use server') fordi server-action-filer
// kun må eksportere async funktioner.

export type VarietyStatus = 'dyrker' | 'har_dyrket' | 'vil_dyrke' | 'har_froe' | 'soeger_froe'

export const VARIETY_STATUS_OPTIONS: { id: VarietyStatus; label: string; group: 'erfaring' | 'froe' }[] = [
  { id: 'dyrker',      label: 'Jeg dyrker den',          group: 'erfaring' },
  { id: 'har_dyrket',  label: 'Jeg har dyrket den før',  group: 'erfaring' },
  { id: 'vil_dyrke',   label: 'Jeg vil gerne dyrke den', group: 'erfaring' },
  { id: 'har_froe',    label: 'Jeg har frø til bytte',   group: 'froe' },
  { id: 'soeger_froe', label: 'Jeg søger frø',           group: 'froe' },
]

export const VARIETY_STATUS_LABEL: Record<VarietyStatus, string> = {
  dyrker: 'Dyrker',
  har_dyrket: 'Har dyrket',
  vil_dyrke: 'Vil dyrke',
  har_froe: 'Har frø',
  soeger_froe: 'Søger frø',
}
