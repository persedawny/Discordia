const fs = require('fs');

export class FileReader {
    constructor() {
    }

    getAllFilesFromDirectory(path: string, extension?: string){
        let files = fs.readdirSync(path);

        if(extension) {
            files = files.filter(file => file.endsWith(extension));
        }
        
        return files;
    }
}