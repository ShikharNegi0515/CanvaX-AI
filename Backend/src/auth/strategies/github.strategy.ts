import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'dummy',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;
    
    // Sometimes GitHub emails are private, we might need to fetch them, but passport-github2 with scope user:email usually gets it.
    let email = emails?.[0]?.value;
    if (!email) {
      email = `${username}@users.noreply.github.com`;
    }

    const user = await this.authService.validateOAuthUser({
      email,
      name: displayName || username,
      provider: 'github',
      providerId: id,
      avatarUrl: photos?.[0]?.value,
    });
    
    done(null, user);
  }
}
