export interface SyncEvent {
  id: number;
  actor_id?: number;
  resource: string;
  action: string;
  path?: string;
  context?: Record<string, unknown>;
  created_at?: string;
}

export interface SyncEventDetail {
  events: SyncEvent[];
  resources: string[];
  paths: string[];
}

export const SYNC_EVENT_NAME = "careerbridge:sync";
