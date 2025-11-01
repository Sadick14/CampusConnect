# Syntra 🎓

A comprehensive school management system built with Next.js, Firebase, and AI-powered reporting. Syntra helps educational institutions manage students, staff, attendance, grades, fees, and more—all in one modern, responsive platform.

## ✨ Features

### Core Modules
- **School & User Management**: Secure registration, licensing, and role-based access control (Super Admin, School Admin, Teacher, Student)
- **Student Management**: Complete student profiles with parent/guardian contact information
- **Staff Management**: Manage teaching and non-teaching staff
- **Attendance Tracking**: Daily attendance marking with bulk operations and detailed records
- **Grades & Assessments**: Comprehensive grade management with multiple assessment types
- **Fee Management**: Track fee collection, payment status, and generate receipts
- **Expenditure Tracking**: Monitor school expenses and generate financial reports
- **Timetable Creation**: Create and manage school timetables

### Advanced Features
- **AI Report Generation**: Generate end-of-term reports using Google's Gemini AI, incorporating attendance, grades, and teacher feedback
- **Offline Support**: PWA functionality with local storage and sync capabilities
- **Real-time Updates**: Firebase Firestore for real-time data synchronization
- **Responsive Design**: Mobile-first design that works on all devices
- **Role-Based Access**: Granular permissions for different user types

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project (free tier works great)
- Google AI API key (for AI report generation)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sadick14/CampusConnect.git
cd CampusConnect
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

Create a Firebase project at [Firebase Console](https://console.firebase.google.com/):
- Enable Authentication (Email/Password)
- Create a Firestore database
- Enable Storage for file uploads
- Copy your Firebase configuration

4. **Set up environment variables**

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# For AI Report Generation
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

5. **Create Super Admin User**

In Firebase Console, go to Authentication and manually create a user with:
- **UID**: `superadmin` (custom UID)
- **Email**: `superadmin@example.com`
- **Password**: Your secure password

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

### First Login

1. Log in with the superadmin credentials you created
2. Register your first school from the dashboard
3. Start adding students, staff, and managing your institution!

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (app)/             # Protected app routes
│   │   ├── attendance/    # Attendance management
│   │   ├── grades/        # Grade management
│   │   ├── students/      # Student management
│   │   ├── schools/       # School management
│   │   └── ...            # Other modules
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── students/         # Student-specific components
│   ├── layout/           # Layout components
│   └── ...
├── services/             # Firebase/API services
│   ├── student.ts        # Student operations
│   ├── attendance.ts     # Attendance operations
│   ├── grade.ts          # Grade operations
│   └── ...
├── contexts/             # React contexts
│   └── auth-context.tsx  # Authentication context
├── schemas/              # Zod validation schemas
├── lib/                  # Utility functions
│   ├── firebase.ts       # Firebase configuration
│   └── utils.ts          # Helper functions
└── ai/                   # AI/Genkit flows
    └── flows/
        └── generate-report.ts  # AI report generation
```

## 📚 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Storage**: [Firebase Storage](https://firebase.google.com/docs/storage)
- **AI**: [Google Genkit](https://firebase.google.com/docs/genkit) + Gemini
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: React Context + [TanStack Query](https://tanstack.com/query)

## 🔒 Security

### Firestore Security Rules

Set up these security rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isSuperAdmin() {
      return isSignedIn() && request.auth.uid == 'superadmin';
    }
    
    function isSchoolAdmin(schoolId) {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'school_admin' &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolId == schoolId;
    }
    
    // Schools collection
    match /schools/{schoolId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSuperAdmin() || isSchoolAdmin(schoolId);
      allow delete: if isSuperAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == userId || isSuperAdmin());
    }
    
    // Students, Attendance, Grades - accessible by school admins and teachers
    match /{collection}/{document=**} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin() || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['school_admin', 'teacher'];
    }
  }
}
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Firebase](https://firebase.google.com/)
- AI by [Google Gemini](https://deepmind.google/technologies/gemini/)

## 📧 Support

For support, email sadick14@example.com or open an issue in the repository.

---

Made with ❤️ for education
