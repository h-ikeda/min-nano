const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getStorage} = require("firebase-admin/storage");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

initializeApp();

exports.cleanInspectionApplicationStorage = functions.firestore
    .document("inspectionApplications/{applicationId}")
    .onDelete((change, context) => {
      const {applicationId} = context.params;
      const bucket = getStorage().bucket();
      bucket.deleteFiles({
        prefix: `inspectionApplications/${applicationId}/`,
      });
    });
