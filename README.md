🧠 StuddyBuddy – Pomodoro Timer App
- StuddyBuddy is a mobile timer app designed to help users boost focus using the Pomodoro technique.
- Users can manage tasks, customize work/break durations, and track their performance with detailed statistics.

🚀 Features
- ⏱️ Pomodoro Timer (default 25-5 cycle, customizable)
- ✅ Task Management (priority, completion, estimated pomodoros)
- 📊 Statistics (daily/weekly progress graphs)
- 👤 User Profile and Settings
- 🔐 Authentication (via Supabase)

🛠️ Tech Stack
- Frontend: React Native (Expo), TypeScript
- Backend: Supabase (Auth, DB, API)
- Data Storage: Supabase database

🧪 Setup and Running
⚠️ .env file is excluded from the repo for security.

- Clone the repo
````
git clone https://github.com/cordamigorn/StuddyBuddy.git
cd StuddyBuddy
````
- Install dependencies
````
npm install
````
- Create a .env file and add your Supabase credentials

- Start the project
````
npx expo start
````
📂 Folder Structure

src/
├── components/      # Reusable UI components (buttons, inputs, modals, etc.)
├── constants/       # App-wide constants and configuration values
├── context/         # React Context API for global state management
├── hooks/           # Custom React hooks for reusable logic
├── i18n/            # Internationalization setup and configuration
├── locales/         # Translation files for different languages
├── navigation/      # React Navigation setup and route definitions
├── screens/         # App screens (Home, Tasks, Stats, Profile, etc.)
├── services/        # API clients and Supabase service logic
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions and interfaces
App.tsx               # App entry point (outside of src folder)


🧩 Database
The app uses Supabase with the following tables:
- profiles
- tasks
- pomodoro_sessions
- settings


📌 Notes
- This project is currently under development
- .env file is kept private
- Statistics screen includes graphs
- The app aims for both personal use and technical growth
