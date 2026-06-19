export class HttpError extends Error {
  constructor(public status: number, public body: unknown) {
    super(typeof body === 'object' && body && 'error' in body ? String((body as Record<string, unknown>).error) : 'HttpError')
  }
}
