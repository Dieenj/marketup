import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { BuyerReviewController } from './buyer-review.controller';
import { ReviewService } from './review.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewController, BuyerReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
