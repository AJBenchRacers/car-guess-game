# Car Guessing Game Server

Backend server for the Car Guessing Game application.

## Deployment to Render.com

1. Sign up for a free account at [Render.com](https://render.com)

2. Create a new Web Service:
   - Click on "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository and the branch you want to deploy
   - Set the Root Directory to "server"
   - Set the Environment to "Node"
   - Set the Build Command to `npm install && npm run build`
   - Set the Start Command to `npm start`
   - Choose the Free plan
   - Click "Create Web Service"

3. Set up Environment Variables:
   - Click on your web service
   - Go to "Environment" tab
   - Add the following environment variables:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = `postgresql://neondb_owner:npg_IM8fRJQi6cjY@ep-broad-bar-a6sg8zw5-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require`
     - `PORT` = `10000` (Render uses this port by default)

4. Deploy:
   - Render will automatically build and deploy your application
   - Once deployed, your server will be available at a URL like `https://car-guess-game-server.onrender.com`

5. Update Frontend Config:
   - In your Vercel dashboard, add an environment variable:
     - `VITE_API_URL` = `https://your-render-url.onrender.com` (replace with your actual Render URL)
   - Redeploy your frontend

## Development

To run the server locally:

```bash
npm install
npm run dev
```

Your server will run at http://localhost:3000 by default. 