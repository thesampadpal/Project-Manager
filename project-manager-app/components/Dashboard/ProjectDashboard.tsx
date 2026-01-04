'use client';

import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Project, Task } from '@/types';
import ProjectCard from './ProjectCard';
import NewProjectModal from './NewProjectModal';

interface ProjectDashboardProps {
  projects: Project[];
  allTasks: Task[];
  onSelectProject: (projectId: string) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectDashboard({
  projects,
  allTasks,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleSaveProject = async (project: Project) => {
    if (editingProject) {
      onUpdateProject(project.id, project);
    } else {
      await onAddProject(project);
      // Auto-open the new project
      onSelectProject(project.id);
    }
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    if (confirm(`Delete "${project.name}"? All tasks, todos, and notes in this project will be deleted.`)) {
      onDeleteProject(project.id);
    }
  };

  const getProjectTasks = (projectId: string) => {
    return allTasks.filter(t => t.projectId === projectId);
  };

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Projects</h1>
            <p className="text-text-secondary mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {projects.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
              <FolderOpen size={40} className="text-text-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">No projects yet</h2>
            <p className="text-text-secondary mb-6 max-w-sm">
              Create your first project to start organizing your tasks and ideas.
            </p>
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              <Plus size={20} />
              Create Project
            </button>
          </div>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={getProjectTasks(project.id)}
                onSelect={() => onSelectProject(project.id)}
                onEdit={() => handleEditProject(project)}
                onDelete={() => handleDeleteProject(project)}
              />
            ))}

            {/* Add new project card */}
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-text-secondary hover:text-text hover:border-accent/50 hover:bg-surface/50 transition-all min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                <Plus size={20} />
              </div>
              <span className="font-medium">Add Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        editProject={editingProject}
      />
    </div>
  );
}
