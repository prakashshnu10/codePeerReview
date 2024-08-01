import { Connection } from 'typeorm'; // Import the appropriate database library
import logger from './logger';

export async function getConstantValue(
  dbConnection: Connection,
  name: string,
): Promise<number> {
  try {
    logger.info('getConstantValue');
    const constantValue = `select * FROM get_constant('${name}')`;
    const data = await dbConnection.query(constantValue);
    const value = data[0]?.id;
    return value;
  } catch (error) {
    logger.error('Error fetching email constant:', error);
    throw error;
  }
}
