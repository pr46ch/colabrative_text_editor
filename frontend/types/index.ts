export type User = {
  userId: string;
  username: string;
  token: string;
};

export type Participant = {
  username: string;
  isOnline: boolean;
};

export type Meeting = {
  id: string;
  title: string;
  createdBy: string;
  lastEdited: string;
  participants: Participant[];
  text?: string;
  version?: number;
};

export type CreateMeetingInput = {
  title: string;
  invitedUsernames: string[];
};
