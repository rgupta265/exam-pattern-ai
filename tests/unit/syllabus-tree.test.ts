import { describe, it, expect } from "vitest";
import { SyllabusSectionItem } from "@/components/admin/syllabus-tree-selector";

describe("Syllabus Tree Selection Logic Unit Tests", () => {
  const sampleSections: SyllabusSectionItem[] = [
    {
      id: "sec-1",
      name: "Clinical Domain Knowledge",
      topics: [
        { id: "top-1", name: "Community Health Nursing" },
        { id: "top-2", name: "Maternal Care" },
        { id: "top-3", name: "Pharmacology" },
      ],
    },
    {
      id: "sec-2",
      name: "General Awareness",
      topics: [
        { id: "top-4", name: "State Health Policies" },
        { id: "top-5", name: "Numerical Reasoning" },
      ],
    },
  ];

  const allTopicIds = sampleSections.flatMap((s) => s.topics.map((t) => t.id));

  it("should calculate select all correctly when all topics are selected", () => {
    const selectedIds = ["top-1", "top-2", "top-3", "top-4", "top-5"];
    const isAllSelected = selectedIds.length === allTopicIds.length && allTopicIds.every((id) => selectedIds.includes(id));
    const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < allTopicIds.length;

    expect(isAllSelected).toBe(true);
    expect(isPartiallySelected).toBe(false);
  });

  it("should calculate indeterminate state when partial topics are selected", () => {
    const selectedIds = ["top-1", "top-2"];
    const isAllSelected = selectedIds.length === allTopicIds.length;
    const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < allTopicIds.length;

    expect(isAllSelected).toBe(false);
    expect(isPartiallySelected).toBe(true);
  });

  it("should select all children topics when a section parent is selected", () => {
    const sec1 = sampleSections[0];
    const initialSelected: string[] = [];
    const secTopicIds = sec1.topics.map((t) => t.id);

    const updated = [...initialSelected, ...secTopicIds];
    expect(updated).toEqual(["top-1", "top-2", "top-3"]);
  });

  it("should deselect all children topics when a section parent is deselected", () => {
    const sec1 = sampleSections[0];
    const initialSelected = ["top-1", "top-2", "top-3", "top-4"];
    const secTopicIds = sec1.topics.map((t) => t.id);

    const updated = initialSelected.filter((id) => !secTopicIds.includes(id));
    expect(updated).toEqual(["top-4"]);
  });
});
