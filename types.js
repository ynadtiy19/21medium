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
export { PostContentFormat, PostLicense, PostPublishStatus, };
