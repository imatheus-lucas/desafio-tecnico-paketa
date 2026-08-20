import { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { ApplicationError } from '../application/errors'

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: 'Route not found',
  })
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Invalid request body',
      details: error.issues.map(issue => ({
        path: issue.path,
        message: issue.message,
      })),
    })
    return
  }

  if (error instanceof ApplicationError) {
    response.status(error.statusCode).json({
      error: error.message,
    })
    return
  }

  if (isMalformedJsonError(error)) {
    response.status(400).json({ error: 'Invalid JSON body' })
    return
  }

  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
  return
}

function isMalformedJsonError(error: unknown): error is SyntaxError {
  return error instanceof SyntaxError && 'body' in error
}
