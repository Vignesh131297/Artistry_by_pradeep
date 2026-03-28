# Artistry by Pradeep - Wedding Photography Website

A modern, responsive wedding photography website built with clean HTML, CSS, and JavaScript. The website has been refactored to follow good coding standards with separated concerns.

## 📁 Project Structure

```
wedding_website/
├── index.html                 # Main HTML file (clean and minimal)
├── css/
│   └── styles.css            # All styles separated from HTML
├── js/
│   └── main.js               # All JavaScript functionality
├── components/               # Modular HTML components
│   ├── header.html
│   ├── hero.html
│   ├── marquee.html
│   ├── about.html
│   ├── gallery.html
│   ├── services.html
│   ├── testimonials.html
│   ├── contact.html
│   └── footer.html
├── assets/                   # Images and static assets
├── google-apps-script.js     # Google Apps Script for review system
└── README.md                 # This file
```

## 🚀 Features

- **Responsive Design**: Works perfectly on all devices
- **Modern UI**: Clean, elegant design with smooth animations
- **Gallery Lightbox**: Interactive photo gallery with navigation
- **Contact Form**: Functional form with WhatsApp and email integration
- **Review System**: Google Forms + Google Sheets integration
- **Performance Optimized**: Lazy loading and optimized assets
- **Component-Based**: Modular structure for easy maintenance

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **Vanilla JavaScript**: No frameworks, pure JS
- **Google Apps Script**: Review management system
- **FormSubmit**: Form handling service

## 📋 Setup Instructions

### 1. Basic Setup
1. Clone or download this repository
2. Ensure all files are in the correct directory structure
3. Open `index.html` in a web browser

### 2. Review System Setup
The website includes a sophisticated review system:

1. **Create Google Form**:
   - Go to [forms.google.com](https://forms.google.com)
   - Create form with fields:
     - "Your Name" (Short answer)
     - "Star Rating" (Multiple choice: 1-5)
     - "Your Review" (Paragraph)
   - Link to Google Sheet (name tab: "Reviews")

2. **Setup Google Apps Script**:
   - Open the Google Sheet → Extensions → Apps Script
   - Copy contents of `google-apps-script.js`
   - Paste into the Apps Script editor
   - Add trigger: `onFormSubmit` → On form submit
   - Deploy as Web App → Anyone can access
   - Copy the Web App URL

3. **Update Configuration**:
   - In `js/main.js`, update these constants:
   ```javascript
   const GOOGLE_FORM_URL = "https://forms.google.com/YOUR_FORM_URL";
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ID/exec";
   ```

### 3. Contact Form Setup
1. Update the email in the contact form (line in `components/contact.html`):
   ```html
   <form action="https://formsubmit.co/your-email@gmail.com" method="POST">
   ```
2. Update WhatsApp number in `js/main.js`:
   ```javascript
   const waNumber = "9191XXXXXXXXX";
   ```

## 🎨 Customization

### Colors
Edit CSS variables in `css/styles.css`:
```css
:root{
  --orange:#e05424;        /* Primary color */
  --orange-dark:#c04418;    /* Dark variant */
  --black:#111010;          /* Text color */
  --charcoal:#f5f5f5;       /* Background */
  /* ... more variables */
}
```

### Fonts
The website uses Google Fonts:
- Cormorant Garamond (headings)
- Jost (body text)
- Dancing Script (decorative)

### Images
Replace images in the `assets/` folder:
- `logo.png` - Main logo
- `favicon-48x48.png` - Favicon
- Gallery images (1.jpg, 2.jpg, etc.)

## 🔧 Maintenance

### Adding New Gallery Images
1. Add new images to `assets/` folder
2. Add new gallery items in `components/gallery.html`:
```html
<div class="gallery-item gi-color-1" data-category="ceremony" onclick="openLightbox(0)">
  <img src="assets/new-image.jpg" alt="Description" loading="lazy"/>
  <div class="gallery-zoom">+</div>
</div>
```

### Updating Services
Edit `components/services.html` to modify packages and pricing.

### Updating Contact Info
Edit contact details in `components/contact.html`.

## 🌐 Deployment

### Static Hosting
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

### Local Development
- Use Live Server extension in VS Code
- Or any local HTTP server

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## ⚡ Performance Features

- Lazy loading for images
- Optimized CSS and JavaScript
- Minimal HTTP requests
- Smooth animations and transitions

## 🔒 Security Notes

- Form submissions use FormSubmit for security
- Google Apps Script handles review validation
- No sensitive data exposed in frontend

## 📞 Support

For issues or questions:
1. Check the console for JavaScript errors
2. Verify all file paths are correct
3. Ensure Google Apps Script is properly deployed
4. Test the review system with a test form submission

## 📄 License

This project is open source. Feel free to modify and use for your own wedding photography business.

---

**Note**: This website has been refactored from a single HTML file to follow modern web development best practices with separated concerns and modular components.