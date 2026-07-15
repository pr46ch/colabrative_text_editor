import { Meeting } from "@/types";

export const initialMeetings: Meeting[] = [
  {
    id: "product-roadmap",
    title: "Product Roadmap",
    createdBy: "maya",
    lastEdited: "Edited 8 min ago",
    participants: [
      { username: "maya", isOnline: true },
      { username: "jules", isOnline: true },
      { username: "nia", isOnline: false },
      { username: "owen", isOnline: true }
    ]
  },
  {
    id: "launch-copy",
    title: "Launch Copy Draft",
    createdBy: "jules",
    lastEdited: "Edited 34 min ago",
    participants: [
      { username: "jules", isOnline: true },
      { username: "sam", isOnline: false },
      { username: "maya", isOnline: true }
    ]
  },
  {
    id: "research-notes",
    title: "Research Notes",
    createdBy: "nia",
    lastEdited: "Edited yesterday",
    participants: [
      { username: "nia", isOnline: true },
      { username: "owen", isOnline: false },
      { username: "lee", isOnline: true }
    ]
  }
];
