import log4js from 'npm:log4js@6.9.1';

const level = Deno.env.get('LOG_LEVEL') || 'info';

log4js.configure({
  appenders: {
    stdout: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['stdout'], level },
    ai: { appenders: ['stdout'], level },
    model: { appenders: ['stdout'], level },
  },
});

export const getLogger = (category = 'ai') => log4js.getLogger(category);
export const aiLogger = getLogger('ai');
export const modelLogger = getLogger('model');
