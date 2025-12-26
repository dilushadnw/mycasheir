# 🚀 Deployment Guide

Complete guide for deploying Shop Cashier Pro to production.

## Pre-Deployment Checklist

### 1. Firebase Setup
- [ ] Firebase project created
- [ ] Billing enabled (Blaze plan for production)
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules configured
- [ ] Backup enabled

### 2. User Accounts
- [ ] Admin account created
- [ ] Cashier accounts created
- [ ] User roles assigned in Firestore
- [ ] Default passwords changed
- [ ] Test login for all accounts

### 3. Initial Data
- [ ] Settings document created (`settings/config`)
- [ ] Shop name configured
- [ ] Shop address configured
- [ ] Currency set correctly
- [ ] Sample products added for testing

### 4. Security
- [ ] Firebase security rules deployed
- [ ] Strong passwords enforced
- [ ] 2FA enabled on Firebase Console
- [ ] API key restrictions reviewed
- [ ] Backup strategy in place

## Deployment Methods

### Option 1: Firebase Hosting (Recommended)

Firebase Hosting provides SSL, CDN, and easy rollback.

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Initialize Firebase Hosting
```bash
cd /path/to/your/project
firebase init hosting
```

Select:
- Use existing project (your Firebase project)
- Public directory: `.` (current directory)
- Configure as single-page app: `No`
- Don't overwrite existing files

#### Step 4: Deploy
```bash
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

#### Benefits:
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Easy rollback
- ✅ Preview channels for testing

---

### Option 2: GitHub Pages

Free hosting for public repositories.

#### Step 1: Enable GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings
3. Navigate to Pages section
4. Select branch (usually `main`)
5. Select folder (`/root`)
6. Click Save

#### Step 2: Access Your Site
Your site will be available at:
`https://yourusername.github.io/repository-name/`

#### Step 3: Custom Domain (Optional)
1. Add `CNAME` file with your domain
2. Configure DNS at your domain registrar
3. Add custom domain in GitHub Pages settings

#### Benefits:
- ✅ Completely free
- ✅ Simple setup
- ✅ Good for demos and testing
- ✅ Automatic SSL

---

### Option 3: Netlify

Easy drag-and-drop deployment with great features.

#### Step 1: Sign Up
Create account at [netlify.com](https://www.netlify.com)

#### Step 2: Deploy
**Method A: Drag & Drop**
- Drag your project folder to Netlify dashboard
- Wait for deployment to complete

**Method B: Git Integration**
- Connect your GitHub repository
- Configure build settings (not needed for this project)
- Auto-deploy on every push

#### Step 3: Configure
Your site will be at: `https://random-name-12345.netlify.app`

Custom domain available in Site settings.

#### Benefits:
- ✅ Free SSL
- ✅ Continuous deployment
- ✅ Form handling
- ✅ Easy custom domains
- ✅ Instant rollback

---

### Option 4: Vercel

Similar to Netlify, optimized for modern web apps.

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
cd /path/to/your/project
vercel
```

Follow prompts to deploy.

#### Step 3: Production Deploy
```bash
vercel --prod
```

#### Benefits:
- ✅ Free SSL
- ✅ Global edge network
- ✅ GitHub integration
- ✅ Preview deployments
- ✅ Analytics

---

### Option 5: Traditional Web Hosting

For shared hosting or VPS.

#### Requirements:
- Web server (Apache, Nginx)
- SSL certificate
- FTP/SSH access

#### Step 1: Upload Files
Upload all project files to web root:
- index.html
- app.js
- firebase-config.js
- utils.js
- products.html
- report.html

#### Step 2: Configure Web Server

**For Apache (.htaccess):**
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Set correct MIME types
AddType application/javascript .js
AddType text/css .css
AddType text/html .html

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

**For Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /path/to/your/app;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Step 3: Test
Visit your domain and verify everything works.

---

## Post-Deployment Steps

### 1. Verify Functionality
- [ ] Login works for all user types
- [ ] Products load correctly
- [ ] Cart operations work (add, remove, quantity change)
- [ ] Search and barcode scan functional
- [ ] Sales complete successfully
- [ ] Receipts print correctly
- [ ] Reports display data
- [ ] PDF/Excel export works
- [ ] Stock updates properly
- [ ] Role restrictions enforced

### 2. Configure Firebase Budget Alerts
1. Go to Firebase Console → Usage and billing
2. Set budget alerts (e.g., $10, $50, $100)
3. Configure email notifications

### 3. Set Up Monitoring
1. Enable Firebase Performance Monitoring
2. Set up uptime monitoring (e.g., UptimeRobot)
3. Configure error tracking
4. Set up Firebase Crashlytics (if using mobile)

### 4. Train Users
- [ ] Admin training on product management
- [ ] Cashier training on POS operations
- [ ] Emergency procedures documented
- [ ] Contact information for support
- [ ] Backup procedures explained

### 5. Create Backup Routine
```bash
# Example: Export Firestore data
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

Set up automated backups:
- Daily: Last 7 days
- Weekly: Last 4 weeks
- Monthly: Last 12 months

---

## Scaling Considerations

### Small Shop (1-2 terminals)
- Firebase Free tier may suffice
- GitHub Pages or Netlify hosting
- Manual backups weekly

### Medium Shop (3-10 terminals)
- Firebase Blaze plan
- Firebase Hosting with CDN
- Automated daily backups
- Consider Firebase Performance Monitoring

### Large Shop (10+ terminals)
- Firebase Blaze plan with quotas
- Multiple Firebase projects (dev/staging/prod)
- Real-time monitoring
- Automated hourly backups
- Consider dedicated Firebase support

---

## Troubleshooting Deployment

### Issue: Firebase functions not working
**Solution**: This app doesn't use Cloud Functions, only client-side code.

### Issue: CORS errors in console
**Solution**: Ensure Firebase config is correct and domain is authorized in Firebase Console.

### Issue: Blank page after deployment
**Solution**:
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check Firebase config is correct
4. Ensure HTTPS is enabled

### Issue: "Permission denied" errors
**Solution**:
1. Verify Firestore security rules are deployed
2. Check user authentication
3. Verify user role in Firestore `users` collection

### Issue: Slow performance
**Solution**:
1. Enable Firebase Performance Monitoring
2. Check network tab for slow requests
3. Optimize images if added
4. Enable CDN/hosting compression
5. Consider adding Firestore indexes

---

## Updating the App

### For Firebase Hosting:
```bash
# Make your changes
git add .
git commit -m "Update description"

# Deploy new version
firebase deploy --only hosting
```

### For GitHub Pages:
```bash
git add .
git commit -m "Update description"
git push origin main
# Updates automatically
```

### Rolling Back (Firebase):
```bash
# View deployment history
firebase hosting:releases

# Rollback to previous version
firebase hosting:rollback
```

---

## Domain Setup (Optional)

### For Custom Domain:

#### 1. Purchase Domain
Buy from any domain registrar (Namecheap, GoDaddy, Google Domains, etc.)

#### 2. Configure DNS

**For Firebase Hosting:**
```
Type  Name    Value
A     @       199.36.158.100
A     @       199.36.158.101
CNAME www     your-app.web.app
```

**For Other Hosting:**
Follow hosting provider's DNS instructions.

#### 3. Add Domain in Hosting Dashboard
- Firebase: Console → Hosting → Add custom domain
- Netlify: Site settings → Domain management
- Vercel: Project settings → Domains

#### 4. Wait for DNS Propagation
Can take up to 48 hours (usually much faster).

#### 5. SSL Certificate
Most hosting providers auto-generate SSL certificates for custom domains.

---

## Production Optimization

### 1. Enable Caching
Configure hosting to cache static assets.

### 2. Compress Files
Enable GZIP/Brotli compression.

### 3. Use CDN
Firebase Hosting and Netlify include CDN automatically.

### 4. Optimize Images
If you add product images later:
- Use WebP format
- Lazy loading
- Responsive images
- Image CDN (Cloudinary, Imgix)

### 5. Monitor Performance
- Google Analytics (add tracking code)
- Firebase Performance Monitoring
- Lighthouse audits regularly

---

## Support & Maintenance

### Regular Tasks:
- **Daily**: Check for errors in Firebase Console
- **Weekly**: Review sales reports for anomalies
- **Monthly**: Backup data, update dependencies
- **Quarterly**: Security review, user access audit

### Emergency Contacts:
- Firebase Support: firebase.google.com/support
- Hosting Provider Support
- Your development team/developer

### Update Policy:
- Security updates: Immediate
- Bug fixes: Within 1 week
- New features: Planned releases

---

## Cost Estimation

### Firebase Costs (Approximate):

**Firestore:**
- Reads: $0.06 per 100K
- Writes: $0.18 per 100K
- Storage: $0.18/GB/month

**Hosting:**
- 10 GB storage: Free
- 360 MB/day bandwidth: Free
- Additional: $0.15/GB

**Authentication:**
- Free for most use cases
- Phone auth: $0.06/verification

**Example Monthly Cost (Small Shop):**
- 50K reads/day = $0.90
- 10K writes/day = $5.40
- Total: ~$6-10/month

Large shops may cost $20-50/month depending on usage.

---

**Need Help?** Open an issue on GitHub or contact support.

Good luck with your deployment! 🚀
