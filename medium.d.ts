import { CreatePostRequest, Post, PostContentFormat, PostLicense, PostPublishStatus, PublishedPost, User } from './types';
declare class MediumError extends Error {
    code: number;
    constructor(message: string, code: number);
}
declare class MediumClient {
    private readonly _accessToken;
    constructor(accessToken?: string | undefined);
    getUser(): Promise<User>;
    getPublicationsForUser(options: {
        userId: string;
    }): Promise<any>;
    getContributorsForPublication(options: {
        publicationId: string;
    }): Promise<any>;
    createPost({ title, content, userId, tags, canonicalUrl, license, publishedAt, publishStatus, contentFormat, }: CreatePostRequest): Promise<Post>;
    private _createPost;
    createPostInPublication(options: {
        userId: string;
        publicationId: string;
        title: string;
        contentFormat: PostContentFormat;
        content: string;
        tags: string[];
        canonicalUrl: string;
        publishedAt?: string;
        publishStatus: PostPublishStatus;
        license: PostLicense;
    }): Promise<Post>;
    private _enforce;
    private _makeRequest;
    getPosts(username: string): Promise<PublishedPost[]>;
    getPostTitles(username: string): Promise<string[]>;
    private _getPosts;
    private _getPostTitles;
}
export { MediumClient, MediumError, PostPublishStatus, PostLicense, PostContentFormat, };
