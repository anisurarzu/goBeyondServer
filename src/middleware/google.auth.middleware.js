const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('../db');

// Only configure Google OAuth Strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails && emails[0] ? emails[0].value : null;
        const image = photos && photos[0] ? photos[0].value : null;
        
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Split display name into first and last name
        const nameParts = displayName ? displayName.split(' ') : [];
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;

        // Check if user exists by Google ID
        let user = await prisma.user.findUnique({
          where: { googleId: id }
        });

        if (user) {
          // Update last active
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActive: new Date() }
          });
          return done(null, user);
        }

        // Check if user exists by email
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (user) {
          // Link Google account to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: id,
              image: image || user.image,
              lastActive: new Date()
            }
          });
          return done(null, user);
        }

        // Create new user with Google account
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            googleId: id,
            name: displayName,
            firstName: firstName,
            lastName: lastName,
            image: image,
            lastActive: new Date()
          }
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
  );
} else {
  console.warn('⚠️  Google OAuth credentials not found. Google authentication will be disabled.');
  console.warn('   Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file to enable Google OAuth.');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
