export class HttpErrorBase extends Error {

  public readonly statusCode: number;
  public readonly msg: string;

  constructor(statusCode: number, msg: string) {
    super(msg);
    this.statusCode = statusCode;
    this.msg = msg;
  }
}

export class NotFoundError extends HttpErrorBase {
  constructor(msg: string = '') {
    super(404, msg);
  }
}

export class UnauthorizedError extends HttpErrorBase {
  constructor(msg: string = '') {
    super(401, msg);
  }
}

export class InternalError extends HttpErrorBase {
  constructor(msg: string = '') {
    super(500, msg);
  }
}

export class BadRequest extends HttpErrorBase {
  constructor(msg: string = '') {
    super(400, msg);
  }
}
