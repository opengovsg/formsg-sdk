"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var url = __importStar(require("url"));
var parser_1 = require("./util/parser");
var signature_1 = require("./util/signature");
var webhooks_1 = require("./util/webhooks");
var errors_1 = require("./errors");
var Webhooks = /** @class */ (function () {
    function Webhooks(_a) {
        var _this = this;
        var publicKey = _a.publicKey, secretKey = _a.secretKey;
        /**
         * Injects the webhook public key for authentication
         * @param header X-FormSG-Signature header
         * @param uri The endpoint that FormSG is POSTing to
         * @returns true if the header is verified
         * @throws {WebhookAuthenticateError} If the signature or uri cannot be verified
         */
        this.authenticate = function (header, uri) {
            // Parse the header
            var signatureHeader = parser_1.parseSignatureHeader(header);
            var signature = signatureHeader.v1, epoch = signatureHeader.t, submissionId = signatureHeader.s, formId = signatureHeader.f;
            // Verify signature authenticity
            if (!webhooks_1.isSignatureHeaderValid(uri, signatureHeader, _this.publicKey)) {
                throw new errors_1.WebhookAuthenticateError("Signature could not be verified for uri=" + uri + " submissionId=" + submissionId + " formId=" + formId + " epoch=" + epoch + " signature=" + signature);
            }
            // Verify epoch recency
            if (webhooks_1.hasEpochExpired(epoch)) {
                throw new errors_1.WebhookAuthenticateError("Signature is not recent for uri=" + uri + " submissionId=" + submissionId + " formId=" + formId + " epoch=" + epoch + " signature=" + signature);
            }
            // All checks pass.
            return true;
        };
        /**
         * Generates a signature based on the URI, submission ID and epoch timestamp.
         * @param params The parameters needed to generate the signature
         * @param params.uri Full URL of the request
         * @param params.submissionId Submission Mongo ObjectId saved to the database
         * @param params.epoch Number of milliseconds since Jan 1, 1970
         * @returns the generated signature
         * @throws {MissingSecretKeyError} if a secret key is not provided when instantiating this class
         * @throws {TypeError} if any parameters are undefined
         */
        this.generateSignature = function (_a) {
            var uri = _a.uri, submissionId = _a.submissionId, formId = _a.formId, epoch = _a.epoch;
            if (!_this.secretKey) {
                throw new errors_1.MissingSecretKeyError();
            }
            if (!submissionId || !uri || !formId || !epoch) {
                throw new TypeError('submissionId, uri, formId, or epoch must be provided to generate a webhook signature');
            }
            var baseString = url.parse(uri).href + "." + submissionId + "." + formId + "." + epoch;
            return signature_1.sign(baseString, _this.secretKey);
        };
        /**
         * Constructs the `X-FormSG-Signature` header
         * @param params The parameters needed to construct the header
         * @param params.epoch Epoch timestamp
         * @param params.submissionId Mongo ObjectId
         * @param params.formId Mongo ObjectId
         * @param params.signature A signature generated by the generateSignature() function
         * @returns The `X-FormSG-Signature` header
         * @throws {Error} if a secret key is not provided when instantiating this class
         */
        this.constructHeader = function (_a) {
            var epoch = _a.epoch, submissionId = _a.submissionId, formId = _a.formId, signature = _a.signature;
            if (!_this.secretKey) {
                throw new errors_1.MissingSecretKeyError();
            }
            return "t=" + epoch + ",s=" + submissionId + ",f=" + formId + ",v1=" + signature;
        };
        this.publicKey = publicKey;
        this.secretKey = secretKey;
    }
    return Webhooks;
}());
exports.default = Webhooks;
