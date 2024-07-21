document.addEventListener('DOMContentLoaded', (event) => {
  const fetchButton = document.getElementById('fetchButton');
  fetchButton.addEventListener('click', fetchPosts);
});

var PostPublishStatus;
(function (PostPublishStatus) {
    PostPublishStatus["DRAFT"] = "draft";
    PostPublishStatus["UNLISTED"] = "unlisted";
    PostPublishStatus["PUBLIC"] = "public";
})(PostPublishStatus || (PostPublishStatus = {}));
var PostContentFormat;
(function (PostContentFormat) {
    PostContentFormat["HTML"] = "html";
    PostContentFormat["MARKDOWN"] = "markdown";
})(PostContentFormat || (PostContentFormat = {}));
var PostLicense;
(function (PostLicense) {
    PostLicense["ALL_RIGHTS_RESERVED"] = "all-rights-reserved";
    PostLicense["CC_40_BY"] = "cc-40-by";
    PostLicense["CC_40_BY_ND"] = "cc-40-by-nd";
    PostLicense["CC_40_BY_SA"] = "cc-40-by-sa";
    PostLicense["CC_40_BY_NC"] = "cc-40-by-nc";
    PostLicense["CC_40_BY_NC_ND"] = "cc-40-by-nc-nd";
    PostLicense["CC_40_BY_NC_SA"] = "cc-40-by-nc-sa";
    PostLicense["CC_40_ZERO"] = "cc-40-zero";
    PostLicense["PUBLIC_DOMAIN"] = "public-domain";
})(PostLicense || (PostLicense = {}));


const DEFAULT_ERROR_CODE = -1;
const DEFAULT_TIMEOUT_MS = 5000;
const { MEDIUM_ACCESS_TOKEN, MEDIUM_POST_STATUS = PostPublishStatus.DRAFT, MEDIUM_POST_LICENSE = PostLicense.ALL_RIGHTS_RESERVED, } = process.env;
class MediumError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
class MediumClient {
    _accessToken;
    constructor(accessToken = MEDIUM_ACCESS_TOKEN) {
        this._accessToken = accessToken;
    }
    async getUser() {
        return this._makeRequest({
            method: 'GET',
            path: '/v1/me',
        });
    }
    async getPublicationsForUser(options) {
        this._enforce(options, ['userId']);
        return this._makeRequest({
            method: 'GET',
            path: `/v1/users/${options.userId}/publications`,
        });
    }
    async getContributorsForPublication(options) {
        this._enforce(options, ['publicationId']);
        return this._makeRequest({
            method: 'GET',
            path: `/v1/publications/${options.publicationId}/contributors`,
        });
    }
    async createPost({ title, content, userId, tags, canonicalUrl, license = MEDIUM_POST_LICENSE, publishedAt, publishStatus = MEDIUM_POST_STATUS, contentFormat = PostContentFormat.MARKDOWN, }) {
        if (!userId)
            ({ id: userId } = await this.getUser());
        return await this._createPost({
            canonicalUrl,
            content,
            contentFormat,
            license,
            publishedAt,
            publishStatus,
            tags,
            title,
            userId,
        });
    }
    async _createPost(options) {
        this._enforce(options, ['userId']);
        return this._makeRequest({
            method: 'POST',
            path: `/v1/users/${options.userId}/posts`,
            data: {
                canonicalUrl: options.canonicalUrl,
                content: options.content,
                contentFormat: options.contentFormat,
                license: options.license,
                publishedAt: options.publishedAt,
                publishStatus: options.publishStatus,
                tags: options.tags,
                title: options.title,
            },
        });
    }
    async createPostInPublication(options) {
        this._enforce(options, ['publicationId']);
        return this._makeRequest({
            method: 'POST',
            path: `/v1/publications/${options.publicationId}/posts`,
            data: {
                title: options.title,
                content: options.content,
                contentFormat: options.contentFormat,
                tags: options.tags,
                canonicalUrl: options.canonicalUrl,
                publishedAt: options.publishedAt,
                publishStatus: options.publishStatus,
                license: options.license,
            },
        });
    }
    _enforce(options, requiredKeys) {
        if (!options) {
            throw new MediumError('Parameters for this call are undefined', DEFAULT_ERROR_CODE);
        }
        requiredKeys.forEach((requiredKey) => {
            if (!options[requiredKey])
                throw new MediumError(`Missing required parameter "${requiredKey}"`, DEFAULT_ERROR_CODE);
        });
    }
    async _makeRequest(options) {
        const requestParams = {
            method: options.method,
            headers: {
                'Content-Type': options.contentType || 'application/json',
                Authorization: `Bearer ${this._accessToken}`,
                Accept: 'application/json',
                'Accept-Charset': 'utf-8',
            },
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        };
        if (options.data) {
            requestParams.body = JSON.stringify(options.data);
        }
        try {
            const response = await fetch(`https://api.medium.com${options.path}`, requestParams);
            const payload = await response.json();
            const statusType = Math.floor(response.status / 100);
            if (statusType === 4 || statusType === 5) {
                const err = payload.errors[0];
                throw new MediumError(err.message, err.code);
            }
            else if (statusType === 2) {
                return payload.data || payload;
            }
            else {
                throw new MediumError('Unexpected response', DEFAULT_ERROR_CODE);
            }
        }
        catch (err) {
            console.log(`Error: ${err}`);
            throw new MediumError(err.toString(), DEFAULT_ERROR_CODE);
        }
    }
    async getPosts(username) {
        let next = 0, allPosts = [], posts;
        while (next != null) {
            ({ posts, next } = await this._getPosts(username, next));
            allPosts.push(...posts);
        }
        return allPosts;
    }
    async getPostTitles(username) {
        let next = 0, allPosts = [], posts;
        while (next != null) {
            ({ posts, next } = await this._getPostTitles(username, next));
            allPosts.push(...posts);
        }
        return allPosts;
    }
    async _getPosts(username, page) {
        let graphqlBody = {
            operationName: 'UserStreamOverview',
            query: graphqlQuery,
            variables: {
                userId: username,
                pagingOptions: {
                    limit: pageLimit,
                    page: null,
                    source: null,
                    to: page ? String(page) : String(Date.now()),
                    ignoredIds: null,
                },
            },
        };
        let resp = await fetch('https://medium.com/_/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(graphqlBody),
        });
        let resp_data = await resp.json();
        let author = resp_data.data.user.name;
        let posts = resp_data.data.user.profileStreamConnection.stream
            .map((stream) => {
            return stream.itemType.post;
        })
            .map((post) => {
            return {
                id: post.id,
                title: post.title,
                link: post.mediumUrl,
                pubDate: post.firstPublishedAt,
                categories: post.tags.map((tag_obj) => tag_obj.id),
            };
        });
        const next = posts.length === pageLimit
            ? resp_data.data.user.profileStreamConnection
                .pagingInfo.next.to
            : null;
        return {
            author,
            posts,
            next,
        };
    }
    async _getPostTitles(username, page) {
        let graphqlBody = {
            operationName: 'UserStreamOverview',
            query: graphqlQueryMin,
            variables: {
                userId: username,
                pagingOptions: {
                    limit: pageLimit,
                    to: page ? String(page) : String(Date.now()),
                },
            },
        };
        let resp = await fetch('https://medium.com/_/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(graphqlBody),
        });
        let resp_data = await resp.json();
        let posts = resp_data.data.user.profileStreamConnection.stream
            .map((stream) => {
            return stream.itemType.post;
        })
            .map((post) => {
            return post.title;
        });
        const next = posts.length === pageLimit
            ? resp_data.data.user.profileStreamConnection
                .pagingInfo.next.to
            : null;
        return {
            posts,
            next,
        };
    }
}
const graphqlQuery = `
query UserStreamOverview($userId: ID!, $pagingOptions: PagingOptions) {
  user(username: $userId) {
    name
    profileStreamConnection(paging: $pagingOptions) {
      ...commonStreamConnection
      __typename
    }
    __typename
  }
}
fragment commonStreamConnection on StreamConnection {
  pagingInfo {
    next {
      limit
      page
      source
      to
      ignoredIds
      __typename
    }
    __typename
  }
  stream {
    ...StreamItemList_streamItem
    __typename
  }
  __typename
}
fragment StreamItemList_streamItem on StreamItem {
  ...StreamItem_streamItem
  __typename
}
fragment StreamItem_streamItem on StreamItem {
  itemType {
    __typename
    ... on StreamItemPostPreview {
        post {
            id
            mediumUrl
            title
            firstPublishedAt
            tags {
                id
            }
            __typename
        }
      __typename
    }
  }
  __typename
}
`;
const graphqlQueryMin = `
query UserStreamOverview($userId: ID!, $pagingOptions: PagingOptions) {
  user(username: $userId) {
    profileStreamConnection(paging: $pagingOptions) {
      ...commonStreamConnection
      __typename
    }
    __typename
  }
}
fragment commonStreamConnection on StreamConnection {
  pagingInfo {
    next {
      limit
      to
      __typename
    }
    __typename
  }
  stream {
    ...StreamItemList_streamItem
    __typename
  }
  __typename
}
fragment StreamItemList_streamItem on StreamItem {
  ...StreamItem_streamItem
  __typename
}
fragment StreamItem_streamItem on StreamItem {
  itemType {
    __typename
    ... on StreamItemPostPreview {
        post {
            title
            __typename
        }
      __typename
    }
  }
  __typename
}
`;
const pageLimit = 25;

const medium = new MediumClient('YOUR_ACCESS_TOKEN');

async function fetchPosts() {
  const username = document.getElementById('username').value;
  if (!username) {
      alert('Please enter a Medium username.');
      return;
  }

  try {
      const posts = await medium.getPosts(username);
      document.getElementById('posts').textContent = JSON.stringify(posts, null, 2);
  } catch (error) {
      console.error(`Error fetching posts: ${error}`);
      document.getElementById('posts').textContent = `Error: ${error.message}`;
  }
}
