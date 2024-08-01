import * as dotenv from 'dotenv';
// Load the .env file (if not already loaded)
dotenv.config();

// Function to classify environment variables and convert their values to strings
function classifyAndConvertEnvVariables() {
  const definedVariables: Record<string, string> = {};
  const undefinedVariables: Record<string, string> = {};

  for (const key in process.env) {
    if (process.env.hasOwnProperty(key)) {
      const value = process.env[key];
      const stringValue = String(value);

      if (key !== 'FROM_ADDRESS' && key !== 'PRIVATE_KEY') {
        if (value !== '') {
          definedVariables[key] = value;
        } else {
          undefinedVariables[key] = value;
        }
      }
    }
  }

  return { defined: definedVariables, undefined: undefinedVariables };
}


// Call the function to classify and convert environment variables
const { defined, undefined: undefinedVariables } = classifyAndConvertEnvVariables();

// Convert the defined and undefined variables to the desired structure format
const definedEnvString = JSON.stringify(defined, null, 2);
const undefinedEnvString = JSON.stringify(undefinedVariables, null, 2);


console.log('Defined environment variables (excluding FROM_ADDRESS and PRIVATE_KEY):');
console.log(definedEnvString);

console.log('Undefined environment variables (excluding FROM_ADDRESS and PRIVATE_KEY):');
console.log(undefinedEnvString);



