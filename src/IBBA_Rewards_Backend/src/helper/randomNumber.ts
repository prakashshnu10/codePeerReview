import logger from './logger';

export function generateAlphanumeric(
  firstName: string,
  lastName: string,
): string {
  try {
    logger.info('generateAlphanumeric');
    const firstLetterOfLastName = lastName.charAt(0);
    const randomValue = Math.floor(Math.random() * 9000) + 1000; // Generate a random 4-digit number
    const fullName = `${firstName}${firstLetterOfLastName}${randomValue}`;
    const alphanumericString = fullName.replace(/\s+/g, '').toUpperCase();
    return alphanumericString;
  } catch (error) {
    logger.error('generateAlphanumeric::error', error);
    throw error;
  }
}
