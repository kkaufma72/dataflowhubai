# 🎥 How to Add Your Demo Video to Landing Page

## Quick Steps (After Recording)

### 1. Upload to YouTube
```bash
# 1. Go to: youtube.com/upload
# 2. Upload your video file
# 3. Fill in details:
#    Title: "DataFlowHub AI - Build ML Models Without Code (3-Min Demo)"
#    Description: See DEMO_VIDEO_SCRIPT.md for optimized description
#    Visibility: Public (or Unlisted for testing)
```

### 2. Get Embed URL
```bash
# On your YouTube video page:
# 1. Click "Share" button
# 2. Click "Embed"
# 3. Copy the URL from the iframe src
# Example: https://www.youtube.com/embed/YOUR_VIDEO_ID
```

### 3. Update Landing Page
```typescript
// Open: src/pages/LandingPageLinear.tsx
// Find line ~290 (the VideoHeroDemo component)

// BEFORE:
<VideoHeroDemo
  videoUrl="" // TODO: Add your YouTube embed URL
  ...
/>

// AFTER:
<VideoHeroDemo
  videoUrl="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  thumbnailUrl="/demo-thumbnail.jpg" // Optional: Replace with custom thumbnail
  title="See DataFlowHub Build ML Models in 3 Minutes"
/>
```

### 4. Add Custom Thumbnail (Optional)
```bash
# 1. Create thumbnail image (1280x720px recommended)
# 2. Export as .jpg
# 3. Save to: public/demo-thumbnail.jpg
# 4. Update thumbnailUrl prop in VideoHeroDemo component
```

### 5. Test It
```bash
npm run dev

# Visit: http://localhost:5173
# Click the play button
# Verify video loads and plays
```

---

## Video Settings (Recommended)

### YouTube Upload Settings
- **Title**: "DataFlowHub AI - Build ML Models Without Code (3-Min Demo)"
- **Description**: Full description in DEMO_VIDEO_SCRIPT.md
- **Tags**: automl, machine learning, no code, data science, ai
- **Category**: Science & Technology
- **Visibility**: 
  - Public (for maximum reach)
  - OR Unlisted (if you want to test first)
- **Thumbnail**: Upload custom 1280x720px image
- **End Screen**: Add "Subscribe" and link to dataflowhub.ai
- **Cards**: Add card at 2:40 linking to your site

### Privacy-Enhanced Embed (Recommended)
YouTube embed URLs come in two flavors:

**Standard**: `https://www.youtube.com/embed/VIDEO_ID`
**Privacy-Enhanced**: `https://www.youtube-nocookie.com/embed/VIDEO_ID`

Use privacy-enhanced version for better GDPR compliance.

---

## Embed URL Parameters

You can customize playback with URL parameters:

```typescript
// Basic
videoUrl="https://www.youtube.com/embed/VIDEO_ID"

// Autoplay + Hide Related Videos
videoUrl="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&rel=0"

// All recommended parameters
videoUrl="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&rel=0&modestbranding=1&controls=1"
```

**Parameters**:
- `autoplay=1` - Start playing automatically when clicked
- `rel=0` - Don't show related videos at end
- `modestbranding=1` - Hide YouTube logo
- `controls=1` - Show player controls
- `mute=1` - Start muted (required for autoplay in some browsers)

---

## Custom Thumbnail Guide

### Create Thumbnail in Canva (Free)
1. Go to canva.com
2. Create design → YouTube Thumbnail (1280 x 720 px)
3. Use template or design from scratch

**Design Tips**:
- **Large text** (readable at small size)
- **High contrast** (dark background, bright text)
- **Face on screen** (if you appear in video - increases clicks 30%)
- **3-5 words max** (e.g., "No-Code ML in 3 Minutes")
- **Arrow or visual cue** pointing to play button area
- **Brand colors** (Indigo #4F46E5, Green #10B981)

**Good Examples**:
- Screenshot of quality score: "87/100 Quality Score"
- Screenshot of model accuracy: "94.3% Accuracy Achieved"
- You pointing at screen with text: "3-Minute ML Demo"
- Before/After comparison: "Months → Minutes"

### Save & Upload
```bash
# 1. Export from Canva as JPG (high quality)
# 2. Rename to: demo-thumbnail.jpg
# 3. Copy to: public/demo-thumbnail.jpg
# 4. Component will use it automatically
```

---

## Alternative: Use Video Hosting (Not YouTube)

If you don't want to use YouTube:

### Option 1: Host on Vercel (Same place as your app)
```bash
# 1. Add video file to: public/videos/demo.mp4
# 2. Update component:
<VideoHeroDemo
  videoUrl="/videos/demo.mp4"
  ...
/>
```

**Pros**: Full control, no YouTube branding
**Cons**: Large file size (50-100MB), slower load times

### Option 2: Vimeo (Professional)
```bash
# 1. Upload to vimeo.com (free tier available)
# 2. Get embed URL
# 3. Update component with Vimeo URL
```

**Pros**: No ads, professional appearance
**Cons**: Upload limits on free tier, paid for better features

### Option 3: Wistia (Marketing-Focused)
**Pros**: Best analytics, email capture gates, heatmaps
**Cons**: Expensive ($99+/month)

---

## Troubleshooting

### "Video won't load"
- Check YouTube URL is correct
- Ensure video is Public or Unlisted (not Private)
- Try privacy-enhanced URL: `youtube-nocookie.com`

### "Thumbnail doesn't show"
- Verify file is in `public/demo-thumbnail.jpg`
- Check file name matches exactly (case-sensitive)
- Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### "Video quality looks bad"
- Upload 1080p (Full HD) to YouTube
- YouTube processes HD versions (takes 10-30 min after upload)
- Check YouTube Studio → Video details → Quality

### "Play button doesn't work"
- Check browser console for errors (F12)
- Verify component syntax is correct
- Try clearing browser cache

---

## Analytics & Tracking

### YouTube Analytics (Built-in)
Access in YouTube Studio:
- **Views**: Total plays
- **Watch time**: How long people watch
- **Audience retention**: Where people drop off
- **Traffic sources**: Where views come from
- **Click-through rate**: Thumbnail effectiveness

### Google Analytics (Track Landing Page Impact)
Add event tracking:
```typescript
// When video plays
gtag('event', 'video_play', {
  'video_title': 'DataFlowHub Demo',
  'video_location': 'landing_page_hero'
});

// Track completion
gtag('event', 'video_complete', {
  'video_title': 'DataFlowHub Demo'
});
```

### Key Metrics to Monitor
- **Play rate**: % of visitors who click play (target: 20-30%)
- **Completion rate**: % who watch entire video (target: 50%+)
- **Sign-ups after watching**: Track if video → conversion goes up
- **Bounce rate**: Should decrease with engaging video

---

## Optimization Tips

### Week 1
- Upload video with basic title/description
- Test on desktop + mobile
- Share with 5 friends for feedback

### Week 2
- Analyze first 100 views in YouTube Studio
- Note where people drop off
- Consider re-recording weak sections

### Week 3
- A/B test thumbnails (create 3 versions, see which performs best)
- Update title if not getting clicks
- Add cards/end screens to drive traffic

### Month 2
- Create shorter version (30-60 seconds) for social media
- Extract key moments as GIFs for tweets/LinkedIn
- Use testimonials from video as social proof

---

## Next Steps After Video is Live

1. **Share on social media**:
   - LinkedIn: "Just launched our product demo video"
   - Twitter: "See how we built ML models in 3 minutes"
   - Reddit: r/datascience, r/MachineLearning (read rules first)

2. **Email existing users**:
   - "New! Watch DataFlowHub in action"
   - Include video link in newsletter

3. **Add to email signature**:
   - "See DataFlowHub Demo (3 min) →" 

4. **Embed on other pages**:
   - Documentation page
   - Pricing page
   - Blog posts

5. **Create short clips**:
   - 30-sec version for Instagram/TikTok
   - 60-sec version for LinkedIn
   - GIFs for tweets

---

## Recording Checklist Reminder

Before you hit record:
- [ ] Script printed and rehearsed 3x
- [ ] Loom/OBS installed and tested
- [ ] Sample CSV file ready
- [ ] Notifications off (Do Not Disturb)
- [ ] Microphone tested (clear audio!)
- [ ] Screen clean (hide bookmarks, extensions)
- [ ] Glass of water nearby
- [ ] Good lighting (if showing face)
- [ ] Quiet room (turn off AC/fans)

---

**Time to Record**: 1-2 hours from setup to published
**Time to Add to Site**: 5 minutes after upload
**Expected Impact**: 20-40% increase in sign-up conversion

🎬 **Ready? Go record your demo!**

Questions? Ask your Marketing Agent Bot (me)! 🤖
