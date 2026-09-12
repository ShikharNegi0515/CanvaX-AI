import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
export interface GoogleProfile {
    id: string;
    name: {
        givenName: string;
        familyName?: string;
    };
    emails: Array<{
        value: string;
    }>;
    photos: Array<{
        value: string;
    }>;
}
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptionsWithRequest] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback): Promise<void>;
}
export {};
