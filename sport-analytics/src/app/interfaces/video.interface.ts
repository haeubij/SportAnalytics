// Interface for Video data structure
export interface Video {
    _id: string;
    title: string;
    description?: string;
    url: string;
    filePath?: string;
    uploadedBy: {
        _id: string;
        username: string;
    };
    uploadedAt: Date;
} 