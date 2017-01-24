
export class StorageService {
    constructor() {
        this.data = {};
    }
}

export const storageService = new StorageService();
export const storage = storageService.data;
