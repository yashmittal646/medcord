import morgan from 'morgan';
import { ENV } from '../config/environment.js';

export const requestLogger = morgan(
  ENV.NODE_ENV === 'development'
    ? ':method :url :status :res[content-length] - :response-time ms'
    : 'combined'
);
