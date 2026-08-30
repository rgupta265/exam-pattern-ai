"use client";

import { useEffect, useRef } from "react";
import { Layers } from "lucide-react";

export interface SyllabusSectionItem {
  id: string;
  name: string;
  code?: string | null;
  topics: {
    id: string;
    name: string;
    code?: string | null;
    weightagePercentage?: number | null;
  }[];
}

interface SyllabusTreeSelectorProps {
  sections: SyllabusSectionItem[];
  selectedTopicIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function SyllabusTreeSelector({
  sections,
  selectedTopicIds,
  onChange,
  disabled = false,
}: SyllabusTreeSelectorProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allTopicIds = sections.flatMap((s) => s.topics.map((t) => t.id));
  const totalTopics = allTopicIds.length;
  const selectedCount = selectedTopicIds.filter((id) => allTopicIds.includes(id)).length;

  const isAllSelected = totalTopics > 0 && selectedCount === totalTopics;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalTopics;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  const handleToggleSelectAll = () => {
    if (disabled) return;
    if (isAllSelected) {
      // Deselect all
      onChange([]);
    } else {
      // Select all
      onChange([...allTopicIds]);
    }
  };

  const handleToggleSection = (sec: SyllabusSectionItem) => {
    if (disabled) return;
    const secTopicIds = sec.topics.map((t) => t.id);
    const areAllSecTopicsSelected = secTopicIds.every((id) => selectedTopicIds.includes(id));

    if (areAllSecTopicsSelected) {
      // Remove all topics in this section
      onChange(selectedTopicIds.filter((id) => !secTopicIds.includes(id)));
    } else {
      // Add all missing topics from this section
      const toAdd = secTopicIds.filter((id) => !selectedTopicIds.includes(id));
      onChange([...selectedTopicIds, ...toAdd]);
    }
  };

  const handleToggleTopic = (topicId: string) => {
    if (disabled) return;
    if (selectedTopicIds.includes(topicId)) {
      onChange(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      onChange([...selectedTopicIds, topicId]);
    }
  };

  if (sections.length === 0 || totalTopics === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs text-center">
        No topics found in the verified syllabus for this exam version.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Select All Header */}
      <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-slate-900 dark:text-white">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            aria-label="Select All Syllabus Topics"
          />
          <span>Select All Syllabus Topics ({totalTopics})</span>
        </label>
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
          {selectedCount} / {totalTopics} Selected
        </span>
      </div>

      {/* Sections and Topics Tree */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto p-2">
        {sections.map((sec) => {
          const secTopicIds = sec.topics.map((t) => t.id);
          const secSelectedCount = secTopicIds.filter((id) => selectedTopicIds.includes(id)).length;
          const isSecAllSelected = sec.topics.length > 0 && secSelectedCount === sec.topics.length;
          const isSecPartiallySelected = secSelectedCount > 0 && secSelectedCount < sec.topics.length;

          return (
            <div key={sec.id} className="py-2 px-1">
              {/* Section Header Checkbox */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isSecAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSecPartiallySelected;
                    }}
                    onChange={() => handleToggleSection(sec)}
                    disabled={disabled}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                    aria-label={`Select Section ${sec.name}`}
                  />
                  <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{sec.name}</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">
                  {secSelectedCount}/{sec.topics.length}
                </span>
              </div>

              {/* Topics Nested List */}
              <div className="pl-6 pr-2 pt-1.5 space-y-1">
                {sec.topics.map((t) => {
                  const isChecked = selectedTopicIds.includes(t.id);

                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer select-none text-xs transition-colors ${
                        isChecked
                          ? "bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTopic(t.id)}
                          disabled={disabled}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          aria-label={`Select topic ${t.name}`}
                        />
                        <span>{t.name}</span>
                      </div>
                      {t.code && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {t.code}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
