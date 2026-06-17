# Deploying to Portainer (Git stack)

This deploys the app to a Linux Docker host managed by Portainer. Portainer
clones this repo onto the host and **builds the images itself** from the
Dockerfiles, then runs everything from a single compose file
(`docker-compose.portainer.yml`).

Only the `web` container is exposed on the host; the gateway, services, and
MongoDB stay on an internal Docker network. Mongo data persists in the
`mongo_data` named volume and survives reboots (`restart: unless-stopped`).

## Prerequisites

- A Linux box (x86_64) running Docker, added as an environment in Portainer.
- This repo pushed to a Git host the box can reach.
- A Git credential for the **private** repo: a Personal Access Token (GitHub:
  *Settings → Developer settings → Tokens*; with `repo`/read access) or a
  read-only deploy token.

## Create the stack

1. In Portainer: **Stacks → Add stack**.
2. **Name**: `sentence-practice` (lowercase; becomes the container name prefix).
3. **Build method**: choose **Git Repository**.
4. **Repository URL**: your repo's HTTPS clone URL.
5. **Repository reference**: e.g. `refs/heads/main`.
6. **Compose path**: `docker-compose.portainer.yml`  ← important, not the default.
7. **Authentication**: turn **ON**. Enter your Git username and paste the PAT /
   deploy token as the password.

## Environment variables

Add these in the stack's **Environment variables** section. Only the Mongo
password is required; the rest have safe defaults baked into the compose file.

| Variable                      | Required | Default          | Notes                                              |
|-------------------------------|----------|------------------|----------------------------------------------------|
| `MONGO_INITDB_ROOT_PASSWORD`  | **Yes**  | —                | Strong password. Deploy fails if unset.            |
| `MONGO_INITDB_ROOT_USERNAME`  | No       | `root`           | Mongo root user.                                   |
| `WEB_PORT`                    | No       | `8000`           | Host port the app is served on.                    |
| `SENTENCES_DB_NAME`           | No       | `sentences_db`   | Usually leave default.                             |
| `AUDIO_DB_NAME`               | No       | `audio_db`       | Usually leave default.                             |
| `MAX_AUDIO_BYTES`             | No       | `26214400` (25MB)| Max audio upload size.                             |

The Mongo connection URIs are built automatically from the username/password/db
names — you do **not** set them manually.

> If you ever change `MONGO_INITDB_ROOT_PASSWORD` after the first deploy, note
> that Mongo only initializes the root user on the **first** run against an empty
> `mongo_data` volume. Changing it later won't update the existing user unless
> you also remove the volume (which deletes data) or rotate the password inside
> Mongo.

## Deploy

Click **Deploy the stack**. The first deploy builds four images
(sentences, audio, gateway, web), so it takes a few minutes. When the containers
are healthy, open:

```
http://<box-ip>:8000        # or your WEB_PORT
```

## Updating after a code change

Push to your branch, then in Portainer open the stack and click
**Pull and redeploy** (rebuilds from the latest commit). Optionally enable
**Automatic updates** (polling or webhook) on the stack to redeploy on push.

## Troubleshooting

- **Deploy fails immediately with a `MONGO_INITDB_ROOT_PASSWORD` message** — you
  didn't set the required env var. Add it and redeploy.
- **Build fails cloning the repo** — check the Git URL, reference, and that the
  PAT/deploy token has read access.
- **App loads but `/api` calls fail** — check the `gateway`, `sentences`, and
  `audio` container logs in Portainer; confirm Mongo started and the password
  matches across the stack.
- **Port already in use** — set `WEB_PORT` to a free host port.
