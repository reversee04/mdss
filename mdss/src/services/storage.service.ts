import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = join(process.cwd(), 'public', 'reports');
  }

  private async ensureDir() {
    try {
      await mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
    }
  }

  async saveFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    await this.ensureDir();
    const filePath = join(this.baseDir, filename);
    await writeFile(filePath, file);
    // Return relative path accessible via web
    return `/reports/${filename}`;
  }
  
  async getFile(filename: string): Promise<Buffer> {
    const filePath = join(this.baseDir, filename);
    return readFile(filePath);
  }
  
  async deleteFile(filename: string): Promise<void> {
    const filePath = join(this.baseDir, filename);
    await unlink(filePath);
  }
}
