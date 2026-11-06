export type ChapterStatus = 'ideia' | 'rascunho' | 'pronto';

export interface StoryChapter {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
}

export interface StoryEntity {
  id: string;
  name: string;
  role: string;
  description: string;
}

export interface StoryEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface StoryChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface StoryProject {
  title: string;
  system: string;
  genre: string;
  tone: string;
  premise: string;
  goal: string;
  updatedAt: string;
  chapters: StoryChapter[];
  characters: StoryEntity[];
  places: StoryEntity[];
  items: StoryEntity[];
  timeline: StoryEvent[];
  checklist: StoryChecklistItem[];
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createStoryProject = (): StoryProject => ({
  title: '',
  system: '',
  genre: '',
  tone: '',
  premise: '',
  goal: '',
  updatedAt: new Date().toISOString(),
  chapters: [{
    id: makeId(),
    title: '',
    summary: '',
    content: '',
    status: 'ideia',
  }],
  characters: [],
  places: [],
  items: [],
  timeline: [],
  checklist: defaultStoryChecklist(),
});

export const newId = makeId;

export const defaultStoryChecklist = (): StoryChecklistItem[] => [
  { id: makeId(), label: 'Definir a premissa', done: false },
  { id: makeId(), label: 'Escrever a primeira cena', done: false },
  { id: makeId(), label: 'Criar um personagem central', done: false },
  { id: makeId(), label: 'Criar um lugar memorável', done: false },
];

export const downloadStoryProject = (project: StoryProject) => {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'arcanum-campanha'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
