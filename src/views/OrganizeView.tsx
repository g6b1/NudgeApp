import React from 'react';
import { QrCode } from 'lucide-react';
import { OrganizeSubTab, Routine } from '../types/nudge';
import { RoutinesManager } from './organize/RoutinesManager';
import { ChecklistsManager } from './organize/ChecklistsManager';
import { BackpacksManager } from './organize/BackpacksManager';
import {
  BrainDumpManager,
  PersonalGoalsManager,
  TemplatesLibrary,
  WeeklyResetView,
} from './organize/TemplatesAndGoals';
import { SharePayload } from '../components/QRShareImportModal';

interface OrganizeViewProps {
  subTab: OrganizeSubTab;
  onChangeSubTab: (tab: OrganizeSubTab) => void;
  onStartGuided: (routine: Routine) => void;
  onOpenQR: (payload: SharePayload | null) => void;
  onOpenAI: (mode: 'routine' | 'checklist' | 'backpack' | 'brain-dump', prompt?: string) => void;
}

const SUB_TABS: { id: OrganizeSubTab; label: string }[] = [
  { id: 'routines', label: 'Routines' },
  { id: 'checklists', label: 'Checklists' },
  { id: 'backpacks', label: 'Backpacks' },
  { id: 'templates', label: 'Templates' },
  { id: 'goals', label: 'Personal Goals' },
  { id: 'brain-dump', label: 'Brain Dump' },
  { id: 'weekly-reset', label: 'Weekly Reset' },
];

export const OrganizeView: React.FC<OrganizeViewProps> = ({
  subTab,
  onChangeSubTab,
  onStartGuided,
  onOpenQR,
  onOpenAI,
}) => {
  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-[var(--nudge-ink)]">
            Organize
          </h1>
          <p className="text-xs md:text-sm text-[var(--nudge-muted)] mt-0.5">
            Routines, checklists, backpacks, templates, and gentle goals
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenQR(null)}
          className="min-h-[42px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2 self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
          Import via QR
        </button>
      </header>

      <nav
        aria-label="Organize sections"
        className="flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeSubTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              subTab === t.id
                ? 'bg-[var(--nudge-accent)] text-white shadow-sm'
                : 'glass-panel text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'routines' && (
        <RoutinesManager
          onStartGuided={onStartGuided}
          onShareQR={(payload) => onOpenQR(payload)}
          onOpenAIRoutine={() => onOpenAI('routine')}
        />
      )}

      {subTab === 'checklists' && (
        <ChecklistsManager
          onShareQR={(payload) => onOpenQR(payload)}
          onOpenAIChecklist={() => onOpenAI('checklist')}
        />
      )}

      {subTab === 'backpacks' && (
        <BackpacksManager
          onShareQR={(payload) => onOpenQR(payload)}
          onOpenAIBackpack={() => onOpenAI('backpack')}
        />
      )}

      {subTab === 'templates' && <TemplatesLibrary />}

      {subTab === 'goals' && <PersonalGoalsManager />}

      {subTab === 'brain-dump' && (
        <BrainDumpManager onOpenAIParse={(text) => onOpenAI('brain-dump', text)} />
      )}

      {subTab === 'weekly-reset' && <WeeklyResetView />}
    </div>
  );
};
