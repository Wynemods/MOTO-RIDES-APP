import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to MotoLink API - Motorcycle Ride Hailing for Chuka University';
  }
}
