# FitCheckr 👗✨

**Virtual Try-On Technology for Confident Online Shopping**

FitCheckr is an AI-powered virtual try-on application that allows users to see how clothing items will look on them before making a purchase. Using advanced Google Gemini AI technology, it provides realistic virtual fitting experiences that make online shopping more confident and fun.

![FitCheckr Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black) ![React](https://img.shields.io/badge/React-19.1.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC)

## � Live Application

**Production URL**: [https://fitcheckr.vercel.app](https://fitcheckr.vercel.app)

**Features:**

- ✅ AI Virtual Try-On
- ✅ Email Subscriptions for Chrome Extension Updates  
- ✅ Mobile-Responsive Design
- ✅ Social Media Sharing
- ✅ Download Results
- ✅ SEO Optimized
- ✅ PWA Ready

- **🤖 AI-Powered Virtual Try-On**: Advanced Google Gemini AI integration for realistic clothing visualization
- **📱 Responsive Design**: Beautiful, mobile-first interface that works on all devices  
- **⚡ Real-time Processing**: Fast image processing with loading states and progress indicators
- **🎨 Modern UI/UX**: Glassmorphism design with smooth animations and transitions
- **📤 Easy Upload**: Drag-and-drop file uploads for both user photos and clothing items
- **💾 Smart Caching**: Efficient image handling with preview generation
- **🔗 Social Sharing**: Built-in sharing for X (Twitter), Instagram, and Facebook
- **🔒 Privacy First**: Images are processed securely and never stored on servers
- **📥 Download Results**: Users can download their virtual try-on results
- **🌐 Chrome Extension Ready**: Coming soon Chrome extension for seamless shopping

## 🚀 Tech Stack

### Frontend

- **Next.js 15.5.3** - React framework with App Router and Turbopack
- **React 19.1.0** - Modern React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 3.4.17** - Utility-first CSS framework

### AI & Backend

- **Google Gemini AI** - Advanced multimodal AI for virtual try-on processing
- **Next.js API Routes** - Serverless backend functions
- **AbortController** - Request cancellation support

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/iteshxt/fitcheckr.git
   cd fitcheckr
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Upload Your Photo**: Add a clear, full-body photo of yourself
2. **Add Clothing Item**: Upload an image of the clothing you want to try on  
3. **Generate Try-On**: Click "Try On Now" and let AI work its magic
4. **Download & Share**: Save your results or share on social media

## 📁 Project Structure

```
fitcheckr/
├── src/
│   ├── app/
│   │   ├── api/try-on/          # Virtual try-on API endpoint
│   │   ├── chrome-extension/    # Chrome extension landing page
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main application
│   │   └── not-found.tsx        # 404 page
│   └── lib/
│       └── prompt.json          # AI prompts configuration
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── tailwind.config.js          # Tailwind configuration
├── next.config.ts              # Next.js configuration
└── tsconfig.json               # TypeScript configuration
```

## 🔧 API Endpoints

### POST `/api/try-on`

Virtual try-on processing endpoint

**Request Body:**

```json
{
  "userImage": "base64_encoded_user_photo",
  "articleImages": "base64_encoded_clothing_item"
}
```

**Response:**

```json
{
  "result": "base64_encoded_result_image"
}
```

## 🌍 Browser Support

- ✅ Chrome/Chromium (Recommended)
- ✅ Firefox
- ✅ Safari  
- ✅ Edge
- ✅ Mobile browsers

## 📱 Chrome Extension

A Chrome extension is in development to provide seamless virtual try-on directly on e-commerce websites. Sign up for notifications on the `/chrome-extension` page.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Itesh Tomar**

- Portfolio: [iteshxt.me](https://iteshxt.me/)
- Email: [iteshxt@gmail.com](mailto:iteshxt@gmail.com)  
- X (Twitter): [@iteshxt](https://twitter.com/iteshxt)

---

**Made with ❤️ by Itesh**
