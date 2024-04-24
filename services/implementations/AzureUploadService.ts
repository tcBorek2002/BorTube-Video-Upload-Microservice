import { IUploadService } from "../IUploadService";
import { BlobSASPermissions, BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";

export class AzureUploadService implements IUploadService {
    constructor() { }
    getUploadUrl(videoId: string, fileName: string): string {
        const azureStorageConnectionString = process.env.AZURESTORAGECONNECTIONSTRING;
        const azureStorageKey = process.env.AZURESTORAGEKEY;
        const azureStorageAccount = "storagebortube";
        const containerName = 'bortube-container';

        if (azureStorageConnectionString == undefined) {
            throw new Error("Azure Storage Connection String is not defined");
        }
        if (azureStorageKey == undefined) {
            throw new Error("Azure Storage Key is not defined");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);

        const sharedKeyCredential = new StorageSharedKeyCredential(azureStorageAccount, azureStorageKey);
        const client = blobServiceClient.getContainerClient(containerName)
        const blobName = videoId + "_" + fileName;
        const blobClient = client.getBlobClient(blobName);

        const blobSAS = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse("w"),
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
            sharedKeyCredential
        ).toString();

        const sasUrl = blobClient.url + "?" + blobSAS;
        console.log(sasUrl);

        return sasUrl;
    }


}
