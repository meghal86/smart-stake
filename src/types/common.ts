// Common type utilities to replace 'any'

export type UnknownRecord = Record<string, unknown>;
export type UnknownArray = unknown[];
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Database record types
export type DatabaseRecord = Record<string, unknown>;
export type SupabaseResponse<T = unknown> = {
  data: T | null;
  error: Error | null;
};

// Event and callback types
export type EventHandler<T = unknown> = (event: T) => void;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;
export type CallbackFunction<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;
