import pino from 'pino'

const isTest = !!process.env.VITEST

export const logger = isTest
  ? pino({ level: 'silent' })
  : pino({
      level: process.env.LOG_LEVEL || 'info',
      redact: { paths: ['req.headers.cookie', 'req.headers.authorization'], remove: true },
      transport: { target: 'pino-pretty', options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' } },
    })
