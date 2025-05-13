// Interface for Video data structure
export interface Video {
    _id: string;
    title: string;
    description?: string;
    url: string;
    filePath?: string;
    isPublic: boolean;
    uploadedBy: {
        _id: string;
        username: string;
    };
    uploadedAt: Date;
} 