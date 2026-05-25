# Codex instructions for this project

## General behavior

- Be careful with API keys and secrets.
- Never expose backend API keys in the Expo frontend.
- Do not commit `.env` files, API keys, secrets, `node_modules`, build folders, or temporary files.
- Prefer small, safe changes over big rewrites.
- Do not refactor unrelated code unless asked.

## Automatic checkpoint commits

- After roughly every 10 meaningful completed changes, create a local checkpoint commit automatically.
- Do not wait for the user to explicitly ask for the commit.
- Before committing, always run `git status`.
- Never stage or commit:
  - `.env`
  - API keys
  - secrets
  - `node_modules`
  - build folders
  - temporary files
- It is okay to commit `.env.example` files if they only contain placeholder variable names.
- Stage only relevant project files.
- Use a clear commit message summarizing the checkpoint.
- Do not push to remote unless the user explicitly says: "push".