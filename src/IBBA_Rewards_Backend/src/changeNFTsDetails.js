const fs = require('fs');
const path = require('path');

// Define the directory where your JSON files are located
const directoryPath = './nftJson';

// Function to zero-pad a number to the specified length
function zeroPad(num, length) {
    const str = num.toString();
    return str.padStart(length, '0');
  }

  const nam = 'BRAZIL - SERRA DOS ORGAOS';
const des = `The Serra Dos Orgaos National Park in Brazil boasts a stunning mountainous landscape adorned with lush forests and impressive granite peaks. Adventure seekers and nature lovers will find themselves in awe of the park ́s beautv.`
  // Function to process a single JSON file
  function processJSONFile(filePath,id,i) {
    try {
      // Read the JSON file
      const rawData = fs.readFileSync(filePath);
      const jsonData = JSON.parse(rawData);
      const imageURI = `https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fimages%2F${i}.png?alt=media`;
  
      // Generate the new 'name' attribute
      const newName = `${nam} ${zeroPad(id, 4)}`;
  
      // Update the 'name' attribute
      jsonData.name = newName;
      jsonData.image = imageURI;
      jsonData.description = des;
  
      // Write the modified JSON back to the file
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  
      console.log(`Updated 'name' attribute in ${filePath}`);
    } catch (error) {
      console.error(`Error processing ${filePath}: ${error}`);
    }
  }

// Read the directory and process each JSON file
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  let id = 6;

    for(let i = 11006; i<11016; i++){
        const fileP = String(i)+'.json';
        console.log('fileP',fileP);
        const filePath = path.join(directoryPath, fileP);
        console.log('filePath',filePath);
        processJSONFile(filePath,id,i);
        id++;
    }

});