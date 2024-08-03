import { ConnectionOptions } from 'typeorm';
import { config } from 'dotenv';
config();

const OrmConfig: ConnectionOptions = {
  type: process.env.TYPE as 'mysql' | 'postgres' | 'sqlite',
  host: process.env.HOST,
  port: parseInt(process.env.PORT, 10),
  username: process.env.DBUSERNAME,
  password: process.env.DBPASSWORD,
  database: process.env.DATABASE,
  entities: [],
  synchronize: true,
};

export default OrmConfig;
