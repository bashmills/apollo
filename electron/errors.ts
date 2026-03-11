export class RateLimitError extends Error {
  constructor(retryAfter?: number, message = "The rate limit has been exceeded") {
    super(message);
    this.name = RateLimitError.Name;
    this.retryAfter = retryAfter;
  }

  static Name = "RateLimitError";

  retryAfter?: number;
}

export class NotModifiedError extends Error {
  constructor(message = "The content has not been modified") {
    super(message);
    this.name = NotModifiedError.Name;
  }

  static Name = "NotModifiedError";
}

export class AbortError extends Error {
  constructor(message = "The operation was aborted") {
    super(message);
    this.name = AbortError.Name;
  }

  static Name = "AbortError";
}
