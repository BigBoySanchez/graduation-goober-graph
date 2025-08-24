# 📝Notes


## Google Cloud Proof-of-Concept (POC) Mapping

- **Cloud Storage**: Data ingestion (store uploaded disaster/social data).
- **Cloud Functions**: Trigger parsing, pseudo-labeling (Gemini), or preprocessing pipelines.
- **Vertex AI**: Train and fine-tune SSL and domain adaptation models.
- **BigQuery**: Store and query labeled/unlabeled datasets; analytics for dashboards.
- **Firestore**: Track operations (e.g., status of parsing/labeling jobs).
- **Cloud Run**: Serve model APIs (classification endpoints, graph visualizations).
- **Firebase Hosting**: Host prototype frontends.
- **Cloud Monitoring & Secret Manager**: Enable logging, error tracking, and API key safety.

---

## POC App Demo

1. Ingest file → Parse into JSON → Store in BigQuery/Firestore.
2. Serve graph via API (Cloud Run).
3. Visualize graph on frontend (Hosted on Firebase).
4. Display basic analytics on dashboard (Made with [Lovable](https://lovable.dev/)).

---

## Google Cloud Console
- **Tutorials**: They even have one for deploying models w/ Vertex, which we may need later
- **API Library**: Provides a streamlined way to enable and monitor the tools needed for the project.
- **Sharing**: Can add multiple people to a project
- **Free Credits**: Got $300 just for a general free trial, got $1000 for using genAI in the project ([source]((https://github.com/BigBoySanchez/graduation-goober-graph/blob/main/cloud-notes/credits.png)))
- **DB Querying + Monitoring**: Can add / update entries on the fly, and EVERY event can be viewed in the "logs explorer"
- **Cloud Run**: Can upload a Docker image, connect a repo, or write functions that run on Google's servers (see [cloud-notes](https://github.com/BigBoySanchez/graduation-goober-graph/blob/main/cloud-notes))

NOTE: You can get functions to run on an event, like a file upload (see [function triggers](https://cloud.google.com/run/docs/function-triggers))
---

## Security & Operations Notes

- **API Protection**: Restrict CORS to frontend domain; add token-based or Firebase Auth.
- **File Validation**: Check file size/type to prevent abuse.
- **Rate Limiting**: Use Cloud Armor or similar tools in production.
- **File Management**: Use unique filenames to avoid overwrites.
- **Monitoring**: Track Cloud Run logs and set alerts for anomalies.

---

## Future Considerations

- Find a better way to detect DB updates (don't do what I did on [src/components/FileUpload.tsx:128](https://github.com/BigBoySanchez/graduation-goober-graph/blob/main/src/components/FileUpload.tsx#L128))
- For homemade model hosting:
    - Save the model file (.pt for pyTorch)
    - Make an API server around it
    - Containerize that server (using Docker)
    - Deploy on Vertex AI or Google Cloud Run
- Use [Firebase Tokens](https://cloud.google.com/run/docs/authenticating/end-users) for more secure API's
- Using Firebase to deploy makes all types of auth easier
- Use [secret manager](https://cloud.google.com/security/products/secret-manager) to secure API keys