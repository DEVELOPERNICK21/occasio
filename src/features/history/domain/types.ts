export type HistoryEntry = {
  id: string;
  userId: string;
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  recipientName: string;
  templateType: string;
  message: string;
  createdAt: string;
  expiresAt: string;
};

export type RecordHistoryInput = {
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  recipientName: string;
  templateType: string;
  message: string;
  expiresAt: string;
};
