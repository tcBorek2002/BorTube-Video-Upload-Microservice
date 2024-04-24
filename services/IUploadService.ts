
export interface IUploadService {
    getUploadUrl(videoId: string, fileName: string): string;
}