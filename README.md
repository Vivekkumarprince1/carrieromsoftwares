# Careers OmSoftwares

This repository contains a full-stack web application for managing careers, job applications, certificates, notifications, and more for OmSoftwares.

## Project Structure

- **backend/**: Node.js/Express REST API server
  - `api/`: Main API entry point
  - `assets/`: Images and certificates
  - `config/`: Configuration files (auth, database, cloudinary)
  - `Controllers/`: Business logic for applications, jobs, certificates, notifications, etc.
  - `middleware/`: Express middlewares
  - `models/`: Mongoose models for MongoDB
  - `Routes/`: Express route definitions
  - `services/`: Utility services (email, PDF, recaptcha, resume parsing)
  - `.env.example`: Example environment variables
  - `package.json`: Backend dependencies and scripts

- **frontend/**: React + Vite client application
  - `public/`: Static assets and images
  - `src/`: Source code
    - `components/`: Reusable React components (dashboard, certificates, notifications, etc.)
    - `config/`: Frontend configuration
    - `contexts/`: React context providers
    - `hooks/`: Custom React hooks
    - `pages/`: Main pages (Dashboard, Jobs, Applications, Certificates, etc.)
    - `services/`: API and notification services
    - `utils/`: Utility functions
  - `index.html`: Main HTML file
  - `package.json`: Frontend dependencies and scripts
  - `tailwind.config.js`, `postcss.config.js`: Styling configuration

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or cloud)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vivekkumarprince1/careers.omsoftwares.in.git
   cd careers.omsoftwares.in
   ```
2. **Backend setup:**
   - Copy `.env.example` to `.env` and fill in required values.
   - Install dependencies:
     ```bash
     cd backend
     npm install
     ```
   - Start backend server:
     ```bash
     npm start
     ```
3. **Frontend setup:**
   - Install dependencies:
     ```bash
     cd ../frontend
     npm install
     ```
   - Start frontend dev server:
     ```bash
     npm run dev
     ```

### Seed Data
- To seed initial data, run:
  ```bash
  node backend/seed.js
  ```

## Features
- User authentication (register, login, forgot password)
- Job listings and applications
- Certificate management and verification
- Offer letters and contracts
- Notifications system
- Admin dashboard
- Responsive UI with Tailwind CSS

## Deployment
- Vercel configuration files are included for both frontend and backend.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

## Contact
For questions or support, contact [OmSoftwares](https://www.omsoftwares.in/).
