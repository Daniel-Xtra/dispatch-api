import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  SERVICE_NAME: Joi.string().default('dispatch-api'),

  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().default('dispatch'),
  DATABASE_PASSWORD: Joi.string().default('dispatch'),
  DATABASE_NAME: Joi.string().default('dispatch'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  RABBITMQ_URL: Joi.string().default(
    'amqp://dispatch:dispatch@localhost:5672',
  ),
});
