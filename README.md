# TaskFlow

A modern, full-stack task management application built with Next.js 16, designed to help you realize **Discipline, Focus, and Consistency** in your daily workflow.

![TaskFlow Banner](https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=400&fit=crop)

## ✨ Features

### Core Functionality
- **📋 Task Management** - Create, update, delete, and organize tasks with ease
- **📁 Smart Lists** - Organize tasks into custom lists (Work, Personal, Shopping, etc.)
- **⏰ Due Dates & Times** - Set precise deadlines with date and time reminders
- **🔄 Recurring Tasks** - Support for daily, weekly, monthly, and yearly repeating tasks
- **✅ Quick Actions** - Toggle completion, restore deleted tasks, and bulk operations
- **🔍 Smart Search** - Filter and search tasks across all lists

### User Experience
- **📱 Mobile-First Design** - Responsive interface optimized for mobile devices
- **🌙 Dark Mode** - Easy on the eyes with a beautiful dark theme
- **⚡ Real-time Updates** - Instant feedback on all actions
- **🎨 Intuitive UI** - Clean, modern interface with smooth animations

### Security & Authentication
- **🔐 JWT Authentication** - Secure token-based auth with refresh tokens
- **📧 Email Verification** - Verify email addresses for account security
- **🔑 Password Recovery** - Forgot password functionality with email reset
- **🛡️ Protected Routes** - API middleware ensures data privacy

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service for verification and recovery

### Development & Testing
- **Jest** - Unit testing framework
- **Cypress** - End-to-end testing
- **ESLint** - Code linting and standards
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/taskflow.git
   cd taskflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/taskflow
   
   # Authentication
   JWT_ACCESS_SECRET=your-access-secret-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Email (for verification and password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@taskflow.com
   
   # App
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating an Account
1. Click "Create Account" on the login page
2. Fill in your details (name, email, password)
3. Verify your email address via the link sent to your inbox
4. Log in with your credentials

### Managing Tasks
- **Create Task**: Click the "+" button or use Quick Add
- **Edit Task**: Tap on any task to open the detail view
- **Complete Task**: Toggle the checkbox next to a task
- **Delete Task**: Swipe or use the delete button (can be undone)
- **Organize**: Create lists and assign tasks to them

### Keyboard Shortcuts
- `Ctrl/Cmd + N` - New task
- `Ctrl/Cmd + F` - Search tasks
- `Escape` - Close modals

## 🧪 Testing

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run cypress:open  # Interactive mode
npm run cypress:run   # Headless mode
```

### Lint Code
```bash
npm run lint
```

## 📁 Project Structure

```
taskflow/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── tasks/
│   │   └── lists/
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to login)
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── task/             # Task-related components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── middlewares/          # API middleware
├── models/               # MongoDB models
├── services/             # API service layer
├── types/                # TypeScript types
└── utils/                # Helper utilities
```

## 🔒 Security Features

- **Password Hashing** - Bcrypt for secure password storage
- **JWT Tokens** - Short-lived access tokens with refresh mechanism
- **Email Verification** - Prevents fake accounts
- **Rate Limiting** - Protects against brute force attacks
- **CORS Protection** - Configured for production
- **Input Validation** - Zod schemas for all user inputs

## 🌐 Deployment

### Vercel (Recommended)
TaskFlow is optimized for deployment on [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/taskflow)

### Environment Variables for Production
Make sure to set all required environment variables in your hosting platform.

### MongoDB Atlas
For production, use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a managed database solution.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [MongoDB](https://www.mongodb.com/) - The Developer Data Platform
- [Tailwind CSS](https://tailwindcss.com/) - Rapidly build modern websites
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the existing documentation
- Contact the maintainers

## 🗺️ Roadmap

- [ ] Push notifications for task reminders
- [ ] Collaboration features (share lists with others)
- [ ] File attachments to tasks
- [ ] Tags and advanced filtering
- [ ] Calendar view for tasks
- [ ] Export tasks to CSV/PDF
- [ ] Mobile app (React Native)

---

**Built with ❤️ using Next.js and MongoDB**

*TaskFlow - Realize Discipline, Focus and Consistency*