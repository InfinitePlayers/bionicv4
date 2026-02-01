# Bionic Brand HD Toolkit V2

A high-fidelity web application designed for the rapid generation of brand-compliant assets.

## 🚀 Live Demo
Access the tool here: [https://infiniteplayers.github.io/bionic/](https://infiniteplayers.github.io/bionic/)

## 🌍 Hosting Guide

### Option 1: GitHub Pages (Recommended)
1. Ensure your GitHub Repository Name is exactly `bionic`. 
   - If it is different, update `base: '/bionic/'` in `vite.config.ts` to `base: '/your-repo-name/'`.
2. Go to Settings > Pages > Source and set to **"GitHub Actions"**.
3. Push to main. The site will be live at `username.github.io/bionic`.

### Option 2: Vercel / Netlify
1. Delete the `base` line in `vite.config.ts`.
2. Push to your repo.
3. Import the repo in Vercel. It will auto-detect Vite and deploy instantly.

## 🛠 Local Development
1. `npm install`
2. `npm run dev`

## 📄 License
MIT © 2024 Bionic HQ