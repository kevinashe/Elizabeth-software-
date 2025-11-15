import { create } from 'zustand';

export const useStore = create((set) => ({
  currentView: 'overview',
  projects: [],
  resources: [],
  team: [],

  setView: (view) => set({ currentView: view }),

  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),

  setResources: (resources) => set({ resources }),
  setTeam: (team) => set({ team }),
}));
