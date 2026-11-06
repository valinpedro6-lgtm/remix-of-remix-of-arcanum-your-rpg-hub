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
});

export const newId = makeId;

export const downloadStoryProject = (project: StoryProject) => {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'arcanum-campanha'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
