import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import databaseConfig from './config/database.config';
config();
const dbConfig = databaseConfig();

export const AppDataSource = new DataSource({
  type: dbConfig.type as any,
  host: dbConfig.host,
  port: dbConfig.port as any,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: dbConfig.synchronize,
});
