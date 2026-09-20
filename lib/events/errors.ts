export class EventProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "configuration" | "upstream" | "invalid-response",
  ) {
    super(message);
    this.name = "EventProviderError";
  }
}
